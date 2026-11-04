import * as THREE from 'three';
import type { AssemblyItem, Primitive } from '../../definitions/HeroDefinition';
import type { MaterialSet } from '../materials/MaterialBuilder';

const DEG = Math.PI / 180;
const ROUND_SEGMENTS = 12;

const primitiveGeometry = (p: Primitive): THREE.BufferGeometry => {
  const [x, y, z] = p.size;
  if (p.shape === 'box') return new THREE.BoxGeometry(x, y, z);
  const geometry =
    p.shape === 'cylinder'
      ? new THREE.CylinderGeometry(x / 2, x / 2, y, ROUND_SEGMENTS)
      : new THREE.ConeGeometry(x / 2, y, ROUND_SEGMENTS);
  return geometry.rotateX(Math.PI / 2); // trục trụ/nón theo +Z
};

/** Đồ ghép từ nhiều khối, trong hệ toạ độ điểm gắn. */
export const buildAssemblyGroup = (item: AssemblyItem, materials: MaterialSet): THREE.Group => {
  const group = new THREE.Group();
  const [rx, ry, rz] = item.rotationDeg ?? [0, 0, 0];
  group.rotation.set(rx * DEG, ry * DEG, rz * DEG);
  group.position.set(...(item.offset ?? [0, 0, 0]));
  group.scale.setScalar(item.scale ?? 1);
  item.parts.forEach((p, i) => {
    const mesh = new THREE.Mesh(primitiveGeometry(p), materials.get(p.color));
    mesh.name = `part-${i}`;
    mesh.position.set(...p.position);
    const [px, py, pz] = p.rotationDeg ?? [0, 0, 0];
    mesh.rotation.set(px * DEG, py * DEG, pz * DEG);
    group.add(mesh);
  });
  return group;
};
