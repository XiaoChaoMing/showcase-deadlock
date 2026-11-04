import * as THREE from 'three';
import type { BodyPart, BodyShape, Side, Vec3 } from '../definitions/HeroDefinition';
import { BodyRegion } from './BodyRegions';
import { FOOT_HEEL_RATIO, type BodySurface } from './BodySurface';
import { ringPoint, type SweepRing } from './geometry/RingSweep';

/*
 * Thân là MỘT lưới kín, liền khối:
 *  - thân → cổ → đầu là một chuỗi vòng tiết diện liên tục;
 *  - vòng đáy thân tách đôi thành hai vòng đùi, nối với nhau bằng đường đáy chậu (không có đầu đùi lồng trong chậu);
 *  - mỗi cánh tay nối vào một "cổng" khoét trên sườn thân; cánh tay chạy liền thành bàn tay;
 *  - mỗi ống chân nối vào một cổng khoét trên mu bàn chân.
 * Cổng là ô lưới (N/4 + 1) × (N/4 + 1) đỉnh trên bộ phận gốc, viền của nó có đúng N đỉnh = số đỉnh vòng chi.
 */

/** Khoảng cách tối thiểu (m) giữa vòng chi đầu tiên và bề mặt cổng. */
const PORT_CLEARANCE = 0.02;
/** Khoảng (m) từ đáy chậu xuống vòng đùi đầu tiên. */
const CROTCH_TO_LEG = 0.03;
/** Khoảng (m) từ mu bàn chân lên vòng cổ chân cuối cùng. */
const ANKLE_ABOVE_FOOT = 0.025;
/** Phần khoảng trống giữa khớp vai và gốc cổ mà cổng vai được phép chiếm. */
const SHOULDER_PORT_HEADROOM = 0.85;

class MeshBuilder {
  readonly positions: number[] = [];
  readonly regions: number[] = [];
  readonly chainTs: number[] = [];
  readonly tris: number[] = [];
  readonly triRegions: number[] = [];

  vertex(p: Vec3, region: BodyRegion, t: number): number {
    this.positions.push(p[0], p[1], p[2]);
    this.regions.push(region);
    this.chainTs.push(t);
    return this.regions.length - 1;
  }

  point(i: number): Vec3 {
    return [this.positions[i * 3]!, this.positions[i * 3 + 1]!, this.positions[i * 3 + 2]!];
  }

  tri(a: number, b: number, c: number, region: BodyRegion): void {
    this.tris.push(a, b, c);
    this.triRegions.push(region);
  }

  /** Dải tứ giác giữa hai vòng cùng số đỉnh (đỉnh k nối đỉnh k). */
  band(a: number[], b: number[], region: BodyRegion, skip?: (k: number) => boolean): void {
    const n = a.length;
    for (let k = 0; k < n; k++) {
      if (skip?.(k)) continue;
      const k1 = (k + 1) % n;
      this.tri(a[k]!, a[k1]!, b[k1]!, region);
      this.tri(a[k]!, b[k1]!, b[k]!, region);
    }
  }

  cap(ring: number[], apex: Vec3, region: BodyRegion, t: number): void {
    const c = this.vertex(apex, region, t);
    ring.forEach((v, k) => this.tri(c, v, ring[(k + 1) % ring.length]!, region));
  }

  ring(r: SweepRing, n: number, region: BodyRegion): number[] {
    return Array.from({ length: n }, (_, k) => this.vertex(ringPoint(r, (k / n) * Math.PI * 2).position, region, r.t));
  }

  /** Nối một vòng viền (cổng) với một vòng chi, tự chọn điểm bắt đầu và chiều đi khớp hướng nhất. */
  bridge(loop: number[], ring: number[], region: BodyRegion): void {
    const n = ring.length;
    const mean = (ids: number[]): Vec3 => {
      const s: Vec3 = [0, 0, 0];
      for (const i of ids) {
        const p = this.point(i);
        s[0] += p[0] / ids.length;
        s[1] += p[1] / ids.length;
        s[2] += p[2] / ids.length;
      }
      return s;
    };
    const dir = (i: number, c: Vec3): THREE.Vector3 =>
      new THREE.Vector3(...this.point(i)).sub(new THREE.Vector3(...c)).normalize();
    const cl = mean(loop);
    const cr = mean(ring);
    const ringDirs = ring.map((i) => dir(i, cr));
    const loopDirs = loop.map((i) => dir(i, cl));
    let best = { score: -Infinity, shift: 0, step: 1 };
    for (const step of [1, -1]) {
      for (let shift = 0; shift < n; shift++) {
        let score = 0;
        for (let i = 0; i < n; i++) score += loopDirs[(((shift + step * i) % n) + n) % n]!.dot(ringDirs[i]!);
        if (score > best.score) best = { score, shift, step };
      }
    }
    const aligned = ring.map((_, i) => loop[(((best.shift + best.step * i) % n) + n) % n]!);
    this.band(aligned, ring, region);
  }
}

