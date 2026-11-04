# Audit hệ thống body trước Anatomical Body System (Phase 0)

Đối chiếu `docs/superpowers/specs/phong-cach-thiet-ke.md` với code trên `feat/hero-v2` (sau khi bỏ Granite và Morrow). Hero còn lại: Kestrel (dáng athletic). Có 4 preset dáng cũ: athletic, heavy, slim, feminine.

## 1. Kỹ thuật tạo hình hiện tại

| Bước | File | Cách làm |
|---|---|---|
| Tỷ lệ | `definitions/resolveProportions.ts`, `CharacterLayout.ts` | `CharacterProportions` tính bằng mét tuyệt đối, từng hero tự khai báo. Layout đặt khớp theo hằng tỷ lệ chung: SPINE 0.2, CHEST 0.55, vai 0.88 chiều dài torso, khớp vai 0.425 × shoulderWidth, khớp hông 0.3 × hipWidth. |
| Tiết diện | `modeling/BodySurface.ts`, `geometry/profile.ts`, `geometry/RingSweep.ts` | Mỗi bộ phận là chuỗi ring superellipse. Bề ngang và bề dày nội suy (Hermite đơn điệu) từ danh sách `sections` mà hero tự khai báo bằng mét. Kestrel: torso 8 tiết diện, tay 7, chân 8. |
| Khối cơ | `BodySurface.musclesAt` | Bump cos² theo t và góc, **cộng dồn** (`lift += amount × …`), đẩy theo pháp tuyến ring. Hai bump chồng nhau thì độ cao cộng lại thành cục. Rãnh chỉ có khi khai báo `amount` âm. Kestrel có 15 khối cơ khai báo tay. |
| Lưới | `modeling/UnifiedBody.ts` | Một lưới kín liền khối. Torso → cổ → đầu nối bằng chuỗi ring. Hông tách thành hai vòng chân. Vai có cổng (port) trên torso, nối với ring đầu tay bằng dải bridge. Bàn chân nối từ cổ chân. |
| Độ phân giải | `bodyShape.radialSegments` (bội số của 8), `ringsPerMeter` | Kestrel: 16 cạnh mỗi vòng, 60 ring/m, dày thêm ±6 cm quanh khuỷu và gối. |
| Shading | `BodyGeometry.ts` | `smooth`: `computeVertexNormals` trên lưới có index. `flat`: tách đỉnh, nên preset heavy/slim/feminine có số đỉnh gấp ~3 lần. |
| Bàn tay, bàn chân | `BodySurface` | Profile cố định (HAND_PROFILE, footProfile), không có ngón. |

## 2. Hạn chế so với 5 mục tiêu của spec 1.1

1. **Anatomical readability:** khối cơ là các bump đơn lẻ do từng hero tự khai báo. Không có thư viện nhóm cơ chung. Muốn nhìn ra nhóm cơ thì phải chỉnh tay cho từng hero.
2. **Heroic silhouette:** không có hệ tỷ lệ chuẩn hay archetype. Tỷ lệ là số mét tự do của từng hero, nên silhouette không nhất quán giữa các hero.
3. **Smooth continuity:**
   - bump cộng dồn tạo cục ở chỗ chồng nhau;
   - vùng nách và háng là dải bridge thẳng giữa port và ring, chưa có chuyển tiếp cong;
   - 16 cạnh mỗi vòng còn thấy rõ cạnh gãy trên silhouette.
4. **Procedural scalability:** thêm một hero mới phải viết lại khoảng 25 tiết diện và 15 khối cơ bằng mét.
5. **Rig compatibility:** đạt. Hệ mới phải giữ được điểm này.

## 3. Ràng buộc rig

