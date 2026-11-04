import * as THREE from 'three';
import GUI from 'lil-gui';
import './styles.css';
import { PoseAnimator } from '../game/character/animation/ProceduralAnimator';
import { createRigDebugPanel } from '../game/character/debug/RigDebugPanel';
import { createSkeletonDebug, type SkeletonDebug } from '../game/character/debug/SkeletonDebug';
import { setWeightView } from '../game/character/debug/WeightVisualizer';
import type { BoneName } from '../game/character/definitions/BoneNames';
import type { HeroDefinition, PoseId } from '../game/character/definitions/HeroDefinition';
import { downloadGlb, exportCharacterGlb } from '../game/character/export/CharacterExporter';
import { importCharacterGlb } from '../game/character/export/CharacterImporter';
import { compareSummaries, summarizeCharacter } from '../game/character/export/CharacterSummary';
import { validateRig } from '../game/character/rigging/RigValidator';
import { resetToBindPose } from '../game/character/rigging/SkeletonBuilder';
import { buildCharacter, type CharacterInstance } from '../game/character/runtime/CharacterFactory';
import { loadHeroRegistry, type RegistryEntry } from '../game/character/runtime/HeroRegistry';
import { parsePreviewParams } from '../preview/PreviewParams';
import { Viewport } from '../preview/Viewport';
import { renderControls, type ControlsState, type ToggleKey } from './ControlsPanel';
import { el } from './dom';
import { renderExportPanel } from './ExportPanel';
import { renderHeroInfo } from './HeroInfoCard';
import { colorOf, renderHeroList } from './HeroList';
import { renderRigChecks } from './RigChecksView';

const heroModules = import.meta.glob('/heroes/*/hero.json', { eager: true, query: '?raw', import: 'default' });
const DEG = Math.PI / 180;

interface Current {
  hero: HeroDefinition;
  instance: CharacterInstance;
  animator: PoseAnimator;
  skeleton: SkeletonDebug;
  gui: GUI;
}

/** Giải phóng geometry và vật liệu của một nhân vật khi đổi hero. */
const disposeObject = (root: THREE.Object3D): void => {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      for (const m of [o.material].flat()) m.dispose();
    }
  });
};

export class ShowcaseApp {
  private readonly entries: RegistryEntry[];
  private readonly viewport: Viewport;
  private readonly listSlot = el('div', { class: 'list-slot' });
  private readonly sideSlot = el('div', { class: 'side-slot' });
  private readonly guiSlot = el('div', { class: 'gui-slot' });
  private current?: Current;
  private controls: ControlsState = { pose: 'idle', skeleton: false, wireframe: false, weights: false, weightBone: 'Chest', equipment: true };

  constructor(container: HTMLElement) {
    this.entries = loadHeroRegistry(heroModules);
    const stage = el('main', { class: 'stage' });
    container.replaceChildren(
      el(
        'div',
        { class: 'showcase' },
        el('aside', { class: 'panel left' }, el('header', { class: 'brand' }, el('span', {}, 'HERO'), ' SHOWCASE'), this.listSlot),
        stage,
        el('aside', { class: 'panel right' }, this.sideSlot),
      ),
    );
    this.viewport = new Viewport(stage);
    stage.append(this.guiSlot);
    this.viewport.onFrame((dt) => this.current?.animator.update(dt));

    const params = parsePreviewParams(window.location.search);
    const q = new URLSearchParams(window.location.search);
    this.controls = {
      ...this.controls,
      skeleton: params.overlay.has('skeleton'),
      wireframe: params.overlay.has('wireframe'),
      weights: params.overlay.has('weights'),
      weightBone: params.bone ?? 'Chest',
    };
    const first = this.entries.find((e) => e.ok && e.id === params.hero) ?? this.entries.find((e) => e.ok);
    if (first?.ok) this.select(first.id, q.has('pose') ? params.pose : undefined, q.has('view') ? params.view : undefined);
    else this.renderList(null);
  }

