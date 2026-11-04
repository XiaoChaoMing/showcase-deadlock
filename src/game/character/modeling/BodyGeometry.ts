import * as THREE from 'three';
import { BodyRegion } from './BodyRegions';
import type { BodyShape } from '../definitions/HeroDefinition';
import type { BodySurface } from './BodySurface';
import { buildIndexedBody, type BodyMeshOptions } from './UnifiedBody';
import { blendJunctions } from '../body/surface/JunctionBlend';

export { BODY_REGIONS, BodyRegion, REGION_PART } from './BodyRegions';

/** Thân liền khối; groups theo thứ tự BodyRegion để mỗi vùng dùng một material. Flat → non-indexed. */
export interface BodyGeometryOptions extends BodyMeshOptions {
  /** Nối mềm các chỗ ghép (k = độ rộng dải nối, mét) và làm mịn nhẹ toàn thân (overall 0–1). */
  junctionBlend?: { k: number; overall: number };
  /** Không cho đỉnh của chân trái/phải lấn qua đường giữa (đùi rất to + cơ đùi trong). */
  midlineGuard?: boolean;
}

const MIDLINE_GAP = 0.0005;

/** Đỉnh chân nào lấn qua đường giữa thì kéo về sát đường giữa: hai đùi chạm nhau thay vì cắt xuyên nhau. */
const guardMidline = (geometry: THREE.BufferGeometry): void => {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const region = geometry.getAttribute('region');
  for (let i = 0; i < pos.count; i++) {
    const r = region.getX(i);
    if (r === BodyRegion.LegL && pos.getX(i) < MIDLINE_GAP) pos.setX(i, MIDLINE_GAP);
    if (r === BodyRegion.LegR && pos.getX(i) > -MIDLINE_GAP) pos.setX(i, -MIDLINE_GAP);
  }
  pos.needsUpdate = true;
};

export const buildBodyGeometry = (surface: BodySurface, shape: BodyShape, opts: BodyGeometryOptions = {}): THREE.BufferGeometry => {
  const geometry = buildIndexedBody(surface, shape, opts);
  if (opts.junctionBlend) blendJunctions(geometry, surface, opts.junctionBlend);
  if (opts.midlineGuard) guardMidline(geometry);
  if (shape.shading === 'flat') {
    const flat = geometry.toNonIndexed();
    flat.computeVertexNormals();
    geometry.dispose();
    return flat;
  }
  geometry.computeVertexNormals();
  return geometry;
};