/** Ô lưới trên một chuỗi vòng (hàng = vòng, cột = đỉnh trong vòng). */
interface Grid {
  rings: number[][];
}

/** Viền của ô lưới hàng [r0, r0+m] × cột [c0, c0+m] (cột lấy theo modulo), đi một vòng: N = 4m đỉnh. */
const portLoop = (grid: Grid, r0: number, c0: number, m: number): number[] => {
  const n = grid.rings[0]!.length;
  const at = (r: number, c: number): number => grid.rings[r]![(((c0 + c) % n) + n) % n]!;
  const loop: number[] = [];
  for (let c = 0; c < m; c++) loop.push(at(r0, c));
  for (let r = 0; r < m; r++) loop.push(at(r0 + r, m));
  for (let c = m; c > 0; c--) loop.push(at(r0 + m, c));
  for (let r = m; r > 0; r--) loop.push(at(r0 + r, 0));
  return loop;
};

/** Ô cột k (giữa đỉnh k và k+1) của hàng r có nằm trong cổng không. */
const inPort = (r: number, k: number, n: number, port: { r0: number; c0: number; m: number }): boolean => {
  const dc = (((k - port.c0) % n) + n) % n;
  return r >= port.r0 && r < port.r0 + port.m && dc < port.m;
};

/** Chèn các t của hàng cổng vào danh sách t đều, bỏ t đều quá gần hàng cổng. */
const mergeTs = (uniform: number[], forced: number[], minGap: number): number[] => {
  const kept = uniform.filter((t) => forced.every((f) => Math.abs(t - f) >= minGap));
  return [...kept, ...forced].sort((a, b) => a - b);
};

const ringsOf = (
  mb: MeshBuilder,
  surface: BodySurface,
  part: BodyPart,
  side: Side | undefined,
  ts: number[],
  n: number,
  region: BodyRegion,
): number[][] => ts.map((t) => mb.ring(surface.ringAt(part, side, t), n, region));

const chainBands = (mb: MeshBuilder, rings: number[][], region: BodyRegion, skip?: (r: number, k: number) => boolean): void => {
  for (let r = 0; r < rings.length - 1; r++) mb.band(rings[r]!, rings[r + 1]!, region, skip ? (k) => skip(r, k) : undefined);
};

/** Đảo mặt cho cùng hướng trên toàn lưới (lan theo cạnh chung), rồi lật hết nếu thể tích âm. */
const orientConsistently = (mb: MeshBuilder): void => {
  const faceCount = mb.tris.length / 3;
  const edgeFaces = new Map<string, number[]>();
  const key = (u: number, v: number): string => (u < v ? `${u}_${v}` : `${v}_${u}`);
  for (let f = 0; f < faceCount; f++) {
    for (let e = 0; e < 3; e++) {
      const k = key(mb.tris[f * 3 + e]!, mb.tris[f * 3 + ((e + 1) % 3)]!);
      const list = edgeFaces.get(k) ?? [];
      list.push(f);
      edgeFaces.set(k, list);
    }
  }
  const hasDirected = (f: number, u: number, v: number): boolean => {
    for (let e = 0; e < 3; e++) if (mb.tris[f * 3 + e] === u && mb.tris[f * 3 + ((e + 1) % 3)] === v) return true;
    return false;
  };
  const flip = (f: number): void => {
    const b = mb.tris[f * 3 + 1]!;
    mb.tris[f * 3 + 1] = mb.tris[f * 3 + 2]!;
    mb.tris[f * 3 + 2] = b;
  };
  const visited = new Uint8Array(faceCount);
  for (let seed = 0; seed < faceCount; seed++) {
    if (visited[seed]) continue;
    visited[seed] = 1;
    const queue = [seed];
    while (queue.length) {
      const f = queue.pop()!;
      for (let e = 0; e < 3; e++) {
        const u = mb.tris[f * 3 + e]!;
        const v = mb.tris[f * 3 + ((e + 1) % 3)]!;
        for (const g of edgeFaces.get(key(u, v)) ?? []) {
          if (visited[g]) continue;
          if (hasDirected(g, u, v)) flip(g);
          visited[g] = 1;
          queue.push(g);
        }
      }
    }
  }
  let volume = 0;
  for (let f = 0; f < faceCount; f++) {
    const a = new THREE.Vector3(...mb.point(mb.tris[f * 3]!));
    const b = new THREE.Vector3(...mb.point(mb.tris[f * 3 + 1]!));
    const c = new THREE.Vector3(...mb.point(mb.tris[f * 3 + 2]!));
    volume += a.dot(b.cross(c));
  }
  if (volume < 0) for (let f = 0; f < faceCount; f++) flip(f);
};

