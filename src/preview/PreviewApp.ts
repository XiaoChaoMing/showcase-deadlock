import * as THREE from 'three';
import GUI from 'lil-gui';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { computeLayout } from '../game/character/definitions/CharacterLayout';
import { resolveProportions } from '../game/character/definitions/resolveProportions';
import { applyPreset, BODY_PRESETS, isBodyPresetName } from '../game/character/definitions/presets';
import { POSE_IDS, type HeroDefinition } from '../game/character/definitions/HeroDefinition';
import { buildProportionPreview } from '../game/character/debug/ProportionPreview';
import { buildCharacterModel } from '../game/character/modeling/CharacterModelBuilder';
import { buildSkeleton } from '../game/character/rigging/SkeletonBuilder';
import { createSockets } from '../game/character/rigging/Sockets';
import { createSkeletonDebug, type SkeletonDebug } from '../game/character/debug/SkeletonDebug';
import { setWeightView } from '../game/character/debug/WeightVisualizer';
import { buildCharacter, type CharacterInstance } from '../game/character/runtime/CharacterFactory';
import { PoseAnimator } from '../game/character/animation/ProceduralAnimator';
import { createRigDebugPanel } from '../game/character/debug/RigDebugPanel';
import { validateRig } from '../game/character/rigging/RigValidator';
import { downloadGlb, exportCharacterGlb } from '../game/character/export/CharacterExporter';
import { importCharacterGlb } from '../game/character/export/CharacterImporter';
import { compareSummaries, summarizeCharacter } from '../game/character/export/CharacterSummary';
import { resetToBindPose } from '../game/character/rigging/SkeletonBuilder';
import type { BoneName } from '../game/character/definitions/BoneNames';
import { loadHeroRegistry, type RegistryEntry } from '../game/character/runtime/HeroRegistry';
import { parsePreviewParams, type PreviewParams, type PreviewStage, type PreviewZoom } from './PreviewParams';
import { Viewport } from './Viewport';

declare global {
  interface Window {
    __heroReady?: boolean;
    __exportResult?: { bytes: number; diffs: string[] };
  }
}

const heroModules = import.meta.glob('/heroes/*/hero.json', { eager: true, query: '?raw', import: 'default' });

