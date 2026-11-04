import type { AnatomyConfig } from '../config/resolveBodyDesign';
import { createMuscleField, type DisplacementProvider, type MuscleDef } from './MuscleField';
import { torsoMuscles } from './torso';
import { limbMuscles } from './limbs';

/** Mọi khối cơ của một thân: thân trên, vai, tay, mông, chân. */
export const anatomyMuscles = (anatomy: AnatomyConfig): MuscleDef[] => [...torsoMuscles(anatomy), ...limbMuscles(anatomy)];

/** Trường cơ của thân theo bodyDesign, dùng cho BodySurface. */
export const createAnatomyField = (anatomy: AnatomyConfig): DisplacementProvider =>
  createMuscleField(anatomyMuscles(anatomy), { separation: anatomy.separation, smoothness: anatomy.smoothness });
