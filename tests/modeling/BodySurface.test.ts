import { describe, expect, it } from 'vitest';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { kestrel } from '../fixtures/kestrel';
import { resolvedOf } from '../helpers/heroes';

const { proportions, layout } = resolvedOf(kestrel);
const surface = createBodySurface(proportions, kestrel.bodyShape, layout);

describe('BodySurface', () => {
  it('lưng ở phía −Z, pháp tuyến hướng −Z', () => {
    const { position, normal } = surface.pointAt({ part: 'torso', t: 0.7, angleDeg: 180 });
    expect(position[2]).toBeLessThan(0);
    expect(normal[2]).toBeLessThan(-0.9);
  });

  it('góc 90° trên thân là bên trái (+X)', () => {
    expect(surface.pointAt({ part: 'torso', t: 0.7, angleDeg: 90 }).position[0]).toBeGreaterThan(0.1);
  });

  it('góc 90° trên tay là phía trên, cả hai bên', () => {
    for (const side of ['left', 'right'] as const) {
      const { position, normal } = surface.pointAt({ part: 'arm', side, t: 0.3, angleDeg: 90 });
      expect(position[1]).toBeGreaterThan(layout.joints.LeftUpperArm[1]);
      expect(normal[1]).toBeGreaterThan(0.9);
    }
  });

  it('góc 90° trên chân là phía ngoài', () => {
    expect(surface.pointAt({ part: 'leg', side: 'left', t: 0.3, angleDeg: 90 }).position[0]).toBeGreaterThan(layout.joints.LeftUpperLeg[0]);
    expect(surface.pointAt({ part: 'leg', side: 'right', t: 0.3, angleDeg: 90 }).position[0]).toBeLessThan(layout.joints.RightUpperLeg[0]);
  });

  it('standoff đẩy điểm ra theo pháp tuyến', () => {
    const a = surface.pointAt({ part: 'torso', t: 0.7, angleDeg: 180 });
    const b = surface.pointAt({ part: 'torso', t: 0.7, angleDeg: 180, standoff: 0.1 });
    expect(a.position[2] - b.position[2]).toBeCloseTo(0.1, 6);
  });

  it('ring tay tại t = 0 ở khớp vai, t = 1 ở cổ tay', () => {
    expect(surface.ringAt('arm', 'left', 0).center[0]).toBeCloseTo(layout.joints.LeftUpperArm[0], 9);
    expect(surface.ringAt('arm', 'left', 1).center[0]).toBeCloseTo(layout.joints.LeftHand[0], 9);
    expect(surface.ringAt('arm', 'right', 1).center[0]).toBeCloseTo(layout.joints.RightHand[0], 9);
  });

  it('kích thước ring theo section: width theo B, depth theo A', () => {
    const section = kestrel.bodyShape.torso.sections[3]!;
    const ring = surface.ringAt('torso', undefined, section.t);
    expect(ring.rb).toBeCloseTo(section.width / 2, 6);
    expect(ring.ra).toBeCloseTo(section.depth / 2, 6);
  });

  it('partLength', () => {
    expect(surface.partLength('arm')).toBeCloseTo(proportions.arms.upperLength + proportions.arms.lowerLength, 9);
    expect(surface.partLength('torso')).toBeCloseTo(layout.neckBaseY - layout.torsoBottomY, 9);
  });
});
