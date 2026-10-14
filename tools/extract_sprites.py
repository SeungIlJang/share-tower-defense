"""
AI 생성 캐릭터 시트(어두운 배경, 행=Idle/Walk/Attack/Hit/Dead) → 투명 스프라이트시트 + manifest.json

사용법 (share-tower-defense 루트에서):
  python tools/extract_sprites.py tools/sprites.config.json [--preview 미리보기.png]

- 시트: 행 단위로 배경 제거(테두리에서 flood fill → 캐릭터 안쪽 어두운 외곽선 보존)
  → 프레임(캐릭터 덩어리 + 붙어 있는 이펙트) 분리 → 머리 중심·발바닥 기준으로 정렬.
- 정지 이미지(몬스터·기지): 배경 제거 후 발바닥 높이·배율 계산. images 여러 장이면 한 시트로(기지 파손 단계).
- 결과: public/sprites/<type>.png 와 public/sprites/manifest.json(기존 항목은 덮어씀).
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

STATES = ['idle', 'walk', 'attack', 'death']
OUT_DIR = 'public/sprites'


def detect_bands(rgb, x0, x1, thresh=60, min_h=30):
    """내용이 있는 가로 띠(행) 검출 — 위에서부터."""
    reg = rgb[:, x0:x1].astype(int)
    bg = np.median(reg.reshape(-1, 3), axis=0)
    m = np.sqrt(((reg - bg) ** 2).sum(-1)) > thresh
    rows = m.sum(1)
    bands, cur = [], None
    for y, v in enumerate(rows):
        if v > 8:
            cur = [y, y] if cur is None else [cur[0], y]
        elif cur and y - cur[1] > 8:
            if cur[1] - cur[0] > min_h:
                bands.append(tuple(cur))
            cur = None
    if cur and cur[1] - cur[0] > min_h:
        bands.append(tuple(cur))
    return bands


def foreground(crop, thresh, strip_lines=False, holes=False):
    """테두리와 이어진 배경색 영역만 제거 → 캐릭터 내부 어두운 픽셀은 유지."""
    c = crop.astype(int)
    h, w, _ = c.shape
    border = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]])
    bg = np.median(border, axis=0)
    near_bg = np.sqrt(((c - bg) ** 2).sum(-1)) <= thresh
    lab, _ = ndimage.label(near_bg)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg_mask = np.isin(lab, list(edge_labels))
    fg = ~bg_mask
    if holes:  # 다리 사이처럼 테두리와 안 이어진 배경색 구멍도 제거(배경과 거의 같은 색, 40px 이상)
        lab_h, nh = ndimage.label(near_bg & fg & (np.sqrt(((c - bg) ** 2).sum(-1)) <= thresh / 2))
        sizes = ndimage.sum(np.ones_like(lab_h), lab_h, range(1, nh + 1))
        for i, sz in enumerate(sizes, start=1):
            if sz >= 40:
                fg[lab_h == i] = False
    if strip_lines:
        # 패널 테두리 가로선 제거 — 150px 이상 이어지고 두께 4px 이하인 것만(넓은 몸통은 보존)
        lines = ndimage.binary_opening(fg, structure=np.ones((1, 150)))
        lab_l, _ = ndimage.label(lines)
        for i, sl in enumerate(ndimage.find_objects(lab_l), start=1):
            if sl[0].stop - sl[0].start > 4:
                lines[lab_l == i] = False
        fg &= ~ndimage.binary_dilation(lines, iterations=1)
    # 패널 테두리 같은 가늘고 긴 선 제거 + 잡티 제거
    lab2, n = ndimage.label(fg)
    for i, sl in enumerate(ndimage.find_objects(lab2), start=1):
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = (lab2[sl] == i).sum()
        if area < 12 or (ww > 120 and hh < 8) or (hh > 50 and ww < 6):
            fg[lab2 == i] = False
    return fg


def split_frames(fg, expected):
    """덩어리 분리: 큰 덩어리 = 캐릭터, 작은 덩어리(이펙트)는 가장 가까운 캐릭터에 귀속."""
    grown = ndimage.binary_dilation(fg, iterations=3)
    lab, n = ndimage.label(grown)
    # 프레임 수가 모자라면: 이펙트로 이웃과 붙은 덩어리(중앙값 폭 1.6배 초과)를 가운데 가장 빈 열에서 절단
    widths = [sl[1].stop - sl[1].start for sl in ndimage.find_objects(lab)]
    pre_areas = [(fg & (lab == i + 1)).sum() for i in range(n)]
    pre_chars = sum(a >= max(pre_areas) * 0.3 for a in pre_areas) if n else 0
    if n and len(widths) >= 3 and pre_chars < expected:
        med = float(np.median(widths))
        cut = False
        for sl in ndimage.find_objects(lab):
            w = sl[1].stop - sl[1].start
            if w > med * 1.6:
                cols = fg[sl].sum(0)
                lo, hi = int(w * 0.3), int(w * 0.7)
                x = sl[1].start + lo + int(np.argmin(cols[lo:hi]))
                grown[sl[0], x - 2:x + 3] = False
                cut = True
        if cut:
            lab, n = ndimage.label(grown)
    objs = ndimage.find_objects(lab)
    areas = [(fg & (lab == i + 1)).sum() for i in range(n)]
    if n == 0:
        return []
    big_min = max(areas) * 0.3
    chars = [i for i in range(n) if areas[i] >= big_min]
    chars.sort(key=lambda i: objs[i][1].start)
    if len(chars) != expected:
        print(f'    ! 캐릭터 덩어리 {len(chars)}개 (예상 {expected})')
    frames = [[i] for i in chars]
    for i in range(n):
        if i in chars:
            continue
        cx = (objs[i][1].start + objs[i][1].stop) / 2
        def gap(k):
            sl = objs[chars[k]][1]
            return 0 if sl.start <= cx <= sl.stop else min(abs(cx - sl.start), abs(cx - sl.stop))

        best = min(range(len(chars)), key=gap)
        # 캐릭터에 붙은 이펙트만 포함 — 멀리 날아가는 투사체는 게임이 따로 그림
        if gap(best) < 20:
            frames[best].append(i)
    out = []
    for group in frames:
        main = (lab == group[0] + 1) & fg
        whole = np.isin(lab, [g + 1 for g in group]) & fg
        ys, xs = np.nonzero(main)
        top, bottom = ys.min(), ys.max()
        head = xs[ys < top + (bottom - top) * 0.35]  # 머리 중심 = 정렬 기준(무기·이펙트에 흔들리지 않게)
        out.append({'mask': whole, 'ax': float(np.median(head)), 'foot': int(bottom), 'top': int(top)})
    return out


def extract_sheet(cfg):
    rgb = np.asarray(Image.open(cfg['sheet']).convert('RGB'))
    x0, x1 = cfg['x']
    bands = detect_bands(rgb, x0, x1)
    rows = {}
    for state, row_idx, n in cfg['rows']:
        y0, y1 = bands[row_idx]
        pad = 6
        crop = rgb[max(0, y0 - pad):y1 + pad, x0:x1]
        fg = foreground(crop, cfg.get('thresh', 40), strip_lines=True)
        frames = split_frames(fg, n)
        for f in frames:
            f['rgb'] = crop
        rows[state] = frames
        print(f'  {state}: {len(frames)}프레임')

    # 모든 프레임이 잘리지 않는 공통 셀 크기 계산(기준점 = 머리 중심 x, 발바닥 y)
    left = right = up = down = 0
    for frames in rows.values():
        for f in frames:
            ys, xs = np.nonzero(f['mask'])
            left = max(left, f['ax'] - xs.min())
            right = max(right, xs.max() - f['ax'])
            up = max(up, f['foot'] - ys.min())
            down = max(down, ys.max() - f['foot'])
    fw, fh = int(math.ceil(left + right)) + 4, int(math.ceil(up + down)) + 4
    ax, foot = int(math.ceil(left)) + 2, int(math.ceil(up)) + 2
    cols = max(len(f) for f in rows.values())
    sheet = Image.new('RGBA', (fw * cols, fh * len(STATES)), (0, 0, 0, 0))
    anims = {}
    for r, state in enumerate(STATES):
        frames = rows.get(state, [])
        for c, f in enumerate(frames):
            ys, xs = np.nonzero(f['mask'])
            rgba = np.zeros((f['mask'].shape[0], f['mask'].shape[1], 4), np.uint8)
            rgba[..., :3] = f['rgb']
            rgba[..., 3] = f['mask'] * 255
            piece = Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
            ox = c * fw + ax - int(round(f['ax'])) + xs.min()
            oy = r * fh + foot - f['foot'] + ys.min()
            sheet.alpha_composite(piece, (ox, oy))
        if cfg.get('mirror'):  # 왼쪽을 보는 그림 → 칸마다 좌우 반전해 오른쪽 보게
            for c in range(len(frames)):
                box = (c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)
                sheet.paste(sheet.crop(box).transpose(Image.FLIP_LEFT_RIGHT), box[:2])
        if frames:
            anims[state] = {'frames': [r * cols + i for i in range(len(frames))], 'fps': cfg.get('fps', {}).get(state, 8)}
    idle_h = np.median([f['foot'] - f['top'] for f in rows['idle']])
    return sheet, {
        'frameWidth': fw,
        'frameHeight': fh,
        'scale': round(cfg['height'] / idle_h, 3),
        'footY': foot,
        'anims': anims,
        'ax': ax,
    }


def load_static(path, cfg):
    """정지 이미지 1장 → 배경 제거·잡조각 제거·여백 잘라낸 RGBA."""
    img = Image.open(path).convert('RGBA')
    if cfg.get('crop'):  # 갤러리 같은 큰 그림에서 영역만 [x0, y0, x1, y1]
        img = img.crop(tuple(cfg['crop']))
    arr = np.asarray(img).copy()
    if (arr[..., 3] == 255).all():  # 투명도 없는 그림(JPG 등) → 테두리 배경색 제거
        arr[..., 3] = foreground(arr[..., :3], cfg.get('thresh', 40), holes=cfg.get('holes', False)) * 255
    # 원본 자를 때 딸려 온 옆 그림 조각 제거 — 가장 큰 덩어리(+그 영역과 겹치는 조각)만 유지
    lab, n = ndimage.label(ndimage.binary_dilation(arr[..., 3] > 0, iterations=2))
    if n > 1:
        sizes = ndimage.sum(arr[..., 3] > 0, lab, range(1, n + 1))
        arr[..., 3][lab != int(np.argmax(sizes)) + 1] = 0
    ys, xs = np.nonzero(arr[..., 3])
    img = Image.fromarray(arr).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    if cfg.get('mirror'):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)  # 왼쪽을 보는 그림 → 오른쪽 보게
    return img


def extract_static(cfg):
    """image 1장, 또는 images 여러 장(기지 파손 단계 등) → 바닥 맞춘 가로 시트."""
    paths = cfg['images'] if 'images' in cfg else [cfg['image']]
    imgs = [load_static(p, cfg) for p in paths]
    w = max(i.width for i in imgs)
    h = max(i.height for i in imgs)
    sheet = Image.new('RGBA', (w * len(imgs), h), (0, 0, 0, 0))
    for k, im in enumerate(imgs):  # 가운데 정렬, 바닥(발)은 칸 아래에 맞춤
        sheet.alpha_composite(im, (k * w + (w - im.width) // 2, h - im.height))
    return sheet, {
        'frameWidth': w,
        'frameHeight': h,
        'scale': round(cfg['height'] / imgs[0].height, 3),  # 첫 장(멀쩡한 모습) 키 기준
        'footY': h,
        'anims': {'idle': {'frames': list(range(len(imgs))), 'fps': 1}},
        'ax': w // 2,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    cfg_path = sys.argv[1]
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    with open(cfg_path, encoding='utf-8') as fp:
        config = json.load(fp)
    base = os.path.dirname(os.path.abspath(cfg_path))
    os.makedirs(OUT_DIR, exist_ok=True)
    man_path = os.path.join(OUT_DIR, 'manifest.json')
    manifest = {}
    if os.path.exists(man_path):
        with open(man_path, encoding='utf-8') as fp:
            manifest = json.load(fp)

    previews = []
    for type_, c in config.items():
        if type_.startswith('_'):
            continue
        for k in ('sheet', 'image'):
            if k in c:
                c[k] = os.path.normpath(os.path.join(base, c[k]))
        if 'images' in c:
            c['images'] = [os.path.normpath(os.path.join(base, p)) for p in c['images']]
        print(f'{type_}:')
        img, meta = extract_sheet(c) if 'sheet' in c else extract_static(c)
        img.save(os.path.join(OUT_DIR, f'{type_}.png'), optimize=True)
        meta.pop('ax')
        manifest[type_] = {'file': f'{type_}.png', 'filter': 'linear', **meta}
        previews.append((type_, img, meta))
        print(f"  → {meta['frameWidth']}x{meta['frameHeight']} scale {meta['scale']}")

    with open(man_path, 'w', encoding='utf-8', newline='\n') as fp:
        fp.write(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

    if preview:  # 게임 표시 크기로 줄인 확인용 이미지(체크무늬 배경)
        tiles = []
        for type_, img, meta in previews:
            s = meta['scale']
            small = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)
            tiles.append(small)
        W = max(t.width for t in tiles) + 8
        H = sum(t.height + 8 for t in tiles)
        out = Image.new('RGBA', (W, H), (40, 44, 60, 255))
        y = 0
        for t in tiles:
            out.alpha_composite(t, (4, y + 4))
            y += t.height + 8
        out.save(preview)
        print(f'미리보기: {preview}')


if __name__ == '__main__':
    main()
