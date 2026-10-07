const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('../ketnoi-shop/web/node_modules/typescript');
const sharp = require('../ketnoi-shop/web/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const modulePath = path.join(root,'ketnoi-shop/web/lib/product-images.ts');
const code = ts.transpileModule(fs.readFileSync(modulePath,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const runtime = {exports:{},require:createRequire(modulePath),URL};
vm.runInNewContext(code,runtime,{filename:modulePath});
const { withProductImages } = runtime.exports;
const sources = require('../docs/product-images/sources.json');
const manifest = require('../ketnoi-shop/web/lib/catalog-product-images.json');
const matched = sources.filter(p=>p.status==='matched');

async function main() {
  assert.ok(matched.length > 0, 'No verified catalog images');
  assert.equal(Object.keys(manifest).length, matched.length);
  const first = matched[0];
  const product = {sku:first.sku,name:first.name,images:[{url:'https://placehold.co/800x800/png?text=MODEL'},{url:'https://placehold.co/800x800/png?text=MODEL-2'}],price:'123',inventory:[{quantity:7}]};
  const replaced = withProductImages(product);
  assert.equal(replaced.images.length,1);
  assert.equal(replaced.images[0].url,first.localPath);
  assert.equal(replaced.images[0].alt,product.name);
  assert.equal(replaced.price,product.price);
  assert.equal(replaced.inventory,product.inventory);
  assert.equal(product.images.length,2,'Do not mutate the API response');
  assert.equal(withProductImages({...product,images:[]}).images[0].url,first.localPath);
  const custom = {url:'https://media.swevietnam.com/uploads/custom.jpg',alt:'Ảnh tự chụp'};
  const preserved = withProductImages({...product,images:[product.images[0],custom]});
  assert.equal(preserved.images.length,1);
  assert.equal(preserved.images[0],custom,'Keep existing real photos');
  const local = {url:'/products/custom.webp'};
  assert.equal(withProductImages({...product,images:[local]}).images[0],local);
  const unknown = {...product,sku:'UNKNOWN-MODEL'};
  assert.equal(withProductImages(unknown),unknown,'Never guess an unknown SKU');
  const deceptive = {url:'https://placehold.co.example.org/photo.jpg'};
  assert.equal(withProductImages({...product,images:[deceptive]}).images[0],deceptive);
  assert.equal(withProductImages({...product,sku:` ${first.sku.toLowerCase()} `}).images[0].url,first.localPath);
  for (const entry of matched) {
    const key = entry.sku.trim().toUpperCase();
    assert.equal(manifest[key].url,entry.localPath);
    assert.ok(entry.sourcePage.startsWith('https://') || entry.sourcePage.startsWith('http://'));
    const data = fs.readFileSync(path.join(root,'ketnoi-shop/web/public',entry.localPath.slice(1)));
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),entry.sha256);
    const meta = await sharp(data).metadata();
    assert.equal(meta.format,'webp');
    assert.equal(meta.width,entry.width);
    assert.equal(meta.height,entry.height);
  }
  for (const entry of sources.filter(p=>p.status!=='matched')) assert.equal(manifest[entry.sku.trim().toUpperCase()],undefined);
  console.log(`PASS: ${matched.length} image files, source records, placeholder replacement, custom-photo preservation, unknown-model handling and unchanged product data.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
