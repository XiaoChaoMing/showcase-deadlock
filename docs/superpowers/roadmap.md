# Roadmap hệ thống hero

Cập nhật: 2026-11-04. Nhánh làm việc: `feat/hero-v2`.

Sau mỗi milestone đều dừng lại để chủ dự án duyệt (ảnh + tóm tắt tiếng Việt).

## Thứ tự thực hiện

| # | Giai đoạn | Plan | Trạng thái |
|---|---|---|---|
| 0 | Hero Showcase v1: pipeline, Kestrel, template | `plans/2026-11-04-hero-showcase.md` | Xong (nhánh `feat/hero-showcase`, chưa merge) |
| 1 | V2-M0: dấu vân tay V1, ảnh mốc, benchmark, audit | `plans/2026-11-04-hero-design-system-v2.md` | Xong |
| 2 | **Anatomical Body System** (B-M0 → B-M7) | `plans/2026-11-04-anatomical-body-system.md` | **Làm tiếp theo** |
| 3 | V2-M1 → V2-M7 (đã điều chỉnh theo mục dưới) | `plans/2026-11-04-hero-design-system-v2.md` | Chờ giai đoạn 2 |

Lý do làm body trước:
- Body là nền cho mọi thứ còn lại của V2: giáp, socket, tư thế súng, ngân sách hiệu năng.
- Làm V2 trên thân cũ rồi đổi thân thì phải chỉnh và chụp lại mọi thứ hai lần.

## Giai đoạn 2: Anatomical Body System

| Milestone | Nội dung | Kết quả để duyệt |
|---|---|---|
| B-M0 | Bỏ Granite và Morrow; audit body, ảnh mốc thân trần, số đo body | Báo cáo + ảnh |
| B-M1 | `bodyDesign`, tỷ lệ heroic, 5 archetype × 2 dáng thân (nam/nữ), schema | Lineup 10 dáng (chưa có cơ) |
| B-M2 | Muscle field (smooth union, rãnh) + **torso prototype** | Ảnh torso 5 archetype. **Cổng chặn:** chưa duyệt torso thì không làm tay chân |
| B-M3 | Mật độ lưới thích ứng, nối vai/cổ/háng bằng smooth union, vật liệu body, tô rãnh cơ | Ảnh trước/sau ở nách, cổ, háng; số đo độ liền mạch |
| B-M4 | Cơ vai, tay, mông, chân | Toàn thân 5 archetype × 4 góc |
| B-M5 | Skin weight cho cơ lớn; tư thế A-Pose, Deep Squat, Running, Combat Attack; đo biến dạng | Lưới ảnh 5 archetype × 8 tư thế + bảng số đo |
| B-M6 | Kestrel → fighter (duyệt riêng); template và preview chỉ dùng hệ mới | Ảnh so cũ/mới, lineup 10 dáng mặc giáp |
| B-M7 | Cache body, benchmark so baseline, không rò tài nguyên | Bảng benchmark + nghiệm thu 9 nhóm |

## Điều chỉnh plan V2 khi làm tiếp sau giai đoạn 2

Những điều chỉnh này sẽ được ghi thành ruling trong ledger của plan V2 khi thực hiện.

1. **Task 4 (schema V2):**
   - Bỏ `design.bodyPreset`; schema V2 nhận nguyên khối `bodyDesign` từ Task B3.
   - Cặp `proportions`/`bodyShape` dạng override một phần chỉ còn cho hero dùng thân kiểu cũ.
   - `GEOMETRY_PROFILES` không quyết định `radialSegments` của thân có `bodyDesign`; `surfaceResolution` quyết định.
2. **Task 5 (chuyển V1 → V2):** hero đã có `bodyDesign` được giữ nguyên khối đó khi chuyển.
3. **Task 6 (ma trận preset dáng người):** bỏ, vì Task B12 đã làm ma trận trang bị × 5 archetype. Bốn preset cũ chỉ còn là đường cũ.
4. **Task 11 (`HeroBuildCache`):** dùng lại `BodyGeometryCache` của Task B13 cho phần thân.
5. **Task 12 (tư thế):**
   - A-Pose, Deep Squat, Running, Combat Attack và `POSE_GROUNDED` đã có từ Task B10.
   - Task 12 chỉ thêm `armsForward`, `crouch`, `legRaiseRight` và đo giáp xuyên thân theo tư thế (dùng lại phần skin CPU của `DeformationMetrics`).
6. **Task 14–15 (tư thế súng):** test IK và tư thế súng chạy trên 5 archetype thay vì 4 preset cũ.
7. **Task 2 / v1Parity:**
   - Hero đã chuyển sang `bodyDesign` lấy bản V1 từ `tests/fixtures/*.v1.json` cho test tương thích.
   - Ảnh mốc `v2-baseline` của các hero đó được chụp lại sau B-M6.

## Quyết định của chủ dự án (2026-11-04)

- Bỏ hai hero Granite và Morrow. Bản sao Morrow lưu tại `.superpowers/backup/morrow/hero.json`.
- Mọi hero và template dùng hoàn toàn phong cách mới (`bodyDesign`).
- Làm luôn dáng thân nữ: `bodyType: feminine` cho cả 5 archetype.
- Câu hỏi về súng cho Granite và Morrow không còn áp dụng. Tư thế súng ở V2 chỉ cần Kestrel và các hero mới.
