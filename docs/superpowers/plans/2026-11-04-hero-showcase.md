# Hero Showcase – Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng pipeline sinh hero 3D bằng code (Three.js, không Blender), tạo hero "Kestrel" đi đủ 6 công đoạn, trưng bày trên trang showcase, và xuất bộ template JSON để tạo hero mới không cần sửa code.

**Architecture:** Mỗi hero là một file `heroes/<id>/hero.json`, được kiểm tra bằng JSON Schema cộng các luật ngữ nghĩa. Từ proportions sinh ra một *layout* (toạ độ khớp lúc bind). Layout là nguồn chung cho cả modeling và rigging. Mesh thân được ghép từ các "ring sweep" (ống tiết diện superellipse) thành một BufferGeometry duy nhất, rồi skin vào skeleton 20 bone. Trang bị là mesh cứng có tham số, tự ôm theo bề mặt thân (`BodySurface`), rồi gắn vào bone. Các module definitions / modeling / rigging / animation / export / debug / runtime tách riêng theo mục 8 của `quy-trinh.md`.

**Tech Stack:** Vite, TypeScript (strict), three (+ addons OrbitControls, GLTFExporter, GLTFLoader, CSS2DRenderer), lil-gui, ajv, vitest (+ happy-dom cho test DOM/export), playwright (chụp ảnh duyệt).

**Spec:** `docs/superpowers/specs/2026-11-04-hero-showcase-design.md`. Tài liệu nguồn: `quy-trinh.md`. Người thực hiện đọc cả hai.

## Global Constraints

- Thư mục dự án: `/Users/minhduc/Desktop/Duan/Deadlock`. Mọi đường dẫn bên dưới tính từ đây.
- TypeScript `strict: true`. Không dùng `any` trong code nguồn.
- Không Blender, Unity, Unreal hay dịch vụ sinh nhân vật bên ngoài. Mọi geometry và skeleton sinh bằng code.
- Hệ toạ độ: +Y lên, nhân vật nhìn +Z. **Tay trái của nhân vật nằm ở +X.** Bind pose là T-Pose, mọi bone có rotation identity và scale 1 lúc bind.
- Chiều cao thân đo từ đáy bàn chân tới đỉnh đầu, không tính trang bị.
- Tối đa 4 bone ảnh hưởng mỗi vertex. Tổng weight mỗi vertex bằng 1 (sai số 1e-5).
- Skeleton đúng 20 bone theo cây ở mục 4.1 của `quy-trinh.md`. Tên bone giữ nguyên tiếng Anh.
- Socket là `Object3D`, không phải bone, không nằm trong skeleton.
- Không có con số riêng của hero nào trong file `.ts`. Hằng số chung cho mọi hero (tỷ lệ đặt khớp, số mũ weight...) được phép có.
- Không có class nào ôm cả modeling, rigging và animation.
- Kestrel và mọi hero mẫu là thiết kế gốc, không mượn tên hay thiết kế nhân vật của game có sẵn.
- Sau **mỗi milestone** phải dừng, gửi ảnh chụp và tóm tắt cho chủ dự án, chỉ làm tiếp khi được đồng ý. Giao tiếp với chủ dự án bằng tiếng Việt.
- Commit message kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Điều chỉnh nhỏ so với spec (đã quyết trong plan)

- `chestWidth` và `waistWidth` chuyển từ `proportions.torso` sang các tiết diện `bodyShape.torso.sections`, vì đó là thông số bề mặt. `proportions` chỉ giữ thông số ảnh hưởng tới skeleton. Giá trị của Kestrel vẫn giữ: ngực 0.34, eo 0.27.
- Thêm `bodyPaint` để chọn màu từng vùng thân theo vai trò trong palette.
- Ảnh duyệt chụp tự động bằng Playwright (`npm run snapshot -- <milestone>`).

## Review Focus

1. **Một `hero.json` hỏng nằm cạnh các hero tốt** → hero hỏng hiện thẻ lỗi ghi rõ trường nào sai, các hero khác vẫn hiện bình thường. Test ở Task 3 (registry) và Task 14 (HeroList).
2. **Giá trị hình dạng nằm sát biên cho phép của schema** (radialSegments = 6, squareness = 6, chi rất mảnh hoặc rất to) → mesh không có NaN, không có mặt lộn ngược. Test ở Task 6.
3. **Đổi tư thế và chỉnh tay liên tục rồi bấm reset** → mọi bone về đúng bind pose, không bị trôi dần. Test ở Task 11.
4. **Bấm xuất GLB khi đang bật wireframe / xem weight / bộ xương** → GLB vẫn sạch: vật liệu bình thường, không có helper. Test ở Task 13.
5. **Trang bị trên dáng người khác hẳn (preset `heavy`, `slim`)** → lúc bind, giáp không chui vào thân. Test ở Task 7.

---

## Cấu trúc file

```
Deadlock/
├── index.html
├── package.json, tsconfig.json, vite.config.ts, .gitignore
├── heroes/kestrel/hero.json
├── heroes/granite/hero.json                (M8, hero thử)
├── templates/
│   ├── hero.schema.json                    nguồn duy nhất của luật dạng dữ liệu
│   ├── hero-template.json
│   ├── HERO_TEMPLATE.md
│   └── body-presets/{athletic,heavy,slim,feminine}.json
├── scripts/snapshot.mjs, scripts/shots.config.json
├── src/
│   ├── main.ts
│   ├── game/character/
│   │   ├── definitions/  BoneNames.ts, HeroDefinition.ts, resolveProportions.ts,
│   │   │                 CharacterLayout.ts, validateHero.ts
│   │   ├── modeling/
│   │   │   ├── geometry/  profile.ts, RingSweep.ts
│   │   │   ├── BodySurface.ts, BodyGeometry.ts, CharacterModelBuilder.ts
│   │   │   ├── equipment/ EquipmentBuilder.ts, PlateBuilder.ts, BandBuilder.ts,
│   │   │   │              ShellBuilder.ts, BoxBuilder.ts, AssemblyBuilder.ts
│   │   │   └── materials/ MaterialBuilder.ts
│   │   ├── rigging/  SkeletonBuilder.ts, Sockets.ts, BoneMapping.ts,
│   │   │             SkinWeightGenerator.ts, SkinningBuilder.ts, CharacterRig.ts, RigValidator.ts
│   │   ├── animation/ PoseDefinition.ts, PoseBuilder.ts, ProceduralAnimator.ts
│   │   ├── export/    CharacterSummary.ts, CharacterExporter.ts, CharacterImporter.ts
│   │   ├── debug/     ProportionPreview.ts, SkeletonDebug.ts, WeightVisualizer.ts, RigDebugPanel.ts
│   │   ├── runtime/   HeroRegistry.ts, CharacterFactory.ts, CharacterAssetRegistry.ts
│   │   └── index.ts
│   ├── preview/       PreviewParams.ts, PreviewApp.ts, Viewport.ts
│   └── showcase/      ShowcaseApp.ts, HeroList.ts, HeroInfoCard.ts, ControlsPanel.ts,
│                      RigChecksView.ts, ExportPanel.ts, styles.css
└── tests/             (mirror theo src: tests/definitions/*.test.ts, ...)
```

---

# M1 – Definitions, proportions và hình nhân kiểm tra tỷ lệ

### Task 1: Dựng dự án

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`, `src/main.ts`, `src/preview/Viewport.ts`

**Interfaces:**
- Produces: `class Viewport { constructor(container: HTMLElement); scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; setView(view: 'front'|'side'|'back'|'threeQuarter', target: THREE.Vector3, distance: number): void; onFrame(cb: (dt: number) => void): void; dispose(): void }`

- [ ] **Step 1:** `git init`. Tạo `.gitignore` gồm `node_modules`, `dist`, `snapshots`, `*.glb`.
- [ ] **Step 2:** Cài `three`, `lil-gui`, `ajv`. Cài dev dependency: `vite`, `typescript`, `@types/three`, `vitest`, `happy-dom`, `playwright`. Chạy `npx playwright install chromium`.
- [ ] **Step 3:** Thêm scripts: `dev` (vite), `build` (tsc --noEmit && vite build), `typecheck` (tsc --noEmit), `test` (vitest run), `snapshot` (node scripts/snapshot.mjs). Trong tsconfig bật `strict`, `resolveJsonModule`, `noUncheckedIndexedAccess`.
- [ ] **Step 4:** Viết `Viewport`:
  - nền `#14171c`, sàn tròn mờ bán kính 1.5;
  - đèn key/fill/rim (DirectionalLight ×3) + HemisphereLight;
  - OrbitControls target (0, 0.95, 0);
  - `setView` đặt camera theo góc: front nhìn từ +Z, side từ +X, back từ −Z, threeQuarter từ azimuth 35°.
  - `src/main.ts` tạm thời chỉ dựng Viewport.
- [ ] **Step 5:** Chạy `npm run typecheck && npm run build`. Kỳ vọng: không lỗi. Chạy `npm run dev`, mở trang thấy sàn và nền tối.
- [ ] **Step 6:** Commit, gồm cả `quy-trinh.md` và `docs/`.

```bash
git add -A && git commit -m "chore: scaffold Vite + TS + Three.js project"
```

### Task 2: Tên bone, kiểu dữ liệu hero, proportions và layout

**Files:**
- Create: `src/game/character/definitions/BoneNames.ts`, `HeroDefinition.ts`, `resolveProportions.ts`, `CharacterLayout.ts`
- Test: `tests/definitions/resolveProportions.test.ts`, `tests/definitions/CharacterLayout.test.ts`

