import type { BoneName } from '../definitions/BoneNames';
import type { PoseId, Vec3 } from '../definitions/HeroDefinition';

/** Góc xoay (độ, Euler XYZ) cộng lên bind pose của từng bone; bone không khai báo giữ bind. */
export type Pose = Partial<Record<BoneName, Vec3>>;

/*
 * Quy ước dấu (bind = T-Pose, mọi bone rotation identity):
 *  - Cánh tay trái chạy +X: xoay Z dương → giơ lên; xoay Y âm → gập ra trước.
 *  - Cánh tay phải chạy −X: xoay Z âm → giơ lên; xoay Y dương → gập ra trước.
 *  - Chân chạy −Y: xoay X âm → đá ra trước; xoay X dương → gập ra sau.
 */
export const POSES: Record<PoseId, Pose> = {
  tpose: {},
  idle: {
    LeftShoulder: [0, 0, -6],
    RightShoulder: [0, 0, 6],
    LeftUpperArm: [0, 8, -68],
    RightUpperArm: [0, -8, 68],
    LeftLowerArm: [0, -18, 0],
    RightLowerArm: [0, 18, 0],
    LeftHand: [-10, 0, 0],
    RightHand: [-10, 0, 0],
    Spine: [2, 0, 0],
    LeftUpperLeg: [0, 0, 3],
    RightUpperLeg: [0, 0, -3],
  },
  armRaise: {
    LeftShoulder: [0, 0, 18],
    LeftUpperArm: [0, 0, 62],
  },
  elbowBend: {
    LeftLowerArm: [0, -100, 0],
    RightLowerArm: [0, 100, 0],
  },
  kneeBend: {
    LeftLowerLeg: [90, 0, 0],
  },
  legRaise: {
    LeftUpperLeg: [-70, 0, 0],
    LeftLowerLeg: [25, 0, 0],
  },
  torsoTwist: {
    Spine: [0, 20, 0],
    Chest: [0, 25, 0],
  },
  headTurn: {
    Neck: [0, 25, 0],
    Head: [0, 35, 0],
  },
};
