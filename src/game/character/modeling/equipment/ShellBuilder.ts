import * as THREE from 'three';
import type { ShellItem } from '../../definitions/HeroDefinition';
import type { CharacterLayout } from '../../definitions/CharacterLayout';
import type { BodySurface } from '../BodySurface';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildSlab, type SlabSample } from '../geometry/Slab';
import type { BodyCollider } from '../BodyCollider';
import { fittedPoint } from './PlateBuilder';

const ROWS = 14;
const CREST_START_OFFSET = 0.1;
/** Mép trên mặc định của ô hở mặt (t của đầu, ngang lông mày). */
const DEFAULT_FACE_OPENING_TOP = 0.72;

/** Vỏ mũ: phủ đầu từ đỉnh xuống `coverage`, chừa ô mặt quanh góc 0°, khép kín ở đỉnh. */
export const buildShellGeometries = (
  item: ShellItem,
  surface: BodySurface,
  layout: CharacterLayout,
  radialSegments: number,
  collider?: BodyCollider,
): { shell: THREE.BufferGeometry; crest?: THREE.BufferGeometry } => {
  const fit = fittedPoint(surface, collider);
  const tStart = 1 - item.coverage;
  const apex: SlabSample = { p: new THREE.Vector3(0, layout.headTopY, 0), n: new THREE.Vector3(0, 1, 0) };
  const headPoint = (t: number, angleDeg: number): SlabSample => {
    const { position, normal } = fit({ part: 'head', t, angleDeg });
    return { p: new THREE.Vector3(...position), n: new THREE.Vector3(...normal) };
  };
  const cols = (span: number) => Math.max(8, Math.ceil((span / 360) * radialSegments * 2));
  const offsets = { inner: () => item.gap, outer: () => item.gap + item.thickness };
  /** Chóp kín từ t = from lên đỉnh, quấn đủ 360°. */
  const cap = (from: number, rows: number) =>
    buildSlab({
      rows,
      cols: cols(360),
      wrapCols: true,
      sample: (u, v) => (u >= 1 ? apex : headPoint(from + (1 - from) * u, 360 * v)),
      ...offsets,
    });

  // Ô hở mặt chỉ nằm ở dải dưới (từ mép mũ tới faceOpeningTop); trán và đỉnh mũ luôn kín.
  const openTop = Math.min(1, item.faceOpeningTop ?? DEFAULT_FACE_OPENING_TOP);
  const open = item.faceOpeningDeg > 0 && openTop > tStart;
  let shell: THREE.BufferGeometry;
  if (!open) {
    shell = cap(tStart, ROWS);
  } else {
    const a0 = item.faceOpeningDeg / 2;
    const a1 = 360 - item.faceOpeningDeg / 2;
    const lowerRows = Math.max(2, Math.round((ROWS * (openTop - tStart)) / (1 - tStart)));
    const band = buildSlab({
      rows: lowerRows,
      cols: cols(a1 - a0),
      wrapCols: false,
      sample: (u, v) => headPoint(tStart + (openTop - tStart) * u, a0 + (a1 - a0) * v),
      ...offsets,
    });
    shell = mergeGeometries([band, cap(openTop, Math.max(2, ROWS - lowerRows))])!;
    band.dispose();
  }

  if (!item.crest) return { shell };

  // Gờ chạy dọc đường giữa: từ trán (0°) lên đỉnh rồi xuống gáy (180°).
  const crestStart = Math.min(0.95, Math.max(tStart + CREST_START_OFFSET, open ? openTop : 0));
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
