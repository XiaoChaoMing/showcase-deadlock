# Tạo hero mới từ template

Mỗi hero là **một file JSON**, không cần sửa code. Trang showcase tự nhận mọi file `heroes/<id>/hero.json`.

Ví dụ tham khảo: `heroes/kestrel/hero.json` (trinh sát, dáng athletic, 46 trang bị).

## 1. Các bước

1. Copy `templates/hero-template.json` thành `heroes/<id>/hero.json`. Ví dụ: `heroes/ember/hero.json`.
2. Đổi `"id"` cho **trùng tên thư mục**: chữ thường, số, gạch nối, bắt đầu bằng chữ. Ví dụ `"ember"`.
3. Chọn dáng người: copy `proportions` và `bodyShape` từ một file trong `templates/body-presets/`.

   | Preset | Dáng |
   |---|---|
   | `athletic` | Kestrel, 1.80 m |
   | `heavy` | tank, 1.95 m |
   | `slim` | gầy cao, 1.85 m |
   | `feminine` | dáng nữ, 1.70 m |

4. Sửa `profile`, `palette`, `bodyPaint`, rồi thêm `sockets` và `equipment`.
5. Chạy `npm run dev`, chọn hero ở cột trái.
   - Có lỗi dữ liệu: thẻ hero hiện màu đỏ, kèm đường dẫn trường sai và lý do.
   - Hợp lệ: xem mục **Kiểm tra rig** (phải đạt 9/9) và bấm các nút tư thế để soi khớp.
6. Bấm **Xuất GLB**. File tải về, được nạp lại để đối chiếu, và trang phải báo "khớp hoàn toàn".

> **Gợi ý khi sửa trong VS Code:** dòng `"$schema": "../../templates/hero.schema.json"` giúp VS Code gợi ý tên trường, mô tả tiếng Việt và báo lỗi ngay khi gõ. Đường dẫn này chỉ đúng khi file nằm trong `heroes/<id>/`.

**Đơn vị:** độ dài tính bằng mét (1 đơn vị Three.js), góc tính bằng độ, màu dạng `#RRGGBB`.

## 2. Các nhóm trường

| Trường | Nội dung |
|---|---|
| `id`, `version` | Mã hero (= tên thư mục), phiên bản format (luôn là `1`) |
| `profile` | `name`, `role`, `tagline`, `description`: chữ hiển thị trên trang |
| `proportions` | Số đo khung xương (chi tiết ở mục 3) |
| `bodyShape` | Hình dáng bề mặt thân: tiết diện, độ mịn, khối cơ (mục 4) |
| `palette` | Bảng màu theo vai trò. Bắt buộc có `skin`, `suit`, `armor`, `accent`; được thêm tuỳ ý (`glow`, `leather`...) |
| `bodyPaint` | Màu từng vùng thân: `torso`, `neck`, `head`, `arm`, `hand`, `leg`, `foot` → tên vai trò trong palette hoặc `#RRGGBB` |
| `sockets` | Điểm gắn đồ có tên (không phải bone) |
| `equipment` | Giáp, mũ, phụ kiện, vũ khí (mục 6) |
| `showcase` | Tư thế mặc định và góc camera trên trang showcase |

Một màu trong palette có thể là `"#RRGGBB"`, hoặc là object `{ "color": "#RRGGBB", "emissive": 0–5, "metalness": 0–1, "roughness": 0–1 }`. `emissive > 0` làm vật phát sáng, dùng cho kính hoặc đèn.

## 3. `proportions`: số đo khung xương

| Trường | Ý nghĩa | Khoảng |
|---|---|---|
| `height` | Chiều cao thân từ đáy bàn chân tới đỉnh đầu, **không tính trang bị** | 0.8–3.0 |
| `head.width/height/depth` | Kích thước đầu | 0.005–1.5 |
| `neck.length/radius` | Chiều dài và bán kính cổ | |
| `torso.length` | Từ khớp hông tới gốc cổ | |
| `torso.shoulderWidth` | Bề ngang vai. Khớp vai đặt ở ±0.425 × giá trị này | |
| `torso.hipWidth` | Bề ngang hông. Khớp hông đặt ở ±0.30 × giá trị này | |
| `torso.pelvisDepth` | Phần chậu thò xuống dưới khớp hông (đáy chậu = hipY − pelvisDepth) | |
| `arms.upperLength/lowerLength/handLength` | Bắp tay, cẳng tay, bàn tay | |
| `legs.upperLength/lowerLength` | Đùi, cẳng chân | |
| `foot.length/height/width` | Bàn chân. `height` = độ cao cổ chân | |

