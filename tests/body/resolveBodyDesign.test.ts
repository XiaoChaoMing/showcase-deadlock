import { describe, expect, it } from 'vitest';
import { resolveBodyDesign } from '../../src/game/character/body/config/resolveBodyDesign';
import { ARCHETYPES, ARCHETYPE_IDS } from '../../src/game/character/body/config/archetypes';
import { BODY_TYPES, type Archetype, type BodyDesignConfig, type BodyType } from '../../src/game/character/body/config/BodyDesign';
import { resolveProportions } from '../../src/game/character/definitions/resolveProportions';
import { computeLayout } from '../../src/game/character/definitions/CharacterLayout';
import { sampleProfile } from '../../src/game/character/modeling/geometry/profile';

const design = (archetype: Archetype, bodyType: BodyType = 'masculine', extra: Partial<BodyDesignConfig> = {}): BodyDesignConfig => ({
  version: 1,
  style: 'stylized-anatomical',
  surface: 'smooth',
  proportionPreset: 'heroic',
  muscleDefinition: 'high',
  archetype,
  bodyType,
  ...extra,
});

const COMBOS: Array<[Archetype, BodyType]> = ARCHETYPE_IDS.flatMap((a) => BODY_TYPES.map((b): [Archetype, BodyType] => [a, b]));

/** Bề ngang torso tại t (mét). */
const torsoWidth = (d: BodyDesignConfig, t: number): number => sampleProfile(resolveBodyDesign(d).bodyShape.torso.sections, t).width;
/** Bề ngang hẹp nhất của torso trong vùng eo, và vị trí t của nó. */
const waist = (d: BodyDesignConfig): { width: number; t: number } => {
  let best = { width: Infinity, t: 0 };
  for (let t = 0.2; t <= 0.7; t += 0.005) {
    const w = torsoWidth(d, t);
    if (w < best.width) best = { width: w, t };
  }
  return best;
};
const upperArmWidth = (d: BodyDesignConfig): number => sampleProfile(resolveBodyDesign(d).bodyShape.arm.sections, 0.2).width;

describe('resolveBodyDesign: 10 tổ hợp archetype × bodyType', () => {
  it.each(COMBOS)('%s / %s: tỷ lệ hợp lệ, chiều cao đúng', (archetype, bodyType) => {
    const d = design(archetype, bodyType);
    const { proportions } = resolveBodyDesign(d);
    const r = resolveProportions(proportions);
    expect(r.ok).toBe(true);
    const expected = ARCHETYPES[archetype].height * (bodyType === 'feminine' ? 0.95 : 1);
    expect(proportions.height).toBeCloseTo(expected, 6);
    expect(computeLayout(proportions).headTopY).toBeCloseTo(expected, 2);
  });

  it('fighter nam: vai / chiều cao = 0.27 × 1.1', () => {
    const { proportions } = resolveBodyDesign(design('fighter'));
    expect(proportions.torso.shoulderWidth / proportions.height).toBeCloseTo(0.27 * 1.1, 2);
  });

  it('thứ tự silhouette: vai bruiser > tank > fighter > assassin > mage; eo tank > bruiser > fighter; tay bruiser to nhất', () => {
    const shoulder = (a: Archetype) => resolveBodyDesign(design(a)).proportions.torso.shoulderWidth;
    expect(shoulder('bruiser')).toBeGreaterThan(shoulder('tank'));
    expect(shoulder('tank')).toBeGreaterThan(shoulder('fighter'));
    expect(shoulder('fighter')).toBeGreaterThan(shoulder('assassin'));
    expect(shoulder('assassin')).toBeGreaterThan(shoulder('mage'));
    expect(waist(design('tank')).width).toBeGreaterThan(waist(design('bruiser')).width);
    expect(waist(design('bruiser')).width).toBeGreaterThan(waist(design('fighter')).width);
    const arms = ARCHETYPE_IDS.map((a) => upperArmWidth(design(a)));
    expect(Math.max(...arms)).toBe(upperArmWidth(design('bruiser')));
  });

  it('hệ số của hero nhân thêm vào archetype', () => {
    const base = resolveBodyDesign(design('fighter')).proportions;
    const wide = resolveBodyDesign(design('fighter', 'masculine', { proportions: { shoulderWidth: 1.2 } })).proportions;
    expect(wide.torso.shoulderWidth).toBeCloseTo(base.torso.shoulderWidth * 1.2, 6);
    const tall = resolveBodyDesign(design('fighter', 'masculine', { height: 2 })).proportions;
    expect(tall.height).toBe(2);
  });

  it('thân nữ không phải thân nam thu nhỏ', () => {
    for (const a of ARCHETYPE_IDS) {
      const m = resolveBodyDesign(design(a, 'masculine')).proportions;
      const f = resolveBodyDesign(design(a, 'feminine')).proportions;
      const hipToShoulder = (p: typeof m) => p.torso.hipWidth / p.torso.shoulderWidth;
      // So tương đối (hệ số archetype nhân vào cả hai thân nên không đổi tỷ số này).
      expect(hipToShoulder(f) / hipToShoulder(m)).toBeGreaterThanOrEqual(1.2);
      const wm = waist(design(a, 'masculine'));
      const wf = waist(design(a, 'feminine'));
      const hipSec = (d: BodyDesignConfig) => torsoWidth(d, 0.1);
      expect(wf.width / hipSec(design(a, 'feminine')) / (wm.width / hipSec(design(a, 'masculine')))).toBeLessThanOrEqual(0.9);
      expect(wf.t).toBeGreaterThan(wm.t);
    }
  });

  it('hệ số ngoài giới hạn bị kẹp', () => {
    const big = resolveBodyDesign(design('fighter', 'masculine', { proportions: { shoulderWidth: 5 } })).proportions;
    const max = resolveBodyDesign(design('fighter', 'masculine', { proportions: { shoulderWidth: 1.6 } })).proportions;
    expect(big.torso.shoulderWidth).toBeCloseTo(max.torso.shoulderWidth, 9);
    const anatomy = resolveBodyDesign(design('fighter', 'masculine', { muscles: { chest: -3 } })).anatomy;
    expect(anatomy.muscleScale.chest).toBe(0);
  });

  it('không mutate archetype, kết quả tất định, mức cơ theo muscleDefinition', () => {
    const before = JSON.stringify(ARCHETYPES);
    const a = resolveBodyDesign(design('tank', 'feminine'));
    const b = resolveBodyDesign(design('tank', 'feminine'));
    expect(a).toEqual(b);
    expect(JSON.stringify(ARCHETYPES)).toBe(before);
    expect(resolveBodyDesign(design('tank', 'masculine', { muscleDefinition: 'low' })).anatomy.definition).toBe(0.5);
    expect(a.anatomy.definition).toBe(1);
    expect(a.bodyShape.shading).toBe('smooth');
    expect(a.bodyShape.radialSegments % 8).toBe(0);
    expect(a.bodyShape.muscles ?? []).toEqual([]);
  });
});

describe('hai chân không lấn qua đường giữa (lỗi nhỏ #2 của v1)', () => {
  it.each(COMBOS)('%s / %s, kể cả legVolume 1.6', (archetype, bodyType) => {
    for (const legVolume of [1, 1.6]) {
      const { proportions, bodyShape } = resolveBodyDesign(design(archetype, bodyType, { proportions: { legVolume } }));
      const hipX = computeLayout(proportions).joints.LeftUpperLeg[0];
      for (const s of bodyShape.leg.sections) expect(s.width / 2).toBeLessThan(hipX);
    }
  });
});
