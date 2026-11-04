import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { POSES } from '../../src/game/character/animation/PoseDefinition';
import { poseTargets } from '../../src/game/character/animation/PoseBuilder';
import { PoseAnimator } from '../../src/game/character/animation/ProceduralAnimator';
import { buildSkeleton, resetToBindPose } from '../../src/game/character/rigging/SkeletonBuilder';
import { BONE_NAMES, type BoneName } from '../../src/game/character/definitions/BoneNames';
import { POSE_IDS, type PoseId } from '../../src/game/character/definitions/HeroDefinition';
import { kestrel } from '../fixtures/kestrel';
import { resolvedOf } from '../helpers/heroes';

const { layout } = resolvedOf(kestrel);
const setup = () => {
  const rig = buildSkeleton(layout);
  return { rig, animator: new PoseAnimator(rig) };
};
const posed = (id: PoseId) => {
  const s = setup();
  s.animator.setPose(id, 0);
  s.animator.update(0);
  s.rig.root.updateMatrixWorld(true);
  return s;
};
const wp = (rig: ReturnType<typeof setup>['rig'], b: BoneName) => rig.byName.get(b)!.getWorldPosition(new THREE.Vector3());
const isBind = (rig: ReturnType<typeof setup>['rig'], b: BoneName, eps = 1e-6) =>
  rig.byName.get(b)!.quaternion.angleTo(rig.bindLocal.get(b)!.quaternion) < eps;

describe('POSES', () => {
  it('có đủ 8 tư thế', () => expect(Object.keys(POSES).sort()).toEqual([...POSE_IDS].sort()));

  it('poseTargets trả đủ 20 bone, bone không có trong pose giữ bind', () => {
    const { rig } = setup();
    const targets = poseTargets(rig, POSES.headTurn);
    expect(targets.size).toBe(20);
    expect(targets.get('LeftFoot')!.angleTo(rig.bindLocal.get('LeftFoot')!.quaternion)).toBeLessThan(1e-9);
  });

  it('tpose = bind', () => {
    const { rig } = posed('tpose');
    for (const b of BONE_NAMES) expect(isBind(rig, b), b).toBe(true);
  });

  it('armRaise: tay trái giơ lên', () => {
    const { rig } = posed('armRaise');
    expect(wp(rig, 'LeftHand').y).toBeGreaterThan(wp(rig, 'LeftUpperArm').y + 0.3);
  });

  it('elbowBend: cẳng tay gập ra trước, cả hai bên', () => {
    const { rig } = posed('elbowBend');
    expect(wp(rig, 'LeftHand').z).toBeGreaterThan(wp(rig, 'LeftLowerArm').z + 0.1);
    expect(wp(rig, 'RightHand').z).toBeGreaterThan(wp(rig, 'RightLowerArm').z + 0.1);
  });

  it('kneeBend: cẳng chân gập ra sau', () => {
    const { rig } = posed('kneeBend');
    expect(wp(rig, 'LeftFoot').z).toBeLessThan(wp(rig, 'LeftLowerLeg').z - 0.1);
  });

  it('legRaise: đùi trái đá ra trước', () => {
    const { rig } = posed('legRaise');
    expect(wp(rig, 'LeftLowerLeg').z).toBeGreaterThan(wp(rig, 'LeftUpperLeg').z + 0.1);
  });

  it('torsoTwist: ngực xoay ~45° so với hông', () => {
    const { rig } = posed('torsoTwist');
    const chest = rig.byName.get('Chest')!.getWorldQuaternion(new THREE.Quaternion());
    const hips = rig.byName.get('Hips')!.getWorldQuaternion(new THREE.Quaternion());
    expect(THREE.MathUtils.radToDeg(chest.angleTo(hips))).toBeCloseTo(45, 0);
  });

  it('headTurn: chỉ Neck và Head khác bind', () => {
    const { rig } = posed('headTurn');
    for (const b of BONE_NAMES) expect(isBind(rig, b), b).toBe(!(b === 'Neck' || b === 'Head'));
  });

  it('idle: tay buông xuống thấp hơn vai', () => {
    const { rig } = posed('idle');
    expect(wp(rig, 'LeftHand').y).toBeLessThan(wp(rig, 'LeftUpperArm').y - 0.3);
    expect(wp(rig, 'RightHand').y).toBeLessThan(wp(rig, 'RightUpperArm').y - 0.3);
  });
});

describe('PoseAnimator', () => {
  it('chuyển tư thế có nội suy (giữa chừng không bằng đích)', () => {
    const { rig, animator } = setup();
    animator.setPose('armRaise', 0.4);
    animator.update(0.2);
    const q = rig.byName.get('LeftUpperArm')!.quaternion;
    const target = poseTargets(rig, POSES.armRaise).get('LeftUpperArm')!;
    expect(q.angleTo(target)).toBeGreaterThan(0.05);
    expect(q.angleTo(rig.bindLocal.get('LeftUpperArm')!.quaternion)).toBeGreaterThan(0.05);
    animator.update(0.3);
    expect(rig.byName.get('LeftUpperArm')!.quaternion.angleTo(target)).toBeLessThan(1e-6);
    expect(animator.current).toBe('armRaise');
  });

  it('Review Focus #3: đổi tư thế và chỉnh tay liên tục rồi reset → không trôi', () => {
    const { rig, animator } = setup();
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      animator.setPose(POSE_IDS[Math.floor(rand() * POSE_IDS.length)]!, rand() * 0.5);
      const steps = 1 + Math.floor(rand() * 20);
      for (let s = 0; s < steps; s++) animator.update(rand() * 0.05);
      if (i % 3 === 0) {
        const bone = rig.bones[1 + Math.floor(rand() * 19)]!;
        bone.quaternion.setFromEuler(new THREE.Euler(rand(), rand(), rand()));
      }
    }
    animator.setPose('tpose', 0);
    animator.update(0);
    resetToBindPose(rig);
    for (const b of BONE_NAMES) {
      const bone = rig.byName.get(b)!;
      expect(bone.quaternion.angleTo(rig.bindLocal.get(b)!.quaternion), b).toBeLessThan(1e-6);
      expect(bone.position.distanceTo(rig.bindLocal.get(b)!.position), b).toBeLessThan(1e-9);
    }
  });

  it('thở ở idle tuần hoàn, không cộng dồn', () => {
    const { rig, animator } = setup();
    animator.setBreathing(true);
    animator.setPose('idle', 0);
    animator.update(0);
    const start = rig.byName.get('Spine')!.quaternion.clone();
    animator.update(1);
    const mid = rig.byName.get('Spine')!.quaternion.clone();
    for (let i = 0; i < 70; i++) animator.update(0.1);
    expect(mid.angleTo(start)).toBeGreaterThan(1e-3);
    expect(rig.byName.get('Spine')!.quaternion.angleTo(start)).toBeLessThan(1e-6);
  });

  it('bone đang được giữ (hold) không bị animator ghi đè; setPose bỏ giữ', () => {
    const { rig, animator } = setup();
    const bone = rig.byName.get('Head')!;
    animator.hold('Head');
    bone.rotation.set(0.5, 0, 0);
    const held = bone.quaternion.clone();
    animator.setPose('headTurn', 0, { keepHolds: true });
    animator.update(0);
    expect(bone.quaternion.angleTo(held)).toBeLessThan(1e-6);
    animator.setPose('tpose', 0);
    animator.update(0);
    expect(isBind(rig, 'Head')).toBe(true);
  });
});
