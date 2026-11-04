import type * as THREE from 'three';
import type { BodyShape } from '../definitions/HeroDefinition';
import type { BodySurface } from './BodySurface';
import { buildIndexedBody } from './UnifiedBody';

export { BODY_REGIONS, BodyRegion, REGION_PART } from './BodyRegions';

/** Thân liền khối; groups theo thứ tự BodyRegion để mỗi vùng dùng một material. Flat → non-indexed. */
export const buildBodyGeometry = (surface: BodySurface, shape: BodyShape): THREE.BufferGeometry => {
  const geometry = buildIndexedBody(surface, shape);
  if (shape.shading === 'flat') {
    const flat = geometry.toNonIndexed();
    flat.computeVertexNormals();
    geometry.dispose();
    return flat;
  }
  geometry.computeVertexNormals();
  return geometry;
};
