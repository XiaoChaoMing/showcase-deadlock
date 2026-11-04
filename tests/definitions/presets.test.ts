import { describe, expect, it } from 'vitest';
import { applyPreset, BODY_PRESETS } from '../../src/game/character/definitions/presets';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { kestrel } from '../fixtures/kestrel';

describe('body presets', () => {
  it('có đủ 4 preset', () => expect(Object.keys(BODY_PRESETS).sort()).toEqual(['athletic', 'feminine', 'heavy', 'slim']));

  it.each(['athletic', 'heavy', 'slim', 'feminine'] as const)('preset %s hợp lệ khi ghép vào Kestrel', (name) => {
    const r = validateHero(applyPreset(kestrel, BODY_PRESETS[name]));
    if (!r.ok) console.error(r.errors);
    expect(r.ok).toBe(true);
  });

  it('applyPreset không đổi hero gốc', () => {
    const before = JSON.stringify(kestrel);
    applyPreset(kestrel, BODY_PRESETS.heavy);
    expect(JSON.stringify(kestrel)).toBe(before);
    expect(applyPreset(kestrel, BODY_PRESETS.heavy).proportions.height).toBe(1.95);
  });
});
