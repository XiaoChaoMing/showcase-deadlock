import * as THREE from 'three';
import type { CharacterInstance } from '../../src/game/character/runtime/CharacterFactory';

type V3 = [number, number, number];

export interface HeroFingerprint {
  bodyVertexCount: number;
  bodyPositionHash: number;
  skinWeightHash: number;
  bbox: { min: V3; max: V3 };
  bones: { name: string; world: V3 }[];
  equipment: { name: string; parent: string; vertexCount: number; positionHash: number }[];
  materials: { name: string; color: string; metalness: number; roughness: number; emissive: string; emissiveIntensity: number; flatShading: boolean }[];
}

const round = (x: number, step = 1e-4): number => {
  const r = Math.round(x / step) * step;
  return Number(r.toFixed(6)) + 0; // +0: bỏ -0
};
const r3 = (v: THREE.Vector3): V3 => [round(v.x), round(v.y), round(v.z)];

/** Tổng không phụ thuộc thứ tự đỉnh và cách chia mesh. */
const hashPositions = (meshes: THREE.Mesh[]): { count: number; hash: number } => {
  let count = 0;
  let hash = 0;
  const v = new THREE.Vector3();
  for (const mesh of meshes) {
    const pos = mesh.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      hash += v.x + 1.37 * v.y + 1.91 * v.z;
      count += 1;
    }
  }
  return { count, hash: round(hash) };
};

const meshesUnder = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = [];
  o.traverse((c) => {
    if (c instanceof THREE.Mesh) out.push(c);
  });
  return out;
};

/** Dấu vân tay hình học + vật liệu của nhân vật ở bind pose (khoá tương thích V1). */
export const fingerprintCharacter = (instance: CharacterInstance): HeroFingerprint => {
  instance.root.updateMatrixWorld(true);
  const geometry = instance.body.geometry;
  const pos = geometry.getAttribute('position');
  const body = hashPositions([instance.body]);
  const weights = geometry.getAttribute('skinWeight');
  const indices = geometry.getAttribute('skinIndex');
  let skinWeightHash = 0;
  for (let i = 0; i < weights.count; i++) {
    for (let k = 0; k < 4; k++) skinWeightHash += weights.getComponent(i, k) * (indices.getComponent(i, k) + 1);
  }
  const box = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);

  const equipment: HeroFingerprint['equipment'] = [];
  const materials = new Map<string, HeroFingerprint['materials'][number]>();
  instance.root.traverse((o) => {
    if (o.name.startsWith('equip_')) {
      const h = hashPositions(meshesUnder(o));
      equipment.push({ name: o.name, parent: o.parent?.name ?? '', vertexCount: h.count, positionHash: h.hash });
    }
    if (o instanceof THREE.Mesh) {
      for (const m of [o.material].flat() as THREE.MeshStandardMaterial[]) {
        materials.set(m.name, {
          name: m.name,
          color: m.color.getHexString(THREE.SRGBColorSpace),
          metalness: round(m.metalness, 1e-6),
          roughness: round(m.roughness, 1e-6),
          emissive: m.emissive.getHexString(THREE.SRGBColorSpace),
          emissiveIntensity: round(m.emissiveIntensity, 1e-6),
          flatShading: m.flatShading,
        });
      }
    }
  });

  return {
    bodyVertexCount: pos.count,
    bodyPositionHash: body.hash,
    skinWeightHash: round(skinWeightHash),
    bbox: { min: r3(box.min), max: r3(box.max) },
    bones: instance.rig.bones.map((b) => ({ name: b.name, world: r3(b.getWorldPosition(new THREE.Vector3())) })),
    equipment: equipment.sort((a, b) => a.name.localeCompare(b.name)),
    materials: [...materials.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
};
