import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ARCHETYPE_IDS, BODY_TYPES, SURFACE_RESOLUTIONS, type Archetype, type BodyType } from '../../src/game/character/body/config/BodyDesign';
import { applyBodyDesign, defaultBodyDesign, resolveBodyDesign } from '../../src/game/character/body/config/resolveBodyDesign';
import { createAnatomyField } from '../../src/game/character/body/anatomy/anatomyField';
import { blendRadiusFor, overallSmoothingFor } from '../../src/game/character/body/surface/JunctionBlend';
import { flippedTriangleRatio, maxDihedralDeg, signedVolume, triangleCount } from '../../src/game/character/body/surface/SurfaceQuality';
import { buildBodyGeometry, BodyRegion } from '../../src/game/character/modeling/BodyGeometry';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { computeLayout, type CharacterLayout } from '../../src/game/character/definitions/CharacterLayout';
import { analyzeTopology } from '../helpers/topology';
import { kestrel } from '../fixtures/kestrel';

const COMBOS: Array<[Archetype, BodyType]> = ARCHETYPE_IDS.flatMap((a) => BODY_TYPES.map((b): [Archetype, BodyType] => [a, b]));
const HANDS_FEET = [BodyRegion.HandL, BodyRegion.HandR, BodyRegion.FootL, BodyRegion.FootR];

/** Góc nhị diện lớn nhất theo nhóm: nếp nách, nếp háng/đáy chậu (nếp tự nhiên), và phần còn lại của thân. */
const dihedralByZone = (g: THREE.BufferGeometry, L: CharacterLayout): { body: number; armpit: number; groin: number } => {
  const pos = g.getAttribute('position');
  const region = g.getAttribute('region');
  const [shX, shY] = L.joints.LeftUpperArm;
  const zone = (i: number): 'skip' | 'armpit' | 'groin' | 'body' => {
    if (HANDS_FEET.includes(region.getX(i))) return 'skip';
    const x = Math.abs(pos.getX(i));
    const y = pos.getY(i);
    if (x < 0.09 && y < L.hipY + 0.02 && y > L.hipY - 0.12) return 'groin';
    if (Math.abs(x - shX) < 0.07 && y < shY - 0.02 && y > shY - 0.12) return 'armpit';
    return 'body';
  };
  const result = { body: 0, armpit: 0, groin: 0 };
  const zoneRegion = new Float32Array(pos.count);
  for (const z of ['body', 'armpit', 'groin'] as const) {
    for (let i = 0; i < pos.count; i++) zoneRegion[i] = zone(i) === z ? 1 : 0;
    const tagged = g.clone();
    tagged.setAttribute('region', new THREE.BufferAttribute(zoneRegion.slice(), 1));
    result[z] = maxDihedralDeg(tagged, [], [1]);
    tagged.dispose();
  }
  return result;
};

describe('SurfaceQuality: thước đo', () => {
  it('khối hộp: góc nhị diện 90°, thể tích đúng, không mặt lật khi so với chính nó', () => {
    const box = new THREE.BoxGeometry(1, 2, 3);
    const welded = box.toNonIndexed();
    expect(signedVolume(box)).toBeCloseTo(6, 6);
    expect(maxDihedralDeg(box)).toBeLessThanOrEqual(90 + 1e-6);
    expect(flippedTriangleRatio(box, box)).toBe(0);
    expect(triangleCount(box)).toBe(12);
    welded.dispose();
  });
});

describe.each(COMBOS)('bề mặt thân %s / %s (high)', (archetype, bodyType) => {
  const hero = applyBodyDesign({ ...kestrel, equipment: [], sockets: [] }, defaultBodyDesign(archetype, bodyType));
  const model = buildCharacterModel(hero);
  const g = model.bodyGeometry;
  const anatomy = resolveBodyDesign(hero.bodyDesign!).anatomy;
  const surface = createBodySurface(model.proportions, hero.bodyShape, model.layout, createAnatomyField(anatomy));
  const unblended = buildBodyGeometry(surface, hero.bodyShape, { transitions: true, adaptive: true });

  it('liền mạch: không còn nếp gấp; thân ≤ 65°, nách ≤ 95°, háng ≤ 125° (nếp giữa hai đùi, không lật mặt)', () => {
    const z = dihedralByZone(g, model.layout);
    expect(z.body).toBeLessThanOrEqual(65);
    expect(z.armpit).toBeLessThanOrEqual(95);
    expect(z.groin).toBeLessThanOrEqual(125);
  });

  it('nối mềm không lật mặt, giữ thể tích (< 3%), lưới vẫn kín', () => {
    expect(flippedTriangleRatio(g, unblended)).toBe(0);
    expect(Math.abs(signedVolume(g) / signedVolume(unblended) - 1)).toBeLessThan(0.03);
    const topo = analyzeTopology(g);
    expect(topo.components).toBe(1);
    expect(topo.nonManifoldEdges).toBe(0);
    expect(topo.inconsistentEdges).toBe(0);
  });

  it('nối mềm làm dịu dưới cằm và gốc cổ', () => {
    expect(maxDihedralDeg(g, [], [BodyRegion.Head, BodyRegion.Neck])).toBeLessThan(maxDihedralDeg(unblended, [], [BodyRegion.Head, BodyRegion.Neck]));
  });

  it('số tam giác thân ở mức high nằm trong 20k–45k', () => {
    const n = triangleCount(g);
    expect(n).toBeGreaterThanOrEqual(20_000);
    expect(n).toBeLessThanOrEqual(45_000);
  });
});

describe('độ phân giải và đường cũ', () => {
  it('low < medium < high về số tam giác', () => {
    const counts = SURFACE_RESOLUTIONS.map((r) => {
      const hero = applyBodyDesign({ ...kestrel, equipment: [], sockets: [] }, { ...defaultBodyDesign('fighter', 'masculine'), surfaceSettings: { surfaceResolution: r } });
      return triangleCount(buildCharacterModel(hero).bodyGeometry);
    });
    expect(counts[0]).toBeLessThan(counts[1]!);
    expect(counts[1]).toBeLessThan(counts[2]!);
  });

  it('Kestrel kiểu cũ không qua vùng chuyển tiếp / làm mịn (dấu vân tay giữ nguyên ở v1Parity)', () => {
    const m = buildCharacterModel(kestrel);
    const plain = buildBodyGeometry(m.surface, kestrel.bodyShape);
    expect(Array.from(m.bodyGeometry.getAttribute('position').array)).toEqual(Array.from(plain.getAttribute('position').array));
    expect(computeLayout(m.proportions).hipY).toBeCloseTo(m.layout.hipY, 9);
    expect(blendRadiusFor(0.85)).toBeGreaterThan(0);
    expect(overallSmoothingFor(0)).toBe(0);
  });
});
