import type * as THREE from 'three';
import { computeLayout, type CharacterLayout } from '../definitions/CharacterLayout';
import type { CharacterProportions, HeroDefinition } from '../definitions/HeroDefinition';
import { resolveProportions } from '../definitions/resolveProportions';
import { BODY_REGIONS, buildBodyGeometry, REGION_PART } from './BodyGeometry';
import { createBodySurface, type BodySurface } from './BodySurface';
import { createBodyCollider, type BodyCollider } from './BodyCollider';
import { buildEquipment, type EquipmentPart } from './equipment/EquipmentBuilder';
import { createMaterials, type MaterialSet } from './materials/MaterialBuilder';
import { resolveBodyDesign, type AnatomyConfig } from '../body/config/resolveBodyDesign';

export interface CharacterModel {
  hero: HeroDefinition;
  proportions: CharacterProportions;
  layout: CharacterLayout;
  surface: BodySurface;
  materials: MaterialSet;
  bodyGeometry: THREE.BufferGeometry;
  /** Theo thứ tự BodyRegion (khớp với geometry.groups). */
  bodyMaterials: THREE.Material[];
  equipment: EquipmentPart[];
  /** Va chạm với lưới thân ở bind pose (dùng để giáp và điểm gắn không chìm vào thân). */
  collider: BodyCollider;
  /** Chỉ có khi hero dùng bodyDesign (Anatomical Body System). */
  anatomy?: AnatomyConfig;
}

/** Dựng hình nhân vật (thân + trang bị) ở bind pose, chưa có rig. Hero phải đã qua validateHero. */
export const buildCharacterModel = (hero: HeroDefinition): CharacterModel => {
  const resolved = resolveProportions(hero.proportions);
  if (!resolved.ok) throw new Error(resolved.error);
  const proportions = resolved.value;
  const layout = computeLayout(proportions);
  const surface = createBodySurface(proportions, hero.bodyShape, layout);
  const materials = createMaterials(hero.palette, { flatShading: hero.bodyShape.shading === 'flat' });
  const bodyGeometry = buildBodyGeometry(surface, hero.bodyShape);
  const bodyMaterials = BODY_REGIONS.map((r) => materials.get(hero.bodyPaint[REGION_PART[r].part]));
  const collider = createBodyCollider(bodyGeometry);
  const ctx = { surface, layout, materials, sockets: hero.sockets, radialSegments: hero.bodyShape.radialSegments, collider };
  const equipment = hero.equipment.map((item) => buildEquipment(item, ctx));
  const anatomy = hero.bodyDesign ? resolveBodyDesign(hero.bodyDesign).anatomy : undefined;
  return { hero, proportions, layout, surface, materials, bodyGeometry, bodyMaterials, equipment, collider, ...(anatomy ? { anatomy } : {}) };
};
