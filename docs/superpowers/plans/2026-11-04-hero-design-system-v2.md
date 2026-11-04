# Hero Design System v2 – Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng pipeline hero lên V2 theo phạm vi MVP ở mục 12.1 của spec, cộng bộ tư thế cầm súng cho game TPS shooter (yêu cầu bổ sung của chủ dự án). Gồm:
- định nghĩa V2 và bản chuẩn hoá (normalized);
- chuyển V1 sang V2;
- preset dáng người, bevel, giáp nhiều lớp;
- thư viện vật liệu PBR, ánh sáng studio;
- tư thế kiểm tra va chạm, xuất GLB giữ vật liệu;
- tư thế cầm súng: súng trường và súng ngắn, ngắm, ngắm lên/xuống, bắn từ hông, ngồi ngắm.

Mọi hero V1 hiện có phải render giống hệt như trước.

**Architecture:**
- Mọi `hero.json` (V1 hoặc V2) đi qua cùng một luồng: phát hiện version → kiểm tra schema tương ứng → chuẩn hoá thành `NormalizedHero` → kiểm tra luật ngữ nghĩa trên bản chuẩn hoá.
- Toàn bộ modeling, rigging, renderer và export chỉ nhận `NormalizedHero`.
- Bản chuẩn hoá chứa số liệu cụ thể (vật liệu đã resolve, số segment, bevel), không chứa tên preset cần tra tiếp.
- Tương thích V1 được khoá bằng "dấu vân tay" hình học và vật liệu (Task 1). Mọi task sau phải giữ dấu vân tay này, trừ khi có ruling ghi lý do.
- Code mới nằm trong cây `src/game/character/` hiện có. Không chuyển sang `src/hero-system/`, vì spec dặn không giả định cấu trúc thư mục đề xuất và không refactor quá rộng.

**Tech Stack:** giữ nguyên v1, không thêm dependency.
- Vite 8, TypeScript strict, three 0.187. Addon mới dùng: `RoomEnvironment`, `PMREMGenerator`.
- ajv, vitest, happy-dom, Playwright.
- Script node gọi code TS qua `runnerImport` của Vite.

**Spec:** `docs/superpowers/specs/herov2.md`. Hệ thống nền là v1: spec `docs/superpowers/specs/2026-11-04-hero-showcase-design.md` và plan `docs/superpowers/plans/2026-11-04-hero-showcase.md`. Người thực hiện đọc spec v2 và lướt plan v1.

> **Cập nhật 2026-11-04:** V2-M1 trở đi chỉ bắt đầu sau khi xong plan `docs/superpowers/plans/2026-11-04-anatomical-body-system.md`. Khi đó áp dụng mục "Điều chỉnh plan V2" trong `docs/superpowers/roadmap.md`, ghi thành ruling trong ledger.

## Global Constraints

**Repo và quy trình**
- Thư mục dự án: `/Users/minhduc/Desktop/Duan/Deadlock`. Làm trên nhánh `feat/hero-v2`, tách từ `feat/hero-showcase`, vì nhánh v1 chưa merge.
- Sau **mỗi milestone (V2-M0 … V2-M7)** phải dừng, gửi ảnh chụp và tóm tắt tiếng Việt cho chủ dự án, chỉ làm tiếp khi được đồng ý. Spec mục 14 cũng yêu cầu: "Wait for approval before beginning the next major phase".
- Commit message kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Tương thích V1**
- "V2 không được làm mất khả năng sử dụng hero V1. Các hero hiện tại phải tiếp tục render được mà không bắt buộc phải viết lại JSON."
- Không tự ghi đè file V1. Chỉ `heroes:migrate -- --write` mới được ghi, và phải tạo bản lưu `hero.v1.json` trước.
- `heroes/morrow/hero.json` là file của chủ dự án: không sửa.

**Hệ toạ độ và rig**
- Hệ toạ độ giữ nguyên: +Y lên, nhân vật nhìn +Z, **+X là bên trái nhân vật**, +Z tại socket là pháp tuyến hướng ra ngoài thân.
- Skeleton giữ đúng 20 bone, tên và cây như v1. Rig validation phải đạt 9/9 cho mọi hero.
- `radialSegments` của thân phải là bội số của 8.

**Code**
- Không dùng `any`. Không có số liệu riêng của một hero trong file `.ts`.
- Renderer không biết tên hero nào.
- Builder không import từ `renderer/`.
- Không thêm trường schema khi chưa có code dùng nó (spec: "Avoid speculative schema fields that have no renderer implementation").
- Không tạo vật liệu mới cho mỗi mesh khi cấu hình giống nhau. Không merge geometry thuộc bone khác nhau.

**Văn bản**
- Thông báo lỗi và chữ trên giao diện bằng tiếng Việt, có đường dẫn JSON-pointer.
- Mô tả hero dùng từ trung tính về giới.

## Phạm vi

**Làm:** đủ 9 mục MVP ở spec mục 12.1, cộng các mục mà checklist nghiệm thu (mục 13) cần:
- camera theo bounding box;
- tư thế crouch / arms forward / nâng chân phải;
- test va chạm theo tư thế;
- cache dựng lại;
- kiểm tra rò tài nguyên;
- ngân sách hiệu năng;
- CLI validate/migrate;
- chuyển Kestrel sang V2;
- **tư thế cầm súng TPS** (yêu cầu bổ sung): khai báo vũ khí cầm tay, IK hai tay, 7 tư thế súng (V2-M6).

**Không làm đợt này:** những mục spec ghi "có thể triển khai sau":
- cable, piston, khớp cơ khí;
- engraving, decal, bolt, ornament, surface detail;
- LOD;
- equipment registry;
- bloom;
- tư thế cận chiến (búa, khiên), bone ngón tay, animation clip (ngắm, nạp đạn, chạy): tay vẫn là khối bàn tay không ngón như v1.

## Quyết định thiết kế đã chốt trong plan (chủ dự án duyệt cùng plan)

1. **`design.detailLevel`, `geometrySettings.surfaceDetail`, `smoothness`, `lod` chưa vào schema.** Chưa có code nào dùng chúng, và spec cấm trường "suông". Khi làm surface detail hoặc LOD thì thêm sau.
2. **Thân vẫn là một lưới liền khối (`UnifiedBody`)**, không tách `buildHead/buildArm…` như spec mục 3.3. Tách ra sẽ mở lại khe hở ở khớp, mà khe hở chính là lỗi v1 đã sửa. Spec muốn "các bộ phận dùng chung một thuật toán tiết diện"; điều này đã đúng với `BodySurface.ringAt`.
3. **Ánh sáng có hai preset:**
   - `studio`: environment map + ACES + key/fill/rim, là mặc định cho mọi hero, cả V1, để cả trang có chất lượng đồng nhất;
   - `legacy`: đúng ánh sáng v1.

   So sánh ảnh hồi quy chạy với `lighting=legacy`, để chứng minh dữ liệu và hình học V1 không đổi.
4. **V1 được chuẩn hoá với số liệu "legacy" tường minh:**
   - vật liệu dùng đúng metalness / roughness / emissive như v1;
   - `curveSegments` là 12;
   - bevel tắt.

   Nhờ vậy hero V1 không đổi một đỉnh nào.
5. **Khoảng cách camera** = max(`showcase.camera.distance` nếu có, khoảng cách vừa khít bounding box), để vũ khí dài không bị cắt khung.
6. **Vai trò màu V2 không khai báo trong `materials`** dùng preset `matte-fabric`.
7. **Tư thế súng tính theo kích thước của từng hero, không dùng góc khớp cố định.**
   - Mỗi tư thế đặt vị trí súng theo khung bone Chest và các mốc của layout (vai phải, mắt, hông).
   - Hai cánh tay giải bằng IK hai đoạn để tay phải cầm báng, tay trái đỡ ốp lót tay.
   - Như vậy hero vạm vỡ, mảnh khảnh hay tay ngắn đều cầm súng khớp, không cần chỉnh tay cho từng hero.
8. **Súng được khai báo trên chính món trang bị** (trường `weapon` của assembly/box, chỉ có ở V2).
   - Trong tư thế súng, món đó rời socket cất (lưng, hông) để lên tay; bỏ tư thế súng thì trả về chỗ cũ.
   - Hero không có súng (Granite, Morrow, mọi hero V1): các nút tư thế súng bị khoá, kèm lời nhắc.
   - Quy ước toạ độ súng: nòng theo +Z cục bộ, mặt trên +Y, khớp với quy ước primitive v1 ("mũi nhọn về +Z").

## Review Focus

1. **Hero V1 chỉ đổi `"version": 2`** → chỉ vài lỗi tiếng Việt dễ hiểu, đứng đầu là "thiếu trường bắt buộc design". Không được ra hàng chục lỗi. Test ở Task 4.
2. **Hero tay ngắn hoặc dáng người khác (slim, feminine, heavy) cầm súng** → hai tay vẫn chạm đúng báng và ốp lót tay, không có tay "với không tới" hay khuỷu bẻ ngược. Test ở Task 14 và 15.
3. **`bodyPreset: "custom"` mà thiếu một phần `proportions`** → lỗi chỉ đúng trường thiếu, không crash khi dựng. Test ở Task 4.
4. **Đổi qua lại giữa các hero nhiều lần trên showcase** (kể cả khi đang bật xem weight) → mọi geometry và vật liệu đã tạo đều được giải phóng. Test ở Task 11.
5. **Hero mang vũ khí dài vượt quá chiều cao thân** → mọi góc camera đều thấy trọn vũ khí. Test ở Task 10.

## Cấu trúc file (mới hoặc sửa chính)

