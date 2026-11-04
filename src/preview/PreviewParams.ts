import { isBoneName, type BoneName } from '../game/character/definitions/BoneNames';
import { POSE_IDS, type PoseId } from '../game/character/definitions/HeroDefinition';
import type { ViewName } from './Viewport';
import { ARCHETYPE_IDS, BODY_TYPES, type Archetype, type BodyType } from '../game/character/body/config/BodyDesign';

export type PreviewStage = 'proportions' | 'body' | 'skeleton' | 'skinned' | 'full';
export type PreviewOverlay = 'skeleton' | 'wireframe' | 'weights' | 'labels';
export type PreviewZoom = 'shoulderL' | 'elbowL' | 'hipL' | 'kneeL' | 'head' | 'torso';
export type PreviewLineup = 'none' | 'presets' | 'heroes' | 'archetypes';

export interface PreviewParams {
  hero?: string;
  preset?: string;
  stage: PreviewStage;
  view: ViewName;
  pose: PoseId;
  overlay: Set<PreviewOverlay>;
  bone?: BoneName;
  zoom?: PreviewZoom;
  lineup: PreviewLineup;
  /** Thân theo bodyDesign: archetype (và bodyType, mặc định masculine) thay cho thân của hero. */
  archetype?: Archetype;
  bodyType?: BodyType;
  /** Bóng mềm (chống răng cưa khi bề mặt tự đổ bóng). */
  softShadows: boolean;
}

const STAGES: readonly PreviewStage[] = ['proportions', 'body', 'skeleton', 'skinned', 'full'];
const VIEWS: readonly ViewName[] = ['front', 'side', 'back', 'threeQuarter'];
const OVERLAYS: readonly PreviewOverlay[] = ['skeleton', 'wireframe', 'weights', 'labels'];
const ZOOMS: readonly PreviewZoom[] = ['shoulderL', 'elbowL', 'hipL', 'kneeL', 'head', 'torso'];
const LINEUPS: readonly PreviewLineup[] = ['none', 'presets', 'heroes', 'archetypes'];

const pick = <T extends string>(allowed: readonly T[], value: string | null): T | undefined =>
  allowed.find((item) => item === value);

export const parsePreviewParams = (search: string): PreviewParams => {
  const q = new URLSearchParams(search);
  const overlay = new Set<PreviewOverlay>(
    (q.get('overlay') ?? '').split(',').flatMap((v) => pick(OVERLAYS, v.trim()) ?? []),
  );
  const bone = q.get('bone');
  return {
    hero: q.get('hero') ?? undefined,
    preset: q.get('preset') ?? undefined,
    stage: pick(STAGES, q.get('stage')) ?? 'full',
    view: pick(VIEWS, q.get('view')) ?? 'threeQuarter',
    pose: pick(POSE_IDS, q.get('pose')) ?? 'tpose',
    overlay,
    bone: isBoneName(bone) ? bone : undefined,
    zoom: pick(ZOOMS, q.get('zoom')),
    lineup: pick(LINEUPS, q.get('lineup')) ?? 'none',
    archetype: pick(ARCHETYPE_IDS, q.get('archetype')),
    bodyType: pick(BODY_TYPES, q.get('bodyType')),
    softShadows: q.get('shadows') === 'soft',
  };
};
