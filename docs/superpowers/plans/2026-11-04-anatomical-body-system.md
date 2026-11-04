# Anatomical Body System (Heroic Smooth) – Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay cách tạo hình thân hiện nay (mỗi hero tự khai báo tiết diện và khối cơ) bằng một hệ thống body dùng chung cho mọi hero. Hướng thiết kế đã khoá: **Stylized Anatomical, cơ rõ (High), tỷ lệ Heroic, bề mặt Smooth**. Hero chỉ khai báo archetype và vài hệ số trong khối `bodyDesign`.

**Architecture:**
- Giữ nguyên xương sống v1: `BodySurface` (ring tiết diện theo tham số `part, t, góc`) → `UnifiedBody` (một lưới kín liền khối) → skin weight → equipment ôm bề mặt.
- Hệ thống mới thay hai đầu vào của xương sống đó:
  1. **Body Configuration Resolver:** `bodyDesign` (archetype + hệ số) → `CharacterProportions` + tiết diện cơ sở. Tỷ lệ chuẩn hoá theo chiều cao, không dùng số tuyệt đối của riêng hero nào.
  2. **Muscle field (trường dịch chuyển bề mặt):** các khối cơ là hàm nhô ra trên miền (t, góc) của từng bộ phận, hoà vào nhau bằng *smooth union*, có rãnh phân tách điều khiển được. Khối cơ là một phần của bề mặt, không phải vật thể đặt chồng lên (spec 1.1).
- Ở các chỗ nối khó (vai–nách, gốc cổ, háng), dùng SDF có chọn lọc: đỉnh lưới trong dải nối được chiếu lên mặt *smooth union* của hai bộ phận. Không remesh toàn thân bằng SDF, vì spec mục 2.3 cảnh báo về chi phí tính toán và mất chi tiết.
- Hero không có `bodyDesign` đi đường cũ, không đổi một đỉnh nào (khoá bằng `v1Parity`). Đây là cách "giữ implementation cũ tới khi đường mới qua kiểm tra" (spec mục 8.10).

**Tech Stack:** như v1/V2-M0, không thêm dependency. Có sẵn từ V2-M0:
- dấu vân tay `tests/helpers/fingerprint.ts`;
- `scripts/visual-compare.mjs`;
- `npm run heroes:bench`.

**Spec:** `docs/superpowers/specs/phong-cach-thiet-ke.md`. Nền hiện có: plan v1 `docs/superpowers/plans/2026-11-04-hero-showcase.md`, audit `docs/superpowers/reports/2026-11-04-herov2-audit.md`. Thứ tự so với V2: xem `docs/superpowers/roadmap.md`.

## Global Constraints

**Repo và quy trình**
- Thư mục `/Users/minhduc/Desktop/Duan/Deadlock`, nhánh `feat/hero-v2`, nối tiếp V2-M0. V2-M1 trở đi chờ plan này xong.
- Sau **mỗi milestone (B-M0 … B-M7)** dừng lại, gửi ảnh và tóm tắt tiếng Việt, chờ chủ dự án duyệt.
- **B-M2 (torso prototype) là cổng chặn:** chưa được duyệt hình ảnh torso thì không làm tay chân (spec mục 9).
- Không tuyên bố "đẹp/đúng" khi chưa render và tự xem ảnh (spec 8.11).
- Commit message kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Thiết kế đã khoá**
- `style` = `stylized-anatomical`, `surface` = `smooth`, `proportionPreset` = `heroic`: đều là hằng trong schema.
- `muscleDefinition` mặc định `high`.

**Rig và hệ toạ độ**
- Giữ hệ toạ độ: +Y lên, nhìn +Z, +X là bên trái nhân vật.
- Giữ 20 bone, tên bone, cây bone và quy ước socket. Không tạo skeleton riêng.
- Ánh xạ tên logic trong spec 4.1 sang bone thật: Clavicle = `Left/RightShoulder`, Pelvis = `Hips`, Forearm = `Left/RightLowerArm`.
- Rig validation 9/9 với mọi archetype và mọi tư thế thử.
- Tối đa 4 ảnh hưởng mỗi đỉnh, tổng weight = 1.

**Tương thích**
- Hero không có `bodyDesign` giữ nguyên dấu vân tay (`tests/regression/v1Parity.test.ts`).
- Không sửa `heroes/morrow/hero.json` khi chủ dự án chưa đồng ý.

**Code**
- Không có số liệu riêng của hero nào trong `.ts`. Hằng giải phẫu chung (vị trí cơ theo tỷ lệ) được phép.
- Không dùng `any`.
- Hình học tất định: cùng cấu hình → cùng lưới.
- Không sinh geometry mỗi frame.

## Phạm vi

**Làm:** spec Phase 0–6.
- Cấu hình body và 5 archetype (Tank, Fighter, Assassin, Mage, Bruiser).
- Thư viện cơ giải phẫu (stylized) cho torso, vai, tay, hông, chân.
- Smooth union và rãnh cơ; nối chỗ khó bằng SDF chọn lọc; mật độ lưới thích ứng.
- Vật liệu body riêng; skin weight cho cơ lớn.
- Tư thế A-Pose, Deep Squat, Running, Combat Attack; đo biến dạng.
- Chuyển Kestrel rồi Granite sang hệ mới; cache, benchmark, kiểm tra rò tài nguyên.

**Không làm:**
- normal map hay texture: `normalScale` không đưa vào schema vì chưa có normal map nào để scale;
- bàn tay có ngón; khuôn mặt;
- remesh toàn thân bằng marching cubes;
- animation clip thật: Running và Combat Attack là tư thế tĩnh để thử biến dạng.

## Quyết định thiết kế đã chốt trong plan (chủ dự án duyệt cùng plan)