```
scripts/gen-schema.mjs                 sinh templates/hero.schema.json (V1) và hero-v2.schema.json (chuyển từ scratchpad vào repo)
scripts/visual-compare.mjs             so ảnh snapshots/<set> với tests/visual/baseline/<set>
scripts/heroes.mjs                     npm run heroes:validate | heroes:migrate | heroes:bench (runnerImport → tools/*)
src/game/character/
  definitions/NormalizedHero.ts        MaterialSpec, GeometrySpec, ShowcaseSpec, NormalizedHero
  definitions/v2/HeroDefinitionV2.ts   kiểu dữ liệu file V2
  definitions/v2/validateHeroV2.ts     ajv cho schema V2 (dùng chung bộ dịch lỗi tiếng Việt)
  definitions/semanticChecks.ts        luật ngữ nghĩa, chạy trên NormalizedHero
  definitions/loadHero.ts              phát hiện version → validate → normalize → semantic
  definitions/geometryProfiles.ts      low-poly / hybrid / high-detail
  definitions/BodyPresetResolver.ts    preset + override (deep merge, mảng thay nguyên)
  migration/fromV1.ts, fromV2.ts       → NormalizedHero
  migration/V1ToV2.ts                  file V1 → file V2 (cho heroes:migrate)
  modeling/materials/presets/          metals.ts, fabrics.ts, leather.ts, ceramics.ts, energy.ts, glass.ts, index.ts
  modeling/materials/MaterialResolver.ts   thay MaterialBuilder.ts
  modeling/geometry/GeometryValidation.ts
  modeling/equipment/LayeredArmor.ts
  renderer/LightingSetup.ts, CameraSetup.ts, CharacterRenderer.ts, HeroBuildCache.ts
  debug/PoseClipping.ts
  animation/TwoBoneIK.ts               IK giải tích hai đoạn (cánh tay trên + cẳng tay) có pole
  animation/WeaponRig.ts               lấy súng lên tay / cất lại, khung báng và ốp lót tay
  animation/GunPoses.ts                7 tư thế súng: vị trí súng trong khung Chest + xoay thân/đầu
  tools/heroesCli.ts, tools/bench.ts   chỉ chạy trong node
tests/helpers/fingerprint.ts, tests/fixtures/v1-baseline.json, tests/visual/baseline/
```

---

## V2-M0 — Baseline và tương thích (spec Phase 0)

### Task 1: Dấu vân tay V1, schema generator trong repo, báo cáo audit

**Files:**
- Create: `scripts/gen-schema.mjs`. Lấy nguyên nội dung từ `/private/tmp/claude-502/-Users-minhduc/7ae883c0-03f0-482c-af68-390154aacb7b/scratchpad/genschema.mjs`. Thêm `"schema": "node scripts/gen-schema.mjs"` vào `package.json`; lệnh này không nhận đối số và ghi vào `templates/`.
- Create: `tests/helpers/fingerprint.ts`, `tests/regression/v1Parity.test.ts`, `tests/fixtures/v1-baseline.json`.
- Create: `docs/superpowers/reports/2026-11-04-herov2-audit.md`.
- Modify: `tests/templates/templates.test.ts`.

**Interfaces:**
- Produces: `fingerprintCharacter(instance: CharacterInstance): HeroFingerprint`. Các trường:
  - `bodyVertexCount`;
  - `bodyPositionHash`;
  - `skinWeightHash`;
  - `bbox` (bind pose);
  - `bones: {name, world: Vec3}[]`;
  - `equipment: {name, parent, vertexCount, positionHash}[]`;
  - `materials: {name, color, metalness, roughness, emissive, emissiveIntensity, flatShading}[]`.

  Hash phải **không phụ thuộc thứ tự đỉnh và cách chia mesh**: Σ(x + 1.37y + 1.91z) qua mọi đỉnh, làm tròn 1e-4. Nhờ vậy Task 13 có thể merge mesh mà dấu vân tay không đổi. Màu ghi dạng hex sRGB.
- Produces: `UPDATE_BASELINE=1 npx vitest run tests/regression` ghi lại `v1-baseline.json`.

- [ ] **Step 1: Test schema sinh ra trùng file đã commit.** Thêm vào `templates.test.ts`: chạy `gen-schema.mjs` ra thư mục tạm, kết quả bằng từng byte với `templates/hero.schema.json`.
- [ ] **Step 2:** Chạy `npx vitest run tests/templates`. Expected: PASS, vì generator đã sinh ra file hiện có. Nếu FAIL thì sửa generator cho khớp, không sửa schema.
- [ ] **Step 3: Viết `v1Parity.test.ts`.** Với mỗi hero V1 trong `heroes/*/hero.json` cộng 4 preset (`SAMPLE_HEROES`): `fingerprintCharacter(buildCharacter(hero))` phải toEqual mục cùng id trong `v1-baseline.json`. Thiếu mục thì báo lỗi "chưa có baseline cho <id>".
- [ ] **Step 4:** Chạy test. Expected: FAIL "chưa có baseline".
- [ ] **Step 5:** Viết `fingerprint.ts`, chạy `UPDATE_BASELINE=1 npx vitest run tests/regression`, rồi chạy lại không có biến môi trường. Expected: PASS hai lần liên tiếp, tức kết quả tất định.
- [ ] **Step 6: Viết báo cáo audit.** Gồm ba phần:
  1. bảng ánh xạ module spec mục 1.2/11 → file hiện có;
  2. các interface công khai (`buildCharacter`, `validateHero`, `loadHeroRegistry`, `exportCharacterGlb`, `summarizeCharacter`, `POSES`);
  3. rủi ro tương thích:
     - `ColorSpec` hai dạng;
     - `ROUND_SEGMENTS = 12`;
     - RoundedBox cố định 2 segment;
     - lớp giáp xếp theo độ dày đều;
     - Viewport tự tạo đèn;
     - `version` const 1 trong schema;
     - `tests/fixtures/kestrel.ts` import trực tiếp `heroes/kestrel/hero.json`.

  Kèm bảng 12 lỗi nhỏ còn hoãn từ v1, mỗi lỗi ghi task V2 nào sẽ đụng tới.
- [ ] **Step 7:** Chạy `npm test && npm run typecheck`, rồi commit `test(v2): lock V1 geometry/material fingerprint; schema generator in repo; audit`.

### Task 2: Ảnh baseline, công cụ so ảnh, đo hiệu năng ban đầu

**Files:**
- Create: `scripts/visual-compare.mjs`, `scripts/heroes.mjs`, `src/game/character/tools/bench.ts`, `docs/superpowers/reports/herov2-bench-baseline.md`, `tests/visual/baseline/v2-baseline/*.png`.
- Modify: `scripts/shots.config.json`, `package.json`.

**Interfaces:**
- Produces: `node scripts/visual-compare.mjs <set> [--accept]`.
  - Nạp từng cặp PNG vào canvas trong trang Playwright và tính tỷ lệ điểm ảnh có kênh lệch > 8/255.
  - Lệnh **thất bại khi tỷ lệ > 0.5%** hoặc khi thiếu ảnh.
  - `--accept` chép ảnh mới vào baseline.
- Produces: `runBench(heroes: NormalizedHero[] | HeroDefinition[], runs = 5): BenchRow[]`. Mỗi `BenchRow` gồm `{ id, triangles, drawCalls, uniqueMaterials, firstBuildMs, medianRebuildMs }`.
  - drawCalls = Σ số group của mỗi mesh (tối thiểu 1).
  - Lệnh chạy: `npm run heroes:bench`, in bảng markdown.
- Produces: `scripts/heroes.mjs <validate|migrate|bench> [...]`. Gọi `runnerImport('/src/game/character/tools/heroesCli.ts')` của Vite. Task 2 chỉ cần nhánh `bench`.

- [ ] **Step 1: Thêm bộ ảnh `v2-baseline`.**
  - Kestrel, Granite, Morrow × front/threeQuarter/side/back, query `preview=1&hero=<id>&stage=full&view=<v>&lighting=legacy`.
  - Kestrel thêm các pose `armRaise`, `kneeBend`, `torsoTwist`.
  - Lineup `preview=1&lineup=presets&stage=full&view=front&lighting=legacy`.
- [ ] **Step 2:** Chạy `npm run snapshot -- v2-baseline`, rồi `node scripts/visual-compare.mjs v2-baseline --accept`. Chạy lại snapshot và `visual-compare` không có `--accept`. Expected: mọi ảnh lệch 0.00%. Lần chạy này chứng minh swiftshader cho ảnh tất định; nếu ảnh không tất định thì nâng ngưỡng kênh và ghi ruling.
- [ ] **Step 3:** Viết `bench.ts` và nhánh `bench`. Chạy `npm run heroes:bench > docs/superpowers/reports/herov2-bench-baseline.md`. Expected: một dòng cho mỗi hero. Ghi vào ledger hero nào vượt ngân sách: > 45k tam giác, > 100 draw call hoặc > 16 vật liệu. Task 13 dùng con số này.
- [ ] **Step 4:** Commit `chore(v2): visual baseline, image compare, benchmark baseline`.

**→ Dừng V2-M0.** Gửi chủ dự án:
- ảnh `snapshots/v2-baseline/`;
- bảng bench;
- tóm tắt audit.

---

## V2-M1 — Định nghĩa V2 và chuyển đổi (spec Phase 1)

### Task 3: `NormalizedHero` và bộ chuẩn hoá V1; mọi nơi dùng bản chuẩn hoá

