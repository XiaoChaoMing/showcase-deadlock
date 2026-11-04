import type { ColorSpec } from '../game/character/definitions/HeroDefinition';
import type { RegistryEntry } from '../game/character/runtime/HeroRegistry';
import { el } from './dom';

export const colorOf = (spec: ColorSpec | undefined): string => (typeof spec === 'string' ? spec : spec?.color ?? '#888888');

/** Danh sách hero: thẻ hợp lệ chọn được; thẻ lỗi hiện từng lỗi `path: message` và không chọn được. */
export const renderHeroList = (
  entries: RegistryEntry[],
  selectedId: string | null,
  onSelect: (id: string) => void,
): HTMLElement => {
  const list = el('ul', { class: 'hero-list' });
  for (const entry of entries) {
    if (entry.ok) {
      const card = el(
        'li',
        { class: `hero-card${entry.id === selectedId ? ' selected' : ''}`, 'data-id': entry.id, tabindex: '0', role: 'button' },
        el('span', { class: 'hero-dot' }),
        el('span', { class: 'hero-card-text' }, el('strong', {}, entry.hero.profile.name), el('small', {}, entry.hero.profile.role)),
      );
      (card.firstChild as HTMLElement).style.background = colorOf(entry.hero.palette.accent);
      card.addEventListener('click', () => onSelect(entry.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(entry.id);
      });
      list.append(card);
    } else {
      list.append(
        el(
          'li',
          { class: 'hero-card error', 'data-id': entry.id, 'aria-disabled': 'true' },
          el('strong', {}, entry.id),
          el('small', {}, 'Lỗi dữ liệu'),
          el('ul', { class: 'hero-errors' }, ...entry.errors.map((e) => el('li', {}, el('code', {}, e.path), `: ${e.message}`))),
        ),
      );
    }
  }
  return list;
};
