import * as THREE from 'three';
import { BONE_NAMES, type BoneName } from '../definitions/BoneNames';
import type { PoseId } from '../definitions/HeroDefinition';
import type { RigSkeleton } from '../rigging/SkeletonBuilder';
import { poseTargets } from './PoseBuilder';
import { POSES } from './PoseDefinition';

const DEFAULT_DURATION = 0.35;
const BREATH_PERIOD = 4;
const DEG = Math.PI / 180;
/** Biên độ thở (độ) theo bone và trục. */
const BREATH: Partial<Record<BoneName, [axis: 'x' | 'z', degrees: number]>> = {
  Spine: ['x', -1.5],
  Chest: ['x', -1.5],
  LeftShoulder: ['z', 1],
  RightShoulder: ['z', -1],
};

const smoothstep = (x: number): number => x * x * (3 - 2 * x);

/**
 * Chuyển tư thế có nội suy, cộng nhịp thở khi đứng (idle).
 * Mỗi frame tính lại từ đầu (slerp from → to, rồi nhân offset thở), không cộng dồn lên frame trước.
 */
export class PoseAnimator {
  private from = new Map<BoneName, THREE.Quaternion>();
  private to = new Map<BoneName, THREE.Quaternion>();
  private readonly holds = new Set<BoneName>();
  private elapsed = 0;
  private duration = 0;
  private clock = 0;
  private breathing = false;
  private pose: PoseId = 'tpose';

  constructor(private readonly rig: RigSkeleton) {
    this.to = poseTargets(rig, POSES.tpose);
    this.from = this.to;
  }

  get current(): PoseId {
    return this.pose;
  }

  setPose(id: PoseId, durationSec = DEFAULT_DURATION, opts: { keepHolds?: boolean } = {}): void {
    if (!opts.keepHolds) this.holds.clear();
    this.from = new Map(BONE_NAMES.map((n) => [n, this.basePose(n)]));
    this.to = poseTargets(this.rig, POSES[id]);
    this.elapsed = 0;
    this.duration = Math.max(0, durationSec);
    this.pose = id;
  }

  setBreathing(on: boolean): void {
    this.breathing = on;
  }

  /** Bone đang được chỉnh tay: animator không ghi đè cho tới khi setPose (mặc định) hoặc release. */
  hold(bone: BoneName): void {
    this.holds.add(bone);
  }

  release(bone: BoneName): void {
    this.holds.delete(bone);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.clock += dt;
    const k = this.duration === 0 ? 1 : smoothstep(Math.min(1, this.elapsed / this.duration));
    const breathPhase = Math.sin((2 * Math.PI * this.clock) / BREATH_PERIOD);
    for (const name of BONE_NAMES) {
      if (this.holds.has(name)) continue;
      const q = this.from.get(name)!.clone().slerp(this.to.get(name)!, k);
      const breath = this.breathing && this.pose === 'idle' ? BREATH[name] : undefined;
      if (breath) {
        const angle = breath[1] * DEG * breathPhase;
        q.multiply(new THREE.Quaternion().setFromAxisAngle(breath[0] === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1), angle));
      }
      this.rig.byName.get(name)!.quaternion.copy(q);
    }
  }

  /** Tư thế hiện tại không tính nhịp thở (để chuyển tư thế không mang theo lệch do thở). */
  private basePose(name: BoneName): THREE.Quaternion {
    if (this.holds.has(name)) return this.rig.byName.get(name)!.quaternion.clone();
    const k = this.duration === 0 ? 1 : smoothstep(Math.min(1, this.elapsed / this.duration));
    return this.from.get(name)!.clone().slerp(this.to.get(name)!, k);
  }
}