  private renderList(selectedId: string | null): void {
    this.listSlot.replaceChildren(renderHeroList(this.entries, selectedId, (id) => this.select(id)));
  }

  private select(id: string, pose?: PoseId, view?: Parameters<Viewport['setView']>[0]): void {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry?.ok) return;
    window.__heroReady = false;
    this.teardown();
    const hero = entry.hero;
    const instance = buildCharacter(hero);
    const animator = new PoseAnimator(instance.rig);
    animator.setBreathing(true);
    this.controls.pose = pose ?? hero.showcase.defaultPose;
    animator.setPose(this.controls.pose, 0);
    animator.update(0);
    const skeleton = createSkeletonDebug(instance.rig);
    this.viewport.scene.add(instance.root, skeleton.group);

    const gui = new GUI({ container: this.guiSlot, title: 'Chỉnh bone' });
    createRigDebugPanel(gui, instance, animator, { onOverlay: () => undefined }, undefined, { poses: false, display: false });
    gui.close();
    this.current = { hero, instance, animator, skeleton, gui };

    document.documentElement.style.setProperty('--accent', colorOf(hero.palette.accent));
    const target = new THREE.Vector3(0, hero.proportions.height * 0.52, 0);
    if (view) this.viewport.setView(view, target, hero.showcase.cameraDistance);
    else this.viewport.setOrbit(hero.showcase.cameraAzimuthDeg * DEG, hero.showcase.cameraElevationDeg * DEG, target, hero.showcase.cameraDistance);

    this.applyDisplay();
    this.renderList(id);
    this.renderSide();
    const url = new URL(window.location.href);
    url.searchParams.set('hero', id);
    window.history.replaceState(null, '', url);
    requestAnimationFrame(() => requestAnimationFrame(() => (window.__heroReady = true)));
  }

  private teardown(): void {
    if (!this.current) return;
    const { instance, skeleton, gui } = this.current;
    skeleton.dispose();
    this.viewport.scene.remove(instance.root, skeleton.group);
    disposeObject(instance.root);
    gui.destroy();
    this.current = undefined;
  }

  private applyDisplay(): void {
    const cur = this.current;
    if (!cur) return;
    const c = this.controls;
    setWeightView(cur.instance, c.weights ? c.weightBone : null);
    for (const e of cur.instance.equipment) e.object.visible = c.equipment && !c.weights;
    cur.skeleton.setVisible({ lines: c.skeleton, joints: c.skeleton, labels: false, axes: false });
    cur.instance.root.traverse((o) => {
      if (o instanceof THREE.Mesh) for (const m of [o.material].flat()) (m as THREE.MeshStandardMaterial).wireframe = c.wireframe;
    });
  }

  private renderSide(): void {
    const cur = this.current;
    if (!cur) return;
    // Kiểm tra trên bản dựng mới ở bind pose, để tư thế đang xem không làm fail mục "bind-pose".
    const fresh = buildCharacter(cur.hero);
    resetToBindPose(fresh.rig);
    const checks = validateRig(fresh);
    disposeObject(fresh.root);

    this.sideSlot.replaceChildren(
      renderHeroInfo(cur.hero),
      renderControls(this.controls, {
        onPose: (id) => {
          this.controls.pose = id;
          cur.animator.setPose(id);
        },
        onToggle: (key: ToggleKey, value) => {
          this.controls[key] = value;
          this.applyDisplay();
        },
        onWeightBone: (bone: BoneName) => {
          this.controls.weightBone = bone;
          this.applyDisplay();
        },
      }),
      renderRigChecks(checks),
      renderExportPanel(async () => {
        const { buffer, summary } = await exportCharacterGlb(cur.hero);
        downloadGlb(cur.hero.id, buffer);
        const diffs = compareSummaries(summary, summarizeCharacter(await importCharacterGlb(buffer)));
        window.__exportResult = { bytes: buffer.byteLength, diffs };
        return { fileName: `${cur.hero.id}.glb`, bytes: buffer.byteLength, diffs };
      }),
    );
  }
}
