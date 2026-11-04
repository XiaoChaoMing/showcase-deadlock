import * as THREE from 'three';
import type { BodyPart, BodyShape, Side } from '../definitions/HeroDefinition';
import type { BodySurface } from './BodySurface';
import { buildSweep, type SweepData, type SweepRing } from './geometry/RingSweep';

export enum BodyRegion {
  Torso = 0,
  Neck = 1,
  Head = 2,
  ArmL = 3,
  ArmR = 4,
  HandL = 5,
  HandR = 6,
  LegL = 7,
  LegR = 8,
  FootL = 9,
  FootR = 10,
}

export const REGION_PART: Record<BodyRegion, { part: BodyPart; side?: Side }> = {
  [BodyRegion.Torso]: { part: 'torso' },
  [BodyRegion.Neck]: { part: 'neck' },
  [BodyRegion.Head]: { part: 'head' },
  [BodyRegion.ArmL]: { part: 'arm', side: 'left' },
  [BodyRegion.ArmR]: { part: 'arm', side: 'right' },
  [BodyRegion.HandL]: { part: 'hand', side: 'left' },
  [BodyRegion.HandR]: { part: 'hand', side: 'right' },
  [BodyRegion.LegL]: { part: 'leg', side: 'left' },
  [BodyRegion.LegR]: { part: 'leg', side: 'right' },
  [BodyRegion.FootL]: { part: 'foot', side: 'left' },
  [BodyRegion.FootR]: { part: 'foot', side: 'right' },
};

export const BODY_REGIONS: BodyRegion[] = Object.keys(REGION_PART).map(Number) as BodyRegion[];

export interface BodySweep {
  region: BodyRegion;
  rings: SweepRing[];
  data: SweepData;
}

export const buildBodySweeps = (surface: BodySurface, shape: BodyShape): BodySweep[] =>
  BODY_REGIONS.map((region) => {
    const { part, side } = REGION_PART[region];
    const rings = surface.sweepTs(part, shape.ringsPerMeter).map((t) => surface.ringAt(part, side, t));
    return { region, rings, data: buildSweep(rings, shape.radialSegments, { start: true, end: true }) };
  });

/** Gộp các sweep thành một geometry; groups theo thứ tự BodyRegion để mỗi vùng dùng một material. */
export const buildBodyGeometry = (surface: BodySurface, shape: BodyShape): THREE.BufferGeometry => {
  const sweeps = buildBodySweeps(surface, shape);
  const vertexTotal = sweeps.reduce((n, s) => n + s.data.t.length, 0);
  const indexTotal = sweeps.reduce((n, s) => n + s.data.indices.length, 0);
  const positions = new Float32Array(vertexTotal * 3);
  const region = new Uint8Array(vertexTotal);
  const chainT = new Float32Array(vertexTotal);
  const indices = new Uint32Array(indexTotal);
  const geometry = new THREE.BufferGeometry();

  let vOffset = 0;
  let iOffset = 0;
  for (const sweep of sweeps) {
    const count = sweep.data.t.length;
    positions.set(sweep.data.positions, vOffset * 3);
    chainT.set(sweep.data.t, vOffset);
    region.fill(sweep.region, vOffset, vOffset + count);
    for (let i = 0; i < sweep.data.indices.length; i++) indices[iOffset + i] = sweep.data.indices[i]! + vOffset;
    geometry.addGroup(iOffset, sweep.data.indices.length, sweep.region);
    vOffset += count;
    iOffset += sweep.data.indices.length;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('region', new THREE.BufferAttribute(region, 1));
  geometry.setAttribute('chainT', new THREE.BufferAttribute(chainT, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  if (shape.shading === 'flat') {
    const flat = geometry.toNonIndexed();
    flat.computeVertexNormals();
    geometry.dispose();
    return flat;
  }
  geometry.computeVertexNormals();
  return geometry;
};
