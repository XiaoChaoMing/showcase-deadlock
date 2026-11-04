import type * as THREE from 'three';

/** Như mục 7.1 của quy-trinh.md. */
export interface CharacterAsset {
  id: string;
  model: THREE.Group;
  skeleton?: THREE.Skeleton;
  animations: THREE.AnimationClip[];
}

export class CharacterAssetRegistry {
  private readonly assets = new Map<string, CharacterAsset>();

  register(asset: CharacterAsset): void {
    this.assets.set(asset.id, asset);
  }

  get(id: string): CharacterAsset | undefined {
    return this.assets.get(id);
  }

  list(): string[] {
    return [...this.assets.keys()];
  }
}
