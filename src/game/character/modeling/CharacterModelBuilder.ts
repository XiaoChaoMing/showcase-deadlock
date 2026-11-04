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
import { createAnatomyField } from '../body/anatomy/anatomyField';
import { blendRadiusFor, overallSmoothingFor } from '../body/surface/JunctionBlend';
import { cavityColors, createBodyMaterials } from '../body/materials/bodyMaterial';

/** Thân anatomical dày tới 32 cạnh mỗi vòng; giáp không cần dày như vậy (đo: 32 → 16 giảm ~45% thời gian dựng giáp). */
const ANATOMY_EQUIPMENT_SEGMENTS = 16;

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
export interface CharacterModelOptions {
  /** Thân anatomical: vùng chuyển tiếp vai, lưới thích ứng, nối mềm (mặc định bật; tắt chỉ để so sánh ở preview). */
  refinedSurface?: boolean;
}

export const buildCharacterModel = (hero: HeroDefinition, opts: CharacterModelOptions = {}): CharacterModel => {
  const resolved = resolveProportions(hero.proportions);
  if (!resolved.ok) throw new Error(resolved.error);
  const proportions = resolved.value;
  const layout = computeLayout(proportions);
  const anatomy = hero.bodyDesign ? resolveBodyDesign(hero.bodyDesign).anatomy : undefined;
  const surface = createBodySurface(proportions, hero.bodyShape, layout, anatomy ? createAnatomyField(anatomy) : undefined);
  const materials = createMaterials(hero.palette, { flatShading: hero.bodyShape.shading === 'flat' });
  const bodyGeometry = buildBodyGeometry(surface, hero.bodyShape, anatomy && opts.refinedSurface !== false ? { transitions: true, adaptive: true, midlineGuard: true, junctionBlend: { k: blendRadiusFor(anatomy.smoothness), overall: overallSmoothingFor(anatomy.smoothness) } } : {});
  const bodyMaterialOf = anatomy ? createBodyMaterials(materials, anatomy.material) : (ref: string) => materials.get(ref);
  const bodyMaterials = BODY_REGIONS.map((r) => bodyMaterialOf(hero.bodyPaint[REGION_PART[r].part]));
  if (anatomy) bodyGeometry.setAttribute('color', cavityColors(bodyGeometry, anatomy.material.anatomicalContrast));
  const collider = createBodyCollider(bodyGeometry);
  const ctx = { surface, layout, materials, sockets: hero.sockets, radialSegments: anatomy ? Math.min(hero.bodyShape.radialSegments, ANATOMY_EQUIPMENT_SEGMENTS) : hero.bodyShape.radialSegments, collider };
  const equipment = hero.equipment.map((item) => buildEquipment(item, ctx));
  return { hero, proportions, layout, surface, materials, bodyGeometry, bodyMaterials, equipment, collider, ...(anatomy ? { anatomy } : {}) };
};
