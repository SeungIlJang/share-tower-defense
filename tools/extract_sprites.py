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
ICON_SIZE = 64


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


def foreground(crop, thresh, strip_lines=False, holes=False, drop_thin=False):
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
        if area < 12 or (ww > 120 and hh < 8) or (hh > 50 and ww < 6) or (drop_thin and hh <= 3 and ww >= 8):
            fg[lab2 == i] = False
    return fg


def split_by_gaps(fg, expected):
    """빈 세로줄(간격)로 프레임 나누기 — 말에서 떨어진 기사·떨어진 이펙트도 한 프레임으로.
    조각이 예상보다 많으면 가장 좁은 간격부터 합쳐 expected 개로 맞춤(작은 먼지 조각은 가까운 프레임에 붙임). 정렬 기준은 가장 큰 덩어리(몸통)."""
    lab, n = ndimage.label(fg)
    if n == 0:
        return []
    areas = ndimage.sum(fg, lab, range(1, n + 1))
    clean = np.isin(lab, [i + 1 for i in range(n) if areas[i] >= 60])  # 먼지 같은 작은 점 제거
    cols = clean.any(0)
    segs, start = [], None
    for x, v in enumerate(np.append(cols, False)):
        if v and start is None:
            start = x
        elif not v and start is not None:
            segs.append([start, x])
            start = None
    mass = [int(clean[:, a:b].sum()) for a, b in segs]
    big_min = max(mass) * 0.15 if mass else 0
    big = [g for g, m in zip(segs, mass) if m >= big_min]  # 먼지·반짝이·옆 줄에서 넘어온 선은 프레임으로 세지 않음
    small = [g for g, m in zip(segs, mass) if m < big_min]
    segs = big or segs
    merged = [list(g) for g in segs]
    while len(merged) > expected:  # 가장 좁은 간격부터 합쳐서 개수 맞춤
        k = min(range(len(merged) - 1), key=lambda i: merged[i + 1][0] - merged[i][1])
        merged[k][1] = merged[k + 1][1]
        del merged[k + 1]
    for a, b in small:  # 작은 조각은 가장 가까운 프레임에 붙임
        k = min(range(len(merged)), key=lambda i: max(merged[i][0] - b, a - merged[i][1], 0))
        merged[k] = [min(merged[k][0], a), max(merged[k][1], b)]
    if len(merged) != expected:
        print(f'    ! 프레임 {len(merged)}개 (예상 {expected})')
    out = []
    for a, b in merged:
        whole = np.zeros_like(clean)
        whole[:, a:b] = clean[:, a:b]
        sub, m = ndimage.label(whole)
        sizes = ndimage.sum(whole, sub, range(1, m + 1))
        main = sub == int(np.argmax(sizes)) + 1
        ys, xs = np.nonzero(main)
        top, bottom = ys.min(), ys.max()
        head = xs[ys < top + (bottom - top) * 0.35]
        out.append({'mask': whole, 'ax': float(np.median(head)), 'foot': int(bottom), 'top': int(top)})
    return out


def split_frames(fg, expected):
    """덩어리 분리: 큰 덩어리 = 캐릭터, 작은 덩어리(이펙트)는 가장 가까운 캐릭터에 귀속."""
    grown = ndimage.binary_dilation(fg, iterations=3)
    lab, n = ndimage.label(grown)
    # 프레임 수가 모자라면: 이펙트·무기로 이웃과 붙은 가장 넓은 덩어리를 잘라 나눔(예상 수가 될 때까지)
    for _ in range(expected):
        if n == 0:
            break
        objs = ndimage.find_objects(lab)
        areas = [(fg & (lab == i + 1)).sum() for i in range(n)]
        chars = [i for i in range(n) if areas[i] >= max(areas) * 0.3]
        if len(chars) >= expected or len(chars) < 2:
            break
        widths = {i: objs[i][1].stop - objs[i][1].start for i in chars}
        widest = max(chars, key=lambda i: widths[i])
        if widths[widest] < np.median(list(widths.values())) * 1.3:
            break
        sl = objs[widest]
        cols = (fg[sl] & (lab[sl] == widest + 1)).sum(0)
        # 몸통 = 두꺼운 열 구간. 두 번째 몸통 바로 앞에서 자름(가는 창대·이펙트는 몸통으로 안 봄)
        body = cols > cols.max() * 0.35
        runs, start = [], None
        for x, v in enumerate(np.append(body, False)):
            if v and start is None:
                start = x
            elif not v and start is not None:
                if x - start >= 20:
                    runs.append((start, x))
                start = None
        if len(runs) >= 2:
            x = sl[1].start + runs[1][0] - 2
        else:
            w = widths[widest]
            lo, hi = int(w * 0.3), int(w * 0.7)
            x = sl[1].start + lo + int(np.argmin(cols[lo:hi]))
        grown[sl[0], x - 2:x + 3] = False
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
    src = Image.open(cfg['sheet'])
    rgb = np.asarray(src.convert('RGB')).copy()
    if 'A' in src.getbands():  # 투명 배경 시트 → 투명한 곳을 눈에 띄는 단색(마젠타)으로 칠해 배경으로 인식
        alpha = np.asarray(src.convert('RGBA'))[..., 3]
        rgb[alpha < cfg.get('alpha_min', 40)] = (255, 0, 255)
    for x0m, y0m, x1m, y1m in cfg.get('mask', []):  # 라벨 글자 등 프레임에 붙는 영역 → 배경색으로 지움
        rgb[y0m:y1m, x0m:x1m] = rgb[0, 0]
    x0, x1 = cfg['x']
    bands = [tuple(b) for b in cfg['bands']] if cfg.get('bands') else detect_bands(rgb, x0, x1)  # 행 간격이 좁으면 직접 지정
    rows = {}
    for row in cfg['rows']:
        state, row_idx, n = row[:3]
        keep = row[3] if len(row) > 3 else None  # 쓸 프레임 번호만(0부터) — 깨진 프레임 제외용
        y0, y1 = bands[row_idx]
        pad = 6
        crop = rgb[max(0, y0 - pad):y1 + pad, x0:x1]
        fg = foreground(crop, cfg.get('thresh', 40), strip_lines=cfg.get('strip_lines', True), drop_thin=cfg.get('drop_thin', False))
        frames = split_by_gaps(fg, n) if cfg.get('split') == 'gaps' else split_frames(fg, n)  # 'gaps' = 빈 세로줄로 나누기
        if keep is not None and len(frames) == n:
            frames = [frames[k] for k in keep]
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
    states = STATES + (['skill'] if 'skill' in rows else [])  # 스킬 동작 줄은 있을 때만(기존 시트 모양 그대로)
    sheet = Image.new('RGBA', (fw * cols, fh * len(states)), (0, 0, 0, 0))
    anims = {}
    for r, state in enumerate(states):
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


