/** Thứ tự trong mảng này chính là index dùng cho skinning. */
export const BONE_NAMES = [
  'Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head',
  'LeftShoulder', 'LeftUpperArm', 'LeftLowerArm', 'LeftHand',
  'RightShoulder', 'RightUpperArm', 'RightLowerArm', 'RightHand',
  'LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot',
  'RightUpperLeg', 'RightLowerLeg', 'RightFoot',
] as const;

export type BoneName = (typeof BONE_NAMES)[number];

export const BONE_PARENT: Record<BoneName, BoneName | null> = {
  Root: null,
  Hips: 'Root',
  Spine: 'Hips',
  Chest: 'Spine',
  Neck: 'Chest',
  Head: 'Neck',
  LeftShoulder: 'Chest',
  LeftUpperArm: 'LeftShoulder',
  LeftLowerArm: 'LeftUpperArm',
  LeftHand: 'LeftLowerArm',
  RightShoulder: 'Chest',
  RightUpperArm: 'RightShoulder',
  RightLowerArm: 'RightUpperArm',
  RightHand: 'RightLowerArm',
  LeftUpperLeg: 'Hips',
  LeftLowerLeg: 'LeftUpperLeg',
  LeftFoot: 'LeftLowerLeg',
  RightUpperLeg: 'Hips',
  RightLowerLeg: 'RightUpperLeg',
  RightFoot: 'RightLowerLeg',
};

export const isBoneName = (value: unknown): value is BoneName =>
  typeof value === 'string' && (BONE_NAMES as readonly string[]).includes(value);

export const boneIndex = (name: BoneName): number => BONE_NAMES.indexOf(name);
