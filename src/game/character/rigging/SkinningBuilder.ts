import * as THREE from 'three';
import type { RigSkeleton } from './SkeletonBuilder';

/** Gắn skin attributes vào geometry và bind vào skeleton (bind pose = T-Pose hiện tại). */
export const createSkinnedBody = (
  geometry: THREE.BufferGeometry,
  weights: { skinIndex: Uint16Array; skinWeight: Float32Array },
  rig: RigSkeleton,
  materials: THREE.Material[],
): THREE.SkinnedMesh => {
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(weights.skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights.skinWeight, 4));
  const mesh = new THREE.SkinnedMesh(geometry, materials);
  mesh.name = 'Body';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(rig.root);
  mesh.updateMatrixWorld(true);
  mesh.bind(rig.skeleton);
  return mesh;
};
