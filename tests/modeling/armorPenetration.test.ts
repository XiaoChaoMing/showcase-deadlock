import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import type { HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { SAMPLE_HEROES } from '../helpers/heroes';
import { createInsideTester } from '../helpers/meshInside';

const TOLERANCE = 0.005;
const HEROES: Array<[string, HeroDefinition]> = SAMPLE_HEROES;
const CONFORMING = new Set(['plate', 'band', 'shell', 'box']);

/** Review Focus #5 (đo trên lưới thân thật): giáp ôm thân không được chìm vào thân quá 5 mm lúc bind. */
describe.each(HEROES)('giáp không xuyên thân thật: %s', (_name, hero) => {
  const model = buildCharacterModel(hero);
  const tester = createInsideTester(model.bodyGeometry);
  const kinds = new Map(hero.equipment.map((e) => [e.id, e.kind]));

  it('mọi plate/band/shell/box', () => {
    const problems: string[] = [];
    for (const part of model.equipment) {
      if (!CONFORMING.has(kinds.get(part.id) ?? '')) continue;
      part.object.updateMatrixWorld(true);
      const seen = new Set<string>();
      let worst = 0;
      part.object.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const pos = o.geometry.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          const k = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
          if (seen.has(k)) continue;
          seen.add(k);
          if (tester.inside(v)) worst = Math.max(worst, tester.depth(v));
        }
      });
      if (worst > TOLERANCE) problems.push(`${part.id}: ${(worst * 1000).toFixed(0)} mm`);
    }
    expect(problems).toEqual([]);
  });
});
