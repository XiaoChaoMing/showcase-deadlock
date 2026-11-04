import * as THREE from 'three';
import type { BodyPart, PlateItem, Side } from '../../definitions/HeroDefinition';
import type { BodySurface } from '../BodySurface';
import { buildSlab, type SlabSample } from '../geometry/Slab';

const ROWS_PER_METER = 60;
const EDGE_WIDTH = 0.012;
const EDGE_RAISE = 0.003;

export interface PlateRegion {
  part: BodyPart;
  side?: Side;
  tStart: number;
  tEnd: number;
  angleStartDeg: number;
  angleEndDeg: number;
}

const surfaceSampler = (surface: BodySurface, r: PlateRegion) => (u: number, v: number): SlabSample => {
  const { position, normal } = surface.pointAt({
    part: r.part,
    side: r.side,
    t: r.tStart + (r.tEnd - r.tStart) * u,
    angleDeg: r.angleStartDeg + (r.angleEndDeg - r.angleStartDeg) * v,
  });
  return { p: new THREE.Vector3(...position), n: new THREE.Vector3(...normal) };
};

const gridSize = (surface: BodySurface, r: PlateRegion, radialSegments: number) => {
  const span = r.angleEndDeg - r.angleStartDeg;
  return {
    rows: Math.max(2, Math.ceil(surface.partLength(r.part) * (r.tEnd - r.tStart) * ROWS_PER_METER)),
    cols: Math.max(4, Math.ceil((span / 360) * radialSegments * 2)),
    wrapCols: span >= 360 - 1e-6,
  };
};

export interface PlateGeometries {
  body: THREE.BufferGeometry[];
  edge: THREE.BufferGeometry[];
}

/** Tấm giáp cong ôm bề mặt, có thể nhiều lớp chồng nhau (lớp trên cùng nằm ngoài cùng). */
export const buildPlateGeometries = (
  item: Pick<PlateItem, 'thickness' | 'gap' | 'layers' | 'layerOverlap' | 'bulge'> & PlateRegion,
  surface: BodySurface,
  radialSegments: number,
  withEdge: boolean,
): PlateGeometries => {
  const layers = item.layers ?? 1;
  const overlap = item.layerOverlap ?? 0;
  const span = item.tEnd - item.tStart;
  const layerSpan = span / (layers - (layers - 1) * overlap);
  const bulge = item.bulge ?? 0;
  const out: PlateGeometries = { body: [], edge: [] };

  for (let i = 0; i < layers; i++) {
    const tStart = item.tStart + i * layerSpan * (1 - overlap);
    const region: PlateRegion = { ...item, tStart, tEnd: Math.min(item.tEnd, tStart + layerSpan) };
    const lift = item.gap + (layers - 1 - i) * item.thickness;
    const grid = gridSize(surface, region, radialSegments);
    const swell = (u: number, v: number): number =>
      bulge * Math.sin(Math.PI * u) * (grid.wrapCols ? 1 : Math.sin(Math.PI * v));
    const sample = surfaceSampler(surface, region);
    out.body.push(
      buildSlab({
        ...grid,
        sample,
        inner: (u, v) => lift + swell(u, v),
        outer: (u, v) => lift + item.thickness + swell(u, v),
      }),
    );
    if (!withEdge) continue;
    const edgeSpan = Math.min(EDGE_WIDTH / surface.partLength(item.part), (region.tEnd - region.tStart) * 0.3);
    const edgeRegion: PlateRegion = { ...region, tStart: region.tEnd - edgeSpan };
    const edgeGrid = { ...gridSize(surface, edgeRegion, radialSegments), rows: 1 };
    out.edge.push(
      buildSlab({
        ...edgeGrid,
        sample: surfaceSampler(surface, edgeRegion),
        inner: () => lift + item.thickness * 0.5,
        outer: () => lift + item.thickness + EDGE_RAISE,
      }),
    );
  }
  return out;
};
