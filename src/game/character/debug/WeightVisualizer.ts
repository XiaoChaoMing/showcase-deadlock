import * as THREE from 'three';
import { boneIndex, type BoneName } from '../definitions/BoneNames';
import type { CharacterInstance } from '../runtime/CharacterFactory';

const originals = new WeakMap<THREE.SkinnedMesh, { material: THREE.Material | THREE.Material[]; color?: THREE.BufferAttribute | THREE.InterleavedBufferAttribute }>();
const COLD = new THREE.Color('#2b59ff');
const MID = new THREE.Color('#2bd96b');
const HOT = new THREE.Color('#ff3b2b');

const heat = (w: number, out: THREE.Color): THREE.Color =>
  w < 0.5 ? out.copy(COLD).lerp(MID, w * 2) : out.copy(MID).lerp(HOT, (w - 0.5) * 2);

/** Tô thân theo weight của một bone (xanh dương 0 → xanh lá 0.5 → đỏ 1); null = trả lại vật liệu gốc. */
export const setWeightView = (instance: CharacterInstance, bone: BoneName | null): void => {
  const body = instance.body;
  if (bone === null) {
    const original = originals.get(body);
    if (original) {
      for (const m of [body.material].flat()) if (m.name === 'debug:weights') m.dispose();
      body.material = original.material;
      if (original.color) body.geometry.setAttribute('color', original.color);
      else body.geometry.deleteAttribute('color');
    }
    originals.delete(body);
    return;
  }
  if (!originals.has(body)) originals.set(body, { material: body.material, color: body.geometry.getAttribute('color') });
  else for (const m of [body.material].flat()) if (m.name === 'debug:weights') m.dispose();
  const geometry = body.geometry;
  const skinIndex = geometry.getAttribute('skinIndex');
  const skinWeight = geometry.getAttribute('skinWeight');
  const target = boneIndex(bone);
  const colors = new Float32Array(skinIndex.count * 3);
  const c = new THREE.Color();
  for (let v = 0; v < skinIndex.count; v++) {
    let w = 0;
    for (let k = 0; k < 4; k++) if (skinIndex.getComponent(v, k) === target) w += skinWeight.getComponent(v, k);
    heat(w, c).toArray(colors, v * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  body.material = new THREE.MeshBasicMaterial({ vertexColors: true, name: 'debug:weights' });
};