**Luật chiều cao:** tổng `foot.height + legs.lowerLength + legs.upperLength + torso.length + neck.length + head.height` phải gần bằng `height`.
- Lệch ≤ 0.02: tự co giãn cho khớp.
- Lệch > 0.02: báo lỗi tại `/proportions/height`.

**Tham chiếu tỷ lệ anh hùng (Loomis, "8 đầu")**, với `height` = 8 đầu:

| Mốc | Vị trí |
|---|---|
| Đáy chậu | ½ chiều cao |
| Núm vú | 2 đầu từ đỉnh |
| Rốn | 3 đầu từ đỉnh |
| Vai | rộng khoảng 2⅓ đầu |
| Hông | rộng khoảng 1½ đầu |
| Sải tay | bằng chiều cao |

## 4. `bodyShape`: hình dáng bề mặt

| Trường | Ý nghĩa |
|---|---|
| `radialSegments` | Số cạnh quanh mỗi vòng tiết diện: **8, 16, 24 hoặc 32** (bội số của 8). 8 là góc cạnh nhất |
| `ringsPerMeter` | Mật độ vòng dọc thân (10–120). Càng cao đường cong càng mượt |
| `shading` | `flat` (mặt phẳng low-poly) hoặc `smooth` (mượt) |
| `torso/head/arm/leg.sections` | Các tiết diện dọc bộ phận: `{ t, width, depth, forward? }`. `t` tăng dần, phần tử đầu `t = 0`, phần tử cuối `t = 1` |
| `*.squareness` | Độ vuông của tiết diện: 2 = elip, cao hơn = vuông hơn (1.5–6) |
| `neck.taper` | Bán kính đỉnh cổ / bán kính gốc cổ |
| `hand.width/thickness` | Bàn tay (lòng bàn tay úp xuống khi dang tay chữ T) |
| `foot.toeTaper` | Độ thu nhỏ ở mũi chân |
| `muscles` | Khối cơ (mục 5) |

Ý nghĩa của `t` trong `sections`:

| Bộ phận | `t = 0` | `t = 1` |
|---|---|---|
| `torso` | đáy chậu | gốc cổ |
| `head` | cằm | đỉnh đầu |
| `arm` | khớp vai | cổ tay |
| `leg` | khớp hông | cổ chân |

- `width` là bề ngang theo hướng 90°, `depth` là bề dày theo hướng 0°. Xem quy ước góc ở mục 5.
- `forward` dịch tâm tiết diện ra trước (+) hoặc ra sau (−).
- Với `head`, ba giá trị `width`, `depth`, `forward` là **tỷ lệ** so với `proportions.head`. Với các bộ phận khác là **mét**.

## 5. Quy ước vị trí trên bề mặt: `part`, `side`, `t`, `angleDeg`, `standoff`

Nhân vật nhìn về **+Z**, **+Y** hướng lên, **tay trái nằm ở +X**.

```
             đầu (+Y)
               │
     phải ─────┼───── trái (+X)        nhìn từ trên xuống:   trước (+Z)
               │                                                 0°
             chân                                       −90° ────┼──── 90°  (thân/đầu: 90° = bên trái)
                                                                180°
```

| `part` | `t` chạy từ → tới | Góc 0° | Góc 90° |
|---|---|---|---|
| `torso` | đáy chậu → gốc cổ | phía trước | bên trái nhân vật (+X) |
| `neck` | gốc cổ → khớp đầu | phía trước | bên trái |
| `head` | cằm → đỉnh đầu | phía trước | bên trái |
| `arm` (cần `side`) | vai → cổ tay | phía trước | **phía trên** (cả hai tay) |
| `hand` (cần `side`) | cổ tay → đầu ngón | phía trước | phía trên |
| `leg` (cần `side`) | hông → cổ chân | phía trước | **phía ngoài** (cả hai chân) |
| `foot` (cần `side`) | gót → mũi chân | **phía trên** | phía ngoài |

