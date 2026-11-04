import * as THREE from 'three';

/** Pháp tuyến (chưa chuẩn hoá) của từng tam giác. */
const faceNormals = (g: THREE.BufferGeometry): Float32Array => {
  const pos = g.getAttribute('position');
  const index = g.getIndex();
  const count = index ? index.count / 3 : pos.count / 3;
  const out = new Float32Array(count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let f = 0; f < count; f++) {
    const i = (k: number) => (index ? index.getX(f * 3 + k) : f * 3 + k);
    a.fromBufferAttribute(pos, i(0));
    b.fromBufferAttribute(pos, i(1));
    c.fromBufferAttribute(pos, i(2));
    b.sub(a);
    c.sub(a);
    b.cross(c);
    out.set([b.x, b.y, b.z], f * 3);
  }
  return out;
};

/**
 * Góc nhị diện lớn nhất (độ) giữa hai tam giác chung cạnh, trên lưới có index.
 * Bỏ qua cạnh chạm vào đỉnh thuộc các vùng (attribute "region") trong excludeRegions.
 */
export const maxDihedralDeg = (g: THREE.BufferGeometry, excludeRegions: readonly number[] = [], onlyRegions?: readonly number[]): number => {
  const index = g.getIndex();
  if (!index) throw new Error('cần geometry có index');
  const region = g.getAttribute('region');
  const normals = faceNormals(g);
  const edges = new Map<string, number[]>();
  for (let f = 0; f < index.count / 3; f++) {
    for (let e = 0; e < 3; e++) {
      const u = index.getX(f * 3 + e);
      const v = index.getX(f * 3 + ((e + 1) % 3));
      const key = u < v ? `${u}_${v}` : `${v}_${u}`;
      const list = edges.get(key) ?? [];
      list.push(f);
      edges.set(key, list);
    }
  }
  const excluded = (vertex: number): boolean => {
    if (!region) return false;
    const r = region.getX(vertex);
    return excludeRegions.includes(r) || (onlyRegions !== undefined && !onlyRegions.includes(r));
  };
  let worst = 0;
  const n1 = new THREE.Vector3();
  const n2 = new THREE.Vector3();
  for (const [key, faces] of edges) {
    if (faces.length !== 2) continue;
    const [u, v] = key.split('_').map(Number) as [number, number];
    if (excluded(u) || excluded(v)) continue;
    n1.fromArray(normals, faces[0]! * 3);
    n2.fromArray(normals, faces[1]! * 3);
    if (n1.lengthSq() === 0 || n2.lengthSq() === 0) continue;
    worst = Math.max(worst, n1.angleTo(n2));
  }
  return THREE.MathUtils.radToDeg(worst);
};

/** Tỷ lệ tam giác có pháp tuyến ngược chiều so với cùng tam giác trên lưới tham chiếu (cùng index). */
export const flippedTriangleRatio = (g: THREE.BufferGeometry, reference: THREE.BufferGeometry): number => {
  const a = faceNormals(g);
  const b = faceNormals(reference);
  if (a.length !== b.length) throw new Error('hai lưới phải cùng số tam giác');
  let flipped = 0;
  for (let f = 0; f < a.length / 3; f++) {
    if (a[f * 3]! * b[f * 3]! + a[f * 3 + 1]! * b[f * 3 + 1]! + a[f * 3 + 2]! * b[f * 3 + 2]! < 0) flipped += 1;
  }
  return flipped / (a.length / 3);
};

/** Thể tích có dấu của lưới kín (dương khi mặt quay ra ngoài). */
export const signedVolume = (g: THREE.BufferGeometry): number => {
  const pos = g.getAttribute('position');
  const index = g.getIndex();
  const count = index ? index.count / 3 : pos.count / 3;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let v = 0;
  for (let f = 0; f < count; f++) {
    const i = (k: number) => (index ? index.getX(f * 3 + k) : f * 3 + k);
    a.fromBufferAttribute(pos, i(0));
    b.fromBufferAttribute(pos, i(1));
    c.fromBufferAttribute(pos, i(2));
    v += a.dot(b.cross(c));
  }
  return v / 6;
};

export const triangleCount = (g: THREE.BufferGeometry): number => (g.getIndex()?.count ?? g.getAttribute('position').count) / 3;
