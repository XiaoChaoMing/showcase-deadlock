// So ảnh snapshots/<set>/*.png với tests/visual/baseline/<set>/*.png.
//   node scripts/visual-compare.mjs <set> [--accept] [--only tên1,tên2]
// Một ảnh "lệch" khi tỷ lệ điểm ảnh có kênh màu lệch > 8/255 vượt 0.5%. Có ảnh lệch hoặc thiếu ảnh → exit 1.
// --accept: chép ảnh mới vào baseline (không so).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const CHANNEL_TOLERANCE = 8;
const MAX_RATIO = 0.005;

const args = process.argv.slice(2);
const set = args.find((a) => !a.startsWith('--'));
const accept = args.includes('--accept');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? new Set(args[onlyIndex + 1].split(',')) : null;
if (!set) {
  console.error('Cách dùng: node scripts/visual-compare.mjs <set> [--accept] [--only tên1,tên2]');
  process.exit(1);
}

const currentDir = path.resolve('snapshots', set);
const baselineDir = path.resolve('tests/visual/baseline', set);
const pick = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.png') && (!only || only.has(f.slice(0, -4)))).sort() : [];

if (accept) {
  fs.mkdirSync(baselineDir, { recursive: true });
  const files = pick(currentDir);
  for (const f of files) fs.copyFileSync(path.join(currentDir, f), path.join(baselineDir, f));
  console.log(`Đã chấp nhận ${files.length} ảnh vào ${path.relative(process.cwd(), baselineDir)}`);
  process.exit(files.length ? 0 : 1);
}

const names = [...new Set([...pick(currentDir), ...pick(baselineDir)])];
const browser = await chromium.launch();
let failed = 0;
try {
  const page = await browser.newPage();
  for (const name of names) {
    const a = path.join(baselineDir, name);
    const b = path.join(currentDir, name);
    if (!fs.existsSync(a) || !fs.existsSync(b)) {
      console.log(`✗ ${name}: thiếu ${fs.existsSync(a) ? 'ảnh mới' : 'ảnh baseline'}`);
      failed += 1;
      continue;
    }
    const result = await page.evaluate(
      async ({ a64, b64, tol }) => {
        const load = async (src) => {
          const img = new Image();
          img.src = `data:image/png;base64,${src}`;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return ctx.getImageData(0, 0, img.width, img.height);
        };
        const [x, y] = [await load(a64), await load(b64)];
        if (x.width !== y.width || x.height !== y.height) return { sizeMismatch: `${x.width}×${x.height} → ${y.width}×${y.height}` };
        let diff = 0;
        for (let i = 0; i < x.data.length; i += 4) {
          if (
            Math.abs(x.data[i] - y.data[i]) > tol ||
            Math.abs(x.data[i + 1] - y.data[i + 1]) > tol ||
            Math.abs(x.data[i + 2] - y.data[i + 2]) > tol
          )
            diff += 1;
        }
        return { ratio: diff / (x.width * x.height) };
      },
      { a64: fs.readFileSync(a).toString('base64'), b64: fs.readFileSync(b).toString('base64'), tol: CHANNEL_TOLERANCE },
    );
    if (result.sizeMismatch) {
      console.log(`✗ ${name}: khác kích thước ${result.sizeMismatch}`);
      failed += 1;
      continue;
    }
    const bad = result.ratio > MAX_RATIO;
    if (bad) failed += 1;
    console.log(`${bad ? '✗' : '✓'} ${name}: lệch ${(result.ratio * 100).toFixed(2)}%`);
  }
} finally {
  await browser.close();
}
console.log(failed ? `${failed}/${names.length} ảnh lệch hoặc thiếu` : `Tất cả ${names.length} ảnh khớp baseline`);
process.exit(failed ? 1 : 0);
