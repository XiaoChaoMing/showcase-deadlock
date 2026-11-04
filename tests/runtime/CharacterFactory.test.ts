import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import { setWeightView } from '../../src/game/character/debug/WeightVisualizer';
import { BodyRegion } from '../../src/game/character/modeling/BodyGeometry';
import { kestrel } from '../fixtures/kestrel';

const vertexWorld = (mesh: THREE.SkinnedMesh, i: number): THREE.Vector3 =>
  mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);

describe('buildCharacter', () => {
  const inst = buildCharacter(kestrel);
  const { body, rig } = inst;
  inst.root.updateMatrixWorld(true);

  it('SkinnedMesh có skinIndex/skinWeight đủ vertex, skeleton 20 bone', () => {
    const count = body.geometry.getAttribute('position').count;
    expect(body).toBeInstanceOf(THREE.SkinnedMesh);
    expect(body.name).toBe('Body');
    expect(body.geometry.getAttribute('skinIndex').count).toBe(count);
    expect(body.geometry.getAttribute('skinWeight').count).toBe(count);
    expect(body.skeleton.bones).toHaveLength(20);
  });

  it('root mang tên hero và metadata', () => {
    expect(inst.root.name).toBe('kestrel');
    expect(inst.root.userData).toMatchObject({ id: 'kestrel', version: 1, profile: kestrel.profile });
  });

  it('xoay LowerArm làm cổ tay di chuyển, ngực đứng yên', () => {
    const region = body.geometry.getAttribute('region');
    const chainT = body.geometry.getAttribute('chainT');
    const pos = body.geometry.getAttribute('position');
    const chestY = inst.layout.joints.Chest[1];
    let wrist = -1;
    let chest = -1;
    for (let i = 0; i < pos.count && (wrist < 0 || chest < 0); i++) {
      if (wrist < 0 && region.getX(i) === BodyRegion.ArmL && chainT.getX(i) > 0.95) wrist = i;
      if (chest < 0 && region.getX(i) === BodyRegion.Torso && pos.getZ(i) > 0.05 && Math.abs(pos.getY(i) - chestY) < 0.02 && Math.abs(pos.getX(i)) < 0.05) chest = i;
    }
    expect(wrist).toBeGreaterThanOrEqual(0);
    expect(chest).toBeGreaterThanOrEqual(0);
    const w0 = vertexWorld(body, wrist);
    const c0 = vertexWorld(body, chest);
    rig.byName.get('LeftLowerArm')!.rotation.y = Math.PI / 2;
    inst.root.updateMatrixWorld(true);
    expect(vertexWorld(body, wrist).distanceTo(w0)).toBeGreaterThan(0.1);
    expect(vertexWorld(body, chest).distanceTo(c0)).toBeLessThan(1e-4);
    rig.byName.get('LeftLowerArm')!.rotation.y = 0;
    inst.root.updateMatrixWorld(true);
  });

  it('trang bị gắn vào bone/socket, giữ nguyên vị trí lúc bind', () => {
    const fresh = buildCharacter(kestrel);
    const byId = new Map(fresh.equipment.map((e) => [e.id, e]));
    const pauldron = byId.get('left-pauldron')!.object;
    expect(pauldron.parent?.name).toBe('LeftUpperArm');
    expect(byId.get('rifle')!.object.parent?.name).toBe('socket_back_weapon');
    expect(byId.get('holster')!.object.parent?.name).toBe('socket_hip_holster');

    const model = buildCharacterModel(kestrel);
    const unattached = new THREE.Box3().setFromObject(
      model.equipment.find((e) => e.id === 'left-pauldron')!.object,
    );
    fresh.root.updateMatrixWorld(true);
    const attached = new THREE.Box3().setFromObject(pauldron);
    expect(attached.min.distanceTo(unattached.min)).toBeLessThan(1e-6);
    expect(attached.max.distanceTo(unattached.max)).toBeLessThan(1e-6);

    const before = attached.getCenter(new THREE.Vector3());
    fresh.rig.byName.get('LeftUpperArm')!.rotation.z = 1;
    fresh.root.updateMatrixWorld(true);
    expect(new THREE.Box3().setFromObject(pauldron).getCenter(new THREE.Vector3()).distanceTo(before)).toBeGreaterThan(0.05);
  });

  it('không chứa helper nào', () => {
    const fresh = buildCharacter(kestrel);
    fresh.root.traverse((o) => {
      expect(o instanceof THREE.SkeletonHelper || o instanceof THREE.LineSegments || o instanceof THREE.AxesHelper, o.name).toBe(false);
      expect(o.name.startsWith('debug:'), o.name).toBe(false);
    });
  });
});

describe('setWeightView', () => {
  it('bật thì tô màu theo weight, tắt thì trả vật liệu gốc', () => {
    const inst = buildCharacter(kestrel);
    const original = inst.body.material;
    setWeightView(inst, 'Chest');
    const mat = inst.body.material as THREE.MeshBasicMaterial;
    expect(mat).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(mat.vertexColors).toBe(true);
    const colors = inst.body.geometry.getAttribute('color');
    expect(colors.count).toBe(inst.body.geometry.getAttribute('position').count);
    setWeightView(inst, null);
    expect(inst.body.material).toBe(original);
  });
});
