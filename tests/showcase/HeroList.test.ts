// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { renderHeroList } from '../../src/showcase/HeroList';
import { renderHeroInfo } from '../../src/showcase/HeroInfoCard';
import { loadHeroRegistry } from '../../src/game/character/runtime/HeroRegistry';
import { kestrel, kestrelJson } from '../fixtures/kestrel';

const entries = loadHeroRegistry({
  '/heroes/kestrel/hero.json': kestrelJson,
  '/heroes/broken/hero.json': { id: 'broken', version: 1 },
});

describe('renderHeroList', () => {
  it('Review Focus #1: thẻ hero tốt và thẻ lỗi cùng hiện', () => {
    const onSelect = vi.fn();
    const el = renderHeroList(entries, 'kestrel', onSelect);
    const cards = el.querySelectorAll('.hero-card');
    expect(cards).toHaveLength(2);
    const error = el.querySelector('.hero-card.error')!;
    expect(error.textContent).toContain('Lỗi dữ liệu');
    expect(error.textContent).toContain('thiếu bodyDesign');
    const ok = el.querySelector('.hero-card[data-id="kestrel"]')!;
    expect(ok.textContent).toContain('Kestrel');
    expect(ok.classList.contains('selected')).toBe(true);
  });

  it('bấm thẻ lỗi không chọn, bấm thẻ tốt thì chọn', () => {
    const onSelect = vi.fn();
    const el = renderHeroList(entries, null, onSelect);
    (el.querySelector('.hero-card.error') as HTMLElement).click();
    expect(onSelect).not.toHaveBeenCalled();
    (el.querySelector('.hero-card[data-id="kestrel"]') as HTMLElement).click();
    expect(onSelect).toHaveBeenCalledWith('kestrel');
  });
});

describe('renderHeroInfo', () => {
  it('hiện tên, vai trò, giới thiệu, mô tả và bảng màu', () => {
    const el = renderHeroInfo(kestrel);
    expect(el.textContent).toContain('Kestrel');
    expect(el.textContent).toContain(kestrel.profile.role);
    expect(el.textContent).toContain(kestrel.profile.tagline);
    expect(el.querySelectorAll('.swatch').length).toBe(Object.keys(kestrel.palette).length);
  });

  it('không chèn HTML từ dữ liệu hero', () => {
    const el = renderHeroInfo({ ...kestrel, profile: { ...kestrel.profile, name: '<img src=x onerror=alert(1)>' } });
    expect(el.querySelector('img')).toBeNull();
  });
});
