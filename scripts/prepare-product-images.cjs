// Rebuild local WebP assets from reviewed sources. Never connects to the database.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('../ketnoi-shop/web/node_modules/sharp');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'ketnoi-shop/web/public');
const docsDir = path.join(root, 'docs/product-images');
const sourceFiles = ['sources-01-18.json', 'sources-19-36.json', 'sources-37-54.json'];
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function main() {
  const catalog = JSON.parse(await fs.readFile(path.join(docsDir, 'catalog.json'), 'utf8'));
  // --from-research imports the three research batches. Normal runs use the
  // consolidated, reviewed source list committed alongside the images.
  const fromResearch = process.argv.includes('--from-research');
  const sources = fromResearch
    ? (await Promise.all(sourceFiles.map(async file => JSON.parse(await fs.readFile(path.join(docsDir,file),'utf8'))))).flat()
    : JSON.parse(await fs.readFile(path.join(docsDir,'sources.json'),'utf8'));
  const bySku = new Map(sources.map(entry => [entry.sku, entry]));
  if (bySku.size !== catalog.length || sources.length !== catalog.length) throw new Error('Expected one source record per catalog product');
  const images = {};
  const audited = [];
  for (const product of catalog) {
    const source = bySku.get(product.sku);
    if (!source) throw new Error(`Missing source record: ${product.sku}`);
    if (source.status !== 'matched') {
      audited.push({...source, index:product.index});
      continue;
    }
    if (!source.sourcePage || !source.imageUrl || !source.localPath?.startsWith('/products/')) throw new Error(`Missing provenance: ${product.sku}`);
    const originalPath = path.resolve(publicDir, '.' + source.localPath);
    const productsDir = path.resolve(publicDir, 'products') + path.sep;
    if (!originalPath.startsWith(productsDir)) throw new Error('Image outside products directory');
    let original;
    if (fromResearch) {
      original = await fs.readFile(originalPath);
    } else {
      const response = await fetch(source.imageUrl, {signal:AbortSignal.timeout(30000)});
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Image download failed: ${product.sku}`);
      original = Buffer.from(await response.arrayBuffer());
    }
    const metadata = await sharp(original).metadata();
    if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 150) throw new Error(`Image too small: ${product.sku}`);
    // Keep the entire source composition, including branding. No crop or upscaling.
    const buffer = await sharp(original).rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer();
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const basename = product.sku.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const url = `/products/${basename}-${sha256.slice(0,10)}.webp`;
    await fs.writeFile(path.join(publicDir, url.slice(1)), buffer);
    const outputMetadata = await sharp(buffer).metadata();
    images[product.sku.trim().toUpperCase()] = {url, alt:source.alt || product.name};
    audited.push({...source,index:product.index,localPath:url,width:outputMetadata.width,height:outputMetadata.height,bytes:buffer.length,sha256});
  }
  await fs.writeFile(path.join(root,'ketnoi-shop/web/lib/catalog-product-images.json'), JSON.stringify(images,null,2)+'\n');
  await fs.writeFile(path.join(docsDir,'sources.json'), JSON.stringify(audited,null,2)+'\n');
  const count = Object.keys(images).length;
  const cards = audited.map(p => `<article><div class="photo">${p.status==='matched'?`<img loading="lazy" src="../../ketnoi-shop/web/public${escapeHtml(p.localPath)}" alt="${escapeHtml(p.name)}">`:'<span>Chưa xác minh ảnh đúng model</span>'}</div><h2>${escapeHtml(p.sku)}</h2><p>${escapeHtml(p.name)}</p><p class="note">${escapeHtml(p.note)}</p>${p.sourcePage?`<a href="${escapeHtml(p.sourcePage)}" target="_blank" rel="noreferrer">Nguồn ảnh ↗</a>`:''}</article>`).join('\n');
  await fs.writeFile(path.join(docsDir,'review.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ảnh sản phẩm SWE — đối chiếu model</title><style>*{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#172a38;font:15px/1.5 system-ui,sans-serif}header{padding:36px;max-width:1450px;margin:auto}h1{margin:0;font-size:32px}header p{color:#475569}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:1450px;margin:auto;padding:0 36px 36px}article{background:white;border:1px solid #dbe3e9;border-radius:12px;padding:16px}.photo{height:235px;display:flex;align-items:center;justify-content:center;background:#fff}.photo img{max-width:100%;max-height:100%;object-fit:contain}h2{font-size:17px;color:#0f766e;margin:14px 0 8px}p{margin:6px 0}.note{font-size:12px;color:#64748b}a{color:#0f766e}span{color:#9a3412}</style><header><h1>Ảnh sản phẩm SWE</h1><p>Đã đối chiếu ${count}/${catalog.length} mã trong danh mục mã nguồn. Mỗi ảnh có đường dẫn nguồn. Đây là bản duyệt ảnh, không phản ánh giá hoặc tồn kho trực tiếp.</p></header><div class="grid">${cards}</div></html>`);
  console.log(JSON.stringify({matched:count,unresolved:audited.filter(p=>p.status!=='matched').map(p=>p.sku),totalBytes:audited.reduce((sum,p)=>sum+(p.bytes??0),0)},null,2));
}
main().catch(error => { console.error(error); process.exitCode=1; });
