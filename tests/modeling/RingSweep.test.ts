import { describe, expect, it } from 'vitest';
import { buildSweep, superellipsePoint, type SweepRing } from '../../src/game/character/modeling/geometry/RingSweep';
import type { Vec3 } from '../../src/game/character/definitions/HeroDefinition';
import { hasNaN, inwardFaces } from '../helpers/geometry';

describe('superellipsePoint', () => {
  it('n = 2 là elip', () => {
    for (let k = 0; k < 64; k++) {
      const [a, b] = superellipsePoint((k / 64) * Math.PI * 2, 0.3, 0.1, 2);
      expect((a * a) / 0.09 + (b * b) / 0.01).toBeCloseTo(1, 9);
    }
  });

  it('n = 6 vuông hơn n = 2 ở góc 45°', () => {
    const r = (n: number) => Math.hypot(...superellipsePoint(Math.PI / 4, 0.2, 0.2, n));
    expect(r(6)).toBeGreaterThan(r(2) + 0.01);
  });

  it('góc 0 nằm trên trục A, góc 90° nằm trên trục B', () => {
    const [a0, b0] = superellipsePoint(0, 0.3, 0.1, 2.5);
    expect(a0).toBeCloseTo(0.3, 9);
    expect(b0).toBeCloseTo(0, 9);
    const [a1, b1] = superellipsePoint(Math.PI / 2, 0.3, 0.1, 2.5);
    expect(a1).toBeCloseTo(0, 9);
    expect(b1).toBeCloseTo(0.1, 9);
  });
});

const makeRings = (dir: Vec3, axisA: Vec3, axisB: Vec3, count = 5): SweepRing[] =>
  Array.from({ length: count }, (_, i) => ({
    center: [dir[0] * i * 0.1, dir[1] * i * 0.1, dir[2] * i * 0.1] as Vec3,
    axisA,
    axisB,
    ra: 0.05 + 0.01 * i,
    rb: 0.04,
    n: 2.5,
    t: i / (count - 1),
  }));

describe.each<[string, Vec3, Vec3, Vec3]>([
  ['+Y', [0, 1, 0], [0, 0, 1], [1, 0, 0]],
  ['-Y', [0, -1, 0], [0, 0, 1], [1, 0, 0]],
  ['+X', [1, 0, 0], [0, 0, 1], [0, 1, 0]],
  ['-X', [-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  ['-Y ngoài -X', [0, -1, 0], [0, 0, 1], [-1, 0, 0]],
])('buildSweep đi theo %s', (_name, dir, axisA, axisB) => {
  const rings = makeRings(dir, axisA, axisB);
  const data = buildSweep(rings, 12, { start: true, end: true });
  const end: Vec3 = [dir[0] * 0.4, dir[1] * 0.4, dir[2] * 0.4];

  it('số vertex, index hợp lệ, không NaN', () => {
    expect(data.positions.length / 3).toBe(5 * 12 + 2);
    expect(data.t.length).toBe(5 * 12 + 2);
    expect(data.angle.length).toBe(5 * 12 + 2);
    expect(Math.max(...data.indices)).toBeLessThan(5 * 12 + 2);
    expect(hasNaN(data.positions)).toBe(false);
    expect(data.indices.length).toBe((4 * 12 * 2 + 2 * 12) * 3);
  });

  it('mọi mặt quay ra ngoài', () => {
    expect(inwardFaces(data, [0, 0, 0], end)).toBe(0);
  });

  it('t chạy từ 0 tới 1 dọc sweep', () => {
    expect(data.t[0]).toBe(0);
    expect(data.t[4 * 12]).toBe(1);
  });
});
