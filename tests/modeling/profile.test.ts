import { describe, expect, it } from 'vitest';
import { sampleProfile } from '../../src/game/character/modeling/geometry/profile';
import type { Section } from '../../src/game/character/definitions/HeroDefinition';

const sections: Section[] = [
  { t: 0, width: 0.2, depth: 0.1, forward: 0 },
  { t: 0.3, width: 0.4, depth: 0.1, forward: 0.02 },
  { t: 0.6, width: 0.1, depth: 0.3 },
  { t: 1, width: 0.12, depth: 0.05, forward: -0.01 },
];

describe('sampleProfile', () => {
  it('trả đúng giá trị tại t của section', () => {
    for (const s of sections) {
      const r = sampleProfile(sections, s.t);
      expect(r.width).toBeCloseTo(s.width, 9);
      expect(r.depth).toBeCloseTo(s.depth, 9);
      expect(r.forward).toBeCloseTo(s.forward ?? 0, 9);
    }
  });

  it('giữa hai section không vọt quá hai đầu', () => {
    for (let i = 0; i < sections.length - 1; i++) {
      const a = sections[i]!;
      const b = sections[i + 1]!;
      for (let k = 1; k < 20; k++) {
        const t = a.t + ((b.t - a.t) * k) / 20;
        const r = sampleProfile(sections, t);
        expect(r.width).toBeGreaterThanOrEqual(Math.min(a.width, b.width) - 1e-12);
        expect(r.width).toBeLessThanOrEqual(Math.max(a.width, b.width) + 1e-12);
        expect(r.depth).toBeGreaterThanOrEqual(Math.min(a.depth, b.depth) - 1e-12);
        expect(r.depth).toBeLessThanOrEqual(Math.max(a.depth, b.depth) + 1e-12);
      }
    }
  });

  it('kẹp t ngoài [0, 1]', () => {
    expect(sampleProfile(sections, -1).width).toBeCloseTo(0.2, 9);
    expect(sampleProfile(sections, 2).width).toBeCloseTo(0.12, 9);
  });
});
