import { describe, expect, it } from 'vitest';
import { validateRig, type RigCheckId } from '../../src/game/character/rigging/RigValidator';
import { resetToBindPose } from '../../src/game/character/rigging/SkeletonBuilder';
import { buildCharacter } from '../../src/game/character/runtime/CharacterFactory';
import { kestrel } from '../fixtures/kestrel';
import { SAMPLE_HEROES } from '../helpers/heroes';

const check = (inst: ReturnType<typeof buildCharacter>, id: RigCheckId) => validateRig(inst).find((c) => c.id === id)!;

describe('validateRig', () => {
  it.each(SAMPLE_HEROES)('%s: mọi check pass, đủ 9 id', (_n, hero) => {
    const checks = validateRig(buildCharacter(hero));
    expect(checks.map((c) => c.id).sort()).toEqual(
      ['bind-pose', 'body-height', 'bone-count', 'bone-names', 'hierarchy', 'indices-valid', 'max-influences', 'skin-attributes', 'weights-normalized'],
    );
    for (const c of checks) expect(c.pass, `${c.id}: ${c.detail}`).toBe(true);
    for (const c of checks) expect(c.label.length).toBeGreaterThan(3);
  });

  it('tổng weight sai → weights-normalized fail, detail chỉ ra vertex', () => {
    const inst = buildCharacter(kestrel);
    const w = inst.body.geometry.getAttribute('skinWeight');
    w.setXYZW(7, 0.5, 0, 0, 0);
    const c = check(inst, 'weights-normalized');
    expect(c.pass).toBe(false);
    expect(c.detail).toContain('7');
  });

  it('index bone vượt quá → indices-valid fail', () => {
    const inst = buildCharacter(kestrel);
    inst.body.geometry.getAttribute('skinIndex').setX(0, 25);
    expect(check(inst, 'indices-valid').pass).toBe(false);
  });

  it('đổi tên bone → bone-names fail', () => {
    const inst = buildCharacter(kestrel);
    inst.rig.byName.get('Spine')!.name = 'Spine2';
    expect(check(inst, 'bone-names').pass).toBe(false);
  });

  it('bone đang xoay → bind-pose fail, reset → pass', () => {
    const inst = buildCharacter(kestrel);
    inst.rig.byName.get('LeftUpperArm')!.rotation.z = 0.5;
    const c = check(inst, 'bind-pose');
    expect(c.pass).toBe(false);
    expect(c.detail).toContain('LeftUpperArm');
    resetToBindPose(inst.rig);
    expect(check(inst, 'bind-pose').pass).toBe(true);
  });

  it('thiếu skinWeight → skin-attributes fail', () => {
    const inst = buildCharacter(kestrel);
    inst.body.geometry.deleteAttribute('skinWeight');
    expect(check(inst, 'skin-attributes').pass).toBe(false);
  });
});