**Interfaces:**
- Produces (`BoneNames.ts`):
  ```ts
  export const BONE_NAMES = ['Root','Hips','Spine','Chest','Neck','Head',
    'LeftShoulder','LeftUpperArm','LeftLowerArm','LeftHand',
    'RightShoulder','RightUpperArm','RightLowerArm','RightHand',
    'LeftUpperLeg','LeftLowerLeg','LeftFoot',
    'RightUpperLeg','RightLowerLeg','RightFoot'] as const;   // đúng thứ tự này = thứ tự index skinning
  export type BoneName = typeof BONE_NAMES[number];
  export const BONE_PARENT: Record<BoneName, BoneName | null>;  // theo cây mục 4.1 quy-trinh.md
  ```
- Produces (`HeroDefinition.ts`), kiểu dữ liệu đúng như sau:
  ```ts
  export type Vec3 = [number, number, number];
  export type Side = 'left' | 'right';
  export type BodyPart = 'torso' | 'neck' | 'head' | 'arm' | 'hand' | 'leg' | 'foot';
  export interface CharacterProportions {
    height: number;
    head: { width: number; height: number; depth: number };
    neck: { length: number; radius: number };
    torso: { length: number; shoulderWidth: number; hipWidth: number; pelvisDepth: number };
    arms: { upperLength: number; lowerLength: number; handLength: number };
    legs: { upperLength: number; lowerLength: number };
    foot: { length: number; height: number; width: number };
  }
  export interface Section { t: number; width: number; depth: number; forward?: number }
  export interface BodyShape {
    radialSegments: number; ringsPerMeter: number; shading: 'flat' | 'smooth';
    torso: { squareness: number; sections: Section[] };   // m, t: 0 = đáy chậu, 1 = gốc cổ
    neck: { taper: number };                               // bán kính đỉnh / bán kính gốc
    head: { squareness: number; sections: Section[] };     // TỶ LỆ so với proportions.head, t: 0 = cằm, 1 = đỉnh
    arm: { squareness: number; sections: Section[] };      // m, t: 0 = khớp vai, 1 = cổ tay
    leg: { squareness: number; sections: Section[] };      // m, t: 0 = khớp hông, 1 = cổ chân
    hand: { width: number; thickness: number; squareness: number };
    foot: { squareness: number; toeTaper: number };
  }
  export type ColorSpec = string | { color: string; emissive?: number; metalness?: number; roughness?: number };
  export interface SurfaceMount { part: BodyPart; side?: Side; t: number; angleDeg: number; standoff?: number }
  export type Attach = { socket: string } | { mount: SurfaceMount };
  export interface SocketDefinition { name: string; mount: SurfaceMount; rotationDeg?: Vec3 }
  interface ItemBase { id: string; color: string; edgeColor?: string; bone?: BoneName }
  export interface PlateItem extends ItemBase { kind: 'plate'; part: BodyPart; side?: Side;
    tStart: number; tEnd: number; angleStartDeg: number; angleEndDeg: number;
    thickness: number; gap: number; layers?: number; layerOverlap?: number; bulge?: number }
  export interface BandItem extends ItemBase { kind: 'band'; part: BodyPart; side?: Side; t: number;
    height: number; angleStartDeg: number; angleEndDeg: number; thickness: number; gap: number }
  export interface ShellItem extends ItemBase { kind: 'shell'; coverage: number; faceOpeningDeg: number;
    thickness: number; gap: number; crest?: { height: number; width: number } }
  export interface BoxItem extends ItemBase { kind: 'box'; attach: Attach; size: Vec3;
    cornerRadius: number; offset?: Vec3; rotationDeg?: Vec3 }
  export interface Primitive { shape: 'box' | 'cylinder' | 'cone'; size: Vec3; position: Vec3; rotationDeg?: Vec3; color: string }
  export interface AssemblyItem extends ItemBase { kind: 'assembly'; attach: Attach;
    parts: Primitive[]; offset?: Vec3; rotationDeg?: Vec3; scale?: number }
  export type EquipmentItem = PlateItem | BandItem | ShellItem | BoxItem | AssemblyItem;
  export type PoseId = 'idle'|'tpose'|'armRaise'|'elbowBend'|'kneeBend'|'legRaise'|'torsoTwist'|'headTurn';
  export interface HeroDefinition {
    $schema?: string; id: string; version: 1;
    profile: { name: string; role: string; tagline: string; description: string };
    proportions: CharacterProportions; bodyShape: BodyShape;
    palette: Record<string, ColorSpec>;
    bodyPaint: Record<BodyPart, string>;
    sockets: SocketDefinition[]; equipment: EquipmentItem[];
    showcase: { defaultPose: PoseId; cameraAzimuthDeg: number; cameraElevationDeg: number; cameraDistance: number };
  }
  ```
  `Primitive.size`: với box là [x,y,z]; với cylinder/cone là [đường kính, chiều dài, 0], trục theo +Z.
- Produces (`resolveProportions.ts`):
  `resolveProportions(p: CharacterProportions): { ok: true; value: CharacterProportions; scale: number } | { ok: false; error: string }`
  - Tổng dọc = `foot.height + legs.lowerLength + legs.upperLength + torso.length + neck.length + head.height`.
  - Lệch ≤ 0.02 so với `height`: nhân đều 6 đoạn dọc đó với `scale = height / tổng`. Các đoạn khác giữ nguyên.
  - Lệch > 0.02: trả lỗi. Thông báo phải chứa cả tổng và `height`, làm tròn 3 chữ số.
- Produces (`CharacterLayout.ts`):
  `computeLayout(p: CharacterProportions /* đã resolve */): CharacterLayout`, với `interface CharacterLayout { joints: Record<BoneName, Vec3>; hipY: number; torsoBottomY: number; neckBaseY: number; headTopY: number; elbowT: number; kneeT: number; handTip: Record<Side, Vec3>; toeTip: Record<Side, Vec3> }`.
  Các hằng số chung dùng cho mọi hero (tính theo Y với `hipY = foot.height + lower + upper`, `L = torso.length`):

  | Joint | Vị trí |
  |---|---|
  | Root | (0, 0, 0) |
  | Hips | (0, hipY, 0) |
  | Spine | (0, hipY + 0.20·L, 0) |
  | Chest | (0, hipY + 0.55·L, 0) |
  | Neck | (0, hipY + L, 0) |
  | Head | (0, hipY + L + neck.length, 0) |
  | LeftShoulder | (0.10·shoulderWidth, hipY + 0.92·L, 0) |
  | LeftUpperArm | (0.425·shoulderWidth, cùng Y) |
  | LeftLowerArm | UpperArm + (upperLength, 0, 0) |
  | LeftHand | LowerArm + (lowerLength, 0, 0) |
  | LeftUpperLeg | (0.30·hipWidth, hipY, 0) |
  | LeftLowerLeg | (x, hipY − upperLength, 0) |
  | LeftFoot | (x, foot.height, 0) |

  - Bên Right là bản đối xứng với x âm.
  - `torsoBottomY = hipY − pelvisDepth`, `neckBaseY = hipY + L`, `headTopY = Head.y + head.height`.
  - `elbowT = upper / (upper + lower)` của tay, `kneeT` tương tự cho chân.
  - `handTip = Hand + (±handLength, 0, 0)`; `toeTip = (x, 0.02, 0.75·foot.length)`.

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/definitions/resolveProportions.test.ts
it('co giãn khi lệch ≤ 0.02', () => {
  const r = resolveProportions(kestrelProportions);        // tổng dọc 1.81, height 1.80
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.scale).toBeCloseTo(1.80 / 1.81, 9);
  expect(verticalSum(r.value)).toBeCloseTo(1.80, 9);
  expect(r.value.torso.shoulderWidth).toBe(0.46);          // đoạn ngang không đổi
});
it('báo lỗi khi lệch > 0.02', () => {
  const r = resolveProportions({ ...kestrelProportions, height: 1.75 });
  expect(r.ok).toBe(false);
  if (r.ok) return;
  expect(r.error).toContain('1.810'); expect(r.error).toContain('1.750');
});
// tests/definitions/CharacterLayout.test.ts
it('đủ 20 joint, tay trái ở +X, đối xứng', () => {
  const L = computeLayout(resolved(kestrel));
  expect(Object.keys(L.joints)).toHaveLength(20);
  expect(L.joints.LeftUpperArm[0]).toBeCloseTo(0.1955, 6);
  expect(L.joints.RightUpperArm[0]).toBeCloseTo(-0.1955, 6);
  expect(L.headTopY).toBeCloseTo(1.80, 9);
  expect(L.joints.Root).toEqual([0, 0, 0]);
  expect(L.joints.Hips[1]).toBeGreaterThan(0.9);
});
```

`kestrelProportions` là bảng ở mục 6.4 của spec, cộng `neck.radius 0.055`, `torso.pelvisDepth 0.09`, `foot.width 0.10`. Đặt trong `tests/fixtures/kestrel.ts`; ở Task 3 fixture này đọc thẳng từ `heroes/kestrel/hero.json`.

- [ ] **Step 2:** Chạy `npx vitest run tests/definitions`. Kỳ vọng: FAIL (chưa có module).
- [ ] **Step 3:** Viết 4 file theo Interfaces ở trên.
- [ ] **Step 4:** Chạy lại. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(definitions): bone names, hero types, proportions and layout`.

### Task 3: Schema, validator, file Kestrel và registry hero

