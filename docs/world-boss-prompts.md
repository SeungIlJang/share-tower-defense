# 👑 월드 보스 8종 프롬프트 (월드 3~10)

> 2026-10-22. ✅ 8장 모두 생성·게임 적용 완료(`src/systems/bosses.ts`, 원본 `images/image/enemies/bosses` · 저장소 제외).
> 월드 1·2는 지금처럼 골렘 두목·레드 드래곤. 월드 3~10은 **10번째 관문(30·40·…·100)에 그 월드 전용 보스**,
> 5번째 관문(25·35·…)에는 앞 월드 보스가 중간 보스로 나옴(그림이 들어오면 자동 적용, 그 전엔 골렘·드래곤).

## 보스 목록 · 스킬 설계
| 월드 | 보스 | 키 | 스킬(경고 구역 후 발동) |
|---|---|---|---|
| 3 ❄️ 얼음 설원 | 서리 거인 | `frost_giant` | ❄️ 얼음 땅 내려치기 — 범위 피해 + 아군 2초 빙결 |
| 4 🌿 독 늪지 | 늪 히드라 | `swamp_hydra` | 🧪 독 숨결 — 넓은 범위 독 피해(지속) |
| 5 🌋 화산 지대 | 용암 거인 | `magma_titan` | 🌋 용암 분출 — 앞쪽에 불기둥 3개 |
| 6 🪦 망자의 묘지 | 리치 왕 | `lich_king` | 💀 해골 부활 — 해골 전사 4마리 소환 |
| 7 💎 수정 동굴 | 수정 골렘 | `crystal_golem` | 💎 수정 파편 — 앞쪽 일직선 관통 피해 |
| 8 ☁️ 하늘 섬 | 폭풍 그리폰 | `storm_griffin` | ⚡ 번개 돌진 — 앞으로 돌진하며 경로 피해 |
| 9 🌑 그림자 숲 | 그림자 군주 | `shadow_lord` | 🌑 암흑 장막 — 영웅·유닛 공격력 3초 감소 + 피해 |
| 10 👹 마왕의 땅 | 마왕 | `demon_king` | 🔥 지옥불 — 화면 절반 화염 + 부하 소환(최종 보스) |

## 저장 위치 · 파일 이름 (영문)
`D:\AI\workspace\game\images\image\enemies\bosses\Boss_<키>.png` (예: `Boss_frost_giant.png`)

## 팁
- **참고 이미지 2장 첨부**: 리메이크한 보스(`images/image/enemies/remake/Enemy_ogre.png` 또는 `Enemy_dragon.png`) — 화풍·크기, 그리고 새 적 하나(같은 월드 테마 적, 예: 설원이면 `Enemy_ice_golem.png`).
- 모두 **오른쪽을 보게**(게임이 왼쪽으로 뒤집음), **5줄**(대기 4 · 걷기 6 · 공격 5 · 스킬 4 · 쓰러짐 4).

---

