// Diagnose or restart the existing SWE Docker stack without creating containers,
// replacing configuration, invoking migration/seed commands, or removing volumes.
// A restart runs the existing container's original startup command.
// Requires Node.js >= 18 and Docker Compose on the actual backend machine.
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const STACKS = Object.freeze({
  'docker-compose.laptop.yml': ['postgres', 'minio', 'api', 'cloudflared'],
  'docker-compose.prod.yml': ['postgres', 'redis', 'minio', 'api', 'caddy'],
});
const INSPECT_FORMAT = '{"id":{{json .Id}},"name":{{json .Name}},"state":{{json .State.Status}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}"none"{{end}},"project":{{json (index .Config.Labels "com.docker.compose.project")}},"directory":{{json (index .Config.Labels "com.docker.compose.project.working_dir")}},"service":{{json (index .Config.Labels "com.docker.compose.service")}},"mounts":[{{range $index,$mount := .Mounts}}{{if $index}},{{end}}{"type":{{json .Type}},"destination":{{json .Destination}},"name":{{json .Name}}}{{end}}]}';
const API_HEALTH_CODE = "fetch('http://127.0.0.1:4000/health',{signal:AbortSignal.timeout(8000)}).then(async r=>{const b=await r.json();process.exit(r.ok&&b.status==='ok'&&b.database==='connected'?0:1)}).catch(()=>process.exit(1))";
const PG_READY_CODE = 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"';

function docker(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 20000, windowsHide: true });
  return { status: result.error ? 1 : result.status, stdout: result.stdout || '' };
}
function need(result, message) {
  if (result.status !== 0) throw new Error(message);
  return result.stdout.trim();
}
function normalizedDirectory(value) {
  const directory = path.resolve(value).replace(/\\/g, '/').replace(/\/$/, '');
  return process.platform === 'win32' ? directory.toLowerCase() : directory;
}

async function inspectExistingStack({ root, composeFile, run = docker }) {
  const services = STACKS[composeFile];
  if (!services) throw new Error('Choose docker-compose.laptop.yml or docker-compose.prod.yml.');
  need(run(['info', '--format', '{{.ServerVersion}}']), 'Docker is unavailable. Run this on the existing backend machine.');
  const composeArgs = ['compose', '--project-directory', root, '-f', path.join(root, composeFile)];
  const containers = {};
  let project;
  for (const service of services) {
    const ids = need(run([...composeArgs, 'ps', '-a', '-q', service]), `Cannot inspect ${service}.`).split(/\s+/).filter(Boolean);
    if (ids.length !== 1) throw new Error(`Expected one existing ${service} container; found ${ids.length}. No containers will be created.`);
    let container;
    try { container = JSON.parse(need(run(['inspect', '--format', INSPECT_FORMAT, ids[0]]), `Cannot inspect ${service}.`)); }
    catch { throw new Error(`Cannot read safe metadata for ${service}.`); }
    if (container.service !== service || !container.project || !container.directory || normalizedDirectory(container.directory) !== normalizedDirectory(root)) {
      throw new Error(`Refusing ${service}: its Compose labels do not match this checkout.`);
    }
    if (project && project !== container.project) throw new Error('Containers belong to different Compose projects.');
    project = container.project;
    if (!['running', 'exited', 'created', 'restarting'].includes(container.state)) throw new Error(`Unsupported state for ${service}: ${container.state}.`);
    containers[service] = container;
  }
  for (const [service, destination] of [['postgres', '/var/lib/postgresql/data'], ['minio', '/data']]) {
    const mount = containers[service].mounts.find((item) => item.destination === destination);
    if (!mount || mount.type !== 'volume' || !mount.name) throw new Error(`Refusing recovery: ${service} is missing its existing named data volume.`);
    const volume = need(run(['volume', 'inspect', '--format', '{{.Name}}', mount.name]), `Existing ${service} volume cannot be found.`);
    if (volume !== mount.name) throw new Error(`Unexpected volume for ${service}.`);
  }
  return { project, containers, services };
}

