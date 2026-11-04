# Hero Design System v2 — Technical Design Specification

Architecture proposal

Stylized 3D

Hybrid Geometry

Balanced Details

Mục tiêu của Hero Design System v2 là nâng cấp toàn bộ pipeline tạo nhân vật procedural bằng Three.js, giúp tất cả hero có chất lượng hình ảnh đồng nhất, hình khối rõ ràng, vật liệu tốt hơn và vẫn được định nghĩa chủ yếu bằng JSON.

Nguyên tắc quan trọng nhất: V2 không được làm mất khả năng sử dụng hero V1. Các hero hiện tại phải tiếp tục render được mà không bắt buộc phải viết lại JSON.

Tôi đề xuất xây dựng V2 theo hướng:

- Stylized 3D: tỷ lệ và hình khối được cách điệu có chủ đích.
- Hybrid Geometry: khối cơ thể và giáp chính tối ưu polygon; các chi tiết phụ có thể sử dụng hình học mịn hơn.
- Balanced Details: ưu tiên silhouette, phân tầng giáp, material và các điểm nhấn; không tạo quá nhiều chi tiết nhỏ.
- Data-driven: hero được định nghĩa bằng JSON, renderer chịu trách nhiệm xây dựng model.
- Modular: geometry, material, anatomy, equipment, rig và rendering độc lập.
- Backward-compatible: hỗ trợ V1 và V2 đồng thời.

# 1. Tổng quan kiến trúc

## 1.1. Kiến trúc mục tiêu

Hero Definition

hero.json · profile · proportions · equipment · showcase

Hero Data Pipeline

Loader · Validator · Migration · Preset Resolver

Character System

Body · Anatomy · Rig

Equipment System

Armor · Weapons · Attachments

Geometry System

Primitive · Bevel · Surface

Material System

PBR · Presets · Palette

Hero Renderer

Scene Graph · Lighting · Camera · Shadow · LOD

Output

Three.js Scene · GLB Export · Validation · Showcase

## 1.2. Phân chia trách nhiệm

| Module           | Trách nhiệm                  | Được phép phụ thuộc |
| ---------------- | ---------------------------- | ------------------- |
| HeroDefinition   | Định nghĩa dữ liệu hero      | Schema              |
| HeroLoader       | Load JSON                    | Definition          |
| HeroValidator    | Kiểm tra dữ liệu             | Schema              |
| HeroMigration    | Chuyển V1 sang V2            | Definition          |
| BodyBuilder      | Tạo anatomy                  | Geometry, Presets   |
| RigBuilder       | Tạo skeleton                 | Anatomy             |
| EquipmentBuilder | Tạo trang bị                 | Geometry, Material  |
| GeometryFactory  | Tạo geometry                 | Three.js            |
| MaterialResolver | Resolve material             | Material Library    |
| HeroRenderer     | Ghép các module              | Tất cả builder      |
| ShowcaseRenderer | Camera, ánh sáng, background | Three.js            |
| HeroExporter     | Xuất GLB                     | Renderer            |

Quy tắc dependency: các builder không được phụ thuộc ngược vào `HeroRenderer`. Geometry không được tự quyết định camera, lighting hoặc animation.

# 2. Hero Definition V2 — Template và Schema

## 2.1. Nguyên tắc thiết kế

V1 đã có những nhóm dữ liệu:

- `profile`
- `proportions`
- `bodyShape`
- `palette`
- `bodyPaint`
- `sockets`
- `equipment`
- `showcase`

V2 nên giữ lại các nhóm này, đồng thời bổ sung những cấu hình phục vụ hệ thống mới.

| Nhóm               | V1      | V2                        |
| ------------------ | ------- | ------------------------- |
| Profile            | Có      | Giữ                       |
| Proportions        | Có      | Mở rộng preset            |
| BodyShape          | Có      | Mở rộng geometry detail   |
| Palette            | Có      | Tách material preset      |
| BodyPaint          | Có      | Giữ                       |
| Sockets            | Có      | Giữ, chuẩn hóa attachment |
| Equipment          | Có      | Mở rộng geometry          |
| Showcase           | Có      | Chuẩn hóa rendering       |
| Design             | Chưa có | Mới                       |
| Geometry Settings  | Chưa có | Mới                       |
| Material Overrides | Chưa có | Mới                       |
| LOD                | Chưa có | Tùy chọn                  |

## 2.2. Cấu trúc hero.json V2

Đề xuất cấu trúc:

```
{
  "$schema": "../../templates/hero-v2.schema.json",
  "id": "morrow",
  "version": 2,

  "profile": {
    "name": "Morrow",
    "role": "Frontline Bruiser",
    "tagline": "The Iron Revenant",
    "description": "..."
  },

  "design": {
    "style": "stylized",
    "bodyPreset": "heavy",
    "detailLevel": "balanced",
    "geometryProfile": "hybrid"
  },

  "proportions": {},

  "bodyShape": {},

  "palette": {},

  "materials": {},

  "bodyPaint": {},

  "sockets": [],

  "equipment": [],

  "geometrySettings": {
    "bevel": {
      "enabled": true,
      "segments": 2
    },
    "surfaceDetail": {
      "enabled": true,
      "density": "balanced"
    }
  },

  "showcase": {
    "pose": "idle",
    "camera": {
      "azimuth": 28,
      "elevation": 8,
      "distance": 5
    },
    "lightingPreset": "studio"
  }
}
```

Đây là cấu trúc đề xuất, không phải schema đã được kiểm chứng. Các trường V2 cần được khai báo đầy đủ trong schema trước khi dùng.

### `design`

```
interface HeroDesignConfig {
  style: "stylized";

  bodyPreset:
    | "athletic"
    | "heavy"
    | "slim"
    | "feminine"
    | "custom";

  detailLevel:
    | "minimal"
    | "balanced"
    | "dense";

  geometryProfile:
    | "low-poly"
    | "hybrid"
    | "high-detail";
}
```

Trường này giúp hệ thống xác định chất lượng hình học và thiết kế chung cho nhân vật.

### `geometrySettings`

```
interface GeometrySettings {
  bevel?: {
    enabled: boolean;
    segments: 1 | 2 | 3;
    defaultSize?: number;
  };

  surfaceDetail?: {
    enabled: boolean;
    density: "minimal" | "balanced" | "dense";
  };

  smoothness?: {
    body: number;
    armor: number;
    accessories: number;
  };
}
```

