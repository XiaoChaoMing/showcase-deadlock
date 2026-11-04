import { describe, expect, it } from 'vitest';
import { loadHeroRegistry } from '../../src/game/character/runtime/HeroRegistry';
import { kestrelJson } from '../fixtures/kestrel';

describe('loadHeroRegistry', () => {
  it('hero hỏng không làm hỏng hero khác', () => {
    const reg = loadHeroRegistry({
      '/heroes/kestrel/hero.json': kestrelJson,
      '/heroes/broken/hero.json': { id: 'broken', version: 1 },
    });
    expect(reg.map((e) => [e.id, e.ok])).toEqual([['broken', false], ['kestrel', true]]);
  });

  it('id khác tên thư mục → lỗi tại /id', () => {
    const [e] = loadHeroRegistry({ '/heroes/other/hero.json': kestrelJson });
    expect(e?.ok).toBe(false);
    expect(e && !e.ok && e.errors.some((x) => x.path === '/id')).toBe(true);
    expect(e?.id).toBe('other');
  });

  it('file JSON sai cú pháp → thẻ lỗi, hero khác vẫn nạp được', () => {
    const reg = loadHeroRegistry({
      '/heroes/kestrel/hero.json': JSON.stringify(kestrelJson),
      '/heroes/typo/hero.json': '{ "id": "typo", "version": 1, }',
    });
    const typo = reg.find((e) => e.id === 'typo');
    expect(typo?.ok).toBe(false);
    expect(typo && !typo.ok && typo.errors[0]?.path).toBe('/');
    expect(typo && !typo.ok && typo.errors[0]?.message).toContain('JSON không hợp lệ');
    expect(reg.find((e) => e.id === 'kestrel')?.ok).toBe(true);
  });
});
