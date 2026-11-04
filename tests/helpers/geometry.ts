import type { SweepData } from '../../src/game/character/modeling/geometry/RingSweep';

type V = [number, number, number];
const get = (pos: ArrayLike<number>, i: number): V => [pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Điểm gần nhất trên đoạn thẳng [a, b]. */
export const closestOnSegment = (p: V, a: V, b: V): V => {
  const ab = sub(b, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / Math.max(dot(ab, ab), 1e-12)));
  return [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t];
};

/** Số tam giác có pháp tuyến quay vào trong so với trục [a, b]. */
export const inwardFaces = (data: Pick<SweepData, 'positions' | 'indices'>, axisStart: V, axisEnd: V): number => {
  let bad = 0;
  for (let f = 0; f < data.indices.length; f += 3) {
    const p0 = get(data.positions, data.indices[f]!);
    const p1 = get(data.positions, data.indices[f + 1]!);
    const p2 = get(data.positions, data.indices[f + 2]!);
    const n = cross(sub(p1, p0), sub(p2, p0));
    const c: V = [(p0[0] + p1[0] + p2[0]) / 3, (p0[1] + p1[1] + p2[1]) / 3, (p0[2] + p1[2] + p2[2]) / 3];
    const out = sub(c, closestOnSegment(c, axisStart, axisEnd));
    if (dot(n, out) < 0) bad += 1;
  }
  return bad;
};

export const hasNaN = (arr: ArrayLike<number>): boolean => {
  for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i]!)) return true;
  return false;
};

/** Số tam giác quay vào trong so với đường gấp khúc nối tâm các ring. */
export const inwardFacesPolyline = (data: Pick<SweepData, 'positions' | 'indices'>, centers: V[]): number => {
  let bad = 0;
  for (let f = 0; f < data.indices.length; f += 3) {
    const p0 = get(data.positions, data.indices[f]!);
    const p1 = get(data.positions, data.indices[f + 1]!);
    const p2 = get(data.positions, data.indices[f + 2]!);
    const n = cross(sub(p1, p0), sub(p2, p0));
    const c: V = [(p0[0] + p1[0] + p2[0]) / 3, (p0[1] + p1[1] + p2[1]) / 3, (p0[2] + p1[2] + p2[2]) / 3];
    let best: V = centers[0]!;
    let bestD = Infinity;
    for (let i = 0; i < centers.length - 1; i++) {
      const q = closestOnSegment(c, centers[i]!, centers[i + 1]!);
      const d = dot(sub(c, q), sub(c, q));
      if (d < bestD) { bestD = d; best = q; }
    }
    if (dot(n, sub(c, best)) < -1e-12) bad += 1;
  }
  return bad;
};
