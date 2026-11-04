# Hero Showcase: hero 3D sinh bằng code (Three.js)

Pipeline tạo nhân vật 3D hoàn toàn bằng code, không dùng Blender, theo `quy-trinh.md`:
proportions → mesh thân liền khối → skeleton 20 bone → skin weights → rig test → xuất GLB.
Mỗi hero chỉ là một file JSON.

## Chạy

```bash
npm install
npm run dev              # trang showcase: http://localhost:5173/
                         # preview kỹ thuật: http://localhost:5173/?preview=1
npm test                 # toàn bộ test (vitest)
npm run typecheck
npm run build
npm run snapshot -- m7   # chụp ảnh duyệt theo scripts/shots.config.json (Playwright)
node scripts/verify-export.mjs kestrel   # bấm "Xuất GLB" trong trình duyệt thật và đối chiếu
```

## Tạo hero mới

Xem [`templates/HERO_TEMPLATE.md`](templates/HERO_TEMPLATE.md). Tóm tắt:
1. Copy `templates/hero-template.json` thành `heroes/<id>/hero.json`.
2. Đổi `"id"`, rồi chỉnh số liệu.
3. Chạy `npm run dev`.

## Cấu trúc

```
heroes/<id>/hero.json         định nghĩa từng hero (kestrel, granite)
templates/                    hero.schema.json, hero-template.json, HERO_TEMPLATE.md, body-presets/
src/game/character/
  definitions/                kiểu dữ liệu, kiểm tra JSON, proportions, layout khớp, preset
  modeling/                   bề mặt thân, khối cơ, mesh liền khối (UnifiedBody), trang bị, vật liệu
  rigging/                    skeleton, socket, skin weights, SkinnedMesh, gắn trang bị, kiểm tra rig
  animation/                  tư thế thử, bộ chuyển tư thế + nhịp thở
  export/                     xuất GLB, nạp lại, so sánh
  debug/                      xem bộ xương, xem weight, panel chỉnh bone
  runtime/                    registry hero, CharacterFactory, CharacterAssetRegistry
src/showcase/                 trang showcase
src/preview/                  preview kỹ thuật + Viewport
docs/superpowers/             spec và plan
```