const toGeometry = (mb: MeshBuilder): THREE.BufferGeometry => {
  // Bỏ đỉnh không còn mặt nào dùng (đỉnh bên trong cổng).
  const used = new Int32Array(mb.regions.length).fill(-1);
  let next = 0;
  for (const i of mb.tris) if (used[i] === -1) used[i] = next++;
  const positions = new Float32Array(next * 3);
  const region = new Uint8Array(next);
  const chainT = new Float32Array(next);
  used.forEach((ni, oi) => {
    if (ni < 0) return;
    positions.set(mb.point(oi), ni * 3);
    region[ni] = mb.regions[oi]!;
    chainT[ni] = mb.chainTs[oi]!;
  });
  const order = Array.from({ length: mb.triRegions.length }, (_, f) => f).sort((a, b) => mb.triRegions[a]! - mb.triRegions[b]!);
  const indices = new Uint32Array(mb.tris.length);
  const geometry = new THREE.BufferGeometry();
  let start = 0;
  order.forEach((f, i) => {
    for (let e = 0; e < 3; e++) indices[i * 3 + e] = used[mb.tris[f * 3 + e]!]!;
    const r = mb.triRegions[f]!;
    const nextRegion = mb.triRegions[order[i + 1] ?? -1];
    if (nextRegion !== r) {
      geometry.addGroup(start, (i + 1) * 3 - start, r);
      start = (i + 1) * 3;
    }
  });
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('region', new THREE.BufferAttribute(region, 1));
  geometry.setAttribute('chainT', new THREE.BufferAttribute(chainT, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
};

/** Lưới thân kín, liền khối, có index (chưa tính normal). radialSegments phải là bội số của 8. */
export const buildIndexedBody = (surface: BodySurface, shape: BodyShape): THREE.BufferGeometry => {
  const n = shape.radialSegments;
  if (n % 8 !== 0) throw new Error(`radialSegments phải là bội số của 8 (đang là ${n})`);
  const m = n / 4;
  const rpm = shape.ringsPerMeter;
  const { layout: L, proportions: P } = surface;
  const mb = new MeshBuilder();

  // --- Thân: từ vòng tách hông lên gốc cổ, có hàng cổng vai. ---
  const torsoLen = L.neckBaseY - L.torsoBottomY;
  const torsoT = (y: number): number => (y - L.torsoBottomY) / torsoLen;
  const splitY = L.hipY - P.torso.pelvisDepth / 2;
  const crotchY = L.torsoBottomY;
  const shoulderY = L.joints.LeftUpperArm[1];
  const armRoot = surface.ringAt('arm', 'left', 0);
  const portHalf = Math.min(armRoot.rb, SHOULDER_PORT_HEADROOM * (L.neckBaseY - shoulderY));
  const rowStep = (2 * portHalf) / m;
  const portTs = Array.from({ length: m + 1 }, (_, j) => torsoT(shoulderY + (j - m / 2) * rowStep));
  const torsoTs = mergeTs(surface.uniformTs('torso', rpm, torsoT(splitY), 1), portTs, (rowStep / torsoLen) * 0.6);
  const torso = ringsOf(mb, surface, 'torso', undefined, torsoTs, n, BodyRegion.Torso);
  const r0 = torsoTs.indexOf(portTs[0]!);
  const ports = {
    left: { r0, c0: n / 4 - n / 8, m },
    right: { r0, c0: (3 * n) / 4 - n / 8, m },
  };
  chainBands(mb, torso, BodyRegion.Torso, (r, k) => inPort(r, k, n, ports.left) || inPort(r, k, n, ports.right));

  // --- Cổ → đầu: nối liền vòng trên cùng của thân. ---
  const neck = ringsOf(mb, surface, 'neck', undefined, surface.uniformTs('neck', rpm, 0, 1).slice(1), n, BodyRegion.Neck);
  const head = ringsOf(mb, surface, 'head', undefined, surface.uniformTs('head', rpm, 0, 1).slice(1), n, BodyRegion.Head);
  mb.band(torso[torso.length - 1]!, neck[0]!, BodyRegion.Neck);
  chainBands(mb, neck, BodyRegion.Neck);
  mb.band(neck[neck.length - 1]!, head[0]!, BodyRegion.Head);
  chainBands(mb, head, BodyRegion.Head);
  mb.cap(head[head.length - 1]!, surface.ringAt('head', undefined, 1).center, BodyRegion.Head, 1);

  // --- Đáy chậu: các đỉnh trên đường giữa (x = 0) từ sau ra trước, võng xuống tới crotchY. ---
  const split = torso[0]!;
  const front = mb.point(split[0]!);
  const back = mb.point(split[n / 2]!);
  const crotch = Array.from({ length: n / 2 - 1 }, (_, i) => {
    const u = (i + 1) / (n / 2);
    const y = splitY - (splitY - crotchY) * Math.sin(Math.PI * u);
    return mb.vertex([0, y, back[2] + (front[2] - back[2]) * u], BodyRegion.Torso, 0);
  });

  const legLen = P.legs.upperLength + P.legs.lowerLength;
  const legT = (y: number): number => (L.hipY - y) / legLen;
  const footLen = surface.partLength('foot');
  // Cổ chân nằm ở z = 0, cách gót FOOT_HEEL_RATIO chiều dài bàn chân; t chạy tuyến tính theo z.
  const ankleT = FOOT_HEEL_RATIO;

  for (const side of ['left', 'right'] as const) {
    const S = side === 'left';
    const R = {
      arm: S ? BodyRegion.ArmL : BodyRegion.ArmR,
      hand: S ? BodyRegion.HandL : BodyRegion.HandR,
      leg: S ? BodyRegion.LegL : BodyRegion.LegR,
      foot: S ? BodyRegion.FootL : BodyRegion.FootR,
    };

    // Tay: cổng vai → cánh tay → bàn tay.
    const port = S ? ports.left : ports.right;
    const shoulderLoop = portLoop({ rings: torso }, port.r0, port.c0, port.m);
    const portOuterX = Math.max(...shoulderLoop.map((i) => Math.abs(mb.point(i)[0])));
    const armLen = P.arms.upperLength + P.arms.lowerLength;
    const armStart = Math.max(0, (portOuterX + PORT_CLEARANCE - Math.abs(L.joints.LeftUpperArm[0])) / armLen);
    const arm = ringsOf(mb, surface, 'arm', side, surface.uniformTs('arm', rpm, armStart, 1), n, R.arm);
    const hand = ringsOf(mb, surface, 'hand', side, surface.uniformTs('hand', rpm, 0, 1).slice(1), n, R.hand);
    mb.bridge(shoulderLoop, arm[0]!, R.arm);
    chainBands(mb, arm, R.arm);
    mb.band(arm[arm.length - 1]!, hand[0]!, R.hand);
    chainBands(mb, hand, R.hand);
    mb.cap(hand[hand.length - 1]!, surface.ringAt('hand', side, 1).center, R.hand, 1);

    // Hông: nửa vòng tách + đường đáy chậu = vòng N đỉnh, nối vào vòng đùi đầu tiên.
    const outer = Array.from({ length: n / 2 + 1 }, (_, i) => split[S ? i : (n - i) % n]!);
    const hipLoop = [...outer, ...crotch];
    const legEnd = legT(P.foot.height + ANKLE_ABOVE_FOOT);
    const leg = ringsOf(mb, surface, 'leg', side, surface.uniformTs('leg', rpm, legT(crotchY - CROTCH_TO_LEG), legEnd), n, R.leg);
    mb.bridge(hipLoop, leg[0]!, R.leg);
    chainBands(mb, leg, R.leg);

    // Bàn chân: cổng trên mu bàn chân quanh cổ chân, nối với vòng ống chân cuối.
    const ankleRadius = surface.ringAt('leg', side, legEnd).ra;
    const footRowStep = (2 * ankleRadius) / m / footLen;
    const footPortTs = Array.from({ length: m + 1 }, (_, j) => ankleT + (j - m / 2) * footRowStep);
    const footTs = mergeTs(surface.uniformTs('foot', rpm, 0, 1), footPortTs, footRowStep * 0.6);
    const foot = ringsOf(mb, surface, 'foot', side, footTs, n, R.foot);
    const footPort = { r0: footTs.indexOf(footPortTs[0]!), c0: -n / 8, m };
    chainBands(mb, foot, R.foot, (r, k) => inPort(r, k, n, footPort));
    mb.cap(foot[0]!, surface.ringAt('foot', side, 0).center, R.foot, 0);
    mb.cap(foot[foot.length - 1]!, surface.ringAt('foot', side, 1).center, R.foot, 1);
    mb.bridge(portLoop({ rings: foot }, footPort.r0, footPort.c0, m), leg[leg.length - 1]!, R.leg);
  }

  orientConsistently(mb);
  return toGeometry(mb);
};
