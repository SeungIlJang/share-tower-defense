"""
새 효과음 합성(외부 샘플 없음) → public/audio/*.wav (22,050Hz · 모노 · 16-bit)
- boss     : 👑 보스 등장 — 낮은 북 두 번 + 묵직한 뿔피리
- evolve   : ⭐ 진화·랭크업 — 올라가는 반짝 아르페지오 + 종소리
- collapse : 🏰 적 성 무너짐 — 우르르 무너지는 소리 + 돌 부서짐
- cutin    : ✨ 필살 컷인 — 휙 지나가는 바람 + 반짝
실행: python tools/synth_sfx.py
"""
import os
import wave

import numpy as np

SR = 22050
OUT = 'public/audio'
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, a=0.01, r=0.3):
    """빠른 시작 · 지수 감쇠"""
    x = np.arange(n) / SR
    att = np.clip(x / max(a, 1e-4), 0, 1)
    return att * np.exp(-x / max(r, 1e-4))


def place(buf, sig, at):
    i = int(SR * at)
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[: end - i]


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode='same')


def save(name, x, peak=0.68):
    x = x - np.mean(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    fade = min(len(x), int(SR * 0.02))
    x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(os.path.join(OUT, f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


def drum(f0=70, dur=0.5):
    tt = t(dur)
    f = f0 * (1 + 1.5 * np.exp(-tt * 18))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(len(tt), 0.003, 0.18) + lowpass(rng.normal(0, 1, len(tt)), 6) * env(len(tt), 0.001, 0.03) * 0.4


def boss():
    buf = np.zeros(int(SR * 1.6))
    place(buf, drum(62), 0.0)
    place(buf, drum(58), 0.28)
    tt = t(1.1)
    horn = sum(np.sin(2 * np.pi * 110 * k * tt * (1 + 0.004 * np.sin(2 * np.pi * 5 * tt))) / k for k in (1, 2, 3, 4))
    horn += 0.6 * sum(np.sin(2 * np.pi * 146.8 * k * tt) / k for k in (1, 2, 3))
    horn *= np.clip(tt / 0.12, 0, 1) * np.exp(-np.maximum(0, tt - 0.6) * 4)
    place(buf, lowpass(horn, 3) * 0.55, 0.42)
    save('boss', buf)


def evolve():
    buf = np.zeros(int(SR * 1.3))
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    for i, f in enumerate(notes):
        tt = t(0.35)
        tone = np.sign(np.sin(2 * np.pi * f * tt)) * 0.35 + np.sin(2 * np.pi * f * tt)
        place(buf, tone * env(len(tt), 0.004, 0.12) * 0.5, i * 0.07)
    tt = t(0.9)
    bell = sum(np.sin(2 * np.pi * 1046.5 * m * tt) * a for m, a in ((1, 1), (2.76, 0.4), (5.4, 0.2)))
    place(buf, bell * env(len(tt), 0.002, 0.35) * 0.7, 0.36)
    sparkle = np.zeros(len(buf))
    for _ in range(14):
        tt = t(0.08)
        f = rng.uniform(2500, 4200)
        place(sparkle, np.sin(2 * np.pi * f * tt) * env(len(tt), 0.001, 0.03), rng.uniform(0.3, 1.1))
    save('evolve', buf + sparkle * 0.25)


def collapse():
    buf = np.zeros(int(SR * 1.8))
    tt = t(1.7)
    rumble = lowpass(rng.normal(0, 1, len(tt)), 40) * 6
    rumble += np.sin(2 * np.pi * 42 * tt) * 0.5
    rumble *= np.clip(tt / 0.05, 0, 1) * np.exp(-tt * 1.6)
    place(buf, rumble, 0.0)
    for _ in range(18):
        at = rng.uniform(0.05, 1.3)
        d = drum(rng.uniform(90, 180), 0.25) * rng.uniform(0.25, 0.6)
        place(buf, d, at)
        tt = t(0.06)
        place(buf, lowpass(rng.normal(0, 1, len(tt)), 2) * env(len(tt), 0.001, 0.02) * rng.uniform(0.2, 0.4), at)
    place(buf, drum(48, 0.7) * 1.2, 0.0)
    save('collapse', buf)


def cutin():
    buf = np.zeros(int(SR * 0.7))
    tt = t(0.45)
    noise = rng.normal(0, 1, len(tt))
    k = np.linspace(14, 2, len(tt)).astype(int)
    whoosh = np.array([noise[max(0, i - kk):i + 1].mean() for i, kk in enumerate(k)])
    whoosh *= np.sin(np.pi * np.clip(tt / 0.45, 0, 1)) * 2.2
    place(buf, whoosh, 0.0)
    for i, f in enumerate((1568, 2093)):
        tt = t(0.3)
        place(buf, np.sin(2 * np.pi * f * tt) * env(len(tt), 0.002, 0.09) * 0.5, 0.22 + i * 0.06)
    save('cutin', buf)


if __name__ == '__main__':
    boss()
    evolve()
    collapse()
    cutin()
