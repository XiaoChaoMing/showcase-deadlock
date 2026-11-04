import type { Vec3 } from '../../definitions/HeroDefinition';

export interface SweepRing {
  center: Vec3;
  /** Hướng góc 0°. */
  axisA: Vec3;
  /** Hướng góc 90°. */
  axisB: Vec3;
  ra: number;
  rb: number;
  /** Số mũ superellipse: 2 = elip, lớn hơn = vuông hơn. */
  n: number;
  t: number;
  /** Độ nhô ra theo pháp tuyến tại góc theta (radian) — khối cơ. */
  bulge?: (theta: number) => number;
}

export interface SweepData {
  positions: Float32Array;
  indices: Uint32Array;
  /** Vị trí dọc sweep của từng vertex. */
  t: Float32Array;
  /** Góc quanh sweep của từng vertex (radian). */
  angle: Float32Array;
}

const MIN_TRIANGLE_AREA2 = 1e-14;

export const superellipsePoint = (theta: number, ra: number, rb: number, n: number): [a: number, b: number] => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const e = 2 / n;
  return [ra * Math.sign(c) * Math.abs(c) ** e, rb * Math.sign(s) * Math.abs(s) ** e];
};

/** Điểm và pháp tuyến trên vòng tại góc theta, đã cộng khối cơ (nếu có) theo pháp tuyến. */
export const ringPoint = (ring: SweepRing, theta: number): { position: Vec3; normal: Vec3 } => {
  const [a, b] = superellipsePoint(theta, ring.ra, ring.rb, ring.n);
  // Pháp tuyến của superellipse |a/ra|^n + |b/rb|^n = 1.
  const na = (Math.sign(a) * Math.abs(a / ring.ra) ** (ring.n - 1)) / ring.ra;
  const nb = (Math.sign(b) * Math.abs(b / ring.rb) ** (ring.n - 1)) / ring.rb;
  const raw: Vec3 = [0, 1, 2].map((i) => ring.axisA[i]! * na + ring.axisB[i]! * nb) as Vec3;
  const len = Math.hypot(...raw) || 1;
  const normal: Vec3 = [raw[0] / len, raw[1] / len, raw[2] / len];
  const lift = ring.bulge?.(theta) ?? 0;
  const position = [0, 1, 2].map(
    (i) => ring.center[i]! + ring.axisA[i]! * a + ring.axisB[i]! * b + normal[i]! * lift,
  ) as Vec3;
  return { position, normal };
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Dựng ống từ các ring. Mỗi tam giác được đặt chiều sao cho pháp tuyến quay ra xa
 * trục nối tâm các ring (với nắp: quay ra ngoài theo hướng đi), bất kể hướng sweep.
 */
export const buildSweep = (rings: SweepRing[], segments: number, caps: { start: boolean; end: boolean }): SweepData => {
  const ringCount = rings.length;
  const vertexCount = ringCount * segments + (caps.start ? 1 : 0) + (caps.end ? 1 : 0);
  const positions = new Float32Array(vertexCount * 3);
  const tAttr = new Float32Array(vertexCount);
  const angle = new Float32Array(vertexCount);
  const indices: number[] = [];
  const point = (i: number): Vec3 => [positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!];

  rings.forEach((ring, r) => {
    for (let k = 0; k < segments; k++) {
      const theta = (k / segments) * Math.PI * 2;
      const v = r * segments + k;
      positions.set(ringPoint(ring, theta).position, v * 3);
      tAttr[v] = ring.t;
      angle[v] = theta;
    }
  });

  const pushOriented = (i0: number, i1: number, i2: number, outward: Vec3): void => {
    const p0 = point(i0);
    const n = cross(sub(point(i1), p0), sub(point(i2), p0));
    if (dot(n, n) < MIN_TRIANGLE_AREA2) return;
    if (dot(n, outward) >= 0) indices.push(i0, i1, i2);
    else indices.push(i0, i2, i1);
  };

  for (let r = 0; r < ringCount - 1; r++) {
    const c0 = rings[r]!.center;
    const c1 = rings[r + 1]!.center;
    const mid: Vec3 = [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2, (c0[2] + c1[2]) / 2];
    for (let k = 0; k < segments; k++) {
      const a = r * segments + k;
      const b = r * segments + ((k + 1) % segments);
      const c = (r + 1) * segments + k;
      const d = (r + 1) * segments + ((k + 1) % segments);
      const quadMid: Vec3 = [0, 1, 2].map((i) => (point(a)[i]! + point(d)[i]!) / 2) as Vec3;
      const outward = sub(quadMid, mid);
      pushOriented(a, b, c, outward);
      pushOriented(b, d, c, outward);
    }
  }

  let next = ringCount * segments;
  const addCap = (ringIndex: number, outward: Vec3, tValue: number): void => {
    const ring = rings[ringIndex]!;
    const centerIndex = next++;
    positions.set(ring.center, centerIndex * 3);
    tAttr[centerIndex] = tValue;
    angle[centerIndex] = 0;
    for (let k = 0; k < segments; k++) {
      pushOriented(centerIndex, ringIndex * segments + k, ringIndex * segments + ((k + 1) % segments), outward);
    }
  };
  if (ringCount >= 2) {
    const dir = sub(rings[ringCount - 1]!.center, rings[0]!.center);
    if (caps.start) addCap(0, [-dir[0], -dir[1], -dir[2]], rings[0]!.t);
    if (caps.end) addCap(ringCount - 1, dir, rings[ringCount - 1]!.t);
  }

  return { positions, indices: Uint32Array.from(indices), t: tAttr, angle };
};
