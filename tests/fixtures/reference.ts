import type { CharacterProportions } from '../../src/game/character/definitions/HeroDefinition';

/** Bộ số đo cố định theo spec mục 6.4, dùng cho test toán học (không phụ thuộc hero.json). */
export const referenceProportions: CharacterProportions = {
  height: 1.8,
  head: { width: 0.21, height: 0.24, depth: 0.24 },
  neck: { length: 0.08, radius: 0.055 },
  torso: { length: 0.55, shoulderWidth: 0.46, hipWidth: 0.32, pelvisDepth: 0.09 },
  arms: { upperLength: 0.3, lowerLength: 0.28, handLength: 0.17 },
  legs: { upperLength: 0.44, lowerLength: 0.43 },
  foot: { length: 0.25, height: 0.07, width: 0.1 },
};
