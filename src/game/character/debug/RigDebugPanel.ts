import * as THREE from 'three';
import type GUI from 'lil-gui';
import { BONE_NAMES, type BoneName } from '../definitions/BoneNames';
import { POSE_IDS, type PoseId } from '../definitions/HeroDefinition';
import type { PoseAnimator } from '../animation/ProceduralAnimator';
import { resetToBindPose } from '../rigging/SkeletonBuilder';
import type { CharacterInstance } from '../runtime/CharacterFactory';

export const POSE_LABELS: Record<PoseId, string> = {
  idle: 'Đứng thở',
  tpose: 'T-Pose',
  armRaise: 'Giơ tay',
  elbowBend: 'Gập khuỷu',
  kneeBend: 'Gập gối',
  legRaise: 'Nâng chân',
  torsoTwist: 'Xoay thân',
  headTurn: 'Xoay đầu',
};

export interface RigOverlayState {
  skeleton: boolean;
  joints: boolean;
  labels: boolean;
  weights: boolean;
}

/** Panel kiểm tra rig: chọn bone, xoay X/Y/Z, reset bind pose, tư thế thử, bật/tắt hiển thị. */
export const createRigDebugPanel = (
  gui: GUI,
  instance: CharacterInstance,
  animator: PoseAnimator,
  hooks: { onOverlay(o: RigOverlayState): void; onChange?(): void },
  initialOverlay: RigOverlayState = { skeleton: false, joints: true, labels: false, weights: false },
  sections: { poses?: boolean; display?: boolean } = {},
): void => {
  const DEG = THREE.MathUtils.RAD2DEG;
  const rig = gui.addFolder('Rig');
  const state = { bone: 'LeftUpperArm' as BoneName, x: 0, y: 0, z: 0 };
  const readBone = (): void => {
    const e = new THREE.Euler().setFromQuaternion(instance.rig.byName.get(state.bone)!.quaternion);
    state.x = e.x * DEG;
    state.y = e.y * DEG;
    state.z = e.z * DEG;
    for (const c of rig.controllersRecursive()) c.updateDisplay();
  };
  const writeBone = (): void => {
    animator.hold(state.bone);
    instance.rig.byName.get(state.bone)!.rotation.set(state.x / DEG, state.y / DEG, state.z / DEG);
    hooks.onChange?.();
  };
  rig.add(state, 'bone', [...BONE_NAMES].filter((b) => b !== 'Root')).name('Bone').onChange(readBone);
  rig.add(state, 'x', -180, 180, 1).name('Xoay X').onChange(writeBone);
  rig.add(state, 'y', -180, 180, 1).name('Xoay Y').onChange(writeBone);
  rig.add(state, 'z', -180, 180, 1).name('Xoay Z').onChange(writeBone);
  rig.add(
    {
      reset: () => {
        animator.setPose('tpose', 0);
        animator.update(0);
        resetToBindPose(instance.rig);
        readBone();
        hooks.onChange?.();
      },
    },
    'reset',
  ).name('Reset bind pose');

  if (sections.poses !== false) {
    const poses = gui.addFolder('Tư thế');
    for (const id of POSE_IDS) {
      poses.add({ [id]: () => { animator.setPose(id); hooks.onChange?.(); } }, id).name(POSE_LABELS[id]);
    }
  }
  readBone();
  if (sections.display === false) return;

  const display = gui.addFolder('Hiển thị');
  const overlay = { ...initialOverlay };
  const emit = (): void => hooks.onOverlay({ ...overlay });
  display.add(overlay, 'skeleton').name('Bộ xương').onChange(emit);
  display.add(overlay, 'joints').name('Khớp').onChange(emit);
  display.add(overlay, 'labels').name('Tên bone').onChange(emit);
  display.add(overlay, 'weights').name('Weight (bone đang chọn)').onChange(emit);
};
