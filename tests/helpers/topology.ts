import type * as THREE from 'three';

export interface TopologyReport {
  components: number;
  /** Cạnh (không hướng) không được dùng bởi đúng 2 tam giác. */
  nonManifoldEdges: number;
  /** Cạnh có hướng xuất hiện nhiều hơn 1 lần (mặt quay ngược nhau). */
  inconsistentEdges: number;
  signedVolume: number;
}

/** Phân tích topo của mesh có index (vị trí trùng nhau được coi là cùng đỉnh). */
export const analyzeTopology = (geometry: THREE.BufferGeometry): TopologyReport => {
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex();
  if (!index) throw new Error('cần geometry có index');
  const key = (i: number) => `${pos.getX(i).toFixed(6)},${pos.getY(i).toFixed(6)},${pos.getZ(i).toFixed(6)}`;
  const weld = new Map<string, number>();
  const id = (i: number): number => {
    const k = key(i);
    if (!weld.has(k)) weld.set(k, weld.size);
    return weld.get(k)!;
  };
  const tris: [number, number, number][] = [];
  for (let f = 0; f < index.count; f += 3) tris.push([id(index.getX(f)), id(index.getX(f + 1)), id(index.getX(f + 2))]);

  const undirected = new Map<string, number>();
  const directed = new Map<string, number>();
  const parent = Array.from({ length: weld.size }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]!)));
  let volume = 0;
  const P = (wid: number): [number, number, number] => {
    for (let i = 0; i < pos.count; i++) if (id(i) === wid) return [pos.getX(i), pos.getY(i), pos.getZ(i)];
    return [0, 0, 0];
  };
  const coords = new Map<number, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) coords.set(id(i), [pos.getX(i), pos.getY(i), pos.getZ(i)]);
  for (const [a, b, c] of tris) {
    for (const [u, v] of [[a, b], [b, c], [c, a]] as const) {
      const uk = u < v ? `${u}-${v}` : `${v}-${u}`;
      undirected.set(uk, (undirected.get(uk) ?? 0) + 1);
      directed.set(`${u}>${v}`, (directed.get(`${u}>${v}`) ?? 0) + 1);
      parent[find(u)] = find(v);
    }
    const [pa, pb, pc] = [coords.get(a) ?? P(a), coords.get(b) ?? P(b), coords.get(c) ?? P(c)];
    volume += (pa[0] * (pb[1] * pc[2] - pb[2] * pc[1]) - pa[1] * (pb[0] * pc[2] - pb[2] * pc[0]) + pa[2] * (pb[0] * pc[1] - pb[1] * pc[0])) / 6;
  }
  const roots = new Set<number>();
  for (let i = 0; i < weld.size; i++) roots.add(find(i));
  return {
    components: roots.size,
    nonManifoldEdges: [...undirected.values()].filter((n) => n !== 2).length,
    inconsistentEdges: [...directed.values()].filter((n) => n > 1).length,
    signedVolume: volume,
  };
};
