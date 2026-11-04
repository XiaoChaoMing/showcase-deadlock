import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { HeroDefinition } from '../definitions/HeroDefinition';
import { resetToBindPose } from '../rigging/SkeletonBuilder';
import { buildCharacter } from '../runtime/CharacterFactory';
import { summarizeCharacter, type CharacterSummary } from './CharacterSummary';

/** Thuộc tính chỉ dùng nội bộ khi dựng/skin, không đưa vào file. */
const INTERNAL_ATTRIBUTES = ['region', 'chainT', 'color'];

/**
 * Xuất GLB từ một bản dựng MỚI ở bind pose (không dùng bản đang hiển thị),
 * nên chế độ xem weight, wireframe, bộ xương debug hay tư thế hiện tại không lọt vào file.
 */
export const exportCharacterGlb = async (hero: HeroDefinition): Promise<{ buffer: ArrayBuffer; summary: CharacterSummary }> => {
  const instance = buildCharacter(hero);
  resetToBindPose(instance.rig);
  for (const name of INTERNAL_ATTRIBUTES) instance.body.geometry.deleteAttribute(name);
  const result = await new GLTFExporter().parseAsync(instance.root, { binary: true, onlyVisible: false });
  if (!(result instanceof ArrayBuffer)) throw new Error('GLTFExporter không trả về dữ liệu nhị phân');
  return { buffer: result, summary: summarizeCharacter(instance.root) };
};

/** Tải file về máy trong trình duyệt. */
export const downloadGlb = (name: string, buffer: ArrayBuffer): void => {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name.endsWith('.glb') ? name : `${name}.glb`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
