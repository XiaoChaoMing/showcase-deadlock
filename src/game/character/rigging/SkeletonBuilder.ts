import * as THREE from 'three';
import { BONE_NAMES, BONE_PARENT, type BoneName } from '../definitions/BoneNames';
import type { CharacterLayout } from '../definitions/CharacterLayout';

export interface BindTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export interface RigSkeleton {
  root: THREE.Bone;
  /** Theo đúng thứ tự BONE_NAMES (= index skinning). */
  bones: THREE.Bone[];
  byName: Map<BoneName, THREE.Bone>;
  skeleton: THREE.Skeleton;
  bindLocal: Map<BoneName, BindTransform>;
}

/** Dựng 20 bone ở bind pose (T-Pose): rotation identity, vị trí local = joint con − joint cha. */
export const buildSkeleton = (layout: CharacterLayout): RigSkeleton => {
  const byName = new Map<BoneName, THREE.Bone>();
  const bindLocal = new Map<BoneName, BindTransform>();
  const bones = BONE_NAMES.map((name) => {
    const bone = new THREE.Bone();
    bone.name = name;
    byName.set(name, bone);
    return bone;
  });

  for (const name of BONE_NAMES) {
    const bone = byName.get(name)!;
    const parentName = BONE_PARENT[name];
    const joint = layout.joints[name];
    const parentJoint = parentName ? layout.joints[parentName] : ([0, 0, 0] as const);
    bone.position.set(joint[0] - parentJoint[0], joint[1] - parentJoint[1], joint[2] - parentJoint[2]);
    if (parentName) byName.get(parentName)!.add(bone);
    bindLocal.set(name, { position: bone.position.clone(), quaternion: bone.quaternion.clone() });
  }

  const root = byName.get('Root')!;
  root.updateMatrixWorld(true);
  return { root, bones, byName, skeleton: new THREE.Skeleton(bones), bindLocal };
};

/** Đưa mọi bone về đúng bind pose (vị trí, xoay, scale) rồi cập nhật ma trận. */
export const resetToBindPose = (rig: RigSkeleton): void => {
  for (const [name, bind] of rig.bindLocal) {
    const bone = rig.byName.get(name)!;
    bone.position.copy(bind.position);
    bone.quaternion.copy(bind.quaternion);
    bone.scale.set(1, 1, 1);
  }
  rig.root.updateMatrixWorld(true);
};
