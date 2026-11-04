import * as THREE from 'three';
import type { HeroDefinition } from '../definitions/HeroDefinition';
import { buildCharacterModel, type CharacterModel } from '../modeling/CharacterModelBuilder';
import { attachEquipment } from '../rigging/CharacterRig';
import { buildSkeleton, type RigSkeleton } from '../rigging/SkeletonBuilder';
import { createSkinnedBody } from '../rigging/SkinningBuilder';
import { generateSkinWeights } from '../rigging/SkinWeightGenerator';
import { createSockets } from '../rigging/Sockets';

export interface CharacterInstance extends CharacterModel {
  /** Tên = hero.id; userData chứa id, version, profile, palette. Không chứa helper debug nào. */
  root: THREE.Group;
  body: THREE.SkinnedMesh;
  rig: RigSkeleton;
  sockets: Map<string, THREE.Object3D>;
}

/** Dựng nhân vật hoàn chỉnh: model → skeleton → skin weights → SkinnedMesh → trang bị gắn bone. */
export const buildCharacter = (hero: HeroDefinition): CharacterInstance => {
  const model = buildCharacterModel(hero);
  const rig = buildSkeleton(model.layout);
  const sockets = createSockets(hero.sockets, model.surface, model.layout, rig);
  const weights = generateSkinWeights(model.bodyGeometry, model.layout);
  const body = createSkinnedBody(model.bodyGeometry, weights, rig, model.bodyMaterials);
  attachEquipment(model.equipment, rig, sockets);

  const root = new THREE.Group();
  root.name = hero.id;
  root.userData = { id: hero.id, version: hero.version, profile: hero.profile, palette: hero.palette };
  root.add(body);
  root.updateMatrixWorld(true);
  return { ...model, root, body, rig, sockets };
};
