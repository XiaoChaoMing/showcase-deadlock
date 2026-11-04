import * as THREE from 'three';
import GUI from 'lil-gui';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { computeLayout } from '../game/character/definitions/CharacterLayout';
import { resolveProportions } from '../game/character/definitions/resolveProportions';
import { applyPreset, BODY_PRESETS, isBodyPresetName } from '../game/character/definitions/presets';
import type { HeroDefinition } from '../game/character/definitions/HeroDefinition';
import { buildProportionPreview } from '../game/character/debug/ProportionPreview';
import { loadHeroRegistry, type RegistryEntry } from '../game/character/runtime/HeroRegistry';
import { parsePreviewParams, type PreviewParams, type PreviewStage, type PreviewZoom } from './PreviewParams';
import { Viewport } from './Viewport';

declare global {
  interface Window {
    __heroReady?: boolean;
  }
}

const heroModules = import.meta.glob('/heroes/*/hero.json', { eager: true, import: 'default' });

interface Figure {
  object: THREE.Object3D;
  height: number;
  focus: Partial<Record<PreviewZoom, THREE.Vector3>>;
}

type StageBuilder = (hero: HeroDefinition, params: PreviewParams) => Figure;

const buildProportionFigure: StageBuilder = (hero) => {
  const resolved = resolveProportions(hero.proportions);
  if (!resolved.ok) throw new Error(resolved.error);
  const layout = computeLayout(resolved.value);
  const J = layout.joints;
  return {
    object: buildProportionPreview(layout, resolved.value),
    height: hero.proportions.height,
    focus: {
      shoulderL: new THREE.Vector3(...J.LeftUpperArm),
      elbowL: new THREE.Vector3(...J.LeftLowerArm),
      hipL: new THREE.Vector3(...J.LeftUpperLeg),
      kneeL: new THREE.Vector3(...J.LeftLowerLeg),
      head: new THREE.Vector3(J.Head[0], J.Head[1] + resolved.value.head.height / 2, 0),
    },
  };
};

/** Các stage chưa làm sẽ được thêm ở milestone sau; tạm dùng hình nhân tỷ lệ. */
const STAGE_BUILDERS: Record<PreviewStage, StageBuilder> = {
  proportions: buildProportionFigure,
  body: buildProportionFigure,
  skeleton: buildProportionFigure,
  skinned: buildProportionFigure,
  full: buildProportionFigure,
};

const makeLabel = (text: string): CSS2DObject => {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = 'color:#e6e8eb;font:600 12px system-ui;background:#0f1115cc;padding:2px 6px;border-radius:4px';
  const label = new CSS2DObject(el);
  label.position.set(0, -0.08, 0);
  return label;
};

const setWireframe = (root: THREE.Object3D, on: boolean): void => {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe = on;
      }
    }
  });
};

export class PreviewApp {
  private readonly viewport: Viewport;
  private readonly entries: RegistryEntry[];
  private readonly params: PreviewParams;
  private readonly content = new THREE.Group();
  private lineupWidth = 0;

  constructor(container: HTMLElement) {
    this.viewport = new Viewport(container);
    this.viewport.scene.add(this.content);
    this.entries = loadHeroRegistry(heroModules);
    this.params = parsePreviewParams(window.location.search);
    for (const e of this.entries) if (!e.ok) console.error(`Hero "${e.id}" lỗi dữ liệu:`, e.errors);
    this.buildGui();
    this.rebuild();
  }

  private heroes(): HeroDefinition[] {
    return this.entries.flatMap((e) => (e.ok ? [e.hero] : []));
  }

  private selectedHero(): HeroDefinition | undefined {
    const all = this.heroes();
    const hero = all.find((h) => h.id === this.params.hero) ?? all[0];
    if (!hero) return undefined;
    return isBodyPresetName(this.params.preset) ? applyPreset(hero, BODY_PRESETS[this.params.preset]) : hero;
  }

