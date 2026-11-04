import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { RigSkeleton } from '../rigging/SkeletonBuilder';

export interface SkeletonDebugVisibility {
  lines: boolean;
  joints: boolean;
  labels: boolean;
  axes: boolean;
}

export interface SkeletonDebug {
  /** Thêm vào scene (chứa SkeletonHelper). Khớp, nhãn, trục được gắn thẳng vào từng bone. */
  group: THREE.Group;
  setVisible(v: SkeletonDebugVisibility): void;
  dispose(): void;
}

const JOINT_RADIUS = 0.014;
const AXES_SIZE = 0.06;

const makeLabel = (text: string): CSS2DObject => {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText =
    'color:#0f1115;background:#f2a93bdd;font:600 10px system-ui;padding:1px 4px;border-radius:3px;white-space:nowrap';
  const label = new CSS2DObject(el);
  label.center.set(-0.1, 0.5);
  return label;
};

/** Hiển thị bộ xương để kiểm tra: đường nối, khớp, tên bone, trục local. */
export const createSkeletonDebug = (rig: RigSkeleton): SkeletonDebug => {
  const group = new THREE.Group();
  group.name = 'debug:skeleton';
  const helper = new THREE.SkeletonHelper(rig.root);
  (helper.material as THREE.LineBasicMaterial).linewidth = 2;
  group.add(helper);

  const jointGeometry = new THREE.SphereGeometry(JOINT_RADIUS, 10, 8);
  const jointMaterial = new THREE.MeshBasicMaterial({ color: '#f2a93b', depthTest: false, transparent: true });
  const joints: THREE.Mesh[] = [];
  const labels: CSS2DObject[] = [];
  const axes: THREE.AxesHelper[] = [];

  for (const bone of rig.bones) {
    if (bone === rig.root) continue;
    const joint = new THREE.Mesh(jointGeometry, jointMaterial);
    joint.name = 'debug:joint';
    joint.renderOrder = 999;
    bone.add(joint);
    joints.push(joint);
    const label = makeLabel(bone.name);
    label.name = 'debug:label';
    bone.add(label);
    labels.push(label);
    const axis = new THREE.AxesHelper(AXES_SIZE);
    axis.name = 'debug:axes';
    (axis.material as THREE.Material).depthTest = false;
    bone.add(axis);
    axes.push(axis);
  }

  const setVisible = (v: SkeletonDebugVisibility): void => {
    helper.visible = v.lines;
    for (const j of joints) j.visible = v.joints;
    for (const l of labels) {
      l.visible = v.labels;
      l.element.style.display = v.labels ? '' : 'none';
    }
    for (const a of axes) a.visible = v.axes;
  };
  setVisible({ lines: true, joints: true, labels: false, axes: false });

  const dispose = (): void => {
    for (const o of [...joints, ...labels, ...axes]) o.removeFromParent();
    for (const l of labels) l.element.remove();
    for (const a of axes) a.dispose();
    jointGeometry.dispose();
    jointMaterial.dispose();
    helper.dispose();
    group.clear();
  };
  return { group, setVisible, dispose };
};
