// Sinh JSON Schema cho hero: node scripts/gen-schema.mjs [thư mục ra, mặc định templates/]
import fs from 'node:fs';
import path from 'node:path';
const outDir = process.argv[2] ?? path.resolve(import.meta.dirname, '../templates');
const BONES = ['Root','Hips','Spine','Chest','Neck','Head','LeftShoulder','LeftUpperArm','LeftLowerArm','LeftHand','RightShoulder','RightUpperArm','RightLowerArm','RightHand','LeftUpperLeg','LeftLowerLeg','LeftFoot','RightUpperLeg','RightLowerLeg','RightFoot'];
const PARTS = ['torso','neck','head','arm','hand','leg','foot'];
const POSES = ['idle','tpose','armRaise','elbowBend','kneeBend','legRaise','torsoTwist','headTurn'];
const num = (min, max, description) => ({ type: 'number', minimum: min, maximum: max, description });
const int = (min, max, description) => ({ type: 'integer', minimum: min, maximum: max, description });
const len = (d) => num(0.005, 1.5, d + ' (mét)');
const unit = (d) => num(0, 1, d);
const ang = (d) => num(-360, 360, d + ' (độ)');
const small = (d) => num(0, 0.3, d + ' (mét)');
const str = (d, max = 200) => ({ type: 'string', minLength: 1, maxLength: max, description: d });
const obj = (description, properties, required = Object.keys(properties)) => ({ type: 'object', description, additionalProperties: false, required, properties });
const vec3 = (item, d) => ({ type: 'array', minItems: 3, maxItems: 3, items: item, description: d });
const colorRef = (d) => ({ type: 'string', minLength: 1, description: d + '. Tên vai trò màu trong palette (ví dụ "armor") hoặc mã "#RRGGBB".' });
const side = { type: 'string', enum: ['left', 'right'], description: 'Bên trái/phải của nhân vật. Bắt buộc với arm/hand/leg/foot, không dùng với torso/neck/head.' };
const part = { type: 'string', enum: PARTS, description: 'Bộ phận cơ thể: torso (thân), neck (cổ), head (đầu), arm (cả cánh tay), hand (bàn tay), leg (cả chân), foot (bàn chân).' };
const bone = { type: 'string', enum: BONES, description: 'Ép gắn vào bone này thay vì bone tự suy ra từ vị trí.' };

const defs = {
  hexColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', description: 'Mã màu dạng #RRGGBB.' },
  section: obj('Một tiết diện ngang dọc theo bộ phận.', {
    t: unit('Vị trí dọc bộ phận, 0 = đầu, 1 = cuối'),
    width: len('Bề ngang tiết diện (theo hướng 90°)'),
    depth: len('Bề dày tiết diện (theo hướng 0°)'),
    forward: num(-0.5, 0.5, 'Dịch tâm tiết diện về phía trước (+) hoặc sau (−) (mét, hoặc tỷ lệ với đầu)'),
  }, ['t', 'width', 'depth']),
  sections: { type: 'array', minItems: 2, maxItems: 12, items: { $ref: '#/definitions/section' }, description: 'Các tiết diện, t tăng dần, phần tử đầu t = 0, phần tử cuối t = 1.' },
  colorSpec: {
    description: 'Màu: mã "#RRGGBB" hoặc object có thêm độ phát sáng, kim loại, nhám.',
    oneOf: [
      { $ref: '#/definitions/hexColor' },
      obj('Màu có thông số vật liệu.', {
        color: { $ref: '#/definitions/hexColor' },
        emissive: num(0, 5, 'Độ phát sáng, 0 = không phát sáng'),
        metalness: unit('Độ kim loại, 0 = nhựa/vải, 1 = kim loại'),
        roughness: unit('Độ nhám, 0 = bóng loáng, 1 = mờ hoàn toàn'),
      }, ['color']),
    ],
  },
  surfaceMount: obj('Một điểm trên bề mặt thân.', {
    part, side,
    t: unit('Vị trí dọc bộ phận, 0 = đầu, 1 = cuối'),
    angleDeg: ang('Góc quanh bộ phận: 0 = phía trước; 90 = bên trái (thân/đầu), phía trên (tay), phía ngoài (chân)'),
    standoff: small('Khoảng đẩy ra khỏi bề mặt'),
  }, ['part', 't', 'angleDeg']),
  attach: {
    type: 'object', additionalProperties: false, minProperties: 1, maxProperties: 1,
    description: 'Điểm gắn: chọn MỘT trong hai, "socket" hoặc "mount".',
    properties: {
      socket: str('Tên socket đã khai báo trong "sockets"', 64),
      mount: { $ref: '#/definitions/surfaceMount' },
    },
  },
  vec3Offset: vec3(num(-2, 2, 'Thành phần toạ độ (mét)'), 'Dịch thêm [x, y, z] theo hệ toạ độ của điểm gắn (mét).'),
  vec3Rotation: vec3(ang('Góc xoay'), 'Xoay thêm [x, y, z] (độ).'),
  primitive: obj('Một khối trong vũ khí/đồ ghép.', {
    shape: { type: 'string', enum: ['box', 'cylinder', 'cone', 'spike', 'wedge', 'blade'], description: 'Hình khối: box (hộp), cylinder (trụ), cone (nón), spike (gai chóp 4 cạnh), wedge (vây tam giác), blade (lưỡi dao). Trụ/nón/gai/lưỡi nhọn về phía +Z.' },
    size: vec3(num(0, 1.5, 'Kích thước (mét)'), 'box/spike/wedge/blade: [rộng x, cao y, dài z]. cylinder/cone: [đường kính, chiều dài, 0] (mét).'),
    position: vec3(num(-2, 2, 'Toạ độ (mét)'), 'Vị trí tâm khối trong đồ ghép [x, y, z] (mét).'),
    rotationDeg: { $ref: '#/definitions/vec3Rotation' },
    color: colorRef('Màu của khối'),
  }, ['shape', 'size', 'position', 'color']),
};