**Files:**
- Create: `definitions/NormalizedHero.ts`, `migration/fromV1.ts`, `tests/migration/fromV1.test.ts`.
- Modify:
  - `modeling/CharacterModelBuilder.ts`, `modeling/materials/MaterialBuilder.ts`;
  - `runtime/CharacterFactory.ts`, `runtime/HeroRegistry.ts`;
  - `definitions/presets.ts` (`applyPreset` nhận và trả `NormalizedHero`);
  - `export/*`;
  - `src/showcase/*`, `src/preview/*`;
  - `tests/helpers/heroes.ts`, `tests/fixtures/kestrel.ts`.

**Interfaces:**
- Produces, trong `NormalizedHero.ts`:
  ```ts
  export interface MaterialSpec {
    type: 'standard' | 'physical'; color: string; metalness: number; roughness: number;
    emissiveIntensity: number; emissiveColor?: string;
    clearcoat?: number; clearcoatRoughness?: number; opacity?: number;
  }
  export interface GeometrySpec { radialSegments: number; curveSegments: number; bevel: { enabled: boolean; segments: 1 | 2 | 3; size: number } }
  export interface ShowcaseSpec { pose: PoseId; camera: { azimuthDeg: number; elevationDeg: number; distance?: number }; lighting: LightingPreset }
  export type LightingPreset = 'studio' | 'legacy';
  export type GeometryProfileName = 'low-poly' | 'hybrid' | 'high-detail';
  export interface NormalizedHero {
    id: string; sourceVersion: 1 | 2; profile: HeroProfile;
    design: { style: 'stylized'; bodyPreset: BodyPresetName | 'custom'; geometryProfile: GeometryProfileName };
    proportions: CharacterProportions; bodyShape: BodyShape;
    /** Theo vai trò màu; ref "#RRGGBB" không có trong đây dùng fallbackMaterial + màu đó. */
    materials: Record<string, MaterialSpec>;
    fallbackMaterial: Omit<MaterialSpec, 'color'>;
    bodyPaint: Record<BodyPart, string>; sockets: SocketDefinition[];
    equipment: EquipmentItem[]; geometry: GeometrySpec; showcase: ShowcaseSpec;
  }
  ```
- Produces: `normalizeV1(hero: HeroDefinition): NormalizedHero`.
  - Màu dạng chuỗi → `{type:'standard', color, metalness:.05, roughness:.7, emissiveIntensity:0}`.
  - Màu dạng object → giữ các số đã khai báo, thiếu thì dùng mặc định trên. `emissive > 0` → `emissiveIntensity = emissive`, `emissiveColor = color`.
  - `fallbackMaterial`: metalness .05, roughness .7.
  - `design`: `{style:'stylized', bodyPreset:'custom', geometryProfile}`. Profile theo radialSegments: 8 → low-poly, 24 → high-detail, còn lại → hybrid.
  - `geometry`: `{radialSegments: bodyShape.radialSegments, curveSegments: 12, bevel: {enabled:false, segments:2, size:0}}`.
  - `showcase`: `{pose: defaultPose, camera:{azimuthDeg, elevationDeg, distance: cameraDistance}, lighting:'studio'}`.
  - Không mutate dữ liệu nguồn.
- Produces: `RegistryEntry` ok = `{ id, ok: true, hero: NormalizedHero }`. `root.userData` = `{ id, version: sourceVersion, profile, materials }`, nên summary metadata vẫn là `{id, version}`.
- `createMaterials(materials, fallback, opts)` thay cho `createMaterials(palette, opts)`; hành vi giữ nguyên. Task 9 sẽ thay hàm này.

- [ ] **Step 1: Viết `fromV1.test.ts`.**
  - Vai trò `skin` của Kestrel: dạng chuỗi → metalness .05, roughness .7.
  - Một vai trò dạng object có `emissive: 2` → `emissiveIntensity` 2, `emissiveColor` bằng color.
  - `geometry.curveSegments === 12`.
  - Nguồn sau khi chuẩn hoá vẫn deep-equal bản chụp `structuredClone` trước đó.
  - Granite có `showcase.camera.distance` đúng giá trị trong file.
- [ ] **Step 2:** Chạy test. Expected: FAIL, chưa có module.
- [ ] **Step 3:** Viết `NormalizedHero.ts` và `fromV1.ts`. Chuyển mọi nơi tiêu thụ sang `NormalizedHero`. Test fixture và helper bọc qua `normalizeV1`; `kestrelJson` (dữ liệu thô) giữ nguyên.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Expected: toàn bộ PASS, **gồm `v1Parity`**.
- [ ] **Step 5:** Commit `refactor(v2): renderer consumes NormalizedHero; V1 normalizer with legacy numbers`.

### Task 4: Schema V2, kiểu dữ liệu, bộ chuẩn hoá V2, preset vật liệu, loader theo version

**Files:**
- Create:
  - `definitions/v2/HeroDefinitionV2.ts`, `definitions/v2/validateHeroV2.ts`;
  - `definitions/semanticChecks.ts`, `definitions/loadHero.ts`;
  - `definitions/geometryProfiles.ts`, `definitions/BodyPresetResolver.ts`;
  - `migration/fromV2.ts`;
  - `modeling/materials/presets/{metals,fabrics,leather,ceramics,energy,glass,index}.ts`;
  - `templates/hero-v2.schema.json` (sinh ra);
  - `tests/definitions/v2.test.ts`, `tests/fixtures/v2-minimal.json`.
- Modify:
  - `scripts/gen-schema.mjs`;
  - `definitions/validateHero.ts`: tách bộ dịch lỗi ajv thành `translateAjvErrors(errors): HeroError[]` dùng chung; luật ngữ nghĩa chuyển sang `semanticChecks.ts`;
  - `runtime/HeroRegistry.ts`: dùng `loadHeroDefinition`.

**Interfaces:**
- Produces: file V2 theo spec mục 2.2, chỉ gồm các trường có code dùng.
  - `version: 2`.
  - `design: { style: "stylized", bodyPreset: athletic|heavy|slim|feminine|custom, geometryProfile: low-poly|hybrid|high-detail }`, bắt buộc.
  - `proportions?`, `bodyShape?`: object con đều tuỳ chọn. Mảng (`sections`, `muscles`) thay nguyên.
  - `palette: Record<string, hex>`.
  - `materials?: Record<role, { preset: MaterialPresetId; overrides?: { metalness?, roughness?, emissiveIntensity?, emissiveColor?: hex, clearcoat?, clearcoatRoughness?, opacity? } }>`.
  - `bodyPaint`, `sockets`, `equipment`: như V1.
  - `geometrySettings?: { bevel?: { enabled: boolean; segments: 1|2|3; size?: 0.001–0.02 }; curveSegments?: 4–32 }`.
  - `showcase: { pose, camera: { azimuth, elevation, distance? }, lightingPreset: "studio"|"legacy" }`.
- Produces: `MATERIAL_PRESETS: Record<MaterialPresetId, Omit<MaterialSpec,'color'>>` với `MaterialPresetId`:

  | Preset | type | metalness | roughness | Khác |
  |---|---|---|---|---|
  | `brushed-metal` | standard | .85 | .35 | |
  | `gunmetal` | standard | .9 | .45 | |
  | `aged-copper` | standard | .75 | .55 | |
  | `leather` | standard | 0 | .8 | |
  | `matte-fabric` | standard | 0 | .9 | |
  | `ceramic` | standard | 0 | .3 | |
  | `energy` | standard | .1 | .25 | emissiveIntensity 2; màu phát sáng = màu palette, trừ khi override |
  | `glass` | physical | 0 | .05 | opacity .45, clearcoat 1, clearcoatRoughness .05 |

  Mỗi file trong `presets/` xuất phần của mình; `index.ts` gộp lại.
- Produces: `GEOMETRY_PROFILES: Record<GeometryProfileName, { radialSegments: 8|16|24; bevelSegments: 1|2|3; curveSegments: 4|8|12 }>` = low-poly {8,1,4}, hybrid {16,2,8}, high-detail {24,3,12}.
- Produces: `resolveBodyPreset(name: BodyPresetName, overrides: { proportions?: DeepPartial<CharacterProportions>; bodyShape?: DeepPartial<BodyShape> }): { proportions; bodyShape }`. Deep merge, mảng thay nguyên, không mutate preset.
- Produces: `normalizeV2(hero: HeroDefinitionV2): NormalizedHero`.
  - `radialSegments` = `bodyShape.radialSegments` khai báo trong hero, không có thì lấy từ profile (không lấy của preset).
  - `bevel.size` mặc định 0.004. `bevel` mặc định `{enabled:true, segments: profile.bevelSegments}`.
  - `curveSegments` = khai báo trong `geometrySettings` hoặc của profile.
  - Vai trò không có trong `materials` dùng `matte-fabric`.
  - `fallbackMaterial` = `matte-fabric`.
- Produces: `loadHeroDefinition(raw: unknown): { ok: true; hero: NormalizedHero } | { ok: false; errors: HeroError[] }`.
  - `version` 1 → luồng V1. `version` 2 → luồng V2. Khác → `{path:'/version', message:'phải là 1 hoặc 2 (đang là …)'}`.
  - Sau khi chuẩn hoá thì chạy `semanticChecks(hero: NormalizedHero): HeroError[]`, gồm các luật v1 cũ:
    - chiều cao;
    - thứ tự sections;
    - ref màu (tra trong `materials`, hoặc là mã hex);
    - id và tên socket duy nhất, socket tồn tại;
    - tEnd > tStart, angleEnd > angleStart;
    - luật side.
  - Đường dẫn lỗi trỏ vào file nguồn.
