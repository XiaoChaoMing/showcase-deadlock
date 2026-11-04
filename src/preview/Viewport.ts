import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export type ViewName = 'front' | 'side' | 'back' | 'threeQuarter';

const VIEW_AZIMUTH_DEG: Record<ViewName, number> = {
  front: 0,
  side: 90,
  back: 180,
  threeQuarter: 35,
};

export class Viewport {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly renderer: THREE.WebGLRenderer;
  readonly labelRenderer: CSS2DRenderer;
  private readonly frameCallbacks: Array<(dt: number) => void> = [];
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private disposed = false;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    container.style.position = 'relative';
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    this.scene.background = new THREE.Color('#14171c');
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
    this.camera.position.set(1.6, 1.4, 2.8);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.95, 0);
    this.controls.enableDamping = true;
    this.controls.update();

    this.addLights();
    this.addFloor();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  setView(view: ViewName, target: THREE.Vector3, distance: number, elevationDeg = 8): void {
    const azimuth = THREE.MathUtils.degToRad(VIEW_AZIMUTH_DEG[view]);
    this.setOrbit(azimuth, THREE.MathUtils.degToRad(elevationDeg), target, distance);
  }

  setOrbit(azimuthRad: number, elevationRad: number, target: THREE.Vector3, distance: number): void {
    const horizontal = Math.cos(elevationRad) * distance;
    this.camera.position.set(
      target.x + Math.sin(azimuthRad) * horizontal,
      target.y + Math.sin(elevationRad) * distance,
      target.z + Math.cos(azimuthRad) * horizontal,
    );
    this.controls.target.copy(target);
    this.controls.update();
  }

  onFrame(cb: (dt: number) => void): void {
    this.frameCallbacks.push(cb);
  }

  renderOnce(): void {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    this.container.removeChild(this.labelRenderer.domElement);
  }

  private tick(): void {
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 0.1);
    for (const cb of this.frameCallbacks) cb(dt);
    this.controls.update();
    this.renderOnce();
  }

  private resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.labelRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight('#c9d4e6', '#1a1d22', 0.9));
    const key = new THREE.DirectionalLight('#fff3e0', 2.2);
    key.position.set(2.5, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -1.5;
    key.shadow.camera.right = 1.5;
    key.shadow.camera.top = 2.5;
    key.shadow.camera.bottom = -0.5;
    const fill = new THREE.DirectionalLight('#9fb4d9', 0.8);
    fill.position.set(-3, 2, 1.5);
    const rim = new THREE.DirectionalLight('#ffffff', 1.4);
    rim.position.set(0, 3, -4);
    this.scene.add(key, fill, rim);
  }

  private addFloor(): void {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 64),
      new THREE.MeshStandardMaterial({ color: '#1e232b', roughness: 0.95, transparent: true, opacity: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'viewport:floor';
    this.scene.add(floor);
  }
}