def load_static(path, cfg, crop=None):
    """정지 이미지 1장 → 배경 제거·잡조각 제거·여백 잘라낸 RGBA + 잘라낸 왼쪽 위치(원본 좌표)."""
    img = Image.open(path).convert('RGBA')
    x0 = 0
    crop = crop or cfg.get('crop')
    if crop:  # 갤러리 같은 큰 그림에서 영역만 [x0, y0, x1, y1]
        img = img.crop(tuple(crop))
        x0 = crop[0]
    arr = np.asarray(img).copy()
    if cfg.get('alpha_min'):  # 거의 투명한 배경(알파 1~2 등) 제거
        arr[..., 3][arr[..., 3] < cfg['alpha_min']] = 0
    if (arr[..., 3] == 255).all():  # 투명도 없는 그림(JPG 등) → 테두리 배경색 제거
        arr[..., 3] = foreground(arr[..., :3], cfg.get('thresh', 40), holes=cfg.get('holes', False)) * 255
    if not cfg.get('keep_all'):
        # 원본 자를 때 딸려 온 옆 그림 조각 제거 — 가장 큰 덩어리(+그 영역과 겹치는 조각)만 유지
        lab, n = ndimage.label(ndimage.binary_dilation(arr[..., 3] > 0, iterations=2))
        if n > 1:
            sizes = ndimage.sum(arr[..., 3] > 0, lab, range(1, n + 1))
            arr[..., 3][lab != int(np.argmax(sizes)) + 1] = 0
    ys, xs = np.nonzero(arr[..., 3])
    img = Image.fromarray(arr).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    left = x0 + int(xs.min())
    if cfg.get('mirror'):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)  # 왼쪽을 보는 그림 → 오른쪽 보게
    return img, left


