import type * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Nạp GLB đã xuất; trả về node gốc của nhân vật (tên = hero id, userData chứa metadata). */
export const importCharacterGlb = async (buffer: ArrayBuffer): Promise<THREE.Object3D> => {
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  return gltf.scene.children.length === 1 ? gltf.scene.children[0]! : gltf.scene;
};
