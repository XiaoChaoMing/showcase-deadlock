// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { exportCharacterGlb } from '../../src/game/character/export/CharacterExporter';
import { importCharacterGlb } from '../../src/game/character/export/CharacterImporter';
import { compareSummaries, summarizeCharacter } from '../../src/game/character/export/CharacterSummary';
import { CharacterAssetRegistry } from '../../src/game/character/runtime/CharacterAssetRegistry';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { setWeightView } from '../../src/game/character/debug/WeightVisualizer';
import { createSkeletonDebug } from '../../src/game/character/debug/SkeletonDebug';
import { BONE_NAMES } from '../../src/game/character/definitions/BoneNames';
import { kestrel } from '../fixtures/kestrel';
import { heroWithPreset } from '../helpers/heroes';

describe('GLB export → import', () => {
  it('Kestrel: bảng so sánh rỗng, đủ bone, metadata, trang bị, không helper', async () => {
    const { buffer, summary } = await exportCharacterGlb(kestrel);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    const imported = await importCharacterGlb(buffer);
    const back = summarizeCharacter(imported);
    expect(compareSummaries(summary, back)).toEqual([]);
    expect(back.boneNames).toEqual([...BONE_NAMES]);
    expect(back.metadata).toEqual({ id: 'kestrel', version: 1 });
    expect(back.hasSkinAttributes).toBe(true);
    expect(back.equipment).toHaveLength(kestrel.equipment.length);
    expect(back.equipment.find((e) => e.name === 'equip_left-pauldron')?.parent).toBe('LeftUpperArm');
    expect(back.equipment.find((e) => e.name === 'equip_rifle')?.parent).toBe('socket_back_weapon');
    expect(back.sockets.map((s) => s.name).sort()).toEqual(['socket_back_weapon', 'socket_hip_holster']);
    expect(back.helperCount).toBe(0);
    expect(back.bodyHeight).toBeCloseTo(1.8, 2);
  });

  it('dáng heavy cũng khớp sau khi nạp lại', async () => {
    const hero = heroWithPreset('heavy');
    const { buffer, summary } = await exportCharacterGlb(hero);
    expect(compareSummaries(summary, summarizeCharacter(await importCharacterGlb(buffer)))).toEqual([]);
  });

  it('compareSummaries báo khác biệt bằng tiếng Việt', () => {
    const a = summarizeCharacter(buildCharacter(kestrel).root);
    const b = { ...a, boneNames: a.boneNames.slice(1), bodyHeight: a.bodyHeight + 0.1 };
    const diffs = compareSummaries(a, b);
    expect(diffs.length).toBeGreaterThanOrEqual(2);
    expect(diffs.join(' ')).toMatch(/bone/);
    expect(diffs.join(' ')).toMatch(/chiều cao/i);
  });

  it('Review Focus #4: bật weight/wireframe/bộ xương trên bản đang xem vẫn xuất GLB sạch', async () => {
    const shown = buildCharacter(kestrel);
    setWeightView(shown, 'Chest');
    shown.root.traverse((o) => {
      if (o instanceof THREE.Mesh) for (const m of [o.material].flat()) (m as THREE.MeshStandardMaterial).wireframe = true;
    });
    shown.root.add(createSkeletonDebug(shown.rig).group);
    shown.rig.byName.get('LeftUpperArm')!.rotation.z = 1;

    const imported = await importCharacterGlb((await exportCharacterGlb(kestrel)).buffer);
    const materials: THREE.Material[] = [];
    imported.traverse((o) => {
      if (o instanceof THREE.Mesh) materials.push(...[o.material].flat());
    });
    expect(materials.some((m) => m instanceof THREE.MeshBasicMaterial)).toBe(false);
    expect(materials.some((m) => (m as THREE.MeshStandardMaterial).wireframe)).toBe(false);
    expect(summarizeCharacter(imported).helperCount).toBe(0);
  });

  it('CharacterAssetRegistry lưu và trả asset', async () => {
    const registry = new CharacterAssetRegistry();
    const model = (await importCharacterGlb((await exportCharacterGlb(kestrel)).buffer)) as THREE.Group;
    registry.register({ id: 'kestrel', model, animations: [] });
    expect(registry.get('kestrel')?.model).toBe(model);
    expect(registry.list()).toEqual(['kestrel']);
    expect(registry.get('nope')).toBeUndefined();
  });
});
