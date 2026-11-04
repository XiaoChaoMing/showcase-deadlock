import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import { validateRig } from '../../src/game/character/rigging/RigValidator';
import { ARCHETYPE_IDS, BODY_DESIGN_LIMITS, MUSCLE_GROUPS } from '../../src/game/character/body/config/BodyDesign';
import { resolveBodyDesign } from '../../src/game/character/body/config/resolveBodyDesign';
import { kestrelJson } from '../fixtures/kestrel';

const root = path.resolve(__dirname, '../..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'templates/hero.schema.json'), 'utf8')) as {
  properties: { bodyDesign: { properties: Record<string, { minimum?: number; maximum?: number; properties?: Record<string, { minimum?: number; maximum?: number }> }> } };
};

const BODY_DESIGN = {
  version: 1,
  style: 'stylized-anatomical',
  surface: 'smooth',
  proportionPreset: 'heroic',
  muscleDefinition: 'high',
  archetype: 'fighter',
  bodyType: 'feminine',
};

/** Kestrel nhưng thân lấy từ bodyDesign (bỏ proportions và bodyShape). */
const withDesign = (design: Record<string, unknown> = BODY_DESIGN): Record<string, unknown> => {
  const { proportions: _p, bodyShape: _b, ...rest } = structuredClone(kestrelJson) as Record<string, unknown>;
  return { ...rest, bodyDesign: design };
};

const errorsOf = (raw: unknown) => {
  const r = validateHero(raw);
  return r.ok ? [] : r.errors;
};

describe('bodyDesign trong hero.json', () => {
  it('chỉ có bodyDesign: hợp lệ, thân lấy từ resolver, dựng được, rig 9/9', () => {
    const r = validateHero(withDesign());
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    const resolved = resolveBodyDesign(BODY_DESIGN as never);
    expect(r.hero.proportions).toEqual(resolved.proportions);
    expect(r.hero.bodyShape).toEqual(resolved.bodyShape);
    expect(validateRig(buildCharacter(r.hero)).filter((c) => !c.pass)).toEqual([]);
    expect(buildCharacterModel(r.hero).anatomy?.bodyType).toBe('feminine');
  });

  it('có cả bodyDesign lẫn proportions → đúng một lỗi ở /bodyDesign', () => {
    const raw = { ...(structuredClone(kestrelJson) as Record<string, unknown>), bodyDesign: BODY_DESIGN };
    const errors = errorsOf(raw);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toBe('/bodyDesign');
    expect(errors[0]?.message).toContain('không dùng cùng lúc');
  });

  it('thiếu cả hai → đúng một lỗi', () => {
    const { proportions: _p, bodyShape: _b, ...rest } = structuredClone(kestrelJson) as Record<string, unknown>;
    const errors = errorsOf(rest);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain('thiếu bodyDesign');
  });

  it('khoảng giá trị, archetype và hằng số phong cách được kiểm tra bằng tiếng Việt', () => {
    expect(errorsOf(withDesign({ ...BODY_DESIGN, muscles: { chest: 3 } }))).toEqual([
      { path: '/bodyDesign/muscles/chest', message: expect.stringContaining('từ 0 đến 2') },
    ]);
    const archetype = errorsOf(withDesign({ ...BODY_DESIGN, archetype: 'ninja' }));
    expect(archetype[0]?.path).toBe('/bodyDesign/archetype');
    for (const a of ARCHETYPE_IDS) expect(archetype[0]?.message).toContain(a);
    expect(errorsOf(withDesign({ ...BODY_DESIGN, style: 'cartoon' }))[0]?.message).toContain('"stylized-anatomical"');
    const missing = errorsOf(withDesign({ ...BODY_DESIGN, bodyType: undefined }));
    expect(missing[0]).toEqual({ path: '/bodyDesign/bodyType', message: 'thiếu trường bắt buộc "bodyType"' });
  });

  it('giới hạn trong schema khớp BODY_DESIGN_LIMITS', () => {
    const p = schema.properties.bodyDesign.properties;
    expect([p.height?.minimum, p.height?.maximum]).toEqual([BODY_DESIGN_LIMITS.height.min, BODY_DESIGN_LIMITS.height.max]);
    for (const g of MUSCLE_GROUPS) {
      expect([p.muscles?.properties?.[g]?.minimum, p.muscles?.properties?.[g]?.maximum]).toEqual([0, 2]);
    }
    expect(p.proportions?.properties?.shoulderWidth?.maximum).toBe(BODY_DESIGN_LIMITS.proportion.max);
  });
});
