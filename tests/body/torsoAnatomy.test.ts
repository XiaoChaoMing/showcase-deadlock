import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ARCHETYPE_IDS, BODY_TYPES, type Archetype, type BodyDesignConfig, type BodyType } from '../../src/game/character/body/config/BodyDesign';
import { applyBodyDesign, defaultBodyDesign, resolveBodyDesign } from '../../src/game/character/body/config/resolveBodyDesign';
import { createAnatomyField } from '../../src/game/character/body/anatomy/anatomyField';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import { analyzeTopology } from '../helpers/topology';
import { kestrel } from '../fixtures/kestrel';

const DEG = Math.PI / 180;
const R = 0.15;
const COMBOS: Array<[Archetype, BodyType]> = ARCHETYPE_IDS.flatMap((a) => BODY_TYPES.map((b): [Archetype, BodyType] => [a, b]));

const bare = { ...kestrel, equipment: [], sockets: [] };
const model = (d: BodyDesignConfig) => buildCharacterModel(applyBodyDesign(bare, d));
const fieldOf = (d: BodyDesignConfig) => createAnatomyField(resolveBodyDesign(d).anatomy);
const D = (d: BodyDesignConfig, t: number, deg: number): number => fieldOf(d)('torso', undefined, t)?.(deg * DEG, R) ?? 0;
const rows = (bt: BodyType): number[] => (bt === 'masculine' ? [0.4, 0.49, 0.58] : [0.39, 0.47, 0.55]);

/** Tỷ lệ tam giác có pháp tuyến hướng ra xa trục dọc của bộ phận (y) — đo thô cho phần thân. */
const outwardRatio = (g: THREE.BufferGeometry, maxY: number, minY: number): number => {
  const pos = g.getAttribute('position');
  const index = g.getIndex()!;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
  let total = 0;
  let ok = 0;
  for (let i = 0; i < index.count; i += 3) {
    a.fromBufferAttribute(pos, index.getX(i));
    b.fromBufferAttribute(pos, index.getX(i + 1));
    c.fromBufferAttribute(pos, index.getX(i + 2));
    m.copy(a).add(b).add(c).divideScalar(3);
    if (m.y < minY || m.y > maxY || Math.abs(m.x) > 0.12) continue;
    n.subVectors(b, a).cross(c.clone().sub(a));
    total += 1;
    if (n.x * m.x + n.z * m.z > 0) ok += 1;
  }
  return ok / total;
};

describe.each(COMBOS)('torso anatomy %s / %s', (archetype, bodyType) => {
  const d = defaultBodyDesign(archetype, bodyType);
  const m = model(d);

  it('lưới thân vẫn kín, định hướng nhất quán, không NaN', () => {
    const topo = analyzeTopology(m.bodyGeometry);
    expect(topo.components).toBe(1);
    expect(topo.nonManifoldEdges).toBe(0);
    expect(topo.inconsistentEdges).toBe(0);
    expect(topo.signedVolume).toBeGreaterThan(0);
    const arr = m.bodyGeometry.getAttribute('position').array as Float32Array;
    expect(arr.every(Number.isFinite)).toBe(true);
  });

  it('nhìn ngang: ngực nhô trước bụng', () => {
    const chest = m.surface.pointAt({ part: 'torso', t: 0.74, angleDeg: 22 }).position[2];
    const belly = m.surface.pointAt({ part: 'torso', t: 0.45, angleDeg: 22 }).position[2];
    expect(chest).toBeGreaterThan(belly + 0.01);
  });

  it('bụng: 3 hàng khối hai bên, rãnh giữa (linea alba)', () => {
    for (const t of rows(bodyType)) expect(D(d, t, 0)).toBeLessThan(D(d, t, 9));
  });

  it('lưng rộng hơn eo ≥ 15%', () => {
    const halfWidth = (t: number) => Math.max(...Array.from({ length: 72 }, (_, i) => Math.abs(m.surface.pointAt({ part: 'torso', t, angleDeg: i * 5 }).position[0])));
    const waistT = bodyType === 'masculine' ? 0.42 : 0.5;
    expect(halfWidth(0.72)).toBeGreaterThan(halfWidth(waistT) * 1.15);
  });
});

describe('torso anatomy: so sánh giữa các dáng', () => {
  it('mage có cơ ngực thấp hơn tank ≥ 40%', () => {
    for (const bt of BODY_TYPES) {
      const peak = (a: Archetype) => Math.max(...[18, 22, 26, 30].map((deg) => D(defaultBodyDesign(a, bt), 0.76, deg)));
      expect(peak('mage')).toBeLessThan(peak('tank') * 0.6);
    }
  });

  it('thân nữ: khối ngực trước nhất ở t 0.64–0.76, tách ở giữa; rãnh bụng nông hơn thân nam', () => {
    for (const a of ARCHETYPE_IDS) {
      const f = defaultBodyDesign(a, 'feminine');
      const s = model(f).surface;
      let best = { t: 0, z: -Infinity };
      for (let t = 0.6; t <= 0.95; t += 0.005) {
        const z = s.pointAt({ part: 'torso', t, angleDeg: 22 }).position[2];
        if (z > best.z) best = { t, z };
      }
      expect(best.t).toBeGreaterThanOrEqual(0.64);
      expect(best.t).toBeLessThanOrEqual(0.76);
      expect(D(f, 0.7, 0)).toBeLessThan(D(f, 0.7, 21));
      const groove = (d: BodyDesignConfig, t: number) => D(d, t, 9) - D(d, t, 0);
      expect(groove(f, 0.47)).toBeLessThan(groove(defaultBodyDesign(a, 'masculine'), 0.49));
    }
  });

  it('Review Focus #1: cơ ngực/bụng 2.0 và tách cơ 1.0 → không lật mặt, rãnh không lõm dưới thân trần', () => {
    for (const bt of BODY_TYPES) {
      const d: BodyDesignConfig = { ...defaultBodyDesign('bruiser', bt), muscles: { chest: 2, abdomen: 2, back: 2 }, surfaceSettings: { muscleSeparation: 1 } };
      const m = model(d);
      const L = m.layout;
      expect(outwardRatio(m.bodyGeometry, L.neckBaseY - 0.02, L.torsoBottomY + 0.1)).toBeGreaterThanOrEqual(0.995);
      for (let t = 0.05; t < 1; t += 0.05) for (let deg = -180; deg < 180; deg += 10) expect(D(d, t, deg)).toBeGreaterThanOrEqual(0);
    }
  });
});