const itemBase = {
  id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,47}$', description: 'Mã món đồ, chữ thường và gạch nối, không trùng.' },
  color: colorRef('Màu chính'),
  edgeColor: colorRef('Màu viền (tuỳ chọn)'),
  bone,
};
const plateLike = (kind, d, extra, req) => obj(d, { kind: { const: kind, description: `Kiểu trang bị: "${kind}".` }, ...itemBase, ...extra }, ['kind', 'id', 'color', ...req]);
const equipment = {
  type: 'array', maxItems: 80, description: 'Danh sách trang bị (giáp, mũ, phụ kiện, vũ khí).',
  items: {
    type: 'object', discriminator: { propertyName: 'kind' }, required: ['kind'],
    description: 'Một món trang bị. "kind" quyết định các trường còn lại.',
    oneOf: [
      plateLike('plate', 'Tấm giáp cong ôm theo bộ phận cơ thể.', {
        part, side,
        tStart: unit('Bắt đầu dọc bộ phận'), tEnd: unit('Kết thúc dọc bộ phận (lớn hơn tStart)'),
        angleStartDeg: ang('Góc bắt đầu quanh bộ phận'), angleEndDeg: ang('Góc kết thúc quanh bộ phận'),
        thickness: small('Độ dày tấm'), gap: small('Khe hở giữa tấm và da'),
        layers: int(1, 6, 'Số lớp chồng nhau (giáp vai nhiều lớp)'),
        layerOverlap: num(0, 0.9, 'Tỷ lệ chồng giữa các lớp'),
        bulge: small('Độ phồng tròn ở giữa tấm'),
        point: small('Vuốt nhọn mép cuối (phía tEnd) thành mũi chữ V ở giữa, dài thêm bấy nhiêu'),
        ridge: small('Sống gờ sắc chạy dọc giữa tấm, nhô ra bấy nhiêu'),
      }, ['part', 'tStart', 'tEnd', 'angleStartDeg', 'angleEndDeg', 'thickness', 'gap']),
      plateLike('band', 'Dải vòng quanh bộ phận (kính mũ, thắt lưng, băng tay).', {
        part, side,
        t: unit('Vị trí tâm dải dọc bộ phận'), height: len('Bề cao của dải'),
        angleStartDeg: ang('Góc bắt đầu'), angleEndDeg: ang('Góc kết thúc'),
        thickness: small('Độ dày dải'), gap: small('Khe hở giữa dải và da'),
      }, ['part', 't', 'height', 'angleStartDeg', 'angleEndDeg', 'thickness', 'gap']),
      plateLike('shell', 'Vỏ mũ ôm đầu.', {
        coverage: unit('Phần đầu được che, tính từ đỉnh xuống (1 = che hết)'),
        faceOpeningDeg: num(0, 360, 'Độ rộng ô hở mặt quanh phía trước (độ, 0 = kín)'),
        faceOpeningTop: unit('Mép trên của ô hở mặt theo t của đầu (0 = cằm, 1 = đỉnh); phần trên mép này kín. Mặc định 0.72 (ngang lông mày)'),
        thickness: small('Độ dày vỏ'), gap: small('Khe hở giữa vỏ và đầu'),
        crest: obj('Gờ chạy dọc giữa đỉnh mũ.', { height: small('Chiều cao gờ'), width: len('Bề rộng gờ') }),
      }, ['coverage', 'faceOpeningDeg', 'thickness', 'gap']),
      plateLike('box', 'Hộp bo góc áp vào thân (ba lô, túi).', {
        attach: { $ref: '#/definitions/attach' },
        size: vec3(len('Kích thước'), 'Kích thước [rộng, cao, dày] (mét). Mặt "dày" áp vào thân.'),
        cornerRadius: small('Bán kính bo góc'),
        offset: { $ref: '#/definitions/vec3Offset' }, rotationDeg: { $ref: '#/definitions/vec3Rotation' },
      }, ['attach', 'size', 'cornerRadius']),
      plateLike('assembly', 'Đồ ghép từ nhiều khối (vũ khí, khiên).', {
        attach: { $ref: '#/definitions/attach' },
        parts: { type: 'array', minItems: 1, maxItems: 32, items: { $ref: '#/definitions/primitive' }, description: 'Các khối tạo nên món đồ.' },
        offset: { $ref: '#/definitions/vec3Offset' }, rotationDeg: { $ref: '#/definitions/vec3Rotation' },
        scale: num(0.1, 10, 'Phóng to/thu nhỏ cả món đồ'),
      }, ['attach', 'parts']),
    ],
  },
};

