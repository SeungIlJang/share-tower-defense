"""
효과음 WAV → OGG(Vorbis) 압축본 만들기 — 첫 실행 다운로드 줄이기(WAV는 그대로 두고 OGG를 먼저 받음, 못 쓰는 기기는 WAV).
대상: public/audio/*.wav, public/effects/audio/*.wav
실행: python tools/wav_to_ogg.py   (pip install soundfile)
"""
import glob
import os
import sys

import soundfile as sf

sys.stdout.reconfigure(encoding='utf-8')
before = after = 0
for path in sorted(glob.glob('public/audio/*.wav') + glob.glob('public/effects/audio/*.wav')):
    data, sr = sf.read(path, always_2d=False)
    out = os.path.splitext(path)[0] + '.ogg'
    sf.write(out, data, sr, format='OGG', subtype='VORBIS')
    a, b = os.path.getsize(path), os.path.getsize(out)
    before += a
    after += b
    print(f'{os.path.basename(path):24s} {a // 1024:5d}KB → {b // 1024:4d}KB')
print(f'합계 {before // 1024}KB → {after // 1024}KB')
