import type { AnatomyConfig } from '../config/resolveBodyDesign';
import { createMuscleField, type DisplacementProvider, type MuscleDef } from './MuscleField';
import { torsoMuscles } from './torso';

/** Mọi khối cơ của một thân (B-M2: thân trên; tay chân thêm ở B-M4). */
export const anatomyMuscles = (anatomy: AnatomyConfig): MuscleDef[] => [...torsoMuscles(anatomy)];

/** Trường cơ của thân theo bodyDesign, dùng cho BodySurface. */
export const createAnatomyField = (anatomy: AnatomyConfig): DisplacementProvider =>
  createMuscleField(anatomyMuscles(anatomy), { separation: anatomy.separation, smoothness: anatomy.smoothness });
