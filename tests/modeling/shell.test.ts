import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildShellGeometries } from '../../src/game/character/modeling/equipment/ShellBuilder';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import type { ShellItem } from '../../src/game/character/definitions/HeroDefinition';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { kestrel, kestrelJson } from '../fixtures/kestrel';
import { resolvedOf } from '../helpers/heroes';

const { proportions, layout } = resolvedOf(kestrel);
const surface = createBodySurface(proportions, kestrel.bodyShape, layout);
const helmet: ShellItem = { id: 'h', kind: 'shell', coverage: 0.8, faceOpeningDeg: 110, thickness: 0.014, gap: 0.01, color: 'armor', crest: { height: 0.03, width: 0.03 } };

const verts = (g: THREE.BufferGeometry) => {
  const p = g.getAttribute('position');
  return Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p, i));
};
const nearest = (vs: THREE.Vector3[], q: THREE.Vector3) => Math.min(...vs.map((v) => v.distanceTo(q)));
const onHead = (t: number, angleDeg: number, out = 0.017) => new THREE.Vector3(...surface.pointAt({ part: 'head', t, angleDeg, standoff: out }).position);

describe('mũ hở mặt', () => {
  const { shell, crest } = buildShellGeometries(helmet, surface, layout, 16);
  const shellVerts = verts(shell);

  it('trán và đỉnh mũ phía trước được che kín', () => {
    expect(nearest(shellVerts, onHead(0.86, 0))).toBeLessThan(0.02);
  });

  it('vùng mặt phía trước để hở', () => {
    expect(nearest(shellVerts, onHead(0.45, 0))).toBeGreaterThan(0.03);
  });

  it('gờ mũ không chạy xuống trước mặt', () => {
    const lowestFront = Math.min(...verts(crest!).filter((v) => v.z > 0.05).map((v) => v.y));
    expect(lowestFront).toBeGreaterThan(onHead(0.7, 0).y - 0.01);
  });

  it('faceOpeningTop chỉnh được mép trên ô hở', () => {
    const low = verts(buildShellGeometries({ ...helmet, faceOpeningTop: 0.55 }, surface, layout, 16).shell);
    expect(nearest(low, onHead(0.62, 0))).toBeLessThan(0.02);
  });

  it('schema chấp nhận faceOpeningTop', () => {
    const h = structuredClone(kestrelJson) as Record<string, any>;
    h.equipment[2].faceOpeningDeg = 100;
    h.equipment[2].faceOpeningTop = 0.7;
    expect(validateHero(h).ok).toBe(true);
  });
});