- `custom` mà thiếu trường nào của proportions/bodyShape thì báo `"<path>: bắt buộc khi design.bodyPreset là \"custom\""` trước khi merge, không để crash.
- Lỗi sai tên preset: `phải là một trong: brushed-metal, gunmetal, …` (dùng nhánh `enum` sẵn có).
- File có `version: 2` nhưng dữ liệu kiểu V1: lọc bớt lỗi để có ≤ 6 lỗi, đứng đầu là `/design` thiếu. Cách lọc: khi `/design` thiếu, bỏ các lỗi `additionalProperties`/`type` của `palette`/`showcase`, thay bằng một dòng "palette/showcase đang theo định dạng V1 — xem HERO_TEMPLATE.md mục V2".

- [ ] **Step 1: Viết `v2.test.ts`.**
  1. `v2-minimal.json` hợp lệ: athletic, hybrid, không có proportions/bodyShape. Kết quả chuẩn hoá: `proportions` toEqual `BODY_PRESETS.athletic.proportions`, `geometry` = `{radialSegments:16, curveSegments:8, bevel:{enabled:true,segments:2,size:0.004}}`.
  2. `geometryProfile: "low-poly"` → radialSegments 8, curveSegments 4.
  3. `bodyShape.radialSegments: 24` thắng profile.
  4. `materials.armor = {preset:'gunmetal'}` → metalness .9, roughness .45, color = `palette.armor`.
  5. Vai trò không khai báo → roughness .9.
  6. Energy → `emissiveColor` = màu palette.
  7. `preset:'gunmetall'` → lỗi path `/materials/armor/preset`, message chứa `gunmetal`.
  8. `custom` không có `proportions.legs` → lỗi path `/proportions/legs`.
  9. Override `proportions.height: 1.5` trên athletic → lỗi chiều cao như v1.
  10. Kestrel V1 sửa `version: 2` → ≤ 6 lỗi, lỗi đầu path `/design`.
  11. `version: 3` → lỗi `/version`.
  12. Mọi hero V1 trong `heroes/` vẫn `ok`.
  13. Schema V2 sinh ra trùng file đã commit.
- [ ] **Step 2:** Chạy `npx vitest run tests/definitions/v2.test.ts`. Expected: FAIL, chưa có module.
- [ ] **Step 3:** Viết code theo Interfaces, chạy `npm run schema`.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Expected: PASS, `v1Parity` vẫn xanh.
- [ ] **Step 5:** Commit `feat(v2): hero-v2 schema, V2 normalizer, material/geometry presets, version-aware loader`.

### Task 5: Chuyển file V1 → V2 và CLI `heroes:validate` / `heroes:migrate`

**Files:**
- Create: `migration/V1ToV2.ts`, `tools/heroesCli.ts`, `tests/migration/V1ToV2.test.ts`, `tests/tools/heroesCli.test.ts`.
- Modify: `scripts/heroes.mjs`, `package.json`: thêm `heroes:validate`, `heroes:migrate`, `heroes:bench`.

**Interfaces:**
- Produces: `migrateV1ToV2(hero: HeroDefinition): { hero: HeroDefinitionV2; notes: string[] }`.
  - `design.bodyPreset: 'custom'`, `geometryProfile` ánh xạ như `normalizeV1`.
  - proportions và bodyShape đầy đủ.
  - `palette` chỉ gồm mã hex.
  - Mỗi vai trò lấy preset gần nhất theo khoảng cách (metalness, roughness), cộng `overrides` để giữ **đúng** số cũ. `notes` ghi "vai trò X: preset Y + overrides giữ nguyên số V1".
  - `geometrySettings: { bevel: { enabled: false, segments: 2 }, curveSegments: 12 }`.
  - `showcase.lightingPreset: 'studio'`.
- Bất biến: `normalizeV2(migrateV1ToV2(h).hero)` deep-equal `normalizeV1(h)`, chỉ trừ `sourceVersion`.
- Produces: `runValidate(heroesDir: string): { id: string; version: number | null; errors: HeroError[] }[]`.
- Produces: `runMigrate(heroesDir: string, opts: { write: boolean; only?: string }): MigrationReport`, với `MigrationReport` = `{ id, status: 'migrated'|'already-v2'|'invalid'|'would-migrate', notes: string[] }[]`.
  - Khi `write`: ghi `hero.v1.json` (bản gốc, giữ nguyên byte) rồi mới ghi `hero.json` V2, JSON thụt 2 dấu cách, `$schema: "../../templates/hero-v2.schema.json"`.
  - Khi không `write`: không ghi gì.
  - `heroes.mjs` in báo cáo dạng bảng tiếng Việt. `heroes:validate` trả exit code 1 khi có lỗi.

- [ ] **Step 1: Viết test.**
  - Bất biến chuyển đổi đúng cho Kestrel, Granite và 4 preset. Kết quả `hero` qua `validateHeroV2`.
  - Thư mục tạm có ba hero: V1 hợp lệ, V1 hỏng, V2.
    - Chạy dry-run: báo cáo là `would-migrate` / `invalid` / `already-v2`, và nội dung cả ba file vẫn giống từng byte.
    - Chạy write: có `hero.v1.json` bằng bản gốc, `hero.json` là V2 hợp lệ.
    - Chạy write lần hai: `already-v2`, không file nào đổi.
    - `only: 'x'` chỉ đụng thư mục `x`.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test`. Chạy `npm run heroes:validate`: Expected in 3 hero, đều "hợp lệ". Chạy `npm run heroes:migrate -- --dry-run`: Expected 3 dòng `would-migrate`, và `git status` không có thay đổi trong `heroes/`.
- [ ] **Step 5:** Commit `feat(v2): V1→V2 file migration with parity guarantee; heroes:validate / heroes:migrate CLI`.

**→ Dừng V2-M1.** Gửi:
- kết quả `visual-compare v2-baseline` (phải 0.00%);
- ảnh showcase bình thường (`lighting` mặc định vẫn là legacy cho tới Task 10);
- báo cáo dry-run;
- ví dụ file V2 tối thiểu.

---

## V2-M2 — Body preset library (spec Phase 1–2)

### Task 6: Preset dáng người qua `design.bodyPreset`; kiểm tra rig, socket và giáp trên mọi preset

**Files:**
- Create: `tests/regression/presetMatrix.test.ts`, `tests/fixtures/v2-presets/{athletic,heavy,slim,feminine}.json`.
- Modify:
  - `src/preview/PreviewApp.ts`: lineup `presets` dựng qua `normalizeV2` từ 4 fixture;
  - `scripts/shots.config.json`: bộ `v2-m2`.

**Interfaces:**
- Consumes: `resolveBodyPreset`, `normalizeV2`, `validateRig` (v1), `createBodyCollider`.
- Test helper mới `heroMatrix(): Array<[string, NormalizedHero]>`: trang bị và socket của Kestrel × 4 preset, dạng V2.

- [ ] **Step 1: Viết `presetMatrix.test.ts`.** Với mỗi phần tử của matrix:
  - `validateRig` 9/9;
  - mọi socket nằm ngoài thân trong khoảng 0–3 cm (`collider.depthInside === 0`, khoảng cách tới mặt ≤ 0.03);
  - giáp không chìm quá 5 mm (dùng lại `createInsideTester` trong `tests/helpers/meshInside.ts`);
  - chiều cao bind = `proportions.height` ± 0.02.

  Thêm hai test:
  - **feminine không phải athletic thu nhỏ:** tỷ lệ `shoulderWidth/hipWidth` lệch athletic ≥ 10%, và ít nhất 3 tiết diện torso khác tỷ lệ;
  - **geometry thân sạch:** chỉ kiểm tra không NaN và không tam giác suy biến ở bước này. Task 7 thay bằng `validateGeometry`.
- [ ] **Step 2:** Chạy test. Expected:
  - nếu PASS ngay thì đó là bằng chứng preset v1 đã đạt; ghi ledger, không phải lỗi test;
  - nếu FAIL thì dùng superpowers:systematic-debugging, sửa preset JSON hoặc code, không nới ngưỡng.
- [ ] **Step 3:** Thêm bộ ảnh `v2-m2`: lineup 4 preset (front, side) và thumbnail 320×480 cho mỗi preset (kiểm tra "silhouette dễ nhận diện khi thu nhỏ"). Chạy `npm run snapshot -- v2-m2`.
- [ ] **Step 4:** Chạy `npm test`, rồi commit `test(v2): body preset matrix keeps rig, sockets and armor fit`.

**→ Dừng V2-M2.** Gửi ảnh lineup và thumbnail.

---

## V2-M3 — Hybrid geometry (spec Phase 2, phần MVP)

### Task 7: Kiểm tra geometry, bevel cho giáp, hộp và primitive

**Files:**
- Create: `modeling/geometry/GeometryValidation.ts`, `tests/modeling/bevel.test.ts`, `tests/modeling/geometryValidation.test.ts`.
- Modify:
  - `modeling/geometry/Slab.ts`;
  - `equipment/PlateBuilder.ts`, `BandBuilder.ts`, `BoxBuilder.ts`, `AssemblyBuilder.ts`, `EquipmentBuilder.ts`: `EquipmentContext.geometry: GeometrySpec`;
  - `NormalizedHero.ts`: thêm `EquipmentGeometryOverride`;
  - `scripts/gen-schema.mjs`: V2 equipment nhận `geometry?: { bevel?: 0–0.02 }`;
  - `tests/modeling/armorPenetration.test.ts`.

**Interfaces:**
- Produces: `validateGeometry(g: THREE.BufferGeometry): GeometryIssue[]`, với `GeometryIssue = { kind: 'nan-position'|'nan-normal'|'non-unit-normal'|'degenerate'|'index-range'; index: number }`. Ngưỡng:
  - pháp tuyến coi là không đơn vị khi |len − 1| > 1e-3;
  - tam giác suy biến khi diện tích < 1e-10.
- Produces: `SlabOptions.bevel?: { size: number; segments: number }`.
  - Bo tròn mép mặt ngoài ở mọi mép tự do: u = 0, u = 1, và v = 0/1 nếu không khép vòng.
  - Bán kính r = min(size, (outer − inner)/2).
  - Profile: với θ_k = (k/segments)·π/2, k = 0…segments, vòng k lùi vào trong mặt một đoạn r(1 − cos θ_k) (đổi sang tham số u/v theo chiều dài thật của vùng) và có độ cao (outer − r) + r·sin θ_k.
  - Thành bên chỉ cao tới (outer − r).
  - Đầu ra vẫn non-indexed, pháp tuyến phẳng: các mặt vát là facet, đúng kiểu stylized.
  - Không có `bevel` thì kết quả phải **giống hệt từng byte** như trước.
- Áp bevel cho từng loại trang bị:
  - plate/band: dùng `bevel.size` của item (`geometry.bevel`, 0 = tắt), không có thì dùng `ctx.geometry.bevel.size` khi bevel bật;
  - box: RoundedBox dùng `segments = bevel.enabled ? bevel.segments : 2`;
  - primitive `box` trong assembly: khi bevel bật thì dùng `RoundedBoxGeometry(x,y,z,segments,min(size, các cạnh/2))`;
  - cylinder/cone dùng `ctx.geometry.curveSegments`, thay hằng `ROUND_SEGMENTS`;
  - shell không bevel (ghi ruling: shell đã có mép bo theo ring sweep).

- [ ] **Step 1: Viết test.**
  - `validateGeometry` bắt được từng loại lỗi trên geometry dựng tay.
  - Slab không bevel: mảng position bằng bản chụp trước khi sửa (lưu bằng một test tạm rồi cố định thành giá trị kỳ vọng).
  - Slab bevel `{size:.004, segments:1|2|3}`:
    - số đỉnh tăng dần theo segments;
    - `validateGeometry` rỗng;
    - offset lớn nhất của mặt ngoài không đổi;
    - tại mép, offset ngoài ≤ outer − 0.9r;
    - không có mặt nào có pháp tuyến ngược chiều mặt ngoài liền kề (dot ≥ 0).
  - `size` = 0.05 trên tấm dày 0.01 → r bị kẹp còn 0.005, không lỗi.
  - Mọi hero V1 và mọi preset với bevel ép bật: `validateGeometry` rỗng cho mọi mesh, và giáp vẫn chìm ≤ 5 mm.
- [ ] **Step 2:** Chạy test. Expected: FAIL, chưa có code.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test`. Expected: PASS, và `v1Parity` xanh (V1 có bevel tắt và curveSegments 12).
- [ ] **Step 5:** Commit `feat(v2): bevel for armor slabs, boxes and primitives; geometry validation`.

