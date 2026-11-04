// Chụp ảnh duyệt cho một milestone: node scripts/snapshot.mjs <milestone>
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const milestone = process.argv[2];
const config = JSON.parse(fs.readFileSync(new URL('./shots.config.json', import.meta.url), 'utf8'));
const shots = config[milestone];
if (!shots) {
  console.error(`Không có cấu hình ảnh cho "${milestone}". Có: ${Object.keys(config).join(', ')}`);
  process.exit(1);
}

const outDir = path.resolve('snapshots', milestone);
fs.mkdirSync(outDir, { recursive: true });
const server = await createServer({ server: { port: 5179, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: shot.viewport ?? { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`http://localhost:5179/?${shot.query}`);
    await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 30000 });
    const file = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: file });
    console.log(`${errors.length ? '⚠' : '✓'} ${file}${errors.length ? `  lỗi: ${errors.join(' | ')}` : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
