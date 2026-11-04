import athletic from '../../../../templates/body-presets/athletic.json';
import heavy from '../../../../templates/body-presets/heavy.json';
import slim from '../../../../templates/body-presets/slim.json';
import feminine from '../../../../templates/body-presets/feminine.json';
import type { BodyShape, CharacterProportions, HeroDefinition } from './HeroDefinition';

export interface BodyPreset {
  proportions: CharacterProportions;
  bodyShape: BodyShape;
}

export type BodyPresetName = 'athletic' | 'heavy' | 'slim' | 'feminine';

export const BODY_PRESETS: Record<BodyPresetName, BodyPreset> = {
  athletic: athletic as BodyPreset,
  heavy: heavy as BodyPreset,
  slim: slim as BodyPreset,
  feminine: feminine as BodyPreset,
};

export const isBodyPresetName = (value: unknown): value is BodyPresetName =>
  typeof value === 'string' && value in BODY_PRESETS;

const withoutBodyDesign = ({ bodyDesign: _ignored, ...rest }: HeroDefinition): HeroDefinition => rest;

/** Trả bản hero mới với tỷ lệ và hình dáng của preset (thân kiểu cũ); hero gốc không đổi. */
export const applyPreset = (hero: HeroDefinition, preset: BodyPreset): HeroDefinition => ({
  ...withoutBodyDesign(structuredClone(hero)),
  proportions: structuredClone(preset.proportions),
  bodyShape: structuredClone(preset.bodyShape),
});
