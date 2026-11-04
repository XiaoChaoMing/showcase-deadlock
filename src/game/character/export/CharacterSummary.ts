import * as THREE from 'three';

export interface CharacterSummary {
  /** Theo thứ tự skeleton. */
  boneNames: string[];
  bodyVertexCount: number;
  hasSkinAttributes: boolean;
  /** Sắp theo name. */
  equipment: { name: string; parent: string }[];
  sockets: { name: string; parent: string }[];
  /** Số vật liệu khác nhau (theo tên) trong toàn cây. */
  materialCount: number;
  /** Chiều cao thân ở bind pose. */
  bodyHeight: number;
  metadata: { id: string; version: number } | null;
  helperCount: number;
}

const HEIGHT_TOLERANCE = 1e-4;
const EQUIP_PREFIX = 'equip_';
const SOCKET_PREFIX = 'socket_';

/** Thân có thể là một SkinnedMesh, hoặc (sau khi nạp glTF nhiều vật liệu) một Group chứa nhiều SkinnedMesh. */
const bodyMeshes = (root: THREE.Object3D): THREE.SkinnedMesh[] => {
  const body = root.getObjectByName('Body');
  if (!body) return [];
  if (body instanceof THREE.SkinnedMesh) return [body];
  return body.children.filter((c): c is THREE.SkinnedMesh => c instanceof THREE.SkinnedMesh);
};

const isHelper = (o: THREE.Object3D): boolean =>
  o instanceof THREE.Line || o instanceof THREE.SkeletonHelper || o.name.startsWith('debug') || o.type === 'CSS2DObject';

const byName = (a: { name: string }, b: { name: string }): number => a.name.localeCompare(b.name);

export const summarizeCharacter = (root: THREE.Object3D): CharacterSummary => {
  const meshes = bodyMeshes(root);
  const equipment: CharacterSummary['equipment'] = [];
  const sockets: CharacterSummary['sockets'] = [];
  const materials = new Set<string>();
  let helperCount = 0;
  root.traverse((o) => {
    if (o.name.startsWith(EQUIP_PREFIX)) equipment.push({ name: o.name, parent: o.parent?.name ?? '' });
    if (o.name.startsWith(SOCKET_PREFIX)) sockets.push({ name: o.name, parent: o.parent?.name ?? '' });
    if (isHelper(o)) helperCount += 1;
    if (o instanceof THREE.Mesh) for (const m of [o.material].flat()) materials.add(m.name || m.uuid);
  });
  const first = meshes[0];
  const position = first?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  const box = position ? new THREE.Box3().setFromBufferAttribute(position) : null;
  const data = root.userData as { id?: unknown; version?: unknown };
  return {
    boneNames: first?.skeleton.bones.map((b) => b.name) ?? [],
    bodyVertexCount: Math.max(0, ...meshes.map((m) => m.geometry.getAttribute('position').count)),
    hasSkinAttributes: meshes.length > 0 && meshes.every((m) => m.geometry.getAttribute('skinIndex') && m.geometry.getAttribute('skinWeight')),
    equipment: equipment.sort(byName),
    sockets: sockets.sort(byName),
    materialCount: materials.size,
    bodyHeight: box ? box.max.y - box.min.y : 0,
    metadata: typeof data.id === 'string' && typeof data.version === 'number' ? { id: data.id, version: data.version } : null,
    helperCount,
  };
};

/** Mỗi khác biệt là một dòng tiếng Việt; mảng rỗng = khớp hoàn toàn. */
export const compareSummaries = (a: CharacterSummary, b: CharacterSummary): string[] => {
  const diffs: string[] = [];
  if (a.boneNames.join() !== b.boneNames.join()) diffs.push(`Danh sách bone khác: ${a.boneNames.length} → ${b.boneNames.length} bone`);
  if (a.bodyVertexCount !== b.bodyVertexCount) diffs.push(`Số vertex thân khác: ${a.bodyVertexCount} → ${b.bodyVertexCount}`);
  if (a.hasSkinAttributes !== b.hasSkinAttributes) diffs.push(`Thuộc tính skin: ${a.hasSkinAttributes} → ${b.hasSkinAttributes}`);
  const list = (xs: { name: string; parent: string }[]) => xs.map((x) => `${x.name}@${x.parent}`).join(',');
  if (list(a.equipment) !== list(b.equipment)) diffs.push(`Trang bị hoặc điểm gắn khác (${a.equipment.length} → ${b.equipment.length} món)`);
  if (list(a.sockets) !== list(b.sockets)) diffs.push(`Socket khác (${a.sockets.length} → ${b.sockets.length})`);
  if (a.materialCount !== b.materialCount) diffs.push(`Số vật liệu khác: ${a.materialCount} → ${b.materialCount}`);
  if (Math.abs(a.bodyHeight - b.bodyHeight) > HEIGHT_TOLERANCE) diffs.push(`Chiều cao thân khác: ${a.bodyHeight.toFixed(4)} → ${b.bodyHeight.toFixed(4)} m`);
  if (JSON.stringify(a.metadata) !== JSON.stringify(b.metadata)) diffs.push(`Metadata khác: ${JSON.stringify(a.metadata)} → ${JSON.stringify(b.metadata)}`);
  if (a.helperCount !== b.helperCount) diffs.push(`Số helper khác: ${a.helperCount} → ${b.helperCount}`);
  return diffs;
};
