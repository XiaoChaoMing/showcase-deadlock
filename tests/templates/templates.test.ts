// @vitest-environment happy-dom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import schema from '../../templates/hero.schema.json';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { applyPreset, BODY_PRESETS, type BodyPresetName } from '../../src/game/character/definitions/presets';
import type { HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { validateRig } from '../../src/game/character/rigging/RigValidator';
import { loadHeroRegistry } from '../../src/game/character/runtime/HeroRegistry';
import { exportCharacterGlb } from '../../src/game/character/export/CharacterExporter';
import { importCharacterGlb } from '../../src/game/character/export/CharacterImporter';
import { compareSummaries, summarizeCharacter } from '../../src/game/character/export/CharacterSummary';

const root = path.resolve(__dirname, '../..');
const readJson = (rel: string): unknown => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const template = readJson('templates/hero-template.json');

const validated = (raw: unknown): HeroDefinition => {
  const r = validateHero(raw);
  if (!r.ok) throw new Error(JSON.stringify(r.errors, null, 2));
  return r.hero;
};
const rigFailures = (hero: HeroDefinition): string[] =>
  validateRig(buildCharacter(hero)).filter((c) => !c.pass).map((c) => `${c.id}: ${c.detail}`);

describe('hero-template.json', () => {
  it('hợp lệ, dựng được, mọi rig check pass', () => {
    expect(rigFailures(validated(template))).toEqual([]);
  });

  it('có $schema trỏ đúng khi được copy vào heroes/<id>/', () => {
    const t = template as { $schema: string };
    expect(path.resolve(root, 'heroes/new-hero', t.$schema)).toBe(path.join(root, 'templates/hero.schema.json'));
  });

  it('minh hoạ đủ 5 kiểu trang bị, có socket và khối cơ', () => {
    const t = validated(template);
    expect(new Set(t.equipment.map((e) => e.kind))).toEqual(new Set(['plate', 'band', 'shell', 'box', 'assembly']));
    expect(t.sockets.length).toBeGreaterThan(0);
    expect(t.bodyShape.muscles?.length ?? 0).toBeGreaterThan(0);
  });

  it.each(['athletic', 'heavy', 'slim', 'feminine'] as BodyPresetName[])('ghép preset %s: hợp lệ, dựng được, rig pass', (name) => {
    const hero = validated(applyPreset(validated(template), BODY_PRESETS[name]));
    expect(rigFailures(hero)).toEqual([]);
  });
});

describe('Granite (hero thử dựng từ template)', () => {
  const raw = readJson('heroes/granite/hero.json');

  it('hợp lệ trong registry (id trùng tên thư mục)', () => {
    const [entry] = loadHeroRegistry({ '/heroes/granite/hero.json': raw });
    expect(entry?.ok, JSON.stringify(entry)).toBe(true);
  });

  it('mọi rig check pass', () => expect(rigFailures(validated(raw))).toEqual([]));

  it('khác hẳn Kestrel: dáng heavy, cao hơn, bảng màu khác', () => {
    const g = validated(raw);
    const k = validated(readJson('heroes/kestrel/hero.json'));
    expect(g.proportions.height).toBeGreaterThan(k.proportions.height);
    expect(g.proportions.torso.shoulderWidth).toBeGreaterThan(k.proportions.torso.shoulderWidth);
    expect(JSON.stringify(g.palette)).not.toBe(JSON.stringify(k.palette));
    expect(g.equipment.some((e) => e.kind === 'shell' && e.faceOpeningDeg > 0)).toBe(true);
  });

  it('xuất GLB rồi nạp lại khớp hoàn toàn', async () => {
    const { buffer, summary } = await exportCharacterGlb(validated(raw));
    expect(compareSummaries(summary, summarizeCharacter(await importCharacterGlb(buffer)))).toEqual([]);
  });
});

describe('hero.schema.json', () => {
  it('mọi thuộc tính đều có description không rỗng', () => {
    const missing: string[] = [];
    const visit = (node: unknown, at: string): void => {
      if (!node || typeof node !== 'object') return;
      const n = node as Record<string, unknown>;
      if (n.properties && typeof n.properties === 'object') {
        for (const [k, v] of Object.entries(n.properties as Record<string, Record<string, unknown>>)) {
          const desc = v.description ?? (v.$ref ? 'ref' : undefined);
          if (typeof desc !== 'string' || desc.trim() === '') missing.push(`${at}/${k}`);
          visit(v, `${at}/${k}`);
        }
      }
      for (const key of ['items', 'additionalProperties', 'definitions']) {
        const child = n[key];
        if (key === 'definitions' && child) for (const [k, v] of Object.entries(child as object)) visit(v, `#/definitions/${k}`);
        else if (child && typeof child === 'object') visit(child, `${at}/${key}`);
      }
      for (const branch of (n.oneOf as unknown[] | undefined) ?? []) visit(branch, `${at}/oneOf`);
    };
    visit(schema, '#');
    expect(missing).toEqual([]);
  });
});
