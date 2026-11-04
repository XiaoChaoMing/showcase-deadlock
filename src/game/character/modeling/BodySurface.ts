import type { CharacterLayout } from '../definitions/CharacterLayout';
import type { BodyPart, BodyShape, CharacterProportions, Section, Side, SurfaceMount, Vec3 } from '../definitions/HeroDefinition';
import { sampleProfile } from './geometry/profile';
import type { SweepRing } from './geometry/RingSweep';

/** Hằng số hình học chung cho mọi hero (mét). */
export const FOOT_HEEL_RATIO = 0.25;

/** Hình dạng bàn tay/bàn chân dọc theo chiều dài, tính bằng tỷ lệ (width = theo B, depth = theo A). */
const HAND_PROFILE: Section[] = [
  { t: 0, width: 0.8, depth: 0.55 },
  { t: 0.25, width: 1, depth: 1 },
  { t: 0.8, width: 0.9, depth: 0.95 },
  { t: 1, width: 0.6, depth: 0.6 },
];
const footProfile = (toeTaper: number): Section[] => [
  { t: 0, width: 0.8, depth: 0.75 },
  { t: 0.25, width: 1, depth: 1 },
  { t: 0.7, width: 0.95, depth: 1 },
  { t: 1, width: toeTaper, depth: toeTaper * 0.55 },
];

export interface BodySurface {
  ringAt(part: BodyPart, side: Side | undefined, t: number): SweepRing;
  pointAt(m: SurfaceMount): { position: Vec3; normal: Vec3 };
  partLength(part: BodyPart): number;
  /** Các giá trị t phân bố đều trong [from, to] theo mật độ ringsPerMeter, dày hơn quanh khuỷu/gối. */
  uniformTs(part: BodyPart, ringsPerMeter: number, from: number, to: number): number[];
  readonly proportions: CharacterProportions;
  readonly shape: BodyShape;
  readonly layout: CharacterLayout;
}

interface PartFrame {
  start: Vec3;
  end: Vec3;
  axisA: Vec3;
  axisB: Vec3;
  n: number;
  /** Bán kính theo A, theo B, và độ dịch tâm theo A tại t ∈ [0, 1]. */
  size(t: number): { ra: number; rb: number; forward: number };
  /** Các khớp gập bên trong bộ phận (t), cần đặt ring dày hơn. */
  joints: number[];
}

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dist = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

const sectionSize = (sections: Section[], scaleB = 1, scaleA = 1) => (t: number) => {
  const s = sampleProfile(sections, t);
  return { ra: (s.depth * scaleA) / 2, rb: (s.width * scaleB) / 2, forward: s.forward * scaleA };
};

/** Bàn chân: dịch tâm theo trục A (= +Y) để lòng bàn chân luôn nằm phẳng trên y = 0. */
const groundedFoot =
  (size: PartFrame['size'], startY: number, endY: number): PartFrame['size'] =>
  (t) => {
    const s = size(t);
    return { ...s, forward: s.ra - (startY + (endY - startY) * t) };
  };

const FRONT: Vec3 = [0, 0, 1];
const UP: Vec3 = [0, 1, 0];

