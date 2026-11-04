import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSkeleton, resetToBindPose } from '../../src/game/character/rigging/SkeletonBuilder';
import { createSockets } from '../../src/game/character/rigging/Sockets';
import { BONE_NAMES, BONE_PARENT } from '../../src/game/character/definitions/BoneNames';
import { createBodySurface } from '../../src/game/character/modeling/BodySurface';
import { kestrel } from '../fixtures/kestrel';
import { resolvedOf } from '../helpers/heroes';

const { proportions, layout } = resolvedOf(kestrel);
const worldPos = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());

describe('buildSkeleton', () => {
  const rig = buildSkeleton(layout);
  rig.root.updateMatrixWorld(true);

  it('20 bone đúng thứ tự BONE_NAMES, tên không trùng', () => {
    expect(rig.bones).toHaveLength(20);
    expect(rig.bones.map((b) => b.name)).toEqual([...BONE_NAMES]);
    expect(new Set(rig.bones.map((b) => b.name)).size).toBe(20);
    expect(rig.skeleton.bones).toHaveLength(20);
    expect(rig.byName.get('LeftHand')).toBe(rig.bones[9]);
  });

  it('cây bone đúng BONE_PARENT', () => {
    for (const bone of rig.bones) {
      const parent = BONE_PARENT[bone.name as keyof typeof BONE_PARENT];
      if (parent === null) expect(bone).toBe(rig.root);
      else expect(bone.parent?.name).toBe(parent);
    }
  });

  it('vị trí world khớp layout, rotation identity, scale 1', () => {
    for (const name of BONE_NAMES) {
      const bone = rig.byName.get(name)!;
      const p = worldPos(bone);
      const expected = layout.joints[name];
      expect(p.distanceTo(new THREE.Vector3(...expected)), name).toBeLessThan(1e-6);
      expect(bone.quaternion.equals(new THREE.Quaternion()), name).toBe(true);
      expect(bone.scale.equals(new THREE.Vector3(1, 1, 1)), name).toBe(true);
    }
  });

  it('Root ở gốc toạ độ, Hips là con của Root ở hipY', () => {
    expect(worldPos(rig.root).length()).toBe(0);
    const hips = rig.byName.get('Hips')!;
    expect(hips.parent).toBe(rig.root);
    expect(worldPos(hips).y).toBeCloseTo(layout.hipY, 9);
  });

  it('resetToBindPose khôi phục sau khi xoay và dịch', () => {
    for (const name of ['Spine', 'LeftUpperArm', 'RightLowerLeg', 'Head', 'Hips'] as const) {
      const b = rig.byName.get(name)!;
      b.rotation.set(0.4, -0.7, 1.1);
      b.position.x += 0.1;
      b.scale.setScalar(1.3);
    }
    resetToBindPose(rig);
    for (const name of BONE_NAMES) {
      expect(worldPos(rig.byName.get(name)!).distanceTo(new THREE.Vector3(...layout.joints[name])), name).toBeLessThan(1e-9);
    }
  });
});

describe('createSockets', () => {
  const rig = buildSkeleton(layout);
  const surface = createBodySurface(proportions, kestrel.bodyShape, layout);
  const sockets = createSockets(kestrel.sockets, surface, layout, rig);
  rig.root.updateMatrixWorld(true);

  it('socket back_weapon là con của Chest, đúng vị trí bề mặt + standoff', () => {
    const socket = sockets.get('back_weapon')!;
    expect(socket.name).toBe('socket_back_weapon');
    expect(socket.parent?.name).toBe('Chest');
    const def = kestrel.sockets.find((s) => s.name === 'back_weapon')!;
    const expected = new THREE.Vector3(...surface.pointAt(def.mount).position);
    expect(worldPos(socket).distanceTo(expected)).toBeLessThan(1e-6);
  });

  it('mỗi socket khai báo đều được tạo, không nằm trong skeleton', () => {
    expect([...sockets.keys()].sort()).toEqual(kestrel.sockets.map((s) => s.name).sort());
    for (const s of sockets.values()) expect(rig.skeleton.bones).not.toContain(s);
  });

  it('socket đi theo bone khi bone xoay', () => {
    const socket = sockets.get('back_weapon')!;
    const before = worldPos(socket);
    rig.byName.get('Spine')!.rotation.y = 0.8;
    rig.root.updateMatrixWorld(true);
    expect(worldPos(socket).distanceTo(before)).toBeGreaterThan(0.05);
    resetToBindPose(rig);
  });
});
