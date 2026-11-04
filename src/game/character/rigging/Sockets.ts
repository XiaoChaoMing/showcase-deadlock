import * as THREE from 'three';
import type { CharacterLayout } from '../definitions/CharacterLayout';
import type { SocketDefinition } from '../definitions/HeroDefinition';
import type { BodySurface } from '../modeling/BodySurface';
import { mountFrame, resolveAttachBone } from '../modeling/equipment/EquipmentBuilder';
import type { RigSkeleton } from './SkeletonBuilder';

/** Tạo socket (Object3D, không phải bone) gắn vào bone theo vị trí trên bề mặt thân, ở bind pose. */
export const createSockets = (
  defs: SocketDefinition[],
  surface: BodySurface,
  layout: CharacterLayout,
  rig: RigSkeleton,
): Map<string, THREE.Object3D> => {
  rig.root.updateMatrixWorld(true);
  const sockets = new Map<string, THREE.Object3D>();
  for (const def of defs) {
    const bone = rig.byName.get(resolveAttachBone(def.mount.part, def.mount.side, def.mount.t, layout))!;
    const socket = new THREE.Object3D();
    socket.name = `socket:${def.name}`;
    const local = bone.matrixWorld.clone().invert().multiply(mountFrame(def.mount, surface, def.rotationDeg));
    local.decompose(socket.position, socket.quaternion, socket.scale);
    bone.add(socket);
    sockets.set(def.name, socket);
  }
  rig.root.updateMatrixWorld(true);
  return sockets;
};
