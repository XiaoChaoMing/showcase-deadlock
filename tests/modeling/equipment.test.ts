import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { resolveAttachBone } from '../../src/game/character/modeling/equipment/EquipmentBuilder';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import type { BodyPart, Side } from '../../src/game/character/definitions/HeroDefinition';
import { kestrel } from '../fixtures/kestrel';
import { hasNaN } from '../helpers/geometry';
import { resolvedOf, SAMPLE_HEROES } from '../helpers/heroes';

const kLayout = resolvedOf(kestrel).layout;

describe('resolveAttachBone', () => {
  it.each<[BodyPart, Side | undefined, number, string]>([
    ['torso', undefined, 0.1, 'Hips'],
    ['torso', undefined, 0.35, 'Spine'],
    ['torso', undefined, 0.7, 'Chest'],
    ['neck', undefined, 0.5, 'Neck'],
    ['arm', 'left', 0.2, 'LeftUpperArm'],
    ['arm', 'left', 0.8, 'LeftLowerArm'],
    ['hand', 'right', 0.5, 'RightHand'],
    ['leg', 'right', 0.75, 'RightLowerLeg'],
    ['leg', 'left', 0.2, 'LeftUpperLeg'],
    ['head', undefined, 0.5, 'Head'],
    ['foot', 'left', 0.5, 'LeftFoot'],
  ])('resolveAttachBone(%s, %s, %s) = %s', (part, side, t, bone) =>
    expect(resolveAttachBone(part, side, t, kLayout)).toBe(bone));
});

const worldVertices = (object: THREE.Object3D): THREE.Vector3[] => {
  object.updateMatrixWorld(true);
  const out: THREE.Vector3[] = [];
  object.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  return out;
};

describe('Kestrel equipment', () => {
  const model = buildCharacterModel(kestrel);
  const byId = new Map(model.equipment.map((e) => [e.id, e]));

  it('đủ 8 món, đúng id, tên object', () => {
    expect(model.equipment.map((e) => e.id)).toEqual([
      'chest-plate', 'left-pauldron', 'helmet', 'visor', 'backpack', 'rifle', 'shin-left', 'shin-right',
    ]);
    for (const e of model.equipment) expect(e.object.name).toBe(`equip:${e.id}`);
  });

  it('bone gắn đúng', () => {
    expect(byId.get('left-pauldron')?.bone).toBe('LeftUpperArm');
    expect(byId.get('visor')?.bone).toBe('Head');
    expect(byId.get('helmet')?.bone).toBe('Head');
    expect(byId.get('chest-plate')?.bone).toBe('Chest');
    expect(byId.get('rifle')?.bone).toBe('Chest');
    expect(byId.get('rifle')?.socket).toBe('back_weapon');
    expect(byId.get('shin-right')?.bone).toBe('RightLowerLeg');
  });

  it('ba lô nằm sau lưng', () => {
    for (const v of worldVertices(byId.get('backpack')!.object)) expect(v.z).toBeLessThan(0);
  });

  it('giáp ngực nằm phía trước, giáp vai nằm bên trái', () => {
    const chest = new THREE.Box3().setFromObject(byId.get('chest-plate')!.object);
    expect(chest.getCenter(new THREE.Vector3()).z).toBeGreaterThan(0.05);
    const pauldron = new THREE.Box3().setFromObject(byId.get('left-pauldron')!.object);
    expect(pauldron.min.x).toBeGreaterThan(0.1);
  });

  it('mũ che đỉnh đầu', () => {
    const helmet = new THREE.Box3().setFromObject(byId.get('helmet')!.object);
    expect(helmet.max.y).toBeGreaterThan(kLayout.headTopY);
  });

  it('11 material thân, không NaN trong trang bị', () => {
    expect(model.bodyMaterials).toHaveLength(11);
    for (const e of model.equipment) {
      e.object.traverse((o) => {
        if (o instanceof THREE.Mesh) expect(hasNaN(o.geometry.getAttribute('position').array), e.id).toBe(false);
      });
    }
  });

  it('màu theo palette, kính phát sáng', () => {
    const visor = byId.get('visor')!.object.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    const spec = kestrel.palette.visor;
    expect(visor.material.emissiveIntensity).toBeCloseTo(typeof spec === 'object' ? spec.emissive ?? 0 : 0, 6);
    expect(visor.material.emissiveIntensity).toBeGreaterThan(0);
    expect(model.materials.get('accent').color.getHexString()).toBe(new THREE.Color('#F2A93B').getHexString());
  });
});

describe.each(SAMPLE_HEROES)('Review Focus #5: giáp không chui vào thân (%s)', (_name, hero) => {
  const model = buildCharacterModel(hero);
  for (const item of hero.equipment) {
    if (item.kind !== 'plate' && item.kind !== 'band') continue;
    it(item.id, () => {
      const part = model.equipment.find((e) => e.id === item.id)!;
      const length = model.surface.partLength(item.part);
      const ring0 = model.surface.ringAt(item.part, item.side, 0);
      const ring1 = model.surface.ringAt(item.part, item.side, 1);
      const base = new THREE.Vector3(...ring0.center);
      const axis = new THREE.Vector3(...ring1.center).sub(base).normalize();
      for (const v of worldVertices(part.object)) {
        const t = v.clone().sub(base).dot(axis) / length;
        const ring = model.surface.ringAt(item.part, item.side, t);
        const local = v.clone().sub(new THREE.Vector3(...ring.center));
        const a = local.dot(new THREE.Vector3(...ring.axisA));
        const b = local.dot(new THREE.Vector3(...ring.axisB));
        const margin = item.gap * 0.5;
        const f = Math.abs(a / (ring.ra + margin)) ** ring.n + Math.abs(b / (ring.rb + margin)) ** ring.n;
        expect(f).toBeGreaterThanOrEqual(1 - 1e-4);
      }
    });
  }
});
