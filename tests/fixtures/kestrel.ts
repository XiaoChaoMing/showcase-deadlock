import kestrelRaw from '../../heroes/kestrel/hero.json';
import type { CharacterProportions, HeroDefinition } from '../../src/game/character/definitions/HeroDefinition';

/** Bản thô (chưa kiểm tra) để test mutate. */
export const kestrelJson: unknown = kestrelRaw;
export const kestrel = kestrelRaw as unknown as HeroDefinition;
export const kestrelProportions: CharacterProportions = kestrel.proportions;
