import type * as THREE from 'three';
import { boneIndex, type BoneName } from '../definitions/BoneNames';
import type { CharacterLayout } from '../definitions/CharacterLayout';
import type { Vec3 } from '../definitions/HeroDefinition';
import type { BodyRegion } from '../modeling/BodyGeometry';
import { boneSegment, REGION_BONES } from './BoneMapping';

const MAX_INFLUENCES = 4;
const DEFAULT_POWER = 4;
const DISTANCE_EPSILON = 1e-4;
/** Weight nhỏ hơn mức này bị bỏ trước khi chuẩn hoá, để tránh "nhiễu" từ bone xa. */
const MIN_WEIGHT = 0.01;
/** Vertex lệch khỏi đường giữa quá mức này không nhận weight từ bone phía bên kia. */
const MIDLINE_TOLERANCE = 0.02;

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
 */
export const generateSkinWeights = (
  geometry: THREE.BufferGeometry,
  layout: CharacterLayout,
  opts: { power?: number } = {},
): { skinIndex: Uint16Array; skinWeight: Float32Array } => {
  const power = opts.power ?? DEFAULT_POWER;
  const pos = geometry.getAttribute('position');
  const region = geometry.getAttribute('region');
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
    const p: Vec3 = [pos.getX(v), pos.getY(v), pos.getZ(v)];
    const allowed = REGION_BONES[region.getX(v) as BodyRegion].filter((b) => !wrongSide(b, p[0]));
    const candidates = allowed
      .map((bone) => {
        const [a, b] = segments.get(bone)!;
        return { bone, w: 1 / (distanceToSegment(p, a, b) + DISTANCE_EPSILON) ** power };
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
