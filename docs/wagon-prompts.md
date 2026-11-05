# 🛒 마차 호위 관문 — 짐마차 그림 (Codex 전달용)

> 2026-11-06. 지금은 코드로 그린 도형(베이지 타원 + 바퀴 2개 + 빨간 깃발)이라 픽셀아트 전장에서 혼자 어색함.
> 그림이 오면 `tools/extract_grid.py`로 잘라 `public/sprites/wagon.png`로 넣고, `Battle.ts`의 `setupRule`에서 도형 대신 씀.

## 어디에 나오나
- 각 월드 3번째 관문(13·23·…·93관문) "🛒 마차 호위".
- 우리 성 앞에서 출발해 적 성 쪽으로 **천천히 굴러감**(유닛보다 느림). 앞에 적이 있으면 멈춤. 적에게 맞으면 체력이 깎이고, 0이 되면 부서짐(패배).
- 전장 바닥에 서는 크기는 **유닛보다 조금 큼**(유닛 키의 약 1.3배, 가로는 2배쯤).

## 만드는 그림
| 파일 | 내용 | 저장 위치 |
|---|---|---|
| `Wagon_supply.png` | 짐마차 시트 1장(4줄) | `D:\AI\workspace\game\images\image\escort\` |

## 같은 그림체로 보이게 하는 팁
- **참고 이미지 첨부:** `share-tower-defense/public/sprites/cavalry.png`(말 그림체), `soldier.png`(유닛 크기·선 굵기), `images/image/backgrounds/BG_forest.png`(배경 색감).
- 배치는 🗿 설치물 시트와 **같은 방식**(줄마다 프레임, 남색 배경 #1a2133, 오른쪽을 봄, 모든 프레임 같은 크기·같은 바닥선) — 그래야 자르는 도구가 그대로 씀.
- 마차는 **우리 편**이라 우리 성과 같은 파랑·금색 포인트(깃발·장식)를 쓰면 한눈에 아군으로 보임.

---

### 🛒 짐마차 → `Wagon_supply.png`
```
Pixel art sprite sheet of a cute small covered supply wagon pulled by a chubby little pony, for a 2D side-scrolling tower defense game, facing RIGHT (the pony is on the right, in front, pulling to the right). The wagon has a round cream canvas cover, a sturdy wooden body with gold trim, two big wooden wheels, stacked supply crates and sacks peeking out the back, and a small BLUE pennant flag with a gold star on a pole at the back (ally colors, matching a blue-roofed friendly castle). The pony is round and friendly with a brown coat, cream mane and a tiny blue saddle blanket. Same cute chibi fantasy pixel style as the attached reference units (same outline thickness and shading).

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame (wheels and hooves touching the same baseline):
Row 1 Idle: 4 frames (stopped, pony breathing and blinking, flag gently waving)
Row 2 Move: 6 frames (pony trotting, wheels turning, wagon bouncing slightly, moving right)
Row 3 Hit: 4 frames (wagon shakes when struck, a few wood splinters fly, pony flinches)
Row 4 Destroyed: 5 frames (a wheel breaks off, the wagon tilts and collapses, crates spill, a puff of dust and smoke; the pony runs off to the left and is gone by the last frame)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, soft shading. Overall size per frame: about twice as wide as tall. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### (다른 안) 조랑말 없이 → `Wagon_supply.png`
조랑말이 어색하면 이걸로. 마차가 스스로 굴러가는 대신 **작은 병사 둘이 뒤에서 밀고 가는** 모습.
```
Pixel art sprite sheet of a cute small covered supply wagon pushed from behind by two tiny chibi soldiers in blue tunics, for a 2D side-scrolling tower defense game, facing RIGHT (moving to the right; the soldiers are at the LEFT end pushing). Round cream canvas cover, wooden body with gold trim, two big wooden wheels, supply crates and sacks, a small BLUE pennant flag with a gold star. Same cute chibi fantasy pixel style as the attached reference units.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (stopped, soldiers wiping sweat, flag waving)
Row 2 Move: 6 frames (soldiers pushing hard, wheels turning, moving right)
Row 3 Hit: 4 frames (wagon shakes when struck, splinters fly, soldiers duck)
Row 4 Destroyed: 5 frames (a wheel breaks off, wagon collapses, crates spill, dust and smoke; the soldiers run off to the left)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, soft shading. About twice as wide as tall. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 받은 뒤 (Claude 담당)
- `extract_grid.py`에 `wagon` 등록(4줄: idle 4 · walk 6 · hit 4 · death 5) → `public/sprites/wagon.png` + `manifest.json`.
- `Battle.ts` `setupRule`: 도형 대신 스프라이트(멈추면 Idle, 움직이면 Move, 맞으면 Hit, 0이 되면 Destroyed).
- 그림이 늦게 받아져도 되도록 마차 호위 관문 전투에서만 받음(첫 로딩 영향 없음).
