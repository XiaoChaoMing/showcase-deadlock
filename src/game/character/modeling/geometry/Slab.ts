import * as THREE from 'three';

export interface SlabSample {
  p: THREE.Vector3;
  n: THREE.Vector3;
}

export interface SlabOptions {
  rows: number;
  cols: number;
  /** Cột cuối nối lại cột đầu (vòng kín quanh bộ phận). */
  wrapCols: boolean;
  sample(u: number, v: number): SlabSample;
  /** Khoảng cách mặt trong / mặt ngoài tính từ bề mặt, theo pháp tuyến. */
  inner(u: number, v: number): number;
  outer(u: number, v: number): number;
}

/** Tấm có độ dày phủ trên một vùng bề mặt: mặt ngoài, mặt trong và các thành bên, mọi mặt quay ra ngoài. */
export const buildSlab = (o: SlabOptions): THREE.BufferGeometry => {
  const rowCount = o.rows + 1;
  const colCount = o.wrapCols ? o.cols : o.cols + 1;
  const samples: SlabSample[] = [];
  const positions: number[] = [];
  const gridIndex = (r: number, c: number, layer: 0 | 1): number => layer * rowCount * colCount + r * colCount + (c % colCount);

  for (const layer of [0, 1] as const) {
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const u = r / o.rows;
        const v = c / o.cols;
        const s = o.sample(u, v);
        if (layer === 0) samples.push(s);
        const d = layer === 0 ? o.outer(u, v) : o.inner(u, v);
        positions.push(s.p.x + s.n.x * d, s.p.y + s.n.y * d, s.p.z + s.n.z * d);
      }
    }
  }

  const indices: number[] = [];
  const P = (i: number) => new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
  const push = (a: number, b: number, c: number, hint: THREE.Vector3): void => {
    const pa = P(a);
    const n = P(b).sub(pa).cross(P(c).sub(pa));
    if (n.lengthSq() < 1e-16) return;
    if (n.dot(hint) >= 0) indices.push(a, b, c);
    else indices.push(a, c, b);
  };
  const quad = (a: number, b: number, c: number, d: number, hint: THREE.Vector3): void => {
    push(a, b, c, hint);
    push(b, d, c, hint);
  };
  const sampleAt = (r: number, c: number): SlabSample => samples[r * colCount + (c % colCount)]!;
  const lastCol = o.wrapCols ? o.cols : o.cols;

  for (let r = 0; r < o.rows; r++) {
    for (let c = 0; c < lastCol; c++) {
      const n = sampleAt(r, c).n.clone().add(sampleAt(r + 1, c + 1).n);
      quad(gridIndex(r, c, 0), gridIndex(r, c + 1, 0), gridIndex(r + 1, c, 0), gridIndex(r + 1, c + 1, 0), n);
      quad(gridIndex(r, c, 1), gridIndex(r, c + 1, 1), gridIndex(r + 1, c, 1), gridIndex(r + 1, c + 1, 1), n.clone().negate());
    }
  }
  // Thành bên ở hai mép hàng (u = 0, u = 1).
  for (const [r, inward] of [[0, 1], [o.rows, o.rows - 1]] as const) {
    for (let c = 0; c < lastCol; c++) {
      const hint = sampleAt(r, c).p.clone().sub(sampleAt(inward, c).p);
      quad(gridIndex(r, c, 0), gridIndex(r, c + 1, 0), gridIndex(r, c, 1), gridIndex(r, c + 1, 1), hint);
    }
  }
  // Thành bên ở hai mép cột (v = 0, v = 1) khi tấm không khép vòng.
  if (!o.wrapCols) {
    for (const [c, inward] of [[0, 1], [o.cols, o.cols - 1]] as const) {
      for (let r = 0; r < o.rows; r++) {
        const hint = sampleAt(r, c).p.clone().sub(sampleAt(r, inward).p);
        quad(gridIndex(r, c, 0), gridIndex(r + 1, c, 0), gridIndex(r, c, 1), gridIndex(r + 1, c, 1), hint);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  geometry.dispose();
  return flat;
};
