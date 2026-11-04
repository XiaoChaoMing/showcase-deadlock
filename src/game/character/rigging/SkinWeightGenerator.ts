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

/** Bán kính hoà trộn (m) cộng vào khoảng cách đo trên trục chi: quyết định độ rộng vùng chuyển tiếp ở khớp. */
const LIMB_BLEND_RADIUS = 0.04;

/** Trục của chi (đi qua tâm các vòng) cho vùng tay/bàn tay/chân; null với vùng khác. */
const limbAxis = (region: BodyRegion, layout: CharacterLayout): [Vec3, Vec3] | null => {
  const J = layout.joints;
  switch (region) {
    case BodyRegion.ArmL:
      return [J.LeftUpperArm, J.LeftHand];
    case BodyRegion.ArmR:
      return [J.RightUpperArm, J.RightHand];
    case BodyRegion.HandL:
      return [J.LeftHand, layout.handTip.left];
    case BodyRegion.HandR:
      return [J.RightHand, layout.handTip.right];
    case BodyRegion.LegL:
      return [J.LeftUpperLeg, J.LeftFoot];
    case BodyRegion.LegR:
      return [J.RightUpperLeg, J.RightFoot];
    default:
      return null;
  }
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
 * Với tay/chân, điểm được chiếu về trục chi (theo chainT) rồi cộng bán kính hoà trộn cố định,
 * để độ to của chi và khối cơ không làm lệch weight.
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

  for (let v = 0; v < count; v++) {
    const r = region.getX(v) as BodyRegion;
    const surfacePoint: Vec3 = [pos.getX(v), pos.getY(v), pos.getZ(v)];
    const axis = limbAxis(r, layout);
    const t = chainT.getX(v);
    const p: Vec3 = axis
      ? [0, 1, 2].map((i) => axis[0][i]! + (axis[1][i]! - axis[0][i]!) * t) as Vec3
      : surfacePoint;
    const pad = axis ? LIMB_BLEND_RADIUS : 0;
    const allowed = REGION_BONES[r].filter((b) => !wrongSide(b, surfacePoint[0]));
    const candidates = allowed
      .map((bone) => {
        const [a, b] = segments.get(bone)!;
        return { bone, w: 1 / (distanceToSegment(p, a, b) + pad + DISTANCE_EPSILON) ** power };
      })
      .sort((x, y) => y.w - x.w)
      .slice(0, MAX_INFLUENCES);
    const total = candidates.reduce((s, c) => s + c.w, 0);
    const kept = candidates.filter((c, i) => i === 0 || c.w / total >= MIN_WEIGHT);
    const keptTotal = kept.reduce((s, c) => s + c.w, 0);
    kept.forEach((c, k) => {
      skinIndex[v * 4 + k] = boneIndex(c.bone);
      skinWeight[v * 4 + k] = c.w / keptTotal;
    });
  }
  return { skinIndex, skinWeight };
};
