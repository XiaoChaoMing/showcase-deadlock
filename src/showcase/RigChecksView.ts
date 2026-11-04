import type { RigCheck } from '../game/character/rigging/RigValidator';
import { el } from './dom';

export const renderRigChecks = (checks: RigCheck[]): HTMLElement => {
  const passed = checks.filter((c) => c.pass).length;
  return el(
    'section',
    { class: 'rig-checks' },
    el('h2', {}, 'Kiểm tra rig ', el('span', { class: passed === checks.length ? 'badge ok' : 'badge bad' }, `${passed}/${checks.length}`)),
    el(
      'ul',
      {},
      ...checks.map((c) =>
        el('li', { class: c.pass ? 'pass' : 'fail', title: c.detail }, el('span', { class: 'mark' }, c.pass ? '✓' : '✗'), c.label, !c.pass && el('small', {}, c.detail)),
      ),
    ),
  );
};
