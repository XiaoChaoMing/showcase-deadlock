import Ajv, { type ErrorObject } from 'ajv';
import schema from '../../../../templates/hero.schema.json';
import { resolveProportions } from './resolveProportions';
import { resolveBodyDesign } from '../body/config/resolveBodyDesign';
import type { BodyDesignConfig } from '../body/config/BodyDesign';
import { SIDED_PARTS, type HeroDefinition, type Section, type SurfaceMount } from './HeroDefinition';

export interface HeroError {
  path: string;
  message: string;
}

export type HeroValidationResult = { ok: true; hero: HeroDefinition } | { ok: false; errors: HeroError[] };

const ajv = new Ajv({ allErrors: true, verbose: true, discriminator: true, strict: false });
const validateSchema = ajv.compile(schema);

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`;
  if (value === undefined) return 'không có';
  const json = JSON.stringify(value);
  return json.length > 40 ? `${json.slice(0, 37)}...` : json;
};

const TYPE_NAMES: Record<string, string> = {
  number: 'số',
  integer: 'số nguyên',
  string: 'chuỗi ký tự',
  object: 'object { ... }',
  array: 'mảng [ ... ]',
  boolean: 'true/false',
};

type SchemaLike = Record<string, unknown>;

const rangeMessage = (parent: SchemaLike, data: unknown): string => {
  const kind = parent.type === 'integer' ? 'số nguyên' : 'số';
  return `phải là ${kind} từ ${String(parent.minimum)} đến ${String(parent.maximum)} (đang là ${formatValue(data)})`;
};

const translate = (e: ErrorObject): HeroError => {
  const parent = (e.parentSchema ?? {}) as SchemaLike;
  const params = e.params as Record<string, unknown>;
  switch (e.keyword) {
    case 'required':
      return { path: `${e.instancePath}/${String(params.missingProperty)}`, message: `thiếu trường bắt buộc "${String(params.missingProperty)}"` };
    case 'additionalProperties':
      return {
        path: `${e.instancePath}/${String(params.additionalProperty)}`,
        message: `trường "${String(params.additionalProperty)}" không được phép ở đây (có thể gõ sai tên?)`,
      };
    case 'type':
      return { path: e.instancePath, message: `phải là ${TYPE_NAMES[String(params.type)] ?? String(params.type)} (đang là ${formatValue(e.data)})` };
    case 'minimum':
    case 'maximum':
      return { path: e.instancePath, message: rangeMessage(parent, e.data) };
    case 'pattern':
      if (parent.pattern === HEX_COLOR.source) {
        return { path: e.instancePath, message: `phải là mã màu dạng #RRGGBB (đang là ${formatValue(e.data)})` };
      }
      return {
        path: e.instancePath,
        message:
          typeof parent.description === 'string'
            ? `không đúng định dạng — ${parent.description} (đang là ${formatValue(e.data)})`
            : `không đúng định dạng ${String(params.pattern)} (đang là ${formatValue(e.data)})`,
      };
    case 'enum':
      return { path: e.instancePath, message: `phải là một trong: ${(params.allowedValues as unknown[]).join(', ')} (đang là ${formatValue(e.data)})` };
    case 'const':
      return { path: e.instancePath, message: `phải bằng ${formatValue(params.allowedValue)} (đang là ${formatValue(e.data)})` };
    case 'multipleOf':
      return {
        path: e.instancePath,
        message: `phải là bội số của ${String(params.multipleOf)}, trong khoảng ${String(parent.minimum)}–${String(parent.maximum)} (đang là ${formatValue(e.data)})`,
      };
    case 'minItems':
    case 'maxItems':
      return {
        path: e.instancePath,
        message: `phải có từ ${String(parent.minItems ?? 0)} đến ${String(parent.maxItems ?? '∞')} phần tử (đang có ${Array.isArray(e.data) ? e.data.length : 0})`,
      };
    case 'minLength':
    case 'maxLength':
      return { path: e.instancePath, message: `độ dài phải từ ${String(parent.minLength ?? 0)} đến ${String(parent.maxLength ?? '∞')} ký tự` };
    case 'minProperties':
    case 'maxProperties':
      return { path: e.instancePath, message: 'phải chọn đúng một trong hai trường "socket" hoặc "mount"' };
    case 'discriminator':
      return { path: `${e.instancePath}/kind`, message: '"kind" phải là một trong: plate, band, shell, box, assembly' };
    case 'propertyNames':
      return { path: e.instancePath, message: `tên vai trò màu "${String(params.propertyName)}" không hợp lệ (chữ thường đầu tiên, không dấu cách)` };
    case 'oneOf':
      return { path: e.instancePath, message: `giá trị không hợp lệ: ${String(parent.description ?? 'không khớp kiểu nào cho phép')}` };
    default:
      return { path: e.instancePath, message: `không hợp lệ (${e.keyword}: ${e.message ?? ''})` };
  }
};

