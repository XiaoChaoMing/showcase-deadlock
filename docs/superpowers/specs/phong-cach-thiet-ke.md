Tôi đề xuất nâng cấp toàn bộ hệ thống body theo hướng Anatomical Body System – Heroic Smooth. Đây sẽ là một hệ thống tạo hình cơ thể dùng chung cho tất cả hero, thay vì tiếp tục bổ sung các khối hình học riêng lẻ cho từng nhân vật.

Bốn quyết định thiết kế được cố định:

| Thuộc tính        | Quyết định          |
| ----------------- | ------------------- |
| Design style      | Stylized Anatomical |
| Muscle definition | High                |
| Body proportion   | Heroic              |
| Surface           | Smooth              |

Design direction locked

# 1. Body Design System

## 1.1. Mục tiêu thiết kế

Body cần đạt được năm yêu cầu:

1. Anatomical readability: Nhìn rõ các nhóm cơ chính, không bị nhầm thành những primitive ghép lại.
2. Heroic silhouette: Nhân vật có hình thể mạnh mẽ, vai rộng, ngực phát triển, eo gọn và chân vững.
3. Smooth continuity: Các nhóm cơ chuyển tiếp tự nhiên, không xuất hiện khe hở hoặc đường nối hình học.
4. Procedural scalability: Một hệ thống có thể tạo body cho Tank, Fighter, Assassin, Mage và các archetype khác.
5. Rig compatibility: Body được sinh ra theo skeleton và không phá vỡ vị trí khớp, socket hoặc animation hiện có.

