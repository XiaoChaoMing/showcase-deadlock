import type { BoneName } from './BoneNames';
import type { CharacterProportions, Side, Vec3 } from './HeroDefinition';

/** Hằng số đặt khớp dùng chung cho mọi hero. */
const SPINE_RATIO = 0.2;
const CHEST_RATIO = 0.55;
const SHOULDER_HEIGHT_RATIO = 0.88;
const CLAVICLE_X_RATIO = 0.1;
const UPPER_ARM_X_RATIO = 0.425;
const HIP_JOINT_X_RATIO = 0.3;
const TOE_FORWARD_RATIO = 0.75;
const TOE_TIP_Y = 0.02;

export interface CharacterLayout {
  joints: Record<BoneName, Vec3>;
  hipY: number;
  torsoBottomY: number;
  neckBaseY: number;
  headTopY: number;
  elbowT: number;
  kneeT: number;
  handTip: Record<Side, Vec3>;
  toeTip: Record<Side, Vec3>;
}

/** p phải là proportions đã qua resolveProportions. */
export const computeLayout = (p: CharacterProportions): CharacterLayout => {
  const hipY = p.foot.height + p.legs.lowerLength + p.legs.upperLength;
  const L = p.torso.length;
  const neckBaseY = hipY + L;
  const headY = neckBaseY + p.neck.length;
  const shoulderY = hipY + SHOULDER_HEIGHT_RATIO * L;
  const clavicleX = CLAVICLE_X_RATIO * p.torso.shoulderWidth;
  const upperArmX = UPPER_ARM_X_RATIO * p.torso.shoulderWidth;
  const elbowX = upperArmX + p.arms.upperLength;
  const wristX = elbowX + p.arms.lowerLength;
  const hipX = HIP_JOINT_X_RATIO * p.torso.hipWidth;
  const kneeY = hipY - p.legs.upperLength;
  const ankleY = p.foot.height;

  const joints: Record<BoneName, Vec3> = {
    Root: [0, 0, 0],
    Hips: [0, hipY, 0],
    Spine: [0, hipY + SPINE_RATIO * L, 0],
    Chest: [0, hipY + CHEST_RATIO * L, 0],
    Neck: [0, neckBaseY, 0],
    Head: [0, headY, 0],
    LeftShoulder: [clavicleX, shoulderY, 0],
    LeftUpperArm: [upperArmX, shoulderY, 0],
    LeftLowerArm: [elbowX, shoulderY, 0],
    LeftHand: [wristX, shoulderY, 0],
    RightShoulder: [-clavicleX, shoulderY, 0],
    RightUpperArm: [-upperArmX, shoulderY, 0],
    RightLowerArm: [-elbowX, shoulderY, 0],
    RightHand: [-wristX, shoulderY, 0],
    LeftUpperLeg: [hipX, hipY, 0],
    LeftLowerLeg: [hipX, kneeY, 0],
    LeftFoot: [hipX, ankleY, 0],
    RightUpperLeg: [-hipX, hipY, 0],
    RightLowerLeg: [-hipX, kneeY, 0],
    RightFoot: [-hipX, ankleY, 0],
  };

  const handTipX = wristX + p.arms.handLength;
  const toeZ = TOE_FORWARD_RATIO * p.foot.length;
  return {
    joints,
    hipY,
    torsoBottomY: hipY - p.torso.pelvisDepth,
    neckBaseY,
    headTopY: headY + p.head.height,
    elbowT: p.arms.upperLength / (p.arms.upperLength + p.arms.lowerLength),
    kneeT: p.legs.upperLength / (p.legs.upperLength + p.legs.lowerLength),
    handTip: { left: [handTipX, shoulderY, 0], right: [-handTipX, shoulderY, 0] },
    toeTip: { left: [hipX, TOE_TIP_Y, toeZ], right: [-hipX, TOE_TIP_Y, toeZ] },
  };
};