**Files:**
- Create: `templates/hero.schema.json`, `src/game/character/definitions/validateHero.ts`, `heroes/kestrel/hero.json`, `src/game/character/runtime/HeroRegistry.ts`
- Test: `tests/definitions/validateHero.test.ts`, `tests/runtime/HeroRegistry.test.ts`

**Interfaces:**
- Produces:
  - `validateHero(raw: unknown): { ok: true; hero: HeroDefinition } | { ok: false; errors: HeroError[] }` với `interface HeroError { path: string; message: string }`. `path` là JSON pointer, ví dụ `/proportions/height`.
  - `loadHeroRegistry(modules: Record<string, unknown>): RegistryEntry[]` với `type RegistryEntry = { id: string; ok: true; hero: HeroDefinition } | { id: string; ok: false; errors: HeroError[] }`. Key của `modules` là đường dẫn dạng `.../heroes/<folder>/hero.json`. Kết quả sắp theo `id`.
- Consumes: `resolveProportions`, `BONE_NAMES`, các kiểu dữ liệu của Task 2.

**Luật schema** (draft-07, `additionalProperties: false` ở mọi object):

| Trường | Ràng buộc |
|---|---|
| `id` | `^[a-z][a-z0-9-]{1,31}$` |
| `version` | const 1 |
| `height` | 0.8–3.0 |
| mọi độ dài/độ rộng | 0.005–1.5 |
| `radialSegments` | integer 6–32 |
| `ringsPerMeter` | 10–120 |
| `squareness` | 1.5–6 |
| `t`, `tStart`, `tEnd`, `coverage` | 0–1 |
| `angle*Deg` | −360–360 |
| `layers` | integer 1–6 |
| `sections` | 2–12 phần tử |
| màu | `^#[0-9A-Fa-f]{6}$` |
| `palette` | bắt buộc có `skin`, `suit`, `armor`, `accent` |
| `emissive` | 0–5 |
| `standoff`, `gap`, `thickness` | 0–0.3 |

Mỗi trường có `description` tiếng Việt, ghi kèm đơn vị. VS Code sẽ hiện mô tả này khi gợi ý.

**Luật ngữ nghĩa** (sau Ajv, trong `validateHero`):
- `resolveProportions` phải ok, nếu không thì báo lỗi tại `/proportions/height`.
- `sections` có `t` tăng dần nghiêm ngặt, phần tử đầu `t = 0`, phần tử cuối `t = 1`.
- Mọi `color`/`edgeColor`/`bodyPaint` phải là vai trò có trong palette hoặc mã `#RRGGBB`.
- `id` của trang bị và `name` của socket không trùng nhau.
- `attach.socket` phải tồn tại trong `sockets`.
- `tStart < tEnd`.
- `side` bắt buộc khi `part` là arm/hand/leg/foot, và bị cấm với các part khác.

Thông báo lỗi bằng tiếng Việt, ghi rõ giá trị cho phép. Ví dụ: `/bodyShape/radialSegments: phải là số nguyên từ 6 đến 32 (đang là 4)`. Ajv cấu hình `allErrors: true`, rồi đổi lỗi của Ajv sang câu tiếng Việt cho các keyword `type`, `minimum`, `maximum`, `required`, `pattern`, `enum`, `additionalProperties`, `const`.

`heroes/kestrel/hero.json` là **điểm xuất phát**, sẽ tinh chỉnh khi duyệt M2:
- `$schema: "../../templates/hero.schema.json"`
- `profile`: Kestrel / "Trinh sát / Scout" + tagline và mô tả 2–3 câu, giọng văn game (tự viết).
- `proportions`: bảng mục 6.4 của spec + `neck {length 0.08, radius 0.055}`, `torso.pelvisDepth 0.09`, `foot.width 0.10`.
- `bodyShape`:
  - radialSegments 12, ringsPerMeter 40, shading `flat`.
  - torso: squareness 2.6, sections (t, w, d, fwd): (0, .20, .16, 0), (.12, .32, .20, 0), (.35, .27, .18, .01), (.5, .29, .19, .015), (.72, .34, .22, .02), (.88, .40, .18, 0), (1, .14, .12, 0).
  - neck.taper 0.9.
  - head: squareness 2.4, sections tỷ lệ (t, w, d, fwd): (0, .45, .5, .15), (.2, .8, .85, .05), (.5, 1, 1, 0), (.75, 1, 1, 0), (.92, .8, .85, 0), (1, .3, .35, 0).
  - arm: squareness 2.2, sections (0, .13, .12), (.2, .11, .10), (.5, .075, .075), (.65, .085, .08), (1, .055, .045).
  - leg: squareness 2.2, sections (0, .17, .17), (.25, .15, .15), (.5, .10, .10), (.62, .11, .11), (1, .07, .07).
  - hand {width .085, thickness .035, squareness 2.5}, foot {squareness 2.8, toeTaper 0.7}.
- `palette`: skin `#C8956D`, suit `#3D4550`, armor `{color #5B6573, metalness .3, roughness .5}`, accent `#F2A93B`, visor `{color #FFB547, emissive 1.6}`.
- `bodyPaint`: torso/arm/leg/hand → suit; neck/head → skin; foot → armor.
- `sockets`: `back_weapon` {mount {part torso, t .70, angleDeg 180, standoff .12}, rotationDeg [0, 0, −35]}.
- `equipment`:
  - `chest-plate`: plate torso t .55–.85, góc −70..70, thickness .015, gap .008, edge accent.
  - `left-pauldron`: plate arm left t 0–.35, góc −60..240, layers 3, overlap .4, thickness .012, gap .01, bulge .02, edge accent.
  - `helmet`: shell coverage .72, faceOpeningDeg 0, thickness .014, gap .01, crest {height .02, width .03}.
  - `visor`: band head t .62, height .045, góc −70..70, thickness .01, gap .026, màu visor.
  - `backpack`: box mount torso t .68, angle 180, size [.22, .24, .09], corner .02, màu armor.
  - `rifle`: assembly socket back_weapon. Gồm 5 khối: thân box [.07, .09, .42], nòng cylinder [.03, .22, 0] ở z +.3, báng box, băng đạn box, ống ngắm cylinder. Màu armor/accent.
  - `shin-left`, `shin-right`: plate leg t .55–.92, góc −60..60, thickness .012, gap .008.
- `showcase`: defaultPose idle, azimuth 30, elevation 10, distance 3.2.

- [ ] **Step 1: Viết test thất bại**

```ts
it('Kestrel hợp lệ', () => expect(validateHero(kestrelJson).ok).toBe(true));
it.each([
  ['/proportions/height', (h) => { delete h.proportions.height; }],
  ['/palette/skin',       (h) => { h.palette.skin = 'red'; }],
  ['/bodyShape/radialSegments', (h) => { h.bodyShape.radialSegments = 4; }],
  ['/equipment/0/color',  (h) => { h.equipment[0].color = 'gold'; }],          // vai trò không có
  ['/equipment/5/attach/socket', (h) => { h.equipment[5].attach = { socket: 'nope' }; }],
  ['/equipment/1/id',     (h) => { h.equipment[1].id = h.equipment[0].id; }],
  ['/equipment/0/bone',   (h) => { h.equipment[0].bone = 'Tail'; }],
  ['/bodyShape/arm/sections', (h) => { h.bodyShape.arm.sections.reverse(); }],
  ['/proportions/height', (h) => { h.proportions.height = 1.70; }],            // lệch > 0.02
])('báo lỗi tại %s', (path, mutate) => {
  const h = structuredClone(kestrelJson); mutate(h);
  const r = validateHero(h);
  expect(r.ok).toBe(false);
  expect(!r.ok && r.errors.some(e => e.path.startsWith(path))).toBe(true);
  expect(!r.ok && r.errors.every(e => e.message.length > 10)).toBe(true);
});
// HeroRegistry.test.ts  (Review Focus #1)
it('hero hỏng không làm hỏng hero khác', () => {
  const reg = loadHeroRegistry({
    '/heroes/kestrel/hero.json': kestrelJson,
    '/heroes/broken/hero.json': { id: 'broken', version: 1 },
  });
  expect(reg.map(e => [e.id, e.ok])).toEqual([['broken', false], ['kestrel', true]]);
});
it('id khác tên thư mục → lỗi tại /id', () => {
  const [e] = loadHeroRegistry({ '/heroes/other/hero.json': kestrelJson });
  expect(e.ok).toBe(false);
});
```

Thứ tự `equipment` trong test giả định danh sách Kestrel theo đúng thứ tự liệt kê ở trên (index 5 là `rifle`).

