# 🛡️ 영웅 장비 · 🗿 설치물 카드 — Codex 그림 프롬프트

> 2026-10-23. ✅ 5장 모두 생성(Codex)·게임 적용 완료 — `tools/extract_grid.py`로 잘라 `public/sprites/equip_*`·`totem_*`.
> 팔라독 분석 ⑤⑥(`docs/paladog-apk-analysis.md`). **그림은 Codex가 만들고, 게임 연결·검증은 Claude가 맡음.**
> 원본은 저장소에 넣지 않음(`images/image/...`). 받으면 `tools/extract_sprites.py`로 잘라서 `public/sprites`에 넣음.

## 무엇을 만드나
| 파일 | 내용 | 장수 |
|---|---|---|
| `Equip_weapons.png` | 영웅 무기 아이콘 6개(J 스킬이 바뀜) | 1장(6칸) |
| `Equip_rings.png` | 반지 아이콘 6개(패시브) | 1장(6칸) |
| `Totem_egg_cannon.png` | 🐔 알 대포 닭 — 서서 알을 쏨 | 1장(시트) |
| `Totem_fire.png` | 🔥 화염 토템 — 주변 적에게 불 | 1장(시트) |
| `Totem_heal.png` | 🌿 회복 토템 — 주변 아군 회복 | 1장(시트) |

## 저장 위치 (영문 이름)
- 장비: `D:\AI\workspace\game\images\image\equip\Equip_weapons.png`, `Equip_rings.png`
- 설치물: `D:\AI\workspace\game\images\image\totems\Totem_egg_cannon.png`, `Totem_fire.png`, `Totem_heal.png`

## 공통 팁
- **참고 이미지 첨부**: 영웅 `images/image/Hero_Aldric_Knight.png`(화풍), 유닛 `images/image/evolution/Unit_cleric_base_t2.png`(크기·선 굵기).
- 등급(1~5)은 게임이 **아이콘 테두리 색**(회색·초록·파랑·보라·금)으로 표시 → 아이콘은 **등급 없이 1개씩**만.
- 장비 아이콘은 던지는 모습으로도 쓰임(철퇴 던지기 → 그 무기 그림이 회전하며 날아감) → **무기만 크게, 배경 장식 없이**.
- 설치물은 **오른쪽을 보게**(아군 쪽이 왼쪽, 적이 오른쪽). 움직이지 않으니 **걷기 줄 없음**.

---

## ⚔️ 영웅 무기 6종 → `Equip_weapons.png`
| 칸 | 무기 | 키 | 게임 효과(J 스킬) |
|---|---|---|---|
| 1 | 철퇴 | `mace` | 앞쪽 적 2명 관통(지금 그대로 · 기본) |
| 2 | 서리 철퇴 | `frost_mace` | 맞은 적 2초 느려짐 |
| 3 | 번개 망치 | `thunder_hammer` | 맞은 적에서 번개가 옆 적 3명에게 튐 |
| 4 | 화염 메이스 | `flame_mace` | 떨어진 자리에 3초 불바다 |
| 5 | 치유의 홀 | `healing_scepter` | 던지면 오라 안 아군 회복 + 적 피해 조금 |
| 6 | 황금 철퇴 | `golden_mace` | 처치하면 골드 2배 |

```
Pixel art item icon sheet for a cute 2D fantasy tower defense game: 6 hero weapon icons in ONE ROW, evenly spaced, each centered in its own square cell with generous empty space between cells, on a plain dark navy background (#1a2133). Each weapon drawn large, diagonal (handle bottom-left, head top-right), filling about 80% of its cell, no frame, no background decoration.

1. Mace: classic steel mace with a round spiked head and a brown leather-wrapped handle, gold rivets.
2. Frost Mace: icy blue crystal mace head with frost shards and a faint cold glow, silver handle.
3. Thunder Hammer: chunky war hammer with a dark iron head, yellow lightning bolts crackling around it.
4. Flame Mace: red-orange molten mace head wrapped in small flames, blackened iron handle.
5. Healing Scepter: white-and-gold holy scepter topped with a glowing green leaf-shaped crystal and tiny sparkles.
6. Golden Mace: shiny solid gold mace with a big gem in the center and coins sparkling around it.

Style: crisp 32-bit pixel art matching the attached reference hero (same outline thickness and shading), bold dark outlines, bright saturated colors, soft highlights, readable at small size (64px). No text, no labels, no numbers, no UI frames, no shadows on the background, no overlapping. 1536x256 PNG (6 cells of 256x256).
```

## 💍 반지 6종 → `Equip_rings.png`
| 칸 | 반지 | 키 | 게임 효과(패시브) |
|---|---|---|---|
| 1 | 경험의 반지 | `ring_exp` | 전투 경험치 +% (레벨업 카드 더 자주) |
| 2 | 황금의 반지 | `ring_gold` | 처치 골드 +% |
| 3 | 마나의 반지 | `ring_mana` | 💧 마나 충전 +% |
| 4 | 생명의 반지 | `ring_life` | 👑 영웅 체력 +% |
| 5 | 바람의 반지 | `ring_wind` | 영웅·오라 이동 속도 +% |
| 6 | 행운의 반지 | `ring_luck` | 치명타 확률 + 상자 등급 업 확률 |

