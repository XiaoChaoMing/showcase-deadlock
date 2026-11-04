import type { BoneName } from '../definitions/BoneNames';
import type { CharacterLayout } from '../definitions/CharacterLayout';
import type { Vec3 } from '../definitions/HeroDefinition';
import { BodyRegion } from '../modeling/BodyGeometry';

const side = (s: 'Left' | 'Right') => ({
  arm: ['Chest', `${s}Shoulder`, `${s}UpperArm`, `${s}LowerArm`, `${s}Hand`] as BoneName[],
  hand: [`${s}LowerArm`, `${s}Hand`] as BoneName[],
  leg: ['Hips', `${s}UpperLeg`, `${s}LowerLeg`, `${s}Foot`] as BoneName[],
  foot: [`${s}LowerLeg`, `${s}Foot`] as BoneName[],
});
const L = side('Left');
const R = side('Right');

/** Bone được phép ảnh hưởng tới từng vùng thân (giới hạn vùng để tránh weight "nhảy" sang bộ phận khác). */
export const REGION_BONES: Record<BodyRegion, BoneName[]> = {
  [BodyRegion.Torso]: [
    'Hips', 'Spine', 'Chest', 'LeftShoulder', 'RightShoulder',
    'LeftUpperArm', 'RightUpperArm', 'LeftUpperLeg', 'RightUpperLeg',
  ],
  [BodyRegion.Neck]: ['Chest', 'Neck', 'Head'],
  [BodyRegion.Head]: ['Neck', 'Head'],
  [BodyRegion.ArmL]: L.arm,
  [BodyRegion.ArmR]: R.arm,
  [BodyRegion.HandL]: L.hand,
  [BodyRegion.HandR]: R.hand,
  [BodyRegion.LegL]: L.leg,
  [BodyRegion.LegR]: R.leg,
  [BodyRegion.FootL]: L.foot,
  [BodyRegion.FootR]: R.foot,
};

/** Đoạn thẳng đại diện cho bone ở bind pose; Root không có đoạn (không bao giờ có weight). */
export const boneSegment = (name: BoneName, layout: CharacterLayout): [Vec3, Vec3] | null => {
  const J = layout.joints;
  switch (name) {
    case 'Root':
      return null;
    case 'Hips':
      return [J.Hips, J.Spine];
    case 'Spine':
      return [J.Spine, J.Chest];
    case 'Chest':
      return [J.Chest, J.Neck];
    case 'Neck':
      return [J.Neck, J.Head];
    case 'Head':
      return [J.Head, [J.Head[0], layout.headTopY, J.Head[2]]];
    case 'LeftShoulder':
      return [J.LeftShoulder, J.LeftUpperArm];
    case 'RightShoulder':
      return [J.RightShoulder, J.RightUpperArm];
    case 'LeftUpperArm':
      return [J.LeftUpperArm, J.LeftLowerArm];
    case 'RightUpperArm':
      return [J.RightUpperArm, J.RightLowerArm];
    case 'LeftLowerArm':
      return [J.LeftLowerArm, J.LeftHand];
    case 'RightLowerArm':
      return [J.RightLowerArm, J.RightHand];
    case 'LeftHand':
      return [J.LeftHand, layout.handTip.left];
    case 'RightHand':
      return [J.RightHand, layout.handTip.right];
    case 'LeftUpperLeg':
      return [J.LeftUpperLeg, J.LeftLowerLeg];
    case 'RightUpperLeg':
      return [J.RightUpperLeg, J.RightLowerLeg];
    case 'LeftLowerLeg':
      return [J.LeftLowerLeg, J.LeftFoot];
    case 'RightLowerLeg':
      return [J.RightLowerLeg, J.RightFoot];
    case 'LeftFoot':
      return [J.LeftFoot, layout.toeTip.left];
    case 'RightFoot':
      return [J.RightFoot, layout.toeTip.right];
  }
};