- [ ] **Step 2:** Chạy `npx vitest run tests/definitions tests/runtime`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết schema, validator, `hero.json`, registry. Chuyển `tests/fixtures/kestrel.ts` sang import từ `heroes/kestrel/hero.json`.
- [ ] **Step 4:** Chạy lại. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(definitions): hero schema, validator, Kestrel definition, registry`.

### Task 4: Preset dáng người, hình nhân tỷ lệ, preview và chụp ảnh

**Files:**
- Create: `templates/body-presets/{athletic,heavy,slim,feminine}.json`, `src/game/character/debug/ProportionPreview.ts`, `src/preview/PreviewParams.ts`, `src/preview/PreviewApp.ts`, `scripts/snapshot.mjs`, `scripts/shots.config.json`
- Modify: `src/main.ts`
- Test: `tests/preview/PreviewParams.test.ts`, `tests/definitions/presets.test.ts`

**Interfaces:**
- Produces:
  - `buildProportionPreview(layout: CharacterLayout, p: CharacterProportions): THREE.Group`: capsule nối mỗi cặp joint cha–con, hộp cho đầu, tay và bàn chân.
  - `parsePreviewParams(search: string): PreviewParams` với `interface PreviewParams { hero?: string; preset?: string; stage: 'proportions'|'body'|'skeleton'|'skinned'|'full'; view: 'front'|'side'|'back'|'threeQuarter'; pose: PoseId; overlay: Set<'skeleton'|'wireframe'|'weights'|'labels'>; bone?: BoneName; zoom?: 'shoulderL'|'elbowL'|'hipL'|'kneeL'|'head'; lineup: 'none'|'presets'|'heroes' }`. Mặc định: stage `full`, view `threeQuarter`, pose `tpose`, lineup `none`. `zoom` đưa camera cận khớp tương ứng.
  - `applyPreset(hero: HeroDefinition, preset: { proportions: CharacterProportions; bodyShape: BodyShape }): HeroDefinition`
  - Preview đặt `window.__heroReady = true` sau frame đầu tiên đã render.
- Preset là file `{ "proportions": ..., "bodyShape": ... }`:
  - `athletic` = Kestrel.
  - `heavy`: height 1.95, vai .62, hông .44, thân và chi dày gấp ~1.5, squareness 3.2.
  - `slim`: height 1.85, vai .38, chi mảnh ~0.75.
  - `feminine`: height 1.70, vai .38, eo .23, hông .36, có tiết diện ngực nhô ra (forward .035 ở t .72), chi thon.
  - Giá trị cụ thể do người thực hiện chỉnh, miễn qua validator và nhìn khác nhau rõ.

- [ ] **Step 1: Viết test thất bại**

```ts
it('đọc tham số preview', () => {
  const p = parsePreviewParams('?hero=kestrel&view=side&overlay=skeleton,labels&bone=LeftUpperArm');
  expect(p).toMatchObject({ hero: 'kestrel', view: 'side', stage: 'full', pose: 'tpose', bone: 'LeftUpperArm' });
  expect([...p.overlay]).toEqual(['skeleton', 'labels']);
});
it('bỏ qua giá trị lạ', () => expect(parsePreviewParams('?view=top&bone=Tail&lineup=x')).toMatchObject({ view: 'threeQuarter', bone: undefined, lineup: 'none' }));
it('lineup', () => expect(parsePreviewParams('?lineup=heroes').lineup).toBe('heroes'));
it.each(['athletic', 'heavy', 'slim', 'feminine'])('preset %s hợp lệ khi ghép vào Kestrel', (name) => {
  expect(validateHero(applyPreset(kestrel, preset(name))).ok).toBe(true);
});
```

- [ ] **Step 2:** Chạy test. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các module.
  - `PreviewApp` đọc hero qua `import.meta.glob('/heroes/*/hero.json', { eager: true, import: 'default' })` và `loadHeroRegistry`.
  - Panel `lil-gui` có: chọn hero, chọn preset, wireframe, view.
  - `lineup=presets`: xếp Kestrel và 4 preset thành hàng ngang cách nhau 1.0. `lineup=heroes`: xếp mọi hero hợp lệ trong registry.
  - Stage `proportions` hiện hình nhân capsule. Các stage sau sẽ bổ sung ở milestone sau.
- [ ] **Step 4:** Viết `scripts/snapshot.mjs <milestone>`:
  - dựng Vite server bằng `createServer` cổng 5179;
  - mở Chromium bằng Playwright, cờ `--use-angle=swiftshader`, cửa sổ 1280×900;
  - với mỗi `{ name, query }` trong `shots.config.json[milestone]`: mở `/?{query}`, chờ `window.__heroReady`, lưu `snapshots/<milestone>/<name>.png`.
  - Ảnh M1: `lineup-front` (`stage=proportions&lineup=presets&view=front`), `kestrel-front`, `kestrel-side`, `kestrel-back`.
- [ ] **Step 5:** Chạy `npm test && npm run typecheck`. Kỳ vọng: PASS. Chạy `npm run snapshot -- m1`. Kỳ vọng: có 4 file PNG không đen.
- [ ] **Step 6:** Commit `feat(preview): proportion mannequin, presets, preview params, snapshots`.
- [ ] **Step 7: Dừng duyệt M1.** Gửi chủ dự án ảnh `snapshots/m1/*.png` + tóm tắt (tỷ lệ Kestrel, khác biệt 4 preset) + lệnh `npm run dev` để tự xem. Sửa theo góp ý, chờ đồng ý rồi mới sang M2.

---

# M2 – Mesh thân tham số và trang bị

### Task 5: Hàm nội suy tiết diện và ring sweep

**Files:**
- Create: `src/game/character/modeling/geometry/profile.ts`, `RingSweep.ts`
- Test: `tests/modeling/profile.test.ts`, `tests/modeling/RingSweep.test.ts`

**Interfaces:**
- Produces:
  - `sampleProfile(sections: Section[], t: number): { width: number; depth: number; forward: number }`: nội suy cubic đơn điệu (monotone Hermite) để không vọt quá giá trị hai đầu. `t` ngoài [0, 1] thì kẹp lại.
  - `superellipsePoint(theta: number, ra: number, rb: number, n: number): [a: number, b: number]`: `a = ra·sgn(cos θ)|cos θ|^(2/n)`, `b = rb·sgn(sin θ)|sin θ|^(2/n)`.
  - `interface SweepRing { center: Vec3; axisA: Vec3; axisB: Vec3; ra: number; rb: number; n: number; t: number }`
  - `buildSweep(rings: SweepRing[], segments: number, caps: { start: boolean; end: boolean }): SweepData` với `interface SweepData { positions: Float32Array; indices: Uint32Array; t: Float32Array; angle: Float32Array }`. Mặt tam giác quay ra ngoài, nắp là quạt từ tâm ring.

- [ ] **Step 1: Viết test thất bại**
  - `sampleProfile` tại đúng `t` của section trả đúng giá trị. Giữa hai section, giá trị nằm trong khoảng hai đầu.
  - `superellipsePoint` với n = 2 thoả `a²/ra² + b²/rb² ≈ 1` cho 64 góc. Với n = 6, điểm ở góc 45° xa tâm hơn trường hợp n = 2.
  - `buildSweep` với 5 ring × 12 segment, có cả hai nắp: số vertex `5·12 + 2`, mọi index < số vertex, không có NaN.
  - Mọi tam giác có pháp tuyến hướng ra xa trục sweep: `dot(normal, centroid − điểm gần nhất trên trục) > 0`.
  - Chạy cùng các test này cho sweep đi theo −Y và theo −X, vì chân đi xuống và tay phải đi về −X.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết hai file. Thứ tự vertex trong ring phải theo chiều cùng hướng với `axisA × axisB` và hướng đi, để mặt tam giác quay ra ngoài bất kể sweep đi theo chiều nào.
- [ ] **Step 4:** Chạy. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(modeling): monotone profile sampling and superellipse ring sweep`.

### Task 6: BodySurface và mesh thân liền khối

**Files:**
- Create: `src/game/character/modeling/BodySurface.ts`, `BodyGeometry.ts`
- Test: `tests/modeling/BodySurface.test.ts`, `tests/modeling/BodyGeometry.test.ts`

**Interfaces:**
- Consumes: `CharacterLayout`, `BodyShape`, `sampleProfile`, `buildSweep`.
- Produces:
  - `createBodySurface(p: CharacterProportions, shape: BodyShape, layout: CharacterLayout): BodySurface`
    ```ts
    interface BodySurface {
      ringAt(part: BodyPart, side: Side | undefined, t: number): SweepRing;
      pointAt(m: SurfaceMount): { position: Vec3; normal: Vec3 };
      partLength(part: BodyPart): number;
    }
    ```
  - `buildBodyGeometry(surface: BodySurface, shape: BodyShape): THREE.BufferGeometry`, gồm:
    - attribute `position`, `normal`;
    - `region` (Uint8, theo `BodyRegion`), `chainT` (Float32);
    - groups theo thứ tự `BodyRegion`.
    - Nếu `shading === 'flat'` thì trả geometry non-indexed với normal theo mặt.
  - `enum BodyRegion { Torso, Neck, Head, ArmL, ArmR, HandL, HandR, LegL, LegR, FootL, FootR }`, cùng `REGION_PART: Record<BodyRegion, { part: BodyPart; side?: Side }>`.

**Quy ước trục của từng part** (góc 0° = hướng A, 90° = hướng B, t chạy theo hướng "đi"):

| Part | Đi từ → tới | A (0°) | B (90°) |
|---|---|---|---|
| torso | (0, torsoBottomY) → (0, neckBaseY) | +Z | +X |
| neck | Neck → Head joint (lồng 0.02 vào thân và đầu) | +Z | +X |
| head | (0, Head.y − 0.02) → (0, headTopY) | +Z | +X |
| arm (L/R) | UpperArm joint → Hand joint | +Z | +Y |
| hand (L/R) | Hand joint → handTip | +Z | +Y |
| leg (L/R) | UpperLeg joint → Foot joint | +Z | hướng ra ngoài (L: +X, R: −X) |
| foot (L/R) | gót (z = −0.25·length, y = height/2) → toeTip | +Y | hướng ra ngoài |

**Quy ước kích thước:**
- `width` là bề ngang theo B, `depth` là bề dày theo A, bán kính = một nửa. `forward` dịch tâm ring theo A.
- Đầu: sections là tỷ lệ, nhân với `proportions.head.width/depth`. Chiều dài sweep = `head.height`.
- Cổ: bán kính `neck.radius`, đỉnh nhân thêm `taper`.
- Tay: bề ngang `hand.width`, bề dày `hand.thickness`.
- Bàn chân: bề ngang `foot.width`, bề dày `foot.height`, mũi chân thu lại theo `toeTaper`.

**Ghép mesh** (quyết định của plan):
- Mỗi chi (vai→cổ tay, hông→cổ chân) là **một sweep liên tục đi qua khớp**, nên khuỷu và gối liền mạch.
- Gốc tay lồng vào trong thân 0.04 theo hướng −đi; gốc chân bắt đầu ở hipY, nằm trong phần chậu. Thân, cổ, đầu, tay, bàn chân là các sweep lồng vào nhau rồi gộp thành một geometry.
- Số ring = `ceil(partLength · ringsPerMeter) + 1`, tối thiểu 4. Ring đặt dày hơn trong ±0.08 quanh khớp khuỷu và gối (tối thiểu 3 ring trong vùng đó) để gập khớp đẹp.

- [ ] **Step 1: Viết test thất bại** (chạy cho Kestrel và cả 4 preset)
  - Không có NaN trong position và normal.
  - `bbox.min.y ≈ 0` (±0.01) và `bbox.max.y ≈ height` (±0.01).
  - `bbox.min.x ≈ −bbox.max.x` (±1e-6).
  - Mỗi region có > 0 vertex. Mọi vertex `ArmL`/`HandL`/`LegL`/`FootL` có x > 0, bên R có x < 0.
  - Đối xứng: tập vị trí vertex bên L lật dấu x trùng tập bên R (sắp xếp rồi so, 1e-6).
  - `pointAt({ part: 'torso', t: 0.7, angleDeg: 180 })` có z < 0 và normal hướng −Z. Với `angleDeg: 90`, điểm có x > 0.
  - **Review Focus #2:** một hero ở biên schema (radialSegments 6, squareness 6, mọi section của tay/chân có width/depth = 0.005, thân width 1.5) không có NaN. Mọi tam giác có diện tích > 0 hoặc bị loại, và không có mặt lộn ngược (cùng phép thử pháp tuyến ở Task 5, chạy trên từng sweep trước khi gộp).
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết `BodySurface` (mọi phép tính ring nằm ở đây) và `BodyGeometry` (gọi `buildSweep` cho từng part rồi gộp, gắn `region` + `chainT`, bỏ tam giác suy biến).
- [ ] **Step 4:** Chạy. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(modeling): body surface and merged parametric body geometry`.

### Task 7: Vật liệu, trang bị và bộ dựng model

**Files:**
- Create: `src/game/character/modeling/materials/MaterialBuilder.ts`, `modeling/equipment/{EquipmentBuilder,PlateBuilder,BandBuilder,ShellBuilder,BoxBuilder,AssemblyBuilder}.ts`, `modeling/CharacterModelBuilder.ts`
- Modify: `src/preview/PreviewApp.ts` (stage `body`, `full`)
- Test: `tests/modeling/equipment.test.ts`, `tests/modeling/CharacterModelBuilder.test.ts`

**Interfaces:**
- Produces:
  - `createMaterials(palette: Record<string, ColorSpec>): MaterialSet` với `interface MaterialSet { get(colorRef: string): THREE.MeshStandardMaterial }`. `colorRef` là vai trò trong palette hoặc `#hex`. Material được cache theo ref. Mặc định roughness 0.7, metalness 0.05. `emissive` dùng chính màu đó nhân với `emissiveIntensity`.
  - `resolveAttachBone(part: BodyPart, side: Side | undefined, t: number, layout: CharacterLayout): BoneName`, đổi `t` ra bone như sau:
    - torso: theo Y của điểm: < Spine.y → Hips; < Chest.y → Spine; còn lại → Chest.
    - neck → Neck; head → Head.
    - arm: t < elbowT → UpperArm, còn lại LowerArm (đúng bên); hand → Hand.
    - leg: t < kneeT → UpperLeg, còn lại LowerLeg; foot → Foot.
  - `buildEquipment(item: EquipmentItem, ctx: { surface: BodySurface; layout: CharacterLayout; materials: MaterialSet; sockets: SocketDefinition[] }): EquipmentPart` với `interface EquipmentPart { id: string; bone: BoneName; socket?: string; object: THREE.Object3D }`.
    - `object` dựng trong toạ độ world lúc bind; Task 10 mới gắn vào bone.
    - `object.name = 'equip:' + id`.
    - `bone` = `item.bone` nếu có. Nếu không: plate/band lấy theo `(tStart + tEnd)/2` hoặc `t`; shell lấy Head; box/assembly lấy bone của mount hoặc socket.
  - `buildCharacterModel(hero: HeroDefinition): CharacterModel` với `interface CharacterModel { hero: HeroDefinition; proportions: CharacterProportions; layout: CharacterLayout; surface: BodySurface; materials: MaterialSet; bodyGeometry: THREE.BufferGeometry; bodyMaterials: THREE.Material[]; equipment: EquipmentPart[] }`. `bodyMaterials` xếp theo thứ tự `BodyRegion`, lấy màu qua `bodyPaint`.

**Hình học từng kiểu trang bị:**
- **plate:** mảnh vỏ có độ dày, chạy theo các ring `surface.ringAt` trong khoảng [tStart, tEnd] × [angleStart, angleEnd], đẩy ra ngoài một khoảng `gap`.
  - `bulge` phồng thêm ở giữa mảnh theo hàm sin.
  - `layers > 1`: chia [tStart, tEnd] thành các lớp chồng nhau theo `layerOverlap`. Lớp sau to hơn lớp trước một khoảng `thickness` để không chui vào nhau.
  - `edgeColor`: dải viền mỏng ở hai mép t.
- **band:** plate có `tStart/tEnd = t ∓ height/2/partLength`, không bulge.
- **shell:** vỏ ôm đầu từ đỉnh xuống `coverage·head.height`, chừa ô mặt rộng `faceOpeningDeg` quanh góc 0°. `crest` là gờ chạy dọc đường giữa đầu.
- **box:** hộp bo góc. Đặt tại `pointAt(mount)` hoặc vị trí socket, mặt sau áp vào bề mặt thân, xoay theo normal, cộng thêm `offset`/`rotationDeg`.
- **assembly:** Group chứa các primitive. Đặt giống box, rồi nhân `scale`.
- Vị trí socket = `pointAt(mount)` đẩy ra theo `standoff`. Task 8 sẽ tạo Object3D socket, task này chỉ tính vị trí.

- [ ] **Step 1: Viết test thất bại**

```ts
it.each([
  ['torso', undefined, 0.1, 'Hips'], ['torso', undefined, 0.7, 'Chest'],
  ['arm', 'left', 0.2, 'LeftUpperArm'], ['arm', 'left', 0.8, 'LeftLowerArm'],
  ['leg', 'right', 0.75, 'RightLowerLeg'], ['head', undefined, 0.5, 'Head'], ['foot', 'left', 0.5, 'LeftFoot'],
])('resolveAttachBone(%s,%s,%s) = %s', (part, side, t, bone) =>
  expect(resolveAttachBone(part, side, t, kLayout)).toBe(bone));
```

  - Kestrel: `left-pauldron.bone = 'LeftUpperArm'`, `visor.bone = 'Head'`, `rifle.bone = 'Chest'` (qua socket), `backpack` có mọi vertex z < 0.
  - **Review Focus #5**, chạy cho Kestrel + 4 preset (ghép bằng `applyPreset`): với mọi vertex của mọi plate/band, khoảng cách tới trục part tại góc đó ≥ bán kính bề mặt + `gap` − 1e-4. Cách đo: chiếu vertex vào ring gần nhất qua `surface.ringAt`.
  - `buildCharacterModel(kestrel)` trả 8 trang bị, đúng id. `bodyMaterials.length = 11`. Không có NaN trong mọi geometry của trang bị.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các module. Preview stage `body` hiện thân không trang bị, stage `full` hiện thân + trang bị (chưa có rig). Thêm công tắc lil-gui `ẩn/hiện trang bị`.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Kỳ vọng: PASS.
- [ ] **Step 5:** Thêm ảnh M2 vào `shots.config.json`:
  - Kestrel `stage=body` và `stage=full` ở 4 góc nhìn;
  - Kestrel `overlay=wireframe` mặt trước;
  - `lineup=presets&stage=body` mặt trước (4 preset).

  Chạy `npm run snapshot -- m2`.
- [ ] **Step 6:** Commit `feat(modeling): materials, parametric equipment, character model builder`.
- [ ] **Step 7: Dừng duyệt M2.** Gửi ảnh + tóm tắt. Đây là lúc chỉnh dáng Kestrel, các preset và hình trang bị. Mọi chỉnh sửa vào `hero.json` và file preset, không vào code (trừ khi lộ ra lỗi thuật toán). Chờ đồng ý.

---

# M3 – Skeleton

### Task 8: SkeletonBuilder, socket và debug bộ xương

**Files:**
- Create: `src/game/character/rigging/SkeletonBuilder.ts`, `rigging/Sockets.ts`, `debug/SkeletonDebug.ts`
- Modify: `src/preview/PreviewApp.ts` (stage `skeleton`: thân trong suốt 35% + overlay)
- Test: `tests/rigging/SkeletonBuilder.test.ts`

**Interfaces:**
- Produces:
  - `buildSkeleton(layout: CharacterLayout): RigSkeleton` với `interface RigSkeleton { root: THREE.Bone; bones: THREE.Bone[] /* theo thứ tự BONE_NAMES */; byName: Map<BoneName, THREE.Bone>; skeleton: THREE.Skeleton; bindLocal: Map<BoneName, { position: THREE.Vector3; quaternion: THREE.Quaternion }> }`. Vị trí local = joint con − joint cha.
  - `resetToBindPose(rig: RigSkeleton): void`: chép lại `bindLocal`, scale 1, rồi `updateMatrixWorld(true)`.
  - `createSockets(defs: SocketDefinition[], surface: BodySurface, layout: CharacterLayout, rig: RigSkeleton): Map<string, THREE.Object3D>`: Object3D tên `socket:<name>`, con của bone theo `resolveAttachBone`, vị trí local = vị trí world lúc bind − vị trí world của bone, có `rotationDeg`.
  - `createSkeletonDebug(rig: RigSkeleton): { group: THREE.Group; setVisible(o: { lines: boolean; joints: boolean; labels: boolean; axes: boolean }): void; dispose(): void }`: dùng SkeletonHelper, cầu nhỏ tại khớp, nhãn tên qua CSS2DRenderer, AxesHelper 0.06 mỗi bone.

- [ ] **Step 1: Viết test thất bại**
  - `bones.length === 20`; `bones.map(b => b.name)` đúng bằng `BONE_NAMES`; tên không trùng.
  - Với mọi bone (trừ Root), `bone.parent.name === BONE_PARENT[name]`.
  - Vị trí world của từng bone khớp `layout.joints` (1e-6).
  - Mọi bone có quaternion identity và scale (1, 1, 1).
  - Root ở (0, 0, 0), Hips là con của Root và nằm ở hipY.
  - Socket `back_weapon` có parent là `Chest`, vị trí world ≈ `pointAt(mount)` + normal·standoff (1e-6).
  - Xoay 5 bone ngẫu nhiên, gọi `resetToBindPose`, vị trí world lại khớp layout (1e-9).
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các module. Preview: overlay `skeleton`, `labels` và lil-gui bật/tắt lines/joints/labels/axes.
- [ ] **Step 4:** Chạy test + typecheck. Kỳ vọng: PASS.
- [ ] **Step 5:** Ảnh M3: `stage=skeleton&overlay=skeleton,labels` ở front, side; một ảnh cận vai trái (`zoom=shoulderL`). Chạy `npm run snapshot -- m3`.
- [ ] **Step 6:** Commit `feat(rigging): 20-bone skeleton, sockets, skeleton debug view`.
- [ ] **Step 7: Dừng duyệt M3.** Gửi ảnh + tóm tắt (bảng bone, vị trí khớp). Chờ đồng ý.

---

# M4 – Skin weights và SkinnedMesh

### Task 9: Bảng vùng ảnh hưởng và sinh skin weight

**Files:**
- Create: `src/game/character/rigging/BoneMapping.ts`, `rigging/SkinWeightGenerator.ts`
- Test: `tests/rigging/SkinWeightGenerator.test.ts`

**Interfaces:**
- Produces:
  - `REGION_BONES: Record<BodyRegion, BoneName[]>`:

    | Region | Bone được phép |
    |---|---|
    | Torso | Hips, Spine, Chest, LeftShoulder, RightShoulder, LeftUpperArm, RightUpperArm, LeftUpperLeg, RightUpperLeg |
    | Neck | Chest, Neck, Head |
    | Head | Neck, Head |
    | ArmL | Chest, LeftShoulder, LeftUpperArm, LeftLowerArm, LeftHand |
    | HandL | LeftLowerArm, LeftHand |
    | LegL | Hips, LeftUpperLeg, LeftLowerLeg, LeftFoot |
    | FootL | LeftLowerLeg, LeftFoot |
    | …R | đối xứng |

  - `boneSegment(name: BoneName, layout: CharacterLayout): [Vec3, Vec3]`: từ joint của bone tới joint con trên cùng chuỗi. Đoạn đặc biệt: Hips→Spine, Chest→Neck, Shoulder→UpperArm, Head→(0, headTopY), Hand→handTip, Foot→toeTip. Root không có đoạn và không bao giờ có weight.
  - `generateSkinWeights(geometry: THREE.BufferGeometry, layout: CharacterLayout, opts?: { power?: number /* mặc định 4 */ }): { skinIndex: Uint16Array; skinWeight: Float32Array }`. Mỗi mảng dài 4·vertexCount.

**Thuật toán khởi điểm** (người thực hiện được chỉnh phần tinh, miễn qua test):
1. Với từng vertex, lấy các bone được phép theo `region`.
2. Tính `d` = khoảng cách tới đoạn bone, `w = 1/(d + 1e-4)^power`.
3. Giữ 4 weight lớn nhất rồi chuẩn hoá.
4. Ở chi, nhân thêm hệ số theo `chainT` để vùng giữa đoạn gần như chỉ theo một bone, vùng ±0.06 quanh khớp thì trộn mượt (smoothstep).

- [ ] **Step 1: Viết test thất bại** (chạy cho Kestrel, đúng geometry flat mà Task 10 dùng)
  - Mọi vertex: tổng weight ≈ 1 (1e-5), ≤ 4 weight khác 0, mọi index < 20, weight của Root (index 0) bằng 0.
  - Mọi vertex ArmL chỉ có bone thuộc `REGION_BONES[ArmL]`.
  - Vertex Torso có x > 0.05 có weight 0 cho mọi bone `Right*`.
  - Vertex ArmL có chainT ∈ [0.2, 0.3]: weight LeftUpperArm ≥ 0.9.
  - Vertex ArmL có chainT ∈ [0.85, 0.95]: weight LeftLowerArm ≥ 0.6.
  - Vertex LegL có chainT ∈ [0.2, 0.3]: weight LeftUpperLeg ≥ 0.9.
  - Vertex Head ở 10% trên cùng: weight Head ≥ 0.95.
  - Vertex ArmL có |chainT − elbowT| < 0.02: cả LeftUpperArm và LeftLowerArm > 0.2.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết hai file.
- [ ] **Step 4:** Chạy. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(rigging): region-constrained analytical skin weights`.