Không nên cho phép từng equipment tự tạo quá nhiều cấu hình geometry. Các giá trị mặc định nên nằm trong design preset, chỉ override khi thực sự cần thiết.

## 2.3. Schema versioning

Có một điểm cần thay đổi so với quy ước V1: template hiện tại quy định `version` luôn bằng `1`. Vì vậy, V2 phải có schema riêng và cần cập nhật quy ước versioning.

Đề xuất:

```
type HeroVersion = 1 | 2;
```

- V1: dữ liệu cũ, được giữ nguyên.
- V2: sử dụng `hero-v2.schema.json`.
- Loader phân biệt version trước khi xử lý.
- Không tự động ghi đè file V1.
- Không để V1 sử dụng các trường V2 mà schema không khai báo.

# 3. Body System — Anatomy và Proportions

Đây là module cần được chuẩn hóa trước vì tất cả hero đều dựa vào nó.

## 3.1. Body preset library

[Athletic Male Character 3d Model: Athletic Male Character In T-pose With Dark Skin, Black Sleeveless Shirt, Beige | Tripo AI](https://images.openai.com/static-rsc-4/B_NV3DeaCFQgOkZ7ek7pXV73R8L-s_Evp9JCPOguiBghTPSpd82X94Nn7TLsEFmx_GIQIlVBl1DASwEilYqw2H4slP8l24itFh_DTYMJRermBzxJiFQQhf22yYVi6Fxv5zbEvxpkQMt9U0g_crCIsciB5cl7iQkWdZqh-M5qTGw?purpose=inline)

Athletic

Tỷ lệ cân đối, vai và cơ rõ, thân hình linh hoạt.

Scout · Assassin · Duelist

[3D Model: Create A Highly Detailed Stylized 3D Tank Character, Designed For A Video Game, | Tripo AI](https://images.openai.com/static-rsc-4/QiiqyNPAHzwm3MvoKgmbOFD6c4UxpdTTrOYmCdoI6-Cqd-MNlwVAT27fp1J9wFNbZbt-j81HsX7lMEgCpdlt18Ayu5VzSB4zLqTf4ZSjVrnskoAq7kDiLXXPfRc4wMNwEyC65mlTmi9SHVDvJSykM5SrcBeVQ8Fjk3_PGktGVzU?purpose=inline)

Heavy

Vai rộng, ngực dày, tay và chân lớn, trọng tâm thấp.

Tank · Bruiser · Juggernaut

[Fantasy Character 3D Model: Dark Armored Fantasy Rogue Character With Layered Leather And Metal Ac](https://images.openai.com/static-rsc-4/XlJ0NHLIfSbQFzfFaS_dxdTRa_3R8q7GjrZfRnRU77d_cfqkMokariokEAyWynrOtiBDqKDGmcoikZpFhbbt2LcKYAR_cKkKtOl5W1usl0eVUws8eTpzMXrgdlcPCzAS9hSDKREP9hVIvmD0GbuhNS-ANia7edwvqwDVtmKD8xQ?purpose=inline)

Slim

Thân dài, vai hẹp, chân tay thanh thoát.

Mage · Sniper · Support

[游戏《瓦罗兰特》中的角色：霓虹 - 在线看3D效果与AR/VR体验，提供3D模型下载与3D打印 | 创造家](https://images.openai.com/static-rsc-4/6_4ULpKaihiL6eP9hPkClAZiUU5aCgT0PZ_IWlgPzuYgJ7JuGQ4bb1-fuOIFlF1rNJUD9fg8FbRI39jsWNVlkNoJU08SDhn3K8jntZw-xfNTgF688H10jBohgxMH51DsfQyCxI_5UtGqIU2xIq7trJEAhksG-BWCQ7UKHLQRbt0?purpose=inline)

Feminine

Tỷ lệ vai, hông và thân được thiết kế riêng, không chỉ scale từ preset Athletic.

Ranger · Caster · Assassin

Mỗi preset nên là một file độc lập:

```
presets/
└── body/
    ├── athletic.json
    ├── heavy.json
    ├── slim.json
    └── feminine.json
```

## 3.2. Chuẩn hóa anatomy

BodyBuilder cần xử lý:

1. Head volume.
2. Neck transition.
3. Torso silhouette.
4. Shoulder transition.
5. Arm volume.
6. Hand volume.
7. Pelvis.
8. Leg volume.
9. Foot shape.
10. Muscle definition.

Đặc biệt, cần xử lý các vùng chuyển tiếp:

- Neck → Shoulder.
- Shoulder → Upper arm.
- Upper arm → Lower arm.
- Torso → Pelvis.
- Hip → Upper leg.
- Upper leg → Lower leg.
- Ankle → Foot.

Các điểm nối này có tác động lớn đến chất lượng nhân vật hơn việc tăng polygon cho các bộ phận riêng lẻ.

## 3.3. BodyShape Builder

Không nên tiếp tục để `BodyBuilder` chứa logic dựng hình cho tất cả bộ phận.

```
interface BodyGeometryBuilder {
  buildHead(config: HeadConfig): THREE.Mesh;

  buildTorso(config: TorsoConfig): THREE.Mesh;

  buildNeck(config: NeckConfig): THREE.Mesh;

  buildArm(config: ArmConfig): THREE.Mesh;

  buildHand(config: HandConfig): THREE.Mesh;

  buildLeg(config: LegConfig): THREE.Mesh;

  buildFoot(config: FootConfig): THREE.Mesh;
}
```

Các bộ phận nên dùng chung một thuật toán tạo tiết diện, nhưng được cấu hình theo từng anatomy profile.

Tiêu chuẩn: body preset phải có thể thay đổi mà không làm hỏng rig, socket và attachment.

# 4. Hybrid Geometry System

Đây là phần cốt lõi của V2.

## 4.1. Chiến lược geometry

Không phải tất cả bộ phận đều cần độ chi tiết giống nhau.

| Geometry        | Cấp độ      | Ví dụ                   |
| --------------- | ----------- | ----------------------- |
| Primary body    | Low-poly    | Torso, arms, legs       |
| Main armor      | Hybrid      | Chest, shoulder, helmet |
| Secondary armor | Hybrid      | Bracer, knee, hip plate |
| Mechanical      | Medium      | Pistons, joints, vents  |
| Accessories     | Medium–High | Core, lens, ornaments   |
| Surface detail  | Low-cost    | Lines, decals, bolts    |

Đề xuất phân bổ:

Geometry budget — định hướng ban đầu

Primary forms

60%

Secondary forms

30%

Tertiary details

10%

Đây là tỷ lệ ngân sách thiết kế đề xuất, không phải tỷ lệ polygon bắt buộc.

## 4.2. Geometry Builder modules

```
geometry/
├── primitives/
│   ├── BoxGeometryBuilder.ts
│   ├── RoundedBoxBuilder.ts
│   ├── CylinderBuilder.ts
│   ├── ConeBuilder.ts
│   └── WedgeBuilder.ts
│
├── surface/
│   ├── CrossSectionBuilder.ts
│   ├── CurvedSurfaceBuilder.ts
│   ├── BeveledSurfaceBuilder.ts
│   └── ExtrudedSurfaceBuilder.ts
│
├── armor/
│   ├── ArmorPlateBuilder.ts
│   ├── LayeredArmorBuilder.ts
│   ├── ArmorEdgeBuilder.ts
│   └── ArmorPanelBuilder.ts
│
├── mechanical/
│   ├── JointBuilder.ts
│   ├── PistonBuilder.ts
│   ├── CableBuilder.ts
│   └── VentBuilder.ts
│
├── details/
│   ├── BoltBuilder.ts
│   ├── EngravingBuilder.ts
│   ├── DecalBuilder.ts
│   └── OrnamentBuilder.ts
│
└── utils/
    ├── GeometryMerge.ts
    ├── GeometryNormals.ts
    ├── GeometryValidation.ts
    └── GeometryDispose.ts
```

## 4.3. Các builder cần triển khai

[Free Armorplate 3D Models - Download Instantly | Meshy](https://images.openai.com/static-rsc-4/rRNrsch8ectKXEhXzt6YUWwekT7DMPltpv1E0JtHzpH8URZzUACEJxhTBsCG85d7ZYiEmm6DWBvCTKEUt9yE7eemxmTplS5WpPUmJMG-xOvsddULDu7rEz_NXn56BUp2qp2NNIbNvrRgETn8sMwnS3OPiS7OWBTUsX5KzAfV_r4?purpose=inline)

ArmorPlateBuilder

Tạo giáp cong theo bề mặt anatomy, hỗ trợ thickness, bevel, ridge, bulge, edge và point.

[3D model 30 Highpoly and Lowpoly Shoulder Armor VR / AR / low-poly | CGTrader](https://images.openai.com/static-rsc-4/B6a2iq2ftpWlyLBejC2cg7h2m9O0Y7KWxEkVNIqGEfJvk3IklsK3UOaTmP4oq7hqmbSqUD_Sz8CVVTD3GOMuTDfd4DhpiWjNHRYkgHUN8csheM13FW38I6VAmjyAZacgTEHlXl0VsLfMPnzRyhvvD3UzhoHPWhW4uBfT1l52z4A?purpose=inline)

LayeredArmorBuilder

Quản lý thứ tự lớp giáp, khoảng cách, độ chồng lấn và hướng mở rộng.

[terminator t-800 Arm 3D model rigged | CGTrader](https://images.openai.com/static-rsc-4/PQX_wumo1H1m7W_FdY4kM4XwNX-MgsCcAlznb4i4yvGmzaKWShESA3bBswogEjB7yBYgD2RuMmXbIVuO8-AYARTeGSU1-NfcodPyuyZe_eAh8wqo3Q7Q-1PPAKqLDf_PjditAWjvuwdEuZoH0LRT6kskgnTCzwXOzWTho02E6gc?purpose=inline)

JointBuilder

Tạo các vòng bảo vệ và khớp cơ khí tại khuỷu tay, đầu gối, vai.

[Sci-Fi Landing Gear, D.W. 3D | Mechanical design, Robot design, Spaceship design](https://images.openai.com/static-rsc-4/4RjulsTAE5TCuniKQaXVydhBKVwgdTPosopiIIofJeUZGA7Uy_08Ed3md2fD2SzrIhZsVc5fEsoyx0uoWrqrx3c2MoEEWsuHx5wnPtkVBlF2kocv9UIktnbE8DSdH9FtEOSugPx3ds9coNiJtQ_z57SV6Sz2f0qK8VTHDP6vQC8?purpose=inline)

PistonBuilder

Tạo xi-lanh, trục chuyển động và khớp nối bằng primitive.

[Sci-Fi Spline Cables | Fab](https://images.openai.com/static-rsc-4/VlRCUnTFMyL0i_u79nBiuzc4ZAJUWmLA0oc-wFjcJnKanQrX_GSwA1rCR8t7FQzX7OGktHqfIhZp854YbR1yKjZRun5_Mf_Lqodj0k9manyxE_sIGfw1a0gxnO5pxeiYc_xxk1fq-BRdkt2vIfPM-Ovn2ZHRGhH-Z5JKtfQu7P0?purpose=inline)

CableBuilder

Tạo dây cáp procedural qua danh sách control points.

## 4.4. Geometry quality profile

```
interface GeometryProfile {
  radialSegments: number;
  bevelSegments: number;
  curveSegments: number;

  armor: {
    bevelEnabled: boolean;
    edgeDetail: boolean;
  };

  mechanical: {
    jointEnabled: boolean;
    pistonEnabled: boolean;
  };

  surface: {
    decalsEnabled: boolean;
    ornamentsEnabled: boolean;
  };
}
```

Các preset:

| Profile     | Radial segments | Bevel | Curve |
| ----------- | --------------- | ----- | ----- |
| Low-poly    | 8               | 1     | 4     |
| Hybrid      | 16              | 2     | 8     |
| High-detail | 24              | 3     | 12    |

Đây là giá trị khởi đầu cần benchmark. Không nên áp dụng cứng cho tất cả geometry; ví dụ bolt hoặc cable có thể cần cấu hình riêng.

## 4.5. Quy tắc tối ưu geometry

- Reuse geometry khi nhiều object dùng chung hình dạng.
- Không tạo material mới cho từng mesh nếu preset giống nhau.
- Hạn chế tạo mesh quá nhỏ chỉ để thêm chi tiết.
- Merge static geometry khi phù hợp.
- Không merge các mesh cần animation riêng.
- Không merge geometry có material hoặc rigging khác nhau.
- Tái sử dụng builder nhưng không chia sẻ mutable geometry giữa các object có biến dạng khác nhau.

# 5. Material Library V2

## 5.1. Kiến trúc material

Thay vì định nghĩa toàn bộ vật liệu trực tiếp trong `hero.json`, nên có một material library dùng chung.

```
presets/
└── materials/
    ├── metals.ts
    ├── fabrics.ts
    ├── leather.ts
    ├── ceramics.ts
    ├── energy.ts
    └── glass.ts
```

## 5.2. Material presets

[Hand Finished Brushed Silver Metal PBR Texture - 4K Seamless | Superellipse](https://images.openai.com/static-rsc-4/o9jJQsr7rGaZ_vRGSGR9C2WKANo9mVAm7du55c_qYhIk-hMocyojdF5Xp6N5S948pmMaIv_ZWBwPvNjLDloRKak5SVk6G_pJ70ALgGKYxEKBcuXpFO3qi9A4R_3TawNuqDT-eaSoVQ1qSTH59z7zXJJy95TKfDhOhcUfwUowjvE?purpose=inline)

Brushed Metal

Metalness: 0.85 · Roughness: 0.35

[Anodised Aluminium (Procedural) | FREE metal materials | Blendkit](https://images.openai.com/static-rsc-4/M44VBsZic8z9kUZKTrXNe5skz5EdLxDntzSVAbk6gX5GCiv7cOGcpdow17mEurx7mbeOm-Td8QqKiex4lQ_IONIi3Z0br014BouodU03qltGt2ECVHSPEJPFzfdz4xjMHseoOKv3yyv-7kDBWo_GaO8Vtc_IywCViYT3L3XczQw?purpose=inline)

Gunmetal

Metalness: 0.9 · Roughness: 0.45

[Aged Verdigris Copper | FREE metal materials | BlenderKit](https://images.openai.com/static-rsc-4/bjtFEIzgtGp9C_Mppo9763edwp_CpD9cnTMmodEoLuYnLOQ9_Z5dXLuX5jOvRJHZh8vsa8XGizyhB9WYOiqjiqK95xHnkOQgqnL2vWSz4Qc_Xd3xYX-hOR0MteorzMVrnJz4ws03wM6QgYeGH4PapL_3SyBoSmZxSB2qC-BH-EY?purpose=inline)

Aged Copper

Metalness: 0.75 · Roughness: 0.55

[Leather 003 Large Grain Black - 4K PBR Material | Visune](https://images.openai.com/static-rsc-4/CTzfUEjzqvbEuiTmGmsQ04mTqfb8O3d4XUr0ywa_FbMF2y8JIMx1tlJpQP5DGFVgnNj_CGmc_UKfTNqJiZgrx5agkVP0rAVifGe40VTknLJsWjyO9_9EqUD_Esg8mwLOR8wE81Zt5uZcxrfpxIWnYPifhfWjiURCtLgLXv-1370?purpose=inline)

Leather

Metalness: 0 · Roughness: 0.8

[Product Design & CMF – Superellipse](https://images.openai.com/static-rsc-4/WCQ5mMGRGt4rNNcEupcYIgi4PS8FvOKwkr7fa6i89ZJQNpufdpBfNqtDVycCiBxrW-H4xzlCcf-YjxaMtQk6emuHn_rPhZ3TAy0_eEbBgHe6UrHexafz1JDv-8Kkaa7u0SoUftczcjQLevlLGFe0le4kFIVDzRaCc1ocFiFoni8?purpose=inline)

Ceramic

Metalness: 0 · Roughness: 0.3

[Ein Rot Leuchtender Kreis,Der Intensives Licht Mit Glatten,Lebendigen Kanten Ausstrahlt | Hintergründe JPG gratis herunterladen - Pikbest](https://images.openai.com/static-rsc-4/UQ8Ru2R5Js6JgdMLB7t0gyBekfAiAqVgMF0w0zVVzE94O480nDLWD9aUcNzHt75B8QZ3ogI7eunry94vnKE6xOolRm6mzx6cLMsKwKlxU9I6x_2NW3lfnOHRd0K8qzBSm5wsf3uwD110PN5Tf6KrhF5RWue8el3Z-ApknhmuPng?purpose=inline)

Energy

Emissive: 2.0 · Roughness: 0.25

Các giá trị trên là preset gợi ý, cần tinh chỉnh theo ánh sáng và color management của renderer.

## 5.3. Material definition

```
interface MaterialPresetDefinition {
  id: string;

  type: "standard" | "physical";

  metalness: number;
  roughness: number;

  emissive?: {
    color: string;
    intensity: number;
  };

  clearcoat?: number;
  clearcoatRoughness?: number;
}
```

Ví dụ:

```
export const MATERIAL_PRESETS = {
  "brushed-metal": {
    type: "standard",
    metalness: 0.85,
    roughness: 0.35
  },

  gunmetal: {
    type: "standard",
    metalness: 0.9,
    roughness: 0.45
  },

  leather: {
    type: "standard",
    metalness: 0,
    roughness: 0.8
  },

  energy: {
    type: "standard",
    metalness: 0.1,
    roughness: 0.25,
    emissive: {
      color: "#B9233F",
      intensity: 2
    }
  }
};
```

## 5.4. MaterialResolver

```
class MaterialResolver {
  resolve(
    preset: string,
    color: string,
    overrides?: Partial<MaterialPresetDefinition>
  ): THREE.Material;

  getPreset(id: string): MaterialPresetDefinition;

  dispose(): void;
}
```

Cần triển khai cache để tránh tạo hàng trăm material giống nhau.

Quy tắc: không mutate một cached material khi override màu cho một equipment. Phải dùng material instance phù hợp hoặc cache theo material configuration.

## 5.5. Renderer material settings

Đề xuất chuẩn hóa:

- PBR Metallic-Roughness.
- `MeshStandardMaterial` mặc định.
- `MeshPhysicalMaterial` chỉ cho các trường hợp cần clearcoat hoặc hiệu ứng đặc biệt.
- Environment map cho phản xạ kim loại.
- ACES tone mapping hoặc một tone mapping pipeline thống nhất.
- Output color space là sRGB.
- Màu khai báo dạng hex được chuyển đúng sang linear working color space theo quy tắc Three.js.

Không nên bật bloom mặc định cho toàn bộ vật liệu emissive. Bloom là hiệu ứng hậu kỳ tùy chọn, không thay thế emissive material.

# 6. Equipment System V2

Equipment hiện tại đã có 5 loại: `plate`, `band`, `shell`, `box`, `assembly`. V2 nên giữ các loại này và bổ sung khả năng mô tả hình học mới.

## 6.1. Equipment interface

```
interface HeroEquipment {
  id: string;

  kind:
    | "plate"
    | "band"
    | "shell"
    | "box"
    | "assembly";

  color: string;

  material?: {
    preset: string;
    overrides?: Record<string, number | string>;
  };

  geometry?: {
    bevel?: number;
    smoothness?: number;
    detailLevel?: "minimal" | "balanced" | "dense";
  };

  attach?: AttachmentConfig;
}
```

Schema thực tế cần giữ nguyên những trường bắt buộc và trường riêng của từng `kind`; interface trên chỉ minh họa phần mở rộng chung.

## 6.2. Layered Armor

Tạo cấu hình cho giáp nhiều lớp:

```
{
  "id": "left-shoulder",
  "kind": "plate",
  "part": "arm",
  "side": "left",
  "tStart": 0.1,
  "tEnd": 0.45,
  "angleStartDeg": -45,
  "angleEndDeg": 45,
  "thickness": 0.025,
  "gap": 0.012,
  "layers": 3,
  "layerOverlap": 0.65,
  "ridge": 0.025,
  "point": 0.04,
  "color": "armor"
}
```

Mỗi layer phải có:

- Khoảng offset riêng.
- Thickness riêng hoặc kế thừa.
- Material riêng hoặc kế thừa.
- Geometry detail riêng hoặc kế thừa.

Cần xác định rõ thứ tự lớp, tránh hiện tượng lớp phía trong phủ lên lớp ngoài.

## 6.3. Attachment system

Chuẩn hóa hai kiểu:

```
type AttachmentConfig =
  | {
      socket: string;
      offset?: [number, number, number];
      rotationDeg?: [number, number, number];
    }
  | {
      mount: SurfaceMount;
      offset?: [number, number, number];
      rotationDeg?: [number, number, number];
    };
```

Không thay đổi quy ước tọa độ hiện tại:

- Nhân vật nhìn về `+Z`.
- `+Y` là hướng lên.
- `+X` là bên trái nhân vật.
- `+Z` ở socket là pháp tuyến hướng ra ngoài thân.

Điều này rất quan trọng để đảm bảo V1 và V2 không bị lệch vị trí trang bị.

# 7. Hero Renderer V2

## 7.1. Scene graph

Mỗi hero nên có một root hierarchy rõ ràng:

```
HeroRoot
├── RigRoot
│   ├── Hips
│   │   ├── Spine
│   │   │   ├── Chest
│   │   │   ├── Neck
│   │   │   └── Head
│   │   ├── LeftArm
│   │   ├── RightArm
│   │   ├── LeftLeg
│   │   └── RightLeg
│   │
│   └── EquipmentRoot
│       ├── HeadEquipment
│       ├── TorsoEquipment
│       ├── ArmEquipment
│       ├── LegEquipment
│       └── BackEquipment
│
├── EffectsRoot
└── DebugRoot
```

Đây là hierarchy logic đề xuất. Cần map vào skeleton thực tế của hệ thống hiện tại, không tự ý đổi tên hoặc thay bone hierarchy trước khi kiểm tra compatibility.

## 7.2. CharacterRenderer

```
interface CharacterRendererOptions {
  enableShadows: boolean;
  enableEnvironmentLighting: boolean;
  enableSurfaceDetails: boolean;
  enableDebugHelpers: boolean;
}

class CharacterRenderer {
  async build(
    definition: HeroDefinition
  ): Promise<THREE.Group>;

  update(
    deltaTime: number
  ): void;

  setPose(
    pose: HeroPose
  ): void;

  dispose(): void;
}
```

Renderer không nên biết hero nào là Morrow hay Kestrel. Nó chỉ nhận definition đã được validate và trả về một `THREE.Group`.

## 7.3. Lighting setup

[Breakdown: Rendering 3D Clay Models in Marmoset Toolbag](https://images.openai.com/static-rsc-4/2RweB8zUPm7LOCYvbJ48yNobsps6tIoytJSvWzJ8i2ZCfcNJKmniy-IftyMOm8LnMDYJe1cIrE32Jhq4jn3vvzudPBFEwnCwXTK7651usb5D0xHlTikWaSaGcm2eNvItxYmmYIi0P9vbqP5Y-xJ2q1313a7ZubJJ7JEbIquChsw?purpose=inline)

[80.lv](https://80.lv/articles/breakdown-rendering-3d-clay-models-in-marmoset-toolbag?utm_source=chatgpt.com)

Tạo một `LightingSetup` dùng chung:

| Light       | Cấu hình đề xuất             |
| ----------- | ---------------------------- |
| Key         | Phía trước, trên cao         |
| Fill        | Phía đối diện, cường độ thấp |
| Rim         | Phía sau để tách silhouette  |
| Environment | HDRI hoặc environment map    |
| Ground      | Shadow receiver              |

Không gắn ánh sáng riêng vào từng hero JSON trừ khi có nhu cầu đặc biệt.

## 7.4. Camera presets

- Front.
- Front 3/4.
- Side.
- Back.
- Full body.
- Detail inspection.

Camera phải dựa vào bounding box của hero, không chỉ dựa vào `height`, vì vũ khí, sừng hoặc giáp có thể vượt ra ngoài chiều cao thân.

# 8. Rig và Pose Compatibility

V2 không được làm hỏng rig.

## 8.1. Giữ rig tách biệt khỏi geometry

- BodyBuilder tạo geometry.
- RigBuilder tạo skeleton.
- EquipmentBuilder gắn trang bị.
- PoseSystem điều khiển bone.
- Geometry không tự tính toán animation.

Đặc biệt, equipment cần được gắn theo bone hoặc socket đã xác định, không dùng vị trí world cố định.

## 8.2. Pose test suite

Tối thiểu kiểm tra:

1. Idle.
2. T-Pose.
3. Arms raised.
4. Arms forward.
5. Crouch.
6. Left leg raised.
7. Right leg raised.
8. Torso rotation.
9. Full body deformation.

Các tư thế này nên được sử dụng để kiểm tra clipping và attachment.

# 9. Migration V1 → V2

Đây là phần bắt buộc nếu muốn nâng cấp toàn bộ hệ thống mà không phải sửa thủ công từng hero.

## 9.1. Migration pipeline

V1 hero.json

Version Detection

Xác định version và validate schema cũ

Migration Adapter

Mapping palette, geometry và design defaults

Normalized HeroDefinition

Model dữ liệu thống nhất để renderer xử lý

## 9.2. Quy tắc mapping

| V1                       | V2                                                |
| ------------------------ | ------------------------------------------------- |
| `version: 1`             | Giữ metadata nguồn là V1                          |
| Không có `design`        | Tạo default stylized                              |
| Không có `bodyPreset`    | Gán `custom`                                      |
| `radialSegments: 16`     | Giữ nguyên                                        |
| `shading: smooth`        | Giữ nguyên                                        |
| Palette màu string       | Chuyển thành màu V2                               |
| Palette object           | Chuyển thành material definition                  |
| Equipment cũ             | Giữ nguyên loại và thuộc tính                     |
| `showcase` cũ            | Mapping camera                                    |
| Không có material preset | Suy luận preset bảo thủ hoặc dùng legacy material |

Lưu ý: Không tự động thay material V1 bằng preset V2 nếu việc đó làm thay đổi ngoại hình đáng kể. Migration mặc định phải ưu tiên visual parity.

## 9.3. Normalized Hero Definition

Renderer chỉ nên nhận một kiểu dữ liệu:

```
interface NormalizedHeroDefinition {
  id: string;

  sourceVersion: 1 | 2;

  profile: HeroProfile;

  design: HeroDesignConfig;

  proportions: HeroProportions;

  bodyShape: HeroBodyShape;

  palette: HeroPalette;

  materials: ResolvedHeroMaterials;

  bodyPaint: HeroBodyPaint;

  sockets: HeroSocket[];

  equipment: HeroEquipment[];

  showcase: HeroShowcase;
}
```

Lợi ích:

- Renderer không phải xử lý điều kiện V1/V2 ở mọi nơi.
- Migration chỉ có một trách nhiệm.
- Dễ thêm V3 trong tương lai.
- Có thể kiểm tra compatibility độc lập.

## 9.4. Migration script

```
npm run heroes:validate
npm run heroes:migrate -- --dry-run
npm run heroes:migrate -- --write
```

Chức năng:

- Quét toàn bộ `heroes/*/hero.json`.
- Phát hiện version.
- Validate schema tương ứng.
- Tạo normalized definition.
- Báo các trường không hỗ trợ.
- Xuất migration report.
- Không ghi đè dữ liệu gốc khi chạy `--dry-run`.

Tôi khuyên nên giữ nguyên JSON V1 trong giai đoạn đầu. Chỉ chuyển file sang V2 sau khi visual regression test đạt yêu cầu.

# 10. Performance và LOD

Hybrid geometry có nguy cơ tạo nhiều mesh hơn V1. Vì vậy phải có ngân sách geometry và tối ưu rõ ràng.

## 10.1. LOD

| LOD  | Nội dung            | Sử dụng      |
| ---- | ------------------- | ------------ |
| LOD0 | Full geometry       | Showcase     |
| LOD1 | Giảm detail phụ     | Gameplay gần |
| LOD2 | Bỏ tertiary details | Gameplay xa  |

LOD chỉ nên được thêm sau khi renderer V2 ổn định.

Không nên giảm geometry của rigged mesh bằng cách thay topology tùy tiện. Các LOD cần được thiết kế tương thích với skeleton hoặc sử dụng geometry thay thế có cùng rig mapping.

## 10.2. Performance budget ban đầu

Đây là mục tiêu benchmark cho một hero, không phải số liệu đã đo:

| Chỉ số              | Target ban đầu |
| ------------------- | -------------- |
| Draw calls          | ≤ 100          |
| Triangles           | 20k–45k        |
| Materials           | 8–16 unique    |
| Texture memory      | ≤ 32 MB        |
| Geometry build      | ≤ 300 ms       |
| Cached hero rebuild | ≤ 100 ms       |

Các target phải được kiểm tra trên thiết bị mục tiêu. Không nên đánh đổi silhouette và chất lượng giáp chỉ để đạt một con số polygon.

# 11. Cấu trúc source code hoàn chỉnh

Đề xuất tổ chức source:

```
src/
└── hero-system/
    │
    ├── core/
    │   ├── HeroLoader.ts
    │   ├── HeroBuilder.ts
    │   ├── HeroDefinition.ts
    │   └── HeroContext.ts
    │
    ├── schema/
    │   ├── hero-v1.schema.json
    │   ├── hero-v2.schema.json
    │   └── HeroSchemaValidator.ts
    │
    ├── migration/
    │   ├── HeroVersionResolver.ts
    │   ├── V1ToV2Migration.ts
    │   └── MigrationReport.ts
    │
    ├── presets/
    │   ├── body/
    │   │   ├── athletic.json
    │   │   ├── heavy.json
    │   │   ├── slim.json
    │   │   └── feminine.json
    │   │
    │   ├── geometry/
    │   │   ├── low-poly.ts
    │   │   └── hybrid.ts
    │   │
    │   └── materials/
    │       ├── metals.ts
    │       ├── fabrics.ts
    │       ├── leather.ts
    │       ├── ceramics.ts
    │       └── energy.ts
    │
    ├── anatomy/
    │   ├── BodyBuilder.ts
    │   ├── BodyPresetResolver.ts
    │   └── MuscleBuilder.ts
    │
    ├── rig/
    │   ├── RigBuilder.ts
    │   ├── BoneResolver.ts
    │   ├── SocketResolver.ts
    │   └── PoseValidator.ts
    │
    ├── geometry/
    │   ├── primitives/
    │   ├── surface/
    │   ├── armor/
    │   ├── mechanical/
    │   ├── details/
    │   └── utils/
    │
    ├── equipment/
    │   ├── EquipmentBuilder.ts
    │   ├── EquipmentRegistry.ts
    │   ├── AttachmentResolver.ts
    │   └── builders/
    │
    ├── materials/
    │   ├── MaterialResolver.ts
    │   ├── MaterialFactory.ts
    │   ├── MaterialCache.ts
    │   └── ColorUtils.ts
    │
    ├── renderer/
    │   ├── CharacterRenderer.ts
    │   ├── SceneFactory.ts
    │   ├── LightingSetup.ts
    │   ├── CameraSetup.ts
    │   ├── ShadowSetup.ts
    │   └── LODController.ts
    │
    ├── export/
    │   └── HeroGLBExporter.ts
    │
    └── validation/
        ├── HeroValidator.ts
        ├── RigValidator.ts
        ├── EquipmentValidator.ts
        ├── GeometryValidator.ts
        └── VisualRegression.ts
```

# 12. Roadmap triển khai

Tôi đề xuất triển khai theo thứ tự dependency, không xây dựng tất cả module cùng lúc.

Phase 0 — Baseline & Compatibility

Bắt buộc

Ước tính: 1–2 ngày

- Audit renderer hiện tại.
- Chụp baseline Kestrel và Morrow.
- Ghi nhận rig, socket, material và export.
- Tạo V1 regression tests.

Phase 1 — Definition & Body System

Ước tính: 2–4 ngày

- Tạo V2 schema.
- Tạo normalized definition.
- Body preset library.
- Migration adapter.
- BodyBuilder refactor.

Phase 2 — Hybrid Geometry

Ước tính: 3–5 ngày

- Primitive builders.
- Beveled geometry.
- Armor plate builder.
- Layered armor.
- Mechanical joint.
- Cable builder.

Phase 3 — Material & Renderer

Ước tính: 2–4 ngày

- Material presets.
- Material cache.
- Lighting setup.
- Camera setup.
- Shadow setup.
- Renderer integration.

Phase 4 — Equipment & Visual Details

Ước tính: 2–4 ngày

- Equipment registry.
- Surface details.
- Decals và ornaments.
- Attachment validation.
- Geometry optimization.

Phase 5 — Migration & Validation

Ước tính: 2–3 ngày

- Chạy migration dry-run.
- Visual regression.
- Rig tests.
- GLB round-trip.
- Performance benchmark.

Phase 6 — Production Adoption

Ước tính: 1–2 ngày

- Chuyển hero mẫu sang V2.
- Đánh giá chất lượng.
- Cập nhật documentation.
- Áp dụng cho hero mới.

Ước tính cho một developer quen thuộc với codebase và không bao gồm thời gian xử lý lỗi nền tảng hoặc thay đổi lớn trong renderer cũ.

## 12.1. MVP bắt buộc

Không cần triển khai hết V2 ngay từ đầu. MVP nên bao gồm:

1. V2 schema.
2. V1 migration adapter.
3. Body preset library.
4. Beveled geometry.
5. Layered armor builder.
6. Material preset library.
7. Lighting setup chuẩn.
8. Rig/socket regression.
9. GLB export/import validation.

Cable, engraving, decals, LOD và các chi tiết nâng cao có thể triển khai sau.

# 13. Checklist nghiệm thu

Đây là bộ tiêu chuẩn cần dùng để quyết định V2 đã đủ điều kiện thay thế renderer cũ hay chưa.

V2 Acceptance Checklist

# 0/40

A. Data & Schema

V1 JSON tiếp tục load được.

V2 JSON validate đúng schema.

ID trùng tên thư mục hero.

Không có equipment ID trùng nhau.

Không có socket reference bị thiếu.

Proportions có tổng chiều cao hợp lệ.

Material preset được resolve đúng.

Migration dry-run không thay đổi file gốc.

B. Anatomy & Geometry

Body preset tạo đúng tỷ lệ.

Silhouette dễ nhận diện khi thu nhỏ.

Không có khe hở bất thường ở các khớp.

Bevel không gây shading artifacts.

Armor plate ôm đúng body surface.

Layered armor không bị xuyên nhau.

Mechanical joints không clipping ở pose test.

Không có normal bị đảo hoặc geometry lỗi.

C. Material & Lighting

Màu hex hiển thị đúng.

Metalness và roughness đúng preset.

Emissive chỉ xuất hiện ở vùng được chỉ định.

Không có material instance bị mutate ngoài ý muốn.

Environment lighting hiển thị phản xạ kim loại.

Rim light làm rõ silhouette.

Shadow không bị acne hoặc peter-panning nghiêm trọng.

Color management nhất quán giữa showcase và GLB.

D. Rig & Equipment

Rig validation đạt 9/9.

Tất cả socket có vị trí hợp lệ.

Equipment theo đúng bone/socket.

T-Pose không clipping nghiêm trọng.

Arms raised không xuyên vai.

Crouch không xuyên hông hoặc đùi.

Torso rotation không làm lệch back equipment.

Weapon không bị xoay sai hướng.

E. Export & Performance

GLB export thành công.

GLB import lại không mất hierarchy.

Không mất material hoặc màu emissive.

Không mất skeleton và skinning.

Không có resource leak khi đổi hero.

Geometry cache hoạt động đúng.

Draw calls và triangle count nằm trong budget.

Không có lỗi console khi load toàn bộ hero.

0% hoàn thành

Reset checklist

# 14. Prompt triển khai cho Coding Agent

Tôi đề xuất chia công việc thành các task độc lập. Không giao toàn bộ V2 cho agent trong một prompt duy nhất vì agent có thể refactor quá rộng, phá vỡ rig hoặc làm mất tương thích V1.

Dưới đây là prompt nền tảng để đưa vào Cursor/Copilot.

# TASK: Implement Hero Design System V2

## ROLE

You are a senior Three.js graphics engineer specializing in procedural character generation, geometry systems, PBR materials, skeletal rigs, and GLTF pipelines.

Your task is to upgrade the existing procedural Hero System to Hero Design System V2.

## DESIGN DECISIONS

- Art direction: Stylized 3D.
- Geometry strategy: Hybrid Geometry.
- Detail level: Balanced.
- Runtime: Three.js.
- Character generation: Procedural, JSON-driven.
- Modeling tools: Do not use Blender or require external DCC tools.
- Compatibility: Existing V1 hero definitions must continue to work.

## PRIMARY OBJECTIVES

1. Introduce Hero Definition V2 and its JSON schema.
2. Implement a normalized hero definition model.
3. Implement backward-compatible V1 migration.
4. Standardize body presets and anatomy generation.
5. Implement reusable hybrid geometry builders.
6. Implement a centralized PBR material library.
7. Refactor the character renderer into modular systems.
8. Preserve rig, socket, attachment, and GLB export behavior.
9. Introduce visual and performance validation.

## NON-NEGOTIABLE RULES

- Inspect the existing source code before making architectural changes.
- Do not assume the proposed directory structure matches the existing repository.
- Preserve existing behavior unless a change is explicitly required.
- Do not delete or rewrite V1 hero files during initial implementation.
- Do not break existing equipment kinds.
- Do not change coordinate conventions:
  - +Y is up.
  - +Z is the character forward direction.
  - +X is the character's left side.
- Preserve existing socket mount semantics.
- Do not introduce Blender dependencies.
- Do not introduce unnecessary third-party dependencies.
- Avoid giant monolithic builders.
- Do not create a new material for every mesh.
- Do not merge geometry that requires independent rigging or animation.
- Avoid speculative schema fields that have no renderer implementation.

## IMPLEMENTATION PHASES

### Phase 0 — Codebase Audit

Inspect:

- Existing hero loader.
- Hero schema and validation.
- Body builder.
- Rig builder.
- Equipment builders.
- Socket resolver.
- Material creation.
- Showcase renderer.
- GLB export and import pipeline.
- Existing Kestrel and Morrow definitions.

Deliver:

- Current architecture map.
- Existing public interfaces.
- V1 compatibility risks.
- Proposed implementation plan based on the actual source.

Do not refactor before this audit is complete.

### Phase 1 — Definition and Migration

Implement:

- hero-v2.schema.json.
- HeroDefinitionV2 types.
- NormalizedHeroDefinition.
- Version resolver.
- V1-to-normalized adapter.
- V2-to-normalized adapter.
- Schema validation.

The renderer must consume NormalizedHeroDefinition only.

Keep source V1 JSON unchanged.

### Phase 2 — Body System

Implement:

- Athletic preset.
- Heavy preset.
- Slim preset.
- Feminine preset.
- BodyPresetResolver.
- Shared cross-section generation.
- Anatomy transition improvements.
- Body geometry validation.

Presets must preserve compatibility with the existing rig and socket coordinate system.

### Phase 3 — Hybrid Geometry

Implement reusable builders:

- RoundedBoxBuilder.
- BeveledSurfaceBuilder.
- CurvedArmorBuilder.
- LayeredArmorBuilder.
- ArmorEdgeBuilder.
- MechanicalJointBuilder.
- PistonBuilder.
- CableBuilder.

Keep geometry generation deterministic.

Reuse geometry when safe.

Avoid creating excessive tiny meshes.

### Phase 4 — Material System

Implement:

- MaterialPresetLibrary.
- MaterialResolver.
- MaterialCache.
- Color conversion utilities.
- Material override support.

Initial presets:

- Brushed Metal.
- Gunmetal.
- Aged Copper.
- Leather.
- Matte Fabric.
- Ceramic.
- Energy.
- Glass.

Use MeshStandardMaterial by default.\
Use MeshPhysicalMaterial only where justified.

Ensure correct color-space and tone-mapping behavior.

### Phase 5 — Renderer

Implement or refactor:

- CharacterRenderer.
- SceneFactory.
- LightingSetup.
- CameraSetup.
- ShadowSetup.
- Equipment attachment integration.

The renderer must not contain hero-specific logic.

All geometry and material builders must be reusable.

### Phase 6 — Validation and Export

Implement tests for:

- Schema validity.
- Migration.
- Body proportions.
- Equipment IDs.
- Socket references.
- Geometry validity.
- Rig compatibility.
- Pose clipping.
- GLB export.
- GLB re-import.
- Material preservation.
- Performance budgets.

## PERFORMANCE TARGETS

Use these as initial benchmark targets, not hard constraints:

- 20k–45k triangles per hero.
- Up to 100 draw calls.
- 8–16 unique materials.
- Geometry build under 300ms.
- Cached rebuild under 100ms.

Measure actual results before making optimization trade-offs.

## ACCEPTANCE CRITERIA

- All existing V1 heroes load correctly.
- V2 heroes load through the new normalized model.
- Existing rig validation remains 9/9.
- Existing equipment and socket behavior is preserved.
- No critical clipping in supported test poses.
- Materials render consistently.
- GLB round-trip preserves geometry, materials, hierarchy, and skinning.
- No resource leaks when switching between heroes.
- No critical console errors.

## REQUIRED DELIVERABLES

1. Architecture audit.
2. Implementation plan.
3. Updated TypeScript interfaces.
4. V2 JSON schema.
5. Migration adapter.
6. Body preset library.
7. Geometry builders.
8. Material library.
9. Refactored renderer.
10. Validation tests.
11. Performance benchmark report.
12. Documentation and example V2 hero.

## EXECUTION STRATEGY

Implement incrementally.

After each phase:

1. Run TypeScript checks.
2. Run relevant tests.
3. Verify existing V1 heroes.
4. Report changed files.
5. Report unresolved issues.
6. Wait for approval before beginning the next major phase.

Do not claim a feature is complete unless it has been implemented and verified in the actual codebase.

# 15. Quyết định kiến trúc tôi khuyên chốt

Tôi sẽ chốt V2 theo thứ tự ưu tiên sau:

| Quyết định          | Lựa chọn                           |
| ------------------- | ---------------------------------- |
| Art direction       | Stylized 3D                        |
| Geometry            | Hybrid                             |
| Detail density      | Balanced                           |
| Body generation     | Cross-section procedural           |
| Body presets        | Athletic / Heavy / Slim / Feminine |
| Armor generation    | Curved + Layered Plates            |
| Materials           | Centralized PBR presets            |
| Attachment          | Bone + Socket                      |
| Renderer            | Modular Three.js                   |
| Migration           | V1 → Normalized Definition         |
| Export              | GLB round-trip validation          |
| Modeling dependency | Không Blender                      |

Điểm tôi muốn nhấn mạnh: V2 nên ưu tiên nâng cấp `BodyBuilder`, `ArmorPlateBuilder`, `MaterialResolver` và `LightingSetup` trước. Bốn thành phần này có ảnh hưởng lớn đến chất lượng hình ảnh của gần như mọi hero. Những chi tiết như engraving, decal hay LOD chỉ nên làm sau khi nền tảng hình khối và vật liệu đã ổn định.

Và trước khi agent bắt đầu refactor, cần thực hiện Phase 0 để đối chiếu thiết kế này với source code thực tế. Đây là tài liệu kiến trúc mục tiêu; chưa thể xác nhận các interface, hierarchy và khả năng export hiện tại nếu chưa audit repository.
