# Quy trình tạo Character và Rig bằng Three.js – Không sử dụng Blender

Tôi đề xuất tách việc tạo Character và Rig thành một pipeline độc lập trước khi tích hợp vào Game Runtime.

Mục tiêu là xây dựng được một Procedural Character Pipeline có khả năng:

1. Tạo hình nhân vật 3D từ code.
2. Kiểm soát tỷ lệ cơ thể và hình dáng nhân vật.
3. Tạo skeleton (bộ xương) theo cấu trúc humanoid.
4. Tạo skin weights để mesh biến dạng theo bones.
5. Tạo các pose cơ bản để kiểm tra rig.
6. Xuất và tái sử dụng character trong Three.js.
7. Có thể mở rộng thành nhiều hero với ngoại hình và trang bị khác nhau.

Điểm quan trọng: Character Modeling, Rigging và Animation phải là ba công đoạn riêng biệt. Không nên viết một class vừa tạo geometry, vừa tạo bones, vừa xử lý animation.

## 1. Tổng quan pipeline

01\. Character Design

Proportions · Silhouette · Body Parts

02\. Procedural Modeling

Geometry · Topology · Materials

03\. Skeleton Generation

Bone Hierarchy · Bind Pose · Bone Mapping

04\. Skin Weight Generation

Vertex Influence · Weight Normalization

05\. Rig Validation

Joint Rotation · Deformation · Pose Testing

06\. Character Export

GLB · Reusable Character Asset

Tôi khuyên hoàn thành từng công đoạn và kiểm tra đầu ra trước khi chuyển sang công đoạn tiếp theo.

# 2. Giai đoạn 1 – Character Design và chuẩn hóa tỷ lệ

Trước khi viết code tạo model, cần có một bộ tiêu chuẩn hình học.

Đối với game hero shooter góc nhìn third-person, nên bắt đầu bằng humanoid stylized low-poly, tỷ lệ tương đối thực tế thay vì chibi hoặc quá cách điệu.

## 2.1. Chọn Character Style