1. **`bodyDesign` đi vào định dạng hero hiện tại** (`version: 1`) dưới dạng trường tuỳ chọn, để làm body trước V2 như chủ dự án yêu cầu. Khi file có `bodyDesign` thì **không** được có `proportions` và `bodyShape`: một nguồn sự thật duy nhất, schema dùng `oneOf`. Schema V2 sau này nhận nguyên khối này (xem roadmap).
2. **Tỷ lệ heroic chuẩn hoá theo chiều cao 1.0**, lấy từ bảng spec 1.3. Các số spec không cho thì mình đặt (bảng ở Task B2). Mỗi archetype là bộ hệ số nhân, hero có thể nhân thêm.
3. **Thêm nhóm cơ `glutes`** vào `bodyDesign.muscles`. Ví dụ trong spec chưa có nhóm này, nhưng bảng giải phẫu xếp Gluteus vào mức Critical.
4. **"Remeshing" được hiểu là:** mật độ ring thích ứng (dày ở khớp và ở nơi trường cơ đổi nhanh) cộng chiếu đỉnh ở dải nối lên mặt smooth union. Topology vẫn là ring liền khối, nên giáp vẫn bám theo tham số (`part, t, góc`) như cũ.
5. **`anatomicalContrast`** là tô tối nhẹ các rãnh cơ bằng vertex color, tính từ độ lõm của lưới. Đây là "tương phản bằng geometry", không dùng texture. GLB phải giữ thuộc tính màu đỉnh này.
6. **Vật liệu body tách khỏi vật liệu giáp** dù dùng cùng vai trò màu (spec 5.2). Tên vật liệu body: `<vai trò>~body`.
7. **Hero đại diện đầu tiên: Kestrel → `fighter`.** Sau khi duyệt mới làm Granite → `tank`. Morrow → `bruiser` chỉ khi chủ dự án đồng ý. 4 preset dáng cũ (athletic/heavy/slim/feminine) giữ làm đường cũ, không xoá.

## Review Focus

1. **Hệ số ở biên** (vai 1.6 kèm eo 0.6, cơ 2.0 kèm `muscleSeparation` 1.0) → lưới không lật mặt, không tự cắt ở nách hay háng, rãnh không sâu thành "tượng giải phẫu". Test ở Task B5 và B8.
2. **Archetype to (Tank, Bruiser) ở tư thế Deep Squat và Arms Raised** → đùi và bụng không xuyên nhau thành mặt lộn ngược, khuỷu không xẹp. Test ở Task B10.
3. **Giáp và socket của hero cũ khi chuyển sang thân mới** → giáp chìm ≤ 5 mm, socket nằm ngoài thân và cách mặt thân ≤ 3 cm, súng trên lưng không cắm vào lưng. Test ở Task B11.
4. **File có cả `bodyDesign` lẫn `proportions`**, hoặc `bodyDesign` thiếu trường → lỗi tiếng Việt rõ ràng, có fallback mặc định cho trường tuỳ chọn. Test ở Task B3.
5. **Dựng lại body liên tục khi kéo thanh chỉnh hệ số ở preview** → không rò geometry hay vật liệu, cache không trả lưới cũ khi hệ số đã đổi. Test ở Task B13.

## Cấu trúc file (mới hoặc sửa chính)

Theo cây `src/game/character/` hiện có (spec 2.2 cho phép tuỳ repo):

```
src/game/character/body/
  config/BodyDesign.ts            kiểu BodyDesignConfig, giới hạn min/max, mặc định
  config/heroicBaseline.ts        tỷ lệ heroic chuẩn hoá (cao 1.0)
  config/archetypes.ts            tank / fighter / assassin / mage / bruiser
  config/resolveBodyDesign.ts     bodyDesign → { proportions, bodyShape, anatomy }
  anatomy/MuscleField.ts          MuscleParameters, hàm khối, smooth union, rãnh
  anatomy/torso.ts, shoulder.ts, arm.ts, hip.ts, leg.ts   thư viện cơ từng vùng (tỷ lệ chuẩn hoá)
  surface/resolution.ts           surfaceResolution → radialSegments, ringsPerMeter, ring thích ứng
  surface/JunctionBlend.ts        chiếu đỉnh dải nối lên smooth union (vai, cổ, háng)
  surface/SurfaceQuality.ts       đo góc nhị diện, mặt lật, thể tích
  materials/bodyMaterial.ts       BodyMaterialConfig, vertex color rãnh cơ
  deformation/DeformationMetrics.ts   đo biến dạng theo tư thế
modeling/BodySurface.ts           nhận "displacement provider" (trường cơ) thay cho musclesAt khi có
modeling/CharacterModelBuilder.ts dùng resolveBodyDesign khi hero có bodyDesign
rigging/SkinWeightGenerator.ts    dải hoà trộn theo bán kính chi (SkinWeightConfig)
animation/PoseDefinition.ts       aPose, deepSquat, running, combatAttack (+ POSE_GROUNDED)
```

---

## B-M0 — Audit body và baseline (spec Phase 0)

### Task B1: Báo cáo audit body, ảnh mốc thân trần, số đo body

**Files:**
- Create: `docs/superpowers/reports/2026-11-04-body-audit.md`, `tests/visual/baseline/body-baseline/*.png`.
- Modify:
  - `scripts/shots.config.json`: bộ `body-baseline`;
  - `src/game/character/tools/bench.ts`: cột `bodyTriangles`, `bodyVertices`, `bodyBuildMs`.

**Interfaces:**
- Produces: `BenchRow.bodyTriangles`, `BenchRow.bodyVertices`, `BenchRow.bodyBuildMs`. Thời gian đo `buildBodyGeometry` + `generateSkinWeights`.

- [ ] **Step 1: Viết báo cáo audit, bằng tiếng Việt.** Gồm:
  - **kỹ thuật tạo hình hiện tại:**
    - ring superellipse theo tiết diện khai báo tay, đơn vị mét, riêng cho từng hero;
    - khối cơ là bump cos² **cộng dồn**: các bump chồng nhau thì phồng thành cục, không có rãnh trừ khi `amount` âm;
    - nối vai/háng bằng port + bridge;
    - 16 cạnh mỗi vòng;
  - **hạn chế** so với 5 mục tiêu ở spec 1.1;
  - **ràng buộc rig:** các band khớp `LIMB_BLEND` tính bằng mét tuyệt đối, nên chi to thì dải hoà trộn hẹp tương đối;
  - **ràng buộc equipment/socket:** mọi điểm gắn đi qua `BodySurface.pointAt` + `BodyCollider`, nên thân mới tự kéo giáp theo;
  - **chiến lược chuyển đổi** như phần Architecture.
- [ ] **Step 2: Thêm bộ ảnh `body-baseline`.** Gồm:
  - 3 hero × front/side/back/threeQuarter ở `stage=body` (thân trần, chưa có giáp);
  - Kestrel ở `stage=skinned` với `armRaise`, `elbowBend`, `kneeBend`, `torsoTwist`.

  Query có `lighting=legacy`. Chạy `npm run snapshot -- body-baseline`, rồi `node scripts/visual-compare.mjs body-baseline --accept`, chụp lại và so: Expected 0.00%.