// bodyDesign: phải khớp src/game/character/body/config/BodyDesign.ts (test tests/body/bodyDesignSchema.test.ts kiểm tra).
const ARCHETYPES = ['tank', 'fighter', 'assassin', 'mage', 'bruiser'];
const MUSCLE_GROUPS = ['chest', 'shoulders', 'arms', 'abdomen', 'back', 'glutes', 'thighs', 'calves'];
const MUSCLE_GROUP_NAMES = { chest: 'ngực', shoulders: 'vai (cơ delta)', arms: 'tay (biceps, triceps, cẳng tay)', abdomen: 'bụng', back: 'lưng (cơ thang, cơ lưng rộng)', glutes: 'mông', thighs: 'đùi', calves: 'bắp chân' };
const PROPORTION_KEYS = { shoulderWidth: 'bề ngang vai', chestWidth: 'bề ngang ngực', waistWidth: 'bề ngang eo', hipWidth: 'bề ngang hông', armVolume: 'độ to của tay', legVolume: 'độ to của chân' };
const bodyDesign = obj('Thiết kế thân theo phong cách Anatomical Body System (Heroic Smooth). Dùng thay cho cặp proportions + bodyShape; không dùng cùng lúc.', {
  version: { const: 1, description: 'Phiên bản cấu hình thân. Hiện là 1.' },
  style: { const: 'stylized-anatomical', description: 'Phong cách đã khoá: stylized-anatomical.' },
  surface: { const: 'smooth', description: 'Bề mặt đã khoá: smooth.' },
  proportionPreset: { const: 'heroic', description: 'Bộ tỷ lệ đã khoá: heroic.' },
  muscleDefinition: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Độ rõ của khối cơ: low, medium, high (mặc định của phong cách là high).' },
  archetype: { type: 'string', enum: ARCHETYPES, description: 'Dáng nền: tank (rất to), fighter (cân đối, khoẻ), assassin (gọn, săn chắc), mage (thon, cơ nhẹ), bruiser (vai và tay rất to).' },
  bodyType: { type: 'string', enum: ['masculine', 'feminine'], description: 'Dáng thân nam (masculine) hoặc nữ (feminine); mỗi dáng có bộ tỷ lệ riêng.' },
  height: num(1.4, 2.4, 'Chiều cao thân (mét). Bỏ trống = mặc định của archetype (thân nữ × 0.95)'),
  proportions: obj('Hệ số nhân thêm lên archetype, 1 = giữ nguyên.', Object.fromEntries(Object.entries(PROPORTION_KEYS).map(([k, d]) => [k, num(0.6, 1.6, `Hệ số ${d}`)])), []),
  muscles: obj('Hệ số độ nhô từng nhóm cơ, 1 = mặc định, 0 = không có cơ.', Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, num(0, 2, `Nhóm cơ ${MUSCLE_GROUP_NAMES[g]}`)])), []),
  surfaceSettings: obj('Cách thể hiện bề mặt.', {
    smoothness: unit('Độ mềm khi các khối cơ hoà vào nhau (mặc định 0.85)'),
    muscleSeparation: unit('Độ sâu rãnh giữa các khối cơ (mặc định theo archetype)'),
    surfaceResolution: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Mật độ lưới thân: low (16 cạnh mỗi vòng), medium (24), high (32, mặc định).' },
  }, []),
  material: obj('Vật liệu riêng của thân (không dùng chung với giáp). Màu lấy từ bodyPaint.', {
    roughness: unit('Độ nhám (mặc định 0.62)'),
    metalness: unit('Độ kim loại (mặc định 0)'),
    anatomicalContrast: num(0, 0.5, 'Độ tối thêm ở rãnh cơ, 0 = không tô (mặc định 0.18)'),
  }, []),
}, ['version', 'style', 'surface', 'proportionPreset', 'muscleDefinition', 'archetype', 'bodyType']);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'hero.schema.json',
  title: 'Hero definition',
  description: 'Định nghĩa một hero: tỷ lệ, hình dáng, màu, trang bị. Đơn vị độ dài là mét (1 đơn vị Three.js).',
  type: 'object', additionalProperties: false,
  required: ['id', 'version', 'profile', 'palette', 'bodyPaint', 'sockets', 'equipment', 'showcase'],
  oneOf: [
    { description: 'Thân kiểu cũ: proportions + bodyShape.', required: ['proportions', 'bodyShape'], not: { required: ['bodyDesign'] } },
    { description: 'Thân theo bodyDesign.', required: ['bodyDesign'], not: { anyOf: [{ required: ['proportions'] }, { required: ['bodyShape'] }] } },
  ],
  definitions: defs,
  properties: {
    $schema: { type: 'string', description: 'Đường dẫn tới hero.schema.json để VS Code gợi ý.' },
    id: { type: 'string', pattern: '^[a-z][a-z0-9-]{1,31}$', description: 'Mã hero, chữ thường và gạch nối, phải trùng tên thư mục heroes/<id>/.' },
    version: { const: 1, description: 'Phiên bản format. Hiện là 1.' },
    profile: obj('Thông tin hiển thị trên trang showcase.', {
      name: str('Tên hero', 60), role: str('Vai trò', 60), tagline: str('Câu giới thiệu ngắn', 160), description: str('Đoạn mô tả 2–3 câu', 1200),
    }),
    bodyDesign,
    proportions: obj('Tỷ lệ cơ thể (kiểu cũ, không dùng cùng bodyDesign). Tổng (foot.height + legs + torso.length + neck.length + head.height) phải gần bằng height (lệch tối đa 0.02).', {
      height: num(0.8, 3, 'Chiều cao thân từ đáy bàn chân tới đỉnh đầu, không tính trang bị (mét)'),
      head: obj('Kích thước đầu.', { width: len('Bề ngang đầu'), height: len('Chiều cao đầu từ cằm tới đỉnh'), depth: len('Bề dày đầu trước–sau') }),
      neck: obj('Cổ.', { length: len('Chiều dài cổ'), radius: len('Bán kính gốc cổ') }),
      torso: obj('Thân (thông số ảnh hưởng bộ xương).', {
        length: len('Chiều dài thân từ khớp hông tới gốc cổ'),
        shoulderWidth: len('Bề ngang vai; khớp vai đặt ở ±0.425 × giá trị này'),
        hipWidth: len('Bề ngang hông; khớp hông đặt ở ±0.30 × giá trị này'),
        pelvisDepth: len('Phần chậu thò xuống dưới khớp hông'),
      }),
      arms: obj('Tay.', { upperLength: len('Cánh tay trên (vai → khuỷu)'), lowerLength: len('Cẳng tay (khuỷu → cổ tay)'), handLength: len('Bàn tay') }),
      legs: obj('Chân.', { upperLength: len('Đùi (hông → gối)'), lowerLength: len('Cẳng chân (gối → cổ chân)') }),
      foot: obj('Bàn chân.', { length: len('Chiều dài bàn chân'), height: len('Chiều cao cổ chân so với mặt đất'), width: len('Bề ngang bàn chân') }),
    }),
    bodyShape: obj('Hình dáng mesh thân.', {
      radialSegments: { ...int(8, 32, 'Số cạnh quanh mỗi vòng tiết diện: 8, 16, 24 hoặc 32 (bội số của 8). Càng nhiều càng tròn, 8 là góc cạnh nhất'), multipleOf: 8 },
      ringsPerMeter: num(10, 120, 'Mật độ vòng tiết diện dọc cơ thể (vòng/mét)'),
      shading: { type: 'string', enum: ['flat', 'smooth'], description: 'flat = mặt phẳng low-poly, smooth = mượt.' },
      torso: obj('Thân. t: 0 = đáy chậu, 1 = gốc cổ. Kích thước tính bằng mét.', { squareness: num(1.5, 6, 'Độ vuông của tiết diện: 2 = elip, cao hơn = vuông hơn'), sections: { $ref: '#/definitions/sections' } }),
      neck: obj('Cổ.', { taper: num(0.2, 2, 'Bán kính đỉnh cổ / bán kính gốc cổ') }),
      head: obj('Đầu. t: 0 = cằm, 1 = đỉnh. width/depth/forward là TỶ LỆ so với proportions.head.', { squareness: num(1.5, 6, 'Độ vuông của tiết diện'), sections: { $ref: '#/definitions/sections' } }),
      arm: obj('Cánh tay. t: 0 = khớp vai, 1 = cổ tay. Mét.', { squareness: num(1.5, 6, 'Độ vuông của tiết diện'), sections: { $ref: '#/definitions/sections' } }),
      leg: obj('Chân. t: 0 = khớp hông, 1 = cổ chân. Mét.', { squareness: num(1.5, 6, 'Độ vuông của tiết diện'), sections: { $ref: '#/definitions/sections' } }),
      hand: obj('Bàn tay.', { width: len('Bề ngang bàn tay'), thickness: len('Độ dày bàn tay'), squareness: num(1.5, 6, 'Độ vuông của tiết diện') }),
      foot: obj('Bàn chân.', { squareness: num(1.5, 6, 'Độ vuông của tiết diện'), toeTaper: num(0.2, 1.5, 'Độ thu nhỏ ở mũi chân (1 = không thu)') }),
      muscles: { type: 'array', maxItems: 40, description: 'Khối cơ: chỗ phồng (amount dương) hoặc rãnh (amount âm) trên bề mặt. Trên thân/cổ/đầu tự đối xứng trái–phải; trên tay/chân áp dụng cho cả hai bên.', items: obj('Một khối cơ.', {
        part,
        t: unit('Tâm khối cơ dọc bộ phận'),
        length: num(0.01, 1, 'Nửa chiều dài vùng ảnh hưởng dọc bộ phận (theo t)'),
        angleDeg: ang('Hướng tâm khối cơ quanh bộ phận (cùng quy ước góc với trang bị)'),
        spreadDeg: num(5, 180, 'Nửa độ rộng vùng ảnh hưởng quanh bộ phận (độ)'),
        amount: num(-0.05, 0.08, 'Độ nhô ra (dương) hoặc lõm vào (âm) tại tâm (mét)'),
      }) },
    }, ['radialSegments', 'ringsPerMeter', 'shading', 'torso', 'neck', 'head', 'arm', 'leg', 'hand', 'foot']),
    palette: {
      type: 'object', description: 'Bảng màu theo vai trò. Bắt buộc có skin, suit, armor, accent; được thêm vai trò tuỳ ý.',
      required: ['skin', 'suit', 'armor', 'accent'],
      propertyNames: { pattern: '^[a-z][a-zA-Z0-9-]{0,31}$' },
      additionalProperties: { $ref: '#/definitions/colorSpec' },
    },
    bodyPaint: obj('Màu từng vùng thân, theo tên vai trò trong palette hoặc mã màu.', Object.fromEntries(PARTS.map((p) => [p, colorRef(`Màu vùng ${p}`)]))),
    sockets: { type: 'array', maxItems: 16, description: 'Điểm gắn đồ (không phải bone).', items: obj('Một socket.', {
      name: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,31}$', description: 'Tên socket, chữ thường và gạch dưới.' },
      mount: { $ref: '#/definitions/surfaceMount' },
      rotationDeg: { $ref: '#/definitions/vec3Rotation' },
    }, ['name', 'mount']) },
    equipment,
    showcase: obj('Thiết lập hiển thị trên trang showcase.', {
      defaultPose: { type: 'string', enum: POSES, description: 'Tư thế khi mở trang.' },
      cameraAzimuthDeg: ang('Góc camera quanh nhân vật, 0 = nhìn chính diện'),
      cameraElevationDeg: num(-89, 89, 'Góc ngẩng camera (độ)'),
      cameraDistance: num(0.5, 20, 'Khoảng cách camera (mét)'),
    }),
  },
};
fs.writeFileSync(path.join(outDir, 'hero.schema.json'), JSON.stringify(schema, null, 2) + '\n');
