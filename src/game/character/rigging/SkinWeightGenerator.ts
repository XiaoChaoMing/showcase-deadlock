import type * as THREE from 'three';
import { boneIndex, type BoneName } from '../definitions/BoneNames';
import type { CharacterLayout } from '../definitions/CharacterLayout';
import type { Vec3 } from '../definitions/HeroDefinition';
import { BodyRegion } from '../modeling/BodyRegions';
import { boneSegment, REGION_BONES } from './BoneMapping';

const MAX_INFLUENCES = 4;
const DEFAULT_POWER = 4;
const DISTANCE_EPSILON = 1e-4;
/** Weight nhỏ hơn mức này bị bỏ trước khi chuẩn hoá, để tránh "nhiễu" từ bone xa. */
const MIN_WEIGHT = 0.01;
/** Vertex lệch khỏi đường giữa quá mức này không nhận weight từ bone phía bên kia. */
const MIDLINE_TOLERANCE = 0.02;

/** Nửa độ rộng (m) dải hoà trộn tại từng khớp dọc chi: gốc chi, khớp giữa (khuỷu/gối), khớp cuối (cổ tay/cổ chân). */
const LIMB_BLEND = {
  arm: { root: 0.06, mid: 0.045, end: 0.04 },
  leg: { root: 0.07, mid: 0.05, end: 0.04 },
};

interface LimbChain {
  bones: [BoneName, BoneName, BoneName, BoneName];
  /** Toạ độ dọc chi (m) của ba khớp hoà trộn và nửa độ rộng tương ứng. */
  joints: [number, number, number];
  widths: [number, number, number];
  /** Đổi chainT của vertex thành toạ độ dọc chi (m). */
  along(region: BodyRegion, t: number): number;
}

const smoothstep = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Chuỗi chi của một vùng tay/bàn tay/chân; null với vùng khác (dùng khoảng cách tới bone). */
const limbChain = (region: BodyRegion, layout: CharacterLayout, rootS: Map<BodyRegion, number>): LimbChain | null => {
  const J = layout.joints;
  const len = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const armChain = (S: 'Left' | 'Right', armRegion: BodyRegion, handRegion: BodyRegion): LimbChain => {
    const upper = len(J[`${S}UpperArm`], J[`${S}LowerArm`]);
    const arm = upper + len(J[`${S}LowerArm`], J[`${S}Hand`]);
    const hand = len(J[`${S}Hand`], layout.handTip[S === 'Left' ? 'left' : 'right']);
    return {
      bones: [`${S}Shoulder`, `${S}UpperArm`, `${S}LowerArm`, `${S}Hand`],
      joints: [rootS.get(armRegion) ?? 0, upper, arm],
      widths: [LIMB_BLEND.arm.root, LIMB_BLEND.arm.mid, LIMB_BLEND.arm.end],
      along: (r, t) => (r === handRegion ? arm + t * hand : t * arm),
    };
  };
  const legChain = (S: 'Left' | 'Right', legRegion: BodyRegion): LimbChain => {
    const upper = len(J[`${S}UpperLeg`], J[`${S}LowerLeg`]);
    const leg = upper + len(J[`${S}LowerLeg`], J[`${S}Foot`]);
    return {
      bones: ['Hips', `${S}UpperLeg`, `${S}LowerLeg`, `${S}Foot`],
      joints: [rootS.get(legRegion) ?? 0, upper, leg],
      widths: [LIMB_BLEND.leg.root, LIMB_BLEND.leg.mid, LIMB_BLEND.leg.end],
      along: (_r, t) => t * leg,
    };
  };
  switch (region) {
    case BodyRegion.ArmL:
    case BodyRegion.HandL:
      return armChain('Left', BodyRegion.ArmL, BodyRegion.HandL);
    case BodyRegion.ArmR:
    case BodyRegion.HandR:
      return armChain('Right', BodyRegion.ArmR, BodyRegion.HandR);
    case BodyRegion.LegL:
      return legChain('Left', BodyRegion.LegL);
    case BodyRegion.LegR:
      return legChain('Right', BodyRegion.LegR);
    default:
      return null;
  }
};

