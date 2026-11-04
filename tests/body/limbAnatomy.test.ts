import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ARCHETYPE_IDS, BODY_TYPES, type Archetype, type BodyDesignConfig, type BodyType } from '../../src/game/character/body/config/BodyDesign';
import { applyBodyDesign, defaultBodyDesign, resolveBodyDesign } from '../../src/game/character/body/config/resolveBodyDesign';
import { createAnatomyField } from '../../src/game/character/body/anatomy/anatomyField';
import { HEROIC_BASELINE } from '../../src/game/character/body/config/heroicBaseline';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import { BodyRegion } from '../../src/game/character/modeling/BodyGeometry';
import { partDistance } from '../../src/game/character/body/surface/JunctionBlend';
import { analyzeTopology } from '../helpers/topology';
import { kestrel } from '../fixtures/kestrel';

const DEG = Math.PI / 180;
const R = 0.06;
const COMBOS: Array<[Archetype, BodyType]> = ARCHETYPE_IDS.flatMap((a) => BODY_TYPES.map((b): [Archetype, BodyType] => [a, b]));
const bare = { ...kestrel, equipment: [], sockets: [] };
const model = (d: BodyDesignConfig) => buildCharacterModel(applyBodyDesign(bare, d));
const lift = (d: BodyDesignConfig, part: 'arm' | 'leg', t: number, deg: number): number =>
  createAnatomyField(resolveBodyDesign(d).anatomy)(part, 'left', t)?.(deg * DEG, R) ?? 0;
const maxLift = (d: BodyDesignConfig, part: 'arm' | 'leg', t: number): number =>
  Math.max(...Array.from({ length: 72 }, (_, i) => lift(d, part, t, i * 5 - 180)));

describe.each(COMBOS)('cơ tay chân %s / %s', (archetype, bodyType) => {
  const d = defaultBodyDesign(archetype, bodyType);
  const b = HEROIC_BASELINE[bodyType];
  const elbowT = b.upperArm / (b.upperArm + b.forearm);
  const kneeT = b.thigh / (b.thigh + b.lowerLeg);

  it('biceps ở mặt trước cánh tay trên', () => expect(lift(d, 'arm', 0.3, 0)).toBeGreaterThan(0));

  it('khuỷu và gối không có cục cơ (± 0.02)', () => {
    for (const dt of [-0.02, 0, 0.02]) {
      expect(maxLift(d, 'arm', elbowT + dt)).toBeLessThan(0.001);
      expect(maxLift(d, 'leg', kneeT + dt)).toBeLessThan(0.001);
    }
  });

  it('bắp chân to nhất ở t 0.6–0.72; mông là điểm sau nhất của hông; delta làm vai nhô lên', () => {
    const m = model(d);
    const s = m.surface;
    const girth = (t: number) => {
      const pts = Array.from({ length: 48 }, (_, i) => new THREE.Vector3(...s.pointAt({ part: 'leg', side: 'left', t, angleDeg: i * 7.5 }).position));
      return pts.reduce((sum, p, i) => sum + p.distanceTo(pts[(i + 1) % pts.length]!), 0);
    };
    let best = { t: 0, g: 0 };
    for (let t = kneeT + 0.03; t <= 0.95; t += 0.01) {
      const g = girth(t);
      if (g > best.g) best = { t, g };
    }
    expect(best.t).toBeGreaterThanOrEqual(0.6);
    expect(best.t).toBeLessThanOrEqual(0.72);

    let rear = { t: 0, z: Infinity };
    for (let t = 0.02; t <= 0.5; t += 0.01) {
      for (const deg of [140, 150, 160, 170, 180]) {
        const z = s.pointAt({ part: 'torso', t, angleDeg: deg }).position[2];
        if (z < rear.z) rear = { t, z };
      }
    }
    expect(rear.t).toBeLessThan(0.2);

    const top = (t: number) => s.pointAt({ part: 'arm', side: 'left', t, angleDeg: 90 }).position[1] - s.ringAt('arm', 'left', t).center[1];
    expect(top(0.17)).toBeGreaterThan(top(0.42) * 1.12);
  });

  it('lưới vẫn kín; tay không cắm vào thân; hai đùi không lấn qua đường giữa', () => {
    const m = model(d);
    const topo = analyzeTopology(m.bodyGeometry);
    expect(topo.nonManifoldEdges).toBe(0);
    expect(topo.inconsistentEdges).toBe(0);
    expect(topo.components).toBe(1);
    const g = m.bodyGeometry;
    const pos = g.getAttribute('position');
    const region = g.getAttribute('region');
    const chainT = g.getAttribute('chainT');
    const torsoDistance = partDistance(m.surface, { part: 'torso' });
    const p = new THREE.Vector3();
    const armStart = Math.min(...Array.from({ length: pos.count }, (_, i) => (region.getX(i) === BodyRegion.ArmL ? chainT.getX(i) : Infinity)));
    for (let i = 0; i < pos.count; i++) {
      const r = region.getX(i);
      if ((r === BodyRegion.ArmL || r === BodyRegion.ArmR) && chainT.getX(i) > armStart + 0.05) {
        expect(torsoDistance(p.set(pos.getX(i), pos.getY(i), pos.getZ(i)))).toBeGreaterThan(0);
      }
      if (r === BodyRegion.LegL) expect(pos.getX(i)).toBeGreaterThan(-0.002);
      if (r === BodyRegion.LegR) expect(pos.getX(i)).toBeLessThan(0.002);
    }
  });
});

describe('Review Focus #1: tay chân to tối đa', () => {
  it.each(BODY_TYPES)('%s: armVolume/legVolume 1.6, cơ tay/đùi 2 → lưới kín, đùi không lấn đường giữa', (bodyType) => {
    const d: BodyDesignConfig = {
      ...defaultBodyDesign('bruiser', bodyType),
      proportions: { armVolume: 1.6, legVolume: 1.6 },
      muscles: { arms: 2, thighs: 2, shoulders: 2, calves: 2 },
    };
    const m = model(d);
    const topo = analyzeTopology(m.bodyGeometry);
    expect(topo.nonManifoldEdges).toBe(0);
    expect(topo.inconsistentEdges).toBe(0);
    const pos = m.bodyGeometry.getAttribute('position');
    const region = m.bodyGeometry.getAttribute('region');
    for (let i = 0; i < pos.count; i++) {
      if (region.getX(i) === BodyRegion.LegL) expect(pos.getX(i)).toBeGreaterThan(-0.002);
    }
  });
});
