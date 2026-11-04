import type { CharacterProportions } from './HeroDefinition';

export const HEIGHT_TOLERANCE = 0.02;

export type ResolvedProportionsResult =
  | { ok: true; value: CharacterProportions; scale: number }
  | { ok: false; error: string };

/** Tổng các đoạn dọc từ đáy bàn chân tới đỉnh đầu. */
export const verticalSum = (p: CharacterProportions): number =>
  p.foot.height + p.legs.lowerLength + p.legs.upperLength + p.torso.length + p.neck.length + p.head.height;

export const resolveProportions = (p: CharacterProportions): ResolvedProportionsResult => {
  const sum = verticalSum(p);
  if (Math.abs(sum - p.height) > HEIGHT_TOLERANCE + 1e-9) {
    return {
      ok: false,
      error:
        `Tổng các đoạn dọc (bàn chân + cẳng chân + đùi + thân + cổ + đầu) là ${sum.toFixed(3)}, ` +
        `lệch quá ${HEIGHT_TOLERANCE} so với height ${p.height.toFixed(3)}. Hãy chỉnh lại các đoạn hoặc height.`,
    };
  }
  const scale = sum === p.height ? 1 : p.height / sum;
  const value: CharacterProportions = {
    ...p,
    head: { ...p.head, height: p.head.height * scale },
    neck: { ...p.neck, length: p.neck.length * scale },
    torso: { ...p.torso, length: p.torso.length * scale },
    legs: { upperLength: p.legs.upperLength * scale, lowerLength: p.legs.lowerLength * scale },
    foot: { ...p.foot, height: p.foot.height * scale },
    arms: { ...p.arms },
  };
  return { ok: true, value, scale };
};