### Task 10: SkinnedMesh, gắn trang bị vào bone, xem weight

**Files:**
- Create: `src/game/character/rigging/SkinningBuilder.ts`, `rigging/CharacterRig.ts`, `runtime/CharacterFactory.ts`, `debug/WeightVisualizer.ts`, `src/game/character/index.ts`
- Modify: `src/preview/PreviewApp.ts` (stage `skinned` và `full` dùng `buildCharacter`; overlay `weights` + `bone`)
- Test: `tests/runtime/CharacterFactory.test.ts`

**Interfaces:**
- Consumes: `buildCharacterModel`, `buildSkeleton`, `createSockets`, `generateSkinWeights`.
- Produces:
  - `createSkinnedBody(geometry: THREE.BufferGeometry, weights: { skinIndex: Uint16Array; skinWeight: Float32Array }, rig: RigSkeleton, materials: THREE.Material[]): THREE.SkinnedMesh`: tên `Body`, thêm `rig.root` làm con, rồi gọi `bind(rig.skeleton)`.
  - `attachEquipment(parts: EquipmentPart[], rig: RigSkeleton, sockets: Map<string, THREE.Object3D>): void`: chuyển `object` từ toạ độ world lúc bind sang toạ độ local của bone/socket, giữ nguyên vị trí world (dùng `Object3D.attach` sau khi `updateMatrixWorld`).
  - `buildCharacter(hero: HeroDefinition): CharacterInstance` với `interface CharacterInstance extends CharacterModel { root: THREE.Group /* name = hero.id */; body: THREE.SkinnedMesh; rig: RigSkeleton; sockets: Map<string, THREE.Object3D> }`.
    - `root.userData = { id, version, profile, palette }`.
    - **Không** thêm helper nào vào `root`.
  - `setWeightView(instance: CharacterInstance, bone: BoneName | null): void`:
    - `bone` khác null: đổi vật liệu thân sang MeshBasicMaterial dùng vertexColors. Màu tô theo weight của bone đó: xanh dương 0 → xanh lá 0.5 → đỏ 1, ghi vào attribute `weightColor` (dùng làm `color`).
    - `bone = null`: trả lại vật liệu gốc.
  - `index.ts` export công khai: `buildCharacter`, `validateHero`, `loadHeroRegistry`, `BONE_NAMES`, kiểu dữ liệu.