interface Figure {
  object: THREE.Object3D;
  skeletonDebug?: SkeletonDebug;
  instance?: CharacterInstance;
  animator?: PoseAnimator;
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

const buildModelFigure = (withEquipment: boolean): StageBuilder => (hero, params) => {
  const model = buildCharacterModel(hero);
  const group = new THREE.Group();
  const body = new THREE.Mesh(model.bodyGeometry, model.bodyMaterials);
  body.name = 'Body';
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  if (withEquipment) for (const e of model.equipment) group.add(e.object);
  const proportionFigure = buildProportionFigure(hero, params);
  return { object: group, height: hero.proportions.height, focus: proportionFigure.focus };
};

/** Thân trong suốt + bộ xương 20 bone và socket (M3). */
const buildSkeletonFigure: StageBuilder = (hero, params) => {
  const model = buildCharacterModel(hero);
  const group = new THREE.Group();
  const ghost = model.bodyMaterials.map((m) => {
    const clone = (m as THREE.MeshStandardMaterial).clone();
    clone.transparent = true;
    clone.opacity = 0.35;
    clone.depthWrite = false;
    return clone;
  });
  group.add(new THREE.Mesh(model.bodyGeometry, ghost));
  const rig = buildSkeleton(model.layout);
  const sockets = createSockets(hero.sockets, model.surface, model.layout, rig);
  for (const socket of sockets.values()) socket.add(new THREE.AxesHelper(0.08));
  group.add(rig.root);
  const skeletonDebug = createSkeletonDebug(rig);
  skeletonDebug.setVisible({ lines: true, joints: true, labels: params.overlay.has('labels'), axes: false });
  group.add(skeletonDebug.group);
  return { object: group, skeletonDebug, height: hero.proportions.height, focus: buildProportionFigure(hero, params).focus };
};

/** Nhân vật đã skin (M4): thân biến dạng theo xương, trang bị gắn bone. */
const buildRiggedFigure = (withEquipment: boolean): StageBuilder => (hero, params) => {
  const inst = buildCharacter(hero);
  const showWeights = params.overlay.has('weights');
  for (const e of inst.equipment) e.object.visible = withEquipment && !showWeights;
  if (showWeights) setWeightView(inst, params.bone ?? 'Chest');
  const animator = new PoseAnimator(inst.rig);
  animator.setBreathing(true);
  animator.setPose(params.pose, 0);
  animator.update(0);
  const group = new THREE.Group();
  group.add(inst.root);
  const skeletonDebug = createSkeletonDebug(inst.rig);
  group.add(skeletonDebug.group);
  const overlaySkeleton = params.overlay.has('skeleton');
  skeletonDebug.setVisible({ lines: overlaySkeleton, joints: overlaySkeleton, labels: params.overlay.has('labels'), axes: false });
  // Chiều cao khung hình theo tư thế thật (tay giơ cao, chân đá...), để camera không cắt mất.
  inst.root.updateMatrixWorld(true);
  const top = new THREE.Box3().setFromObject(inst.body).max.y;
  return { object: group, skeletonDebug, instance: inst, animator, height: Math.max(hero.proportions.height, top), focus: buildProportionFigure(hero, params).focus };
};

/** Các stage chưa làm sẽ được thêm ở milestone sau; tạm dùng stage gần nhất đã có. */
const STAGE_BUILDERS: Record<PreviewStage, StageBuilder> = {
  proportions: buildProportionFigure,
  body: buildModelFigure(false),
  skeleton: buildSkeletonFigure,
  skinned: buildRiggedFigure(false),
  full: buildRiggedFigure(true),
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
  private skeletonDebugs: SkeletonDebug[] = [];
  private animators: PoseAnimator[] = [];
  private gui!: GUI;
  private rigGui?: GUI;
  private readonly checksEl = document.createElement('div');
  private readonly debugVisibility = { lines: true, joints: true, labels: false, axes: false };

  constructor(container: HTMLElement) {
    this.viewport = new Viewport(container);
    this.viewport.scene.add(this.content);
    this.viewport.onFrame((dt) => {
      for (const a of this.animators) a.update(dt);
    });
    this.checksEl.style.cssText =
      'position:absolute;left:12px;bottom:12px;font:12px/1.5 system-ui;color:#e6e8eb;background:#0f1115cc;padding:8px 10px;border-radius:6px;pointer-events:none;max-width:420px';
    container.appendChild(this.checksEl);
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
    for (const d of this.skeletonDebugs) d.dispose();
    this.skeletonDebugs = [];
    this.animators = [];
    this.rigGui?.destroy();
    this.rigGui = undefined;
    this.checksEl.innerHTML = '';
    this.content.clear();
    this.debugVisibility.labels = this.params.overlay.has('labels');
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
      if (figure.skeletonDebug) {
        if (!figure.instance) figure.skeletonDebug.setVisible(this.debugVisibility);
        this.skeletonDebugs.push(figure.skeletonDebug);
      }
      if (figure.animator) this.animators.push(figure.animator);
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
    if (focusFigure?.instance && focusFigure.animator && items.length === 1) this.attachRigTools(focusFigure);
    requestAnimationFrame(() => requestAnimationFrame(() => (window.__heroReady = true)));
  }

  private attachRigTools(figure: Figure): void {
    const inst = figure.instance!;
    const animator = figure.animator!;
    const debug = figure.skeletonDebug!;
    const showChecks = (): void => {
      // Kiểm tra trên bản dựng mới ở bind pose, để tư thế đang xem không làm fail check "bind-pose".
      const fresh = buildCharacter(inst.hero);
      resetToBindPose(fresh.rig);
      const checks = validateRig(fresh);
      this.checksEl.innerHTML =
        '<b>Kiểm tra rig</b><br>' +
        checks.map((c) => `${c.pass ? '✓' : '✗'} ${c.label}${c.pass ? '' : ` — ${c.detail}`}`).join('<br>');
    };
    showChecks();
    this.rigGui = this.gui.addFolder('Kiểm tra rig');
    const exportState = { status: 'chưa xuất' };
    const exportFolder = this.rigGui.addFolder('Xuất GLB');
    exportFolder
      .add(
        {
          run: async () => {
            exportState.status = 'đang xuất…';
            const { buffer, summary } = await exportCharacterGlb(inst.hero);
            downloadGlb(inst.hero.id, buffer);
            const diffs = compareSummaries(summary, summarizeCharacter(await importCharacterGlb(buffer)));
            const kb = (buffer.byteLength / 1024).toFixed(0);
            exportState.status = diffs.length === 0 ? `✓ khớp hoàn toàn (${kb} KB)` : `✗ ${diffs.length} khác biệt`;
            console.info(`[export] ${inst.hero.id}.glb ${kb} KB`, diffs.length ? diffs : 'khớp hoàn toàn', summary);
            window.__exportResult = { bytes: buffer.byteLength, diffs };
          },
        },
        'run',
      )
      .name('Xuất GLB + kiểm tra');
    exportFolder.add(exportState, 'status').name('Kết quả').disable().listen();
    const overlay = this.params.overlay;
    createRigDebugPanel(
      this.rigGui,
      inst,
      animator,
      {
        onOverlay: (o) => {
          debug.setVisible({ lines: o.skeleton, joints: o.joints && o.skeleton, labels: o.labels, axes: false });
          setWeightView(inst, o.weights ? ((this.params.bone ?? 'Chest') as BoneName) : null);
          for (const e of inst.equipment) e.object.visible = !o.weights && this.params.stage === 'full';
        },
      },
      { skeleton: overlay.has('skeleton'), joints: overlay.has('skeleton'), labels: overlay.has('labels'), weights: overlay.has('weights') },
    );
  }

  private placeCamera(count: number, height: number, figure: Figure | undefined): void {
    const zoomTarget = this.params.zoom ? figure?.focus[this.params.zoom] : undefined;
    if (zoomTarget) {
      this.viewport.setView(this.params.view, zoomTarget, 0.9, 5);
      return;
    }
    const target = new THREE.Vector3(0, height / 2, 0);
    const fitHeight = 3.9 * Math.max(1, height / 1.8);
    const distance = count > 1 ? Math.max(this.lineupWidth * 1.2, fitHeight) : fitHeight;
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
    q.set('pose', p.pose);
    window.history.replaceState(null, '', `?${q.toString()}`);
  }

  private buildGui(): void {
    const gui = new GUI({ title: 'Preview' });
    this.gui = gui;
    const p = this.params;
    const state = {
      hero: p.hero ?? this.heroes()[0]?.id ?? '',
      preset: p.preset ?? 'none',
      stage: p.stage,
      view: p.view,
      lineup: p.lineup,
      pose: p.pose,
      wireframe: p.overlay.has('wireframe'),
    };
    const changed = (): void => {
      p.hero = state.hero;
      p.preset = state.preset === 'none' ? undefined : state.preset;
      p.stage = state.stage;
      p.view = state.view;
      p.lineup = state.lineup;
      p.pose = state.pose;
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
    gui.add(state, 'pose', [...POSE_IDS]).name('Tư thế ban đầu').onChange(changed);
    gui.add(state, 'wireframe').name('Wireframe').onChange(changed);
    const bones = gui.addFolder('Bộ xương (stage skeleton)');
    const apply = (): void => {
      for (const d of this.skeletonDebugs) d.setVisible(this.debugVisibility);
    };
    bones.add(this.debugVisibility, 'lines').name('Đường nối').onChange(apply);
    bones.add(this.debugVisibility, 'joints').name('Khớp').onChange(apply);
    bones.add(this.debugVisibility, 'labels').name('Tên bone').onChange(apply).listen();
    bones.add(this.debugVisibility, 'axes').name('Trục local').onChange(apply);
  }
}
