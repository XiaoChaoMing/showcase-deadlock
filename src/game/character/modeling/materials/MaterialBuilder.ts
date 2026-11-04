import * as THREE from 'three';
import type { ColorSpec } from '../../definitions/HeroDefinition';

export interface MaterialSet {
  /** colorRef: tên vai trò trong palette hoặc mã "#RRGGBB". */
  get(colorRef: string): THREE.MeshStandardMaterial;
  all(): THREE.MeshStandardMaterial[];
}

const DEFAULT_ROUGHNESS = 0.7;
const DEFAULT_METALNESS = 0.05;

const toSpec = (spec: ColorSpec): Exclude<ColorSpec, string> => (typeof spec === 'string' ? { color: spec } : spec);

export const createMaterials = (palette: Record<string, ColorSpec>, opts: { flatShading?: boolean } = {}): MaterialSet => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  const get = (ref: string): THREE.MeshStandardMaterial => {
    const cached = cache.get(ref);
    if (cached) return cached;
    const paletteSpec = palette[ref];
    const spec = paletteSpec ? toSpec(paletteSpec) : { color: ref };
    const material = new THREE.MeshStandardMaterial({
      name: ref,
      color: new THREE.Color(spec.color),
      roughness: spec.roughness ?? DEFAULT_ROUGHNESS,
      metalness: spec.metalness ?? DEFAULT_METALNESS,
      flatShading: opts.flatShading ?? false,
    });
    if (spec.emissive && spec.emissive > 0) {
      material.emissive = new THREE.Color(spec.color);
      material.emissiveIntensity = spec.emissive;
    }
    cache.set(ref, material);
    return material;
  };
  return { get, all: () => [...cache.values()] };
};
