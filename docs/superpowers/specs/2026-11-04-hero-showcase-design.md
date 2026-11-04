# Hero Showcase – Tài liệu thiết kế

Ngày: 2026-11-04
Tài liệu nguồn: `quy-trinh.md` (cùng thư mục dự án)

## 1. Mục đích và lý do

Dự án cần một **trang web trưng bày các hero 3D hoàn chỉnh** được tạo hoàn toàn bằng code theo pipeline trong `quy-trinh.md` (Three.js, không dùng Blender hay phần mềm DCC).

Đợt này có hai đầu ra:

1. **Một hero hoàn chỉnh đầu tiên, tên "Kestrel"**, đi đủ 6 công đoạn của pipeline: proportions → mesh tham số → skeleton → skin weights → rig test → xuất GLB. Hero này được trưng bày trên trang showcase.
2. **Một bộ template tái sử dụng** gồm file JSON, schema và hướng dẫn. Lần sau muốn tạo hero mới chỉ cần copy template, sửa thông số, không phải sửa code.

Chủ dự án giao toàn bộ ý tưởng hero và các thông số cho người thiết kế. Mọi quyết định bên dưới có ghi *(quyết định của Claude)* là quyết định của Claude, chủ dự án chưa duyệt từng mục.

## 2. Mục tiêu

- Kestrel hiển thị trên trang showcase dưới dạng **một SkinnedMesh thật**: mesh thân liền khối, biến dạng theo bone. Không phải các khối cứng ghép lại.
- Giáp và phụ kiện là **mesh cứng gắn vào bone**, đúng khuyến nghị ở mục 12 của `quy-trinh.md`.
- Toàn bộ thông số riêng của hero (tỷ lệ, màu, trang bị, thông tin hiển thị) nằm trong **một file JSON**. Code sinh hình không chứa con số riêng của hero nào.
- Thêm hero thứ hai chỉ cần thêm một thư mục chứa `hero.json`. Trang showcase tự nhận ra hero mới, không phải sửa code.
- **Chỉnh được nhiều tham số hình dạng** *(yêu cầu của chủ dự án)*: chỉ bằng JSON phải tạo được các hero có cá tính và dáng người riêng, chứ không chỉ đổi màu và co giãn Kestrel. Cụ thể là dáng người khác hẳn (tank to bè, nhân vật nữ, người gầy cao), và trang bị có hình dạng khác hẳn chứ không chỉ khác vị trí hay kích thước.
- Trang showcase có đủ công cụ kiểm tra rig mà `quy-trinh.md` yêu cầu: tư thế thử, chỉnh từng bone, reset bind pose, xem bộ xương, xem skin weight.
- Xuất GLB, rồi **import lại để kiểm tra** ngay trên trang.
- Đạt checklist nghiệm thu ở mục 10 của `quy-trinh.md`. Có một ngoại lệ về số bone, xem mục 6.3.

## 3. Ngoài phạm vi

- Hệ thống animation thật: state machine, blend, locomotion. Chỉ có các tư thế tĩnh để thử rig, cộng một chuyển động thở nhẹ khi đứng (procedural, không phải AnimationClip).
- Gameplay: di chuyển, camera góc ba, combat, chỉ số máu/tốc độ.
- Bone ngón tay, ngón chân, bone khuôn mặt, IK.
- Texture vẽ tay hoặc UV unwrap chi tiết. Chỉ dùng vật liệu màu phẳng hoặc flat-shading.
- Lưu thumbnail PNG ra đĩa.
- Backend, đăng nhập, deploy.
- Tạo thêm hero thứ hai. Đợt này chỉ cần kiến trúc sẵn sàng cho việc đó.

## 4. Những điều không được xảy ra (dù code vẫn chạy)

- Nhân vật trông như các khối primitive ghép lại, lộ khe hở ở khớp.
- Gập khuỷu hoặc gối mà mesh bị rách, xoắn hay sụp méo nghiêm trọng.
- Con số riêng của Kestrel bị hardcode trong geometry/rigging code, khiến muốn tạo hero mới vẫn phải sửa code.
- Có một class `CharacterGenerator` ôm hết việc sinh hình, rig và pose.
- Hero mang dáng dấp, tên hoặc thiết kế của nhân vật từ game có sẵn, kể cả game Deadlock của Valve. Thư mục dự án tên "Deadlock", nhưng Kestrel phải là thiết kế gốc.
- Nút xuất GLB báo thành công chỉ vì không có exception, trong khi chưa import lại để kiểm tra.

