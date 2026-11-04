import type { BoneName } from './BoneNames';

export type Vec3 = [number, number, number];
export type Side = 'left' | 'right';
export type BodyPart = 'torso' | 'neck' | 'head' | 'arm' | 'hand' | 'leg' | 'foot';

export const BODY_PARTS: readonly BodyPart[] = ['torso', 'neck', 'head', 'arm', 'hand', 'leg', 'foot'];
export const SIDED_PARTS: readonly BodyPart[] = ['arm', 'hand', 'leg', 'foot'];

export interface CharacterProportions {
  height: number;
  head: { width: number; height: number; depth: number };
  neck: { length: number; radius: number };
  torso: { length: number; shoulderWidth: number; hipWidth: number; pelvisDepth: number };
  arms: { upperLength: number; lowerLength: number; handLength: number };
  legs: { upperLength: number; lowerLength: number };
  foot: { length: number; height: number; width: number };
}

export interface Section {
  t: number;
  width: number;
  depth: number;
  forward?: number;
}

export interface BodyShape {
  radialSegments: number;
  ringsPerMeter: number;
  shading: 'flat' | 'smooth';
  /** Đơn vị mét. t: 0 = đáy chậu, 1 = gốc cổ. */
  torso: { squareness: number; sections: Section[] };
  /** Bán kính đỉnh cổ / bán kính gốc cổ. */
  neck: { taper: number };
  /** Tỷ lệ so với proportions.head. t: 0 = cằm, 1 = đỉnh đầu. */
  head: { squareness: number; sections: Section[] };
  /** Đơn vị mét. t: 0 = khớp vai, 1 = cổ tay. */
  arm: { squareness: number; sections: Section[] };
  /** Đơn vị mét. t: 0 = khớp hông, 1 = cổ chân. */
  leg: { squareness: number; sections: Section[] };
  hand: { width: number; thickness: number; squareness: number };
  foot: { squareness: number; toeTaper: number };
  /** Khối cơ / rãnh trên bề mặt (tuỳ chọn). */
  muscles?: Muscle[];
}

/**
 * Chỗ phồng (amount > 0) hoặc rãnh (amount < 0) trên bề mặt, giảm dần mượt (cos²) ra rìa.
 * Trên torso/neck/head tự đối xứng qua góc −angleDeg; trên tay/chân áp dụng cho cả hai bên.
 */
export interface Muscle {
  part: BodyPart;
  t: number;
  /** Nửa chiều dài vùng ảnh hưởng theo t. */
  length: number;
  angleDeg: number;
  /** Nửa độ rộng vùng ảnh hưởng quanh bộ phận (độ). */
  spreadDeg: number;
  /** Mét; âm = lõm vào. */
  amount: number;
}

export type ColorSpec =
  | string
  | { color: string; emissive?: number; metalness?: number; roughness?: number };

export interface SurfaceMount {
  part: BodyPart;
  side?: Side;
  t: number;
  angleDeg: number;
  standoff?: number;
}

export type Attach = { socket: string } | { mount: SurfaceMount };

export interface SocketDefinition {
  name: string;
  mount: SurfaceMount;
  rotationDeg?: Vec3;
}

interface ItemBase {
  id: string;
  color: string;
  edgeColor?: string;
  bone?: BoneName;
}

export interface PlateItem extends ItemBase {
  kind: 'plate';
  part: BodyPart;
  side?: Side;
  tStart: number;
  tEnd: number;
  angleStartDeg: number;
  angleEndDeg: number;
  thickness: number;
  gap: number;
  layers?: number;
  layerOverlap?: number;
  bulge?: number;
  /** Vuốt nhọn mép cuối (phía tEnd) thành mũi chữ V ở giữa, dài thêm bấy nhiêu mét. */
  point?: number;
  /** Sống gờ sắc dọc giữa tấm, nhô ra bấy nhiêu mét. */
  ridge?: number;
}

export interface BandItem extends ItemBase {
  kind: 'band';
  part: BodyPart;
  side?: Side;
  t: number;
  height: number;
  angleStartDeg: number;
  angleEndDeg: number;
  thickness: number;
  gap: number;
}

export interface ShellItem extends ItemBase {
  kind: 'shell';
  coverage: number;
  faceOpeningDeg: number;
  /** Mép trên ô hở mặt (t của đầu); phía trên kín. Mặc định 0.72. */
  faceOpeningTop?: number;
  thickness: number;
  gap: number;
  crest?: { height: number; width: number };
}

export interface BoxItem extends ItemBase {
  kind: 'box';
  attach: Attach;
  size: Vec3;
  cornerRadius: number;
  offset?: Vec3;
  rotationDeg?: Vec3;
}

/**
 * box/spike/wedge/blade: size = [x, y, z], chiều dài theo z, mũi nhọn về +Z.
 * cylinder/cone: size = [đường kính, chiều dài, 0], trục theo +Z.
 */
export interface Primitive {
  shape: 'box' | 'cylinder' | 'cone' | 'spike' | 'wedge' | 'blade';
  size: Vec3;
  position: Vec3;
  rotationDeg?: Vec3;
  color: string;
}

export interface AssemblyItem extends ItemBase {
  kind: 'assembly';
  attach: Attach;
  parts: Primitive[];
  offset?: Vec3;
  rotationDeg?: Vec3;
  scale?: number;
}

export type EquipmentItem = PlateItem | BandItem | ShellItem | BoxItem | AssemblyItem;

export const POSE_IDS = [
  'idle', 'tpose', 'armRaise', 'elbowBend', 'kneeBend', 'legRaise', 'torsoTwist', 'headTurn',
] as const;
export type PoseId = (typeof POSE_IDS)[number];

export interface HeroProfile {
  name: string;
  role: string;
  tagline: string;
  description: string;
}

export interface HeroDefinition {
  $schema?: string;
  id: string;
  version: 1;
  profile: HeroProfile;
  proportions: CharacterProportions;
  bodyShape: BodyShape;
  palette: Record<string, ColorSpec>;
  bodyPaint: Record<BodyPart, string>;
  sockets: SocketDefinition[];
  equipment: EquipmentItem[];
  showcase: {
    defaultPose: PoseId;
    cameraAzimuthDeg: number;
    cameraElevationDeg: number;
    cameraDistance: number;
  };
}
