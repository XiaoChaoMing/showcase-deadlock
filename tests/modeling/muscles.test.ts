import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import type { BodyShape, Muscle, SurfaceMount } from '../../src/game/character/definitions/HeroDefinition';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { kestrel, kestrelJson } from '../fixtures/kestrel';
import { resolvedOf } from '../helpers/heroes';

const { proportions, layout } = resolvedOf(kestrel);
const surfaceWith = (muscles: Muscle[]) =>
  createBodySurface(proportions, { ...kestrel.bodyShape, muscles } satisfies BodyShape, layout);
const plain = surfaceWith([]);

const lift = (muscles: Muscle[], m: SurfaceMount): number => {
  const a = new THREE.Vector3(...plain.pointAt(m).position);
  const b = new THREE.Vector3(...surfaceWith(muscles).pointAt(m).position);
  return b.distanceTo(a) * Math.sign(b.clone().sub(a).dot(new THREE.Vector3(...plain.pointAt(m).normal)));
};

const pec: Muscle = { part: 'torso', t: 0.74, length: 0.08, angleDeg: 25, spreadDeg: 30, amount: 0.02 };
const bicep: Muscle = { part: 'arm', t: 0.28, length: 0.14, angleDeg: 0, spreadDeg: 50, amount: 0.015 };

describe('muscles', () => {
  it('đỉnh khối cơ nhô ra đúng `amount`', () => {
    expect(lift([pec], { part: 'torso', t: 0.74, angleDeg: 25 })).toBeCloseTo(0.02, 6);
  });

  it('ngoài vùng ảnh hưởng không đổi', () => {
    expect(lift([pec], { part: 'torso', t: 0.74, angleDeg: 70 })).toBeCloseTo(0, 9);
    expect(lift([pec], { part: 'torso', t: 0.5, angleDeg: 25 })).toBeCloseTo(0, 9);
  });

  it('cơ trên thân đối xứng trái phải', () => {
    expect(lift([pec], { part: 'torso', t: 0.74, angleDeg: -25 })).toBeCloseTo(0.02, 6);
  });

  it('cơ trên chi áp dụng cho cả hai bên', () => {
    expect(lift([bicep], { part: 'arm', side: 'left', t: 0.28, angleDeg: 0 })).toBeCloseTo(0.015, 6);
    expect(lift([bicep], { part: 'arm', side: 'right', t: 0.28, angleDeg: 0 })).toBeCloseTo(0.015, 6);
  });

  it('giảm dần mượt ra rìa (nửa khoảng còn khoảng 1/4)', () => {
    const half = lift([pec], { part: 'torso', t: 0.74 + 0.04, angleDeg: 25 + 15 });
    expect(half).toBeGreaterThan(0.02 * 0.2);
    expect(half).toBeLessThan(0.02 * 0.3);
  });

  it('amount âm tạo rãnh lõm vào', () => {
    const groove: Muscle = { ...pec, angleDeg: 0, amount: -0.01 };
    expect(lift([groove], { part: 'torso', t: 0.74, angleDeg: 0 })).toBeCloseTo(-0.01, 6);
  });

  it('cơ cùng góc 0° trên thân không bị cộng đôi', () => {
    const abs: Muscle = { ...pec, angleDeg: 0 };
    expect(lift([abs], { part: 'torso', t: 0.74, angleDeg: 0 })).toBeCloseTo(0.02, 6);
  });

  it('schema chấp nhận muscles, từ chối spreadDeg = 0', () => {
    const h = structuredClone(kestrelJson) as Record<string, any>;
    h.bodyShape.muscles = [pec, bicep];
    expect(validateHero(h).ok).toBe(true);
    h.bodyShape.muscles = [{ ...pec, spreadDeg: 0 }];
    const r = validateHero(h);
    expect(!r.ok && r.errors.some((e) => e.path === '/bodyShape/muscles/0/spreadDeg')).toBe(true);
  });
});
