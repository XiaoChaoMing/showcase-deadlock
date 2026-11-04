import type { HeroDefinition } from '../game/character/definitions/HeroDefinition';
import { colorOf } from './HeroList';
import { el } from './dom';

export const renderHeroInfo = (hero: HeroDefinition): HTMLElement => {
  const swatches = Object.entries(hero.palette).map(([role, spec]) => {
    const s = el('span', { class: 'swatch', title: role });
    s.style.background = colorOf(spec);
    return s;
  });
  return el(
    'section',
    { class: 'hero-info' },
    el('p', { class: 'hero-role' }, hero.profile.role),
    el('h1', {}, hero.profile.name),
    el('p', { class: 'hero-tagline' }, hero.profile.tagline),
    el('p', { class: 'hero-description' }, hero.profile.description),
    el('div', { class: 'swatches' }, ...swatches),
  );
};
