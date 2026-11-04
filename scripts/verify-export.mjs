// Kiểm tra nút "Xuất GLB" trong trình duyệt thật: node scripts/verify-export.mjs [heroId]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const hero = process.argv[2] ?? 'kestrel';
const server = await createServer({ server: { port: 5180, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:5180/?hero=${hero}&stage=full&pose=idle`);
  await page.waitForFunction(() => window.__heroReady === true, null, { timeout: 30000 });
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByText('Xuất GLB + kiểm tra').click()]);
  const out = path.resolve('snapshots', 'm6', download.suggestedFilename());
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await download.saveAs(out);
  await page.waitForFunction(() => window.__exportResult !== undefined, null, { timeout: 30000 });
  const result = await page.evaluate(() => window.__exportResult);
  await page.screenshot({ path: path.resolve('snapshots', 'm6', `${hero}-export-panel.png`) });
  console.log(JSON.stringify({ file: out, size: fs.statSync(out).size, ...result }));
  if (result.diffs.length) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
