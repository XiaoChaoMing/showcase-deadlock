import type { BodyPart, Side } from '../../definitions/HeroDefinition';
import type { MuscleGroup } from '../config/BodyDesign';

/** Tham số một khối cơ (spec phong-cach-thiet-ke mục 2.4). */
export interface MuscleParameters {
  /** Nửa độ rộng quanh bộ phận (độ). */
  width: number;
  /** Nửa chiều dài dọc bộ phận (theo t). */
  height: number;
  /** Độ nhô tại đỉnh, tính theo bán kính trung bình của tiết diện tại chỗ đó. */
  depth: number;
  /** 0 = đỉnh tròn nhọn, 1 = đỉnh phẳng đầy. */
  bulge: number;
  /** −1..1: đỉnh lệch về đầu t nhỏ (−) hay t lớn (+). */
  taper: number;
  /** 0–1: độ sâu rãnh với khối kề bên. */
  separation: number;
  /** 0–0.9: cắt bớt phía t nhỏ / t lớn (tỷ lệ của height). */
  startOffset: number;
  endOffset: number;
  /** 0–1: độ mềm khi hoà với khối khác. */
  smoothness: number;
}

export interface MuscleDef extends MuscleParameters {
  id: string;
  group: MuscleGroup;
  part: BodyPart;
  /** Tâm theo t của bộ phận. */
  t: number;
  /** Hướng tâm quanh bộ phận (cùng quy ước góc với trang bị). */
  angleDeg: number;
  /** Trên torso/neck/head: sinh thêm bản đối xứng ở −angleDeg. */
  mirror: boolean;
}

/** Trường dịch chuyển bề mặt: với một ring (part, side, t), trả hàm độ nhô (mét) theo góc và bán kính tại chỗ. */
export type DisplacementProvider = (part: BodyPart, side: Side | undefined, t: number) => ((theta: number, radius: number) => number) | undefined;

export interface MuscleFieldOptions {
  /** Hệ số độ tách cơ toàn thân 0–1 (nhân với separation của từng khối). */
  separation: number;
  /** Độ mềm hoà khối toàn thân 0–1. */
  smoothness: number;
}

const GROOVE_STRENGTH = 0.6;
const MIRRORED: readonly BodyPart[] = ['torso', 'neck', 'head'];

const angleGap = (a: number, b: number): number => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

/** Profile trơn C¹ ở mép: (1 − x^n)², n = 2 (đỉnh tròn) … 6 (đỉnh phẳng). */
const profile = (x: number, bulge: number): number => {
  if (x >= 1) return 0;
  const n = 2 + 4 * bulge;
  return (1 - x ** n) ** 2;
};

/** Khoảng cách chuẩn hoá dọc t (0 tại đỉnh, 1 ở mép), có lệch đỉnh và cắt hai đầu. */
const alongT = (m: MuscleDef, t: number): number => {
  const s = (t - m.t) / m.height;
  if (s < -(1 - m.startOffset) || s > 1 - m.endOffset) return 1;
  const peak = m.taper * 0.5;
  return s < peak ? (peak - s) / (1 + peak) : (s - peak) / (1 - peak);
};

const tRange = (m: MuscleDef): [number, number] => [m.t - m.height * (1 - m.startOffset), m.t + m.height * (1 - m.endOffset)];

/**
 * Hoà các khối cơ bằng smooth union (p-norm: bằng đúng một khối khi chỉ có một khối, không cộng dồn) rồi khoét rãnh
 * ở chỗ hai khối gặp nhau. Kết quả không bao giờ âm (rãnh không lõm dưới bề mặt thân trần).
 */
export const createMuscleField = (defs: MuscleDef[], opts: MuscleFieldOptions): DisplacementProvider => {
  const byPart = new Map<BodyPart, MuscleDef[]>();
  for (const m of defs) {
    if (m.depth <= 0) continue;
    const list = byPart.get(m.part) ?? [];
    list.push(m);
    byPart.set(m.part, list);
  }
  return (part, _side, t) => {
    const active = (byPart.get(part) ?? []).filter((m) => {
      const [lo, hi] = tRange(m);
      return t > lo && t < hi;
    });
    if (active.length === 0) return undefined;
    const along = active.map((m) => profile(alongT(m, t), m.bulge));
    const meanSmooth = active.reduce((sum, m) => sum + m.smoothness, 0) / active.length;
    const p = 12 - 8 * ((opts.smoothness + meanSmooth) / 2);
    return (theta, radius) => {
      const deg = (theta * 180) / Math.PI;
      const values: number[] = [];
      const seps: number[] = [];
      active.forEach((m, i) => {
        const centers = MIRRORED.includes(part) && m.mirror && angleGap(m.angleDeg, -m.angleDeg) > 1e-9 ? [m.angleDeg, -m.angleDeg] : [m.angleDeg];
        for (const c of centers) {
          const b = m.depth * radius * (along[i] ?? 0) * profile(angleGap(deg, c) / m.width, m.bulge);
          if (b > 0) {
            values.push(b);
            seps.push(m.separation);
          }
        }
      });
      if (values.length === 0) return 0;
      let sum = 0;
      for (const v of values) sum += v ** p;
      let d = sum ** (1 / p);
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const a = values[i]!;
          const b = values[j]!;
          const s = Math.max(seps[i]!, seps[j]!) * opts.separation;
          if (s > 0) d -= s * GROOVE_STRENGTH * ((2 * a * b) / (a + b));
        }
      }
      return Math.max(0, d);
    };
  };
};
