import { describe, expect, it } from 'vitest';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { buildIndexedBody } from '../../src/game/character/modeling/UnifiedBody';
import type { BodyShape, HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { kestrel } from '../fixtures/kestrel';
import { hasNaN } from '../helpers/geometry';
import { resolvedOf, SAMPLE_HEROES } from '../helpers/heroes';
import { analyzeTopology } from '../helpers/topology';

const indexedOf = (hero: HeroDefinition, shape: BodyShape = hero.bodyShape) => {
  const { proportions, layout } = resolvedOf(hero);
  return buildIndexedBody(createBodySurface(proportions, shape, layout), shape);
};

const tiny = (s: BodyShape['arm']) => ({ ...s, squareness: 6, sections: s.sections.map((x) => ({ ...x, width: 0.005, depth: 0.005 })) });
const variants: Array<[string, HeroDefinition, BodyShape]> = [
  ...SAMPLE_HEROES.map(([n, h]): [string, HeroDefinition, BodyShape] => [n, h, h.bodyShape]),
  ['kestrel 16 cạnh', kestrel, { ...kestrel.bodyShape, radialSegments: 16 }],
  ['kestrel 32 cạnh, smooth', kestrel, { ...kestrel.bodyShape, radialSegments: 32, shading: 'smooth' }],
  ['biên schema', kestrel, {
    ...kestrel.bodyShape,
    torso: { squareness: 6, sections: kestrel.bodyShape.torso.sections.map((x) => ({ ...x, width: 1.5 })) },
    head: { ...kestrel.bodyShape.head, squareness: 6 },
    arm: tiny(kestrel.bodyShape.arm),
    leg: tiny(kestrel.bodyShape.leg),
  }],
];

describe.each(variants)('thân liền khối: %s', (_name, hero, shape) => {
  const geometry = indexedOf(hero, shape);
  const topo = analyzeTopology(geometry);

  it('là một khối duy nhất (không có bộ phận rời hay lồng vào nhau)', () => expect(topo.components).toBe(1));
  it('kín: mỗi cạnh dùng chung bởi đúng 2 tam giác', () => expect(topo.nonManifoldEdges).toBe(0));
  it('mọi mặt quay cùng một hướng', () => expect(topo.inconsistentEdges).toBe(0));
  it('mặt quay ra ngoài (thể tích dương)', () => expect(topo.signedVolume).toBeGreaterThan(0));
  it('không NaN', () => expect(hasNaN(geometry.getAttribute('position').array)).toBe(false));
});