/** Một oneOf thất bại: bỏ các lỗi nhánh cùng vị trí, chỉ giữ thông báo gộp. Lỗi sâu hơn vẫn giữ. */
const collapseOneOf = (errors: ErrorObject[]): ErrorObject[] => {
  const oneOfPaths = new Set(errors.filter((e) => e.keyword === 'oneOf').map((e) => e.instancePath));
  return errors.filter((e) => e.keyword === 'oneOf' || !oneOfPaths.has(e.instancePath));
};

const dedupe = (errors: HeroError[]): HeroError[] => {
  const seen = new Set<string>();
  return errors.filter((e) => {
    const key = `${e.path}|${e.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const checkSections = (sections: Section[], path: string, errors: HeroError[]): void => {
  const first = sections[0];
  const last = sections[sections.length - 1];
  const increasing = sections.every((s, i) => i === 0 || s.t > (sections[i - 1]?.t ?? Infinity));
  if (!increasing || first?.t !== 0 || last?.t !== 1) {
    errors.push({ path, message: 'các tiết diện phải có t tăng dần, phần tử đầu t = 0 và phần tử cuối t = 1' });
  }
};

const checkSide = (part: string, side: string | undefined, path: string, errors: HeroError[]): void => {
  const sided = SIDED_PARTS.includes(part as never);
  if (sided && !side) errors.push({ path: `${path}/side`, message: `bộ phận "${part}" cần khai báo "side": "left" hoặc "right"` });
  if (!sided && side) errors.push({ path: `${path}/side`, message: `bộ phận "${part}" không có bên trái/phải, hãy bỏ "side"` });
};

const checkMount = (mount: SurfaceMount, path: string, errors: HeroError[]): void => checkSide(mount.part, mount.side, path, errors);

const semanticErrors = (hero: HeroDefinition): HeroError[] => {
  const errors: HeroError[] = [];
  const resolved = resolveProportions(hero.proportions);
  if (!resolved.ok) errors.push({ path: '/proportions/height', message: resolved.error });

  for (const key of ['torso', 'head', 'arm', 'leg'] as const) {
    checkSections(hero.bodyShape[key].sections, `/bodyShape/${key}/sections`, errors);
  }

  const checkColor = (ref: string | undefined, path: string): void => {
    if (ref === undefined || HEX_COLOR.test(ref) || ref in hero.palette) return;
    errors.push({ path, message: `màu "${ref}" không có trong palette (đang có: ${Object.keys(hero.palette).join(', ')}) và không phải mã #RRGGBB` });
  };
  for (const [part, ref] of Object.entries(hero.bodyPaint)) checkColor(ref, `/bodyPaint/${part}`);

  const socketNames = new Set<string>();
  hero.sockets.forEach((s, i) => {
    if (socketNames.has(s.name)) errors.push({ path: `/sockets/${i}/name`, message: `tên socket "${s.name}" bị trùng` });
    socketNames.add(s.name);
    checkMount(s.mount, `/sockets/${i}/mount`, errors);
  });

  const ids = new Set<string>();
  hero.equipment.forEach((item, i) => {
    const base = `/equipment/${i}`;
    if (ids.has(item.id)) errors.push({ path: `${base}/id`, message: `mã trang bị "${item.id}" bị trùng` });
    ids.add(item.id);
    checkColor(item.color, `${base}/color`);
    checkColor(item.edgeColor, `${base}/edgeColor`);
    if (item.kind === 'plate' || item.kind === 'band') {
      checkSide(item.part, item.side, base, errors);
      if (item.angleEndDeg <= item.angleStartDeg) {
        errors.push({ path: `${base}/angleEndDeg`, message: 'angleEndDeg phải lớn hơn angleStartDeg' });
      }
    }
    if (item.kind === 'plate' && item.tEnd <= item.tStart) {
      errors.push({ path: `${base}/tEnd`, message: `tEnd (${item.tEnd}) phải lớn hơn tStart (${item.tStart})` });
    }
    if (item.kind === 'box' || item.kind === 'assembly') {
      const attach = item.attach;
      if ('socket' in attach && !socketNames.has(attach.socket)) {
        errors.push({ path: `${base}/attach/socket`, message: `socket "${attach.socket}" chưa được khai báo trong "sockets"` });
      }
      if ('mount' in attach) checkMount(attach.mount, `${base}/attach/mount`, errors);
    }
    if (item.kind === 'assembly') item.parts.forEach((p, j) => checkColor(p.color, `${base}/parts/${j}/color`));
  });
  return errors;
};

const BODY_SOURCE_KEYS = new Set(['proportions', 'bodyShape', 'bodyDesign']);

/** Thân phải đến từ đúng một nguồn: bodyDesign, hoặc cặp proportions + bodyShape. Trả một lỗi gọn thay cho lỗi oneOf của schema. */
const bodySourceErrors = (raw: unknown): HeroError[] => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const has = (k: string): boolean => Object.hasOwn(raw, k);
  if (has('bodyDesign') && (has('proportions') || has('bodyShape'))) {
    return [{ path: '/bodyDesign', message: 'không dùng cùng lúc bodyDesign với proportions/bodyShape — chọn một (khuyên dùng bodyDesign)' }];
  }
  if (!has('bodyDesign') && !has('proportions') && !has('bodyShape')) {
    return [{ path: '/', message: 'thiếu bodyDesign (hoặc proportions + bodyShape theo kiểu cũ)' }];
  }
  for (const k of ['proportions', 'bodyShape']) {
    if (!has('bodyDesign') && !has(k)) return [{ path: `/${k}`, message: `thiếu trường bắt buộc "${k}" (thân kiểu cũ cần cả proportions và bodyShape)` }];
  }
  return [];
};

