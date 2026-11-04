import * as THREE from 'three';
import type { BodyPart, PlateItem, Side } from '../../definitions/HeroDefinition';
import type { BodySurface } from '../BodySurface';
import type { BodyCollider } from '../BodyCollider';
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

type PlateInput = Pick<PlateItem, 'thickness' | 'gap' | 'layers' | 'layerOverlap' | 'bulge' | 'point' | 'ridge'> & PlateRegion;

/** Hàm lều: 0 ở hai mép, 1 ở giữa (v = 0.5). Tạo mũi nhọn và sống gờ sắc. */
const tent = (v: number): number => 1 - Math.abs(2 * v - 1);

/** Lấy mẫu bề mặt; mép đầu/cuối theo t có thể thay đổi theo v (mép vuốt nhọn). */
/** Điểm bám trên bề mặt; có collider thì được đẩy ra khỏi chỗ nối các bộ phận. */
export const fittedPoint = (surface: BodySurface, collider: BodyCollider | undefined) =>
  collider ? (m: Parameters<BodySurface['pointAt']>[0]) => surface.outerPointAt(m, collider.pushOutside) : surface.pointAt;

const surfaceSampler =
  (surface: BodySurface, r: PlateRegion, tFrom: (v: number) => number, tTo: (v: number) => number, collider?: BodyCollider) =>
  (u: number, v: number): SlabSample => {
    const { position, normal } = fittedPoint(surface, collider)({
      part: r.part,
      side: r.side,
      t: tFrom(v) + (tTo(v) - tFrom(v)) * u,
      angleDeg: r.angleStartDeg + (r.angleEndDeg - r.angleStartDeg) * v,
    });
    return { p: new THREE.Vector3(...position), n: new THREE.Vector3(...normal) };
  };

const gridSize = (surface: BodySurface, r: PlateRegion, radialSegments: number) => {
  const span = r.angleEndDeg - r.angleStartDeg;
  const cols = Math.max(4, Math.ceil((span / 360) * radialSegments));
  return {
    rows: Math.max(2, Math.ceil(surface.partLength(r.part) * (r.tEnd - r.tStart) * ROWS_PER_METER)),
    // Số cột chẵn để có đúng một hàng đỉnh tại giữa tấm (mũi nhọn, sống gờ).
    cols: cols + (cols % 2),
    wrapCols: span >= 360 - 1e-6,
  };
};

export interface PlateGeometries {
  body: THREE.BufferGeometry[];
  edge: THREE.BufferGeometry[];
}

/** Tấm giáp ôm bề mặt, có thể nhiều lớp (lớp đầu nằm ngoài cùng), mép nhọn và sống gờ. */
export const buildPlateGeometries = (
  item: PlateInput,
  surface: BodySurface,
  radialSegments: number,
  withEdge: boolean,
  collider?: BodyCollider,
): PlateGeometries => {
  const layers = item.layers ?? 1;
  const overlap = item.layerOverlap ?? 0;
  const span = item.tEnd - item.tStart;
  const layerSpan = span / (layers - (layers - 1) * overlap);
  const bulge = item.bulge ?? 0;
  const ridge = item.ridge ?? 0;
  const pointT = (item.point ?? 0) / surface.partLength(item.part);
  const out: PlateGeometries = { body: [], edge: [] };

  for (let i = 0; i < layers; i++) {
    const tStart = item.tStart + i * layerSpan * (1 - overlap);
    const region: PlateRegion = { ...item, tStart, tEnd: Math.min(item.tEnd, tStart + layerSpan) };
    const tEndAt = (v: number): number => region.tEnd + pointT * tent(v);
    const lift = item.gap + (layers - 1 - i) * item.thickness;
    const grid = gridSize(surface, region, radialSegments);
    const swell = (u: number, v: number): number =>
      bulge * Math.sin(Math.PI * u) * (grid.wrapCols ? 1 : Math.sin(Math.PI * v));
    out.body.push(
      buildSlab({
        ...grid,
        sample: surfaceSampler(surface, region, () => region.tStart, tEndAt, collider),
        inner: (u, v) => lift + swell(u, v),
        outer: (u, v) => lift + item.thickness + swell(u, v) + ridge * tent(v),
      }),
    );
    if (!withEdge) continue;
    const edgeSpan = Math.min(EDGE_WIDTH / surface.partLength(item.part), (region.tEnd - region.tStart) * 0.3);
    out.edge.push(
      buildSlab({
        ...grid,
        rows: 1,
        sample: surfaceSampler(surface, region, (v) => tEndAt(v) - edgeSpan, tEndAt, collider),
        inner: (u, v) => lift + item.thickness * 0.5 + swell(1, v),
        outer: (u, v) => lift + item.thickness + EDGE_RAISE + swell(1, v) + ridge * tent(v),
      }),
    );
  }
  return out;
};