- [ ] **Step 1: Viết test thất bại**
  - `body.geometry` có `skinIndex`/`skinWeight` với count bằng số vertex. `body.skeleton.bones.length === 20`.
  - Lấy vertex cổ tay trái (ArmL, chainT > 0.95) và vertex ngực (Torso, z > 0, Y ≈ Chest.y). Xoay `LeftLowerArm` 90° quanh Y, `updateMatrixWorld`, đọc vị trí bằng `body.getVertexPosition(i, v)`: vertex cổ tay dịch > 0.1, vertex ngực dịch < 1e-4.
  - Sau `attachEquipment`: `left-pauldron.object.parent.name === 'LeftUpperArm'`, bbox world bằng lúc trước khi gắn (1e-6). Xoay LeftUpperArm thì tâm bbox của pauldron di chuyển.
  - `rifle.object.parent.name === 'socket:back_weapon'`.
  - Duyệt `root`: không có object nào là `SkeletonHelper`, `LineSegments`, `AxesHelper` hay CSS2DObject.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các module.
- [ ] **Step 4:** Chạy test + typecheck. Kỳ vọng: PASS.
- [ ] **Step 5:** Ảnh M4: heatmap `overlay=weights&bone=X` (view front) cho LeftUpperArm, LeftLowerArm, Chest, Spine, LeftUpperLeg, LeftLowerLeg, Head; ảnh Kestrel `stage=full` T-Pose front. Chạy `npm run snapshot -- m4`.
- [ ] **Step 6:** Commit `feat(rigging): skinned body, equipment attached to bones, weight view`.
- [ ] **Step 7: Dừng duyệt M4.** Gửi ảnh heatmap + tóm tắt. Chờ đồng ý.

