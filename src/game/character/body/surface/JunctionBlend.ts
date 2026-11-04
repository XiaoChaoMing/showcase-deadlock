import * as THREE from 'three';
import type { BodyPart, Side, Vec3 } from '../../definitions/HeroDefinition';
import { BodyRegion } from '../../modeling/BodyRegions';
import type { BodySurface } from '../../modeling/BodySurface';
import { ringPoint } from '../../modeling/geometry/RingSweep';

/*
 * Nối mềm ở chỗ ghép hai bộ phận (vai–nách, gốc cổ, dưới cằm, hông–đùi) theo smooth union của hai mặt ẩn (SDF):
 *   F = smin_k(f_A, f_B), smin_k(a, b) = min(a, b) − max(k − |a − b|, 0)² / (4k).
 * Một đỉnh nằm trên mặt của bộ phận A (f_A ≈ 0) cách bộ phận B một khoảng d = f_B, nên mặt F = 0 nằm ngoài nó
 * đúng max(k − |d|, 0)² / (4k): đỉnh được đẩy ra theo pháp tuyến bấy nhiêu. Không đổi topology, không chiếu Newton.
 */

type PartRef = { part: BodyPart; side?: Side };

const REGION_PART: Record<number, PartRef> = {
  [BodyRegion.Torso]: { part: 'torso' },
  [BodyRegion.Neck]: { part: 'neck' },
  [BodyRegion.Head]: { part: 'head' },
  [BodyRegion.ArmL]: { part: 'arm', side: 'left' },
  [BodyRegion.ArmR]: { part: 'arm', side: 'right' },
  [BodyRegion.LegL]: { part: 'leg', side: 'left' },
  [BodyRegion.LegR]: { part: 'leg', side: 'right' },
};

/** Với mỗi vùng: các bộ phận kề cần nối mềm. */
const NEIGHBORS: Partial<Record<BodyRegion, BodyRegion[]>> = {
  [BodyRegion.Torso]: [BodyRegion.Neck, BodyRegion.LegL, BodyRegion.LegR],
  [BodyRegion.Neck]: [BodyRegion.Torso, BodyRegion.Head],
  [BodyRegion.Head]: [BodyRegion.Neck],
  [BodyRegion.LegL]: [BodyRegion.Torso],
  [BodyRegion.LegR]: [BodyRegion.Torso],
};

/** Khoảng cách có dấu xấp xỉ tới bề mặt tham số của một bộ phận (ống có nắp ở hai đầu). */
/** farThan: nếu chắc chắn điểm cách xa hơn giá trị này thì trả về ngay một cận dưới (không tính chính xác). */
export const partDistance = (surface: BodySurface, ref: PartRef): ((p: THREE.Vector3, farThan?: number) => number) => {
  const { start, end } = surface.axis(ref.part, ref.side);
  const s = new THREE.Vector3(...start);
  const axis = new THREE.Vector3(...end).sub(s);
  const len = axis.length();
  const dir = axis.clone().divideScalar(len);
  // Bán kính lớn nhất của bộ phận (gồm khối cơ): dùng để loại nhanh điểm ở xa.
  let maxRadius = 0;
  for (let i = 0; i <= 16; i++) {
    const ring = surface.ringAt(ref.part, ref.side, i / 16);
    for (let k = 0; k < 16; k++) {
      const q = ringPoint(ring, (k / 16) * Math.PI * 2).position;
      maxRadius = Math.max(maxRadius, Math.hypot(q[0] - ring.center[0], q[1] - ring.center[1], q[2] - ring.center[2]));
    }
  }
  const segment = new THREE.Line3(s.clone(), new THREE.Vector3(...end));
  const onAxis = new THREE.Vector3();
  return (p, farThan = Infinity) => {
    const lower = segment.closestPointToPoint(p, true, onAxis).distanceTo(p) - maxRadius * 1.15 - 0.02;
    if (lower > farThan) return lower;
    const raw = p.clone().sub(s).dot(dir) / len;
    const t = Math.min(1, Math.max(0, raw));
    const ring = surface.ringAt(ref.part, ref.side, t);
    const v = p.clone().sub(new THREE.Vector3(...ring.center));
    const A = new THREE.Vector3(...ring.axisA);
    const B = new THREE.Vector3(...ring.axisB);
    const a = v.dot(A);
    const b = v.dot(B);
    const radial = Math.hypot(a, b);
    const theta = Math.atan2(b / ring.rb, a / ring.ra);
    const q = ringPoint(ring, theta).position;
    const surfaceRadial = Math.hypot(
      (q[0] - ring.center[0]) * A.x + (q[1] - ring.center[1]) * A.y + (q[2] - ring.center[2]) * A.z,
      (q[0] - ring.center[0]) * B.x + (q[1] - ring.center[1]) * B.y + (q[2] - ring.center[2]) * B.z,
    );
    const fr = radial - surfaceRadial;
    const over = (raw < 0 ? -raw : raw > 1 ? raw - 1 : 0) * len;
    if (over <= 0) return fr;
    return fr > 0 ? Math.hypot(fr, over) : over;
  };
};