## 5. Ràng buộc

- Three.js + TypeScript (strict). Không Blender, Unity, Unreal hay dịch vụ sinh nhân vật bên ngoài.
- Mọi geometry và skeleton sinh bằng code.
- Hệ toạ độ theo `quy-trinh.md`: +Y hướng lên, nhân vật nhìn về +Z, X là trái/phải. Bind pose là T-Pose. Chiều cao chuẩn 1.8 đơn vị.
- Tối đa 4 bone ảnh hưởng mỗi vertex, tổng weight mỗi vertex bằng 1.
- Máy dev: macOS, Node v26, npm 12, git có sẵn.
- Code đặt trong `/Users/minhduc/Desktop/Duan/Deadlock`. Thư mục hiện chỉ có `quy-trinh.md` và chưa phải git repo.

## 6. Những phần đã quyết định

### 6.1. Công cụ *(quyết định của Claude)*

- **Vite + TypeScript + Three.js**, chạy trên trình duyệt.
- Không dùng framework UI (React/Vue). Giao diện showcase là DOM + CSS thuần, vì trang nhỏ và phần 3D là trọng tâm.
- Panel chỉnh bone dùng `lil-gui`.
- Test logic bằng `vitest`: skeleton, skin weights, validator, đọc template.
- Khi scaffold sẽ chạy `git init` và commit tài liệu này cùng code.

### 6.2. Cấu trúc thư mục

Theo đúng mục 8 của `quy-trinh.md` (`src/game/character/...` với các module definitions, modeling, rigging, animation, export, debug, runtime) và giữ đúng ranh giới trách nhiệm trong bảng "Module boundaries". Thêm vào đó *(quyết định của Claude)*:

```
Deadlock/
├── heroes/
│   └── kestrel/
│       └── hero.json          ← định nghĩa Kestrel, dùng đúng format template
├── templates/
│   ├── hero-template.json     ← template trống có giá trị mặc định hợp lý
│   ├── hero.schema.json       ← JSON Schema, để VS Code gợi ý và kiểm tra khi sửa
│   └── HERO_TEMPLATE.md       ← hướng dẫn từng trường + các bước tạo hero mới
└── src/
    ├── game/character/...     ← pipeline theo quy-trinh.md
    └── showcase/              ← giao diện trang trưng bày
```

### 6.3. Skeleton

- Dùng **đúng cây bone ở mục 4.1 của `quy-trinh.md`**: Root, Hips, Spine, Chest, Neck, Head, 4 bone mỗi tay (Shoulder, UpperArm, LowerArm, Hand), 3 bone mỗi chân (UpperLeg, LowerLeg, Foot). Đếm chính xác là **20 bone**, không phải 21 như file ghi ("khoảng 21"). *(Quyết định của Claude: giữ đúng cây đã liệt kê, không thêm bone cho đủ 21. Checklist "21 bones" được hiểu là "đủ cây bone ở mục 4.1".)*
- Tên bone giữ nguyên tiếng Anh như trong file và cố định giữa các hero.
- **Socket** (điểm gắn đồ): `Object3D` con của bone, không phải bone, không nằm trong skeleton, không tham gia skinning. Kestrel dùng socket `back_weapon` gắn vào Chest. *(Quyết định của Claude)*
- Root tách khỏi Hips đúng như mục 4.2.

### 6.4. Hero Kestrel *(quyết định của Claude)*

**Ý tưởng:** trinh sát tiền tuyến, nhanh nhẹn, mặc giáp nhẹ. Dáng người tỷ lệ thực tế kiểu stylized low-poly, vai rộng, eo thon, chân hơi dài.

**Hình bóng nhận diện:** một bên vai có giáp lớn (trái), bên kia trống. Mũ kín đầu với dải kính ngang màu hổ phách phát sáng. Súng ngắn đeo chéo sau lưng.

**Tỷ lệ** (đơn vị Three.js, tổng chiều cao 1.80):