---

# M5 – Rig test

### Task 11: Tư thế thử và bộ chuyển tư thế

**Files:**
- Create: `src/game/character/animation/PoseDefinition.ts`, `animation/PoseBuilder.ts`, `animation/ProceduralAnimator.ts`
- Test: `tests/animation/poses.test.ts`

**Interfaces:**
- Produces:
  - `type Pose = Partial<Record<BoneName, Vec3>>` (độ, Euler XYZ, cộng lên bind local). `POSES: Record<PoseId, Pose>`.
  - `poseTargets(rig: RigSkeleton, pose: Pose): Map<BoneName, THREE.Quaternion>`: tính quaternion đích cho đủ 20 bone; bone không có trong pose thì lấy bind.
  - `class PoseAnimator { constructor(rig: RigSkeleton); setPose(id: PoseId, durationSec?: number /* 0.35 */): void; setBreathing(on: boolean): void; update(dt: number): void; readonly current: PoseId }`
    - Mỗi frame tính từ đầu: `slerp(from, to, ease)` rồi nhân thêm offset thở. Không cộng dồn lên giá trị frame trước.
    - Thở chỉ bật ở `idle`: Spine/Chest xoay X ± 1.5°, chu kỳ 4 giây; vai ± 1°.
- Góc cụ thể do người thực hiện chọn, phải qua test hướng dưới đây:
  - `idle`: tay buông chéo xuống khoảng 70°, khuỷu hơi cong.
  - `armRaise`: tay trái giơ lên.
  - `elbowBend`: hai khuỷu gập 100° ra trước.
  - `kneeBend`: gối trái gập 90°, cẳng chân ra sau.
  - `legRaise`: đùi trái đá ra trước 70°.
  - `torsoTwist`: Spine + Chest xoay Y tổng 45°.
  - `headTurn`: Neck + Head xoay Y tổng 60°.

- [ ] **Step 1: Viết test thất bại** (áp pose bằng `setPose(id, 0)` + `update(0)`, đọc vị trí world)
  - `tpose`: mọi quaternion = bind.
  - `armRaise`: `LeftHand.y > LeftUpperArm.y + 0.3`.
  - `elbowBend`: `LeftHand.z > LeftLowerArm.z + 0.1` (cẳng tay ra trước).
  - `kneeBend`: `LeftFoot.z < LeftLowerLeg.z − 0.1` (cẳng chân ra sau).
  - `legRaise`: `LeftLowerLeg.z > LeftUpperLeg.z + 0.1`.
  - `torsoTwist`: góc xoay Y của Chest so với Hips ≈ 45° (±2°).
  - `headTurn`: chỉ Neck và Head khác bind.
  - **Review Focus #3:** 200 lần `setPose(random, random 0–0.5s)`, mỗi lần chạy 1–20 lần `update(random dt)`, xen kẽ chỉnh tay quaternion vài bone. Sau đó `setPose('tpose', 0)`, `update(0)`, `resetToBindPose`: mọi quaternion = bind (1e-6), mọi vị trí local = bind (1e-9).
  - Bật thở 10 giây ở `idle`, đo tại t = 0 và t = 8 s (đúng 2 chu kỳ): quaternion Spine bằng nhau (1e-6).
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết ba file.
- [ ] **Step 4:** Chạy. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(animation): test poses and drift-free pose animator`.

### Task 12: RigValidator và Rig Test Scene

**Files:**
- Create: `src/game/character/rigging/RigValidator.ts`, `src/game/character/debug/RigDebugPanel.ts`
- Modify: `src/preview/PreviewApp.ts` (gắn PoseAnimator, panel, param `pose`)
- Test: `tests/rigging/RigValidator.test.ts`

**Interfaces:**
- Produces:
  - `validateRig(instance: CharacterInstance): RigCheck[]` với `interface RigCheck { id: RigCheckId; label: string; pass: boolean; detail: string }`.
    - `RigCheckId` = `'bone-count'|'bone-names'|'hierarchy'|'skin-attributes'|'max-influences'|'weights-normalized'|'indices-valid'|'body-height'|'bind-pose'`.
    - `label` tiếng Việt.
    - `detail` khi fail nêu ví dụ cụ thể, như `vertex 1234: tổng 0.500`.
    - `body-height` đo bbox của thân ở bind pose (dùng `getVertexPosition` sau khi reset), so với `proportions.height` (±0.01).
  - `createRigDebugPanel(gui: GUI, instance: CharacterInstance, animator: PoseAnimator, hooks: { onOverlay(o: { skeleton: boolean; joints: boolean; labels: boolean; weights: boolean }): void }): void`
    - Thư mục "Rig" trong lil-gui: chọn bone (20 tên), slider X/Y/Z −180..180°, nút "Reset bind pose".
    - Kéo slider thì tắt animator cho bone đó cho tới khi reset hoặc đổi pose.
    - Thư mục "Tư thế": 8 nút.
    - Thư mục "Hiển thị": skeleton/joints/labels/weights.

- [ ] **Step 1: Viết test thất bại**
  - Kestrel: mọi check pass. Đủ 9 id.
  - Ghi `skinWeight[4·7] = 0.5` (vertex 7) → `weights-normalized` fail, `detail` chứa `7`.
  - Ghi `skinIndex[0] = 25` → `indices-valid` fail.
  - Đổi tên một bone → `bone-names` hoặc `hierarchy` fail.
  - Để bone đang xoay → `bind-pose` fail. Sau `resetToBindPose` → pass.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết hai file và gắn vào preview.
- [ ] **Step 4:** Chạy test + typecheck. Kỳ vọng: PASS.
- [ ] **Step 5:** Ảnh M5: cho mỗi pose trong 7 tư thế thử (trừ idle), chụp `stage=full&pose=<id>` front và side; chụp thêm `stage=skinned&pose=<id>&overlay=wireframe` cận vai/khuỷu/gối/hông cho armRaise, elbowBend, kneeBend, legRaise (dùng `zoom`). Chạy `npm run snapshot -- m5`.
- [ ] **Step 6:** Tự soi ảnh theo tiêu chí ở mục 6.2 của `quy-trinh.md`: không rách mesh, không kéo dài bất thường, không xoắn, trang bị không xuyên thân rõ rệt. Lỗi nào thấy được thì sửa weight hoặc ring trước khi gửi.
- [ ] **Step 7:** Commit `feat(rigging): rig validator and rig test panel`.
- [ ] **Step 8: Dừng duyệt M5.** Gửi ảnh từng tư thế + kết quả rig check + danh sách chỗ còn chưa đẹp (nếu có). Chờ đồng ý.

---

# M6 – Xuất GLB và import kiểm tra

### Task 13: Exporter, importer, so sánh

**Files:**
- Create: `src/game/character/export/CharacterSummary.ts`, `export/CharacterExporter.ts`, `export/CharacterImporter.ts`, `src/game/character/runtime/CharacterAssetRegistry.ts`
- Modify: `src/preview/PreviewApp.ts` (nút lil-gui "Xuất GLB" + bảng kết quả trong console và panel)
- Test: `tests/export/roundtrip.test.ts` (dòng đầu `// @vitest-environment happy-dom`)

**Interfaces:**
- Produces:
  - `summarizeCharacter(root: THREE.Object3D): CharacterSummary` với `interface CharacterSummary { boneNames: string[] /* theo thứ tự skeleton */; bodyVertexCount: number; hasSkinAttributes: boolean; equipment: { name: string; parent: string }[] /* sắp theo name */; sockets: { name: string; parent: string }[]; materialCount: number /* số material khác nhau toàn cây */; bodyHeight: number; metadata: { id: string; version: number } | null; helperCount: number }`.
    - Tìm body theo tên `Body`. Tìm trang bị theo tiền tố `equip:`, socket theo tiền tố `socket:`.
    - `metadata` lấy từ `root.userData`; với GLB import lại thì từ `userData` của node gốc, vì GLTFLoader đổi `extras` thành `userData`.
  - `compareSummaries(a: CharacterSummary, b: CharacterSummary): string[]`: mỗi khác biệt là một dòng tiếng Việt. Mảng rỗng là khớp. `bodyHeight` so sai số 1e-4.
  - `exportCharacterGlb(hero: HeroDefinition): Promise<{ buffer: ArrayBuffer; summary: CharacterSummary }>`
    - **Luôn dựng instance mới** bằng `buildCharacter(hero)` ở bind pose, không dùng instance đang hiển thị.
    - `GLTFExporter.parseAsync(root, { binary: true, onlyVisible: false })`.
  - `importCharacterGlb(buffer: ArrayBuffer): Promise<THREE.Object3D>`: `GLTFLoader.parseAsync`, trả node gốc có tên = hero id.
  - `downloadGlb(name: string, buffer: ArrayBuffer): void`: tạo Blob và kích hoạt tải về `<id>.glb`.
  - `class CharacterAssetRegistry { register(asset: CharacterAsset): void; get(id: string): CharacterAsset | undefined; list(): string[] }`, `interface CharacterAsset { id: string; model: THREE.Group; skeleton?: THREE.Skeleton; animations: THREE.AnimationClip[] }` đúng như mục 7.1 của `quy-trinh.md`.

