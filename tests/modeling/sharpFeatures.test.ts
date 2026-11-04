import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildPlateGeometries } from '../../src/game/character/modeling/equipment/PlateBuilder';
import { buildAssemblyGroup } from '../../src/game/character/modeling/equipment/AssemblyBuilder';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { createMaterials } from '../../src/game/character/modeling/materials/MaterialBuilder';
import type { AssemblyItem, PlateItem, Primitive } from '../../src/game/character/definitions/HeroDefinition';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { kestrel, kestrelJson } from '../fixtures/kestrel';
import { hasNaN } from '../helpers/geometry';
import { resolvedOf } from '../helpers/heroes';

const { proportions, layout } = resolvedOf(kestrel);
const surface = createBodySurface(proportions, kestrel.bodyShape, layout);
const basePlate = {
  part: 'torso', tStart: 0.3, tEnd: 0.5, angleStartDeg: -60, angleEndDeg: 60, thickness: 0.01, gap: 0.01,
} satisfies Partial<PlateItem>;

const vertices = (geometries: THREE.BufferGeometry[]): THREE.Vector3[] =>
  geometries.flatMap((g) => {
    const pos = g.getAttribute('position');
    return Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
  });

describe('plate point', () => {
  it('mép cuối vuốt nhọn thêm đúng `point` mét ở giữa', () => {
    const flat = vertices(buildPlateGeometries(basePlate, surface, 8, false).body);
    const pointed = vertices(buildPlateGeometries({ ...basePlate, point: 0.05 }, surface, 8, false).body);
    const top = (vs: THREE.Vector3[]) => Math.max(...vs.map((v) => v.y));
    expect(top(pointed) - top(flat)).toBeCloseTo(0.05, 2);
  });

  it('hai mép bên không đổi', () => {
    const edgeTop = (vs: THREE.Vector3[]) => {
      const maxX = Math.max(...vs.map((v) => Math.abs(v.x)));
      return Math.max(...vs.filter((v) => Math.abs(v.x) > maxX - 0.005).map((v) => v.y));
    };
    const pointed = vertices(buildPlateGeometries({ ...basePlate, point: 0.05 }, surface, 8, false).body);
    const flat = vertices(buildPlateGeometries(basePlate, surface, 8, false).body);
    expect(edgeTop(pointed)).toBeCloseTo(edgeTop(flat), 3);
  });
});

describe('plate ridge', () => {
  it('sống gờ nhô ra thêm đúng `ridge` mét ở giữa', () => {
    const front = (vs: THREE.Vector3[]) => Math.max(...vs.map((v) => v.z));
    const flat = front(vertices(buildPlateGeometries(basePlate, surface, 8, false).body));
    const ridged = front(vertices(buildPlateGeometries({ ...basePlate, ridge: 0.02 }, surface, 8, false).body));
    expect(ridged - flat).toBeCloseTo(0.02, 3);
  });
});

const signedVolume = (g: THREE.BufferGeometry): number => {
  const geo = g.index ? g.toNonIndexed() : g;
  const pos = geo.getAttribute('position');
  let vol = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    vol += a.dot(b.clone().cross(c)) / 6;
  }
  return vol;
};

describe.each<Primitive['shape']>(['spike', 'wedge', 'blade'])('primitive %s', (shape) => {
  const item: AssemblyItem = {
    id: 'x', kind: 'assembly', color: 'armor', attach: { mount: { part: 'torso', t: 0.5, angleDeg: 0 } },
    parts: [{ shape, size: [0.04, 0.06, 0.2], position: [0, 0, 0], color: 'armor' }],
  };
  const mesh = buildAssemblyGroup(item, createMaterials(kestrel.palette)).children[0] as THREE.Mesh;

  it('kích thước bao đúng size, mũi nhọn theo +Z', () => {
    const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.getAttribute('position') as THREE.BufferAttribute);
    const size = box.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(0.04, 4);
    expect(size.y).toBeCloseTo(0.06, 4);
    expect(size.z).toBeCloseTo(0.2, 4);
    expect(hasNaN(mesh.geometry.getAttribute('position').array)).toBe(false);
  });

  it('khối kín, mặt quay ra ngoài (thể tích dương)', () => {
    expect(signedVolume(mesh.geometry)).toBeGreaterThan(0);
  });
});

describe('schema chấp nhận chi tiết sắc', () => {
  it('point, ridge, spike, wedge, blade hợp lệ', () => {
    const h = structuredClone(kestrelJson) as Record<string, any>;
    h.equipment[0].point = 0.04;
    h.equipment[0].ridge = 0.02;
    h.equipment[5].parts.push(
      { shape: 'spike', size: [0.02, 0.02, 0.06], position: [0, 0, 0], color: 'metal' },
      { shape: 'wedge', size: [0.01, 0.04, 0.1], position: [0, 0, 0], color: 'metal' },
      { shape: 'blade', size: [0.006, 0.03, 0.2], position: [0, 0, 0], color: 'metal' },
    );
    const r = validateHero(h);
    if (!r.ok) console.error(r.errors);
    expect(r.ok).toBe(true);
  });
});
