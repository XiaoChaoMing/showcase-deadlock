import { computeLayout } from '../../src/game/character/definitions/CharacterLayout';
import { resolveProportions } from '../../src/game/character/definitions/resolveProportions';
import { applyPreset, BODY_PRESETS, type BodyPresetName } from '../../src/game/character/definitions/presets';
import type { HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';
import { kestrel } from '../fixtures/kestrel';

export const PRESET_NAMES: BodyPresetName[] = ['athletic', 'heavy', 'slim', 'feminine'];

export const heroWithPreset = (name: BodyPresetName): HeroDefinition => applyPreset(kestrel, BODY_PRESETS[name]);

export const resolvedOf = (hero: HeroDefinition) => {
  const r = resolveProportions(hero.proportions);
  if (!r.ok) throw new Error(r.error);
  return { proportions: r.value, layout: computeLayout(r.value) };
};

/** Kestrel + 4 preset, kèm tên để dùng trong it.each. */
export const SAMPLE_HEROES: Array<[string, HeroDefinition]> = [
  ['kestrel', kestrel],
  ...PRESET_NAMES.map((n): [string, HeroDefinition] => [n, heroWithPreset(n)]),
];
