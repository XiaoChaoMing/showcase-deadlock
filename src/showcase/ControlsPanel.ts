import { BONE_NAMES, type BoneName } from '../game/character/definitions/BoneNames';
import { POSE_IDS, type PoseId } from '../game/character/definitions/HeroDefinition';
import { POSE_LABELS } from '../game/character/debug/RigDebugPanel';
import { el } from './dom';

export interface ControlsState {
  pose: PoseId;
  skeleton: boolean;
  wireframe: boolean;
  weights: boolean;
  weightBone: BoneName;
  equipment: boolean;
}

export type ToggleKey = 'skeleton' | 'wireframe' | 'weights' | 'equipment';

export interface ControlsHandlers {
  onPose(id: PoseId): void;
  onToggle(key: ToggleKey, value: boolean): void;
  onWeightBone(bone: BoneName): void;
}

const TOGGLES: Array<[ToggleKey, string]> = [
  ['equipment', 'Trang bị'],
  ['skeleton', 'Bộ xương'],
  ['wireframe', 'Wireframe'],
  ['weights', 'Skin weight'],
];

export const renderControls = (state: ControlsState, handlers: ControlsHandlers): HTMLElement => {
  const poses = POSE_IDS.map((id) => {
    const b = el('button', { type: 'button', 'data-pose': id, class: id === state.pose ? 'active' : '' }, POSE_LABELS[id]);
    b.addEventListener('click', () => {
      poses.forEach((p) => p.classList.toggle('active', p === b));
      handlers.onPose(id);
    });
    return b;
  });

  const toggles = TOGGLES.map(([key, label]) => {
    const input = el('input', { type: 'checkbox', 'data-toggle': key });
    input.checked = state[key];
    input.addEventListener('change', () => handlers.onToggle(key, input.checked));
    return el('label', { class: 'toggle' }, input, el('span', {}, label));
  });

  const bone = el('select', { 'aria-label': 'Bone xem weight' }, ...BONE_NAMES.filter((b) => b !== 'Root').map((b) => el('option', { value: b }, b)));
  bone.value = state.weightBone;
  bone.addEventListener('change', () => handlers.onWeightBone(bone.value as BoneName));

  return el(
    'section',
    { class: 'controls' },
    el('h2', {}, 'Tư thế'),
    el('div', { class: 'pose-grid' }, ...poses),
    el('h2', {}, 'Hiển thị'),
    el('div', { class: 'toggle-grid' }, ...toggles),
    el('label', { class: 'bone-select' }, el('span', {}, 'Bone xem weight'), bone),
  );
};