### Task 8: LayeredArmorBuilder: thứ tự lớp, chống xuyên, override từng lớp

**Files:**
- Create: `modeling/equipment/LayeredArmor.ts`, `tests/modeling/layeredArmor.test.ts`.
- Modify:
  - `equipment/PlateBuilder.ts`, `EquipmentBuilder.ts` (vật liệu theo từng lớp);
  - `NormalizedHero.ts`: `PlateItem.layerOverrides?`;
  - `semanticChecks.ts`: thêm luật `layerOverrides.length ≤ layers`;
  - `scripts/gen-schema.mjs`: V2 plate nhận `layerOverrides`.

**Interfaces:**
- Produces: `LayerOverride = { thickness?: number; color?: string; edgeColor?: string; bevel?: number }`, tối đa `layers` phần tử. Phần tử i ứng với lớp i. Lớp 0 là lớp **ngoài cùng** và bắt đầu tại `tStart`, như v1.
- Produces: `planLayers(item: PlateItem, surface: BodySurface): LayerPlan[]`, với `LayerPlan = { index, tStart, tEnd, lift, thickness, colorRef, edgeColorRef?, bevel? }`.
- Produces: `layerOffsets(plan: LayerPlan, item: PlateItem, u: number, v: number): { inner: number; outer: number }`. Builder dùng hàm này, test cũng dùng hàm này.
- Thuật toán `lift`: xếp từ lớp trong cùng (i = layers − 1, lift = gap) ra ngoài. lift_i = lift_{i+1} + thickness_{i+1} + c_i, trong đó c_i là khoảng chèn tối thiểu để mặt trong lớp i không thấp hơn mặt ngoài lớp i+1 tại mọi điểm (t, v) mà hai lớp chồng nhau:
  - lấy mẫu 16 × cols điểm;
  - c_i = max(0, max(outer_{i+1} − inner_i)) + 0.001 nếu có chỗ xuyên, ngược lại c_i = 0.

  Vì vậy hero V1 không có chỗ xuyên thì giữ nguyên dấu vân tay. Hero nào có xuyên thì cập nhật baseline của riêng hero đó, ghi ruling, và chụp ảnh trước/sau cho chủ dự án.

- [ ] **Step 1: Viết test.**
  - Tấm `layers:3, layerOverlap:.6, ridge:.02, bulge:.02`: tại mọi điểm chồng lấn, `inner(i) ≥ outer(i+1)`.
  - `layerOverrides[1].thickness = .03`: lớp 0 bị đẩy ra tương ứng.
  - `layerOverrides[2].color = 'trim'`: mesh lớp 2 dùng vật liệu `trim`, các lớp khác dùng `item.color`.
  - `layerOverrides` dài 4 khi `layers: 3` → lỗi `/equipment/<i>/layerOverrides`.
  - Báo cáo hero V1 nào có c_i > 0 (in ra bằng `console.info`).
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code. Nếu `v1Parity` đỏ chỉ ở các tấm nhiều lớp đang xuyên nhau: cập nhật baseline cho đúng hero đó và ghi ruling. Đỏ ở chỗ khác là lỗi code.
- [ ] **Step 4:** Chạy `npm test`. Chạy `npm run snapshot -- v2-m3`: bộ ảnh gồm Kestrel V2-thử với bevel bật và lớp có override, cạnh bản V1, zoom vai và hông.
- [ ] **Step 5:** Commit `feat(v2): layered armor planner with non-interpenetration and per-layer overrides`.

**→ Dừng V2-M3.** Gửi ảnh bevel và giáp nhiều lớp, cùng danh sách hero (nếu có) bị đổi do sửa chỗ xuyên.

---

## V2-M4 — Vật liệu và renderer (spec Phase 3)

### Task 9: MaterialResolver có cache; vật liệu riêng từng món trang bị

**Files:**
- Create: `modeling/materials/MaterialResolver.ts`, `tests/modeling/materials.test.ts`.
- Delete: `modeling/materials/MaterialBuilder.ts`, sau khi chuyển hết nơi dùng.
- Modify: `CharacterModelBuilder.ts`, `EquipmentBuilder.ts`, `AssemblyBuilder.ts`, `NormalizedHero.ts` (`material?: MaterialRef` trên mọi item), `fromV2.ts`, `gen-schema.mjs`.

**Interfaces:**
- Produces: `MaterialRef = { preset: MaterialPresetId; overrides?: Partial<Omit<MaterialSpec,'color'|'type'>> }`.
- Produces: `class MaterialResolver`:
  - `constructor(materials: Record<string, MaterialSpec>, fallback: Omit<MaterialSpec,'color'>, opts: { flatShading: boolean })`.
  - `get(colorRef: string, ref?: MaterialRef): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial`.
  - `all(): THREE.Material[]`.
  - `dispose(): void`.
- Cache theo khoá JSON của spec cuối cùng cộng `flatShading`.
- Tên vật liệu:
  - `colorRef` khi không có `ref`;
  - `${colorRef}@${preset}` khi có ref (thêm `#<6 ký tự hash>` nếu có overrides).
- Dùng `MeshPhysicalMaterial` khi `type === 'physical'` hoặc `clearcoat > 0`. `opacity < 1` thì bật `transparent`.
- `MaterialSet` (get/all) giữ tương thích, để `WeightVisualizer` và exporter không đổi.

