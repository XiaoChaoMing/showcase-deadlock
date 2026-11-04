import type * as THREE from 'three';
import type { EquipmentPart } from '../modeling/equipment/EquipmentBuilder';
import type { RigSkeleton } from './SkeletonBuilder';

/** Chuyển từng món trang bị (đang ở toạ độ world lúc bind) vào bone/socket, giữ nguyên vị trí world. */
export const attachEquipment = (parts: EquipmentPart[], rig: RigSkeleton, sockets: Map<string, THREE.Object3D>): void => {
  rig.root.updateMatrixWorld(true);
  for (const part of parts) {
    const target = part.socket ? sockets.get(part.socket) : rig.byName.get(part.bone);
    if (!target) throw new Error(`Không tìm thấy điểm gắn cho trang bị "${part.id}"`);
    part.object.updateMatrixWorld(true);
    target.attach(part.object);
  }
  rig.root.updateMatrixWorld(true);
};
