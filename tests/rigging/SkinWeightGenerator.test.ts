import { describe, expect, it } from 'vitest';
import { generateSkinWeights } from '../../src/game/character/rigging/SkinWeightGenerator';
import { REGION_BONES, boneSegment } from '../../src/game/character/rigging/BoneMapping';
import { BONE_NAMES, boneIndex, type BoneName } from '../../src/game/character/definitions/BoneNames';
import { BodyRegion } from '../../src/game/character/modeling/BodyGeometry';
import { buildCharacterModel } from '../../src/game/character/modeling/CharacterModelBuilder';
import { kestrel } from '../fixtures/kestrel';

const model = buildCharacterModel(kestrel);
const geometry = model.bodyGeometry;
const { skinIndex, skinWeight } = generateSkinWeights(geometry, model.layout);
const region = geometry.getAttribute('region');
const chainT = geometry.getAttribute('chainT');
const pos = geometry.getAttribute('position');
const count = pos.count;

const weightOf = (v: number, bone: BoneName): number => {
  let w = 0;
  for (let k = 0; k < 4; k++) if (skinIndex[v * 4 + k] === boneIndex(bone)) w += skinWeight[v * 4 + k]!;
  return w;
};
const bonesOf = (v: number): BoneName[] =>
  [0, 1, 2, 3].filter((k) => skinWeight[v * 4 + k]! > 0).map((k) => BONE_NAMES[skinIndex[v * 4 + k]!]!);
const verticesWhere = (pred: (v: number) => boolean): number[] => Array.from({ length: count }, (_, v) => v).filter(pred);

describe('boneSegment', () => {
  it('đoạn bone nối joint tới joint con, Head tới đỉnh đầu, Root không có', () => {
    expect(boneSegment('LeftUpperArm', model.layout)).toEqual([model.layout.joints.LeftUpperArm, model.layout.joints.LeftLowerArm]);
    expect(boneSegment('Head', model.layout)?.[1][1]).toBeCloseTo(model.layout.headTopY, 9);
    expect(boneSegment('LeftHand', model.layout)?.[1]).toEqual(model.layout.handTip.left);
    expect(boneSegment('RightFoot', model.layout)?.[1]).toEqual(model.layout.toeTip.right);
    expect(boneSegment('Root', model.layout)).toBeNull();
  });
});

describe('generateSkinWeights', () => {
  it('kích thước mảng = 4 × số vertex', () => {
    expect(skinIndex.length).toBe(count * 4);
    expect(skinWeight.length).toBe(count * 4);
  });

  it('mọi vertex: tổng ≈ 1, ≤ 4 ảnh hưởng, index < 20, Root = 0', () => {
    for (let v = 0; v < count; v++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += skinWeight[v * 4 + k]!;
        expect(skinIndex[v * 4 + k]!).toBeLessThan(20);
      }
      expect(Math.abs(sum - 1)).toBeLessThan(1e-5);
      expect(weightOf(v, 'Root')).toBe(0);
    }
  });

  it('vertex ArmL chỉ dùng bone trong REGION_BONES[ArmL]', () => {
    const allowed = new Set(REGION_BONES[BodyRegion.ArmL]);
    for (const v of verticesWhere((v) => region.getX(v) === BodyRegion.ArmL)) {
      for (const b of bonesOf(v)) expect(allowed.has(b), b).toBe(true);
    }
  });

  it('vertex thân có x > 0.05 không dính bone bên phải', () => {
    for (const v of verticesWhere((v) => region.getX(v) === BodyRegion.Torso && pos.getX(v) > 0.05)) {
      for (const b of bonesOf(v)) expect(b.startsWith('Right'), b).toBe(false);
    }
  });

  const inRange = (r: BodyRegion, a: number, b: number) =>
    verticesWhere((v) => region.getX(v) === r && chainT.getX(v) >= a && chainT.getX(v) <= b);

  it('giữa cánh tay trên: LeftUpperArm ≥ 0.9', () => {
    const vs = inRange(BodyRegion.ArmL, 0.2, 0.3);
    expect(vs.length).toBeGreaterThan(0);
    for (const v of vs) expect(weightOf(v, 'LeftUpperArm')).toBeGreaterThanOrEqual(0.9);
  });

  it('gần cổ tay: LeftLowerArm ≥ 0.6', () => {
    for (const v of inRange(BodyRegion.ArmL, 0.85, 0.95)) expect(weightOf(v, 'LeftLowerArm')).toBeGreaterThanOrEqual(0.6);
  });

  it('giữa đùi: LeftUpperLeg ≥ 0.9', () => {
    const vs = inRange(BodyRegion.LegL, 0.2, 0.3);
    expect(vs.length).toBeGreaterThan(0);
    for (const v of vs) expect(weightOf(v, 'LeftUpperLeg')).toBeGreaterThanOrEqual(0.9);
  });

  it('10% trên cùng của đầu: Head ≥ 0.95', () => {
    for (const v of inRange(BodyRegion.Head, 0.9, 1)) expect(weightOf(v, 'Head')).toBeGreaterThanOrEqual(0.95);
  });

  it('tại khuỷu: cả UpperArm và LowerArm > 0.2', () => {
    const vs = verticesWhere((v) => region.getX(v) === BodyRegion.ArmL && Math.abs(chainT.getX(v) - model.layout.elbowT) < 0.02);
    expect(vs.length).toBeGreaterThan(0);
    for (const v of vs) {
      expect(weightOf(v, 'LeftUpperArm')).toBeGreaterThan(0.2);
      expect(weightOf(v, 'LeftLowerArm')).toBeGreaterThan(0.2);
    }
  });
});
