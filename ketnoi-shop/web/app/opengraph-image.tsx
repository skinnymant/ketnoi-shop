import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'SWE Việt Nam — Dụng cụ và thiết bị công nghiệp';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/brand/swe-logo.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#f0fdfa',
          color: '#134e4a',
          padding: '70px 76px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* ImageResponse embeds this local asset directly; no network dependency. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={128} height={128} alt="SWE" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 700 }}>
              SWE Việt Nam
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: '#0f766e' }}>
              www.swevietnam.com
            </div>
          </div>
        </div>
        <div
          style={{ display: 'flex', marginTop: 48, fontSize: 56, fontWeight: 700, lineHeight: 1.18 }}
        >
          Dụng cụ &amp; thiết bị công nghiệp
        </div>
        <div style={{ display: 'flex', marginTop: 22, fontSize: 29, color: '#334155' }}>
          Tư vấn đúng model · Bảo hành theo sản phẩm · Giao toàn quốc
        </div>
        <div style={{ display: 'flex', marginTop: 32, fontSize: 26, color: '#0f766e' }}>
          Hotline 0865 457 498
        </div>
      </div>
    ),
    size,
  );
}