def extract_static(cfg):
    """
    image 1장 / images 여러 장 / image + crops 여러 영역(한 시트에 그린 파손 단계 등) → 바닥 맞춘 가로 시트.
    anchors(원본 x좌표, 프레임별)를 주면 그 점끼리 세로로 맞춤(문·횃불처럼 단계마다 같은 자리) — 없으면 가운데 정렬.
    """
    if 'crops' in cfg:
        loaded = [load_static(cfg['image'], cfg, c) for c in cfg['crops']]
    else:
        paths = cfg['images'] if 'images' in cfg else [cfg['image']]
        loaded = [load_static(p, cfg) for p in paths]
    imgs = [im for im, _ in loaded]
    for k in cfg.get('flip', []):  # 방향이 섞인 포즈 → 해당 프레임만 좌우 반전
        imgs[k] = imgs[k].transpose(Image.FLIP_LEFT_RIGHT)
    h = max(i.height for i in imgs)
    if cfg.get('anchors'):
        rel = [a - left for a, (_, left) in zip(cfg['anchors'], loaded)]
        if cfg.get('mirror'):
            rel = [im.width - 1 - r for im, r in zip(imgs, rel)]
        lpad = max(rel)
        w = lpad + max(im.width - r for im, r in zip(imgs, rel))
        xs = [lpad - r for r in rel]
    else:
        w = max(i.width for i in imgs)
        xs = [(w - im.width) // 2 for im in imgs]
    scale = cfg['height'] / imgs[0].height  # 첫 장(멀쩡한 모습) 키 기준
    # resolution: 게임 표시 크기의 몇 배로 저장할지(예: 2) — 큰 원본을 미리 줄여 용량 절약
    f = min(1.0, scale * cfg['resolution']) if cfg.get('resolution') else 1.0
    cw, ch = max(1, round(w * f)), max(1, round(h * f))
    sheet = Image.new('RGBA', (cw * len(imgs), ch), (0, 0, 0, 0))
    for k, (im, x) in enumerate(zip(imgs, xs)):  # 바닥(발)은 칸 아래에 맞춤
        cell = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        cell.alpha_composite(im, (x, (h - im.height) // 2 if cfg.get('center') else h - im.height))
        if f < 1.0:
            cell = cell.resize((cw, ch), Image.LANCZOS)
        sheet.alpha_composite(cell, (k * cw, 0))
    return sheet, {
        'frameWidth': cw,
        'frameHeight': ch,
        'scale': round(scale / f, 3),
        'footY': ch,
        # anims: {"idle": [0, 1], "walk": [...]} — 프레임 번호를 동작에 배정(없으면 전부 idle 1fps)
        'anims': {k: {'frames': v, 'fps': cfg.get('fps', {}).get(k, 6)} for k, v in cfg['anims'].items()}
        if cfg.get('anims')
        else {'idle': {'frames': list(range(len(imgs))), 'fps': 1}},
        'ax': w // 2,
    }


def rescale_sheet(img, meta, resolution):
    """애니메이션 시트를 '게임 표시 크기 × resolution'으로 칸 단위 축소(칸 격자 유지)."""
    f = min(1.0, meta['scale'] * resolution)
    if f >= 1.0:
        return img, meta
    fw, fh = meta['frameWidth'], meta['frameHeight']
    cols, rows = img.width // fw, img.height // fh
    cw, ch = max(1, round(fw * f)), max(1, round(fh * f))
    out = Image.new('RGBA', (cw * cols, ch * rows), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            cell = img.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)).resize((cw, ch), Image.LANCZOS)
            out.alpha_composite(cell, (c * cw, r * ch))
    meta = {**meta, 'frameWidth': cw, 'frameHeight': ch, 'footY': round(meta['footY'] * ch / fh),
            'scale': round(meta['scale'] * fh / ch, 3)}
    return out, meta


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
    # extends: 같은 배치의 다른 그림(전설 스킨 등) — 원래 항목 설정을 그대로 쓰고 그림만 바꿈.
    # 얼굴 아이콘은 원래 초상화가 아니라 새 시트 첫 프레임에서 자동으로(icon_auto)
    raw = json.loads(json.dumps(config))
    for type_, c in config.items():
        if isinstance(c, dict) and c.get('extends'):
            merged = json.loads(json.dumps(raw[c['extends']]))
            merged.pop('icon', None)
            merged['icon_auto'] = True
            merged.update({k: v for k, v in c.items() if k != 'extends'})
            config[type_] = merged

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
        if 'sheet' in c and c.get('resolution'):
            img, meta = rescale_sheet(img, meta, c['resolution'])
        out = img
        if c.get('palette'):  # 256색 팔레트 PNG — 큰 그림 용량 대폭 절감(눈으로 구분 안 됨)
            out = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        out.save(os.path.join(OUT_DIR, f'{type_}.png'), optimize=True)
        meta.pop('ax')
        if c.get('icon'):  # HUD 슬롯용 얼굴 아이콘(64px) — 큰 초상화에서 얼굴 영역만
            ic = c['icon']
            face = Image.open(os.path.normpath(os.path.join(base, ic['image']))).convert('RGBA').crop(tuple(ic['box']))
            arr = np.asarray(face).copy()
            if c.get('alpha_min'):
                arr[..., 3][arr[..., 3] < c['alpha_min']] = 0
            if (arr[..., 3] == 255).all():  # 불투명 배경(시트 남색 등) 제거
                arr[..., 3] = foreground(arr[..., :3], 40) * 255
            Image.fromarray(arr).resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS).save(
                os.path.join(OUT_DIR, f'icon_{type_}.png'), optimize=True)
            meta['icon'] = f'icon_{type_}.png'
        if c.get('icon_auto') and not c.get('icon'):  # 첫 프레임 머리 부분으로 얼굴 아이콘
            fw, fh = meta['frameWidth'], meta['frameHeight']
            cell = np.asarray(img.convert('RGBA').crop((0, 0, fw, fh)))
            ys, xs = np.nonzero(cell[..., 3] > 40)
            if len(xs):
                top, cx = ys.min(), int(np.median(xs[ys < ys.min() + (ys.max() - ys.min()) * 0.4]))
                side = int((ys.max() - top) * 0.55)
                box = (cx - side // 2, top, cx - side // 2 + side, top + side)
                Image.fromarray(cell).crop(box).resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS).save(
                    os.path.join(OUT_DIR, f'icon_{type_}.png'), optimize=True)
                meta['icon'] = f'icon_{type_}.png'
        # 확대해서 쓰는 작은 그림은 nearest(도트 선명), 축소는 linear
        manifest[type_] = {'file': f'{type_}.png', 'filter': c.get('filter', 'nearest' if meta['scale'] >= 1 else 'linear'), **meta}
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