async function restartExistingServices(stack, selected, { run = docker, pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 18 } = {}) {
  if (!selected.length || new Set(selected).size !== selected.length || selected.some((service) => !stack.services.includes(service))) {
    throw new Error('Choose each existing service at most once.');
  }
  // Dependency order is fixed even when the operator supplies a different order.
  for (const service of stack.services.filter((item) => selected.includes(item))) {
    if (service === 'api') {
      const postgres = stack.containers.postgres;
      need(run(['exec', postgres.id, 'sh', '-c', PG_READY_CODE]), 'PostgreSQL is not ready. Diagnose it before restarting the API.');
      if (!selected.includes('minio') && stack.containers.minio.state !== 'running') throw new Error('MinIO is stopped. Restart it first.');
    }
    if (service === 'cloudflared' || service === 'caddy') {
      need(run(['exec', stack.containers.api.id, 'node', '-e', API_HEALTH_CODE]), 'API health is not ready. The public connector will not be restarted.');
    }
    const container = stack.containers[service];
    const action = container.state === 'exited' || container.state === 'created' ? 'start' : 'restart';
    need(run([action, container.id]), `Cannot ${action} the existing ${service} container.`);
    if (service === 'postgres' || service === 'api') {
      const probeArgs = service === 'postgres'
        ? ['exec', container.id, 'sh', '-c', PG_READY_CODE]
        : ['exec', container.id, 'node', '-e', API_HEALTH_CODE];
      let ready = false;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (run(probeArgs).status === 0) { ready = true; break; }
        if (attempt + 1 < attempts) await pause(5000);
      }
      if (!ready) throw new Error(`${service} is not healthy after recovery. Later services were not restarted.`);
    }
  }
}

async function checkPublicHealth(url, request = fetch) {
  try {
    const response = await request(`${url.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
    const body = await response.text();
    let data;
    try { data = JSON.parse(body); } catch { /* An error page is summarized without exposing its contents. */ }
    return { status: response.status, healthy: response.ok && data?.status === 'ok' && data?.database === 'connected', tunnel1033: response.status === 530 && /1033/.test(body) };
  } catch { return { status: 0, healthy: false, tunnel1033: false }; }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/recover-existing-backend.cjs [--compose=docker-compose.laptop.yml] [--restart-services=api,cloudflared]');
    console.log('Default is read-only. Restart mode requires all original containers and named data volumes.');
    return;
  }
  if (args.some((arg) => !arg.startsWith('--compose=') && !arg.startsWith('--restart-services='))) throw new Error('Unknown argument. Use --help.');
  if (args.filter((arg) => arg.startsWith('--compose=')).length > 1 || args.filter((arg) => arg.startsWith('--restart-services=')).length > 1) throw new Error('Duplicate arguments.');
  const root = path.resolve(__dirname, '..');
  const composeFile = args.find((arg) => arg.startsWith('--compose='))?.slice('--compose='.length) || 'docker-compose.laptop.yml';
  const selectedArgument = args.find((arg) => arg.startsWith('--restart-services='));
  const stack = await inspectExistingStack({ root, composeFile });
  console.log(`Existing Compose project: ${stack.project}`);
  console.table(Object.values(stack.containers).map(({ service, state, health }) => ({ service, state, health })));
  if (selectedArgument) {
    const selected = selectedArgument.slice('--restart-services='.length).split(',').filter(Boolean);
    await restartExistingServices(stack, selected);
    console.log(`Restarted existing services: ${selected.join(', ')}. Data volumes and configuration were retained.`);
  } else console.log('Read-only inspection. No services changed.');
  const result = await checkPublicHealth('https://api.swevietnam.com');
  console.log(`Public API HTTP: ${result.status || 'unreachable'}; verified database connection: ${result.healthy ? 'yes' : 'no'}.`);
  if (result.tunnel1033) console.log('Cloudflare 1033: no healthy connector is receiving traffic. Inspect the connector on this backend machine.');
  if (!result.healthy) process.exitCode = 1;
}

module.exports = { inspectExistingStack, restartExistingServices, checkPublicHealth };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
