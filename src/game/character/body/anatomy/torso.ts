import type { AnatomyConfig } from '../config/resolveBodyDesign';
import type { MuscleGroup } from '../config/BodyDesign';
import type { MuscleDef, MuscleParameters } from './MuscleField';

/*
 * Thư viện cơ thân trên, cách điệu (không phải giải phẫu y khoa). Toạ độ chuẩn hoá theo thân:
 * t: 0 = đáy chậu, 1 = gốc cổ; góc: 0° = trước (+Z), 90° = bên trái nhân vật (+X), 180° = sau lưng.
 * depth là tỷ lệ bán kính tiết diện tại chỗ, sau đó nhân hệ số nhóm cơ × mức muscleDefinition.
 */

type Shape = Omit<MuscleDef, 'part' | 'group' | 'mirror' | keyof MuscleParameters> & Partial<MuscleParameters> & { width: number; height: number; depth: number };

const DEFAULTS: MuscleParameters = {
  width: 20, height: 0.05, depth: 0.05, bulge: 0.4, taper: 0, separation: 0.5, startOffset: 0, endOffset: 0, smoothness: 0.6,
};

const make = (group: MuscleGroup, mirror: boolean, s: Shape): Omit<MuscleDef, 'depth'> & { depth: number } => ({
  ...DEFAULTS,
  ...s,
  part: 'torso',
  group,
  mirror,
});

/*
 * Mốc t theo giải phẫu (đã đối chiếu chiều cao thật: vai ≈ 0.82H, đầu ngực ≈ 0.72H, rốn ≈ 0.6H, đáy chậu ≈ 0.51H):
 * cơ ngực t 0.65–0.85, bụng trên ngay dưới ngực, rốn ≈ t 0.3.
 */
const MASCULINE: MuscleDef[] = [
  // Ngực: hai khối cơ ngực lớn, rãnh xương ức ở giữa; mép dưới rõ nhờ đỉnh lệch xuống (taper âm).
  make('chest', true, { id: 'pectoralis', t: 0.75, angleDeg: 27, width: 31, height: 0.1, depth: 0.2, bulge: 0.45, taper: -0.3, separation: 0.8, endOffset: 0.2 }),
  // Bụng: cơ thẳng bụng 3 hàng × 2 bên (các hàng chồng nhẹ lên nhau để rãnh ngang hình thành mềm), bụng dưới, cơ chéo, cơ răng cưa.
  ...[0.58, 0.49, 0.4].map((t, i) =>
    make('abdomen', true, { id: `rectus-${i + 1}`, t, angleDeg: 9, width: 12, height: 0.056, depth: 0.075, bulge: 0.5, separation: 0.85 }),
  ),
  make('abdomen', true, { id: 'lower-abdomen', t: 0.27, angleDeg: 8, width: 13, height: 0.08, depth: 0.045, bulge: 0.3, separation: 0.5 }),
  make('abdomen', true, { id: 'oblique', t: 0.38, angleDeg: 62, width: 22, height: 0.12, depth: 0.07, bulge: 0.4, separation: 0.5 }),
  ...[0.61, 0.68].map((t, i) =>
    make('abdomen', true, { id: `serratus-${i + 1}`, t, angleDeg: 76, width: 10, height: 0.036, depth: 0.045, bulge: 0.3, separation: 0.6 }),
  ),
  // Lưng: cơ thang, cơ lưng rộng (hình chữ V), cơ trám, cơ dựng sống (rãnh sống lưng).
  make('back', false, { id: 'trapezius', t: 0.92, angleDeg: 180, width: 40, height: 0.1, depth: 0.14, bulge: 0.5, separation: 0.3 }),
  make('back', true, { id: 'trapezius-upper', t: 0.97, angleDeg: 140, width: 25, height: 0.05, depth: 0.12, bulge: 0.5, separation: 0.2 }),
  make('back', true, { id: 'latissimus', t: 0.66, angleDeg: 125, width: 32, height: 0.15, depth: 0.14, bulge: 0.4, taper: 0.3, separation: 0.5 }),
  make('back', true, { id: 'rhomboid', t: 0.77, angleDeg: 160, width: 18, height: 0.07, depth: 0.08, bulge: 0.3, separation: 0.6 }),
  make('back', true, { id: 'erector', t: 0.32, angleDeg: 168, width: 10, height: 0.15, depth: 0.09, bulge: 0.5, separation: 0.9 }),
];

const FEMININE: MuscleDef[] = [
  // Ngực: cơ ngực mỏng + khối ngực mềm, cách điệu, đầy phía dưới, tách nhẹ ở giữa.
  make('chest', true, { id: 'pectoralis', t: 0.77, angleDeg: 27, width: 30, height: 0.09, depth: 0.1, bulge: 0.45, taper: -0.3, separation: 0.4, endOffset: 0.2 }),
  make('chest', true, { id: 'bust', t: 0.7, angleDeg: 21, width: 26, height: 0.085, depth: 0.24, bulge: 0.5, taper: -0.1, separation: 0.3, smoothness: 0.9 }),
  // Bụng: vẫn 3 hàng nhưng nông hơn, cơ chéo mềm.
  ...[0.55, 0.47, 0.39].map((t, i) =>
    make('abdomen', true, { id: `rectus-${i + 1}`, t, angleDeg: 9, width: 12, height: 0.05, depth: 0.045, bulge: 0.5, separation: 0.7 }),
  ),
  make('abdomen', true, { id: 'lower-abdomen', t: 0.27, angleDeg: 8, width: 13, height: 0.08, depth: 0.03, bulge: 0.3, separation: 0.4 }),
  make('abdomen', true, { id: 'oblique', t: 0.42, angleDeg: 62, width: 22, height: 0.12, depth: 0.05, bulge: 0.4, separation: 0.3 }),
  // Lưng: cơ thang thấp hơn, cơ lưng rộng gọn hơn.
  make('back', false, { id: 'trapezius', t: 0.93, angleDeg: 180, width: 38, height: 0.09, depth: 0.09, bulge: 0.5, separation: 0.3 }),
  make('back', true, { id: 'trapezius-upper', t: 0.975, angleDeg: 140, width: 22, height: 0.045, depth: 0.07, bulge: 0.5, separation: 0.2 }),
  make('back', true, { id: 'latissimus', t: 0.67, angleDeg: 125, width: 30, height: 0.14, depth: 0.1, bulge: 0.4, taper: 0.3, separation: 0.4 }),
  make('back', true, { id: 'rhomboid', t: 0.77, angleDeg: 160, width: 16, height: 0.06, depth: 0.05, bulge: 0.3, separation: 0.5 }),
  make('back', true, { id: 'erector', t: 0.34, angleDeg: 168, width: 10, height: 0.15, depth: 0.07, bulge: 0.5, separation: 0.9 }),
];

/** Các khối cơ thân trên của một dáng thân; depth đã nhân hệ số nhóm và mức muscleDefinition. */
export const torsoMuscles = (anatomy: AnatomyConfig): MuscleDef[] =>
  (anatomy.bodyType === 'feminine' ? FEMININE : MASCULINE).map((m) => ({
    ...m,
    depth: m.depth * anatomy.muscleScale[m.group] * anatomy.definition,
  }));