[Stylized Hero Anatomy | BlendAtlas](https://images.openai.com/static-rsc-4/19uQM5fnM7H84m3SWsKFGbMT9kx4fBkF00siHbuwD8mZSAJXrO9pRiIyGqgB8OHSdcSvMxF5FYSFBx5tElzgPEdkN60-_-SWNRvC94e4hijaWZS76JlQseM6Pu6FOjYgr_R1G_ftgWBUy_ijkVOZCTeBfsBQkMUJ2-EyWo_9QPU?purpose=inline)

[Stylized Heavy Anatomy Blockout](https://images.openai.com/static-rsc-4/8N9UN7HXYksO47ZPX6Fx5DzgrUnTmX340YSf8P--tpIwncn_iGGIyRGLhz4i4i_Sji-V3F4o6X7cZskRgKuDDluadUtmT0eJ2lH4YvXUObWEEEIC_1By8TVNc-KD8_YspF7nXCRwVnkAK5CpfxcRi3DXBcNMOyIAcFt8URxwX1Q?purpose=inline)

[Creating Character Base Meshes and Blockouts  – Follygon](https://images.openai.com/static-rsc-4/JHMBc2cHPlR_INtCKTfMafUqzgkeJDmrdzEjUjXctCxuyAgPn1IrRScGy6IgmqdjBJZetMGNeks1h1UAawxU4c_xaI9Y0BFtyvqYGrwXWqQlNR55AyzPcdc1WfmYZrnVYOLW06yAbdC3g87Y2WiFeNjRR2IgLRTKPmKup1SIRs4?purpose=inline)

10

Nguyên tắc quan trọng: Khối cơ phải là một phần của bề mặt cơ thể, không phải những vật thể độc lập được đặt chồng lên body.

## 1.2. Anatomical hierarchy

Phân chia body thành 5 vùng chính và các nhóm cơ chi tiết.

[Human Ecorche - Model Muscles and - FlippedNormals](https://images.openai.com/static-rsc-4/BGsmti5gAh17OoVo9CcHRTR5POtUMmWh5vQ7-CSsgEmKe_cEjm1ExLBEMkQFy-DUGq8OAZ8vaTe9Q9kG4yXOAyFaE81D-v2h4ZTq4ksiB5n1-8AhjH-3Dcrsr6-fr6qtpgSconX78lV3NEXwE6d43XBtRlF0EQ3YJaJx7EYhQUc?purpose=inline)

[flippednormals.com](https://flippednormals.com/product/human-ecorche-model-muscles-and-skeleton-3d-model-35413?utm_source=chatgpt.com)

| Vùng      | Nhóm cơ                                                  | Mức ưu tiên |
| --------- | -------------------------------------------------------- | ----------- |
| Torso     | Pectoralis, trapezius, latissimus dorsi                  | Critical    |
| Abdomen   | Rectus abdominis, obliques, serratus anterior            | High        |
| Shoulder  | Anterior, lateral, posterior deltoid                     | Critical    |
| Arm       | Biceps, triceps, brachialis, forearm groups              | High        |
| Hip & Leg | Gluteus, quadriceps, hamstrings, gastrocnemius, tibialis | Critical    |

Không cần mô hình hóa từng bó cơ nhỏ như giải phẫu y khoa. Mục tiêu là tạo các khối cơ lớn có silhouette và độ chuyển tiếp rõ ràng khi quan sát trong gameplay.

### Quy tắc thể hiện cơ

- Primary forms: Vai, ngực, lưng, bụng, đùi và bắp chân phải có khối rõ.
- Secondary forms: Biceps, triceps, obliques, quadriceps phải được nhận diện.
- Tertiary forms: Gân, rãnh cơ và chi tiết nhỏ chỉ xuất hiện khi cần thiết.
- Tránh tạo rãnh cơ quá sâu khiến body giống tượng giải phẫu.
- Tránh đường nối sắc cạnh giữa hai nhóm cơ.

## 1.3. Heroic proportion system

Không nên cố định một bộ tỷ lệ cho tất cả hero. Thay vào đó, xây dựng một bộ tỷ lệ chuẩn và cho phép từng archetype điều chỉnh.

[Draw superhero character for you by Yohanunda | Fiverr](https://images.openai.com/static-rsc-4/gmWFcmDyuVgeEYCa3Gg5dBvvI5xavuOgsqQj_qUdUlA39JdR3feQx3IZH2nXQEh5QLw9jmfa12W5jCzluF0B7zQWBUPBFB10iVPAdvDeySLxqWdqup6XCsD3tYDFmJ5rbCUloq-8uuu-HS-GCapLX4iRyNXbQxg9KAV5rsKnpGE?purpose=inline)

[ninja gaiden ryu hayabusa ninja sword | #571997 | yande.re](https://images.openai.com/static-rsc-4/SNXcoMcZb3rw3KxscDGb2W5OmVcjDlEEQ2fspqxdLsVqD5uv4214FhI4jVO5O4-WQgamcRfD1HKk_8512cdL893LE7sYRkoQ16lu4ZsD1hi368zMHWUaSng0qxV0pgcFhMBaloTEMI5zQoYt72M6dpZsU9-6ZNcjQpc8-hc0zsg?purpose=inline)

[3D Full body Character Designing | 3D Modeling (1) | Images :: Behance](https://images.openai.com/static-rsc-4/5cJG0MgHCSPacb5w3KJ9BEtaLFKdqdLbCkIQ8_uMk2WYDdDrufqr2u3ce7QG6jLPtz53z_6hqdLguUXYtWYgeal26PA0GvXNdhugP8G__FdjZ5dW7a92cc3FTO0xXJxGB4Z5tAjDHs9jgPb1Yxbxx5FxBUF_-KoQ7DBckT1wsEU?purpose=inline)

12

Tỷ lệ tham chiếu ban đầu:

| Body measurement | Baseline |
| ---------------- | -------- |
| Total height     | 1.00     |
| Shoulder width   | 0.27     |
| Chest width      | 0.23     |
| Waist width      | 0.16     |
| Hip width        | 0.19     |
| Upper arm length | 0.18     |
| Forearm length   | 0.16     |
| Thigh length     | 0.25     |
| Lower leg length | 0.24     |

Đây là tỷ lệ chuẩn hóa để bắt đầu thử nghiệm, không phải tỷ lệ giải phẫu tuyệt đối. Cần hiệu chỉnh bằng model thực tế và camera gameplay.

### Archetype presets

| Archetype | Vai        | Ngực    | Eo   | Đùi     | Khối cơ    |
| --------- | ---------- | ------- | ---- | ------- | ---------- |
| Tank      | Rất rộng   | Rất lớn | Rộng | Rất lớn | Nặng       |
| Fighter   | Rộng       | Lớn     | Gọn  | Lớn     | Phát triển |
| Assassin  | Trung bình | Vừa     | Gọn  | Vừa     | Săn chắc   |
| Mage      | Hẹp–vừa    | Vừa     | Gọn  | Thon    | Nhẹ        |
| Bruiser   | Rất rộng   | Lớn     | Vừa  | Rất lớn | Dày        |

Các archetype chỉ là preset đầu vào. HeroDefinition vẫn được phép override từng thông số.

# 2. Kiến trúc Procedural Body Builder

## 2.1. Kiến trúc tổng thể

Tôi đề xuất tách `BodyBuilder` thành pipeline độc lập với hệ thống armor/equipment.

HeroDefinition

Body configuration · Archetype · Proportions

Body Configuration Resolver

Preset resolution · Parameter normalization

Anatomical Body Builder

Torso · Shoulder · Arm · Hip · Leg

Surface Generation

Surface blending · Remeshing · Normal generation

Rig Binding

Skin weights · Skeleton · Bone compatibility

Generated Body Mesh

BufferGeometry · Material · SkinnedMesh

Equipment và socket sẽ lấy dữ liệu từ skeleton/body configuration đã được resolve, không tự xây dựng lại hệ tọa độ riêng.

## 2.2. Module boundaries

Đề xuất tổ chức source code theo trách nhiệm:

```
src/
└── character/
    ├── body/
    │   ├── config/
    │   │   ├── body-presets.ts
    │   │   ├── body-archetypes.ts
    │   │   ├── body-parameters.ts
    │   │   └── body-resolver.ts
    │   │
    │   ├── anatomy/
    │   │   ├── torso/
    │   │   │   ├── torso-builder.ts
    │   │   │   ├── chest-builder.ts
    │   │   │   ├── abdomen-builder.ts
    │   │   │   └── back-builder.ts
    │   │   ├── shoulder/
    │   │   │   └── shoulder-builder.ts
    │   │   ├── arm/
    │   │   │   ├── upper-arm-builder.ts
    │   │   │   └── forearm-builder.ts
    │   │   ├── hip/
    │   │   │   └── hip-builder.ts
    │   │   └── leg/
    │   │       ├── thigh-builder.ts
    │   │       ├── knee-builder.ts
    │   │       └── calf-builder.ts
    │   │
    │   ├── surface/
    │   │   ├── parametric-surface.ts
    │   │   ├── implicit-surface.ts
    │   │   ├── smooth-union.ts
    │   │   ├── surface-remesher.ts
    │   │   └── normal-generator.ts
    │   │
    │   ├── deformation/
    │   │   ├── muscle-deformation.ts
    │   │   └── proportion-deformation.ts
    │   │
    │   ├── rigging/
    │   │   ├── body-skinning.ts
    │   │   ├── skin-weight-generator.ts
    │   │   └── skeleton-binding.ts
    │   │
    │   ├── materials/
    │   │   └── body-material.ts
    │   │
    │   ├── body-builder.ts
    │   └── body-types.ts
    │
    └── ...
```

Đây là cấu trúc logic đề xuất. Coding agent cần kiểm tra cấu trúc repository trước khi quyết định vị trí file thực tế.

## 2.3. Lựa chọn phương pháp tạo hình

Đây là quyết định kỹ thuật quan trọng nhất.

Không nên dùng duy nhất một phương pháp cho toàn bộ body.

| Kỹ thuật               | Vai trò               | Đánh giá                  |
| ---------------------- | --------------------- | ------------------------- |
| Primitive composition  | Blockout              | Không dùng làm final body |
| Parametric mesh        | Tạo hình cơ thể chính | Nên dùng                  |
| Implicit surface / SDF | Hòa trộn khối cơ      | Nên dùng có chọn lọc      |
| Smooth Union           | Xóa đường nối khối cơ | Nên dùng                  |
| Surface remeshing      | Tạo mesh liên tục     | Nên dùng khi cần          |
| Normal blending        | Làm mượt shading      | Bổ trợ                    |
| Subdivision            | Tăng độ mịn           | Có giới hạn               |

Pipeline được khuyến nghị:

1. Tạo torso, limbs và các khối cơ bằng parametric surfaces.
2. Tạo những phần cần kết nối bằng implicit surface hoặc smooth union.
3. Remesh để tạo bề mặt liên tục với mật độ polygon hợp lý.
4. Tính lại normals và smoothing.
5. Tạo UV hoặc attribute cần thiết.
6. Sinh skin weights và bind với skeleton.

Không nhất thiết phải đưa toàn bộ body qua SDF. SDF có thể tốn chi phí tính toán và làm mất chi tiết nếu độ phân giải không đủ. Các vùng có cấu trúc tương đối đơn giản như cánh tay, cẳng chân có thể giữ parametric mesh.

## 2.4. Parametric muscle model

Mỗi nhóm cơ nên có một tập tham số độc lập:

```
interface MuscleParameters {
  width: number;
  height: number;
  depth: number;

  bulge: number;
  taper: number;
  separation: number;

  startOffset: number;
  endOffset: number;

  smoothness: number;
}
```

Ví dụ:

```
interface TorsoParameters {
  chest: {
    width: number;
    depth: number;
    projection: number;
    separation: number;
  };

  abdomen: {
    width: number;
    depth: number;
    definition: number;
    segmentCount: number;
  };

  waist: {
    width: number;
    taper: number;
  };

  back: {
    width: number;
    depth: number;
    latissimusExpansion: number;
  };
}
```

Các thông số này phải được chuẩn hóa theo kích thước body, không sử dụng những giá trị tuyệt đối phụ thuộc vào một hero cụ thể.

# 3. Body Configuration Schema

Tôi khuyến nghị thêm một nhánh `bodyDesign` vào HeroDefinition V2.

Ví dụ cấu hình:

```
{
  "bodyDesign": {
    "version": 1,
    "style": "stylized-anatomical",
    "surface": "smooth",
    "muscleDefinition": "high",
    "proportionPreset": "heroic",
    "archetype": "tank",
    "proportions": {
      "shoulderWidth": 1.2,
      "chestWidth": 1.15,
      "waistWidth": 1.05,
      "hipWidth": 1.1,
      "armVolume": 1.2,
      "legVolume": 1.25
    },
    "muscles": {
      "chest": 1.2,
      "shoulders": 1.25,
      "arms": 1.15,
      "abdomen": 1.0,
      "back": 1.2,
      "thighs": 1.25,
      "calves": 1.1
    },
    "surfaceSettings": {
      "smoothness": 0.85,
      "muscleSeparation": 0.7,
      "surfaceResolution": "high"
    }
  }
}
```

Đây là ví dụ schema định hướng, chưa phải schema đã được validate với repository.

### Quy tắc cấu hình

- `archetype` quyết định preset ban đầu.
- `proportions` cho phép điều chỉnh silhouette.
- `muscles` điều chỉnh volume từng vùng.
- `surfaceSettings` kiểm soát cách thể hiện bề mặt.
- Các tham số phải có default và giới hạn min/max.
- Không để từng hero khai báo lại toàn bộ cấu hình nếu đang sử dụng preset mặc định.
- Cần có validation và fallback khi thiếu trường.

# 4. Rigging và Animation Compatibility

Đây là phần không được xem nhẹ. Một body đẹp ở tư thế đứng chưa chắc hoạt động tốt khi nhân vật chạy, đánh hoặc xoay người.

[BodyBuilder (Game Ready) Base Mesh](https://images.openai.com/static-rsc-4/zKX-4wz-v-57h6kx-UdWPaq6XBl6Bz_glsOt1QIDxaFHb4mSn7uSv3YgxHpjgSm7O_-LvdKcXEhb49RPUTeTeBLS1TXDcjY0_YfD7QvyPsKqm8T_82v_ve_TVIg-rXFOvgVHj2VzQlN2KIFGtHxC0_wtjaXSQfFnJw5jzsb8rCI?purpose=inline)

[cubebrush.co](https://cubebrush.co/ashton87/products/5a4c5g/bodybuilder-game-ready-base-mesh?utm_source=chatgpt.com)

## 4.1. Skeleton compatibility

BodyBuilder không được tự ý tạo skeleton khác với skeleton chuẩn của game.

Các vùng cần giữ đúng:

| Body region | Bone influence      |
| ----------- | ------------------- |
| Chest       | Spine / Chest       |
| Abdomen     | Spine / Pelvis      |
| Shoulder    | Clavicle / UpperArm |
| Upper arm   | UpperArm            |
| Forearm     | Forearm             |
| Hand        | Hand                |
| Hip         | Pelvis              |
| Thigh       | UpperLeg            |
| Knee        | UpperLeg / LowerLeg |
| Calf        | LowerLeg            |
| Foot        | Foot                |

Tên bone ở đây là tên logic tham chiếu. Phải mapping với skeleton thực tế trong source code.

## 4.2. Skin weight generation

Nếu body mesh được sinh từ bề mặt liên tục, cần tạo skin weight tự động.

Quy trình:

1. Xác định bone gần nhất hoặc bone influence theo từng vùng giải phẫu.
2. Tính weight dựa trên khoảng cách và vùng ảnh hưởng.
3. Normalize tổng weight của mỗi vertex bằng 1.
4. Giới hạn số bone influence theo renderer.
5. Kiểm tra các vùng khớp khi animation.

Ví dụ:

```
interface SkinWeightConfig {
  maxInfluences: number;
  blendRadius: number;
  normalizeWeights: boolean;
}
```

Cần kiểm tra đặc biệt vùng vai, khuỷu tay, hông và đầu gối. Đây là những vùng dễ biến dạng không tự nhiên khi body có cơ bắp lớn.

## 4.3. Animation test poses

Tạo một bộ pose test cố định để kiểm tra tất cả hero:

[Modèles de personnages 3D | Faciles à télécharger | Fiverr](https://images.openai.com/static-rsc-4/cTBL35QAxMwVOfSR4wsCiYVBXvD7nR6opu3BCUPGe0thZj7RScP0YIL98HkXfoSf4l9DT7SAX3k6p1eEeEFnVM3Nwde03O870LR-K-H0p_cA-VsXLZFdopjc_5PkmqX6HDStKuKZPzjZAHRP4P1IODA22cfcZFcg6VDN9maZ7-k?purpose=inline)

[Modifying rigify armature to prevent shoulder stretch - Animation and Rigging - Blender Artists Community](https://images.openai.com/static-rsc-4/tzzSrm5GiAWk9fTU3YsQyu_RvVC9buwpDwAYzYIEBHujFJX2k2EFLWX2J5DCXYyo3xNInvHzO6j-vFZnqktX4m7-GbJq-zObk64nYnVOCP6DrgosYWVcAbuAx74gv7KaULweITWbgNyXpS_-jLoqLA9MkhbmGJBueYxAK1FIMEM?purpose=inline)

[Male muscular system.](https://images.openai.com/static-rsc-4/eY6cc-3lp-cxrfmPQrPXEgCuF0982hNDa208dYOtmPKmlCtdPinQ4F4Sb5APms4LVYU-Gow9qUAhwr5-TNrbKObomYzruk0VFeEg-eUb6MuT_OtCV4wBgFZ1cDGZ3ebEjKW0v4lY9qBrePu7Bd6SWUR6cNirZ68nwJUbGu9ib5jJ1YaewyOecGD9FUZRIApj?purpose=inline)

11

Các pose bắt buộc:

- T-Pose: kiểm tra tỷ lệ và skin weights.
- A-Pose: kiểm tra vai và ngực.
- Arms Raised: kiểm tra vai và nách.
- Elbow Flexion: kiểm tra biceps và triceps.
- Torso Twist: kiểm tra ngực, bụng và lưng.
- Deep Squat: kiểm tra hông và đùi.
- Running: kiểm tra toàn bộ body.
- Combat Attack: kiểm tra deformation trong animation thực tế.

# 5. Body Rendering và Surface Quality

## 5.1. Smooth surface không đồng nghĩa với ít polygon

Mục tiêu là silhouette và shading mượt, không phải subdivision vô hạn.

Các yêu cầu:

- Geometry đủ mật độ ở vai, ngực, khuỷu tay, hông và đầu gối.
- Normals liên tục giữa các vùng cơ.
- Không để xuất hiện đường nối giữa các mesh.
- Không sử dụng normal smoothing để che lỗi topology nghiêm trọng.
- Các đường phân tách cơ nên đến từ hình dạng bề mặt, không chỉ từ màu sắc.

## 5.2. Material

Body material nên có preset riêng:

```
interface BodyMaterialConfig {
  baseColor: string;
  roughness: number;
  metalness: number;
  normalScale: number;
  anatomicalContrast: number;
}
```

Với phong cách này:

- Ưu tiên `MeshStandardMaterial`.
- Roughness tương đối cao để tránh body bóng như nhựa.
- Không lạm dụng normal map.
- Tạo độ tương phản nhẹ giữa vùng cơ bằng geometry và lighting.
- Armor material được xử lý riêng, không dùng chung với skin material.

# 6. Kế hoạch nâng cấp BodyBuilder

Tôi chia quá trình thành 7 phase. Không nên thay thế toàn bộ BodyBuilder trong một lần vì có thể ảnh hưởng đến rigging, equipment và các hero đang hoạt động.

## Implementation roadmap

1. Phase 0 – Audit Existing System

   Foundation
   - Kiểm tra BodyBuilder hiện tại.
   - Kiểm tra HeroDefinition và schema.
   - Kiểm tra skeleton, bone names, sockets.
   - Xác định primitive đang tạo ra hình thể thô.
   - Tạo baseline screenshots và pose tests.
   Deliverable: Audit report + technical constraints.
2. Phase 1 – Body Configuration System
   - Xây dựng BodyDesignConfig.
   - Tạo archetype presets.
   - Tạo proportion resolver.
   - Tạo muscle parameter resolver.
   - Thêm schema validation.
   Deliverable: Cấu hình body có thể thay đổi độc lập với geometry.
3. Phase 2 – Anatomical Base Mesh

   Critical
   - Xây dựng torso.
   - Xây dựng chest và abdomen.
   - Xây dựng shoulder.
   - Xây dựng arm và forearm.
   - Xây dựng hip và leg.
   - Tạo mesh continuity.
   Deliverable: Một body hoàn chỉnh có anatomy rõ ràng, chưa cần armor.
4. Phase 3 – Surface Blending
   - Smooth Union.
   - Surface remeshing.
   - Normal generation.
   - Smoothing controls.
   - Kiểm tra silhouette và shading.
   Deliverable: Bề mặt body liền mạch, không có cảm giác ghép primitive.
5. Phase 4 – Rigging Integration
   - Skeleton binding.
   - Skin weight generation.
   - Joint deformation.
   - Animation test poses.
   Deliverable: Body hoạt động đúng với skeleton hiện tại.
6. Phase 5 – Archetype & Hero Migration
   - Tank.
   - Fighter.
   - Assassin.
   - Mage.
   - Bruiser.
   - Tinh chỉnh các hero có body đặc biệt.
   Deliverable: Tất cả hero sử dụng cùng Body Design System.
7. Phase 6 – Optimization & Regression
   - Geometry caching.
   - Material reuse.
   - Performance profiling.
   - Visual regression.
   - Memory cleanup.
   Deliverable: BodyBuilder ổn định và sẵn sàng tích hợp runtime.

# 7. Acceptance Criteria

Không nên đánh giá thành công chỉ bằng việc model trông đẹp hơn ở T-Pose.

| Nhóm          | Điều kiện hoàn thành                                |
| ------------- | --------------------------------------------------- |
| Anatomy       | Nhìn rõ các nhóm cơ lớn ở góc front, side và 3/4    |
| Silhouette    | Có tỷ lệ heroic rõ ràng                             |
| Surface       | Không có khe hở, seam hoặc shading bất thường       |
| Rigging       | Hoạt động với skeleton hiện tại                     |
| Deformation   | Không collapse ở vai, khuỷu tay, hông, gối          |
| Archetype     | Tank, Fighter, Assassin, Mage có hình thể khác biệt |
| Compatibility | Equipment và socket không bị lệch                   |
| Performance   | Có benchmark và không regression so với baseline    |
| Stability     | Không có geometry/material leak khi rebuild body    |

Benchmark kỹ thuật ban đầu: Có thể đặt mục tiêu khoảng 20.000–45.000 triangles cho body, sau đó đo thực tế trên các hero đại diện. Đây không phải giới hạn cứng; chất lượng anatomy và ngân sách render tổng thể mới là tiêu chí quyết định.

# 8. Prompt triển khai cho Coding Agent

Tôi đề xuất giao agent theo từng phase, không yêu cầu agent tự động triển khai cả 7 phase trong một lượt. Prompt dưới đây dùng làm master task.

# TASK: Implement Anatomical Body Design System for Three.js Heroes

## 1. Objective

Upgrade the existing procedural character body generation system into a reusable Anatomical Body Design System.

The system must support all heroes through shared procedural geometry and configuration.

### Locked Art Direction

- Design style: Stylized Anatomical
- Muscle definition: High
- Body proportion: Heroic
- Surface style: Smooth

The generated characters must have clearly recognizable anatomical forms, heroic silhouettes, and smooth surface transitions.

Do not use Blender or require external DCC software.

## 2. Mandatory Repository Audit

Before modifying source code:

1. Inspect the existing character generation pipeline.
2. Locate the current BodyBuilder implementation.
3. Inspect HeroDefinition and its schema.
4. Inspect skeleton, bone naming, skinning and animation systems.
5. Inspect socket and equipment attachment logic.
6. Identify existing coordinate conventions and character dimensions.
7. Identify all current heroes and their dependencies on BodyBuilder.

Produce an audit report containing:

- Existing architecture.
- Existing body generation technique.
- Current limitations.
- Rigging constraints.
- Equipment/socket compatibility constraints.
- Proposed migration strategy.

Do not invent repository paths or assume that the proposed architecture already exists.

## 3. Architecture Requirements

Separate the body system into these logical responsibilities:

- Body configuration and archetype resolution.
- Anatomical region builders.
- Parametric geometry generation.
- Surface blending and remeshing.
- Normal generation and smoothing.
- Skin weight generation.
- Skeleton binding.
- Body material configuration.

Keep body generation independent from equipment generation.

Do not duplicate skeleton definitions or create incompatible coordinate conventions.

## 4. Body Configuration

Implement a typed BodyDesignConfig with:

- style
- surface
- muscleDefinition
- proportionPreset
- archetype
- proportions
- muscles
- surfaceSettings

Provide reusable archetype presets:

- Tank
- Fighter
- Assassin
- Mage
- Bruiser

Support per-hero overrides.

All configuration values must be normalized and validated with safe defaults and reasonable min/max constraints.

Preserve existing HeroDefinition compatibility. Do not silently break V1 hero JSON files.

## 5. Anatomical Geometry

Build reusable anatomical regions:

### Torso

- Chest
- Abdomen
- Back
- Waist

### Shoulder

- Anterior deltoid
- Lateral deltoid
- Posterior deltoid

### Arms

- Biceps
- Triceps
- Forearm

### Hip

- Gluteal region
- Hip transition

### Legs

- Quadriceps
- Hamstrings
- Calves
- Tibialis anterior

The anatomy must be stylized rather than medically realistic.

Prioritize primary and secondary muscle groups. Do not waste geometry on tiny anatomical details that are not visible in gameplay.

## 6. Geometry Strategy

Use a hybrid procedural geometry approach:

1. Parametric surfaces for the main body regions.
2. Implicit surfaces or SDF smooth union where continuous blending is needed.
3. Surface remeshing when separate geometry must become a continuous surface.
4. Normal generation and controlled smoothing.
5. Static BufferGeometry output before runtime rendering.

Do not construct the final body by simply attaching spheres, capsules or cylinders.

Avoid expensive per-frame geometry generation.

Keep the generated geometry deterministic for the same configuration.

## 7. Rigging

Integrate with the existing skeleton.

Implement or adapt:

- Skeleton binding.
- Skin weight generation.
- Weight normalization.
- Bone influence limits.
- Joint deformation validation.

Prioritize:

- Shoulder.
- Armpit.
- Elbow.
- Hip.
- Knee.

Do not change existing bone names, animation contracts or socket positions without explicit justification and migration.

## 8. Visual Validation

Create a reusable test scene for every body configuration.

Required views:

- Front.
- Side.
- Back.
- Three-quarter.

Required poses:

- T-Pose.
- A-Pose.
- Arms Raised.
- Elbow Flexion.
- Torso Twist.
- Deep Squat.
- Running.
- Combat Attack.

Validate anatomy readability, silhouette, surface continuity and deformation.

## 9. Performance

Profile:

- Geometry generation time.
- Triangle count.
- Vertex count.
- Draw calls.
- Material count.
- Rebuild/cache behavior.
- Memory cleanup.

Avoid premature optimization. Establish a baseline before setting hard performance limits.

Reuse geometry and materials where safe.

Dispose of generated GPU resources correctly when replacing or removing a body.

## 10. Migration

Do not migrate all heroes immediately.

Start with one representative hero.

Compare:

- Old body.
- New body.
- Front/side/three-quarter silhouette.
- Rig deformation.
- Equipment alignment.

After the representative hero passes validation, migrate the remaining archetypes.

Preserve the old implementation until the new pipeline passes visual and technical regression checks.

## 11. Execution Rules

Implement incrementally.

For each phase:

1. Explain the intended changes.
2. Identify affected files.
3. Implement only the approved scope.
4. Run type checking and relevant tests.
5. Report results and remaining risks.

Do not introduce unrelated rendering, camera, combat or gameplay changes.

Do not add external DCC dependencies.

Do not claim visual correctness without rendering and inspecting the generated models.

## 12. Definition of Done

The implementation is complete when:

- All supported heroes use the shared Body Design System.
- Heroic proportions are configurable.
- Major anatomical groups are clearly readable.
- Body surfaces are smooth and continuous.
- Existing skeleton and animation systems remain compatible.
- Equipment and sockets remain correctly aligned.
- Required pose tests pass.
- Geometry and material resources are cleaned up correctly.
- Performance has been measured against the original implementation.
- Existing hero definitions remain compatible or have an explicit migration path.

# 9. Thứ tự triển khai tôi khuyến nghị

Có một điểm tôi muốn nhấn mạnh: không bắt đầu bằng việc viết tất cả các MuscleBuilder.

Nên làm theo thứ tự sau:

1. Body Configuration: Chốt tỷ lệ và tham số điều khiển hình thể.
2. Torso Prototype: Chỉ xây dựng torso, chest, abdomen và back để kiểm chứng chất lượng anatomy.
3. Surface System: Xử lý smooth union và topology trước khi mở rộng sang tay/chân.
4. Full Body: Mở rộng anatomy sang toàn bộ cơ thể.
5. Rigging: Bind skeleton và kiểm tra deformation.
6. Archetype Migration: Nhân rộng cho toàn bộ hero.

Lý do: torso là vùng thể hiện rõ nhất sự khác biệt giữa một body procedural thô và một body có thiết kế giải phẫu tốt. Nếu torso chưa đạt yêu cầu, mở rộng sang toàn thân chỉ làm tăng khối lượng công việc sửa chữa.

Bước tiếp theo nên thực hiện là Phase 0 – Audit Existing System, sau đó triển khai Phase 1 và tạo một torso prototype ở Phase 2. Chưa nên migrate toàn bộ hero cho đến khi torso prototype được duyệt về mặt hình ảnh.