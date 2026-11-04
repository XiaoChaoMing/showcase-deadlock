import * as THREE from 'three';
import type { BodyMaterialConfig } from '../config/BodyDesign';
import type { MaterialSet } from '../../modeling/materials/MaterialBuilder';

export const BODY_MATERIAL_SUFFIX = '~body';

/**
 * Vật liệu riêng của thân (spec 5.2: không dùng chung instance với giáp, dù cùng vai trò màu).
 * Màu lấy từ vật liệu của vai trò; roughness/metalness theo bodyDesign.material; bật màu đỉnh để tô rãnh cơ.
 */
export const createBodyMaterials = (materials: MaterialSet, config: BodyMaterialConfig) => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (ref: string): THREE.MeshStandardMaterial => {
    const cached = cache.get(ref);
    if (cached) return cached;
    const base = materials.get(ref);
    const m = new THREE.MeshStandardMaterial({
      name: `${ref}${BODY_MATERIAL_SUFFIX}`,
      color: base.color.clone(),
      roughness: config.roughness,
      metalness: config.metalness,
      emissive: base.emissive.clone(),
      emissiveIntensity: base.emissiveIntensity,
      flatShading: base.flatShading,
      vertexColors: true,
    });
    cache.set(ref, m);
    return m;
  };
};

const PERCENTILE = 0.95;
/** Số lượt làm mượt độ cong nền (để chỉ giữ chỗ lõm cục bộ, bỏ độ cong lồi chung của thân/tay). */
const BASELINE_PASSES = 6;

/**
 * Màu đỉnh xám làm tối nhẹ chỗ lõm (rãnh giữa các khối cơ): độ lõm = (trung bình đỉnh kề − đỉnh) · pháp tuyến,
 * chuẩn hoá theo phân vị 95 của các giá trị dương; màu = 1 − contrast · độ lõm. Lưới phải có index và normal.
 */
export const cavityColors = (geometry: THREE.BufferGeometry, contrast: number): THREE.Float32BufferAttribute => {
  const pos = geometry.getAttribute('position');
  const count = pos.count;
  const colors = new Float32Array(count * 3).fill(1);
  if (contrast <= 0) return new THREE.Float32BufferAttribute(colors, 3);
  const index = geometry.getIndex();
  if (!index) throw new Error('cần geometry có index');
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  const normal = geometry.getAttribute('normal');
  const sum = new Float64Array(count * 3);
  const deg = new Uint32Array(count);
  for (let f = 0; f < index.count; f += 3) {
    for (let e = 0; e < 3; e++) {
      const a = index.getX(f + e);
      const b = index.getX(f + ((e + 1) % 3));
      for (const [u, v] of [[a, b], [b, a]] as const) {
        sum[u * 3] = sum[u * 3]! + pos.getX(v);
        sum[u * 3 + 1] = sum[u * 3 + 1]! + pos.getY(v);
        sum[u * 3 + 2] = sum[u * 3 + 2]! + pos.getZ(v);
        deg[u] = deg[u]! + 1;
      }
    }
  }
  // Độ cong cục bộ (Laplacian theo pháp tuyến), rồi trừ đi độ cong nền đã làm mượt: chỉ còn rãnh cục bộ.
  const curvature = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    if (deg[i] === 0) continue;
    const d = deg[i]!;
    const dx = sum[i * 3]! / d - pos.getX(i);
    const dy = sum[i * 3 + 1]! / d - pos.getY(i);
    const dz = sum[i * 3 + 2]! / d - pos.getZ(i);
    curvature[i] = dx * normal.getX(i) + dy * normal.getY(i) + dz * normal.getZ(i);
  }
  const neighbors: number[][] = Array.from({ length: count }, () => []);
  for (let f = 0; f < index.count; f += 3) {
    for (let e = 0; e < 3; e++) {
      const a = index.getX(f + e);
      const b = index.getX(f + ((e + 1) % 3));
      neighbors[a]!.push(b);
      neighbors[b]!.push(a);
    }
  }
  let baseline = Float32Array.from(curvature);
  for (let pass = 0; pass < BASELINE_PASSES; pass++) {
    const next = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const nb = neighbors[i]!;
      let acc = baseline[i]!;
      for (const j of nb) acc += baseline[j]!;
      next[i] = acc / (nb.length + 1);
    }
    baseline = next;
  }
  const cavity = new Float32Array(count);
  const positives: number[] = [];
  for (let i = 0; i < count; i++) {
    const c = curvature[i]! - baseline[i]!;
    cavity[i] = c;
    if (c > 0) positives.push(c);
  }
  positives.sort((x, y) => x - y);
  const scale = positives[Math.floor(positives.length * PERCENTILE)] ?? 0;
  if (scale <= 0) return new THREE.Float32BufferAttribute(colors, 3);
  for (let i = 0; i < count; i++) {
    const shade = 1 - contrast * Math.min(1, Math.max(0, cavity[i]! / scale));
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  return new THREE.Float32BufferAttribute(colors, 3);
};
