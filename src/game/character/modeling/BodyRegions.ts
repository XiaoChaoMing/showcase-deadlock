import type { BodyPart, Side } from '../definitions/HeroDefinition';

export enum BodyRegion {
  Torso = 0,
  Neck = 1,
  Head = 2,
  ArmL = 3,
  ArmR = 4,
  HandL = 5,
  HandR = 6,
  LegL = 7,
  LegR = 8,
  FootL = 9,
  FootR = 10,
}

export const REGION_PART: Record<BodyRegion, { part: BodyPart; side?: Side }> = {
  [BodyRegion.Torso]: { part: 'torso' },
  [BodyRegion.Neck]: { part: 'neck' },
  [BodyRegion.Head]: { part: 'head' },
  [BodyRegion.ArmL]: { part: 'arm', side: 'left' },
  [BodyRegion.ArmR]: { part: 'arm', side: 'right' },
  [BodyRegion.HandL]: { part: 'hand', side: 'left' },
  [BodyRegion.HandR]: { part: 'hand', side: 'right' },
  [BodyRegion.LegL]: { part: 'leg', side: 'left' },
  [BodyRegion.LegR]: { part: 'leg', side: 'right' },
  [BodyRegion.FootL]: { part: 'foot', side: 'left' },
  [BodyRegion.FootR]: { part: 'foot', side: 'right' },
};

export const BODY_REGIONS: BodyRegion[] = Object.keys(REGION_PART).map(Number) as BodyRegion[];
