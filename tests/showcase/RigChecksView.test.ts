// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { renderRigChecks } from '../../src/showcase/RigChecksView';
import { renderControls } from '../../src/showcase/ControlsPanel';
import type { RigCheck } from '../../src/game/character/rigging/RigValidator';

describe('renderRigChecks', () => {
  it('check fail có class .fail và hiện detail', () => {
    const checks: RigCheck[] = [
      { id: 'bone-count', label: 'Đủ 20 bone', pass: true, detail: '20 bone' },
      { id: 'weights-normalized', label: 'Tổng weight = 1', pass: false, detail: 'vertex 7: tổng 0.500' },
    ];
    const el = renderRigChecks(checks);
    expect(el.querySelectorAll('.pass')).toHaveLength(1);
    const fail = el.querySelectorAll('.fail');
    expect(fail).toHaveLength(1);
    expect(fail[0]!.textContent).toContain('vertex 7');
    expect(el.textContent).toContain('1/2');
  });
});

describe('renderControls', () => {
  it('8 nút tư thế tiếng Việt, bấm gọi onPose', () => {
    const onPose = vi.fn();
    const el = renderControls(
      { pose: 'idle', skeleton: false, wireframe: false, weights: false, weightBone: 'Chest', equipment: true },
      { onPose, onToggle: vi.fn(), onWeightBone: vi.fn() },
    );
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('button[data-pose]')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Đứng thở', 'T-Pose', 'Giơ tay', 'Gập khuỷu', 'Gập gối', 'Nâng chân', 'Xoay thân', 'Xoay đầu']);
    expect(el.querySelector('button[data-pose="idle"]')!.classList.contains('active')).toBe(true);
    buttons[2]!.click();
    expect(onPose).toHaveBeenCalledWith('armRaise');
  });

  it('công tắc gọi onToggle với giá trị mới', () => {
    const onToggle = vi.fn();
    const el = renderControls(
      { pose: 'idle', skeleton: false, wireframe: false, weights: false, weightBone: 'Chest', equipment: true },
      { onPose: vi.fn(), onToggle, onWeightBone: vi.fn() },
    );
    const box = el.querySelector<HTMLInputElement>('input[data-toggle="skeleton"]')!;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(onToggle).toHaveBeenCalledWith('skeleton', true);
  });
});
