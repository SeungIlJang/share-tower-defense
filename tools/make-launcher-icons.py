#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""모두의 타워디펜스 적응형 런처 아이콘 생성기.

왜 필요한가: android/app/src/main/res/mipmap-*/ic_launcher_foreground.png 가
Capacitor 기본 플레이스홀더(연한 하늘색 도형 + 흰 바탕)로 남아 있었다.
안드로이드 8.0부터는 mipmap-anydpi-v26/ic_launcher.xml(적응형)이 쓰이므로
사실상 모든 폰에서 이 플레이스홀더가 보였다. 레거시 ic_launcher.png 만
진짜 아트였는데 그건 안드로이드 7.1 이하에서만 쓰인다.

설계:
  배경 = icon-512 의 네이비 그라데이션을 108dp 전체로 재구성(알파 없음)
  전경 = icon-512 디자인을 원형으로 페더링해서 올림(알파 있음 → lint 경고 회피)
         배경과 같은 네이비라 이음새가 보이지 않는다.
안전영역: 108dp 중 지름 66dp '원'. 사각형이 아니라 원이다 — 사각형에 맞추면
          원형 마스크에서 모서리가 잘린다.
"""
import sys, math
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else None
MODE = sys.argv[3] if len(sys.argv) > 3 else 'B'   # A=108dp 꽉참(확대), B=72dp 가시영역에 맞춤

DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}

src = Image.open(SRC).convert('RGB')


def gradient(size):
    """icon-512 의 중앙색→모서리색 방사형 그라데이션을 재구성한다."""
    s = src.resize((64, 64), Image.LANCZOS).load()
    center = tuple(sum(s[x, y][i] for x in range(28, 36) for y in range(2, 8)) // 64 for i in range(3))
    corner = tuple(sum(s[x, y][i] for x, y in [(1, 1), (62, 1), (1, 62), (62, 62)]) // 4 for i in range(3))
    img = Image.new('RGB', (size, size))
    px = img.load()
    half = size / 2
    maxd = math.hypot(half, half)
    for y in range(size):
        for x in range(size):
            t = min(1.0, math.hypot(x - half, y - half) / maxd)
            t = t ** 0.85
            px[x, y] = tuple(int(center[i] + (corner[i] - center[i]) * t) for i in range(3))
    return img


# icon-512 안에서 방패는 중심이 (256,192)라 이미지 중심보다 64px 위에 있다.
# 그 구도 그대로 108dp 에 채우면 방패 윗꼭지가 안전영역(반지름 33dp) 경계에 닿는다.
# 그래서 방패 중심이 캔버스 중심에 오도록 아래로 내린다. 빛줄기는 그만큼
# 내려가지만 가시영역(18~90dp) 안에 남는다.
# 64/512 면 방패가 정확히 중앙에 오지만 빛줄기가 아래 테두리에 끼인다.
# 절반(32/512)이 방패 여유와 빛줄기 위치를 둘 다 만족한다.
SHIFT_RATIO = float(sys.argv[4]) / 512 if len(sys.argv) > 4 else 32 / 512


def foreground(size):
    """디자인을 원형 페더 마스크로 올린 전경."""
    # A: 디자인을 108dp 전체에 → 가시영역엔 중앙 2/3 만 보임(방패가 커짐, 빛줄기는 잘림)
    # B: 디자인을 72dp 가시영역에 → 스토어 아이콘과 같은 구도(런처에선 너무 작다)
    # C: A + 방패를 안전영역 중앙으로 내림
    span = size if MODE in ('A', 'C') else int(size * 72 / 108)
    art = src.resize((span, span), Image.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    off = (size - span) // 2
    dy = int(span * SHIFT_RATIO) if MODE == 'C' else 0
    canvas.paste(art, (off, off + dy))

    # 원형 페더: 배경 그라데이션과 같은 색이라 경계가 보이지 않는다
    r = size * 72 / 108 / 2 if MODE == 'A' else span / 2
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse(
        (size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(1, size // 72)))
    canvas.putalpha(Image.composite(canvas.getchannel('A'), Image.new('L', (size, size), 0), mask)
                    if False else mask)
    return canvas


def legacy(size, round_=False):
    img = src.resize((size, size), Image.LANCZOS).convert('RGBA')
    if round_:
        m = Image.new('L', (size, size), 0)
        ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), m)
        return out
    return img.convert('RGB')


def preview():
    """런처가 실제로 보여주는 모습(원형/스퀘어클 마스크)."""
    S = 432
    bg = gradient(S).convert('RGBA')
    bg.alpha_composite(foreground(S))
    vis = bg.crop((S // 6, S // 6, S - S // 6, S - S // 6)).resize((256, 256), Image.LANCZOS)
    outs = []
    for shape in ('circle', 'squircle'):
        m = Image.new('L', (256, 256), 0)
        d = ImageDraw.Draw(m)
        if shape == 'circle':
            d.ellipse((0, 0, 255, 255), fill=255)
        else:
            d.rounded_rectangle((0, 0, 255, 255), radius=72, fill=255)
        o = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        o.paste(vis, (0, 0), m)
        outs.append(o)
    return outs


if OUT == 'preview':
    import os
    outs = preview()
    canvas = Image.new('RGB', (256 * 2 + 48, 256 + 32), '#1B1B1B')
    for i, o in enumerate(outs):
        canvas.paste(o, (16 + i * (256 + 16), 16), o)
    p = f'D:/AI/workspace/game/.td-icon/preview-{MODE}.png'
    canvas.save(p)
    print(p)
else:
    import os
    for d, m in DENSITIES.items():
        base = os.path.join(OUT, f'mipmap-{d}')
        os.makedirs(base, exist_ok=True)
        fg_size = int(108 * m)
        lg_size = int(48 * m)
        foreground(fg_size).save(os.path.join(base, 'ic_launcher_foreground.png'))
        legacy(lg_size).save(os.path.join(base, 'ic_launcher.png'))
        legacy(lg_size, True).save(os.path.join(base, 'ic_launcher_round.png'))
        # 전경이 원형 페더라 배경도 같은 그라데이션이어야 이음새가 안 보인다.
        # 단색을 쓰면 페더 경계에 링이 생긴다.
        gradient(fg_size).save(os.path.join(base, 'ic_launcher_bg.png'))
        print(f'{d}: foreground {fg_size}px, bg {fg_size}px, legacy {lg_size}px')
