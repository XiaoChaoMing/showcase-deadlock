import type { AnatomyConfig } from '../config/resolveBodyDesign';
import type { MuscleGroup } from '../config/BodyDesign';
import type { BodyPart } from '../../definitions/HeroDefinition';
import type { MuscleDef, MuscleParameters } from './MuscleField';

/*
 * Cơ vai, tay, mông, chân (cách điệu). Toạ độ theo khung bộ phận:
 *  - tay (arm): t 0 = khớp vai → 1 = cổ tay, khuỷu ≈ 0.53; góc 0° = trước (+Z), 90° = trên (+Y), 180° = sau, −90° = dưới.
 *    Ở T-Pose lòng bàn tay úp xuống: nhóm gấp cẳng tay ở dưới (−90°), nhóm duỗi ở trên (+90°).
 *  - chân (leg): t 0 = khớp hông → 1 = cổ chân, gối ≈ 0.51; góc 0° = trước, 90° = phía ngoài, 180° = sau, −90° = phía trong.
 *  - mông nằm trên thân (torso t thấp, sau lưng) và lan xuống đầu đùi phía sau.
 * Khớp gập (khuỷu, gối ± 0.02) không có khối cơ nào để gập không bị cộm.
 */

type Shape = Partial<MuscleParameters> & { id: string; t: number; angleDeg: number; width: number; height: number; depth: number };

const DEFAULTS: MuscleParameters = {
  width: 30, height: 0.1, depth: 0.1, bulge: 0.45, taper: 0, separation: 0.4, startOffset: 0, endOffset: 0, smoothness: 0.6,
};

const make = (part: BodyPart, group: MuscleGroup, s: Shape, mirror = false): MuscleDef => ({ ...DEFAULTS, ...s, part, group, mirror });

const SHOULDERS: MuscleDef[] = [
  make('arm', 'shoulders', { id: 'deltoid-anterior', t: 0.17, angleDeg: 35, width: 45, height: 0.11, depth: 0.16, bulge: 0.55, separation: 0.3 }),
  make('arm', 'shoulders', { id: 'deltoid-lateral', t: 0.17, angleDeg: 95, width: 45, height: 0.12, depth: 0.2, bulge: 0.6, separation: 0.3 }),
  make('arm', 'shoulders', { id: 'deltoid-posterior', t: 0.17, angleDeg: 155, width: 45, height: 0.11, depth: 0.15, bulge: 0.55, separation: 0.3 }),
];

const ARMS: MuscleDef[] = [
  make('arm', 'arms', { id: 'biceps', t: 0.32, angleDeg: 10, width: 45, height: 0.13, depth: 0.18, bulge: 0.5, taper: 0.1, separation: 0.5 }),
  make('arm', 'arms', { id: 'triceps-long', t: 0.3, angleDeg: -160, width: 35, height: 0.15, depth: 0.15, bulge: 0.45, separation: 0.5 }),
  make('arm', 'arms', { id: 'triceps-lateral', t: 0.27, angleDeg: 150, width: 30, height: 0.12, depth: 0.12, bulge: 0.45, separation: 0.5 }),
  make('arm', 'arms', { id: 'brachialis', t: 0.43, angleDeg: 50, width: 25, height: 0.05, depth: 0.07, bulge: 0.3, separation: 0.3 }),
  make('arm', 'arms', { id: 'forearm-flexors', t: 0.69, angleDeg: -80, width: 50, height: 0.13, depth: 0.13, bulge: 0.4, taper: -0.4, separation: 0.4 }),
  make('arm', 'arms', { id: 'forearm-extensors', t: 0.68, angleDeg: 80, width: 50, height: 0.12, depth: 0.12, bulge: 0.4, taper: -0.4, separation: 0.4 }),
  make('arm', 'arms', { id: 'brachioradialis', t: 0.64, angleDeg: 20, width: 25, height: 0.08, depth: 0.1, bulge: 0.4, taper: -0.3, separation: 0.3 }),
];

const GLUTES: MuscleDef[] = [
  make('torso', 'glutes', { id: 'gluteus', t: 0.12, angleDeg: 150, width: 35, height: 0.12, depth: 0.2, bulge: 0.6, separation: 0.5 }, true),
  make('leg', 'glutes', { id: 'gluteus-lower', t: 0.06, angleDeg: 175, width: 45, height: 0.1, depth: 0.15, bulge: 0.5, separation: 0.3 }),
];

const THIGHS: MuscleDef[] = [
  make('leg', 'thighs', { id: 'vastus-lateralis', t: 0.3, angleDeg: 70, width: 40, height: 0.18, depth: 0.14, bulge: 0.45, taper: 0.2, separation: 0.5 }),
  make('leg', 'thighs', { id: 'vastus-medialis', t: 0.4, angleDeg: -45, width: 30, height: 0.085, depth: 0.14, bulge: 0.55, taper: 0.5, separation: 0.5 }),
  make('leg', 'thighs', { id: 'rectus-femoris', t: 0.3, angleDeg: 5, width: 30, height: 0.18, depth: 0.12, bulge: 0.45, separation: 0.5 }),
  make('leg', 'thighs', { id: 'hamstrings', t: 0.3, angleDeg: 180, width: 55, height: 0.18, depth: 0.12, bulge: 0.4, separation: 0.4 }),
];

const CALVES: MuscleDef[] = [
  make('leg', 'calves', { id: 'gastrocnemius-medial', t: 0.66, angleDeg: -150, width: 40, height: 0.1, depth: 0.2, bulge: 0.5, taper: -0.3, separation: 0.5 }),
  make('leg', 'calves', { id: 'gastrocnemius-lateral', t: 0.65, angleDeg: 150, width: 38, height: 0.09, depth: 0.16, bulge: 0.5, taper: -0.3, separation: 0.5 }),
  make('leg', 'calves', { id: 'tibialis', t: 0.67, angleDeg: 25, width: 25, height: 0.13, depth: 0.07, bulge: 0.4, separation: 0.4 }),
  make('leg', 'calves', { id: 'soleus', t: 0.78, angleDeg: 180, width: 60, height: 0.1, depth: 0.06, bulge: 0.4, separation: 0.2 }),
];

/** Thân nữ: delta và biceps nhỏ hơn, mông tròn hơn, bắp chân cao và thon hơn. */
const feminize = (m: MuscleDef): MuscleDef => {
  if (m.group === 'shoulders' || m.id === 'biceps') return { ...m, depth: m.depth * 0.75 };
  if (m.group === 'glutes') return { ...m, bulge: Math.min(1, m.bulge + 0.2) };
  if (m.id.startsWith('gastrocnemius')) return { ...m, t: m.t + 0.02, width: m.width - 5 };
  return m;
};

const ALL = [...SHOULDERS, ...ARMS, ...GLUTES, ...THIGHS, ...CALVES];

/** Cơ vai, tay, mông, chân; depth đã nhân hệ số nhóm và mức muscleDefinition. */
export const limbMuscles = (anatomy: AnatomyConfig): MuscleDef[] =>
  ALL.map((m) => (anatomy.bodyType === 'feminine' ? feminize(m) : m)).map((m) => ({
    ...m,
    depth: m.depth * anatomy.muscleScale[m.group] * anatomy.definition,
  }));
