import type { Section } from '../../definitions/HeroDefinition';

export interface ProfileSample {
  width: number;
  depth: number;
  forward: number;
}

type Channel = (s: Section) => number;

const CHANNELS: Record<keyof ProfileSample, Channel> = {
  width: (s) => s.width,
  depth: (s) => s.depth,
  forward: (s) => s.forward ?? 0,
};

/** Hệ số tiếp tuyến Fritsch–Carlson: nội suy cubic không vọt quá các điểm mốc. */
const monotoneTangents = (ts: number[], ys: number[]): number[] => {
  const n = ts.length;
  const slopes = ts.slice(0, -1).map((t, i) => ((ys[i + 1] ?? 0) - (ys[i] ?? 0)) / ((ts[i + 1] ?? t) - t));
  const m = ys.map((_, i) => {
    if (i === 0) return slopes[0] ?? 0;
    if (i === n - 1) return slopes[n - 2] ?? 0;
    const a = slopes[i - 1] ?? 0;
    const b = slopes[i] ?? 0;
    return a * b <= 0 ? 0 : (a + b) / 2;
  });
  slopes.forEach((d, i) => {
    if (d === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      return;
    }
    const alpha = (m[i] ?? 0) / d;
    const beta = (m[i + 1] ?? 0) / d;
    const h = alpha * alpha + beta * beta;
    if (h > 9) {
      const tau = 3 / Math.sqrt(h);
      m[i] = tau * alpha * d;
      m[i + 1] = tau * beta * d;
    }
  });
  return m;
};

const hermite = (ts: number[], ys: number[], ms: number[], t: number): number => {
  let i = 0;
  while (i < ts.length - 2 && t > (ts[i + 1] ?? 1)) i++;
  const t0 = ts[i] ?? 0;
  const t1 = ts[i + 1] ?? 1;
  const h = t1 - t0;
  const s = h > 0 ? (t - t0) / h : 0;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * (ys[i] ?? 0) +
    (s3 - 2 * s2 + s) * h * (ms[i] ?? 0) +
    (-2 * s3 + 3 * s2) * (ys[i + 1] ?? 0) +
    (s3 - s2) * h * (ms[i + 1] ?? 0)
  );
};

/** Nội suy tiết diện tại t ∈ [0, 1] (t ngoài khoảng bị kẹp lại). */
export const sampleProfile = (sections: Section[], t: number): ProfileSample => {
  const tt = Math.min(1, Math.max(0, t));
  const ts = sections.map((s) => s.t);
  const sample = {} as ProfileSample;
  for (const key of Object.keys(CHANNELS) as Array<keyof ProfileSample>) {
    const ys = sections.map(CHANNELS[key]);
    sample[key] = hermite(ts, ys, monotoneTangents(ts, ys), tt);
  }
  return sample;
};
