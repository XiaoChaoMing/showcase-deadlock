// Chỉ chạy trong node (qua scripts/heroes.mjs → runnerImport của Vite).
import fs from 'node:fs';
import path from 'node:path';
import type { HeroDefinition } from '../definitions/HeroDefinition';
import { validateHero } from '../definitions/validateHero';
import { benchMarkdown, runBench } from './bench';

const readHeroes = (heroesDir: string): { id: string; raw: unknown }[] =>
  fs
    .readdirSync(heroesDir)
    .sort()
    .filter((d) => fs.existsSync(path.join(heroesDir, d, 'hero.json')))
    .map((d) => ({ id: d, raw: JSON.parse(fs.readFileSync(path.join(heroesDir, d, 'hero.json'), 'utf8')) as unknown }));

/** Bảng markdown số đo hiệu năng của mọi hero hợp lệ trong thư mục. */
export const runBenchCommand = (heroesDir: string, runs = 5): string => {
  const heroes: HeroDefinition[] = [];
  const skipped: string[] = [];
  for (const { id, raw } of readHeroes(heroesDir)) {
    const r = validateHero(raw);
    if (r.ok) heroes.push(r.hero);
    else skipped.push(id);
  }
  const notes = skipped.length ? `\n\nBỏ qua (không hợp lệ): ${skipped.join(', ')}` : '';
  return benchMarkdown(runBench(heroes, runs)) + notes;
};
