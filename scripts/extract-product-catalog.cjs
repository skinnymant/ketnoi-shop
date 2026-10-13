// Read seed literals without executing its destructive database operations.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../api/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const source = ts.createSourceFile('seed.ts', fs.readFileSync(path.join(root, 'api/prisma/seed.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text.replaceAll('_', ''));
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => [p.name.text, literal(p.initializer)]));
  throw new Error(`Unsupported literal: ${node.getText(source)}`);
}
let products;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'SAN_PHAM') products = literal(node.initializer);
  ts.forEachChild(node, visit);
}
visit(source);
if (!products) throw new Error('SAN_PHAM not found');
const slugify = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const slugs = new Set(), skus = new Set();
const catalog = products.map((p, i) => {
  const model = p.thongSo.find(([key]) => key === 'Model')?.[1];
  let slug = slugify(p.ten);
  if (slugs.has(slug) && model) slug = slugify(`${p.ten} ${model}`);
  const base = slug;
  for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
  slugs.add(slug);
  let sku = model ?? `SWE-${slug.split('-').map(s=>s[0]).join('').toUpperCase()}-${i+1}`;
  if (skus.has(sku)) sku = `${sku}-${i+1}`;
  skus.add(sku);
  return {index:i+1, sku, model, name:p.ten, brand:p.thuongHieu, slug, specs:p.thongSo};
});
fs.mkdirSync(path.join(root,'docs/product-images'), {recursive:true});
fs.writeFileSync(path.join(root,'docs/product-images/catalog.json'), JSON.stringify(catalog,null,2)+'\n');
console.log(catalog.map(p=>`${p.index}. ${p.sku} | ${p.brand} | ${p.name}`).join('\n'));