- 20 bone, tên và cây cố định. Bind là T-Pose.
- Ánh xạ tên logic trong spec 4.1: Clavicle = `LeftShoulder`/`RightShoulder`, Pelvis = `Hips`, Forearm = `LeftLowerArm`/`RightLowerArm`.
- Skin weight (`rigging/SkinWeightGenerator.ts`):
  - torso, cổ, đầu, bàn chân: IDW theo vùng (p = 4);
  - tay và chân: dải hoà trộn smoothstep theo chuỗi khớp. Độ rộng dải tính bằng mét tuyệt đối: `LIMB_BLEND` tay 0.06/0.045/0.04, chân 0.07/0.05/0.04.
  - Hệ quả: chi to (tank, bruiser) có dải hoà trộn hẹp tương đối so với bán kính chi. Task B9 sẽ đổi sang dải tỷ lệ theo bán kính.
- Các hằng ở chỗ nối (`UnifiedBody.ts`): `PORT_CLEARANCE` 0.02, `CROTCH_TO_LEG` 0.03, `ANKLE_ABOVE_FOOT` 0.025, `SHOULDER_PORT_HEADROOM` 0.85.

## 4. Ràng buộc equipment và socket

- Mọi điểm gắn (plate, band, shell, socket, box) đi qua `BodySurface.pointAt(part, side, t, angle)`, sau đó `BodyCollider` đẩy ra khỏi lưới thật.
  - Hệ quả: khi thân đổi hình, giáp **tự bám theo** bề mặt mới.
  - Rủi ro: kích thước giáp (độ rộng góc, độ dày) có thể không còn hợp với dáng mới. Phải kiểm tra lại bằng test giáp chìm ≤ 5 mm và bằng ảnh (Task B11, B12).
- Quy ước khung gắn: +Z = pháp tuyến ra ngoài, +Y = lên. Không đổi.

## 5. Chiến lược chuyển đổi

- Giữ xương sống `BodySurface` → `UnifiedBody` → skin → equipment.
- Hệ mới thay hai đầu vào của xương sống:
  1. `bodyDesign` → resolver sinh tỷ lệ và tiết diện;
  2. trường cơ (muscle field) dùng smooth union thay cho bump cộng dồn.
- Ở nách, cổ và háng, dùng SDF có chọn lọc.
- Hero không có `bodyDesign` đi đường cũ. Dấu vân tay ở `tests/regression/v1Parity.test.ts` khoá việc này.
- Kestrel là hero đại diện đầu tiên (fighter). Sau đó template và preview chuyển hẳn sang hệ mới.

## 6. Mốc (baseline)

**Ảnh:** `tests/visual/baseline/body-baseline/`, 24 ảnh:
- thân trần của Kestrel và 4 preset × 4 góc;
- Kestrel đã skin ở 4 tư thế.

Chụp lại lần hai lệch 0.00%.

**Số đo** (`npm run heroes:bench`, Node, chưa có cache):

| Hero | Tam giác | Draw call | Vật liệu | Dựng lần đầu ms | Dựng lại ms | Thân: tam giác | Thân: đỉnh | Thân: ms |
|---|---|---|---|---|---|---|---|---|
| kestrel | 21022 | 201 ⚠ | 11 | 223 | 262 | 8272 | 4138 | 10 |
| kestrel+athletic | 21022 | 201 ⚠ | 11 | 260 | 257 | 8272 | 4138 | 10 |
| kestrel+heavy | 20674 | 201 ⚠ | 11 | 250 | 250 | 7632 | 22896 | 17 |
| kestrel+slim | 20598 | 201 ⚠ | 11 | 275 | 269 | 7600 | 22800 | 19 |
| kestrel+feminine | 19286 | 201 ⚠ | 11 | 235 | 240 | 6736 | 20208 | 15 |

Nhận xét:
- Phần thân chỉ chiếm khoảng 8k tam giác và 10–19 ms. Thời gian dựng chủ yếu nằm ở trang bị (đẩy giáp ra khỏi thân qua collider).
- Mục tiêu 20k–45k tam giác cho thân (spec mục 7) nghĩa là thân mới sẽ dày hơn khoảng 3–5 lần. Thời gian dựng thân dự kiến tăng tương ứng, nên Task B13 sẽ thêm cache.