```
Pixel art item icon sheet for a cute 2D fantasy tower defense game: 6 magic ring icons in ONE ROW, evenly spaced, each centered in its own square cell with generous empty space between cells, on a plain dark navy background (#1a2133). Each ring drawn large in a 3/4 view (gem on top), filling about 75% of its cell, no frame, no background decoration.

1. Ring of Experience: silver band with a glowing purple star-shaped gem and tiny sparkles.
2. Ring of Gold: thick gold band with a big yellow topaz and a small coin engraving.
3. Ring of Mana: silver band with a deep blue water-drop sapphire, soft blue glow.
4. Ring of Life: rose-gold band with a red heart-shaped ruby, warm glow.
5. Ring of Wind: light silver band shaped like swirling wind, with a pale green emerald and small wind streaks.
6. Ring of Luck: gold band with a four-leaf-clover green gem and twinkling light.

Style: crisp 32-bit pixel art matching the attached reference hero (same outline thickness and shading), bold dark outlines, bright saturated colors, soft highlights, readable at small size (64px). No text, no labels, no numbers, no UI frames, no shadows on the background, no overlapping. 1536x256 PNG (6 cells of 256x256).
```

---

## 🗿 설치물 카드 3종 (60초 동안 그 자리에 서서 싸우고 사라짐)
| 카드 | 키 | 게임 효과 |
|---|---|---|
| 🐔 알 대포 | `totem_egg` | 앞쪽 적에게 알을 쏨(원거리) |
| 🔥 화염 토템 | `totem_fire` | 주변 적에게 1초마다 불 피해 |
| 🌿 회복 토템 | `totem_heal` | 주변 아군을 1초마다 조금씩 회복 |

### 🐔 알 대포 닭 → `Totem_egg_cannon.png`
```
Pixel art sprite sheet of a cute stationary "egg cannon chicken" turret for a 2D side-scrolling tower defense game, facing RIGHT. A plump chubby white hen with a red comb sitting inside a small wooden cannon barrel on wooden wheels, determined cute face. Same cute chibi fantasy pixel style as the attached reference units.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Appear: 4 frames (pops out of the ground in a puff of dust and feathers)
Row 2 Idle: 4 frames (blinking, wings fluttering, barrel bobbing)
Row 3 Attack: 5 frames (leans back and FIRES a white egg forward to the right, small puff)
Row 4 Vanish: 4 frames (poof into feathers and disappears)
Also draw ONE extra small white egg projectile at the far right end of row 3 (separated, used as the bullet).

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🔥 화염 토템 → `Totem_fire.png`
```
Pixel art sprite sheet of a cute stationary "fire totem" for a 2D side-scrolling tower defense game, facing RIGHT. A short carved wooden totem pole with a grinning tribal fire-spirit face, red and orange painted patterns, and a small bowl of flame burning on top. Same cute chibi fantasy pixel style as the attached reference units.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Appear: 4 frames (rises out of the ground, flame ignites)
Row 2 Idle: 4 frames (flame flickering, face glowing)
Row 3 Attack: 5 frames (mouth opens and a ring of fire bursts outward around it)
Row 4 Vanish: 4 frames (flame goes out, crumbles into embers and ash)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🌿 회복 토템 → `Totem_heal.png`
```
Pixel art sprite sheet of a cute stationary "healing totem" for a 2D side-scrolling tower defense game, facing RIGHT. A small living tree-stump totem with a gentle smiling face, sprouting leaves and pink flowers on top, a glowing green crystal in its chest. Same cute chibi fantasy pixel style as the attached reference units.

Layout: 4 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same size and same ground line in every frame:
Row 1 Appear: 4 frames (sprouts from the ground, leaves unfold)
Row 2 Idle: 4 frames (leaves swaying, crystal softly pulsing)
Row 3 Heal: 5 frames (raises leafy arms, a soft green light wave with tiny plus signs spreads outward)
Row 4 Vanish: 4 frames (wilts and sinks back into the ground with falling petals)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 받은 뒤 Claude가 할 일
1. `tools/sprites.config.json`에 등록 → 아이콘은 6칸 격자 자르기, 설치물은 4줄 시트(등장·대기·공격·사라짐).
2. 장비: 강화 화면 👑 탭에 무기 1칸 + 반지 1칸, 보물 상자에서 장비/장비 조각 획득, 등급 1~5(테두리 색).
3. 설치물: 덱에 넣는 카드 종류 추가(⚡ 에너지로 설치, 60초 후 사라짐, 한 번에 하나씩).
4. 그림이 오기 전에도 이모지로 먼저 동작하게 만들 수 있음(그림은 나중에 자동 교체).
