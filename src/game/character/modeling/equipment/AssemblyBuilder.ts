import * as THREE from 'three';
import type { AssemblyItem, Primitive } from '../../definitions/HeroDefinition';
import type { MaterialSet } from '../materials/MaterialBuilder';

const DEG = Math.PI / 180;
const ROUND_SEGMENTS = 12;

/** Khối từ danh sách đỉnh và mặt (tam giác), dựng phẳng để giữ cạnh sắc. */
const polyhedron = (vertices: number[][], faces: number[][]): THREE.BufferGeometry => {
  const positions = faces.flatMap((f) => f.flatMap((i) => vertices[i] ?? [0, 0, 0]));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
};

/** Gai chóp 4 cạnh: đáy chữ nhật x × y tại −z/2, đỉnh tại +z/2. */
const spikeGeometry = (x: number, y: number, z: number): THREE.BufferGeometry => {
  const [hx, hy, hz] = [x / 2, y / 2, z / 2];
  return polyhedron(
    [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz], [0, 0, hz]],
    [[0, 2, 1], [0, 3, 2], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]],
  );
};

/** Vây tam giác: tiết diện tam giác (đáy rộng x ở −y/2, đỉnh ở +y/2), kéo dài theo z. */
const wedgeGeometry = (x: number, y: number, z: number): THREE.BufferGeometry => {
  const [hx, hy, hz] = [x / 2, y / 2, z / 2];
  return polyhedron(
    [[-hx, -hy, -hz], [hx, -hy, -hz], [0, hy, -hz], [-hx, -hy, hz], [hx, -hy, hz], [0, hy, hz]],
    [[0, 2, 1], [3, 4, 5], [0, 1, 4], [0, 4, 3], [1, 2, 5], [1, 5, 4], [2, 0, 3], [2, 3, 5]],
  );
};

/** Lưỡi dao: tiết diện hình thoi (mỏng theo x, bản rộng theo y) tại −z/2, vuốt về mũi nhọn tại +z/2. */
const bladeGeometry = (x: number, y: number, z: number): THREE.BufferGeometry => {
  const [hx, hy, hz] = [x / 2, y / 2, z / 2];
  return polyhedron(
    [[hx, 0, -hz], [0, hy, -hz], [-hx, 0, -hz], [0, -hy, -hz], [0, 0, hz]],
    [[0, 2, 1], [0, 3, 2], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]],
  );
};

const primitiveGeometry = (p: Primitive): THREE.BufferGeometry => {
  const [x, y, z] = p.size;
  switch (p.shape) {
    case 'box':
      return new THREE.BoxGeometry(x, y, z);
    case 'spike':
      return spikeGeometry(x, y, z);
    case 'wedge':
      return wedgeGeometry(x, y, z);
    case 'blade':
      return bladeGeometry(x, y, z);
    case 'cylinder':
      return new THREE.CylinderGeometry(x / 2, x / 2, y, ROUND_SEGMENTS).rotateX(Math.PI / 2);
    case 'cone':
      return new THREE.ConeGeometry(x / 2, y, ROUND_SEGMENTS).rotateX(Math.PI / 2);
  }
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