| Thông số | Giá trị |
|---|---|
| height | 1.80 |
| head (w × h × d) | 0.21 × 0.24 × 0.24 |
| neck length | 0.08 |
| torso: shoulderWidth / chestWidth / waistWidth / hipWidth | 0.46 / 0.34 / 0.27 / 0.32 |
| torso length | 0.55 |
| arms: upper / lower / hand length | 0.30 / 0.28 / 0.17 |
| legs: upper / lower | 0.44 / 0.43 |
| foot: length / height | 0.25 / 0.07 |

`hipWidth` không có trong interface mẫu của `quy-trinh.md`, được thêm vào vì cần cho phần hông và chân.

**Quy tắc chiều cao** *(quyết định của Claude)*:

- `proportions.height` đặt riêng cho từng hero. 1.80 là giá trị mặc định trong template và là chiều cao của Kestrel, không bắt buộc cho mọi hero.
- Chiều cao luôn đo **phần thân**, từ đáy bàn chân tới đỉnh đầu, **không tính trang bị** (mũ, giáp). Rig check và bảng so sánh GLB đều đo theo cách này.
- Khi đọc file, tổng các đoạn dọc (bàn chân, chân, phần hông, thân, cổ, đầu) được so với `height`:
  - lệch không quá 0.02: tự co giãn đều các đoạn dọc cho khớp đúng `height`;
  - lệch hơn 0.02: báo lỗi rõ ràng (tổng đang là bao nhiêu, `height` là bao nhiêu) và không render.
- Rig check kiểm tra chiều cao thân ≈ `proportions.height` (sai số 0.01).

**Màu:**

| Vai trò | Màu |
|---|---|
| Da (cổ, phần mặt lộ dưới kính nếu có) | `#C8956D` |
| Bộ đồ lót (thân, tay, chân) | `#3D4550` |
| Giáp | `#5B6573` |
| Điểm nhấn (viền giáp, dây đeo) | `#F2A93B` |
| Kính mũ | `#FFB547`, phát sáng (emissive) |

**Trang bị** (mesh cứng, mỗi món gắn vào một bone/socket):

| Món | Gắn vào | Ghi chú |
|---|---|---|
| Giáp ngực | Chest | ôm theo dáng ngực, không che vai |
| Giáp vai trái | LeftUpperArm | lớn, nhiều lớp, là nét nhận diện chính |
| Mũ | Head | che kín đầu |
| Kính mũ | Head | dải ngang, phát sáng |
| Ba lô nhỏ | Chest | phía sau lưng |
| Súng ngắn | socket `back_weapon` | đeo chéo sau lưng |
| Giáp ống chân (2 bên) | LeftLowerLeg / RightLowerLeg | |

Đồ gắn vào bone phải theo bone khi đổi tư thế và không xuyên vào thân quá mức ở các tư thế thử.

**Thông tin hiển thị:** tên "Kestrel", vai trò "Trinh sát / Scout", một câu giới thiệu ngắn và một đoạn mô tả 2–3 câu (builder tự viết, giọng văn game).

### 6.5. Format template `hero.json`

Một file JSON cho mỗi hero, gồm các nhóm:

- `id`, `version`: định danh và phiên bản format.
- `profile`: tên, vai trò, câu giới thiệu, mô tả. Chỉ dùng để hiển thị.
- `proportions`: mọi kích thước cơ thể ở mục 6.4. Mở rộng từ `CharacterProportions` trong `quy-trinh.md`.
- `bodyShape`: hình dáng mesh thân, phải đủ rộng để tạo được dáng người khác hẳn nhau. Tối thiểu gồm *(quyết định của Claude về danh sách; chủ dự án yêu cầu phạm vi rộng)*:
  - Thân: mặt cắt ngang tại nhiều mức dọc thân (hông, eo, bụng, ngực, vai), mỗi mức có độ rộng, độ dày trước-sau và độ lệch trước-sau. Đủ để tạo ngực/bụng nhô ra, lưng phẳng, eo thắt hay thân hình thùng.
  - Tay và chân: độ dày tại nhiều điểm dọc chi (gốc, cơ, khớp, cuối chi), để làm được bắp tay to, đùi to, ống chân thon, cổ tay nhỏ.
  - Đầu: hình dáng tổng thể (độ tròn/vuông, cằm, gáy), không chỉ kích thước hộp.
  - Bàn tay, bàn chân: kích thước và độ dày.
  - Độ mịn mesh (số đoạn quanh và dọc) và kiểu shading (flat hoặc smooth).
  - Template kèm sẵn vài preset dáng người để copy: `athletic` (Kestrel), `heavy` (tank), `slim`, `feminine`.
