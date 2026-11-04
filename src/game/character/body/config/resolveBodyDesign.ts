import type { BodyShape, CharacterProportions, Section } from '../../definitions/HeroDefinition';
import { ARCHETYPES, FEMININE_HEIGHT_RATIO } from './archetypes';
import {
  BODY_DESIGN_LIMITS,
  clampTo,
  DEFAULT_BODY_MATERIAL,
  DEFAULT_SMOOTHNESS,
  DEFAULT_SURFACE_RESOLUTION,
  MUSCLE_GROUPS,
  type BodyDesignConfig,
  type BodyMaterialConfig,
  type BodyType,
  type MuscleGroup,
  type ProportionKey,
  type SurfaceResolution,
} from './BodyDesign';
import { HEROIC_BASELINE } from './heroicBaseline';

/** Thông số giải phẫu đã resolve, dùng cho trường cơ (Task B4 trở đi). */
export interface AnatomyConfig {
  bodyType: BodyType;
  /** Hệ số độ nhô từng nhóm cơ (đã gồm archetype, bodyType và hệ số của hero). */
  muscleScale: Record<MuscleGroup, number>;
  /** low 0.5, medium 0.75, high 1. */
  definition: number;
  /** Độ tách cơ toàn thân 0–1. */
  separation: number;
  /** Độ mềm khi hoà khối 0–1. */
  smoothness: number;
  material: BodyMaterialConfig;
}

export interface ResolvedBody {
  proportions: CharacterProportions;
  bodyShape: BodyShape;
  anatomy: AnatomyConfig;
}

const DEFINITION_LEVEL = { low: 0.5, medium: 0.75, high: 1 } as const;
export const RESOLUTION: Record<SurfaceResolution, { radialSegments: 16 | 24 | 32; ringsPerMeter: number }> = {
  low: { radialSegments: 16, ringsPerMeter: 50 },
  medium: { radialSegments: 24, ringsPerMeter: 70 },
  high: { radialSegments: 32, ringsPerMeter: 90 },
};
/** Khớp hông nằm ở ±HIP_JOINT_X_RATIO × hipWidth (khớp với CharacterLayout). Đùi không được lấn qua đường giữa. */
const HIP_JOINT_X_RATIO = 0.3;
const THIGH_MIDLINE_MARGIN = 0.97;

const HEAD_PROFILE: Record<BodyType, Section[]> = {
  masculine: [
    { t: 0, width: 0.45, depth: 0.5, forward: 0.15 },
    { t: 0.2, width: 0.82, depth: 0.85, forward: 0.05 },
    { t: 0.5, width: 1, depth: 1, forward: 0 },
    { t: 0.75, width: 1, depth: 1, forward: 0 },
    { t: 0.92, width: 0.8, depth: 0.85, forward: 0 },
    { t: 1, width: 0.3, depth: 0.35, forward: 0 },
  ],
  feminine: [
    { t: 0, width: 0.38, depth: 0.45, forward: 0.15 },
    { t: 0.2, width: 0.74, depth: 0.82, forward: 0.05 },
    { t: 0.5, width: 0.97, depth: 1, forward: 0 },
    { t: 0.75, width: 1, depth: 1, forward: 0 },
    { t: 0.92, width: 0.82, depth: 0.86, forward: 0 },
    { t: 1, width: 0.32, depth: 0.36, forward: 0 },
  ],
};

const factor = (value: number | undefined): number => clampTo(value ?? 1, BODY_DESIGN_LIMITS.proportion);
const r4 = (x: number): number => Math.round(x * 1e6) / 1e6;
const section = (t: number, width: number, depth: number, forward = 0): Section => ({ t: r4(t), width: r4(width), depth: r4(depth), forward: r4(forward) });

