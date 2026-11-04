import { validateHero, type HeroError } from '../definitions/validateHero';
import type { HeroDefinition } from '../definitions/HeroDefinition';

export type RegistryEntry =
  | { id: string; ok: true; hero: HeroDefinition }
  | { id: string; ok: false; errors: HeroError[] };

const FOLDER_PATTERN = /heroes\/([^/]+)\/hero\.json$/;

/** Nội dung file có thể là chuỗi thô (để lỗi cú pháp JSON không làm hỏng cả trang) hoặc object đã parse. */
const parseRaw = (raw: unknown): { ok: true; value: unknown } | { ok: false; message: string } => {
  if (typeof raw !== 'string') return { ok: true, value: raw };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, message: `JSON không hợp lệ: ${e instanceof Error ? e.message : String(e)}` };
  }
};

const loadEntry = (path: string, raw: unknown): RegistryEntry => {
  const folder = FOLDER_PATTERN.exec(path)?.[1] ?? path;
  const parsed = parseRaw(raw);
  if (!parsed.ok) return { id: folder, ok: false, errors: [{ path: '/', message: parsed.message }] };
  const result = validateHero(parsed.value);
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
