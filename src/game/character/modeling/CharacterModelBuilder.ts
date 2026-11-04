import type * as THREE from 'three';
import { computeLayout, type CharacterLayout } from '../definitions/CharacterLayout';
import type { CharacterProportions, HeroDefinition } from '../definitions/HeroDefinition';
import { resolveProportions } from '../definitions/resolveProportions';
import { BODY_REGIONS, buildBodyGeometry, REGION_PART } from './BodyGeometry';
import { createBodySurface, type BodySurface } from './BodySurface';
import { buildEquipment, type EquipmentPart } from './equipment/EquipmentBuilder';
import { createMaterials, type MaterialSet } from './materials/MaterialBuilder';

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
  const ctx = { surface, layout, materials, sockets: hero.sockets, radialSegments: hero.bodyShape.radialSegments };
  const equipment = hero.equipment.map((item) => buildEquipment(item, ctx));
  return { hero, proportions, layout, surface, materials, bodyGeometry, bodyMaterials, equipment };
};
