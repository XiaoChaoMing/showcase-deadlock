import { describe, expect, it } from 'vitest';
import { computeLayout } from '../../src/game/character/definitions/CharacterLayout';
import { resolveProportions } from '../../src/game/character/definitions/resolveProportions';
import { BONE_NAMES, BONE_PARENT } from '../../src/game/character/definitions/BoneNames';
import { referenceProportions as kestrelProportions } from '../fixtures/reference';

const resolved = () => {
  const r = resolveProportions(kestrelProportions);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('BoneNames', () => {
  it('20 bone, cây đúng mục 4.1', () => {
    expect(BONE_NAMES).toHaveLength(20);
    expect(BONE_PARENT.Root).toBeNull();
    expect(BONE_PARENT.Hips).toBe('Root');
    expect(BONE_PARENT.LeftShoulder).toBe('Chest');
    expect(BONE_PARENT.LeftUpperLeg).toBe('Hips');
    expect(BONE_PARENT.RightFoot).toBe('RightLowerLeg');
  });
});

describe('computeLayout', () => {
  it('đủ 20 joint, tay trái ở +X, đối xứng', () => {
    const L = computeLayout(resolved());
    expect(Object.keys(L.joints)).toHaveLength(20);
    expect(L.joints.LeftUpperArm[0]).toBeCloseTo(0.1955, 6);
    expect(L.joints.RightUpperArm[0]).toBeCloseTo(-0.1955, 6);
    expect(L.headTopY).toBeCloseTo(1.8, 9);
    expect(L.joints.Root).toEqual([0, 0, 0]);
    expect(L.joints.Hips[1]).toBeGreaterThan(0.9);
  });

  it('khuỷu, cổ tay, gối, cổ chân đặt đúng', () => {
    const p = resolved();
    const L = computeLayout(p);
    expect(L.joints.LeftLowerArm[0] - L.joints.LeftUpperArm[0]).toBeCloseTo(0.3, 9);
    expect(L.joints.LeftHand[0] - L.joints.LeftLowerArm[0]).toBeCloseTo(0.28, 9);
    expect(L.joints.LeftFoot[1]).toBeCloseTo(p.foot.height, 9);
    expect(L.joints.LeftUpperLeg[0]).toBeCloseTo(0.096, 9);
    expect(L.elbowT).toBeCloseTo(0.3 / 0.58, 9);
    expect(L.handTip.left[0]).toBeCloseTo(L.joints.LeftHand[0] + 0.17, 9);
    expect(L.toeTip.right[2]).toBeCloseTo(0.75 * 0.25, 9);
  });
});

describe('nối khớp liền mạch', () => {
  it('khớp vai đủ thấp để đầu cánh tay nằm dưới gốc cổ', () => {
    const p = resolved();
    const L = computeLayout(p);
    const shoulderToNeck = L.neckBaseY - L.joints.LeftUpperArm[1];
    expect(shoulderToNeck).toBeGreaterThanOrEqual(0.1 * p.torso.length);
  });
});
