import * as THREE from 'three';

/** Kiểm tra điểm có nằm trong lưới kín không (đếm số lần tia +X cắt lưới), kèm độ sâu tới mặt gần nhất. */
export const createInsideTester = (geometry: THREE.BufferGeometry) => {
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  const tris = new Float64Array(triCount * 9);
  for (let f = 0; f < triCount; f++) {
    for (let k = 0; k < 3; k++) {
      const vi = index ? index.getX(f * 3 + k) : f * 3 + k;
      tris[f * 9 + k * 3] = pos.getX(vi);
      tris[f * 9 + k * 3 + 1] = pos.getY(vi);
      tris[f * 9 + k * 3 + 2] = pos.getZ(vi);
    }
  }
  // Chia tam giác theo dải Y để giảm số phép thử.
  const BUCKET = 0.02;
  const buckets = new Map<number, number[]>();
  for (let f = 0; f < triCount; f++) {
    const ys = [tris[f * 9 + 1]!, tris[f * 9 + 4]!, tris[f * 9 + 7]!];
    for (let b = Math.floor(Math.min(...ys) / BUCKET); b <= Math.floor(Math.max(...ys) / BUCKET); b++) {
      const list = buckets.get(b) ?? [];
      list.push(f);
      buckets.set(b, list);
    }
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), q = new THREE.Vector3();
  const tri = new THREE.Triangle();
  const load = (f: number) => {
    a.set(tris[f * 9]!, tris[f * 9 + 1]!, tris[f * 9 + 2]!);
    b.set(tris[f * 9 + 3]!, tris[f * 9 + 4]!, tris[f * 9 + 5]!);
    c.set(tris[f * 9 + 6]!, tris[f * 9 + 7]!, tris[f * 9 + 8]!);
  };
  const ray = new THREE.Ray();
  const hit = new THREE.Vector3();
  const inside = (p: THREE.Vector3): boolean => {
    ray.set(p, new THREE.Vector3(1, 0.0001234, 0.0000567).normalize());
    let crossings = 0;
    for (const f of buckets.get(Math.floor(p.y / BUCKET)) ?? []) {
      load(f);
      if (ray.intersectTriangle(a, b, c, false, hit)) crossings++;
    }
    return crossings % 2 === 1;
  };
  const depth = (p: THREE.Vector3): number => {
    let best = Infinity;
    const b0 = Math.floor(p.y / BUCKET);
    for (let k = b0 - 4; k <= b0 + 4; k++) {
      for (const f of buckets.get(k) ?? []) {
        load(f);
        tri.set(a, b, c);
        best = Math.min(best, tri.closestPointToPoint(p, q).distanceTo(p));
      }
    }
    return best;
  };
  return { inside, depth };
};
