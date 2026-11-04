import * as THREE from 'three';
import type { BoneName } from '../../definitions/BoneNames';
import type { CharacterLayout } from '../../definitions/CharacterLayout';
import type { Attach, BodyPart, EquipmentItem, Side, SocketDefinition, SurfaceMount } from '../../definitions/HeroDefinition';
import type { BodySurface } from '../BodySurface';
import type { BodyCollider } from '../BodyCollider';
import { fittedPoint } from './PlateBuilder';
import type { MaterialSet } from '../materials/MaterialBuilder';
import { buildAssemblyGroup } from './AssemblyBuilder';
import { buildBandGeometries } from './BandBuilder';
import { buildBoxMesh } from './BoxBuilder';
import { buildPlateGeometries, type PlateGeometries } from './PlateBuilder';
import { buildShellGeometries } from './ShellBuilder';

const DEG = Math.PI / 180;

export interface EquipmentPart {
  id: string;
  bone: BoneName;
  socket?: string;
  /** Dựng trong toạ độ world lúc bind; được gắn vào bone ở bước rigging. */
  object: THREE.Object3D;
}

export interface EquipmentContext {
  surface: BodySurface;
  layout: CharacterLayout;
  materials: MaterialSet;
  sockets: SocketDefinition[];
  radialSegments: number;
  /** Lưới thân thật: có thì giáp/hộp/điểm gắn được đẩy ra khỏi chỗ nối các bộ phận. */
  collider?: BodyCollider;
}

const sideName = (side: Side | undefined): 'Left' | 'Right' => (side === 'right' ? 'Right' : 'Left');

export const resolveAttachBone = (part: BodyPart, side: Side | undefined, t: number, layout: CharacterLayout): BoneName => {
  const S = sideName(side);
  switch (part) {
    case 'torso': {
      const y = layout.torsoBottomY + (layout.neckBaseY - layout.torsoBottomY) * t;
      if (y < layout.joints.Spine[1]) return 'Hips';
      return y < layout.joints.Chest[1] ? 'Spine' : 'Chest';
    }
    case 'neck':
      return 'Neck';
    case 'head':
      return 'Head';
    case 'arm':
      return t < layout.elbowT ? `${S}UpperArm` : `${S}LowerArm`;
    case 'hand':
      return `${S}Hand`;
    case 'leg':
      return t < layout.kneeT ? `${S}UpperLeg` : `${S}LowerLeg`;
    case 'foot':
      return `${S}Foot`;
  }
};

/** Hệ toạ độ tại một điểm bề mặt: +Z = pháp tuyến hướng ra, +Y = hướng lên (chiếu vuông góc). */
export const mountFrame = (
  mount: SurfaceMount,
  surface: BodySurface,
  rotationDeg?: [number, number, number],
  collider?: BodyCollider,
): THREE.Matrix4 => {
  const { position, normal } = fittedPoint(surface, collider)(mount);
  const z = new THREE.Vector3(...normal);
  const up = Math.abs(z.y) > 0.95 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const y = up.sub(z.clone().multiplyScalar(up.dot(z))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  const frame = new THREE.Matrix4().makeBasis(x, y, z).setPosition(...position);
  if (rotationDeg) {
    const [rx, ry, rz] = rotationDeg;
    frame.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx * DEG, ry * DEG, rz * DEG)));
  }
  return frame;
};

/** Hộp phẳng áp lên mặt cong/lõm: đo các điểm trên mặt sau, đẩy cả hộp ra theo +Z tới khi không chìm vào thân. */
const liftBoxOutOfBody = (holder: THREE.Group, collider: BodyCollider): void => {
  const mesh = holder.children[0] as THREE.Mesh;
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox!;
  const samples: THREE.Vector3[] = [];
  for (const x of [box.min.x, 0, box.max.x]) for (const y of [box.min.y, 0, box.max.y]) samples.push(new THREE.Vector3(x, y, box.min.z));
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(holder.quaternion);
  for (let i = 0; i < 8; i++) {
    holder.updateMatrixWorld(true);
    const deepest = Math.max(
      ...samples.map((s) => {
        const w = s.clone().applyMatrix4(mesh.matrixWorld);
        return collider.depthInside([w.x, w.y, w.z]);
      }),
    );
    if (deepest <= 1e-4) return;
    holder.position.addScaledVector(normal, deepest + 0.001);
  }
};