- [ ] **Step 1: Viết test thất bại**
  - `exportCharacterGlb(kestrel)` → `importCharacterGlb` → `compareSummaries(gốc, nhập lại)` trả `[]`.
  - Summary nhập lại có 20 bone đúng thứ tự, `metadata.id === 'kestrel'`, `hasSkinAttributes`, 8 trang bị có parent đúng như bản gốc, `helperCount === 0`.
  - **Review Focus #4:** dựng một instance hiển thị, gọi `setWeightView(inst, 'Chest')`, bật wireframe trên mọi material, thêm `createSkeletonDebug(inst.rig).group` vào `inst.root`. Sau đó gọi `exportCharacterGlb(kestrel)` → import lại: không có material nào là MeshBasicMaterial, không material nào `wireframe`, `helperCount === 0`.
  - Nếu GLTFExporter không chạy được trong happy-dom (thiếu FileReader/Blob), thêm polyfill tối thiểu trong `tests/setup/fileReader.ts`. Không được bỏ test.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các module. Nút "Xuất GLB" ở preview: tải file về, rồi import lại và in bảng so sánh.
- [ ] **Step 4:** Chạy test + typecheck. Kỳ vọng: PASS.
- [ ] **Step 5:** Bấm nút trong trình duyệt thật (Playwright hoặc tay), xác nhận tải được `kestrel.glb` và bảng so sánh rỗng. Ghi kích thước file.
- [ ] **Step 6:** Commit `feat(export): GLB export with re-import validation and asset registry`.
- [ ] **Step 7: Dừng duyệt M6.** Gửi file `kestrel.glb` (đường dẫn), bảng so sánh, gợi ý chủ dự án có thể mở thử bằng một trình xem glTF bất kỳ. Chờ đồng ý.

---

# M7 – Trang showcase

### Task 14: Giao diện showcase

**Files:**
- Create: `src/showcase/{ShowcaseApp,HeroList,HeroInfoCard,ControlsPanel,RigChecksView,ExportPanel}.ts`, `src/showcase/styles.css`
- Modify: `src/main.ts` (`/` → ShowcaseApp; `?preview=1` → PreviewApp; ShowcaseApp cũng đọc `hero`, `pose`, `view`, `overlay` qua `parsePreviewParams`)
- Test: `tests/showcase/HeroList.test.ts`, `tests/showcase/RigChecksView.test.ts` (happy-dom)

**Interfaces:**
- Consumes: `loadHeroRegistry`, `buildCharacter`, `PoseAnimator`, `validateRig`, `exportCharacterGlb`, `importCharacterGlb`, `compareSummaries`, `setWeightView`, `createSkeletonDebug`, `Viewport`.
- Produces (mỗi view là một hàm dựng DOM thuần, trả phần tử + hàm cập nhật):
  - `renderHeroList(entries: RegistryEntry[], selectedId: string | null, onSelect: (id: string) => void): HTMLElement`: hero ok hiện tên, vai trò và chấm màu accent. Hero lỗi hiện thẻ đỏ "Lỗi dữ liệu" với danh sách `path: message`, không chọn được.
  - `renderHeroInfo(hero: HeroDefinition): HTMLElement`.
  - `renderControls(state: ControlsState, handlers: ControlsHandlers): HTMLElement` với `interface ControlsState { pose: PoseId; skeleton: boolean; wireframe: boolean; weights: boolean; weightBone: BoneName; equipment: boolean }`. Nhãn tư thế tiếng Việt: Đứng thở, T-Pose, Giơ tay, Gập khuỷu, Gập gối, Nâng chân, Xoay thân, Xoay đầu.
  - `renderRigChecks(checks: RigCheck[]): HTMLElement`: ✓/✗ + label, detail hiện khi fail.
  - `renderExportPanel(onExport: () => Promise<{ fileName: string; diffs: string[] }>): HTMLElement`: hiện "Đang xuất…", rồi "Khớp hoàn toàn" hoặc danh sách khác biệt.
- Bố cục theo mục 6.6 của spec:
  - Grid 3 cột `260px 1fr 340px`. Dưới 900px chuyển sang 1 cột (khung 3D cao 60vh ở trên).
  - Biến CSS `--accent` lấy từ `palette.accent` của hero đang chọn. Nền `#0f1115`, chữ `#e6e8eb`.
  - Panel chỉnh bone lil-gui (Task 12) đặt nổi ở góc khung 3D, mặc định thu gọn.
  - Chọn hero mới: dispose instance cũ (geometry/material), dựng instance mới, đặt camera theo `hero.showcase`, áp `defaultPose`.

- [ ] **Step 1: Viết test thất bại**
  - `renderHeroList` với một entry ok và một entry lỗi: có 2 thẻ; thẻ lỗi chứa text `/proportions/height`; click thẻ lỗi không gọi `onSelect`, click thẻ ok gọi `onSelect('kestrel')`.
  - `renderRigChecks` với một check fail: có 1 phần tử `.fail` chứa detail.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các module và CSS.
- [ ] **Step 4:** Chạy test + typecheck + build. Kỳ vọng: PASS.
- [ ] **Step 5:** Ảnh M7: trang showcase 1440×900 ở idle; bật bộ xương; xem weight Chest; màn hẹp 800×1000; trang có thêm một hero hỏng tạm thời (tạo file `heroes/broken/hero.json` lúc chụp, xoá sau khi chụp, không commit). Chạy `npm run snapshot -- m7`.
- [ ] **Step 6:** Commit `feat(showcase): hero showcase page`.
- [ ] **Step 7: Dừng duyệt M7.** Gửi ảnh + hướng dẫn `npm run dev`. Chờ đồng ý.

---

# M8 – Template tái sử dụng

### Task 15: Template, hướng dẫn và hero thử

**Files:**
- Create: `templates/hero-template.json`, `templates/HERO_TEMPLATE.md`, `heroes/granite/hero.json`, `README.md`
- Modify: `templates/body-presets/*.json` (chốt giá trị sau duyệt M2), `templates/hero.schema.json` (soát lại description)
- Test: `tests/templates/templates.test.ts`

**Nội dung:**
- `hero-template.json`:
  - `$schema: "../../templates/hero.schema.json"` (đúng khi file đã được copy vào `heroes/<id>/`; ghi rõ trong hướng dẫn);
  - `id: "new-hero"`, profile mẫu, body = preset `athletic`, palette 5 vai trò;
  - 3 trang bị minh hoạ cú pháp (một plate, một band, một box) + một socket.
- `HERO_TEMPLATE.md` (tiếng Việt):
  - các bước: copy → đổi `id` trùng tên thư mục → chọn preset → chỉnh → `npm run dev` → xem rig check → xuất GLB;
  - bảng mọi trường kèm đơn vị và khoảng giá trị (khớp schema);
  - bảng quy ước trục của part (Task 6) có hình minh hoạ ASCII;
  - giải thích t / angleDeg / standoff;
  - cách dùng từng kiểu trang bị, mỗi kiểu có ví dụ;
  - các lỗi hay gặp kèm thông báo lỗi tương ứng.
- `granite`: hero thử theo preset `heavy`, palette khác hẳn (đất nung + đồng). Trang bị khác Kestrel: giáp vai cả hai bên kiểu nhiều lớp to, mũ có ô mặt hở `faceOpeningDeg 120` và gờ cao, khiên lưng bằng assembly, đai bụng band. Tên và thiết kế gốc.
- `README.md`: cách chạy (`npm install`, `npm run dev`, `npm test`, `npm run snapshot -- <m>`), cấu trúc thư mục, link tới `HERO_TEMPLATE.md`.

- [ ] **Step 1: Viết test thất bại**
  - `hero-template.json` qua `validateHero`. `buildCharacter` của nó qua mọi `validateRig`.
  - Mỗi preset ghép vào template: validate ok, `buildCharacter` ok, mọi rig check pass.
  - `granite`: validate ok, mọi rig check pass, export→import khớp.
  - Mọi thuộc tính lá trong schema đều có `description` không rỗng (duyệt đệ quy).
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết các file. Không sửa file `.ts` nào trong `src/` ở task này. Nếu buộc phải sửa vì lỗi, dừng lại và báo chủ dự án, vì điều đó nghĩa là template chưa đủ.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck && npm run build`. Kỳ vọng: PASS. Kiểm tra `git diff --stat src/` rỗng.
- [ ] **Step 5:** Ảnh M8: showcase chọn Granite (idle, front + threeQuarter), Granite ở `pose=armRaise` và `kneeBend`, ảnh Kestrel và Granite đứng cạnh nhau (`?preview=1&lineup=heroes`). Chạy `npm run snapshot -- m8`.
- [ ] **Step 6:** Commit `feat(templates): reusable hero template, guide, presets, Granite test hero`.
- [ ] **Step 7: Dừng duyệt M8.** Gửi ảnh + đường dẫn `templates/hero-template.json` và `templates/HERO_TEMPLATE.md`. Hỏi chủ dự án giữ hay xoá Granite. Sau khi chủ dự án đồng ý, chuyển sang superpowers:finishing-a-development-branch.
