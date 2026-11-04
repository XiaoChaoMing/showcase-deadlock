import * as THREE from 'three';
import type { ShellItem } from '../../definitions/HeroDefinition';
import type { CharacterLayout } from '../../definitions/CharacterLayout';
import type { BodySurface } from '../BodySurface';
import { buildSlab, type SlabSample } from '../geometry/Slab';

const ROWS = 14;
const CREST_START_OFFSET = 0.1;

/** Vỏ mũ: phủ đầu từ đỉnh xuống `coverage`, chừa ô mặt quanh góc 0°, khép kín ở đỉnh. */
export const buildShellGeometries = (
  item: ShellItem,
  surface: BodySurface,
  layout: CharacterLayout,
  radialSegments: number,
): { shell: THREE.BufferGeometry; crest?: THREE.BufferGeometry } => {
  const tStart = 1 - item.coverage;
  const open = item.faceOpeningDeg > 0;
  const a0 = open ? item.faceOpeningDeg / 2 : 0;
  const a1 = open ? 360 - item.faceOpeningDeg / 2 : 360;
  const apex: SlabSample = { p: new THREE.Vector3(0, layout.headTopY, 0), n: new THREE.Vector3(0, 1, 0) };
  const headPoint = (t: number, angleDeg: number): SlabSample => {
    const { position, normal } = surface.pointAt({ part: 'head', t, angleDeg });
    return { p: new THREE.Vector3(...position), n: new THREE.Vector3(...normal) };
  };

  const shell = buildSlab({
    rows: ROWS,
    cols: Math.max(8, Math.ceil(((a1 - a0) / 360) * radialSegments * 2)),
    wrapCols: !open,
    sample: (u, v) => (u >= 1 ? apex : headPoint(tStart + (1 - tStart) * u, a0 + (a1 - a0) * v)),
    inner: () => item.gap,
    outer: () => item.gap + item.thickness,
  });
  if (!item.crest) return { shell };

  // Gờ chạy dọc đường giữa: từ trán (0°) lên đỉnh rồi xuống gáy (180°).
  const crestStart = Math.min(0.95, tStart + CREST_START_OFFSET);
  const along = (u: number): SlabSample => {
    if (u <= 0.45) return headPoint(crestStart + (1 - crestStart) * (u / 0.45), 0);
    if (u >= 0.55) return headPoint(1 - (1 - crestStart) * ((u - 0.55) / 0.45), 180);
    return apex;
  };
  const width = item.crest.width;
  const base = item.gap + item.thickness;
  const crest = buildSlab({
    rows: 24,
    cols: 1,
    wrapCols: false,
    sample: (u, v) => {
      const s = along(u);
      return { p: s.p.clone().add(new THREE.Vector3((v - 0.5) * width, 0, 0)), n: s.n };
    },
    inner: () => base - item.thickness * 0.5,
    outer: () => base + item.crest!.height,
  });
  return { shell, crest };
};
