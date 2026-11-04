/** Cấu hình thân theo phong cách Anatomical Body System (Heroic Smooth). */

export const ARCHETYPE_IDS = ['tank', 'fighter', 'assassin', 'mage', 'bruiser'] as const;
export type Archetype = (typeof ARCHETYPE_IDS)[number];

export const BODY_TYPES = ['masculine', 'feminine'] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const MUSCLE_GROUPS = ['chest', 'shoulders', 'arms', 'abdomen', 'back', 'glutes', 'thighs', 'calves'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const PROPORTION_KEYS = ['shoulderWidth', 'chestWidth', 'waistWidth', 'hipWidth', 'armVolume', 'legVolume'] as const;
export type ProportionKey = (typeof PROPORTION_KEYS)[number];

export const MUSCLE_DEFINITIONS = ['low', 'medium', 'high'] as const;
export type MuscleDefinition = (typeof MUSCLE_DEFINITIONS)[number];

export const SURFACE_RESOLUTIONS = ['low', 'medium', 'high'] as const;
export type SurfaceResolution = (typeof SURFACE_RESOLUTIONS)[number];

export interface BodyMaterialConfig {
  roughness: number;
  metalness: number;
  /** Độ tối thêm ở rãnh cơ (0 = không tô). */
  anatomicalContrast: number;
}

export interface BodyDesignConfig {
  version: 1;
  style: 'stylized-anatomical';
  surface: 'smooth';
  proportionPreset: 'heroic';
  muscleDefinition: MuscleDefinition;
  archetype: Archetype;
  bodyType: BodyType;
  /** Mét; mặc định theo archetype × bodyType. */
  height?: number;
  /** Hệ số nhân thêm lên archetype (1 = giữ nguyên). */
  proportions?: Partial<Record<ProportionKey, number>>;
  /** Hệ số khối cơ từng nhóm (1 = mặc định của archetype). */
  muscles?: Partial<Record<MuscleGroup, number>>;
  surfaceSettings?: { smoothness?: number; muscleSeparation?: number; surfaceResolution?: SurfaceResolution };
  material?: Partial<BodyMaterialConfig>;
}

export interface Range {
  min: number;
  max: number;
}

/** Giới hạn của mọi số trong bodyDesign; schema sinh từ đây. */
export const BODY_DESIGN_LIMITS = {
  height: { min: 1.4, max: 2.4 },
  proportion: { min: 0.6, max: 1.6 },
  muscle: { min: 0, max: 2 },
  smoothness: { min: 0, max: 1 },
  muscleSeparation: { min: 0, max: 1 },
  roughness: { min: 0, max: 1 },
  metalness: { min: 0, max: 1 },
  anatomicalContrast: { min: 0, max: 0.5 },
} as const satisfies Record<string, Range>;

export const DEFAULT_BODY_MATERIAL: BodyMaterialConfig = { roughness: 0.62, metalness: 0, anatomicalContrast: 0.18 };
export const DEFAULT_SMOOTHNESS = 0.85;
export const DEFAULT_SURFACE_RESOLUTION: SurfaceResolution = 'high';

export const clampTo = (value: number, range: Range): number => Math.min(range.max, Math.max(range.min, value));