[Game Unity Lowpoly Character Old Elf 3D Model - TurboSquid 2090895](https://images.openai.com/static-rsc-4/RprFdmT7qShlocY--ZwQBaLfyXvezdKfieW2KTCZ5TKjr5Gv2jV5sufKXNuWxT-TUAe8a21boVpbefOAfTzjx4BjvFlm-FsmGJhUdwIEwAd02BS3s2O1V8SvMDgy7aJeqSBtbRLRgyQy-DubxFtY_llsiZb7o7kz5C9bCyk4SCM?purpose=inline)

Stylized Low-poly

Đề xuất

Phù hợp hero shooter, dễ tạo geometry và rig.

[Steam :: Cepheus Protocol :: Letter from the Producer #3](https://images.openai.com/static-rsc-4/8LIpnxbCLq7O12HlWG-ExJcufX57twfnXUDzRezAp4Fr74Rum9IiZSSf3PzGTRX_2y9_rKqXlIJf1dZEmhLxUx0Aa81VwwFCQgn7mtHFmveXCWhq4usjpVu_MD2Amq2qOKSYxNEjDS636q2rjJoXPMTaJZB7zxW5rHxMOLD6GNA?purpose=inline)

Realistic

Đòi hỏi topology, deformation và skin weighting phức tạp hơn.

[GLB 3D Models | People | Male Characters | RenderHub](https://images.openai.com/static-rsc-4/f2OjMgBuT0FUz6SmtTLMLp2q8s2F_4IuH3zRbKjbB_mm4lXOsKNJ8Ok25tyGBOPipVOQ7Hu4Vqgk3KxepoLXPgdPJFCwT3B87qjINyYfrthne7JXGov_Pq9UAPQk6KilPB5oJSOEMy1XqR3tM4KSi3p6s1q4ZG-dcsIggfaIJuY?purpose=inline)

Cartoon

Dễ procedural modeling nhưng tỷ lệ cơ thể khác biệt nhiều.

[Intruder - Game Ready Robot - Superhive (formerly Blender Market)](https://images.openai.com/static-rsc-4/GAZtOX6ZPmlkKoO6GKLZCg4jUABZPlb3qpuf8Zqxlk9ZK_SgT4rNQSTfrKu5LPPhTF1PKurkz45h9Jfp3xEJbFhxG8NPr01F3g8veedE9dHuljSTr4LMla6-dE3E6z_CWxQeSZ69-4bs85SdovlwLDCpFs1HAjVO-6bJNcBzzMA?purpose=inline)

Geometric

Dễ rig nhất, thích hợp kiểm tra skeleton.

Tôi chọn Stylized Low-poly làm định hướng dài hạn, nhưng dùng Geometric làm model kiểm thử đầu tiên.

## 2.2. Chuẩn hóa coordinate system

Quy ước thống nhất cho toàn bộ pipeline:

| Trục | Ý nghĩa            |
| ---- | ------------------ |
| X    | Trái / phải        |
| Y    | Lên / xuống        |
| Z    | Trước / sau        |
| +Y   | Hướng lên          |
| +Z   | Hướng mặt nhân vật |

Nhân vật ở tư thế T-Pose, nhìn về hướng +Z.

Chiều cao chuẩn: `1.8 units`.

[Low Poly 3D Modeling Character 3D Computer Graphics Drawing PNG](https://images.openai.com/static-rsc-4/4IYJcBAVNNSrdmLkNpfc4lvHgoEfx8hh7vJ5QYErfaYlx-qV6R5u6K0Uk7tYGv3mWtfLpD3AG3zSD-0fdqkGTFubPCZyGWiHLl1cRDppWbtgf0Wc73WF3o-rpSguaOn9tYqqUqxDkUFAj3eTSO12Jp5dDSpO87NvCwsxrdoSq90?purpose=inline)

[favpng.com](https://favpng.com/png_view/low-poly-wallpaper-low-poly-3d-modeling-character-3d-computer-graphics-drawing-png/TPdduCdB?utm_source=chatgpt.com)

Bộ quy chuẩn ban đầu:

| Bộ phận   | Chiều cao / kích thước |
| --------- | ---------------------- |
| Toàn thân | 1.80                   |
| Head      | 0.24                   |
| Neck      | 0.08                   |
| Torso     | 0.55                   |
| Upper leg | 0.42                   |
| Lower leg | 0.42                   |
| Upper arm | 0.30                   |
| Lower arm | 0.28                   |

Các thông số phải nằm trong `CharacterProportions`, không hardcode trong geometry generator.

```
export interface CharacterProportions {
  height: number;
  head: {
    width: number;
    height: number;
    depth: number;
  };
  torso: {
    shoulderWidth: number;
    chestWidth: number;
    waistWidth: number;
    length: number;
  };
  arms: {
    upperLength: number;
    lowerLength: number;
  };
  legs: {
    upperLength: number;
    lowerLength: number;
  };
}
```

Deliverable: Một bản Character Definition chuẩn hóa, có thể tái sử dụng để sinh nhiều nhân vật.

# 3. Giai đoạn 2 – Procedural Character Modeling

Đây là giai đoạn tạo hình nhân vật bằng Three.js.

Tôi không khuyên tạo toàn bộ nhân vật chỉ bằng `BoxGeometry` hoặc `SphereGeometry`. Những primitive này chỉ nên được dùng để dựng prototype.

Có ba kỹ thuật cần kết hợp.

## 3.1. Phương pháp A – Primitive Geometry

[3D design Toribash - Tinkercad](https://images.openai.com/static-rsc-4/8MWaxalgKDNf5GXIriYGXjEp__fyXGqAoWxBAMn-LwT9XKMWdIriUOXsbIKzdKNTccLOiSTwJbrMfcfaYihBHftKRRoXE3-VljSW-A87YOpQF9fTAjjnJ87KgfeEcGgm0wRPJA5N352hW7x2J182oYMLBL3SjXjeEkZTfZdi91s?purpose=inline)

[tinkercad.com](https://www.tinkercad.com/things/jmqYEd2IdfC?utm_source=chatgpt.com)

Dùng các geometry có sẵn:

| Bộ phận   | Geometry                             |
| --------- | ------------------------------------ |
| Head      | SphereGeometry                       |
| Neck      | CylinderGeometry                     |
| Torso     | Custom tapered box / CapsuleGeometry |
| Upper arm | CapsuleGeometry                      |
| Lower arm | CapsuleGeometry                      |
| Upper leg | CapsuleGeometry                      |
| Lower leg | CapsuleGeometry                      |
| Hands     | BoxGeometry                          |
| Feet      | BoxGeometry                          |

Ưu điểm:

- Dễ triển khai.
- Dễ điều chỉnh kích thước.
- Dễ gắn vào bones.
- Phù hợp kiểm tra skeleton.

Nhược điểm:

- Nhân vật có cảm giác ghép từ nhiều khối.
- Các khớp có thể lộ.
- Không tạo được deformation tự nhiên nếu chỉ attach từng bộ phận vào bone.

## 3.2. Phương pháp B – Parametric Geometry

[ローポリ男性キャラ素体 - JUDY BOOTH - BOOTH](https://images.openai.com/static-rsc-4/OYY1eX9V_w2HXB1qauHCe7pCIZuvepL5203g3yJxKttEv1BPRyibb4VHr34WWBHoOxcoTAcx-l5yR2TmeEoQEAYaACymJpbwst-GCGO3zol5Njp9N2_ZR72FJkpu4-T0ztpPATwSEXNIJGUnS1DmjPs8KxNz6VbeV82L5f7poBs?purpose=inline)

[booth.pm](https://booth.pm/ja/items/5037650?utm_source=chatgpt.com)

Đây là phương pháp nên đầu tư cho character production.

Thay vì tạo hình từ các primitive riêng lẻ, chúng ta tự xây dựng `BufferGeometry` từ các tham số.

Ví dụ: tạo phần thân bằng nhiều horizontal rings.

```
          Neck
           │
       ┌───┴───┐
       │ Ring 1│
       ├───────┤
       │ Ring 2│
       ├───────┤
       │ Ring 3│
       ├───────┤
       │ Ring 4│
       └───────┘
          Waist
```

Mỗi ring có các thuộc tính:

```
interface BodyRing {
  height: number;
  radiusX: number;
  radiusZ: number;
  centerX: number;
  centerZ: number;
}
```

Từ đó tính vertex:

\\[ x = c_x + r_x\cos(\theta) \\]

\\[ y = h \\]

\\[ z = c_z + r_z\sin(\theta) \\]

Kết nối các ring với nhau bằng triangle indices.

Có thể sử dụng cùng phương pháp để tạo:

- Torso.
- Neck.
- Upper arms.
- Lower arms.
- Upper legs.
- Lower legs.

Đối với tay và chân, có thể sử dụng generalized cylinder chạy theo một đường cong hoặc các control points.

## 3.3. Phương pháp C – Modular Character Parts

[POLYGON - Modular Fantasy Hero Characters Pack - Art by Synty | 角色 | Unity 中国资源商店](https://images.openai.com/static-rsc-4/L9JS939SlCLzbLhuxGoBheVHKpYVP7_vDQaIroY-lBHzsyYIkZp-CjoYaSK5kw3-hS2GKIeNzzL2dU0EaeP0NqiD3-TQ33KdgCIKtpOS-iqRn5vmGKtbUq6LT5VcDPqHMW_0Tbf1y5x-Fca0w93ip3C1BAs81qnPCjO8Tiwv9DE?purpose=inline)

[assetstore.u3d.cn](https://assetstore.u3d.cn/packages/3d/characters/humanoids/fantasy/assetstore-package-20001018?utm_source=chatgpt.com)

Tách nhân vật thành các bộ phận độc lập:

```
Character
├── Body
│   ├── Head
│   ├── Torso
│   ├── LeftArm
│   ├── RightArm
│   ├── LeftLeg
│   └── RightLeg
│
├── Armor
│   ├── ChestArmor
│   ├── ShoulderArmor
│   ├── ArmArmor
│   └── LegArmor
│
└── Accessories
    ├── Helmet
    ├── Backpack
    └── Weapon
```

Đây là cách tổ chức tốt cho hero shooter vì sau này có thể thay đổi:

- Trang phục.
- Giáp.
- Vũ khí.
- Phụ kiện.
- Skin nhân vật.

Khuyến nghị: Kết hợp B và C. Tạo body bằng Parametric Geometry, còn armor và phụ kiện là Modular Geometry.

## 3.4. Cấu trúc source modeling

```
character/
└── procedural/
    ├── geometry/
    │   ├── BodyGeometry.ts
    │   ├── HeadGeometry.ts
    │   ├── LimbGeometry.ts
    │   ├── HandGeometry.ts
    │   └── FootGeometry.ts
    │
    ├── parts/
    │   ├── TorsoBuilder.ts
    │   ├── HeadBuilder.ts
    │   ├── ArmBuilder.ts
    │   └── LegBuilder.ts
    │
    ├── materials/
    │   ├── CharacterMaterial.ts
    │   └── MaterialPresets.ts
    │
    ├── CharacterGenerator.ts
    └── CharacterDefinition.ts
```

Đầu ra giai đoạn 2: Một humanoid model có đầy đủ hình dáng cơ thể, chưa cần animation.

# 4. Giai đoạn 3 – Skeleton Generation

Khi geometry hoàn thành, chúng ta bắt đầu tạo bộ xương.

Đây là hệ thống định nghĩa cách nhân vật chuyển động.

## 4.1. Thiết kế Bone Hierarchy

[AI motion capture and 3D scene design with RADiCAL](https://images.openai.com/static-rsc-4/Ul6Y0ZusjFzzXP7puYbb_9qfIB--rH7Wdb1uW7DOctveA_5D-1OAVMAyNJ1zIqbBdebLBeDP-unQ5QPvag8Dtw_WyOMcVh34fWKUhHqpZ7uTWPWg3q5ZSOiuQi7qY1H4MVKT0-Pkj-gfRUAfzVBk71HaMAn3NLqHc2T88M5gKEY?purpose=inline)

[radicalmotion.com](https://radicalmotion.com/changelog/product/new-ai-gen3-1-new-skeleton-new-fbx-new-plugins?utm_source=chatgpt.com)

Tôi đề xuất skeleton có cấu trúc như sau:

```
Root
└── Hips
    ├── Spine
    │   └── Chest
    │       ├── Neck
    │       │   └── Head
    │       │
    │       ├── LeftShoulder
    │       │   └── LeftUpperArm
    │       │       └── LeftLowerArm
    │       │           └── LeftHand
    │       │
    │       └── RightShoulder
    │           └── RightUpperArm
    │               └── RightLowerArm
    │                   └── RightHand
    │
    ├── LeftUpperLeg
    │   └── LeftLowerLeg
    │       └── LeftFoot
    │
    └── RightUpperLeg
        └── RightLowerLeg
            └── RightFoot
```

Tổng cộng khoảng 21 bones.

Đây là skeleton đủ tốt cho locomotion và combat cơ bản.

Về sau có thể bổ sung:

- Finger bones.
- Toe bones.
- Weapon socket.
- Spine phụ.
- IK targets.
- Facial bones.

## 4.2. Phân biệt Root và Hips

Đây là một quyết định quan trọng.

Root:

- Đại diện vị trí tổng thể của character.
- Được điều khiển bởi movement system.
- Dùng để đặt character trong world.

Hips:

- Đại diện phần hông.
- Có thể chuyển động khi chạy, nhảy, cúi.
- Không nên dùng làm vị trí gameplay authoritative.

Không nên để animation tự ý di chuyển Root trong khi movement system đang điều khiển nhân vật. Điều đó dễ gây xung đột giữa animation và physics.

## 4.3. Tạo Skeleton bằng Three.js

Ví dụ:

```
const hips = new THREE.Bone();
hips.name = "Hips";
hips.position.set(0, 0.95, 0);

const spine = new THREE.Bone();
spine.name = "Spine";
spine.position.set(0, 0.1, 0);

const chest = new THREE.Bone();
chest.name = "Chest";
chest.position.set(0, 0.25, 0);

const neck = new THREE.Bone();
neck.name = "Neck";
neck.position.set(0, 0.18, 0);

const head = new THREE.Bone();
head.name = "Head";
head.position.set(0, 0.12, 0);

hips.add(spine);
spine.add(chest);
chest.add(neck);
neck.add(head);
```

Sau đó:

```
const skeleton = new THREE.Skeleton(bones);
```

Lưu ý: `bones` phải chứa đầy đủ các bone của skeleton, không chỉ những bone ở cấp root. Các vị trí local của bones phải khớp với bind pose của geometry.

## 4.4. Skeleton Validation

Trước khi skinning, cần kiểm tra:

- Tất cả bones có tên duy nhất.
- Bone hierarchy đúng.
- Local transforms chính xác.
- World transforms đúng.
- Joint pivot nằm đúng vị trí.
- Tư thế bind pose là T-Pose.
- Không có bone bị scale không mong muốn.

Nên tạo một chế độ debug để hiển thị:

- Bone lines.
- Bone joints.
- Bone names.
- Local axes.

Đầu ra giai đoạn 3: Một skeleton hoàn chỉnh, có thể điều khiển từng bone độc lập.

# 5. Giai đoạn 4 – Skinning và Skin Weight Generation

Đây là công đoạn quan trọng nhất nếu muốn nhân vật chuyển động tự nhiên.

Skeleton chỉ là bộ xương. Để mesh có thể biến dạng theo bộ xương, cần thực hiện Skinning.

## 5.1. Nguyên lý

Mỗi vertex có thể chịu ảnh hưởng của nhiều bones.

Ví dụ:

[Advice Skinning Shoulders on Rig - CG Cookie](https://images.openai.com/static-rsc-4/l_0a47aaIXmKzclOsxizL0zNEihZBXJ_C6X5P80QcOWXUKO3QowqXFnZVHce_n6kgRkxhtieCqoyw5TASD5FRHgnFvG65AiFPOpkNqfa9ToRY2G0VmvUzb4nXqrF4B4QjX0HOiDtE9GmaxGdmd4V3bu3mAfVzS5ldt8Ee7H4O4o?purpose=inline)

[cgcookie.com](https://cgcookie.com/community/7469-advice-skinning-shoulders-on-rig?utm_source=chatgpt.com)

Một vertex tại vùng vai có thể chịu ảnh hưởng:

| Bone         | Weight |
| ------------ | ------ |
| Chest        | 0.20   |
| LeftUpperArm | 0.75   |
| LeftShoulder | 0.05   |
| Tổng         | 1.00   |

Một vertex tại cánh tay trên có thể chịu ảnh hưởng chủ yếu từ `LeftUpperArm`.

Công thức tổng quát:

\\[ P' = \sum\_{i=1}^{n} w_i M_i P \\]

Trong đó:

- \\(P\\): vertex ban đầu.
- \\(P'\\): vertex sau biến dạng.
- \\(M_i\\): biến đổi của bone.
- \\(w_i\\): skin weight.

## 5.2. Skin Weight Strategy

Tôi đề xuất ba cấp độ:

| Phương pháp          | Mục đích                          |
| -------------------- | --------------------------------- |
| Rigid attachment     | Prototype nhanh                   |
| Analytical weights   | Tự tính weight theo vị trí vertex |
| Advanced deformation | Xử lý vùng khớp phức tạp          |

### Analytical Weight Generation

Ví dụ với cánh tay:

- Vertex gần vai chịu ảnh hưởng của Chest và UpperArm.
- Vertex ở giữa cánh tay chịu ảnh hưởng chính từ UpperArm.
- Vertex gần khuỷu chịu ảnh hưởng của UpperArm và LowerArm.
- Vertex gần cổ tay chịu ảnh hưởng chính từ LowerArm.

Có thể sử dụng khoảng cách đến bone segment để tính influence.

Một phương pháp đơn giản:

\\[ w_i = \frac{1/d_i^p}{\sum_j 1/d_j^p} \\]

Trong đó:

- \\(d_i\\): khoảng cách từ vertex đến bone segment gần nhất.
- \\(p\\): hệ số điều chỉnh ảnh hưởng khoảng cách.

Sau khi tính phải normalize weights và giới hạn tối đa 4 influences.

Tuy nhiên, chỉ dùng khoảng cách Euclidean chưa đủ để tạo skin weights chất lượng cao. Cần thêm vùng giới hạn ảnh hưởng theo từng bộ phận, joint falloff và kiểm tra biến dạng ở tư thế cực trị.

### Những vùng cần ưu tiên

1. Shoulder.
2. Elbow.
3. Wrist.
4. Hip.
5. Knee.
6. Ankle.

Đây là các vùng dễ gặp lỗi deformation.

## 5.3. Tạo SkinnedMesh

Sau khi geometry có skin attributes:

```
const skinnedMesh = new THREE.SkinnedMesh(
  geometry,
  material
);

skinnedMesh.add(rootBone);

skinnedMesh.bind(skeleton);
```

Cần kiểm tra:

- Geometry có `skinIndex`.
- Geometry có `skinWeight`.
- Skeleton có đầy đủ bones.
- Bind pose đúng.
- Bone indices không vượt quá số lượng bones.
- Tổng weight của từng vertex bằng 1.

Đầu ra giai đoạn 4: Một nhân vật có thể biến dạng khi xoay bones, không chỉ là những bộ phận cứng gắn vào nhau.

# 6. Giai đoạn 5 – Rig Testing

Đừng chuyển sang animation ngay sau khi tạo xong skeleton và skinning.

Cần có một Rig Test Scene độc lập.

[What is 3D Rigging? An Essential Guide to How It Works](https://images.openai.com/static-rsc-4/RJnNn8LBluokhWpn1C3sxGAMIMBcSIs-sGLWMlo0flmApkg9BJqwgGJcPMOYVjL4Ret66GnTXPCmvqSl279NEjkCHPgXbv-mmVB8N_JA46igZCPWfkbXXBV82SkPp33sOmUf3y4f_2X90zQJYrrKUixmQBtCDWwActXfpJxnrw8?purpose=inline)

[news.viverse.com](https://www.news.viverse.com/post/what-is-3d-rigging-an-essential-guide-to-how-it-works?utm_source=chatgpt.com)

## 6.1. Các pose bắt buộc

| Test          | Mục đích           |
| ------------- | ------------------ |
| T-Pose        | Kiểm tra bind pose |
| Arm Raise     | Kiểm tra vai       |
| Elbow Bend    | Kiểm tra khuỷu     |
| Knee Bend     | Kiểm tra đầu gối   |
| Leg Raise     | Kiểm tra hông      |
| Torso Twist   | Kiểm tra cột sống  |
| Head Rotation | Kiểm tra cổ        |

## 6.2. Rig Debug Panel

Tạo một panel cho phép chọn bone và điều chỉnh:

```
interface RigDebugState {
  selectedBone: string;

  rotationX: number;
  rotationY: number;
  rotationZ: number;

  showSkeleton: boolean;
  showJoints: boolean;
  showWeights: boolean;
}
```

Cần có chức năng reset về bind pose.

Tiêu chí đạt:

- Không có lỗ hổng tại khớp.
- Không có mesh bị kéo dài bất thường.
- Không có vertex bị ảnh hưởng bởi bone sai.
- Mesh không bị xoắn ngoài ý muốn.
- Joint deformation chấp nhận được ở các pose kiểm thử.

# 7. Giai đoạn 6 – Character Export và Asset Registry

Khi rig đã được xác nhận, chúng ta mới đưa character vào pipeline asset chính.

Tôi khuyên dùng GLB làm định dạng asset runtime.

[3D Bandit - TurboSquid 2386809](https://images.openai.com/static-rsc-4/exFmCljwdJhN9QXxAPh18gaLMMPC6s6vFmK59srEpGx9_a5mkW3R7UCoW8wz_OVo3idZOXK5qHwodp5ivfVrcEwBE9hid56k9bVYIEs59EWVUJxpyAWAMqz7JJPDK6dUlKJ_f9Y57zHKguRO6_f0Xu6r0E6UZ_P0QCC4AcsAKGQ?purpose=inline)

[turbosquid.com](https://www.turbosquid.com/3d-models/3d-bandit-2386809?utm_source=chatgpt.com)

Pipeline:

```
Procedural Character
        │
        ▼
Geometry + Skeleton
        │
        ▼
SkinnedMesh
        │
        ▼
GLTFExporter
        │
        ▼
character.glb
        │
        ▼
GLTFLoader
        │
        ▼
CharacterAssetRegistry
        │
        ▼
Game Runtime
```

Không cần Blender trong quy trình này.

Tuy nhiên, cần kiểm tra tương thích exporter với:

- SkinnedMesh.
- Skeleton.
- Bind pose.
- Materials.
- Animation clips nếu có.

Three.js `GLTFExporter` hỗ trợ xuất scene và dữ liệu animation tương thích glTF trong phạm vi các tính năng được hỗ trợ. Không nên giả định mọi custom shader hoặc procedural feature đều có thể xuất trực tiếp.

## 7.1. Asset Registry

```
export interface CharacterAsset {
  id: string;
  model: THREE.Group;
  skeleton?: THREE.Skeleton;
  animations: THREE.AnimationClip[];
}
```

Sau này có thể quản lý:

```
characters/
├── hero-warrior/
│   ├── model.glb
│   ├── character.json
│   └── thumbnail.png
│
├── hero-assassin/
│   ├── model.glb
│   ├── character.json
│   └── thumbnail.png
│
└── hero-tank/
    ├── model.glb
    ├── character.json
    └── thumbnail.png
```

# 8. Cấu trúc source code hoàn chỉnh cho pipeline

Tôi đề xuất tách pipeline thành một package/module độc lập:

```
src/
└── game/
    └── character/
        │
        ├── definitions/
        │   ├── CharacterDefinition.ts
        │   ├── CharacterProportions.ts
        │   └── CharacterPresets.ts
        │
        ├── modeling/
        │   ├── geometry/
        │   │   ├── BodyGeometry.ts
        │   │   ├── LimbGeometry.ts
        │   │   ├── HeadGeometry.ts
        │   │   └── GeometryUtils.ts
        │   │
        │   ├── builders/
        │   │   ├── BodyBuilder.ts
        │   │   ├── HeadBuilder.ts
        │   │   ├── ArmBuilder.ts
        │   │   ├── LegBuilder.ts
        │   │   └── ArmorBuilder.ts
        │   │
        │   └── materials/
        │       ├── MaterialBuilder.ts
        │       └── MaterialPresets.ts
        │
        ├── rigging/
        │   ├── SkeletonBuilder.ts
        │   ├── BoneDefinition.ts
        │   ├── BoneMapping.ts
        │   ├── SkinWeightGenerator.ts
        │   ├── SkinningBuilder.ts
        │   ├── CharacterRig.ts
        │   └── RigValidator.ts
        │
        ├── animation/
        │   ├── PoseDefinition.ts
        │   ├── PoseBuilder.ts
        │   └── ProceduralAnimator.ts
        │
        ├── export/
        │   ├── CharacterExporter.ts
        │   └── CharacterSerializer.ts
        │
        ├── debug/
        │   ├── SkeletonHelper.ts
        │   ├── WeightVisualizer.ts
        │   └── RigTestScene.ts
        │
        ├── runtime/
        │   ├── CharacterFactory.ts
        │   └── CharacterAssetRegistry.ts
        │
        └── index.ts
```

Module boundaries cần giữ:

| Module      | Trách nhiệm                   |
| ----------- | ----------------------------- |
| Definitions | Khai báo thông số nhân vật    |
| Modeling    | Sinh geometry                 |
| Rigging     | Sinh skeleton và skin weights |
| Animation   | Điều khiển pose               |
| Export      | Xuất asset                    |
| Debug       | Kiểm tra geometry và rig      |
| Runtime     | Khởi tạo và sử dụng character |

Không để `CharacterGenerator` trực tiếp xử lý tất cả các nhiệm vụ trên.

# 9. Thứ tự thực hiện thực tế

Với một developer solo và coding agent hỗ trợ, tôi đề xuất chia thành 6 milestone:

| Milestone | Công việc                               | Kết quả                      |
| --------- | --------------------------------------- | ---------------------------- |
| M1        | Character proportions + primitive model | Humanoid T-Pose              |
| M2        | Parametric geometry                     | Body model hoàn chỉnh        |
| M3        | Skeleton generation                     | Bộ xương 21 bones            |
| M4        | Skinning                                | Mesh biến dạng theo skeleton |
| M5        | Rig validation                          | Test các khớp và pose        |
| M6        | GLB export/import                       | Character asset tái sử dụng  |

Không nên bắt đầu với animation phức tạp trước khi M5 hoàn thành.

# 10. Checklist nghiệm thu Character Pipeline

Character Pipeline

# 0/25

1\. Modeling

Character proportions được chuẩn hóa

Có humanoid T-Pose

Head, torso, arms, legs đầy đủ

Geometry có topology phù hợp cho skinning

Có material và color presets

Có thể thay đổi proportions bằng config

2\. Skeleton

Skeleton có 21 bones

Bone hierarchy đúng

Bone names ổn định

Root và Hips tách biệt

Bind pose chính xác

Có SkeletonHelper

3\. Skinning

Có skinIndex attribute

Có skinWeight attribute

Tối đa 4 influences mỗi vertex

Weights được normalize

Shoulder deformation đạt yêu cầu

Elbow deformation đạt yêu cầu

Hip và knee deformation đạt yêu cầu

4\. Validation & Export

Có Rig Test Scene

Có thể điều khiển từng bone

Có reset bind pose

Không bị mesh tearing nghiêm trọng

GLB export thành công

GLB import lại đúng skeleton và geometry

# 11. Prompt cho Coding Agent – Character & Rig Pipeline

Tôi khuyên triển khai riêng pipeline này trước, chưa tích hợp Movement, Camera hoặc Combat.

# ROLE

You are a Senior Procedural 3D Character Technical Artist and Three.js Engineer.

Build a reusable procedural humanoid character modeling and rigging pipeline using Three.js and TypeScript.

# CONSTRAINTS

- Three.js only for 3D character generation.
- TypeScript.
- No Blender.
- No Unity or Unreal.
- No external DCC software.
- No mandatory external character generation service.
- All geometry and skeleton data must be generated programmatically.
- Character must support procedural skeletal animation in future phases.

# OBJECTIVE

Create a reusable humanoid character pipeline with:

1. Character definition and proportions.
2. Procedural geometry generation.
3. Skeleton generation.
4. Skin weight generation.
5. SkinnedMesh construction.
6. Rig validation.
7. Debug visualization.
8. GLB export and import validation.

# MILESTONE 1: CHARACTER MODELING

Create a stylized low-poly humanoid in T-Pose.

Target height: 1.8 units.

Coordinate convention:

- X: left/right.
- Y: up.
- Z: forward.
- Character faces +Z.

Implement:

- CharacterDefinition.
- CharacterProportions.
- CharacterGenerator.
- BodyBuilder.
- HeadBuilder.
- ArmBuilder.
- LegBuilder.
- MaterialBuilder.

Use parametric BufferGeometry where appropriate.

Avoid relying exclusively on primitive geometry.

Separate body parts, armor, and accessories.

Allow proportions and colors to be configured without modifying geometry generation logic.

Acceptance criteria:

- Complete humanoid silhouette.
- Correct T-Pose.
- Consistent scale.
- No missing body parts.
- Geometry is suitable for later rigging.

# MILESTONE 2: SKELETON GENERATION

Build a reusable SkeletonBuilder.

Required bones:

Root

- Hips
  - Spine
    - Chest
      - Neck
        - Head
      - LeftShoulder
        - LeftUpperArm
          - LeftLowerArm
            - LeftHand
      - RightShoulder
        - RightUpperArm
          - RightLowerArm
            - RightHand
  - LeftUpperLeg
    - LeftLowerLeg
      - LeftFoot
  - RightUpperLeg
    - RightLowerLeg
      - RightFoot

Requirements:

- Use THREE.Bone.
- Use THREE.Skeleton.
- Preserve stable bone names.
- Generate correct local transforms.
- Generate correct world transforms.
- Separate Root from Hips.
- Provide bone lookup.
- Provide bind pose reset.

Acceptance criteria:

- All required bones exist.
- Hierarchy is correct.
- Bone positions align with character joints.
- Skeleton visualization works.

# MILESTONE 3: SKIN WEIGHT GENERATION

Implement SkinWeightGenerator.

Requirements:

- Generate skinIndex.
- Generate skinWeight.
- Support four influences per vertex.
- Normalize weights.
- Calculate influences using bone segment distance and region constraints.
- Handle shoulders, elbows, hips, knees, and ankles.
- Avoid invalid bone indices.
- Ensure geometry and skeleton use the same bind coordinate space.

Use THREE.SkinnedMesh and THREE.Skeleton.

Do not use rigid attachment as a substitute for the final skinned body mesh.

Acceptance criteria:

- Rotating bones deforms the mesh.
- No missing skin attributes.
- No invalid indices.
- Weights sum to approximately 1 for every vertex.

# MILESTONE 4: RIG VALIDATION

Create a dedicated RigTestScene.

Implement:

- SkeletonHelper.
- Bone selection.
- Bone rotation controls.
- Bind pose reset.
- Joint deformation tests.
- Weight visualization if feasible.

Required test poses:

- T-Pose.
- Arm raise.
- Elbow bend.
- Knee bend.
- Leg raise.
- Torso twist.
- Head rotation.

Acceptance criteria:

- Major joints deform correctly.
- No unexpected mesh tearing.
- No cumulative transform drift.
- Character can return to bind pose.

# MILESTONE 5: EXPORT

Implement:

- CharacterExporter.
- GLTFExporter integration.
- GLTFLoader validation.
- CharacterAssetRegistry.

Export a GLB containing the character mesh, materials, and skeleton.

Validate by importing the exported GLB into a fresh scene.

Do not assume export succeeded merely because no exception was thrown.

Check:

- Mesh geometry.
- Skeleton hierarchy.
- Skin attributes.
- Materials.
- Character scale.
- Bind pose.

# ARCHITECTURE

Separate:

- Definitions.
- Modeling.
- Rigging.
- Animation.
- Debug.
- Export.
- Runtime.

Do not create a monolithic CharacterGenerator.

Keep geometry generation independent from rigging.

Keep rigging independent from gameplay.

Use strict TypeScript.

# IMPLEMENTATION RULES

1. Inspect the existing repository first.
2. Report the current architecture and dependencies.
3. Propose the source structure.
4. Implement one milestone at a time.
5. Validate every milestone before proceeding.
6. Run TypeScript checks and relevant tests.
7. Do not silently skip incomplete requirements.
8. Do not implement gameplay movement or combat.
9. Do not install Blender or any DCC software.
10. Provide a working browser-based character preview.

# FIRST TASK

Implement Milestone 1 only.

Generate a complete stylized humanoid in T-Pose.

Create a browser preview that allows orbiting the camera, inspecting the model, and toggling wireframe.

Do not proceed to skeleton generation until the modeling milestone has been validated.

# 12. Khuyến nghị cuối cùng

Có một lựa chọn kiến trúc tôi muốn bạn giữ ngay từ đầu:

Không nên xây dựng character bằng cách ghép hàng chục primitive độc lập rồi cố gắng biến tất cả thành một SkinnedMesh về sau.

Hãy sử dụng hai loại geometry:

| Loại                  | Mục đích                              |
| --------------------- | ------------------------------------- |
| Deformable body mesh  | Đầu, thân, tay, chân – cần skinning   |
| Rigid attachment mesh | Giáp, vũ khí, phụ kiện – gắn vào bone |

Điều này sẽ giúp:

- Skinning dễ kiểm soát hơn.
- Giảm số lượng vertex cần xử lý.
- Dễ thay đổi trang bị.
- Dễ tái sử dụng skeleton giữa nhiều hero.
- Giảm độ phức tạp của character pipeline.

Thứ tự tôi khuyên bạn thực hiện ngay bây giờ:

1. Tạo một humanoid T-Pose bằng procedural geometry.
2. Hoàn thiện proportions và silhouette.
3. Tạo skeleton 21 bones.
4. Gắn skeleton vào geometry.
5. Hoàn thiện skin weights và kiểm tra các khớp.
6. Xuất GLB và import lại.

Chỉ khi hoàn thành bước 6 mới chuyển sang xây dựng animation system.

Đây là cách ít rủi ro nhất để xây dựng một pipeline tạo hero 3D có thể tái sử dụng cho toàn bộ game mà không cần Blender.