- `palette`: các màu theo vai trò (skin, suit, armor, accent, emissive). Cho phép thêm vai trò màu tuỳ ý.
- `equipment`: danh sách món đồ. Mỗi món gồm một **kiểu hình học tổng quát có tham số**, điểm gắn (bone hoặc socket), offset/rotation/scale và màu (theo tên vai trò trong palette hoặc mã màu).
  - Kiểu hình học không được là "giáp vai của Kestrel" cố định trong code. Phải là các khuôn tổng quát nhận tham số hình dạng từ JSON. Gợi ý các khuôn: tấm giáp cong ôm theo bộ phận (độ cong, số lớp, độ dày, viền), vỏ bọc chi (ống giáp), mũ/vỏ đầu (độ kín, mũ lưỡi trai, sừng/vây), dải kính, hộp bo góc (ba lô, túi), vũ khí ghép từ các khối (thân, nòng, báng, ống ngắm).
  - Builder tự quyết danh sách khuôn cuối cùng, miễn là chỉ bằng JSON tạo được trang bị trông khác hẳn của Kestrel.
  - Trang bị gắn vào bộ phận cơ thể **tự vừa theo proportions và bodyShape** của hero (giáp ngực tự ôm theo ngực của hero đó). Offset/scale trong JSON chỉ để tinh chỉnh thêm. *(Quyết định của Claude)*
- `sockets`: danh sách socket (tên, bone cha, offset).
- `showcase`: tư thế mặc định khi mở trang, góc camera mặc định.

**Yêu cầu:**

- Đọc vào phải qua bước kiểm tra. Sai thì báo lỗi dễ hiểu (trường nào, sai gì, giá trị cho phép), không được render ra nhân vật hỏng.
- `hero.schema.json` dùng được trong VS Code qua trường `"$schema"`.
- `HERO_TEMPLATE.md` giải thích từng trường, đơn vị, khoảng giá trị hợp lý, và các bước: copy template → đặt vào `heroes/<id>/hero.json` → chạy dev server → kiểm tra bằng rig test → xuất GLB.
- Đầu ra cuối cùng mà chủ dự án yêu cầu là `templates/hero-template.json` kèm schema và hướng dẫn.

### 6.6. Trang showcase *(quyết định của Claude)*

**Bố cục (desktop):**

- **Trái:** danh sách hero, mỗi hero là một thẻ gồm tên, vai trò và màu nhận diện. Hiện chỉ có Kestrel.
- **Giữa:** khung 3D, nền tối có sàn nhẹ và ánh sáng kiểu studio (key/fill/rim). Kéo chuột để xoay camera quanh nhân vật, cuộn để zoom.
- **Phải:** thẻ thông tin hero (tên, vai trò, giới thiệu, mô tả), rồi các nhóm điều khiển:
  - **Tư thế:** Đứng thở (mặc định), T-Pose, Giơ tay, Gập khuỷu, Gập gối, Nâng chân, Xoay thân, Xoay đầu. Chuyển giữa các tư thế có nội suy mượt.
  - **Hiển thị:** bộ xương, wireframe, xem skin weight của bone đang chọn (tô màu nhiệt), ẩn/hiện trang bị.
  - **Rig:** chọn bone, chỉnh xoay X/Y/Z, reset về bind pose (dùng panel `lil-gui`).
  - **Kiểm tra rig:** danh sách pass/fail tự động: đủ bone, tên không trùng, có skinIndex/skinWeight, tối đa 4 ảnh hưởng, tổng weight ≈ 1, index hợp lệ, chiều cao thân ≈ `proportions.height`.
  - **Xuất:** nút "Xuất GLB" để tải file `<id>.glb` về. Sau đó tự import lại vào một scene ẩn và hiển thị kết quả so sánh: số bone và tên bone, số vertex thân, có thuộc tính skin, số món trang bị và bone/socket gắn, các socket, số vật liệu, chiều cao thân, metadata.

