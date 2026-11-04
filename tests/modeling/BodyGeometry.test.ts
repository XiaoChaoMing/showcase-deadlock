import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { BodyRegion, buildBodyGeometry, buildBodySweeps, REGION_PART } from '../../src/game/character/modeling/BodyGeometry';
import type { BodyShape, HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { kestrel } from '../fixtures/kestrel';
import { hasNaN, inwardFacesPolyline } from '../helpers/geometry';
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

describe('Review Focus #2: giá trị ở biên schema', () => {
  const tiny = (s: BodyShape['arm']) => ({ ...s, squareness: 6, sections: s.sections.map((x) => ({ ...x, width: 0.005, depth: 0.005 })) });
  const extreme: BodyShape = {
    ...kestrel.bodyShape,
    radialSegments: 6,
    torso: { squareness: 6, sections: kestrel.bodyShape.torso.sections.map((x) => ({ ...x, width: 1.5 })) },
    head: { ...kestrel.bodyShape.head, squareness: 6 },
    arm: tiny(kestrel.bodyShape.arm),
    leg: tiny(kestrel.bodyShape.leg),
  };

  it('không NaN, không mặt lộn ngược', () => {
    const { proportions, layout } = resolvedOf(kestrel);
    const surface = createBodySurface(proportions, extreme, layout);
    for (const sweep of buildBodySweeps(surface, extreme)) {
      expect(hasNaN(sweep.data.positions), BodyRegion[sweep.region]).toBe(false);
      expect(inwardFacesPolyline(sweep.data, sweep.rings.map((r) => r.center)), BodyRegion[sweep.region]).toBe(0);
    }
    const geometry = buildBodyGeometry(surface, extreme);
    expect(hasNaN(geometry.getAttribute('position').array)).toBe(false);
    expect(hasNaN(geometry.getAttribute('normal').array)).toBe(false);
  });

  it('Kestrel: mọi sweep không có mặt lộn ngược', () => {
    const { surface } = geometryOf(kestrel);
    for (const sweep of buildBodySweeps(surface, kestrel.bodyShape)) {
      expect(inwardFacesPolyline(sweep.data, sweep.rings.map((r) => r.center)), BodyRegion[sweep.region]).toBe(0);
    }
  });
});

describe('THREE', () => it('geometry là BufferGeometry', () => expect(geometryOf(kestrel).geometry).toBeInstanceOf(THREE.BufferGeometry)));
