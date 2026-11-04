import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { BodyRegion, buildBodyGeometry, REGION_PART } from '../../src/game/character/modeling/BodyGeometry';
import type { BodyShape, HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { kestrel } from '../fixtures/kestrel';
import { hasNaN } from '../helpers/geometry';
import { resolvedOf, SAMPLE_HEROES } from '../helpers/heroes';

const geometryOf = (hero: HeroDefinition, shape: BodyShape = hero.bodyShape) => {
  const { proportions, layout } = resolvedOf(hero);
  const surface = createBodySurface(proportions, shape, layout);
  return { surface, geometry: buildBodyGeometry(surface, shape), proportions };
};

const LEFT = [BodyRegion.ArmL, BodyRegion.HandL, BodyRegion.LegL, BodyRegion.FootL];
const RIGHT = [BodyRegion.ArmR, BodyRegion.HandR, BodyRegion.LegR, BodyRegion.FootR];

describe.each(SAMPLE_HEROES)('buildBodyGeometry: %s', (_name, hero) => {
  const { geometry, proportions } = geometryOf(hero);
  const pos = geometry.getAttribute('position');
  const region = geometry.getAttribute('region');

  it('không NaN, có normal, region, chainT', () => {
    expect(hasNaN(pos.array)).toBe(false);
    expect(hasNaN(geometry.getAttribute('normal').array)).toBe(false);
    expect(region.count).toBe(pos.count);
    expect(geometry.getAttribute('chainT').count).toBe(pos.count);
  });

  it('cao đúng height và đối xứng trái phải', () => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 1);
    expect(Math.abs(box.min.y)).toBeLessThan(0.01);
    expect(Math.abs(box.max.y - proportions.height)).toBeLessThan(0.01);
    expect(box.min.x).toBeCloseTo(-box.max.x, 6);
  });

  it('mỗi region có vertex, bên trái ở +X, bên phải ở −X', () => {
    const counts = new Map<number, number>();
    for (let i = 0; i < region.count; i++) {
      const r = region.getX(i);
      counts.set(r, (counts.get(r) ?? 0) + 1);
      if (LEFT.includes(r)) expect(pos.getX(i)).toBeGreaterThan(0);
      if (RIGHT.includes(r)) expect(pos.getX(i)).toBeLessThan(0);
    }
    expect(counts.size).toBe(Object.keys(REGION_PART).length);
  });

  it('vertex bên trái lật dấu x trùng bên phải', () => {
    const key = (x: number, y: number, z: number) => `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i < pos.count; i++) {
      const r = region.getX(i);
      if (LEFT.includes(r)) left.push(key(-pos.getX(i), pos.getY(i), pos.getZ(i)));
      if (RIGHT.includes(r)) right.push(key(pos.getX(i), pos.getY(i), pos.getZ(i)));
    }
    expect(left.sort()).toEqual(right.sort());
  });

  it('groups theo thứ tự region', () => {
    expect(geometry.groups.map((g) => g.materialIndex)).toEqual(Object.keys(REGION_PART).map(Number));
  });
});

describe('flat vs smooth', () => {
  it('flat → non-indexed, smooth → indexed', () => {
    expect(geometryOf(kestrel).geometry.index).toBeNull();
    expect(geometryOf(kestrel, { ...kestrel.bodyShape, shading: 'smooth' }).geometry.index).not.toBeNull();
  });
});

describe('THREE', () => it('geometry là BufferGeometry', () => expect(geometryOf(kestrel).geometry).toBeInstanceOf(THREE.BufferGeometry)));
