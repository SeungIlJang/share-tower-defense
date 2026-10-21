# 👾 기존 적 10종 리메이크 프롬프트

> 2026-10-21. ✅ 10장 모두 생성·게임 적용 완료(보스는 스킬 동작 포함, 원본 `images/image/enemies/remake` · 저장소 제외).

## 저장 위치 · 파일 이름 (영문)
`D:\AI\workspace\game\images\image\enemies\remake\Enemy_<키>.png` (예: `Enemy_goblin.png`)

## 팁
- **참고 이미지 2장 첨부**: ① 지금 그 적 그림(`share-tower-defense/public/sprites/<키>.png`) — 정체성 유지, ② 새 적 그림 아무거나(예: `images/image/enemies/Enemy_goblin_archer.png`) — 같은 화풍.
- 모두 **오른쪽을 보게**(게임이 왼쪽으로 뒤집음).
- 일반 적 8종 = 4줄(4·6·5·4), **보스 2종 = 5줄**(스킬 동작 추가: 골렘 땅 내려치기, 드래곤 화염 숨결).

## 목록
| 키 | 이름 | 줄 |
|---|---|---|
| `goblin` | 고블린 | 4줄 |
| `orc` | 오크 | 4줄 |
| `wolf` | 늑대 | 4줄 |
| `slime` | 슬라임 | 4줄 |
| `bat` | 박쥐 | 4줄 |
| `skeleton` | 해골 전사 | 4줄 |
| `mushroom` | 버섯 몬스터 | 4줄 |
| `ghost` | 유령 | 4줄 |
| `ogre` | 골렘 두목 (10관문 보스) | 5줄(스킬 포함) |
| `dragon` | 레드 드래곤 (20관문 보스) | 5줄(스킬 포함) |

---

### 고블린 → `Enemy_goblin.png`
```
Pixel art sprite sheet of a cute but sneaky green goblin with big pointy ears, a leather vest, a small wooden club and a mischievous grin, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (swinging the club)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 오크 → `Enemy_orc.png`
```
Pixel art sprite sheet of a sturdy green orc warrior with tusks, a red bandana, spiked shoulder pads, leather armor and a big rusty axe, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (heavy overhead axe chop)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 늑대 → `Enemy_wolf.png`
```
Pixel art sprite sheet of a fierce grey wolf with fluffy fur, glowing red eyes, sharp fangs and a scar over one eye, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (lunging bite)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 슬라임 → `Enemy_slime.png`
```
Pixel art sprite sheet of a cute round green slime with a shiny jelly body, big sparkly eyes and a little leaf on top, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (bouncing body slam)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 박쥐 → `Enemy_bat.png`
```
Pixel art sprite sheet of a cute purple bat with big wings, round glowing red eyes and tiny fangs, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (swooping bite)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 해골 전사 → `Enemy_skeleton.png`
```
Pixel art sprite sheet of a cute skeleton warrior with a rusty sword, a cracked round wooden shield and a dented iron helmet, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 버섯 몬스터 → `Enemy_mushroom.png`
```
Pixel art sprite sheet of a cute red-capped mushroom monster with white spots, a grumpy face and stubby legs, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (headbutt with a puff of spores)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 유령 → `Enemy_ghost.png`
```
Pixel art sprite sheet of a cute white ghost with a flowing wispy tail, big dark eyes and a soft blue glow, an ENEMY monster for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but cuter, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames
Row 2 Walk: 6 frames (moving forward to the right)
Row 3 Attack: 5 frames (lunging with a ghostly scream)
Row 4 Death: 4 frames (collapses and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 👑 골렘 두목 (10관문 보스) → `Enemy_ogre.png`
```
Pixel art sprite sheet of a huge stone golem boss made of mossy boulders, with glowing green eyes, small grass and flowers growing on its shoulders, and massive rock fists, a BOSS ENEMY for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but more impressive, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets. Big, heavy and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing, menacing)
Row 2 Walk: 6 frames (slow heavy steps forward to the right)
Row 3 Attack: 5 frames (basic melee attack)
Row 4 Skill: 4 frames (raising both fists and SLAMMING the ground with a shockwave and flying rocks)
Row 5 Death: 4 frames (collapses dramatically and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

### 👑 레드 드래곤 (20관문 보스) → `Enemy_dragon.png`
```
Pixel art sprite sheet of a big fearsome but cute red dragon boss with large bat wings, golden horns, a cream belly, glowing yellow eyes and smoke from its nostrils, a BOSS ENEMY for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). Remake of the attached reference with the SAME creature identity but more impressive, more polished and more detailed, in the same cute chibi fantasy style as the attached new enemy sheets. Big, heavy and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing, menacing)
Row 2 Walk: 6 frames (slow heavy steps forward to the right)
Row 3 Attack: 5 frames (basic melee attack)
Row 4 Skill: 4 frames (breathing a long stream of fire forward)
Row 5 Death: 4 frames (collapses dramatically and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```