- Góc 180° là phía sau (với `foot` là phía dưới). Góc âm đi theo chiều ngược lại.
- Nhờ quy ước "trên" và "ngoài" ở trên, cùng một bộ số cho tay hoặc chân trái và phải sẽ cho kết quả đối xứng.
- `standoff` là khoảng đẩy ra khỏi bề mặt theo pháp tuyến (mét).

**Khối cơ** (`bodyShape.muscles`):

```json
{ "part": "torso", "t": 0.72, "length": 0.07, "angleDeg": 18, "spreadDeg": 25, "amount": 0.018 }
```

- Một chỗ phồng mượt (amount dương) hoặc rãnh lõm (amount âm), tâm ở `t` / `angleDeg`, lan `±length` theo `t` và `±spreadDeg` quanh bộ phận.
- Trên `torso/neck/head`, khối cơ tự đối xứng sang góc `−angleDeg`. Trên tay và chân, khối cơ tự áp cho cả hai bên.
- Giáp tự ôm theo khối cơ.
- Mẹo: giữ khối cơ ngực/xô cách vùng vai (thân `t` khoảng 0.8–1, góc khoảng ±45°–135°). Khối cơ ở đó sẽ đẩy chỗ nối cánh tay và tạo mỏm.
- Nhóm cơ Kestrel đang dùng: ngực, bụng, xô (V-taper), cầu vai, mông (thân + đầu đùi), rãnh sống lưng, vai tròn, bắp tay trước/sau, cẳng tay, đùi trước/sau, bắp chân, cơ cổ.

## 6. `sockets` và `equipment`

**Socket** là điểm gắn đồ có tên, nằm trên bề mặt thân và đi theo bone gần nhất:

```json
{ "name": "back_weapon", "mount": { "part": "torso", "t": 0.7, "angleDeg": 180, "standoff": 0.08 }, "rotationDeg": [0, 0, -30] }
```

Hệ toạ độ tại điểm gắn (dùng cho `box`, `assembly`, socket):
- **+Z** = pháp tuyến hướng ra khỏi thân
- **+Y** = hướng lên
- `rotationDeg` = xoay thêm [x, y, z] (độ)

Mọi món trang bị có `id` (không trùng), `kind`, `color`, tuỳ chọn `edgeColor` (viền) và `bone` (ép gắn vào một bone cụ thể). Bone mặc định được suy ra từ vị trí. Có 5 kiểu:

### `plate`: tấm giáp cong ôm bộ phận

```json
{ "id": "chest-plate", "kind": "plate", "part": "torso", "tStart": 0.55, "tEnd": 0.82,
  "angleStartDeg": -70, "angleEndDeg": 70, "thickness": 0.015, "gap": 0.008,
  "ridge": 0.015, "point": 0.04, "color": "armor", "edgeColor": "accent" }
```

| Trường | Ý nghĩa |
|---|---|
| `layers`, `layerOverlap` | Nhiều lớp chồng nhau, ví dụ giáp vai. Lớp đầu (gần `tStart`) nằm ngoài cùng |
| `bulge` | Phồng tròn ở giữa |
| `ridge` | Sống gờ sắc dọc giữa tấm |
| `point` | Vuốt mép phía `tEnd` thành mũi chữ V |
| `angleStartDeg`..`angleEndDeg` | Đủ 360° thì khép kín vòng |

### `band`: dải vòng (thắt lưng, kính mũ, băng tay, bọc cổ tay)

```json
{ "id": "belt", "kind": "band", "part": "torso", "t": 0.2, "height": 0.05,
  "angleStartDeg": -180, "angleEndDeg": 180, "thickness": 0.012, "gap": 0.004, "color": "leather" }
```

### `shell`: vỏ mũ

```json
{ "id": "helmet", "kind": "shell", "coverage": 0.7, "faceOpeningDeg": 110,
  "thickness": 0.014, "gap": 0.01, "crest": { "height": 0.02, "width": 0.03 }, "color": "armor" }
```

- `coverage`: phần đầu được che, tính từ đỉnh xuống (1 = che hết).
- `faceOpeningDeg`: ô hở mặt (0 = mũ kín).
- `faceOpeningTop`: mép trên ô hở mặt theo `t` của đầu (mặc định 0.72, ngang lông mày). Phía trên mép này mũ luôn kín.
- `crest`: gờ chạy dọc đỉnh mũ. Khi mũ hở mặt, gờ bắt đầu từ trán.

### `box`: hộp áp vào thân (ba lô, túi)

