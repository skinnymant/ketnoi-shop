const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { inspectExistingStack, restartExistingServices, checkPublicHealth } = require('./recover-existing-backend.cjs');

function fixture() {
  const root = path.resolve(__dirname, '..');
  const services = ['postgres', 'minio', 'api', 'cloudflared'];
  const calls = [];
  const containers = Object.fromEntries(services.map((service) => [service, {
    id: `id-${service}`, service, name: `/swe-${service}`, state: 'running', health: 'healthy', project: 'swe', directory: root,
    mounts: service === 'postgres' ? [{ type: 'volume', destination: '/var/lib/postgresql/data', name: 'swe_postgres_data' }]
      : service === 'minio' ? [{ type: 'volume', destination: '/data', name: 'swe_minio_data' }] : [],
  }]));
  const state = { containers, calls, missing: null, lostVolume: false, databaseReady: true, apiReady: true };
  const run = (args) => {
    calls.push(args);
    const ok = (stdout = '') => ({ status: 0, stdout });
    if (args[0] === 'info') return ok('28.0');
    if (args[0] === 'compose') { const service = args.at(-1); return ok(service === state.missing ? '' : containers[service].id); }
    if (args[0] === 'inspect') return ok(JSON.stringify(Object.values(containers).find((container) => container.id === args.at(-1))));
    if (args[0] === 'volume') return state.lostVolume ? { status: 1, stdout: '' } : ok(args.at(-1));
    if (args[0] === 'exec') return { status: args[1] === 'id-postgres' ? (state.databaseReady ? 0 : 1) : (state.apiReady ? 0 : 1), stdout: '' };
    if (args[0] === 'start' || args[0] === 'restart') return ok();
    throw new Error(`Unexpected Docker action: ${args[0]}`);
  };
  return { root, run, state };
}
const writes = (calls) => calls.filter((args) => ['start', 'restart', 'up', 'run', 'rm'].includes(args[0]));

test('read-only inspection verifies original data volumes without any mutation or environment dump', async () => {
  const { root, run, state } = fixture();
  const stack = await inspectExistingStack({ root, composeFile: 'docker-compose.laptop.yml', run });
  assert.equal(stack.project, 'swe');
  assert.deepEqual(writes(state.calls), []);
  assert.equal(state.calls.filter((args) => args[0] === 'volume').length, 2);
  assert.ok(state.calls.filter((args) => args[0] === 'inspect').every((args) => !args.join(' ').includes('.Config.Env')));
});

test('missing containers, wrong checkout, foreign service/project, or lost data volume refuse recovery', async () => {
  const cases = [
    (state) => { state.missing = 'postgres'; },
    (state) => { state.containers.api.directory = path.resolve('/another-checkout'); },
    (state) => { state.containers.api.service = 'foreign-api'; },
    (state) => { state.containers.api.project = 'another-project'; },
    (state) => { state.containers.postgres.mounts = []; },
    (state) => { state.lostVolume = true; },
  ];
  for (const change of cases) {
    const { root, run, state } = fixture(); change(state);
    await assert.rejects(inspectExistingStack({ root, composeFile: 'docker-compose.laptop.yml', run }));
    assert.deepEqual(writes(state.calls), []);
  }
});

test('restart operates on existing IDs in dependency order, and starts stopped containers without recreating', async () => {
  const { root, run, state } = fixture();
  state.containers.api.state = 'exited';
  const stack = await inspectExistingStack({ root, composeFile: 'docker-compose.laptop.yml', run });
  await restartExistingServices(stack, ['cloudflared', 'api'], { run, pause: async () => {} });
  assert.deepEqual(writes(state.calls), [['start', 'id-api'], ['restart', 'id-cloudflared']]);
});

test('unready database stops API/connector changes; unready API stops connector changes', async () => {
  for (const databaseReady of [false, true]) {
    const { root, run, state } = fixture();
    state.databaseReady = databaseReady;
    state.apiReady = false;
    const stack = await inspectExistingStack({ root, composeFile: 'docker-compose.laptop.yml', run });
    await assert.rejects(restartExistingServices(stack, ['api', 'cloudflared'], { run, attempts: 2, pause: async () => {} }));
    assert.deepEqual(writes(state.calls), databaseReady ? [['restart', 'id-api']] : []);
  }
});

test('unknown or duplicate service requests cannot mutate anything', async () => {
  const { root, run, state } = fixture();
  const stack = await inspectExistingStack({ root, composeFile: 'docker-compose.laptop.yml', run });
  for (const services of [[], ['foreign'], ['api', 'api']]) await assert.rejects(restartExistingServices(stack, services, { run }));
  assert.deepEqual(writes(state.calls), []);
});

test('public health requires the SWE health contract, summarizes 1033, and handles network errors', async () => {
  const response = (status, body) => async () => ({ status, ok: status === 200, text: async () => body });
  assert.equal((await checkPublicHealth('https://api.swevietnam.com', response(200, '{"status":"ok","database":"connected"}'))).healthy, true);
  assert.equal((await checkPublicHealth('https://api.swevietnam.com', response(200, '{"ok":true}'))).healthy, false);
  assert.equal((await checkPublicHealth('https://api.swevietnam.com', response(530, 'Cloudflare error 1033'))).tunnel1033, true);
  assert.deepEqual(await checkPublicHealth('https://api.swevietnam.com', async () => { throw new Error('Network failure'); }), { status: 0, healthy: false, tunnel1033: false });
});