/**
 * Lượt cuối cho giáp ôm thân: đỉnh nào còn chìm trong lưới thân (thường do độ dày cộng theo pháp tuyến
 * chĩa sang bộ phận bên cạnh, ví dụ góc bẹn) thì đưa ra mặt thân gần nhất. Geometry ở toạ độ world lúc bind.
 */
const pushVerticesOutside = (meshes: THREE.Mesh[], collider: BodyCollider): void => {
  for (const mesh of meshes) {
    const pos = mesh.geometry.getAttribute('position');
    let moved = false;
    for (let i = 0; i < pos.count; i++) {
      const v: [number, number, number] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      if (collider.depthInside(v) === 0) continue;
      const { point } = collider.pushOutside(v, [0, 1, 0]);
      pos.setXYZ(i, point[0], point[1], point[2]);
      moved = true;
    }
    if (moved) {
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  }
};

const resolveAttach = (attach: Attach, ctx: EquipmentContext): { frame: THREE.Matrix4; mount: SurfaceMount; socket?: string } => {
  if ('mount' in attach) return { frame: mountFrame(attach.mount, ctx.surface, undefined, ctx.collider), mount: attach.mount };
  const socket = ctx.sockets.find((s) => s.name === attach.socket);
  if (!socket) throw new Error(`Socket "${attach.socket}" chưa được khai báo`);
  return { frame: mountFrame(socket.mount, ctx.surface, socket.rotationDeg, ctx.collider), mount: socket.mount, socket: socket.name };
};

const meshesFrom = (geometries: PlateGeometries, color: THREE.Material, edge: THREE.Material | undefined): THREE.Mesh[] => [
  ...geometries.body.map((g) => new THREE.Mesh(g, color)),
  ...(edge ? geometries.edge.map((g) => new THREE.Mesh(g, edge)) : []),
];

export const buildEquipment = (item: EquipmentItem, ctx: EquipmentContext): EquipmentPart => {
  const group = new THREE.Group();
  group.name = `equip_${item.id}`;
  const color = ctx.materials.get(item.color);
  const edge = item.edgeColor ? ctx.materials.get(item.edgeColor) : undefined;
  let bone: BoneName;
  let socket: string | undefined;

  switch (item.kind) {
    case 'plate': {
      group.add(...meshesFrom(buildPlateGeometries(item, ctx.surface, ctx.radialSegments, Boolean(edge), ctx.collider), color, edge));
      bone = resolveAttachBone(item.part, item.side, (item.tStart + item.tEnd) / 2, ctx.layout);
      break;
    }
    case 'band': {
      group.add(...meshesFrom(buildBandGeometries(item, ctx.surface, ctx.radialSegments, ctx.collider), color, undefined));
      bone = resolveAttachBone(item.part, item.side, item.t, ctx.layout);
      break;
    }
    case 'shell': {
      const { shell, crest } = buildShellGeometries(item, ctx.surface, ctx.layout, ctx.radialSegments, ctx.collider);
      group.add(new THREE.Mesh(shell, color));
      if (crest) group.add(new THREE.Mesh(crest, edge ?? color));
      bone = 'Head';
      break;
    }
    case 'box':
    case 'assembly': {
      const resolved = resolveAttach(item.attach, ctx);
      const holder = new THREE.Group();
      resolved.frame.decompose(holder.position, holder.quaternion, holder.scale);
      holder.add(item.kind === 'box' ? buildBoxMesh(item, color) : buildAssemblyGroup(item, ctx.materials));
      if (item.kind === 'box' && ctx.collider) liftBoxOutOfBody(holder, ctx.collider);
      group.add(holder);
      bone = resolveAttachBone(resolved.mount.part, resolved.mount.side, resolved.mount.t, ctx.layout);
      socket = resolved.socket;
      break;
    }
  }

  if (ctx.collider && (item.kind === 'plate' || item.kind === 'band' || item.kind === 'shell')) {
    pushVerticesOutside(group.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh), ctx.collider);
  }

  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return { id: item.id, bone: item.bone ?? bone, socket, object: group };
};
