# Audit kiến trúc trước V2 (Phase 0)

Đối chiếu `docs/superpowers/specs/herov2.md` với code v1 trên nhánh `feat/hero-showcase` (commit `9ec531a`).

## 1. Module trong spec ↔ code hiện có

| Spec (mục 1.2 / 11) | Code hiện có | Ghi chú cho V2 |
|---|---|---|
| HeroDefinition | `definitions/HeroDefinition.ts` | Chỉ có kiểu V1 (`version: 1`). Thêm `NormalizedHero` và `v2/HeroDefinitionV2.ts`. |
| HeroLoader | `runtime/HeroRegistry.ts` (`loadHeroRegistry`, `parseRaw`) | Glob `heroes/*/hero.json?raw`. Thêm phát hiện version (`definitions/loadHero.ts`). |
| HeroValidator / HeroSchemaValidator | `definitions/validateHero.ts` + `templates/hero.schema.json` | Ajv và dịch lỗi tiếng Việt nằm chung với luật ngữ nghĩa. Tách bộ dịch lỗi ra để V2 dùng chung. |
| HeroMigration | chưa có | `migration/fromV1.ts`, `fromV2.ts`, `V1ToV2.ts`. |
| BodyBuilder / BodyPresetResolver / MuscleBuilder | `modeling/BodySurface.ts` (tiết diện + khối cơ), `modeling/UnifiedBody.ts` (lưới liền khối), `definitions/presets.ts` | Giữ lưới liền khối (Quyết định 2 trong plan). Preset hiện là thay nguyên khối; V2 cần merge một phần. |
| RigBuilder / BoneResolver / SocketResolver | `rigging/SkeletonBuilder.ts`, `rigging/BoneMapping.ts`, `rigging/Sockets.ts` | Không đổi. |
| PoseValidator / RigValidator | `rigging/RigValidator.ts` (9 kiểm tra), `animation/PoseDefinition.ts` (8 tư thế) | Thêm tư thế và đo va chạm theo tư thế. |
| GeometryFactory (primitives / surface / armor) | `modeling/geometry/{RingSweep,Slab,profile}.ts`, `modeling/equipment/*Builder.ts` | Primitive nằm trong `AssemblyBuilder.ts`. Bevel và giáp nhiều lớp sửa ở `Slab.ts` / `PlateBuilder.ts`. |
| EquipmentBuilder / AttachmentResolver | `modeling/equipment/EquipmentBuilder.ts` (`mountFrame`, `resolveAttach`, `resolveAttachBone`) | Quy ước +Z = pháp tuyến ra ngoài, +Y = lên. Giữ nguyên. |
| MaterialResolver / MaterialCache | `modeling/materials/MaterialBuilder.ts` (`createMaterials`, cache theo tên) | Chưa có preset. Thay bằng `MaterialResolver`. |
| HeroRenderer / CharacterRenderer | `runtime/CharacterFactory.ts` (`buildCharacter`) + dispose rải rác trong `ShowcaseApp.ts`, `PreviewApp.ts` | Gom vào `renderer/CharacterRenderer.ts`. |
| ShowcaseRenderer / LightingSetup / CameraSetup / ShadowSetup | `src/preview/Viewport.ts` (`addLights`, `addFloor`, `setView`, `setOrbit`) | Khoảng cách camera lấy từ JSON, chưa dựa vào bounding box. |
| HeroGLBExporter | `export/CharacterExporter.ts`, `CharacterImporter.ts`, `CharacterSummary.ts` | So sánh chưa xét thông số vật liệu. |
| VisualRegression | `scripts/snapshot.mjs` (chỉ chụp) | Thêm `scripts/visual-compare.mjs`. |

## 2. Interface công khai cần giữ

- `buildCharacter(hero) → CharacterInstance` gồm `{ root, body, rig, sockets, equipment, materials, layout, surface, collider, … }`.
- `validateHero(raw) → { ok, hero } | { ok: false, errors: {path, message}[] }`.
- `loadHeroRegistry(modules) → RegistryEntry[]`. id phải trùng tên thư mục.
- `exportCharacterGlb(hero) → { buffer, summary }`, `importCharacterGlb(buffer)`, `summarizeCharacter(root)`, `compareSummaries(a, b)`.
- `POSES`, `POSE_IDS`, `PoseAnimator`, `validateRig(instance)`.
- Tên node: `equip_<id>`, `socket_<name>`, `Body`. Tên bone theo `BONE_NAMES`.

## 3. Rủi ro tương thích V1

1. `ColorSpec` có hai dạng: chuỗi hex, hoặc object `{color, emissive?, metalness?, roughness?}`. Mặc định là roughness 0.7, metalness 0.05. Phát sáng dùng chính màu đó, cường độ = `emissive`.
2. `AssemblyBuilder` dùng hằng `ROUND_SEGMENTS = 12` cho cylinder/cone. Profile hybrid của spec là 8, nên V1 phải giữ 12.
3. `BoxBuilder` dùng `RoundedBoxGeometry` với 2 segment cố định.
4. Giáp nhiều lớp xếp bằng `lift = gap + (layers − 1 − i) × thickness`, chưa tính `ridge`/`bulge`, nên có thể xuyên nhau.
5. `Viewport` tự tạo đèn và sàn: không có tone mapping, không có environment map.
6. Schema V1 có `version` là `const 1`. Schema phải tách riêng cho V2.
7. `tests/fixtures/kestrel.ts` import trực tiếp `heroes/kestrel/hero.json`. Khi chuyển Kestrel sang V2, fixture phải chuyển sang bản sao V1.
8. `CharacterSummary.metadata` chỉ so `{id, version}`.
9. `heroes/morrow/hero.json` chưa được commit (file của chủ dự án). Baseline có Morrow, nhưng test chỉ duyệt các hero đang có trên đĩa.

Khoá tương thích: `tests/regression/v1Parity.test.ts` so dấu vân tay của 7 cấu hình (Kestrel, Granite, Morrow, 4 preset) với `tests/fixtures/v1-baseline.json`. Dấu vân tay gồm hash vị trí thân, skin weight, vị trí 20 bone, hash từng món trang bị và thông số từng vật liệu.

## 4. Lỗi nhỏ còn hoãn từ v1 ↔ task V2 sẽ đụng tới

| # | Lỗi | Task V2 |
|---|---|---|
| 1 | Khối cơ `amount` âm lớn có thể lật mặt lưới | Task 7 (`validateGeometry` sẽ phát hiện; chưa sửa) |
| 2 | Chân to lấn qua đường giữa không bị báo | Task 6 (ma trận preset) |
| 3 | Showcase không bắt lỗi khi dựng hero | Task 11 (`CharacterRenderer`) |
| 4 | Bật/tắt xem weight rò vật liệu | Task 11 (sửa trong plan) |
| 5 | Tên màu kiểu `"toString"` lọt kiểm tra | Task 4 (tra bằng `Object.hasOwn`) |
| 6 | RigValidator bỏ sót NaN; mục "tối đa 4 ảnh hưởng" không bao giờ fail | không có task; giữ hoãn |
| 7 | So sánh GLB chỉ xét id/version | Task 13 |
| 8 | Nút tư thế không cập nhật sau Reset | Task 15 (nhóm nút mới) |
| 9 | Thứ tự bố cục màn hẹp khác spec | không có task; giữ hoãn |
| 10 | Preview không dispose; nút xuất GLB ở preview không bắt lỗi | Task 11 |
| 11 | Có cả `package-lock.json` và `pnpm-lock.yaml` | không có task; giữ hoãn |
| 12 | `plate.point` chưa giới hạn khoảng giá trị | Task 4 (schema V2) |
