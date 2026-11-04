export { BONE_NAMES, BONE_PARENT, type BoneName } from './definitions/BoneNames';
export type * from './definitions/HeroDefinition';
export { validateHero, type HeroError } from './definitions/validateHero';
export { loadHeroRegistry, type RegistryEntry } from './runtime/HeroRegistry';
export { buildCharacter, type CharacterInstance } from './runtime/CharacterFactory';
