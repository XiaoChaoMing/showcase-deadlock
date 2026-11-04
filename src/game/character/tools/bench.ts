import * as THREE from 'three';
import type { HeroDefinition } from '../definitions/HeroDefinition';
import { buildCharacter } from '../runtime/CharacterFactory';
import { computeLayout } from '../definitions/CharacterLayout';
import { resolveProportions } from '../definitions/resolveProportions';
import { createBodySurface } from '../modeling/BodySurface';
import { buildBodyGeometry } from '../modeling/BodyGeometry';
import { generateSkinWeights } from '../rigging/SkinWeightGenerator';
import { resolveBodyDesign } from '../body/config/resolveBodyDesign';
import { createAnatomyField } from '../body/anatomy/anatomyField';

export interface BenchRow {
  id: string;
  triangles: number;
  drawCalls: number;
  uniqueMaterials: number;
  firstBuildMs: number;
  medianRebuildMs: number;
  bodyTriangles: number;
  bodyVertices: number;
  /** Riêng phần thân: lưới liền khối + skin weight (trung vị). */
  bodyBuildMs: number;
}

/** Ngân sách khởi đầu của spec mục 10.2 (mục tiêu benchmark, không phải giới hạn cứng). */
export const BUDGET = { triangles: 45_000, drawCalls: 100, uniqueMaterials: 16, buildMs: 300, cachedRebuildMs: 100 } as const;

export interface SceneStats {
  triangles: number;
  drawCalls: number;
  uniqueMaterials: number;
}

/** Đếm tam giác, draw call (mỗi group của mesh là một lần vẽ) và số vật liệu khác nhau trong cây. */
export const sceneStats = (root: THREE.Object3D): SceneStats => {
  let triangles = 0;
  let drawCalls = 0;
  const materials = new Set<string>();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const g = o.geometry as THREE.BufferGeometry;
    triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
    drawCalls += Math.max(1, g.groups.length);
    for (const m of [o.material].flat() as THREE.Material[]) materials.add(m.uuid);
  });
  return { triangles: Math.round(triangles), drawCalls, uniqueMaterials: materials.size };
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : 0;
};

const disposeTree = (root: THREE.Object3D): void => {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      for (const m of [o.material].flat() as THREE.Material[]) m.dispose();
    }
  });
};

const timeBody = (hero: HeroDefinition): number => {
  const t0 = performance.now();
  const r = resolveProportions(hero.proportions);
  if (!r.ok) throw new Error(r.error);
  const layout = computeLayout(r.value);
  const field = hero.bodyDesign ? createAnatomyField(resolveBodyDesign(hero.bodyDesign).anatomy) : undefined;
  const geometry = buildBodyGeometry(createBodySurface(r.value, hero.bodyShape, layout, field), hero.bodyShape);
  generateSkinWeights(geometry, layout);
  const ms = performance.now() - t0;
  geometry.dispose();
  return ms;
};

/** Dựng mỗi hero `runs` lần; lần đầu tính là "first build", các lần sau là "rebuild". */
export const runBench = (heroes: HeroDefinition[], runs = 5): BenchRow[] =>
  heroes.map((hero) => {
    const times: number[] = [];
    let stats: SceneStats = { triangles: 0, drawCalls: 0, uniqueMaterials: 0 };
    let body = { triangles: 0, vertices: 0 };
    for (let i = 0; i < runs; i++) {
      const t0 = performance.now();
      const instance = buildCharacter(hero);
      times.push(performance.now() - t0);
      if (i === 0) {
        stats = sceneStats(instance.root);
        const g = instance.body.geometry;
        body = { triangles: Math.round((g.index ? g.index.count : g.getAttribute('position').count) / 3), vertices: g.getAttribute('position').count };
      }
      disposeTree(instance.root);
    }
    return {
      id: hero.id,
      ...stats,
      firstBuildMs: Math.round(times[0] ?? 0),
      medianRebuildMs: Math.round(median(times.slice(1))),
      bodyTriangles: body.triangles,
      bodyVertices: body.vertices,
      bodyBuildMs: Math.round(median(Array.from({ length: runs }, () => timeBody(hero)))),
    };
  });

const flag = (value: number, limit: number): string => (value > limit ? `**${value}** ⚠` : String(value));

export const benchMarkdown = (rows: BenchRow[]): string =>
  [
    `| Hero | Tam giác (≤ ${BUDGET.triangles}) | Draw call (≤ ${BUDGET.drawCalls}) | Vật liệu (≤ ${BUDGET.uniqueMaterials}) | Dựng lần đầu ms (≤ ${BUDGET.buildMs}) | Dựng lại ms, trung vị | Thân: tam giác | Thân: đỉnh | Thân: ms |`,
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${r.id} | ${flag(r.triangles, BUDGET.triangles)} | ${flag(r.drawCalls, BUDGET.drawCalls)} | ${flag(r.uniqueMaterials, BUDGET.uniqueMaterials)} | ${flag(r.firstBuildMs, BUDGET.buildMs)} | ${r.medianRebuildMs} | ${r.bodyTriangles} | ${r.bodyVertices} | ${r.bodyBuildMs} |`,
    ),
  ].join('\n');