### ❄️ 서리 거인 → `Boss_frost_giant.png`
```
Pixel art sprite sheet of a huge frost giant BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A massive chibi ice giant with pale blue skin, a long white frosty beard, a crown of jagged ice crystals, fur shoulder pelt, and a giant ice club. Same cute chibi fantasy pixel style as the attached reference bosses. Big, heavy and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing frosty mist)
Row 2 Walk: 6 frames (slow heavy steps forward to the right)
Row 3 Attack: 5 frames (ice club swing)
Row 4 Skill: 4 frames (raising the club and SLAMMING the ground, ice spikes and frost shockwave burst out)
Row 5 Death: 4 frames (cracks and shatters into ice chunks)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🌿 늪 히드라 → `Boss_swamp_hydra.png`
```
Pixel art sprite sheet of a three-headed swamp hydra BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A big chibi serpent dragon with three cute but menacing heads, mossy green scales, a purple-spotted belly, dripping toxic slime and lily pads on its back. Same cute chibi fantasy pixel style as the attached reference bosses. Big and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (heads swaying)
Row 2 Walk: 6 frames (slithering forward to the right)
Row 3 Attack: 5 frames (one head lunging to bite)
Row 4 Skill: 4 frames (all three heads breathing a big green poison cloud forward)
Row 5 Death: 4 frames (heads droop, collapses into the swamp and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive faces, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🌋 용암 거인 → `Boss_magma_titan.png`
```
Pixel art sprite sheet of a towering magma titan BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A huge chibi giant made of black volcanic rock with glowing orange lava veins, a burning flame mane, molten fists dripping magma, and embers floating around. Same cute chibi fantasy pixel style as the attached reference bosses. Big and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (lava pulsing, embers rising)
Row 2 Walk: 6 frames (heavy steps forward to the right leaving lava drips)
Row 3 Attack: 5 frames (molten fist punch)
Row 4 Skill: 4 frames (roaring with arms raised, lava eruptions bursting from the ground in front)
Row 5 Death: 4 frames (cools and crumbles into black rock with smoke)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🪦 리치 왕 → `Boss_lich_king.png`
```
Pixel art sprite sheet of an undead lich king BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A tall chibi skeletal sorcerer king in a tattered royal purple-and-black robe, a jagged dark iron crown, glowing green eye flames, a long staff topped with a green soul crystal, and floating ghost wisps. Same cute chibi fantasy pixel style as the attached reference bosses. Intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (hovering slightly, robe flowing)
Row 2 Walk: 6 frames (gliding forward to the right)
Row 3 Attack: 5 frames (staff swing with a green soul bolt)
Row 4 Skill: 4 frames (raising the staff, green magic circle on the ground, skeleton hands rising from the earth)
Row 5 Death: 4 frames (crown falls, body crumbles into bones and green smoke)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 💎 수정 골렘 → `Boss_crystal_golem.png`
```
Pixel art sprite sheet of a giant crystal golem BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A huge chibi golem made of dark cave stone with large glowing purple and cyan crystals growing from its shoulders, back and fists, a single bright crystal eye. Same cute chibi fantasy pixel style as the attached reference bosses. Big and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (crystals glowing and pulsing)
Row 2 Walk: 6 frames (heavy steps forward to the right)
Row 3 Attack: 5 frames (crystal fist punch)
Row 4 Skill: 4 frames (crystals flare, shooting a line of sharp crystal shards forward)
Row 5 Death: 4 frames (shatters into crystal fragments and stones)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ☁️ 폭풍 그리폰 → `Boss_storm_griffin.png`
```
Pixel art sprite sheet of a storm griffin BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A big chibi griffin with a white eagle head, golden lion body, huge blue-and-white wings crackling with small lightning, sharp talons and glowing yellow eyes. Same cute chibi fantasy pixel style as the attached reference bosses. Majestic and intimidating, but still cute. Stays on the ground line (wings may rise above).

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (wings flexing, sparks)
Row 2 Walk: 6 frames (prowling forward to the right)
Row 3 Attack: 5 frames (talon slash)
Row 4 Skill: 4 frames (wings spread, charging forward wrapped in lightning)
Row 5 Death: 4 frames (crashes down, feathers scatter, lightning fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🌑 그림자 군주 → `Boss_shadow_lord.png`
```
Pixel art sprite sheet of a shadow lord BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A tall chibi dark knight made of living shadow, wearing black thorny armor with violet glowing cracks, a flowing smoky cape, a horned helmet with glowing violet eyes, and a huge shadow greatsword. Same cute chibi fantasy pixel style as the attached reference bosses. Menacing, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (shadow smoke drifting)
Row 2 Walk: 6 frames (striding forward to the right, cape trailing smoke)
Row 3 Attack: 5 frames (greatsword slash)
Row 4 Skill: 4 frames (raising the sword, a wave of darkness spreads forward)
Row 5 Death: 4 frames (dissolves into black smoke, armor falls)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 👹 마왕 (최종 보스) → `Boss_demon_king.png`
```
Pixel art sprite sheet of the demon king, the FINAL BOSS of a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A huge chibi demon lord with crimson skin, large curved black horns, a golden crown, black-and-gold armor, a flowing red cape, bat-like demon wings, a flaming trident and a hellfire aura with floating embers. Same cute chibi fantasy pixel style as the attached reference bosses. The most impressive and intimidating boss, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (wings flexing, flames flickering)
Row 2 Walk: 6 frames (slow powerful steps forward to the right)
Row 3 Attack: 5 frames (flaming trident thrust)
Row 4 Skill: 4 frames (raising the trident, a huge wall of hellfire bursts forward)
Row 5 Death: 4 frames (crown falls, kneels, bursts into fire and fades)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 🌳 추가: 월드 1 보스 (10관문) — 5관문 골렘 두목과 겹치지 않게

| 관문 | 지금 | 바꾼 뒤 |
|---|---|---|
| 5 | 🗿 골렘 두목 | 🗿 골렘 두목 (중간 보스, 그대로) |
| 10 | 🗿 골렘 두목 | 🌳 **고대 나무 거인** (월드 1 보스) |
| 15 | 🗿 골렘 두목 | 🌳 고대 나무 거인 (월드 2 중간 보스) |
| 20 | 🐉 레드 드래곤 | 🐉 레드 드래곤 (그대로) |

- 키: `ancient_treant` · 스킬: 🌿 **뿌리 묶기** — 앞쪽 넓은 범위 피해 + 아군 2초 묶임(이동·공격 불가) + 작은 버섯 몬스터 2마리 소환
- 저장: `D:\AI\workspace\game\images\image\enemies\bosses\Boss_ancient_treant.png`
- 참고 이미지: `images/image/enemies/remake/Enemy_ogre.png`(화풍·크기) + `Enemy_mushroom.png`(숲 분위기)

### 🌳 고대 나무 거인 → `Boss_ancient_treant.png`
```
Pixel art sprite sheet of an ancient treant BOSS for a 2D side-scrolling tower defense game, facing RIGHT (the game flips it to walk left). A huge chibi living tree giant with thick mossy bark skin, a grumpy wise face with glowing green eyes in the trunk, a crown of leafy branches with small pink flowers and a bird nest, long root legs and big branch arms, tiny mushrooms growing on its shoulders. Same cute chibi fantasy pixel style as the attached reference bosses. Big, heavy and intimidating, but still cute.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Idle: 4 frames (leaves rustling, swaying slowly)
Row 2 Walk: 6 frames (slow heavy root steps forward to the right)
Row 3 Attack: 5 frames (branch arm swing)
Row 4 Skill: 4 frames (slamming its roots into the ground, thick roots and vines burst out of the earth in front)
Row 5 Death: 4 frames (cracks, leaves fall, collapses into a pile of logs and leaves)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```