/** bodyDesign → tỷ lệ (mét), tiết diện thân trần và thông số giải phẫu. Hàm thuần, tất định, không mutate đầu vào. */
export const resolveBodyDesign = (config: BodyDesignConfig): ResolvedBody => {
  const b = HEROIC_BASELINE[config.bodyType];
  const A = ARCHETYPES[config.archetype];
  const f = (k: ProportionKey): number => factor(config.proportions?.[k]);
  const H = clampTo(config.height ?? A.height * (config.bodyType === 'feminine' ? FEMININE_HEIGHT_RATIO : 1), BODY_DESIGN_LIMITS.height);

  const shoulder = b.shoulder * A.shoulder * f('shoulderWidth') * H;
  const chest = b.chest * A.chest * f('chestWidth') * H;
  const waist = b.waist * A.waist * f('waistWidth') * H;
  const hip = b.hip * A.hip * f('hipWidth') * H;
  const armV = A.arm * f('armVolume');
  const legV = A.leg * f('legVolume');

  // Các đoạn dọc chuẩn hoá để tổng đúng bằng chiều cao.
  const vertical = b.foot.height + b.lowerLeg + b.thigh + b.torso.length + b.neck.length + b.head.height;
  const k = H / vertical;
  const neckRadius = b.neck.radius * H * Math.sqrt(A.muscle);

  const proportions: CharacterProportions = {
    height: H,
    head: { width: b.head.width * H, height: b.head.height * k, depth: b.head.depth * H },
    neck: { length: b.neck.length * k, radius: neckRadius },
    torso: { length: b.torso.length * k, shoulderWidth: shoulder, hipWidth: hip, pelvisDepth: b.torso.pelvisDepth * H },
    arms: { upperLength: b.upperArm * H, lowerLength: b.forearm * H, handLength: b.handLength * H },
    legs: { upperLength: b.thigh * k, lowerLength: b.lowerLeg * k },
    foot: { length: b.foot.length * H, height: b.foot.height * k, width: b.foot.width * H },
  };

  // Thân: các mốc t theo thân trần (khối cơ thêm ở bước sau).
  const chestDepth = b.torso.chestDepth * H * Math.sqrt(A.chest * f('chestWidth'));
  const waistDepth = b.torso.waistDepth * H * Math.sqrt(A.waist * f('waistWidth'));
  const hipDepth = waistDepth * 1.1;
  const hipSection = hip * 1.07;
  const shoulderSection = shoulder * 0.93;
  const neckD = 2 * neckRadius;
  const wt = b.torso.waistT;
  const mid = (wt + 0.76) / 2;
  const torsoSections: Section[] = [
    section(0, hipSection * 0.95, hipDepth * 0.95),
    section(0.1, hipSection, hipDepth),
    section(wt, waist, waistDepth, 0.0055 * H),
    section(mid, (waist + chest) / 2, (waistDepth + chestDepth) / 2, 0.006 * H),
    section(0.76, chest, chestDepth, 0.0065 * H),
    section(0.88, shoulderSection, chestDepth * 0.87, 0.003 * H),
    section(0.95, shoulderSection * 0.75, chestDepth * 0.74),
    section(1, neckD * 1.35, neckD * 1.15),
  ];

  // Tay: vai → cổ tay; khuỷu tại e.
  const e = b.upperArm / (b.upperArm + b.forearm);
  const U = b.limb.upperArm * H * armV;
  const F = b.limb.forearm * H * armV;
  const Wr = b.limb.wrist * H * Math.sqrt(armV);
  const armSections: Section[] = [
    section(0, U * 1.05, U * 0.98),
    section(e * 0.35, U, U * 0.94),
    section(e * 0.8, U * 0.78, U * 0.74),
    section(e, F * 0.85, F * 0.85),
    section(e + (1 - e) * 0.25, F, F * 0.9),
    section(e + (1 - e) * 0.7, ((F + Wr) / 2) * 1.05, ((F + Wr) / 2) * 0.9),
    section(1, Wr, Wr * 0.85),
  ];

  // Chân: khớp hông → cổ chân; gối tại kt. Đùi bị giới hạn để hai chân không lấn qua đường giữa.
  const kt = b.thigh / (b.thigh + b.lowerLeg);
  const thighCap = 2 * HIP_JOINT_X_RATIO * hip * THIGH_MIDLINE_MARGIN;
  const T = Math.min(b.limb.thigh * H * legV, thighCap);
  const K = Math.min(b.limb.knee * H * legV, thighCap);
  const C = Math.min(b.limb.calf * H * legV, thighCap);
  const Ak = b.limb.ankle * H * Math.sqrt(legV);
  const legSections: Section[] = [
    section(0, T, Math.min(T * 1.05, thighCap * 1.1)),
    section(kt * 0.3, T, T * 0.98),
    section(kt * 0.8, T * 0.75, T * 0.74),
    section(kt, K, K),
    section(kt + (1 - kt) * 0.3, C, C * 1.02),
    section(kt + (1 - kt) * 0.75, ((C + Ak) / 2) * 0.95, ((C + Ak) / 2) * 0.95),
    section(1, Ak, Ak),
  ];

  const resolution = RESOLUTION[config.surfaceSettings?.surfaceResolution ?? DEFAULT_SURFACE_RESOLUTION];
  const bodyShape: BodyShape = {
    radialSegments: resolution.radialSegments,
    ringsPerMeter: resolution.ringsPerMeter,
    shading: 'smooth',
    torso: { squareness: 2.5, sections: torsoSections },
    neck: { taper: 0.85 },
    head: { squareness: 2.8, sections: HEAD_PROFILE[config.bodyType].map((s) => ({ ...s })) },
    arm: { squareness: 2.3, sections: armSections },
    leg: { squareness: 2.3, sections: legSections },
    hand: { width: proportions.arms.handLength * 0.56, thickness: proportions.arms.handLength * 0.28, squareness: 3.2 },
    foot: { squareness: 3.2, toeTaper: 0.75 },
    muscles: [],
  };

  const muscleScale = Object.fromEntries(
    MUSCLE_GROUPS.map((g) => [
      g,
      clampTo(A.muscle * b.muscle * (g === 'glutes' ? b.glutes : 1) * (config.muscles?.[g] ?? 1), BODY_DESIGN_LIMITS.muscle),
    ]),
  ) as Record<MuscleGroup, number>;
  const material: BodyMaterialConfig = {
    roughness: clampTo(config.material?.roughness ?? DEFAULT_BODY_MATERIAL.roughness, BODY_DESIGN_LIMITS.roughness),
    metalness: clampTo(config.material?.metalness ?? DEFAULT_BODY_MATERIAL.metalness, BODY_DESIGN_LIMITS.metalness),
    anatomicalContrast: clampTo(config.material?.anatomicalContrast ?? DEFAULT_BODY_MATERIAL.anatomicalContrast, BODY_DESIGN_LIMITS.anatomicalContrast),
  };
  const anatomy: AnatomyConfig = {
    bodyType: config.bodyType,
    muscleScale,
    definition: DEFINITION_LEVEL[config.muscleDefinition],
    separation: clampTo(config.surfaceSettings?.muscleSeparation ?? A.separation, BODY_DESIGN_LIMITS.muscleSeparation),
    smoothness: clampTo(config.surfaceSettings?.smoothness ?? DEFAULT_SMOOTHNESS, BODY_DESIGN_LIMITS.smoothness),
    material,
  };

  return { proportions, bodyShape, anatomy };
};
