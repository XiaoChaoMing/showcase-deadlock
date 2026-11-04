import { validateHero, type HeroError } from '../definitions/validateHero';
import type { HeroDefinition } from '../definitions/HeroDefinition';

export type RegistryEntry =
  | { id: string; ok: true; hero: HeroDefinition }
  | { id: string; ok: false; errors: HeroError[] };

const FOLDER_PATTERN = /heroes\/([^/]+)\/hero\.json$/;

const loadEntry = (path: string, raw: unknown): RegistryEntry => {
  const folder = FOLDER_PATTERN.exec(path)?.[1] ?? path;
  const result = validateHero(raw);
  if (!result.ok) return { id: folder, ok: false, errors: result.errors };
  if (result.hero.id !== folder) {
    return { id: folder, ok: false, errors: [{ path: '/id', message: `id "${result.hero.id}" phải trùng tên thư mục "${folder}"` }] };
  }
  return { id: folder, ok: true, hero: result.hero };
};

export const loadHeroRegistry = (modules: Record<string, unknown>): RegistryEntry[] =>
  Object.entries(modules)
    .map(([path, raw]) => loadEntry(path, raw))
    .sort((a, b) => a.id.localeCompare(b.id));
