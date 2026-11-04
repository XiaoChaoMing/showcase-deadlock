import { ARCHETYPE_IDS, type Archetype } from './BodyDesign';

export { ARCHETYPE_IDS };

/** Hệ số nhân của archetype lên tỷ lệ heroic chuẩn (spec mục 1.3 "Archetype presets"). */
export interface ArchetypePreset {
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  arm: number;
  leg: number;
  /** Hệ số khối cơ chung. */
  muscle: number;
  /** Độ tách cơ mặc định (0–1). */
  separation: number;
  /** Chiều cao mặc định của thân nam (mét); thân nữ × 0.95. */
  height: number;
}

export const ARCHETYPES: Readonly<Record<Archetype, Readonly<ArchetypePreset>>> = Object.freeze({
  tank: Object.freeze({ shoulder: 1.25, chest: 1.22, waist: 1.28, hip: 1.15, arm: 1.3, leg: 1.3, muscle: 1.3, separation: 0.4, height: 1.95 }),
  fighter: Object.freeze({ shoulder: 1.1, chest: 1.1, waist: 0.95, hip: 1.0, arm: 1.12, leg: 1.1, muscle: 1.15, separation: 0.7, height: 1.85 }),
  assassin: Object.freeze({ shoulder: 1.0, chest: 0.97, waist: 0.88, hip: 0.95, arm: 0.95, leg: 0.97, muscle: 1.0, separation: 0.85, height: 1.78 }),
  mage: Object.freeze({ shoulder: 0.92, chest: 0.92, waist: 0.9, hip: 0.95, arm: 0.85, leg: 0.88, muscle: 0.7, separation: 0.5, height: 1.8 }),
  bruiser: Object.freeze({ shoulder: 1.32, chest: 1.15, waist: 1.1, hip: 1.1, arm: 1.38, leg: 1.3, muscle: 1.25, separation: 0.45, height: 1.92 }),
});

export const FEMININE_HEIGHT_RATIO = 0.95;
