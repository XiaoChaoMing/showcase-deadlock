import * as THREE from 'three';
import { BONE_NAMES, BONE_PARENT, type BoneName } from '../definitions/BoneNames';
import type { CharacterInstance } from '../runtime/CharacterFactory';

export type RigCheckId =
  | 'bone-count'
  | 'bone-names'
  | 'hierarchy'
  | 'skin-attributes'
  | 'max-influences'
  | 'weights-normalized'
  | 'indices-valid'
  | 'body-height'
  | 'bind-pose';

export interface RigCheck {
  id: RigCheckId;
  label: string;
  pass: boolean;
  detail: string;
}

const WEIGHT_TOLERANCE = 1e-3;
const HEIGHT_TOLERANCE = 0.01;
const BIND_ANGLE_TOLERANCE = 1e-4;
const BIND_POSITION_TOLERANCE = 1e-6;
const MAX_LISTED = 3;

const result = (id: RigCheckId, label: string, problems: string[], okDetail: string): RigCheck => ({
  id,
  label,
  pass: problems.length === 0,
  detail: problems.length === 0 ? okDetail : problems.slice(0, MAX_LISTED).join('; ') + (problems.length > MAX_LISTED ? ` (+${problems.length - MAX_LISTED})` : ''),
});

/** Kiểm tra tự động rig của một nhân vật (không thay đổi trạng thái nhân vật). */
export const validateRig = (instance: CharacterInstance): RigCheck[] => {
  const bones = instance.body.skeleton.bones;
  const geometry = instance.body.geometry;
  const skinIndex = geometry.getAttribute('skinIndex') as THREE.BufferAttribute | undefined;
  const skinWeight = geometry.getAttribute('skinWeight') as THREE.BufferAttribute | undefined;
  const position = geometry.getAttribute('position');
  const checks: RigCheck[] = [];

  checks.push(result('bone-count', 'Đủ 20 bone', bones.length === BONE_NAMES.length ? [] : [`có ${bones.length} bone`], '20 bone'));

  const nameProblems: string[] = [];
  const seen = new Set<string>();
  bones.forEach((b, i) => {
    if (seen.has(b.name)) nameProblems.push(`tên "${b.name}" bị trùng`);
    seen.add(b.name);
    if (b.name !== BONE_NAMES[i]) nameProblems.push(`vị trí ${i}: "${b.name}" (cần "${BONE_NAMES[i]}")`);
  });
  checks.push(result('bone-names', 'Tên bone đúng và không trùng', nameProblems, 'đúng thứ tự chuẩn'));

  const hierarchyProblems: string[] = [];
  for (const b of bones) {
    const expected = BONE_PARENT[b.name as BoneName];
    if (expected === undefined) continue;
    const actual = b.parent instanceof THREE.Bone ? b.parent.name : null;
    if (actual !== expected) hierarchyProblems.push(`${b.name}: cha là ${actual ?? 'không có'} (cần ${expected ?? 'không có'})`);
  }
  checks.push(result('hierarchy', 'Cây bone đúng', hierarchyProblems, 'khớp cây chuẩn'));

  const attrProblems: string[] = [];
  if (!skinIndex) attrProblems.push('thiếu skinIndex');
  if (!skinWeight) attrProblems.push('thiếu skinWeight');
  if (skinIndex && skinIndex.count !== position.count) attrProblems.push(`skinIndex có ${skinIndex.count}/${position.count} vertex`);
  if (skinWeight && skinWeight.count !== position.count) attrProblems.push(`skinWeight có ${skinWeight.count}/${position.count} vertex`);
  checks.push(result('skin-attributes', 'Có skinIndex và skinWeight', attrProblems, `${position.count} vertex`));

  const influenceProblems: string[] = [];
  if (skinWeight && skinWeight.itemSize > 4) influenceProblems.push(`${skinWeight.itemSize} ảnh hưởng mỗi vertex`);
  if (!skinWeight) influenceProblems.push('thiếu skinWeight');
  checks.push(result('max-influences', 'Tối đa 4 ảnh hưởng mỗi vertex', influenceProblems, '≤ 4'));

  const weightProblems: string[] = [];
  const indexProblems: string[] = [];
  if (skinWeight && skinIndex) {
    for (let v = 0; v < skinWeight.count; v++) {
      let sum = 0;
      for (let k = 0; k < skinWeight.itemSize; k++) {
        sum += skinWeight.getComponent(v, k);
        const idx = skinIndex.getComponent(v, k);
        if (idx >= bones.length || idx < 0 || !Number.isInteger(idx)) indexProblems.push(`vertex ${v}: index ${idx}`);
      }
      if (Math.abs(sum - 1) > WEIGHT_TOLERANCE) weightProblems.push(`vertex ${v}: tổng ${sum.toFixed(3)}`);
    }
  } else {
    weightProblems.push('thiếu skin attributes');
    indexProblems.push('thiếu skin attributes');
  }
  checks.push(result('weights-normalized', 'Tổng weight mỗi vertex = 1', weightProblems, 'mọi vertex'));
  checks.push(result('indices-valid', 'Index bone hợp lệ', indexProblems, `mọi index < ${bones.length}`));

  // Toạ độ trong geometry chính là bind pose (bindMatrix = identity), nên đo trực tiếp, không cần reset rig.
  const box = new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
  const height = box.max.y - box.min.y;
  const target = instance.proportions.height;
  checks.push(
    result(
      'body-height',
      `Chiều cao thân ≈ ${target.toFixed(2)} m`,
      Math.abs(height - target) <= HEIGHT_TOLERANCE && Math.abs(box.min.y) <= HEIGHT_TOLERANCE
        ? []
        : [`đo được ${height.toFixed(3)} m (đáy ${box.min.y.toFixed(3)})`],
      `${height.toFixed(3)} m`,
    ),
  );

  const bindProblems: string[] = [];
  for (const [name, bind] of instance.rig.bindLocal) {
    const bone = instance.rig.byName.get(name)!;
    const angle = bone.quaternion.angleTo(bind.quaternion);
    if (angle > BIND_ANGLE_TOLERANCE || bone.position.distanceTo(bind.position) > BIND_POSITION_TOLERANCE) {
      bindProblems.push(`${name} lệch ${THREE.MathUtils.radToDeg(angle).toFixed(1)}°`);
    }
  }
  checks.push(result('bind-pose', 'Đang ở bind pose (T-Pose)', bindProblems, 'mọi bone khớp bind'));
  return checks;
};
