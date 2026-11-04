import * as THREE from 'three';
import { BONE_NAMES, BONE_PARENT, type BoneName } from '../definitions/BoneNames';
import type { CharacterLayout } from '../definitions/CharacterLayout';
import type { CharacterProportions, Vec3 } from '../definitions/HeroDefinition';

const LIMB_RADIUS: Partial<Record<BoneName, number>> = {
  LeftLowerArm: 0.045, LeftHand: 0.04, RightLowerArm: 0.045, RightHand: 0.04,
  LeftLowerLeg: 0.065, LeftFoot: 0.055, RightLowerLeg: 0.065, RightFoot: 0.055,
};

const v = (p: Vec3): THREE.Vector3 => new THREE.Vector3(...p);

const capsuleBetween = (a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material): THREE.Mesh => {
  const length = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(length - 2 * radius, 0.001), 4, 10), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
};

const boxAt = (center: THREE.Vector3, size: Vec3, material: THREE.Material): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.copy(center);
  return mesh;
};

/** Hình nhân khối đơn giản để kiểm tra tỷ lệ (M1). Không dùng cho nhân vật thật. */
export const buildProportionPreview = (layout: CharacterLayout, p: CharacterProportions): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'proportion-preview';
  const body = new THREE.MeshStandardMaterial({ color: '#8a94a3', roughness: 0.8 });
  const joint = new THREE.MeshStandardMaterial({ color: '#f2a93b', roughness: 0.5 });
  const J = layout.joints;

  const torsoHeight = layout.neckBaseY - layout.torsoBottomY;
  const torsoWidth = (p.torso.shoulderWidth + p.torso.hipWidth) / 2;
  group.add(boxAt(new THREE.Vector3(0, layout.torsoBottomY + torsoHeight / 2, 0), [torsoWidth, torsoHeight, 0.2], body));
  group.add(capsuleBetween(v(J.Neck), v(J.Head), p.neck.radius, body));
  group.add(boxAt(new THREE.Vector3(0, J.Head[1] + p.head.height / 2, 0), [p.head.width, p.head.height, p.head.depth], body));

  for (const name of BONE_NAMES) {
    const parent = BONE_PARENT[name];
    const radius = LIMB_RADIUS[name];
    if (parent && radius) group.add(capsuleBetween(v(J[parent]), v(J[name]), radius, body));
  }
  for (const side of ['left', 'right'] as const) {
    const wrist = v(side === 'left' ? J.LeftHand : J.RightHand);
    const tip = v(layout.handTip[side]);
    group.add(boxAt(wrist.clone().add(tip).multiplyScalar(0.5), [p.arms.handLength, 0.08, 0.035], body));
    const ankle = v(side === 'left' ? J.LeftFoot : J.RightFoot);
    group.add(boxAt(new THREE.Vector3(ankle.x, p.foot.height / 2, p.foot.length * 0.25), [p.foot.width, p.foot.height, p.foot.length], body));
  }
  for (const name of BONE_NAMES) {
    if (name === 'Root') continue;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), joint);
    sphere.position.copy(v(J[name]));
    group.add(sphere);
  }
  return group;
};