export interface JunctionBlendOptions {
  /** Bề rộng dải nối (m): đỉnh cách bộ phận kề dưới khoảng này được làm mịn, mạnh nhất ở sát chỗ nối. */
  k: number;
  /** Số lượt Taubin (mỗi lượt gồm một bước co λ và một bước giãn μ). */
  iterations?: number;
  /** Trọng số làm mịn nhẹ toàn thân (trừ bàn tay, bàn chân), 0–1: làm mềm rãnh cơ hẹp hơn cạnh lưới. */
  overall?: number;
}

const NO_SMOOTH: readonly BodyRegion[] = [BodyRegion.HandL, BodyRegion.HandR, BodyRegion.FootL, BodyRegion.FootR];
/**
 * Chỗ nối vai–tay đã có vùng chuyển tiếp Hermite riêng; làm mịn ở đó làm nếp nách sắc thêm (đã đo), nên giữ nguyên
 * các đỉnh trong dải này.
 */
const PROTECTED: Partial<Record<BodyRegion, BodyRegion[]>> = {
  [BodyRegion.Torso]: [BodyRegion.ArmL, BodyRegion.ArmR],
  [BodyRegion.ArmL]: [BodyRegion.Torso],
  [BodyRegion.ArmR]: [BodyRegion.Torso],
};

const LAMBDA = 0.5;
const CROTCH_WEIGHT = 0.85;
const MU = -0.53;

/** Danh sách đỉnh kề theo cạnh, gộp các đỉnh trùng vị trí. */
const adjacency = (geometry: THREE.BufferGeometry): number[][] => {
  const index = geometry.getIndex()!;
  const count = geometry.getAttribute('position').count;
  const sets = Array.from({ length: count }, () => new Set<number>());
  for (let f = 0; f < index.count; f += 3) {
    const a = index.getX(f), b = index.getX(f + 1), c = index.getX(f + 2);
    sets[a]!.add(b).add(c);
    sets[b]!.add(a).add(c);
    sets[c]!.add(a).add(b);
  }
  return sets.map((s) => [...s]);
};

/**
 * Làm mềm chỗ ghép hai bộ phận (vai–nách, gốc cổ, dưới cằm, hông–đùi).
 * Dải nối được chọn bằng SDF của bộ phận kề (smooth union: chỉ vùng |f_B| < k ảnh hưởng), rồi làm mịn Taubin λ/μ
 * có trọng số: giữ thể tích, không lật mặt như khi đẩy đỉnh theo pháp tuyến ở chỗ lõm hẹp. Không đổi topology.
 */
export const blendJunctions = (geometry: THREE.BufferGeometry, surface: BodySurface, opts: JunctionBlendOptions): void => {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const region = geometry.getAttribute('region');
  const sdf = new Map<number, (p: THREE.Vector3, farThan?: number) => number>();
  const sdfOf = (r: BodyRegion) => {
    let f = sdf.get(r);
    if (!f) {
      f = partDistance(surface, REGION_PART[r]!);
      sdf.set(r, f);
    }
    return f;
  };
  const p = new THREE.Vector3();
  const weight = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const r = region.getX(i) as BodyRegion;
    if (NO_SMOOTH.includes(r)) continue;
    p.fromBufferAttribute(pos, i);
    if ((PROTECTED[r] ?? []).some((o) => Math.abs(sdfOf(o)(p, opts.k)) < opts.k)) continue;
    weight[i] = opts.overall ?? 0;
    const others = NEIGHBORS[r];
    if (!others) continue;
    let w = weight[i]!;
    for (const o of others) {
      const x = Math.min(1, Math.abs(sdfOf(o)(p, opts.k)) / opts.k);
      w = Math.max(w, 1 - x * x * (3 - 2 * x));
    }
    // Đường đáy chậu (đỉnh trên đường giữa, dưới khớp hông), nơi hai đùi trong gặp nhau: làm mịn mạnh ở đây lật mặt,
    // ghim hẳn thì nếp sắc thêm (đã đo) — dùng trọng số 0.85.
    weight[i] = r === BodyRegion.Torso && Math.abs(p.x) < 1e-4 && p.y < surface.layout.hipY ? w * CROTCH_WEIGHT : w;
  }
  const neighbors = adjacency(geometry);
  const xyz = Float64Array.from(pos.array as Float32Array);
  const step = (factor: number): void => {
    const next = Float64Array.from(xyz);
    for (let i = 0; i < pos.count; i++) {
      const w = weight[i]!;
      const nb = neighbors[i]!;
      if (w === 0 || nb.length === 0) continue;
      for (let c = 0; c < 3; c++) {
        let mean = 0;
        for (const j of nb) mean += xyz[j * 3 + c]!;
        mean /= nb.length;
        next[i * 3 + c] = xyz[i * 3 + c]! + factor * w * (mean - xyz[i * 3 + c]!);
      }
    }
    xyz.set(next);
  };
  for (let it = 0; it < (opts.iterations ?? 24); it++) {
    step(LAMBDA);
    step(MU);
  }
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, xyz[i * 3]!, xyz[i * 3 + 1]!, xyz[i * 3 + 2]!);
  pos.needsUpdate = true;
};

export const blendRadiusFor = (smoothness: number): number => 0.03 + 0.04 * smoothness;
export const overallSmoothingFor = (smoothness: number): number => 0.4 * smoothness;
