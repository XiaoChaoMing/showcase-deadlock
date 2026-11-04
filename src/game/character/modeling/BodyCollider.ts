import * as THREE from 'three';
import type { Vec3 } from '../definitions/HeroDefinition';

/** Kiểm tra va chạm với lưới thân thật (lưới kín): điểm có chìm vào thân không, và sâu bao nhiêu. */
export interface BodyCollider {
  /** Khoảng cách (m) từ p tới mặt thân gần nhất nếu p nằm trong thân; 0 nếu nằm ngoài. */
  depthInside(p: Vec3): number;
  /**
   * Đưa p ra ngoài thân: thử đẩy theo hướng ưu tiên (pháp tuyến của bộ phận); nếu vẫn kẹt
   * (ví dụ góc bẹn, nơi pháp tuyến chĩa sang chân kia) thì chiếu ra mặt thân gần nhất và trả về
   * hướng "ra ngoài thật" tại đó, để độ dày giáp cộng theo hướng này thay vì chĩa ngược vào thân.
   */
  pushOutside(p: Vec3, preferred: Vec3): { point: Vec3; normal: Vec3 };
}

const MARGIN = 0.001;
const PREFERRED_STEPS = 4;

/** Cạnh ô lưới (y, z) dùng để chia tam giác, giảm số phép thử. */
const BUCKET = 0.02;
/** Nới hộp bao khi xếp tam giác vào ô (tia hơi lệch trục y/z một chút). */
const PAD = 0.001;
/** Bán kính tìm điểm gần nhất, tính theo số ô. */
const NEAREST_CELLS = 4;
const cellKey = (iy: number, iz: number): number => iy * 100_003 + iz;
/** Hướng tia hơi lệch trục để không trúng đúng cạnh/đỉnh tam giác. */
const RAY_DIRECTION = new THREE.Vector3(1, 0.0001234, 0.0000567).normalize();

export const createBodyCollider = (geometry: THREE.BufferGeometry): BodyCollider => {
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  const tris = new Float64Array(triCount * 9);
  const maxX = new Float64Array(triCount);
  const cells = new Map<number, number[]>();
  for (let f = 0; f < triCount; f++) {
    let minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    maxX[f] = -Infinity;
    for (let k = 0; k < 3; k++) {
      const vi = index ? index.getX(f * 3 + k) : f * 3 + k;
      const x = pos.getX(vi), y = pos.getY(vi), z = pos.getZ(vi);
      tris[f * 9 + k * 3] = x;
      tris[f * 9 + k * 3 + 1] = y;
      tris[f * 9 + k * 3 + 2] = z;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
      maxX[f] = Math.max(maxX[f]!, x);
    }
    for (let iy = Math.floor((minY - PAD) / BUCKET); iy <= Math.floor((maxY + PAD) / BUCKET); iy++) {
      for (let iz = Math.floor((minZ - PAD) / BUCKET); iz <= Math.floor((maxZ + PAD) / BUCKET); iz++) {
        const key = cellKey(iy, iz);
        const list = cells.get(key) ?? [];
        list.push(f);
        cells.set(key, list);
      }
    }
  }

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const p = new THREE.Vector3();
  const closest = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const ray = new THREE.Ray();
  const tri = new THREE.Triangle();
  const load = (f: number): void => {
    a.set(tris[f * 9]!, tris[f * 9 + 1]!, tris[f * 9 + 2]!);
    b.set(tris[f * 9 + 3]!, tris[f * 9 + 4]!, tris[f * 9 + 5]!);
    c.set(tris[f * 9 + 6]!, tris[f * 9 + 7]!, tris[f * 9 + 8]!);
  };

  const depthInside = (q: Vec3): number => {
    p.set(q[0], q[1], q[2]);
    ray.set(p, RAY_DIRECTION);
    let crossings = 0;
    for (const f of cells.get(cellKey(Math.floor(p.y / BUCKET), Math.floor(p.z / BUCKET))) ?? []) {
      if (maxX[f]! < p.x) continue;
      load(f);
      if (ray.intersectTriangle(a, b, c, false, hit)) crossings++;
    }
    if (crossings % 2 === 0) return 0;
    return nearest(p).distance;
  };

  const best = new THREE.Vector3();
  const stamp = new Int32Array(triCount);
  let query = 0;
  /**
   * Điểm gần nhất trên mặt thân: quét các ô (y, z) theo vòng lan dần từ ô chứa điểm, dừng khi điểm tốt nhất đã
   * gần hơn mọi ô chưa quét (tối đa NEAREST_CELLS vòng, như phạm vi cũ).
   */
  const nearest = (from: THREE.Vector3): { point: THREE.Vector3; distance: number } => {
    let distance = Infinity;
    query += 1;
    const iy0 = Math.floor(from.y / BUCKET);
    const iz0 = Math.floor(from.z / BUCKET);
    const scan = (iy: number, iz: number): void => {
      for (const f of cells.get(cellKey(iy, iz)) ?? []) {
        if (stamp[f] === query) continue;
        stamp[f] = query;
        load(f);
        tri.set(a, b, c).closestPointToPoint(from, closest);
        const d = closest.distanceTo(from);
        if (d < distance) {
          distance = d;
          best.copy(closest);
        }
      }
    };
    for (let r = 0; r <= NEAREST_CELLS; r++) {
      for (let iy = iy0 - r; iy <= iy0 + r; iy++) {
        for (let iz = iz0 - r; iz <= iz0 + r; iz++) {
          if (Math.max(Math.abs(iy - iy0), Math.abs(iz - iz0)) === r) scan(iy, iz);
        }
      }
      // Mọi tam giác ở ô ngoài vòng r cách điểm ít nhất r × BUCKET theo (y, z).
      if (distance <= r * BUCKET) break;
    }
    return { point: best.clone(), distance: Number.isFinite(distance) ? distance : 0 };
  };

  const pushOutside = (start: Vec3, preferred: Vec3): { point: Vec3; normal: Vec3 } => {
    const q = new THREE.Vector3(...start);
    const dir = new THREE.Vector3(...preferred).normalize();
    const result = (normal: THREE.Vector3) => ({ point: [q.x, q.y, q.z] as Vec3, normal: [normal.x, normal.y, normal.z] as Vec3 });
    for (let i = 0; i < PREFERRED_STEPS; i++) {
      const d = depthInside([q.x, q.y, q.z]);
      if (d === 0) return result(dir);
      q.addScaledVector(dir, d + MARGIN);
    }
    const outward = dir.clone();
    for (let i = 0; i < PREFERRED_STEPS && depthInside([q.x, q.y, q.z]) > 0; i++) {
      const { point } = nearest(q);
      const out = point.clone().sub(q);
      if (out.lengthSq() > 1e-12) outward.copy(out.normalize());
      q.copy(point).addScaledVector(outward, MARGIN);
    }
    // Hướng ra ngoài dùng cho độ dày: trộn với pháp tuyến bộ phận để giáp không bị xoắn gắt.
    return result(outward.add(dir.multiplyScalar(0.25)).normalize());
  };
  return { depthInside, pushOutside };
};
