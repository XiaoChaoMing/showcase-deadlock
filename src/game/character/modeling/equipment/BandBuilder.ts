import type { BandItem } from '../../definitions/HeroDefinition';
import type { BodySurface } from '../BodySurface';
import type { BodyCollider } from '../BodyCollider';
import { buildPlateGeometries, type PlateGeometries } from './PlateBuilder';

/** Dải vòng quanh bộ phận: một tấm mỏng, không phồng, không nhiều lớp. */
export const buildBandGeometries = (item: BandItem, surface: BodySurface, radialSegments: number, collider?: BodyCollider): PlateGeometries => {
  const half = item.height / 2 / surface.partLength(item.part);
  return buildPlateGeometries(
    { ...item, tStart: item.t - half, tEnd: item.t + half, layers: 1, bulge: 0 },
    surface,
    radialSegments,
    false,
    collider,
  );
};