```json
{ "id": "pouch", "kind": "box", "attach": { "mount": { "part": "torso", "t": 0.2, "angleDeg": 60, "standoff": 0.016 } },
  "size": [0.07, 0.08, 0.04], "cornerRadius": 0.004, "color": "leather" }
```

`size` = [rộng, cao, dày]. Mặt "dày" áp vào thân. `attach` là `{ "mount": ... }` hoặc `{ "socket": "tên" }`. Có thể thêm `offset` và `rotationDeg`.

### `assembly`: đồ ghép từ nhiều khối (vũ khí, khiên, sừng, ăng-ten)

```json
{ "id": "blade", "kind": "assembly", "attach": { "socket": "back_weapon" }, "rotationDeg": [90, 0, 0], "color": "armor",
  "parts": [
    { "shape": "box",   "size": [0.03, 0.03, 0.14], "position": [0, 0, -0.12], "color": "leather" },
    { "shape": "blade", "size": [0.008, 0.06, 0.5], "position": [0, 0, 0.22],  "color": "armor" } ] }
```

| `shape` | `size` | Ghi chú |
|---|---|---|
| `box` | [x, y, z] | hộp |
| `cylinder`, `cone` | [đường kính, chiều dài, 0] | trục theo +Z |
| `spike` | [rộng, cao, dài] | gai chóp 4 cạnh, mũi về +Z |
| `wedge` | [rộng, cao, dài] | vây tam giác, kéo dài theo Z |
| `blade` | [mỏng, bản rộng, dài] | lưỡi dao, mũi về +Z |

Mẹo:
- Muốn một khối chạy theo trục +Z (trụ, gai, lưỡi) dựng đứng **dọc theo thân**, đặt `rotationDeg: [90, 0, 0]` (mũi chĩa xuống) hoặc `[-90, 0, 0]` (mũi chĩa lên).
- Sừng hoặc vây hai bên đầu: dùng `mount` ở `head` với `angleDeg` ±75–90 rồi chỉnh `rotationDeg`.

## 7. Lỗi hay gặp

| Thông báo | Cách sửa |
|---|---|
| `/id: id "x" phải trùng tên thư mục "y"` | Đổi `id` hoặc tên thư mục cho giống nhau |
| `/proportions/height: Tổng các đoạn dọc ... lệch quá 0.02` | Chỉnh lại các đoạn dọc hoặc `height` |
| `/bodyShape/radialSegments: phải là bội số của 8...` | Dùng 8, 16, 24 hoặc 32 |
| `/bodyShape/arm/sections: các tiết diện phải có t tăng dần...` | Sắp lại `t`, phần tử đầu là 0, phần tử cuối là 1 |
| `/equipment/3/color: màu "gold" không có trong palette...` | Thêm vai trò `gold` vào `palette` hoặc dùng `#RRGGBB` |
| `/equipment/5/attach/socket: socket "x" chưa được khai báo` | Thêm socket vào `sockets` hoặc sửa tên |
| `/equipment/2/side: bộ phận "arm" cần khai báo "side"` | Thêm `"side": "left"` hoặc `"right"` |
| `/equipment/1/id: mã trang bị "x" bị trùng` | Đổi `id` |
| `/proportions/extra: trường "extra" không được phép ở đây (có thể gõ sai tên?)` | Kiểm tra chính tả tên trường |

**Giáp tự tránh thân:** `plate`, `band`, `shell` và `box` được kiểm tra với lưới thân thật lúc dựng. Phần nào chìm vào thân, nhất là ở chỗ nối giữa các bộ phận (bẹn, nách, dốc cổ–vai), sẽ tự được đẩy ra ngoài. `assembly` (gai, vũ khí...) thì không được đẩy, vì đôi khi bạn muốn nó cắm vào giáp; hãy chỉnh bằng `standoff` hoặc `offset`.

Nếu giáp nằm chồng lên trang bị khác (ví dụ kính đặt trên mũ) mà bị lẫn vào nhau, đặt `gap` của món nằm trên lớn hơn tổng `gap + thickness` của món nằm dưới. Việc tự đẩy ra chỉ tính với thân, không tính với trang bị khác.

Mép giáp đặt sát đường giữa hai chân (ví dụ góc trong của giáp hông, `angleStartDeg` < −40 ở `leg` `t` < 0.2) sẽ bị ép gấp nếp. Nên giữ góc trong khoảng từ −40 trở lên.
