import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { BoxItem } from '../../definitions/HeroDefinition';

const DEG = Math.PI / 180;

/** Hộp bo góc trong hệ toạ độ điểm gắn: mặt sau áp vào thân (+Z hướng ra ngoài). */
export const buildBoxMesh = (item: BoxItem, material: THREE.Material): THREE.Mesh => {
  const [w, h, d] = item.size;
  const radius = Math.min(item.cornerRadius, w / 2, h / 2, d / 2);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), material);
  const [ox, oy, oz] = item.offset ?? [0, 0, 0];
  mesh.position.set(ox, oy, oz + d / 2);
  const [rx, ry, rz] = item.rotationDeg ?? [0, 0, 0];
  mesh.rotation.set(rx * DEG, ry * DEG, rz * DEG);
  return mesh;
};
