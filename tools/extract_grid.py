"""
격자로 그린 그림(칸 크기 일정) → public/sprites 시트 + manifest 등록.
- 🛡️ 영웅 장비 아이콘(6칸 한 줄): 칸마다 배경 제거 → 정사각 가운데 정렬 → 아이콘 시트(프레임 i = i번째 장비)
- 🗿 설치물(6열×4줄, 줄마다 바닥선 같음): 칸 통째로 배경 제거(바닥 위치 유지) → 같은 격자 시트,
  줄 = 등장(skill) · 대기(idle) · 공격(attack) · 사라짐(death). 알 대포 3줄 6칸의 알은 따로 탄환 그림.
원본: images/image/equip, images/image/totems(저장소 제외). 실행: python tools/extract_grid.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from extract_sprites import foreground  # noqa: E402

OUT = 'public/sprites'
SRC = '../images/image'
ICON = 64


def cut(img, box, thresh=60, holes=True):
    """칸 하나 → 배경(#1a2133) 투명 처리한 RGBA(칸 크기 그대로)."""
    cell = img.crop(box).convert('RGB')
    arr = np.asarray(cell)
    fg = foreground(arr, thresh, holes=holes)  # 고리 안쪽처럼 둘러싸인 배경색도 제거
    rgba = np.dstack([arr, (fg * 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def trim(im):
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def icons(name, file, size=96):
    img = Image.open(os.path.join(SRC, 'equip', file))
    n = img.width // 256
    sheet = Image.new('RGBA', (size * n, size), (0, 0, 0, 0))
    for i in range(n):
        art = trim(cut(img, (i * 256, 0, (i + 1) * 256, 256)))
        s = size * 0.92 / max(art.width, art.height)
        art = art.resize((max(1, round(art.width * s)), max(1, round(art.height * s))), Image.LANCZOS)
        sheet.alpha_composite(art, (i * size + (size - art.width) // 2, (size - art.height) // 2))
    sheet.save(os.path.join(OUT, f'{name}.png'), optimize=True)
    return {'file': f'{name}.png', 'filter': 'linear', 'frameWidth': size, 'frameHeight': size, 'scale': 0.5, 'footY': size,
            'anims': {'idle': {'frames': list(range(n)), 'fps': 1}}}


def totem(name, file, height, fps, egg=None):
    img = Image.open(os.path.join(SRC, 'totems', file))
    cols, rows = 6, 4
    xs = [round(c * img.width / cols) for c in range(cols + 1)]
    ys = [round(r * img.height / rows) for r in range(rows + 1)]
    ground = 230  # 줄마다 바닥선(칸 위에서 230px) — Codex layout.json ground_y_per_row
    cw, ch = max(xs[c + 1] - xs[c] for c in range(cols)), max(ys[r + 1] - ys[r] for r in range(rows))
    counts = [4, 4, 5, 4]
    idle = trim(cut(img, (xs[0], ys[1], xs[1], ys[2])))
    scale = height / idle.height  # 대기 첫 장 키 기준
    f = min(1.0, scale * 2)  # 게임 표시 크기의 2배로 저장(용량)
    fw, fh = round(cw * f), round(ch * f)
    sheet = Image.new('RGBA', (fw * cols, fh * rows), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(counts[r]):
            cell = cut(img, (xs[c], ys[r], xs[c] + cw, ys[r] + ch)).resize((fw, fh), Image.LANCZOS)
            sheet.alpha_composite(cell, (c * fw, r * fh))
    # 256색 팔레트로 용량 절감(눈으로 구분 안 됨)
    sheet.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(OUT, f'{name}.png'), optimize=True)
    # 카드 얼굴: 대기 첫 장 위쪽(머리)
    side = int(idle.height * 0.75)
    face = Image.new('RGBA', (max(side, idle.width), side), (0, 0, 0, 0))
    face.alpha_composite(idle.crop((0, 0, idle.width, side)), ((face.width - idle.width) // 2, 0))
    face.crop(((face.width - side) // 2, 0, (face.width - side) // 2 + side, side)).resize((ICON, ICON), Image.LANCZOS).save(
        os.path.join(OUT, f'icon_{name}.png'), optimize=True)
    meta = {'file': f'{name}.png', 'filter': 'linear', 'frameWidth': fw, 'frameHeight': fh, 'scale': round(scale / f, 3),
            'footY': round(ground * f), 'icon': f'icon_{name}.png',
            'anims': {'skill': {'frames': [0, 1, 2, 3], 'fps': fps['skill']}, 'idle': {'frames': [6, 7, 8, 9], 'fps': fps['idle']},
                      'attack': {'frames': [12, 13, 14, 15, 16], 'fps': fps['attack']}, 'death': {'frames': [18, 19, 20, 21], 'fps': fps['death']}}}
    out = {name: meta}
    if egg:  # 알 탄환(3줄 6칸)
        ball = trim(cut(img, (xs[5], ys[2], xs[6], ys[3])))
        s = 18 / ball.height
        ball = ball.resize((max(1, round(ball.width * s * 2)), max(1, round(ball.height * s * 2))), Image.LANCZOS)
        ball.save(os.path.join(OUT, f'{egg}.png'), optimize=True)
        out[egg] = {'file': f'{egg}.png', 'filter': 'linear', 'frameWidth': ball.width, 'frameHeight': ball.height, 'scale': 0.5,
                    'footY': ball.height, 'anims': {'idle': {'frames': [0], 'fps': 1}}}
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    man_path = os.path.join(OUT, 'manifest.json')
    with open(man_path, encoding='utf-8') as fp:
        manifest = json.load(fp)
    manifest['equip_weapon_icons'] = icons('equip_weapon_icons', 'Equip_weapons.png')
    manifest['equip_ring_icons'] = icons('equip_ring_icons', 'Equip_rings.png')
    fps = {'skill': 8, 'idle': 5, 'attack': 10, 'death': 7}
    manifest.update(totem('totem_egg', 'Totem_egg_cannon.png', 50, fps, egg='totem_egg_ball'))
    manifest.update(totem('totem_fire', 'Totem_fire.png', 58, fps))
    manifest.update(totem('totem_heal', 'Totem_heal.png', 54, fps))
    # ⭐ 설치물 진화 ★2·★3(같은 6×4 격자, 키 = '<설치물>_t2'·'_t3' — 진화 단계 그림 자동 선택)
    for t in (2, 3):
        manifest.update(totem(f'totem_egg_t{t}', f'Totem_egg_cannon_t{t}.png', 50, fps))
        manifest.update(totem(f'totem_fire_t{t}', f'Totem_fire_t{t}.png', 58, fps))
        manifest.update(totem(f'totem_heal_t{t}', f'Totem_heal_t{t}.png', 54, fps))
    with open(man_path, 'w', encoding='utf-8', newline='\n') as fp:
        fp.write(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    for k in ('equip_weapon_icons', 'equip_ring_icons', 'totem_egg', 'totem_fire', 'totem_heal', 'totem_egg_ball', 'totem_egg_t2', 'totem_egg_t3', 'totem_fire_t2', 'totem_fire_t3', 'totem_heal_t2', 'totem_heal_t3'):
        m = manifest[k]
        print(k, m['frameWidth'], m['frameHeight'], m['scale'])


if __name__ == '__main__':
    main()
