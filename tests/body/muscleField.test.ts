import { describe, expect, it } from 'vitest';
import { createMuscleField, type MuscleDef } from '../../src/game/character/body/anatomy/MuscleField';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { resolvedOf } from '../helpers/heroes';
import { kestrel } from '../fixtures/kestrel';

const DEG = Math.PI / 180;
const R = 0.1;

const muscle = (over: Partial<MuscleDef> = {}): MuscleDef => ({
  id: 'm',
  group: 'chest',
  part: 'arm',
  t: 0.5,
  angleDeg: 0,
  mirror: false,
  width: 40,
  height: 0.2,
  depth: 0.2,
  bulge: 0,
  taper: 0,
  separation: 0,
  startOffset: 0,
  endOffset: 0,
  smoothness: 0.5,
  ...over,
});

const field = (defs: MuscleDef[], separation = 1, smoothness = 0.85) => createMuscleField(defs, { separation, smoothness });
const at = (defs: MuscleDef[], t: number, deg: number, separation = 1): number =>
  field(defs, separation)('arm', 'left', t)?.(deg * DEG, R) ?? 0;

describe('MuscleField: một khối', () => {
  it('đỉnh = depth × bán kính tại tâm, bằng 0 ngoài vùng', () => {
    const m = [muscle()];
    expect(at(m, 0.5, 0)).toBeCloseTo(0.2 * R, 9);
    expect(at(m, 0.75, 0)).toBe(0);
    expect(at(m, 0.5, 45)).toBe(0);
    expect(field(m)('arm', 'left', 0.9)).toBeUndefined();
  });

  it('trơn ở mép (đạo hàm số hai phía gần như bằng 0)', () => {
    const m = [muscle(), muscle({ id: 'flat', bulge: 1, angleDeg: 180 })];
    const h = 1e-4;
    for (const deg of [0, 180]) {
      const edgeT = 0.7;
      const inside = (at(m, edgeT - h, deg) - at(m, edgeT - 2 * h, deg)) / h;
      const outside = (at(m, edgeT + 2 * h, deg) - at(m, edgeT + h, deg)) / h;
      // Độ dốc sát mép phải nhỏ so với độ dốc trung bình của sườn khối (đỉnh / nửa chiều dài), và bằng 0 bên ngoài.
      const meanSlope = at(m, 0.5, deg) / 0.2;
      expect(Math.abs(inside)).toBeLessThan(0.1 * meanSlope);
      expect(outside).toBe(0);
    }
  });

  it('taper dương đẩy đỉnh về phía t lớn', () => {
    const m = [muscle({ taper: 0.5 })];
    let best = { t: 0, d: -1 };
    for (let t = 0.3; t <= 0.7; t += 0.002) {
      const d = at(m, t, 0);
      if (d > best.d) best = { t, d };
    }
    expect(best.t).toBeGreaterThan(0.54);
  });

  it('startOffset/endOffset cắt bớt hai đầu', () => {
    const m = [muscle({ startOffset: 0.5, endOffset: 0.5 })];
    expect(at(m, 0.35, 0)).toBe(0);
    expect(at(m, 0.65, 0)).toBe(0);
    expect(at(m, 0.5, 0)).toBeGreaterThan(0);
  });
});

describe('MuscleField: hoà nhiều khối (smooth union) và rãnh', () => {
  it('hai khối trùng nhau không cộng dồn thành gấp đôi như v1', () => {
    const one = at([muscle()], 0.5, 0);
    const two = at([muscle({ id: 'a' }), muscle({ id: 'b' })], 0.5, 0);
    expect(two).toBeGreaterThanOrEqual(one);
    expect(two).toBeLessThanOrEqual(one * 1.2);
  });

  it('separation 0 → không có rãnh; separation 1 → có rãnh nhưng không lõm dưới bề mặt', () => {
    const pair = (sep: number) => [muscle({ id: 'a', angleDeg: -10, separation: sep }), muscle({ id: 'b', angleDeg: 10, separation: sep })];
    const peak = at(pair(0), 0.5, -10);
    const flat = at(pair(0), 0.5, 0);
    expect(flat).toBeGreaterThanOrEqual(peak * 0.9);
    const grooved = at(pair(1), 0.5, 0);
    expect(grooved).toBeLessThan(flat * 0.85);
    expect(grooved).toBeGreaterThanOrEqual(0);
    // hệ số tách toàn thân 0 tắt rãnh
    expect(at(pair(1), 0.5, 0, 0)).toBeCloseTo(flat, 9);
  });

  it('mirror trên thân sinh thêm bản đối xứng ở −angleDeg', () => {
    const f = createMuscleField([muscle({ part: 'torso', angleDeg: 30, mirror: true })], { separation: 1, smoothness: 0.85 });
    const ring = f('torso', undefined, 0.5)!;
    expect(ring(-30 * DEG, R)).toBeCloseTo(ring(30 * DEG, R), 12);
  });

  it('tất định', () => {
    const m = [muscle({ id: 'a', angleDeg: -10, taper: 0.3 }), muscle({ id: 'b', angleDeg: 20, bulge: 0.6 })];
    const sample = () => Array.from({ length: 50 }, (_, i) => at(m, 0.3 + i * 0.008, i * 3 - 60));
    expect(sample()).toEqual(sample());
  });
});

describe('BodySurface + trường cơ', () => {
  it('không truyền trường cơ → ring y hệt như cũ', () => {
    const { proportions, layout } = resolvedOf(kestrel);
    const a = createBodySurface(proportions, kestrel.bodyShape, layout);
    const b = createBodySurface(proportions, kestrel.bodyShape, layout, undefined);
    expect(b.pointAt({ part: 'torso', t: 0.8, angleDeg: 20 })).toEqual(a.pointAt({ part: 'torso', t: 0.8, angleDeg: 20 }));
  });

  it('có trường cơ → điểm bề mặt nhô ra theo pháp tuyến đúng bằng giá trị trường', () => {
    const { proportions, layout } = resolvedOf(kestrel);
    const shape = { ...kestrel.bodyShape, muscles: [] };
    const plain = createBodySurface(proportions, shape, layout);
    const f = createMuscleField([muscle({ part: 'torso', t: 0.8, angleDeg: 0, height: 0.1 })], { separation: 1, smoothness: 0.85 });
    const bumped = createBodySurface(proportions, shape, layout, f);
    const p0 = plain.pointAt({ part: 'torso', t: 0.8, angleDeg: 0 });
    const p1 = bumped.pointAt({ part: 'torso', t: 0.8, angleDeg: 0 });
    const lift = Math.hypot(...p1.position.map((v, i) => v - p0.position[i]!));
    expect(lift).toBeGreaterThan(0.005);
  });
});