  private lineupHeroes(): Array<{ label: string; hero: HeroDefinition }> {
    const base = this.selectedHero();
    if (this.params.lineup === 'heroes') return this.heroes().map((h) => ({ label: h.profile.name, hero: h }));
    if (this.params.lineup === 'presets' && base) {
      return Object.entries(BODY_PRESETS).map(([name, preset]) => ({ label: name, hero: applyPreset(base, preset) }));
    }
    return base ? [{ label: base.profile.name, hero: base }] : [];
  }

  private rebuild(): void {
    window.__heroReady = false;
    this.content.clear();
    const builder = STAGE_BUILDERS[this.params.stage];
    const items = this.lineupHeroes();
    let maxHeight = 1.8;
    let focusFigure: Figure | undefined;
    const figures = items.map(({ label, hero }) => {
      const figure = builder(hero, this.params);
      if (items.length > 1) figure.object.add(makeLabel(label));
      setWireframe(figure.object, this.params.overlay.has('wireframe'));
      maxHeight = Math.max(maxHeight, figure.height);
      focusFigure ??= figure;
      return figure;
    });
    const widths = figures.map((f) => new THREE.Box3().setFromObject(f.object).getSize(new THREE.Vector3()).x + 0.15);
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    let cursor = -totalWidth / 2;
    figures.forEach((figure, i) => {
      const width = widths[i] ?? 0;
      figure.object.position.x = cursor + width / 2;
      cursor += width;
      this.content.add(figure.object);
    });
    this.lineupWidth = totalWidth;
    this.placeCamera(items.length, maxHeight, focusFigure);
    requestAnimationFrame(() => requestAnimationFrame(() => (window.__heroReady = true)));
  }

  private placeCamera(count: number, height: number, figure: Figure | undefined): void {
    const zoomTarget = this.params.zoom ? figure?.focus[this.params.zoom] : undefined;
    if (zoomTarget) {
      this.viewport.setView(this.params.view, zoomTarget, 0.9, 5);
      return;
    }
    const target = new THREE.Vector3(0, height / 2, 0);
    const distance = count > 1 ? this.lineupWidth * 1.0 : 3.9;
    this.viewport.setView(this.params.view, target, distance);
  }

  private updateUrl(): void {
    const q = new URLSearchParams();
    const p = this.params;
    if (p.hero) q.set('hero', p.hero);
    if (p.preset) q.set('preset', p.preset);
    q.set('stage', p.stage);
    q.set('view', p.view);
    if (p.overlay.size) q.set('overlay', [...p.overlay].join(','));
    if (p.lineup !== 'none') q.set('lineup', p.lineup);
    window.history.replaceState(null, '', `?${q.toString()}`);
  }

  private buildGui(): void {
    const gui = new GUI({ title: 'Preview' });
    const p = this.params;
    const state = {
      hero: p.hero ?? this.heroes()[0]?.id ?? '',
      preset: p.preset ?? 'none',
      stage: p.stage,
      view: p.view,
      lineup: p.lineup,
      wireframe: p.overlay.has('wireframe'),
    };
    const changed = (): void => {
      p.hero = state.hero;
      p.preset = state.preset === 'none' ? undefined : state.preset;
      p.stage = state.stage;
      p.view = state.view;
      p.lineup = state.lineup;
      if (state.wireframe) p.overlay.add('wireframe');
      else p.overlay.delete('wireframe');
      this.updateUrl();
      this.rebuild();
    };
    gui.add(state, 'hero', this.heroes().map((h) => h.id)).name('Hero').onChange(changed);
    gui.add(state, 'preset', ['none', ...Object.keys(BODY_PRESETS)]).name('Preset dáng').onChange(changed);
    gui.add(state, 'stage', ['proportions', 'body', 'skeleton', 'skinned', 'full']).name('Giai đoạn').onChange(changed);
    gui.add(state, 'view', ['front', 'side', 'back', 'threeQuarter']).name('Góc nhìn').onChange(changed);
    gui.add(state, 'lineup', ['none', 'presets', 'heroes']).name('Xếp hàng').onChange(changed);
    gui.add(state, 'wireframe').name('Wireframe').onChange(changed);
  }
}