export const createBodySurface = (p: CharacterProportions, shape: BodyShape, layout: CharacterLayout): BodySurface => {
  const J = layout.joints;
  const outward = (side: Side): Vec3 => [side === 'left' ? 1 : -1, 0, 0];
  const pick = (side: Side, left: Vec3, right: Vec3): Vec3 => (side === 'left' ? left : right);

  const frames = new Map<string, PartFrame>();
  const key = (part: BodyPart, side?: Side): string => (side ? `${part}:${side}` : part);

  frames.set('torso', {
    start: [0, layout.torsoBottomY, 0],
    end: [0, layout.neckBaseY, 0],
    axisA: FRONT, axisB: [1, 0, 0], n: shape.torso.squareness,
    joints: [],
    size: sectionSize(shape.torso.sections),
  });
  frames.set('neck', {
    start: [0, layout.neckBaseY, 0],
    end: [0, J.Head[1], 0],
    axisA: FRONT, axisB: [1, 0, 0], n: 2,
    joints: [],
    size: (t) => {
      const r = p.neck.radius * (1 + (shape.neck.taper - 1) * t);
      return { ra: r, rb: r, forward: 0 };
    },
  });
  frames.set('head', {
    start: [0, J.Head[1], 0],
    end: [0, layout.headTopY, 0],
    axisA: FRONT, axisB: [1, 0, 0], n: shape.head.squareness,
    joints: [],
    size: sectionSize(shape.head.sections, p.head.width, p.head.depth),
  });

  for (const side of ['left', 'right'] as const) {
    frames.set(key('arm', side), {
      start: pick(side, J.LeftUpperArm, J.RightUpperArm),
      end: pick(side, J.LeftHand, J.RightHand),
      axisA: FRONT, axisB: UP, n: shape.arm.squareness,
      joints: [layout.elbowT],
      size: sectionSize(shape.arm.sections),
    });
    frames.set(key('hand', side), {
      start: pick(side, J.LeftHand, J.RightHand),
      end: layout.handTip[side],
      axisA: FRONT, axisB: UP, n: shape.hand.squareness,
      joints: [],
      // Lòng bàn tay úp xuống khi T-Pose: bề ngang theo trước–sau (A), bề dày theo trên–dưới (B).
      size: sectionSize(HAND_PROFILE, shape.hand.thickness, shape.hand.width),
    });
    frames.set(key('leg', side), {
      start: pick(side, J.LeftUpperLeg, J.RightUpperLeg),
      end: pick(side, J.LeftFoot, J.RightFoot),
      axisA: FRONT, axisB: outward(side), n: shape.leg.squareness,
      joints: [layout.kneeT],
      size: sectionSize(shape.leg.sections),
    });
    const ankle = pick(side, J.LeftFoot, J.RightFoot);
    frames.set(key('foot', side), {
      start: [ankle[0], p.foot.height / 2, -FOOT_HEEL_RATIO * p.foot.length],
      end: layout.toeTip[side],
      axisA: UP, axisB: outward(side), n: shape.foot.squareness,
      joints: [],
      size: groundedFoot(sectionSize(footProfile(shape.foot.toeTaper), p.foot.width, p.foot.height), p.foot.height / 2, layout.toeTip[side][1]),
    });
  }

  const frameOf = (part: BodyPart, side: Side | undefined): PartFrame => {
    const frame = frames.get(key(part, side)) ?? frames.get(part);
    if (!frame) throw new Error(`Bộ phận "${part}" cần side`);
    return frame;
  };

  const ringAt = (part: BodyPart, side: Side | undefined, t: number): SweepRing => {
    const f = frameOf(part, side);
    const { ra, rb, forward } = f.size(Math.min(1, Math.max(0, t)));
    const base = lerp3(f.start, f.end, t);
    return {
      center: [base[0] + f.axisA[0] * forward, base[1] + f.axisA[1] * forward, base[2] + f.axisA[2] * forward],
      axisA: f.axisA, axisB: f.axisB, ra, rb, n: f.n, t,
    };
  };

  const pointAt = (m: SurfaceMount): { position: Vec3; normal: Vec3 } => {
    const ring = ringAt(m.part, m.side, m.t);
    const theta = (m.angleDeg * Math.PI) / 180;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const e = 2 / ring.n;
    const a = ring.ra * Math.sign(c) * Math.abs(c) ** e;
    const b = ring.rb * Math.sign(s) * Math.abs(s) ** e;
    // Pháp tuyến của superellipse |a/ra|^n + |b/rb|^n = 1.
    const na = (Math.sign(a) * Math.abs(a / ring.ra) ** (ring.n - 1)) / ring.ra;
    const nb = (Math.sign(b) * Math.abs(b / ring.rb) ** (ring.n - 1)) / ring.rb;
    const normal = normalize([
      ring.axisA[0] * na + ring.axisB[0] * nb,
      ring.axisA[1] * na + ring.axisB[1] * nb,
      ring.axisA[2] * na + ring.axisB[2] * nb,
    ]);
    const standoff = m.standoff ?? 0;
    const position: Vec3 = [0, 1, 2].map(
      (i) => ring.center[i]! + ring.axisA[i]! * a + ring.axisB[i]! * b + normal[i]! * standoff,
    ) as Vec3;
    return { position, normal };
  };

  const partLength = (part: BodyPart): number => {
    const f = frameOf(part, 'left');
    return dist(f.start, f.end);
  };

  const uniformTs = (part: BodyPart, ringsPerMeter: number, from: number, to: number): number[] => {
    const f = frameOf(part, 'left');
    const length = dist(f.start, f.end);
    const count = Math.max(2, Math.ceil((to - from) * length * ringsPerMeter) + 1);
    const ts = Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
    for (const j of f.joints) {
      for (const d of [-0.06, -0.03, 0, 0.03, 0.06]) {
        const t = j + d / length;
        if (t > from && t < to) ts.push(t);
      }
    }
    ts.sort((a, b) => a - b);
    const minGap = 0.008 / length;
    return ts.filter((t, i) => i === 0 || t - (ts[i - 1] ?? -Infinity) > minGap);
  };

  return { ringAt, pointAt, partLength, uniformTs, proportions: p, shape, layout };
};
