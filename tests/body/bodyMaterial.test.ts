// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyBodyDesign, defaultBodyDesign } from '../../src/game/character/body/config/resolveBodyDesign';
import { cavityColors } from '../../src/game/character/body/materials/bodyMaterial';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { setWeightView } from '../../src/game/character/debug/WeightVisualizer';
import { exportCharacterGlb } from '../../src/game/character/export/CharacterExporter';
import { importCharacterGlb } from '../../src/game/character/export/CharacterImporter';
import { kestrel } from '../fixtures/kestrel';

const hero = applyBodyDesign(kestrel, defaultBodyDesign('fighter', 'masculine'));
const bodyMaterials = (inst: ReturnType<typeof buildCharacter>) => [inst.body.material].flat() as THREE.MeshStandardMaterial[];

describe('vật liệu thân (bodyDesign)', () => {
  it('vật liệu thân riêng: tên "~body", roughness 0.62, bật màu đỉnh, không chung instance với giáp', () => {
    const inst = buildCharacter(hero);
    const mats = bodyMaterials(inst);
    for (const m of mats) {
      expect(m.name.endsWith('~body')).toBe(true);
      expect(m.roughness).toBeCloseTo(0.62, 6);
      expect(m.metalness).toBe(0);
      expect(m.vertexColors).toBe(true);
    }
    const armorMats = new Set<THREE.Material>();
    inst.root.traverse((o) => {
      if (o instanceof THREE.Mesh && o !== inst.body) for (const m of [o.material].flat()) armorMats.add(m);
    });
    for (const m of mats) expect(armorMats.has(m)).toBe(false);
    // cùng màu với vai trò trong palette
    const suit = mats.find((m) => m.name === `${kestrel.bodyPaint.torso}~body`)!;
    expect(suit.color.equals(inst.materials.get(kestrel.bodyPaint.torso).color)).toBe(true);
  });

  it('rãnh bụng tối hơn đỉnh khối bụng; contrast 0 → mọi màu = 1', () => {
    const inst = buildCharacter(hero);
    const g = inst.body.geometry;
    const pos = g.getAttribute('position');
    const color = g.getAttribute('color');
    // đỉnh trước bụng gần đường giữa (rãnh) và lệch 10° (khối cơ), cùng độ cao hàng cơ bụng giữa
    const L = inst.layout;
    const y = L.torsoBottomY + 0.49 * (L.neckBaseY - L.torsoBottomY);
    let groove = { d: Infinity, c: 1 };
    let peak = { d: Infinity, c: 1 };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), py = pos.getY(i), z = pos.getZ(i);
      if (z < 0 || Math.abs(py - y) > 0.01) continue;
      const angle = THREE.MathUtils.radToDeg(Math.atan2(x, z));
      const dg = Math.abs(angle);
      const dp = Math.abs(angle - 10);
      if (dg < groove.d) groove = { d: dg, c: color.getX(i) };
      if (dp < peak.d) peak = { d: dp, c: color.getX(i) };
    }
    expect(groove.c).toBeLessThan(peak.c);
    const flat = cavityColors(g, 0);
    expect(Array.from(flat.array).every((v) => v === 1)).toBe(true);
  });

  it('xuất GLB giữ màu đỉnh của thân và roughness', async () => {
    const { buffer } = await exportCharacterGlb(hero);
    const root = await importCharacterGlb(buffer);
    const meshes: THREE.SkinnedMesh[] = [];
    root.traverse((o) => {
      if (o instanceof THREE.SkinnedMesh) meshes.push(o);
    });
    expect(meshes.length).toBeGreaterThan(0);
    for (const m of meshes) {
      expect(m.geometry.getAttribute('color')).toBeDefined();
      for (const mat of [m.material].flat() as THREE.MeshStandardMaterial[]) expect(mat.roughness).toBeCloseTo(0.62, 3);
    }
  });

  it('bật/tắt xem weight trả lại đúng màu đỉnh gốc', () => {
    const inst = buildCharacter(hero);
    const before = Float32Array.from(inst.body.geometry.getAttribute('color').array as Float32Array);
    setWeightView(inst, 'Chest');
    setWeightView(inst, null);
    expect(Array.from(inst.body.geometry.getAttribute('color').array)).toEqual(Array.from(before));
  });

  it('hero kiểu cũ: không có vật liệu "~body", không có màu đỉnh', () => {
    const inst = buildCharacter(kestrel);
    expect(bodyMaterials(inst).some((m) => m.name.endsWith('~body'))).toBe(false);
    expect(inst.body.geometry.getAttribute('color')).toBeUndefined();
  });
});
