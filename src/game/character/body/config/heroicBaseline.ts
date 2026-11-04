import type { BodyType } from './BodyDesign';

/**
 * Tỷ lệ heroic chuẩn hoá theo chiều cao = 1. Số từ spec phong-cach-thiet-ke mục 1.3 (vai, ngực, eo, hông,
 * cánh tay trên, cẳng tay, đùi, cẳng chân); các số còn lại đặt theo plan (Task B2).
 * Bề ngang/bề dày là kích thước tiết diện thân trần, chưa có khối cơ.
 */
export interface HeroicBaseline {
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  lowerLeg: number;
  head: { height: number; width: number; depth: number };
  neck: { length: number; radius: number };
  torso: { length: number; chestDepth: number; waistDepth: number; pelvisDepth: number; /** t của eo hẹp nhất. */ waistT: number };
  handLength: number;
  foot: { length: number; height: number; width: number };
  /** Bề ngang tiết diện chi ở các mốc. */
  limb: { upperArm: number; forearm: number; wrist: number; thigh: number; knee: number; calf: number; ankle: number };
  /** Hệ số khối cơ chung và riêng cho mông. */
  muscle: number;
  glutes: number;
}

export const HEROIC_BASELINE: Record<BodyType, HeroicBaseline> = {
  masculine: {
    shoulder: 0.27,
    chest: 0.23,
    waist: 0.16,
    hip: 0.19,
    upperArm: 0.18,
    forearm: 0.16,
    thigh: 0.25,
    lowerLeg: 0.24,
    head: { height: 0.125, width: 0.1, depth: 0.117 },
    neck: { length: 0.039, radius: 0.039 },
    torso: { length: 0.314, chestDepth: 0.135, waistDepth: 0.105, pelvisDepth: 0.028, waistT: 0.42 },
    handLength: 0.089,
    foot: { length: 0.144, height: 0.039, width: 0.058 },
    limb: { upperArm: 0.085, forearm: 0.068, wrist: 0.035, thigh: 0.095, knee: 0.058, calf: 0.068, ankle: 0.04 },
    muscle: 1,
    glutes: 1,
  },
  feminine: {
    shoulder: 0.235,
    chest: 0.2,
    waist: 0.135,
    hip: 0.205,
    upperArm: 0.172,
    forearm: 0.152,
    thigh: 0.258,
    lowerLeg: 0.246,
    head: { height: 0.128, width: 0.097, depth: 0.112 },
    neck: { length: 0.042, radius: 0.031 },
    torso: { length: 0.305, chestDepth: 0.125, waistDepth: 0.095, pelvisDepth: 0.028, waistT: 0.5 },
    handLength: 0.084,
    foot: { length: 0.136, height: 0.037, width: 0.052 },
    limb: { upperArm: 0.07, forearm: 0.056, wrist: 0.03, thigh: 0.1, knee: 0.056, calf: 0.064, ankle: 0.036 },
    muscle: 0.8,
    glutes: 1.15,
  },
};