/** Weight dọc chi: mỗi khớp có một dải smoothstep; tổng luôn bằng 1 (telescoping). */
const chainWeights = (chain: LimbChain, s: number): Array<{ bone: BoneName; w: number }> => {
  const S = chain.joints.map((c, i) => smoothstep((s - (c - chain.widths[i]!)) / (2 * chain.widths[i]!)));
  const [s1, s2, s3] = S as [number, number, number];
  return [
    { bone: chain.bones[0], w: 1 - s1 },
    { bone: chain.bones[1], w: s1 * (1 - s2) },
    { bone: chain.bones[2], w: s2 * (1 - s3) },
    { bone: chain.bones[3], w: s3 },
  ];
};

const distanceToSegment = (p: Vec3, a: Vec3, b: Vec3): number => {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const len2 = ab[0]! ** 2 + ab[1]! ** 2 + ab[2]! ** 2;
  const t = len2 > 0 ? Math.max(0, Math.min(1, (ap[0]! * ab[0]! + ap[1]! * ab[1]! + ap[2]! * ab[2]!) / len2)) : 0;
  return Math.hypot(ap[0]! - ab[0]! * t, ap[1]! - ab[1]! * t, ap[2]! - ab[2]! * t);
};

const wrongSide = (bone: BoneName, x: number): boolean =>
  (x > MIDLINE_TOLERANCE && bone.startsWith('Right')) || (x < -MIDLINE_TOLERANCE && bone.startsWith('Left'));

/**
 * Weight giải tích: trong số bone được phép của vùng, weight tỉ lệ 1 / khoảng cách^power tới đoạn bone;
 * giữ tối đa 4 bone mạnh nhất rồi chuẩn hoá tổng = 1.
 * Với tay/bàn tay/chân: weight theo vị trí dọc chi (chainT), mỗi khớp có một dải hoà trộn smoothstep;
 * gốc chi chia giữa xương đòn/Hips và bone đầu chi. Độ to của chi và khối cơ không làm lệch weight.
 */
export const generateSkinWeights = (
  geometry: THREE.BufferGeometry,
  layout: CharacterLayout,
  opts: { power?: number } = {},
): { skinIndex: Uint16Array; skinWeight: Float32Array } => {
  const power = opts.power ?? DEFAULT_POWER;
  const pos = geometry.getAttribute('position');
  const region = geometry.getAttribute('region');
  const chainT = geometry.getAttribute('chainT');
  const count = pos.count;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  const segments = new Map<BoneName, [Vec3, Vec3]>();
  for (const bones of Object.values(REGION_BONES)) {
    for (const b of bones) {
      const seg = boneSegment(b, layout);
      if (seg) segments.set(b, seg);
    }
  }

  // Toạ độ dọc chi của vòng gốc mỗi chi: dải hoà trộn gốc chi được đặt tại đó.
  const rootS = new Map<BodyRegion, number>();
  const minT = new Map<BodyRegion, number>();
  for (let v = 0; v < count; v++) {
    const r = region.getX(v) as BodyRegion;
    minT.set(r, Math.min(minT.get(r) ?? Infinity, chainT.getX(v)));
  }
  for (const [r, t] of minT) {
    const chain = limbChain(r, layout, new Map());
    if (chain) rootS.set(r, chain.along(r, t));
  }

  for (let v = 0; v < count; v++) {
    const r = region.getX(v) as BodyRegion;
    const p: Vec3 = [pos.getX(v), pos.getY(v), pos.getZ(v)];
    const chain = limbChain(r, layout, rootS);
    const candidates = chain
      ? chainWeights(chain, chain.along(r, chainT.getX(v))).sort((x, y) => y.w - x.w)
      : REGION_BONES[r]
          .filter((b) => !wrongSide(b, p[0]))
          .map((bone) => {
            const [a, b] = segments.get(bone)!;
            return { bone, w: 1 / (distanceToSegment(p, a, b) + DISTANCE_EPSILON) ** power };
          })
          .sort((x, y) => y.w - x.w)
          .slice(0, MAX_INFLUENCES);
    const total = candidates.reduce((sum, c) => sum + c.w, 0);
    const kept = candidates.filter((c, i) => i === 0 || c.w / total >= MIN_WEIGHT);
    const keptTotal = kept.reduce((sum, c) => sum + c.w, 0);
    kept.forEach((c, k) => {
      skinIndex[v * 4 + k] = boneIndex(c.bone);
      skinWeight[v * 4 + k] = c.w / keptTotal;
    });
  }
  return { skinIndex, skinWeight };
};
