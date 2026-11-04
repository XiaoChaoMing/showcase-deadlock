import * as THREE from 'three';
import { BONE_NAMES, type BoneName } from '../definitions/BoneNames';
import type { RigSkeleton } from '../rigging/SkeletonBuilder';
import type { Pose } from './PoseDefinition';

const DEG = Math.PI / 180;

/** Quaternion đích cho đủ 20 bone: bind × xoay của pose (bone không có trong pose = bind). */
export const poseTargets = (rig: RigSkeleton, pose: Pose): Map<BoneName, THREE.Quaternion> => {
  const targets = new Map<BoneName, THREE.Quaternion>();
  for (const name of BONE_NAMES) {
    const bind = rig.bindLocal.get(name)!.quaternion.clone();
    const r = pose[name];
    if (r) bind.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0] * DEG, r[1] * DEG, r[2] * DEG)));
    targets.set(name, bind);
  }
  return targets;
};