- [ ] **Step 3:** Thêm cột body vào bench. Chạy `npm run heroes:bench`, chép bảng vào báo cáo audit.
- [ ] **Step 4:** Chạy `npm test`, commit `docs(body): body audit, body-only visual baseline, body benchmark columns`.

**→ Dừng B-M0.** Gửi báo cáo, ảnh thân trần và số đo.

---

## B-M1 — Body Configuration System (spec Phase 1)

### Task B2: BodyDesignConfig, tỷ lệ heroic, 5 archetype, resolver tỷ lệ

**Files:**
- Create: `body/config/{BodyDesign,heroicBaseline,archetypes,resolveBodyDesign}.ts`, `tests/body/resolveBodyDesign.test.ts`.

**Interfaces:**
- Produces:
  ```ts
  export type Archetype = 'tank' | 'fighter' | 'assassin' | 'mage' | 'bruiser';
  export type MuscleGroup = 'chest' | 'shoulders' | 'arms' | 'abdomen' | 'back' | 'glutes' | 'thighs' | 'calves';
  export interface BodyDesignConfig {
    version: 1; style: 'stylized-anatomical'; surface: 'smooth'; proportionPreset: 'heroic';
    muscleDefinition: 'low' | 'medium' | 'high';
    archetype: Archetype;
    /** Mét; mặc định theo archetype. */
    height?: number;
    proportions?: Partial<Record<'shoulderWidth'|'chestWidth'|'waistWidth'|'hipWidth'|'armVolume'|'legVolume', number>>;
    muscles?: Partial<Record<MuscleGroup, number>>;
    surfaceSettings?: { smoothness?: number; muscleSeparation?: number; surfaceResolution?: 'low'|'medium'|'high' };
    material?: { roughness?: number; metalness?: number; anatomicalContrast?: number };
  }
  export const BODY_DESIGN_LIMITS  // min/max cho mọi số; Task B3 dùng để sinh schema
  ```
- Giới hạn: hệ số `proportions` 0.6–1.6, `muscles` 0–2, `smoothness` và `muscleSeparation` 0–1, `height` 1.4–2.4 m, `roughness`/`metalness` 0–1, `anatomicalContrast` 0–0.5.
- **Tỷ lệ heroic chuẩn** (cao = 1). Spec 1.3 cho:
  - vai 0.27, ngực 0.23, eo 0.16, hông 0.19;
  - cánh tay trên 0.18, cẳng tay 0.16, đùi 0.25, cẳng chân 0.24.

  Mình đặt thêm:
  - đầu: cao 0.125, rộng 0.10, sâu 0.117;
  - cổ: dài 0.039, bán kính 0.039;
  - torso: dài 0.314, sâu ngực 0.135, sâu eo 0.105, `pelvisDepth` 0.028;
  - bàn tay dài 0.089;
  - bàn chân: dài 0.144, cao 0.039, rộng 0.058;
  - chu vi chi theo `armVolume` = `legVolume` = 1:
    - cánh tay trên rộng 0.085, cẳng tay 0.068, cổ tay 0.035;
    - đùi 0.105, gối 0.064, bắp chân 0.072, cổ chân 0.042.

  Tổng chiều cao 1.007, nằm trong dung sai 0.02 của `resolveProportions`.
- **Archetype**, mỗi archetype là hệ số nhân (vai, ngực, eo, hông, tay, chân), hệ số cơ chung, `muscleSeparation`, `height`:

  | Archetype | vai | ngực | eo | hông | tay | chân | cơ | tách cơ | cao (m) |
  |---|---|---|---|---|---|---|---|---|---|
  | tank | 1.25 | 1.22 | 1.28 | 1.15 | 1.3 | 1.3 | 1.3 | 0.4 | 1.95 |
  | fighter | 1.1 | 1.1 | 0.95 | 1.0 | 1.12 | 1.1 | 1.15 | 0.7 | 1.85 |
  | assassin | 1.0 | 0.97 | 0.88 | 0.95 | 0.95 | 0.97 | 1.0 | 0.85 | 1.78 |
  | mage | 0.92 | 0.92 | 0.9 | 0.95 | 0.85 | 0.88 | 0.7 | 0.5 | 1.8 |
  | bruiser | 1.32 | 1.15 | 1.1 | 1.1 | 1.38 | 1.3 | 1.25 | 0.45 | 1.92 |

  Bruiser khác Tank: tay và vai lớn hơn, eo gọn hơn ("Rất rộng / Lớn / Vừa / Rất lớn / Dày", spec 1.3).
- Produces: `resolveBodyDesign(config: BodyDesignConfig): ResolvedBody`, với `ResolvedBody = { proportions: CharacterProportions; bodyShape: BodyShape; anatomy: AnatomyConfig }`.
  - `bodyShape` sinh tiết diện torso/arm/leg/head từ tỷ lệ và hệ số; `muscles` để rỗng.
  - `anatomy` mang hệ số từng nhóm cơ, `definition` và `separation` cho Task B4–B8.
  - Hệ số hero nhân với hệ số archetype. Trường thiếu lấy mặc định.

- [ ] **Step 1: Viết test.**
  - Mỗi archetype: `resolveProportions` ok; chiều cao bind = `height` ± 0.02.
  - Tỷ lệ vai/cao của fighter = 0.27 × 1.1 ± 0.005.
  - Thứ tự silhouette: bề vai bruiser > tank > fighter > assassin > mage. Eo tank > bruiser > fighter. Chu vi tay bruiser lớn nhất.
  - Override `proportions.shoulderWidth: 1.2` trên fighter → vai = 0.27 × 1.1 × 1.2 × height.
  - Hệ số ngoài giới hạn bị kẹp vào [min, max].
  - Không mutate dữ liệu archetype.
  - Kết quả tất định: hai lần gọi deep-equal.
