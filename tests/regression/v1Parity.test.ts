import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import type { HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { fingerprintCharacter, type HeroFingerprint } from '../helpers/fingerprint';
import { heroWithPreset, PRESET_NAMES } from '../helpers/heroes';

const root = path.resolve(__dirname, '../..');
const BASELINE_FILE = path.join(root, 'tests/fixtures/v1-baseline.json');
const UPDATE = process.env.UPDATE_BASELINE === '1';

/** Mọi hero V1 trong heroes/ + 4 preset dáng người (trên trang bị Kestrel). */
const v1Heroes = (): Array<[string, HeroDefinition]> => {
  const out: Array<[string, HeroDefinition]> = [];
  for (const dir of fs.readdirSync(path.join(root, 'heroes')).sort()) {
    const file = path.join(root, 'heroes', dir, 'hero.json');
    if (!fs.existsSync(file)) continue;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { version?: unknown };
    if (raw.version !== 1) continue;
    const r = validateHero(raw);
    if (!r.ok) throw new Error(`${dir}: ${JSON.stringify(r.errors)}`);
    out.push([`hero:${dir}`, r.hero]);
  }
  for (const name of PRESET_NAMES) out.push([`preset:${name}`, heroWithPreset(name)]);
  return out;
};

const readBaseline = (): Record<string, HeroFingerprint> =>
  fs.existsSync(BASELINE_FILE) ? (JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) as Record<string, HeroFingerprint>) : {};

const HEROES = v1Heroes();

describe('tương thích V1: dấu vân tay hình học và vật liệu không đổi', () => {
  if (UPDATE) {
    it('ghi lại baseline', () => {
      const next = { ...readBaseline() };
      for (const [key, hero] of HEROES) next[key] = fingerprintCharacter(buildCharacter(hero));
      fs.writeFileSync(BASELINE_FILE, JSON.stringify(next, null, 1) + '\n');
    });
    return;
  }
  const baseline = readBaseline();
  it.each(HEROES)('%s', (key, hero) => {
    const expected = baseline[key];
    if (!expected) throw new Error(`chưa có baseline cho ${key} (chạy UPDATE_BASELINE=1 npx vitest run tests/regression)`);
    expect(fingerprintCharacter(buildCharacter(hero))).toEqual(expected);
  });
});
