import { describe, expect, it } from 'vitest';
import { validateHero } from '../../src/game/character/definitions/validateHero';
import { kestrelJson } from '../fixtures/kestrel';

type Mutable = Record<string, any>;

describe('validateHero', () => {
  it('Kestrel hợp lệ', () => {
    const r = validateHero(kestrelJson);
    if (!r.ok) console.log(r.errors);
    expect(r.ok).toBe(true);
  });

  it.each<[string, (h: Mutable) => void]>([
    ['/proportions/height', (h) => { delete h.proportions.height; }],
    ['/palette/skin', (h) => { h.palette.skin = 'red'; }],
    ['/bodyShape/radialSegments', (h) => { h.bodyShape.radialSegments = 4; }],
    ['/equipment/0/color', (h) => { h.equipment[0].color = 'gold'; }],
    ['/equipment/5/attach/socket', (h) => { h.equipment[5].attach = { socket: 'nope' }; }],
    ['/equipment/1/id', (h) => { h.equipment[1].id = h.equipment[0].id; }],
    ['/equipment/0/bone', (h) => { h.equipment[0].bone = 'Tail'; }],
    ['/bodyShape/arm/sections', (h) => { h.bodyShape.arm.sections.reverse(); }],
    ['/proportions/height', (h) => { h.proportions.height = 1.7; }],
    ['/equipment/1/side', (h) => { delete h.equipment[1].side; }],
    ['/equipment/0/tEnd', (h) => { h.equipment[0].tEnd = 0.5; }],
    ['/bodyPaint/head', (h) => { h.bodyPaint.head = 'nothing'; }],
    ['/proportions/extra', (h) => { h.proportions.extra = 1; }],
  ])('báo lỗi tại %s', (path, mutate) => {
    const h = structuredClone(kestrelJson) as Mutable;
    mutate(h);
    const r = validateHero(h);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.path.startsWith(path)), JSON.stringify(r.errors)).toBe(true);
    expect(r.errors.every((e) => e.message.length > 10)).toBe(true);
  });

  it('thông báo tiếng Việt kèm giá trị cho phép', () => {
    const h = structuredClone(kestrelJson) as Mutable;
    h.bodyShape.radialSegments = 4;
    const r = validateHero(h);
    expect(!r.ok && r.errors[0]?.message).toContain('8');
    expect(!r.ok && r.errors[0]?.message).toContain('32');
    expect(!r.ok && r.errors[0]?.message).toContain('4');
  });

  it('màu sai chỉ báo một lỗi gộp', () => {
    const h = structuredClone(kestrelJson) as Mutable;
    h.palette.skin = 'red';
    const r = validateHero(h);
    expect(!r.ok && r.errors.filter((e) => e.path === '/palette/skin')).toHaveLength(1);
  });

  it('radialSegments phải là bội số của 8', () => {
    const h = structuredClone(kestrelJson) as Mutable;
    h.bodyShape.radialSegments = 12;
    const r = validateHero(h);
    expect(!r.ok && r.errors.some((e) => e.path === '/bodyShape/radialSegments' && e.message.includes('bội số của 8'))).toBe(true);
  });

  it('không phải object → lỗi tại gốc', () => {
    const r = validateHero(42);
    expect(r.ok).toBe(false);
  });
});