/** Lỗi gốc của nhánh oneOf "nguồn thân" đã được bodySourceErrors thay thế. */
const isBodySourceNoise = (e: ErrorObject): boolean =>
  e.instancePath === '' &&
  (e.keyword === 'oneOf' || e.keyword === 'not' || e.keyword === 'anyOf' ||
    (e.keyword === 'required' && BODY_SOURCE_KEYS.has(String((e.params as { missingProperty?: unknown }).missingProperty))));

const bodyFrom = (design: BodyDesignConfig): Pick<HeroDefinition, 'proportions' | 'bodyShape'> => {
  const { proportions, bodyShape } = resolveBodyDesign(design);
  return { proportions, bodyShape };
};

export const validateHero = (raw: unknown): HeroValidationResult => {
  const sourceErrors = bodySourceErrors(raw);
  if (!validateSchema(raw)) {
    const errors = collapseOneOf((validateSchema.errors ?? []).filter((e) => !isBodySourceNoise(e))).map(translate);
    return { ok: false, errors: dedupe([...sourceErrors, ...errors]) };
  }
  if (sourceErrors.length > 0) return { ok: false, errors: sourceErrors };
  const source = raw as unknown as HeroDefinition & { bodyDesign?: BodyDesignConfig };
  const hero: HeroDefinition = source.bodyDesign ? { ...source, ...bodyFrom(source.bodyDesign) } : source;
  const errors = semanticErrors(hero);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, hero };
};