- [ ] **Step 2:** Chạy `npx vitest run tests/body`. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(body): BodyDesignConfig, heroic baseline, five archetypes, proportion resolver`.

### Task B3: Schema `bodyDesign`, kiểm tra dữ liệu, dựng thân từ cấu hình, preview archetype

**Files:**
- Modify:
  - `scripts/gen-schema.mjs`;
  - `templates/hero.schema.json` (sinh lại);
  - `definitions/HeroDefinition.ts` (`bodyDesign?`; `proportions`/`bodyShape` thành tuỳ chọn ở kiểu nguồn);
  - `definitions/validateHero.ts`;
  - `modeling/CharacterModelBuilder.ts`;
  - `src/preview/{PreviewParams,PreviewApp}.ts` (`lineup=archetypes`, `archetype=<id>`);
  - `scripts/shots.config.json`.
- Create: `tests/body/bodyDesignSchema.test.ts`.

**Interfaces:**
- Schema: hero có **đúng một** trong hai: (`proportions` + `bodyShape`) hoặc `bodyDesign`.
  - Có cả hai → một lỗi `/bodyDesign`: "không dùng cùng lúc bodyDesign với proportions/bodyShape — chọn một".
  - Không có cái nào → một lỗi `/`: "thiếu bodyDesign (hoặc proportions + bodyShape theo kiểu cũ)".
  - Lọc lỗi `oneOf` sao cho chỉ còn hai dòng trên.
- Validator: khi có `bodyDesign` thì chạy `resolveBodyDesign` rồi chạy các luật ngữ nghĩa (chiều cao, sections) trên kết quả. Hero đã kiểm tra mang `proportions`/`bodyShape` đã resolve, để mọi code phía sau không cần biết đường nào.
- `CharacterModel.anatomy?: AnatomyConfig`. Task B4 trở đi dùng.
- Preview `lineup=archetypes`: 5 thân trần đứng cạnh nhau, dùng trang bị rỗng, nhãn tiếng Việt.

- [ ] **Step 1: Viết test.**
  - File chỉ có `bodyDesign: {archetype:'fighter', …hằng}` hợp lệ, dựng được, rig 9/9.
  - Có cả `bodyDesign` lẫn `proportions` → đúng 1 lỗi, path `/bodyDesign`.
  - Thiếu cả hai → 1 lỗi.
  - `muscles.chest: 3` → lỗi khoảng giá trị 0–2.
  - `archetype: 'ninja'` → lỗi liệt kê 5 archetype.
  - `style: 'cartoon'` → lỗi `phải bằng "stylized-anatomical"`.
  - Kiểu cũ không đổi: `v1Parity` xanh.
  - Schema sinh ra trùng file đã commit.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code, chạy `npm run schema`.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Thêm và chụp bộ `b-m1`: `lineup=archetypes` ở stage `proportions` và `body`, góc front và side. **Tự xem ảnh**: 5 dáng phải khác nhau rõ.
- [ ] **Step 5:** Commit `feat(body): bodyDesign schema and validation; bodies built from archetype config; archetype lineup`.

**→ Dừng B-M1.** Gửi lineup 5 archetype (chưa có cơ) và bảng tỷ lệ.

---

## B-M2 — Torso prototype (spec Phase 2, cổng chặn của spec mục 9)

### Task B4: Muscle field: hình khối cơ, smooth union, rãnh tách cơ

**Files:**
- Create: `body/anatomy/MuscleField.ts`, `tests/body/muscleField.test.ts`.
- Modify: `modeling/BodySurface.ts`: tham số tuỳ chọn `displacement?: DisplacementProvider`. Có thì dùng thay `musclesAt`; `undefined` thì hành vi cũ giữ nguyên từng bit.

**Interfaces:**
- Produces, đúng theo spec 2.4:
  ```ts
  export interface MuscleParameters {
    width: number; height: number; depth: number;   // width: nửa độ rộng theo góc (độ); height: nửa chiều dài theo t; depth: độ nhô (tỷ lệ bán kính tại chỗ)
    bulge: number;        // 0–1: độ "đầy" của đỉnh (0 = nhọn cos², 1 = phẳng đỉnh)
    taper: number;        // −1..1: đỉnh lệch về đầu (−) hay cuối (+) theo t
    separation: number;   // 0–1: độ sâu rãnh với cơ kề bên
    startOffset: number; endOffset: number;   // cắt bớt hai đầu theo t (0–0.5 của height)
    smoothness: number;   // 0–1: độ mềm khi hoà với cơ khác (k của smooth union)
  }
  export interface MuscleDef extends MuscleParameters { id: string; part: BodyPart; t: number; angleDeg: number; mirror: boolean; group: MuscleGroup }
  export type DisplacementProvider = (part: BodyPart, side: Side | undefined, t: number) => ((theta: number) => number) | undefined;
  export const createMuscleField = (defs: MuscleDef[], radiusAt: (part: BodyPart, t: number, theta: number) => number): DisplacementProvider;
  ```
- **Thuật toán**, cố định để hình học tất định:
  - **Khối đơn:** b_i(t, θ) = depth_i · r(t, θ) · P(u) · P(v).
    - u, v là khoảng cách chuẩn hoá theo t (có lệch `taper` và cắt `start/endOffset`) và theo góc.
    - P(x) = (1 − x²)^(2 − 1.5·bulge) với x < 1, ngược lại 0. Profile này trơn C¹ ở mép.
  - **Hoà các khối:** D = smax_k(b_1 … b_n), với smax là log-sum-exp có k = 0.004 + 0.02·smoothness (mét). Không cộng dồn như v1.
  - **Rãnh:** với mỗi cặp khối chồng nhau i, j: D −= s_ij · smin(b_i, b_j)·0.6, trong đó s_ij = max(separation_i, separation_j) × hệ số `muscleSeparation` toàn thân. Rãnh chỉ xuất hiện ở chỗ hai cơ gặp nhau.
  - **Kẹp:** D ≥ −0.25 × max(b_i, b_j) quanh rãnh. Đây là quy tắc "rãnh không quá sâu thành tượng giải phẫu".
  - Cơ `mirror` trên torso/neck/head sinh thêm bản đối xứng ở góc −angleDeg.

- [ ] **Step 1: Viết test.**
  - Một khối: D lớn nhất tại tâm = depth·r, bằng 0 ngoài vùng, đạo hàm số theo t và θ liên tục ở mép (bước 1e-4, sai khác < 1e-3).
  - Hai khối trùng nhau: D = một khối (smax), **không** gấp đôi như v1.
  - Hai khối kề, `separation` 0 → không có rãnh (D ở giữa ≥ min đỉnh × 0.9). `separation` 1 → có rãnh, sâu không quá giới hạn kẹp.
  - `taper` 0.5 → đỉnh lệch về phía t lớn.
  - Tất định: chạy hai lần cho kết quả bằng nhau.
  - `BodySurface` không có provider → các ring y hệt trước (`v1Parity` xanh).
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(body): muscle field with smooth union and controlled separation grooves`.