- [ ] **Step 1: Viết test.**
  - Cùng `colorRef` → cùng instance.
  - `get('armor', {preset:'brushed-metal'})` → instance khác, còn `get('armor')` vẫn giữ metalness/roughness/color như trước khi gọi.
  - `color.getHexString(THREE.SRGBColorSpace)` bằng hex trong JSON (chữ thường).
  - Hero có một vai trò `energy`: chỉ vật liệu của vai trò đó có `emissiveIntensity > 0`.
  - `glass` → `MeshPhysicalMaterial`, transparent, opacity .45.
  - `dispose()` phát sự kiện `dispose` trên mọi vật liệu đã tạo.
  - Hero V1: danh sách vật liệu trong dấu vân tay không đổi (`v1Parity`).
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(v2): cached MaterialResolver with presets and per-item material overrides`.

### Task 10: LightingSetup (studio / legacy) và CameraSetup theo bounding box

**Files:**
- Create: `renderer/LightingSetup.ts`, `renderer/CameraSetup.ts`, `tests/renderer/lighting.test.ts`, `tests/renderer/camera.test.ts`.
- Modify:
  - `src/preview/Viewport.ts`: bỏ `addLights`/`addFloor` riêng; thêm `setLighting(preset)` và `frame(box, view)`;
  - `src/preview/PreviewParams.ts`, `ShowcaseApp.ts`: tham số URL `lighting=studio|legacy`, mặc định lấy từ `hero.showcase.lighting`.

**Interfaces:**
- Produces: `applyLighting(scene: THREE.Scene, target: { toneMapping: THREE.ToneMapping; toneMappingExposure: number }, preset: LightingPreset, makeEnvironment: () => THREE.Texture): LightingHandle`. `LightingHandle` có `fitShadow(box: THREE.Box3): void` và `dispose(): void`.
  - **legacy:** đúng bộ đèn và sàn hiện tại của `Viewport`, `scene.environment = null`, `NoToneMapping`.
  - **studio:**
    - `scene.environment` = `makeEnvironment()`; app thật dùng `PMREMGenerator.fromScene(new RoomEnvironment())`; `environmentIntensity` 0.6;
    - `ACESFilmicToneMapping`, exposure 1.0;
    - key light phía trước-trên-phải, đổ bóng, `shadow.bias` −0.0005, `normalBias` 0.02;
    - fill phía đối diện, cường độ 0.35;
    - rim phía sau, cường độ 1.6;
    - hemisphere 0.3;
    - sàn nhận bóng.
  - `fitShadow` ôm camera bóng sát vào box, nới thêm 10%.
- Produces: `CameraView = 'front'|'threeQuarter'|'side'|'back'|'fullBody'|'detail'`.
- Produces: `frameBox(box: THREE.Box3, view: CameraView, fovDeg: number, aspect: number, minDistance?: number): { position: THREE.Vector3; target: THREE.Vector3 }`.
  - Azimuth: front 0, threeQuarter 35, side 90, back 180, fullBody 20 (cao 12°), detail 25.
  - Detail nhắm vào 35% trên cùng của box, với khoảng cách 0.45 lần bình thường.
  - Với mọi view trừ detail, 8 góc của box nằm trong NDC [−0.92, 0.92].
  - Khoảng cách cuối = max(`minDistance`, khoảng cách vừa khít).
- Box của hero lấy ở bind pose, gồm cả trang bị.

- [ ] **Step 1: Viết test.**
  - Box cao 2.6 m (vũ khí vượt đầu), aspect 0.6 và 1.6: mọi góc lọt khung cho mọi view.
  - `minDistance` lớn hơn thì được giữ.
  - studio: `scene.environment` là texture giả do `makeEnvironment` trả về, `toneMapping === ACESFilmicToneMapping`.
  - legacy: `environment === null`, `NoToneMapping`, và đúng số đèn với vị trí như v1.
  - `dispose` gỡ đèn khỏi scene và gọi `dispose` của texture.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code. Đặt `Viewport.renderer.toneMapping` qua `applyLighting`.
- [ ] **Step 4:** Chạy `npm test`. Chạy `npm run snapshot -- v2-baseline` rồi `node scripts/visual-compare.mjs v2-baseline`. Expected: 0.00%, vì query có `lighting=legacy`. Chụp bộ `v2-m4` với studio cho cả 3 hero.
- [ ] **Step 5:** Commit `feat(v2): studio/legacy lighting presets and bounding-box camera framing`.

### Task 11: CharacterRenderer, cache dựng lại, tích hợp showcase, không rò tài nguyên

**Files:**
- Create: `renderer/CharacterRenderer.ts`, `renderer/HeroBuildCache.ts`, `tests/renderer/characterRenderer.test.ts`, `tests/architecture/dependencies.test.ts`.
- Modify:
  - `runtime/CharacterFactory.ts`: tham số tuỳ chọn `cache?`;
  - `src/showcase/ShowcaseApp.ts`, `src/preview/PreviewApp.ts`: dùng `CharacterRenderer` và gỡ bỏ `disposeObject` trùng lặp;
  - `debug/WeightVisualizer.ts`: giải phóng vật liệu weight khi tắt hoặc đổi hero.

**Interfaces:**
- Produces: `class CharacterRenderer`:
  - `constructor(opts?: { cache?: HeroBuildCache })`.
  - `build(def: NormalizedHero): Promise<THREE.Group>`, chạy đồng bộ bên trong, trả Promise theo spec.
  - `instance(): CharacterInstance | null`.
  - `update(dt: number): void`, gọi PoseAnimator.
  - `setPose(pose: PoseId): void`.
  - `dispose(): void`: geometry, vật liệu (`MaterialResolver.dispose`), skeleton; gỡ khỏi parent.
  - Không chứa chuỗi id hero nào.
- Produces: `createHeroBuildCache(capacity = 8): HeroBuildCache`.
  - Khoá = JSON có sắp xếp key của `NormalizedHero`.
  - Lưu phần đắt: body geometry đã có skin weight, geometry trang bị (world bind), collider.
  - `buildCharacter(def, cache)` lấy **bản clone**. Dispose một instance không làm hỏng cache.
  - Đẩy ra mục ít dùng nhất (LRU).

- [ ] **Step 1: Viết test.**
  - **Rò tài nguyên:** đổi 10 lần qua lại Kestrel ↔ Granite ↔ preset heavy. Trước mỗi `dispose`, gom mọi geometry và vật liệu trong cây (gồm vật liệu xem weight sau khi bật/tắt). Sau `dispose`, từng cái đều đã phát sự kiện `dispose`.
  - **Cache:** lần dựng thứ hai cùng định nghĩa cho `fingerprintCharacter` bằng lần đầu. Geometry khác uuid. Thời gian trung vị lần cache < 0.5 lần thời gian không cache; in cả hai số.
  - Đổi một số trong định nghĩa thì cache trượt.
  - **Kiến trúc:** không file nào dưới `definitions|modeling|rigging|animation|migration|export` import `/renderer/`. File trong `renderer/` không chứa `kestrel|granite|morrow`.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code và tích hợp showcase/preview.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck && npm run build`. Chạy `node scripts/verify-export.mjs kestrel`: Expected PASS. Chạy `npm run snapshot -- v2-m4` và `visual-compare v2-baseline`: Expected 0.00%.
- [ ] **Step 5:** Commit `feat(v2): CharacterRenderer with build cache; showcase/preview integration; no leaks on hero switch`.

**→ Dừng V2-M4.** Gửi:
- ảnh studio và legacy cạnh nhau cho 3 hero;
- ảnh 6 góc camera;
- số liệu cache.

---

## V2-M5 — Kiểm tra theo tư thế và xuất GLB (spec Phase 5)

### Task 12: Bộ tư thế mở rộng và đo va chạm giáp theo tư thế

**Files:**
- Create: `debug/PoseClipping.ts`, `tests/animation/poseClipping.test.ts`.
- Modify:
  - `definitions/HeroDefinition.ts` (`POSE_IDS`);
  - `animation/PoseDefinition.ts`, `animation/PoseBuilder.ts`;
  - `debug/RigDebugPanel.ts` (`POSE_LABELS`);
  - `gen-schema.mjs` (enum tư thế cho V1 và V2);
  - `tests/animation/poses.test.ts`.

**Interfaces:**
- `POSE_IDS` thêm `'armsForward'`, `'crouch'`, `'legRaiseRight'`. `legRaise` giữ nguyên là nâng chân trái.
  - Nhãn: "Tay đưa trước", "Ngồi xổm", "Nâng chân phải".
  - Theo quy ước dấu ở đầu `PoseDefinition.ts`:
    - armsForward: `LeftUpperArm [0,-85,0]`, `RightUpperArm [0,85,0]`, khuỷu cong nhẹ 10°;
    - crouch: `UpperLeg [-75,0,0]` hai bên, `LowerLeg [115,0,0]`, `Foot [-40,0,0]`, `Spine [15,0,0]`, `Chest [10,0,0]`;
    - legRaiseRight: gương của `legRaise`.
- Produces: `POSE_GROUNDED: ReadonlySet<PoseId>` = {'crouch'}. `PoseBuilder` hạ `Hips` theo −Y để điểm thấp nhất của hai bàn chân (tính qua forward kinematics ở các mốc gót và mũi) trở về y của bind. Bỏ tư thế thì trả Hips về bind.
- Produces: `measurePoseClipping(instance: CharacterInstance, pose: PoseId): { itemId: string; maxDepth: number }[]`.
  - Áp tư thế.
  - Tính vị trí đỉnh thân đã skin trên CPU bằng `SkinnedMesh.applyBoneTransform`.
  - Dựng `createBodyCollider` từ vị trí đó với cùng index.
  - Đo độ chìm lớn nhất của các đỉnh world của từng món trang bị.
  - Trả lại bind pose khi xong.

- [ ] **Step 1: Viết test.**
  - **poses:** ba tư thế mới làm đúng bone đổi hướng. Kiểm tra bằng hướng world của bone:
    - armsForward: tay trái chỉ +Z;
    - legRaiseRight: đùi phải chỉ +Z;
    - crouch: hai gót cách sàn ≤ 0.01, Hips thấp hơn bind ≥ 0.25 m.

    Reset về bind không trôi (dùng lại test v1).
  - **poseClipping:** Kestrel và Granite, các tư thế `tpose`, `armRaise`, `armsForward`, `crouch`, `legRaise`, `legRaiseRight`, `torsoTwist`:
    - `maxDepth` ≤ 0.005 ở tpose;
    - ≤ 0.015 ở các tư thế còn lại.
  - **Socket:** mọi socket gắn vào Chest giữ nguyên offset so với Chest trong `torsoTwist` (sai số 1e-6).
- [ ] **Step 2:** Chạy test. Expected: FAIL, chưa có tư thế và chưa có hàm.
- [ ] **Step 3:** Viết code. Chạy lại, rồi ghi bảng `maxDepth` thực tế vào ledger. Món nào vượt ngưỡng thì xử lý theo thứ tự:
  1. Sửa bone gắn tự suy (ví dụ tấm hông nằm vắt qua khớp thì gắn theo nửa có nhiều diện tích hơn).
  2. Chỉnh dữ liệu hero, chỉ với Kestrel và Granite. Morrow là file của chủ dự án: chỉ báo, không sửa.

  Không nới ngưỡng. Còn vượt sau hai bước này thì ghi ruling và đưa ảnh cho chủ dự án ở milestone.
