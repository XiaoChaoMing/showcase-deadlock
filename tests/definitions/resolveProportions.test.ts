import { describe, expect, it } from 'vitest';
import { resolveProportions, verticalSum } from '../../src/game/character/definitions/resolveProportions';
import { kestrelProportions } from '../fixtures/kestrel';

describe('resolveProportions', () => {
  it('co giãn khi lệch ≤ 0.02', () => {
    const r = resolveProportions(kestrelProportions);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.scale).toBeCloseTo(1.8 / 1.81, 9);
    expect(verticalSum(r.value)).toBeCloseTo(1.8, 9);
    expect(r.value.torso.shoulderWidth).toBe(0.46);
    expect(r.value.arms.upperLength).toBe(0.3);
  });

  it('không đổi khi tổng đã khớp', () => {
    const exact = { ...kestrelProportions, height: 1.81 };
    const r = resolveProportions(exact);
    expect(r.ok && r.scale).toBe(1);
  });

  it('báo lỗi khi lệch > 0.02', () => {
    const r = resolveProportions({ ...kestrelProportions, height: 1.75 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain('1.810');
    expect(r.error).toContain('1.750');
  });
});