### Task B5: Thư viện cơ torso, áp vào thân, ảnh duyệt torso

**Files:**
- Create: `body/anatomy/torso.ts`, `tests/body/torsoAnatomy.test.ts`.
- Modify:
  - `body/config/resolveBodyDesign.ts`: `anatomy.defs`;
  - `modeling/CharacterModelBuilder.ts`: có anatomy thì truyền provider;
  - `src/preview/PreviewApp.ts`: `zoom=torso` (khung từ hông tới cằm);
  - `scripts/shots.config.json`.

**Interfaces:**
- Produces: `torsoMuscles(body: { proportions; anatomy }): MuscleDef[]`. Toạ độ (t, góc) theo tỷ lệ; `depth` nhân với hệ số nhóm × mức `muscleDefinition` (low 0.5, medium 0.75, high 1).
- Các nhóm cơ:
  - **chest:** pectoralis (mirror, góc ±28°, t 0.74–0.9). Thêm một khối nhỏ dưới ngực để mép ngực dưới rõ (spec "chest projection").
  - **abdomen:** rectus abdominis 3 hàng × 2 bên (t 0.36 / 0.48 / 0.6, góc ±9°, `separation` cao, tạo đường linea alba ở giữa); obliques (±62°, t 0.3–0.55); serratus (±75°, t 0.62–0.74, 3 khối nhỏ).
  - **back:** trapezius (180° ± 25°, t 0.85–1, lan lên cổ); latissimus (±130°, t 0.55–0.85, độ nở theo `back`); erector (180° ± 12°, t 0.2–0.5).
- Trục góc của torso: 0° = trước (+Z), 90° = +X (bên trái nhân vật).