- [ ] **Step 4:** Chạy `npm test`. Chụp `v2-m5`: 3 hero × armsForward / crouch / legRaiseRight / torsoTwist, studio.
- [ ] **Step 5:** Commit `feat(v2): arms-forward, crouch, right-leg poses; posed armor clipping measurement`.

### Task 13: GLB giữ vật liệu và phát sáng; ngân sách hiệu năng

**Files:**
- Create: `tests/performance/budget.test.ts`, `docs/superpowers/reports/herov2-bench.md`.
- Modify: `export/CharacterSummary.ts`, `tests/export/roundtrip.test.ts`, `equipment/EquipmentBuilder.ts` (chỉ khi phải merge).

**Interfaces:**
- `CharacterSummary` thêm `materials: { name; type: 'standard'|'physical'; color; metalness; roughness; emissive; emissiveIntensity; opacity; clearcoat }[]`, sắp theo name.
- `compareSummaries` so từng mục:
  - số thực với sai số 1e-3;
  - màu dạng hex sRGB;
  - `type`: phía export, physical không có clearcoat và không transparent được coi là standard;
  - metadata so cả `sourceVersion`.
- Nếu bench vượt ngân sách draw call: `mergeStaticByMaterial(group: THREE.Group): void`.
  - Trong mỗi `equip_<id>`, gộp các mesh cùng vật liệu và cùng parent thành một mesh.
  - Giữ tên group, không gộp xuyên item hay xuyên bone (spec 4.5).
  - `v1Parity` vẫn xanh, vì hash không phụ thuộc cách chia mesh.

- [ ] **Step 1: Viết test.**
  - **roundtrip:** hero thử V2 có vai trò `energy` (emissiveIntensity 2) và `glass`. Sau export → import, `compareSummaries` rỗng. Energy vẫn có emissiveIntensity 2 (KHR_materials_emissive_strength). Glass vẫn có opacity .45 và clearcoat 1.
  - **budget:** với Kestrel, Granite, Morrow và hero thử V2:
    - tam giác ≤ 45 000;
    - draw call ≤ 100;
    - vật liệu khác nhau ≤ 16.
- [ ] **Step 2:** Chạy test. Expected: roundtrip FAIL vì summary chưa có `materials`. Budget FAIL hay PASS tuỳ số đo ở Task 2.
- [ ] **Step 3:** Viết code. Nếu draw call vượt thì làm `mergeStaticByMaterial`. Nếu tam giác hay vật liệu vượt thì không giảm chất lượng (spec: không đánh đổi silhouette vì con số polygon): ghi ruling, giữ test ở mức đo thực tế + 10%, và báo chủ dự án.
- [ ] **Step 4:** Chạy `npm test`. Chạy `npm run heroes:bench > docs/superpowers/reports/herov2-bench.md`, thêm cột so với baseline. Chạy `node scripts/verify-export.mjs kestrel`.
- [ ] **Step 5:** Commit `feat(v2): GLB round-trip preserves materials and emission; performance budget`.

**→ Dừng V2-M5.** Gửi:
- ảnh tư thế;
- bảng `maxDepth`;
- báo cáo bench trước/sau;
- kết quả xuất GLB.

---

## V2-M6 — Tư thế cầm súng cho TPS shooter (yêu cầu bổ sung của chủ dự án)

### Task 14: Khai báo vũ khí cầm tay, IK hai đoạn, lấy súng lên tay

**Files:**
- Create:
  - `animation/TwoBoneIK.ts`, `animation/WeaponRig.ts`;
  - `tests/animation/twoBoneIK.test.ts`, `tests/animation/weaponRig.test.ts`;
  - `tests/fixtures/v2-gunner.json`: trang bị Kestrel, dạng V2, súng trường trên lưng có `weapon`, thêm một súng ngắn trong bao ở hông phải.
- Modify:
  - `NormalizedHero.ts`: `WeaponSpec`, `weapon?` trên `BoxItem`/`AssemblyItem`;
  - `gen-schema.mjs` (chỉ V2);
  - `semanticChecks.ts`;
  - `runtime/CharacterFactory.ts`: `CharacterInstance.weapons`.

**Interfaces:**
- Produces trường `weapon` của assembly/box trong file V2. Toạ độ tính trong khung cục bộ của món đồ, tức cùng khung với `parts[].position`; nòng hướng +Z, mặt trên +Y:
  ```ts
  export interface WeaponSpec {
    type: 'rifle' | 'pistol';
    /** Điểm tay phải nắm báng. */
    grip: Vec3;
    /** Điểm tay trái đỡ. Bắt buộc với rifle; pistol không có thì tay trái ôm lấy tay phải. */
    support?: Vec3;
    /** Đầu nòng. */
    muzzle: Vec3;
    /** Điểm báng tì vai (rifle). Mặc định = grip + (0, 0.02, −0.16). */
    stock?: Vec3;
  }
  ```
- Luật ngữ nghĩa, thông báo tiếng Việt kèm đường dẫn:
  - `muzzle.z > grip.z`;
  - rifle phải có `support`;
  - mỗi hero có tối đa một vũ khí cho mỗi `type`;
  - `weapon` chỉ đặt trên món gắn bằng `attach.socket`.
- Produces: `solveTwoBoneIK(root: THREE.Bone, mid: THREE.Bone, end: THREE.Bone, target: THREE.Vector3, pole: THREE.Vector3): { reached: boolean; error: number }`.
  - Giải tích theo định lý cos, xoay `root` rồi `mid` trong không gian cha.
  - Đích ngoài tầm với thì duỗi thẳng tay về phía đích.
  - Không bao giờ sinh NaN.
  - Pole cho tay: khuỷu hướng xuống dưới và ra ngoài.
- Produces: `CharacterInstance.weapons: Map<'rifle'|'pistol', { item: EquipmentPart; spec: WeaponSpec; holster: THREE.Object3D }>`.
- Produces: `holdWeapon(instance, type, weaponWorld: THREE.Matrix4): { rightError: number; leftError: number }`.
  1. Gắn món súng vào một `Object3D` tên `weapon_anchor`, con của bone `Chest`, sao cho khung súng trùng `weaponWorld`.
  2. Giải IK tay phải tới `grip`, tay trái tới `support`. Pistol không có `support` thì tay trái tới `grip + (0.035, −0.02, 0)`.
  3. Xoay bone `Hand`. Tay phải: trục ngón (−X cục bộ của RightHand ở bind) gần +X của súng, lệch ≤ 35°. Tay trái: lòng bàn tay úp lên +Y của súng.
- Produces: `holsterWeapon(instance, type): void`: trả súng về socket cũ, đúng ma trận bind.
- Nếu tay phải còn cách `grip` quá 0.01 m thì lùi `weaponWorld` về phía vai phải dọc trục nòng, mỗi lần 0.02 m, tối đa 10 lần. Lần cuối vẫn trả `rightError` thật để test đọc được.

- [ ] **Step 1: Viết test.**
  - **twoBoneIK:**
    - đích trong tầm với → `error ≤ 1e-4`, chiều dài hai đoạn giữ nguyên;
    - đích xa gấp đôi tầm với → `reached: false`, tay thẳng, không có NaN;
    - khuỷu nằm phía pole so với đường vai–cổ tay.
  - **weaponRig** (Kestrel và 4 preset, súng từ `v2-gunner.json`):
    - `holdWeapon` ở một khung súng trước ngực → `rightError ≤ 0.01`, `leftError ≤ 0.015`;
    - món súng có parent là `weapon_anchor`;
    - `holsterWeapon` → parent lại là socket cũ, ma trận world bằng bind (1e-6).
  - **Ngữ nghĩa:** thiếu `support` ở rifle → lỗi `/equipment/<i>/weapon/support`; `muzzle.z ≤ grip.z` → lỗi; hai rifle → lỗi.
  - **GLB:** export sau khi đã `holdWeapon` vẫn cho cây như bind, vì export dựng bản mới.
- [ ] **Step 2:** Chạy `npx vitest run tests/animation`. Expected: FAIL.
- [ ] **Step 3:** Viết code, chạy `npm run schema`.
- [ ] **Step 4:** Chạy `npm test`. Expected: PASS, `v1Parity` xanh (V1 không có `weapon`).
- [ ] **Step 5:** Commit `feat(v2): hand-held weapon declaration, two-bone arm IK, draw/holster weapon`.

### Task 15: Bảy tư thế súng, nút trên showcase, kiểm tra hướng ngắm và va chạm

**Files:**
- Create: `animation/GunPoses.ts`, `tests/animation/gunPoses.test.ts`.
- Modify:
  - `definitions/HeroDefinition.ts` (`POSE_IDS`);
  - `animation/PoseBuilder.ts`, `animation/ProceduralAnimator.ts`: tư thế súng gọi `holdWeapon` sau khi xoay bone; rời tư thế súng thì `holsterWeapon`;
  - `debug/RigDebugPanel.ts`, `src/showcase/ControlsPanel.ts`: nhóm nút "Cầm súng", khoá khi hero không có loại súng tương ứng, tooltip "Hero chưa khai báo súng trường/súng ngắn (trường weapon)";
  - `semanticChecks.ts`: `showcase.pose` là tư thế súng thì hero phải có loại súng đó;
  - `gen-schema.mjs`;
  - `scripts/shots.config.json`: bộ `v2-m6`.

