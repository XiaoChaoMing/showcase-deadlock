import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildProportionPreview } from '../../src/game/character/debug/ProportionPreview';
import { computeLayout } from '../../src/game/character/definitions/CharacterLayout';
import { resolveProportions } from '../../src/game/character/definitions/resolveProportions';
import { referenceProportions as kestrelProportions } from '../fixtures/reference';

describe('buildProportionPreview', () => {
  it('hình nhân cao đúng height và đối xứng', () => {
    const r = resolveProportions(kestrelProportions);
    if (!r.ok) throw new Error(r.error);
    const group = buildProportionPreview(computeLayout(r.value), r.value);
    const box = new THREE.Box3().setFromObject(group);
    expect(box.min.y).toBeCloseTo(0, 2);
    expect(box.max.y).toBeCloseTo(1.8, 2);
    expect(box.min.x).toBeCloseTo(-box.max.x, 6);
  });
});