- [ ] **Step 1: Viết test.**
  - Với từng archetype:
    - lưới thân không NaN, không tam giác suy biến, vẫn kín và định hướng nhất quán (dùng lại `tests/helpers/topology.ts`);
    - nhìn ngang, ngực nhô trước bụng (z lớn nhất ở t 0.82 > z ở t 0.5 + 0.01 m);
    - bụng có 3 cặp đỉnh dọc đường giữa và rãnh giữa hai bên (giá trị D tại góc 0° < tại ±9° ở cả 3 hàng);
    - lưng rộng hơn eo ≥ 15%, đo ở `back` = 1.
  - Hệ số biên (Review Focus #1): `chest 2, abdomen 2, muscleSeparation 1` → không mặt lật (pháp tuyến hướng ra ngoài so với trục ở ≥ 99.5% tam giác), độ sâu rãnh ≤ giới hạn kẹp.
  - Mage có cơ ngực thấp hơn tank ≥ 40%.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code. Lưới thân có anatomy chạy ở `surfaceResolution: 'high'` tạm thời bằng `radialSegments` 32 và `ringsPerMeter` 90; Task B6 thay bằng hệ thống phân giải.
- [ ] **Step 4:** Chạy `npm test`. Chụp `b-m2`:
  - 5 archetype × `zoom=torso` × front/side/back/threeQuarter, ánh sáng legacy;
  - cùng góc của Kestrel thân cũ để so.

  **Tự xem từng ảnh**, ghi vào ledger cái gì đạt và chưa đạt theo spec 1.2 (primary/secondary forms). Sửa tham số `torso.ts` tới khi đạt, nhưng không nới các test.
- [ ] **Step 5:** Commit `feat(body): stylized torso anatomy (chest, abdomen, obliques, serratus, traps, lats, erectors)`.

**→ Dừng B-M2. Cổng chặn.** Gửi ảnh torso 5 archetype, cạnh thân cũ. Chỉ sang B-M3 khi chủ dự án duyệt hình torso.

---

## B-M3 — Surface blending (spec Phase 3)

### Task B6: Độ phân giải thích ứng, nối vai/cổ/háng bằng smooth union, đo chất lượng bề mặt

**Files:**
- Create: `body/surface/{resolution,JunctionBlend,SurfaceQuality}.ts`, `tests/body/surfaceQuality.test.ts`.
- Modify: `modeling/BodySurface.ts` (`uniformTs` nhận thêm điểm cần dày lưới), `modeling/UnifiedBody.ts` (gọi `blendJunctions` sau khi ghép, trước khi tính normal), `modeling/BodyGeometry.ts`.

**Interfaces:**
- Produces: `resolutionFor(level: 'low'|'medium'|'high'): { radialSegments: 16|24|32; ringsPerMeter: 50|70|90 }`. Chỉ áp cho hero có `bodyDesign`.
- **Ring thích ứng:** chèn thêm ring ở những t mà |∂D/∂t| lớn nhất vượt 0.15, tối đa +40% số ring của bộ phận.
- Produces: `blendJunctions(geometry: THREE.BufferGeometry, surface: BodySurface, regions: Uint8Array, opts: { radius: number; k: number }): void`.
  - Với đỉnh trong dải nối:
    - vai: đỉnh torso cách port ≤ `radius` và ring tay có t < 0.12;
    - gốc cổ: t torso > 0.96 và t cổ < 0.3;
    - háng: đỉnh quanh vòng nối chậu–chân, t chân < 0.1.
  - Chiếu đỉnh lên mặt 0 của F = smin_k(f_A, f_B). Mỗi f là khoảng cách xấp xỉ tới bề mặt tham số của một bộ phận: (khoảng cách tới trục tại t chiếu) − r(t, θ) − D(t, θ).
  - Tối đa 6 bước Newton dọc gradient (sai phân 1e-4), mỗi bước dịch tối đa 0.01 m.
  - k = 0.015 + 0.03·`smoothness`.
  - Không đổi topology.
- Produces, trong `SurfaceQuality.ts`:
  - `maxDihedralDeg(geometry, excludeRegions): number`;
  - `flippedTriangleRatio(geometry, reference?): number`;
  - `signedVolume(geometry): number`.

- [ ] **Step 1: Viết test.** Với 5 archetype ở `high`:
  - **liền mạch:** góc nhị diện lớn nhất giữa hai mặt kề ≤ 40°, trừ vùng bàn tay và bàn chân (đây là định nghĩa đo được của "không seam, không đường nối sắc" ở spec 1.2 và 5.1); ghi số đo thực tế vào ledger;
  - **nách:** sau `blendJunctions`, góc nhị diện lớn nhất trong dải nối vai giảm so với trước khi blend;
  - không có mặt lật;
  - thể tích thay đổi < 3%;
  - lưới vẫn kín;
  - **số tam giác thân** ở `high` nằm trong 20k–45k (spec mục 7), in ra;
  - `low`/`medium` cho ít tam giác hơn theo thứ tự.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test` (`v1Parity` xanh). Chụp `b-m3`: zoom vai, nách (`armRaise`), háng của fighter và tank, trước/sau blend.
- [ ] **Step 5:** Commit `feat(body): adaptive ring density, smooth-union junction blending, surface quality metrics`.

### Task B7: Vật liệu body riêng và tô rãnh cơ (anatomicalContrast)

**Files:**
- Create: `body/materials/bodyMaterial.ts`, `tests/body/bodyMaterial.test.ts`.
- Modify:
  - `modeling/CharacterModelBuilder.ts`;
  - `export/CharacterExporter.ts`: giữ `color` của thân khi vật liệu body bật `vertexColors`;
  - `debug/WeightVisualizer.ts`: lưu và khôi phục màu đỉnh gốc.

**Interfaces:**
- Produces: `BodyMaterialConfig = { roughness: number; metalness: number; anatomicalContrast: number }`. Mặc định roughness 0.62, metalness 0, contrast 0.18.
- `baseColor` lấy từ vai trò `bodyPaint` (đúng spec: baseColor). Vật liệu tên `<vai trò>~body`, `vertexColors: true`, không dùng chung instance với giáp.
- Produces: `cavityColors(geometry: THREE.BufferGeometry, contrast: number): Float32BufferAttribute`.
  - Độ lõm c = dot(n, trung bình đỉnh kề − p), chuẩn hoá theo phân vị 95.
  - Màu = 1 − contrast · clamp(c, 0, 1), xám, nhân với màu vật liệu.

- [ ] **Step 1: Viết test.**
  - Hero có `bodyDesign`: vật liệu thân tên kết thúc `~body`, roughness 0.62, khác instance với vật liệu giáp cùng vai trò.
  - Đỉnh ở rãnh bụng (góc 0°, giữa các hàng) tối hơn đỉnh ở đỉnh khối bụng.
  - `anatomicalContrast` 0 → mọi màu = 1.
  - Xuất GLB → nạp lại: thân có `COLOR_0`, vật liệu giữ roughness.
  - Bật/tắt xem weight → màu đỉnh trở lại như trước.
  - Hero kiểu cũ: không có `~body`, `v1Parity` xanh.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test`. Chụp `b-m3` (bổ sung) torso có và không có tô rãnh.
- [ ] **Step 5:** Commit `feat(body): dedicated body material with subtle cavity shading`.

**→ Dừng B-M3.** Gửi ảnh trước/sau blend ở nách, cổ, háng; số đo góc nhị diện; số tam giác; ảnh tô rãnh.

---

## B-M4 — Full body anatomy (spec Phase 2, phần tay chân)

### Task B8: Vai (3 đầu delta), tay, hông, chân; chuyển tiếp khuỷu và gối

**Files:**
- Create: `body/anatomy/{shoulder,arm,hip,leg}.ts`, `tests/body/limbAnatomy.test.ts`.
- Modify: `body/config/resolveBodyDesign.ts`, `scripts/shots.config.json`.

**Interfaces:**
- Produces: `shoulderMuscles`, `armMuscles`, `hipMuscles`, `legMuscles`, cùng chữ ký với `torsoMuscles`.
  - Toạ độ theo khung bộ phận v1: tay có A = +Z (trước), B = +Y (trên); chân có A = +Z, B = hướng ra ngoài.
- Các nhóm cơ (stylized, ưu tiên primary/secondary, không làm gân nhỏ):
  - **shoulders:** delta trước, giữa, sau (arm, t 0–0.22, góc 0°/90°/180°). Phần đầu delta nối vào torso qua dải blend ở Task B6.
  - **arms:**
    - biceps (t 0.15–0.42, mặt trước);
    - triceps (t 0.1–0.45, mặt sau, hai khối);
    - brachialis (t 0.38–0.48, bên ngoài);
    - cẳng tay: nhóm gấp (t 0.55–0.75, mặt dưới) và nhóm duỗi (t 0.55–0.72, mặt trên). Cẳng tay thon dần về cổ tay.
  - **glutes:** cơ mông (torso t 0.02–0.2, ±150°) nối sang leg t 0–0.12 mặt sau.
  - **thighs:**
    - quadriceps: vastus lateralis, vastus medialis (giọt nước trên gối), rectus femoris;
    - hamstrings;
    - phần chuyển tiếp gối bằng phẳng.
  - **calves:** gastrocnemius hai đầu (leg t 0.58–0.75, mặt sau), tibialis (mặt trước t 0.55–0.8).

- [ ] **Step 1: Viết test.** Với 5 archetype:
  - **Biceps:** ở t 0.3 mặt trước, D > 0.
  - **Khuỷu và gối:** D ≈ 0 ở t = `elbowT` và `kneeT` ± 0.02, để khớp gập không có cục cơ.
  - **Bắp chân:** chu vi lớn nhất của cẳng chân nằm ở t 0.6–0.72.
  - **Mông:** điểm sau nhất của hông nằm ở torso t < 0.2.
  - **Vai:** bề vai đo qua delta lớn hơn khoảng cách hai khớp vai ≥ 12%.
  - Áp lại các điều kiện bề mặt của Task B6 (góc nhị diện, không mặt lật, kín) cho toàn thân.
  - Hệ số biên (Review Focus #1): tay 1.6, chân 1.6, `arms`/`thighs` 2.0 → không tự cắt ở nách và háng. Kiểm tra: không đỉnh nào của tay nằm trong thân và ngược lại, bằng `createBodyCollider` trên từng phần.
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code. **Tự xem ảnh** và chỉnh.
- [ ] **Step 4:** Chạy `npm test`. Chụp `b-m4`: 5 archetype thân trần × 4 góc; zoom tay, đùi, bắp chân của fighter và tank.
- [ ] **Step 5:** Commit `feat(body): shoulder, arm, glute and leg anatomy with clean elbow/knee transitions`.

**→ Dừng B-M4.** Gửi ảnh toàn thân 5 archetype × 4 góc và các zoom.

---

## B-M5 — Rigging và biến dạng (spec Phase 4)

### Task B9: Skin weight theo kích thước chi; đo biến dạng

**Files:**
- Create: `body/deformation/DeformationMetrics.ts`, `tests/body/deformation.test.ts`.
- Modify: `rigging/SkinWeightGenerator.ts`, `tests/rigging/SkinWeightGenerator.test.ts`.

**Interfaces:**
- Produces: `SkinWeightConfig = { maxInfluences: 4; blendRadius: number; normalizeWeights: true }` (spec 4.2).
  - Dải hoà trộn ở mỗi khớp = max(`LIMB_BLEND` cũ, `blendRadius` × bán kính chi tại khớp). Mặc định `blendRadius` 0.55.
  - Chỉ áp khi hero có `bodyDesign`. Hero cũ dùng nguyên `LIMB_BLEND` (`v1Parity`).
- Produces: `measureDeformation(instance: CharacterInstance, pose: PoseId): DeformationReport`, với `DeformationReport = { volumeRatio: number; flippedRatio: number; elbowAreaRatio: { left: number; right: number }; kneeAreaRatio: { left: number; right: number } }`.
  - Skin trên CPU bằng `applyBoneTransform`.
  - `flippedRatio` so pháp tuyến từng tam giác lúc tạo tư thế với pháp tuyến bind đã xoay theo bone chính của tam giác đó.
  - `AreaRatio` là diện tích tiết diện qua khớp lúc tạo tư thế chia lúc bind.

- [ ] **Step 1: Viết test.** Với 5 archetype × (`armRaise`, `elbowBend`, `kneeBend`, `legRaise`, `torsoTwist`):
  - `volumeRatio` trong 0.92–1.08;
  - `flippedRatio` ≤ 0.005;
  - `elbowAreaRatio` và `kneeAreaRatio` ≥ 0.55 ở tư thế gập.

  Ngoài ra, dải hoà trộn ở vai của tank rộng hơn của mage. Ghi bảng số đo thực tế vào ledger.
- [ ] **Step 2:** Chạy test. Expected: FAIL, chưa có `measureDeformation`.
- [ ] **Step 3:** Viết code. Nếu tư thế nào chưa đạt thì chỉnh `blendRadius` hoặc vị trí cơ gần khớp. Không nới ngưỡng.
- [ ] **Step 4:** Chạy `npm test`.
- [ ] **Step 5:** Commit `feat(body): limb-size-aware skin blending and deformation metrics`.

### Task B10: Tư thế A-Pose, Deep Squat, Running, Combat Attack

**Files:**
- Modify:
  - `definitions/HeroDefinition.ts` (`POSE_IDS`);
  - `animation/PoseDefinition.ts`, `animation/PoseBuilder.ts`;
  - `debug/RigDebugPanel.ts`, `src/showcase/ControlsPanel.ts` (nhãn tiếng Việt);
  - `scripts/gen-schema.mjs`;
  - `tests/animation/poses.test.ts`, `tests/body/deformation.test.ts`.

**Interfaces:**
- `POSE_IDS` thêm `aPose`, `deepSquat`, `running`, `combatAttack`. Nhãn: "A-Pose", "Ngồi xổm sâu", "Chạy", "Đòn tấn công".
- Góc theo quy ước dấu ở đầu `PoseDefinition.ts`:
  - **aPose:** `UpperArm` hạ 45° (trái `[0,0,-45]`, phải `[0,0,45]`).
  - **deepSquat:** `UpperLeg [-110,0,±8]`, `LowerLeg [135,0,0]`, `Foot [-25,0,0]`, `Spine [20,0,0]`, `Chest [10,0,0]`; hai tay đưa trước cân bằng.
  - **running:** chân trái đá trước (`[-55,0,0]`, gối `[20,0,0]`), chân phải ra sau (`[25,0,0]`, gối `[85,0,0]`); tay vung ngược chân, khuỷu 80°; `Spine [8,0,0]`.
  - **combatAttack:** đòn đấm/chém về trước của tay phải: `RightUpperArm` đưa trước, `RightLowerArm` duỗi; `Spine [0,-18,0]`, `Chest [0,-14,0]` xoay theo đòn; chân tấn, trái trước, phải sau.
- Produces: `POSE_GROUNDED: ReadonlySet<PoseId>` = {`deepSquat`, `running`, `combatAttack`}. `PoseBuilder` hạ hoặc nâng `Hips` theo Y để điểm thấp nhất của bàn chân trụ chạm y của bind. Bỏ tư thế thì trả `Hips` về bind. V2 Task 12 dùng lại cơ chế này cho `crouch`.

- [ ] **Step 1: Viết test.**
  - **Hướng bone:**
    - aPose: cánh tay chếch xuống 45° ± 3°;
    - deepSquat: hông thấp hơn bind ≥ 0.35 × chiều dài chân, gót cách sàn ≤ 0.01;
    - running: hai đùi ngược pha;
    - combatAttack: cẳng tay phải chỉ về +Z (dot ≥ 0.8).
  - **Bind:** về bind không trôi.
  - **Biến dạng:** thêm 4 tư thế mới vào bảng biến dạng của Task B9, cùng ngưỡng, cho 5 archetype (Review Focus #2: tank và bruiser ở `deepSquat`).
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code. Chỉnh góc hoặc weight tới khi đạt.
- [ ] **Step 4:** Chạy `npm test`. Chụp `b-m5`: lưới ảnh 5 archetype × 8 tư thế (T, A, Arms Raised, Elbow Flexion, Torso Twist, Deep Squat, Running, Combat Attack) ở góc threeQuarter, thân trần, legacy. **Tự xem ảnh**.
- [ ] **Step 5:** Commit `feat(body): A-pose, deep squat, running and combat attack test poses (grounded)`.

**→ Dừng B-M5.** Gửi lưới ảnh 5 × 8 và bảng số đo biến dạng.

---

## B-M6 — Chuyển hero sang hệ mới (spec Phase 5)

### Task B11: Kestrel → fighter (hero đại diện), so cũ/mới, giáp và socket

**Files:**
- Create: `tests/fixtures/kestrel.v1.json` (bản sao nguyên trạng), `tests/body/heroMigration.test.ts`.
- Modify:
  - `heroes/kestrel/hero.json`: bỏ `proportions` và `bodyShape`, thêm `bodyDesign: { archetype: 'fighter', … }`;
  - `tests/fixtures/kestrel.ts` và `tests/regression/v1Parity.test.ts`: lấy Kestrel V1 từ fixture, để mọi test cũ giữ dữ liệu;
  - `scripts/shots.config.json`.

**Interfaces:**
- Không thêm API. Nếu cần chỉnh trang bị Kestrel cho khớp thân mới (tọa độ `t` và góc của giáp, độ dày), chỉ sửa trong `hero.json` và ghi lý do vào ledger.

- [ ] **Step 1: Viết test.**
  - Kestrel mới: rig 9/9.
  - **Giáp:** chìm ≤ 5 mm, đo trên lưới thật.
  - **Socket** (Review Focus #3): mọi socket nằm ngoài thân, cách mặt thân ≤ 0.03 m. Súng trên lưng không có đỉnh nào chìm > 5 mm.
  - **Tư thế:** giáp chìm ≤ 15 mm ở `armRaise`, `deepSquat`, `torsoTwist`, đo theo cách của V2 Task 12. Plan này chưa có V2 Task 12, nên tạm dùng skin CPU từ `DeformationMetrics` và collider của lưới đã skin.
  - GLB khớp.
  - Chiều cao 1.85 ± 0.02.
- [ ] **Step 2:** Chạy test. Expected: FAIL trên Kestrel cũ (chưa có `bodyDesign`).
- [ ] **Step 3:** Chuyển Kestrel. Chỉnh giáp tới khi đạt.
- [ ] **Step 4:** Chạy `npm test`. Chụp `b-m6`: Kestrel cũ và mới đặt cạnh nhau × front/side/threeQuarter/back, có giáp, ánh sáng legacy; cùng các tư thế `armRaise`, `deepSquat`, `running`, `combatAttack`.
- [ ] **Step 5:** Commit `feat(body): Kestrel migrated to the anatomical body system (fighter)`.

**→ Dừng giữa milestone.** Gửi ảnh so cũ/mới của Kestrel, chờ duyệt rồi mới làm Task B12 (spec 8.10: "After the representative hero passes validation…").

### Task B12: Granite → tank (Morrow → bruiser nếu được phép); lineup archetype trên showcase

**Files:**
- Modify:
  - `heroes/granite/hero.json`;
  - `heroes/morrow/hero.json` (chỉ khi được phép);
  - `tests/fixtures/` (bản V1 của từng hero chuyển đổi);
  - `src/preview/PreviewApp.ts` (lineup `archetypes` có giáp của hero mẫu);
  - `tests/body/heroMigration.test.ts`.

- [ ] **Step 1:** Mở rộng test của Task B11 cho Granite (và Morrow nếu có). Thêm test ma trận: trang bị Kestrel trên 5 archetype → giáp chìm ≤ 5 mm, socket hợp lệ, rig 9/9. Đây là bằng chứng "body đổi không làm hỏng rig, socket, attachment".
- [ ] **Step 2:** Chạy test. Expected: FAIL với Granite cũ.
- [ ] **Step 3:** Chuyển hero, chỉnh giáp.
- [ ] **Step 4:** Chạy `npm test`. Chụp `b-m6` (bổ sung): mọi hero đã chuyển × 4 góc; lineup 5 archetype mặc trang bị Kestrel.
- [ ] **Step 5:** Commit `feat(body): Granite (tank) on the shared body system; archetype equipment matrix`.

**→ Dừng B-M6.**

---

## B-M7 — Tối ưu và hồi quy (spec Phase 6)

### Task B13: Cache body, benchmark so baseline, không rò tài nguyên, cập nhật ảnh mốc

**Files:**
- Create: `body/BodyGeometryCache.ts`, `tests/body/bodyCache.test.ts`, `docs/superpowers/reports/body-bench.md`.
- Modify: `modeling/CharacterModelBuilder.ts`, `src/preview/PreviewApp.ts` (dùng cache, dispose khi dựng lại), `tests/visual/baseline/`.

**Interfaces:**
- Produces: `createBodyGeometryCache(capacity = 8): BodyGeometryCache`, với `get(key, build): THREE.BufferGeometry`.
  - Khoá = JSON có sắp xếp key của cấu hình body đã resolve. Không gồm trang bị.
  - Giá trị lưu = body geometry kèm skin weight. Trả về **bản clone**.
  - Đẩy ra mục ít dùng nhất (LRU), và dispose bản bị đẩy ra.
  - V2 Task 11 (`HeroBuildCache`) sẽ dùng lại.

- [ ] **Step 1: Viết test.**
  - Lần thứ hai cùng cấu hình: cùng dấu vân tay, khác uuid geometry, thời gian < 0.5 lần lần đầu.
  - Đổi một hệ số → cache trượt.
  - Dựng lại 20 lần với hệ số thay đổi: mọi geometry và vật liệu đã thay đều phát sự kiện `dispose`, và cache không giữ quá `capacity` mục (Review Focus #5).
- [ ] **Step 2:** Chạy test. Expected: FAIL.
- [ ] **Step 3:** Viết code.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck && npm run build`. Chạy `npm run heroes:bench > docs/superpowers/reports/body-bench.md` và thêm cột so với baseline B-M0. Spec mục 7 yêu cầu "không regression": thời gian dựng có cache phải không chậm hơn baseline; số tam giác body tăng là có chủ đích, được ghi rõ.

  Cập nhật ảnh mốc:
  - `node scripts/visual-compare.mjs v2-baseline --accept --only <ảnh của hero đã chuyển>` sau khi chủ dự án đã duyệt hình ở B-M6;
  - các ảnh còn lại (hero chưa chuyển) phải lệch 0.00%.
- [ ] **Step 5:** Commit `perf(body): body geometry cache, benchmark vs baseline, leak-free rebuild; refresh baselines`.

**→ Dừng B-M7.** Gửi:
- bảng benchmark trước/sau;
- kết quả so ảnh;
- bảng nghiệm thu 9 nhóm của spec mục 7, mỗi nhóm kèm bằng chứng.