**Interfaces:**
- `POSE_IDS` thêm 7 tư thế. Nhãn tiếng Việt lần lượt:

  | Id | Nhãn | Loại súng |
  |---|---|---|
  | `rifleIdle` | Cầm súng trường (thủ thế thấp) | rifle |
  | `rifleAim` | Ngắm súng trường | rifle |
  | `rifleAimUp` | Ngắm lên | rifle |
  | `rifleAimDown` | Ngắm xuống | rifle |
  | `rifleHip` | Bắn từ hông | rifle |
  | `pistolAim` | Ngắm súng ngắn (hai tay) | pistol |
  | `crouchAim` | Ngồi ngắm | rifle |

  `GUN_POSES: Record<GunPoseId, GunPose>`, với `GunPose = { weapon: 'rifle'|'pistol'; body: Pose; grounded?: boolean; place(layout: CharacterLayout, spec: WeaponSpec): { stockOrGrip: Vec3; pitchDeg: number; yawDeg: number } }`.
  - Vị trí trả về tính trong **khung bone Chest ở bind**. Nhờ vậy xoay thân hay cúi người thì súng đi theo.
  - `body` là góc xoay thân, đầu và chân (tay do IK lo).
  - Mốc mắt: `eyeY = layout.headTopY − 0.45 × proportions.head.height`, nằm trên mặt phẳng giữa, phía trước tâm đầu `0.4 × head.depth`. Thêm `eye: Vec3` vào `CharacterLayout` trong `computeLayout`, có test trong `CharacterLayout.test.ts`.
- Giá trị khởi đầu. Tinh chỉnh bằng ảnh, nhưng không được phá các test bên dưới.
  - **Thế đứng chung (người thuận tay phải):**
    - `Spine [0,12,0]`, `Chest [0,10,0]`: vai phải lùi;
    - `Neck [0,-10,0]`, `Head [0,-12,0]`: đầu bù lại để mặt nhìn thẳng +Z.
  - **rifleAim:**
    - báng ở hõm vai phải = khớp `RightUpperArm` lệch vào trong 0.05, ra trước 0.07;
    - nòng ngang tầm mắt − 0.04;
    - `pitchDeg` 0, `yawDeg` 0;
    - đầu nghiêng áp má: `Head [8,-12,-6]`.
  - **rifleAimUp / rifleAimDown:** như rifleAim, nhưng góc ngắm +35° / −30° chia đều cho Spine và Chest (trục X). Súng nằm trong khung Chest nên nghiêng theo thân.
  - **rifleIdle:** báng ở hõm vai, nòng chúc xuống 35°, lệch trái 15°.
  - **rifleHip:** báng ngang eo phải, trước 0.12, nòng ngang +Z; Chest hơi ngả sau 5°.
  - **pistolAim:** báng súng ngắn ở giữa ngực, cao ngang vai, xa 0.75 × (upperArm + lowerArm) về phía trước; nòng +Z.
  - **crouchAim:** chân như `crouch` (`grounded: true`), thân như rifleAim. Spine bù góc cúi của crouch để ngực thẳng.

- [ ] **Step 1: Viết `gunPoses.test.ts`.** Chạy trên `v2-gunner` × 4 preset, với từng tư thế súng hợp lệ:
  - **Cầm đúng:** `rightError ≤ 0.01`, `leftError ≤ 0.015`.
  - **Khuỷu không gập ngược:** góc khuỷu nằm trong 10°–170°, và khuỷu nằm dưới đường vai–cổ tay.
  - **Hướng nòng:** vector grip → muzzle chuẩn hoá. Với `rifleAim`, `pistolAim`, `crouchAim`: dot với +Z ≥ 0.98. Với `rifleAimUp`/`rifleAimDown`: góc so với mặt phẳng ngang là +35° ± 5° / −30° ± 5°.
  - **Tầm ngắm:** trong `rifleAim`, đầu nòng cao bằng mắt (mốc mắt từ layout) ± 0.1 m.
  - **Mặt nhìn thẳng:** hướng +Z cục bộ của bone Head, dot với +Z thế giới ≥ 0.95, trong mọi tư thế ngắm.
  - **Không xuyên thân:** `measurePoseClipping` (Task 12) mở rộng đo cả súng. Trang bị chìm ≤ 0.015 m. Súng chìm ≤ 0.015 m, trừ các đỉnh cách điểm `stock` dưới 0.05 m, vì báng tì vai là chạm có chủ ý.
  - **Trả về đúng chỗ:** chuyển `rifleAim` → `tpose` thì súng về socket lưng và mọi bone về bind (1e-6). Chuyển `rifleAim` → `pistolAim` thì súng trường về lưng và súng ngắn lên tay.
  - **Hero không có súng:** Granite, Morrow. Gọi tư thế súng thì không đổi gì và không throw; `ControlsPanel` render nút ở trạng thái `disabled`, có tooltip.
  - **Ngữ nghĩa:** `showcase.pose: "pistolAim"` trên hero không có pistol → lỗi `/showcase/pose`.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code. Chạy lại test, rồi ghi bảng `rightError`, `leftError` và độ chìm lớn nhất của từng tư thế × preset vào ledger. Chỗ nào vượt ngưỡng thì chỉnh `place()` hoặc góc thân trong `GunPoses.ts`, không nới ngưỡng.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Chụp `v2-m6`: `v2-gunner` × 7 tư thế súng × góc threeQuarter và side, `rifleAim` thêm góc front và một ảnh qua vai phải kiểu camera TPS (azimuth 160°, cao 15°, nhắm vai phải), cộng lineup 4 preset ở `rifleAim`. Ánh sáng studio.
- [ ] **Step 5:** Commit `feat(v2): TPS gun poses (rifle idle/aim/aim-up/aim-down/hip, pistol aim, crouch aim)`.

**→ Dừng V2-M6.** Gửi:
- ảnh 7 tư thế súng, ảnh góc qua vai, lineup 4 dáng người cùng ngắm;
- bảng sai số tay cầm và độ chìm.

---

## V2-M7 — Đưa vào dùng (spec Phase 6)

### Task 16: Template V2, tài liệu, chuyển Kestrel sang V2, nghiệm thu

**Files:**
- Create: `templates/hero-v2-template.json`, `tests/fixtures/kestrel.v1.json`.
- Modify:
  - `heroes/kestrel/hero.json`;
  - `tests/fixtures/kestrel.ts`: trỏ sang `kestrel.v1.json`, để mọi test v1 giữ nguyên dữ liệu;
  - `tests/regression/v1Parity.test.ts`: lấy Kestrel từ fixture;
  - `templates/HERO_TEMPLATE.md`, `README.md`, `scripts/shots.config.json`.

**Interfaces:**
- `hero-v2-template.json` dùng đủ mọi trường V2:
  - `design`;
  - `materials` với ít nhất 4 preset, trong đó có `energy`;
  - `geometrySettings.bevel`;
  - một plate có `layerOverrides`;
  - một item có `material` riêng;
  - một súng trường và một súng ngắn có `weapon`;
  - `showcase` V2.

  File phải qua `loadHeroDefinition` và rig 9/9.

- [ ] **Step 1: Viết test.**
  - `templates.test.ts`: template V2 hợp lệ, rig 9/9, GLB khớp.
  - `kestrel` trong `heroes/` có `version: 2` và `design.geometryProfile: 'hybrid'`.
  - Mọi vai trò kim loại (`armor`, `metal`, hoặc tên thực tế trong file) có preset thuộc nhóm metals.
  - Kestrel có súng trường (món `rifle`) và súng ngắn trong bao `holster`, cả hai qua đủ test của Task 15. `showcase.pose` là `rifleIdle`.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3: Chuyển Kestrel.**
  1. Chép `heroes/kestrel/hero.json` sang `tests/fixtures/kestrel.v1.json`.
  2. Chạy `npm run heroes:migrate -- --write --only kestrel`.
  3. Xoá `heroes/kestrel/hero.v1.json`, vì fixture đã giữ bản V1.
  4. Chỉnh tay: gán preset vật liệu thật cho từng vai trò (bỏ overrides giữ số cũ), bật bevel, thêm `layerOverrides` cho pauldron.
  5. Khai báo `weapon` cho `rifle`, chép súng ngắn từ `v2-gunner.json` vào bao `holster`, đặt `showcase.pose: "rifleIdle"`.
- [ ] **Step 4: Viết tài liệu.** `HERO_TEMPLATE.md` thêm mục "Hero V2", bằng tiếng Việt:
  - bảng trường mới;
  - bảng preset vật liệu với metalness/roughness;
  - bảng geometry profile;
  - mục "Súng và tư thế súng": quy ước nòng +Z và mặt trên +Y, cách đo `grip`/`support`/`muzzle`/`stock`, bảng 7 tư thế;
  - cách chuyển V1 → V2 (`heroes:migrate`);
  - các trường cố ý chưa có (Quyết định 1).

  README thêm các lệnh mới.
- [ ] **Step 5:** Chạy `npm test && npm run typecheck && npm run build && npm run heroes:validate`. Chụp `v2-final`: mọi hero, 4 góc + 3 tư thế, cộng Kestrel ở 7 tư thế súng; ánh sáng studio; có kiểm tra lỗi console. Chạy `visual-compare v2-baseline` cho Granite và Morrow: Expected 0.00%. Kestrel đã chuyển nên khác baseline: chấp nhận bằng ảnh cho chủ dự án duyệt.
- [ ] **Step 6:** Commit `feat(v2): V2 template and guide; Kestrel migrated to V2`.

**→ Dừng V2-M7.** Gửi:
- ảnh `v2-final`;
- checklist 40 mục của spec mục 13, mỗi mục là đạt / chưa đạt kèm bằng chứng (test, ảnh hoặc số đo).