**Nội dung GLB** *(quyết định của Claude)*: SkinnedMesh thân + skeleton + các mesh trang bị (là con của đúng bone/socket) + các socket (node rỗng, giữ tên). Nút gốc mang metadata trong glTF `extras`: `id`, `version`, `profile`, `palette`. Như vậy runtime game sau này có thể tìm socket theo tên, tháo/thay trang bị, và đọc thông tin hero mà không cần file đi kèm.

**Màn hình hẹp:** khung 3D lên trên, hai cột bên chuyển xuống dưới. Không cần tối ưu kỹ cho điện thoại.

**Phong cách:** tối, gọn, cảm giác "game menu". Màu nhấn lấy từ palette của hero đang chọn.

### 6.7. Thứ tự thực hiện

Theo milestone M1–M6 của `quy-trinh.md`, mỗi bước kiểm tra xong mới sang bước sau. Sau M6 thêm hai bước:

- **M7 – Showcase UI:** bố cục, thẻ hero, danh sách hero tự nhận từ `heroes/*/hero.json`.
- **M8 – Template:** tách `hero-template.json`, `hero.schema.json`, `HERO_TEMPLATE.md` và các preset dáng người. Kiểm tra bằng cách tạo từ template một hero thử **khác hẳn Kestrel** (ví dụ dáng `heavy`, trang bị dùng tham số hình dạng khác), xác nhận nó hiện đúng trên trang và qua rig check mà không sửa file `.ts` nào. Chủ dự án quyết định giữ hay xoá hero thử.

**Duyệt từng giai đoạn** *(yêu cầu của chủ dự án)*: sau **mỗi** milestone, dừng lại để chủ dự án xem kết quả trước khi làm tiếp:

- Từ M1 trở đi luôn có một trang xem trước chạy được (`npm run dev`) để chủ dự án tự mở và xoay xem.
- Mỗi lần dừng, gửi kèm ảnh chụp màn hình các góc quan trọng (trước, nghiêng, sau; ở M5 là từng tư thế thử) và tóm tắt ngắn: đã làm gì, kiểm tra gì, còn gì chưa ổn.
- Chỉ làm tiếp khi chủ dự án đồng ý. Góp ý ở giai đoạn nào thì sửa ở giai đoạn đó trước khi đi tiếp.

## 7. Phần để builder tự quyết

- Thuật toán sinh mesh thân chi tiết: số ring, cách nối vai/hông/cổ thành một mesh liền, cách làm bàn tay/bàn chân. Điều kiện là phải liền khối, skinning được và đạt tiêu chí biến dạng.
- Công thức skin weight cụ thể (khoảng cách tới đoạn bone, giới hạn theo vùng, falloff ở khớp), miễn đạt tiêu chí ở mục 5 của `quy-trinh.md`.
- Hình dạng chi tiết của từng món trang bị, miễn giữ đúng hình bóng nhận diện ở mục 6.4.
- Góc xoay cụ thể của từng tư thế thử.
- Thư viện kiểm tra JSON (tự viết hoặc dùng thư viện), miễn báo lỗi dễ hiểu.
- Chi tiết CSS, font, icon.
- Phiên bản cụ thể của Vite, Three.js, lil-gui, vitest (dùng bản ổn định hiện hành).

## 8. Cách nghiệm thu

- `npm run dev` mở được trang showcase có Kestrel. Xoay camera, đổi tư thế, bật bộ xương, wireframe và weight đều hoạt động.
- Danh sách kiểm tra rig trên trang toàn pass.
- Ở các tư thế Giơ tay, Gập khuỷu, Gập gối, Nâng chân: không rách mesh, không xoắn bất thường, đồ không xuyên thân rõ rệt. Có ảnh chụp màn hình từng tư thế làm bằng chứng.
- Xuất GLB, import lại, bảng so sánh khớp hoàn toàn.
- `npm run typecheck` và `npm test` sạch.
- Thêm một hero thử từ template, có dáng người và trang bị khác hẳn Kestrel, mà không sửa file `.ts` nào. Hero thử hiện trên trang và qua rig check.
- Chủ dự án đã duyệt từng milestone.
