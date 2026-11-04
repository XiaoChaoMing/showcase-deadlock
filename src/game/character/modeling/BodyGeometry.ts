import type * as THREE from 'three';
import type { BodyShape } from '../definitions/HeroDefinition';
import type { BodySurface } from './BodySurface';
import { buildIndexedBody, type BodyMeshOptions } from './UnifiedBody';
import { blendJunctions } from '../body/surface/JunctionBlend';

export { BODY_REGIONS, BodyRegion, REGION_PART } from './BodyRegions';

/** Thân liền khối; groups theo thứ tự BodyRegion để mỗi vùng dùng một material. Flat → non-indexed. */
export interface BodyGeometryOptions extends BodyMeshOptions {
  /** Nối mềm các chỗ ghép (k = độ rộng dải nối, mét) và làm mịn nhẹ toàn thân (overall 0–1). */
  junctionBlend?: { k: number; overall: number };
}

export const buildBodyGeometry = (surface: BodySurface, shape: BodyShape, opts: BodyGeometryOptions = {}): THREE.BufferGeometry => {
  const geometry = buildIndexedBody(surface, shape, opts);
  if (opts.junctionBlend) blendJunctions(geometry, surface, opts.junctionBlend);
  if (shape.shading === 'flat') {
    const flat = geometry.toNonIndexed();
    flat.computeVertexNormals();
    geometry.dispose();
    return flat;
  }
  geometry.computeVertexNormals();
  return geometry;
};
