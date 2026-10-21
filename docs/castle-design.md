# 🏰 성 업그레이드 설계 (공격 · 강화 · 형태 변화 · 적 성 진화)

> 2026-10-21 분석. 결정이 필요한 곳은 **[결정]**.

## 0. 지금 상태
| 항목 | 지금 |
|---|---|
| 우리 성 | 공격 안 함 · 체력 = 관문마다 정해진 값(`stages.json` baseHp 100~448) · 그림 1종(파손 3단계: 멀쩡/금 감/무너짐) |
| 적 성 | 공격 안 함 · 병력을 계속 생산 · 그림 1종(파손 3단계) |
| 강화 | 🏰 기지 탭 = 인구·소환 에너지만(성 자체 강화 없음) |

---

## 1. 성도 공격한다
- 성 꼭대기에서 **사거리 안 가장 가까운 적**에게 자동 발사(유닛처럼 투사체 그림은 코드로 그림).
- 우리 성 기본: 사거리 **300px**, 피해 **18**, 1.2초마다 → 성 레벨로 증가.
- **단계마다 발사체가 바뀜**(그림 없이도 진화가 느껴지게):

| 우리 성 단계 | 발사체 | 특징 |
|---|---|---|
| ★1 돌 망루(지금 그림) | 🏹 화살 1발 | 단일 |
| ★2 성벽 요새 | 🏹 화살 2발 연속 | 단일 ×2 |
| ★3 성채 | 💣 투석·대포알 | 착탄 범위 피해 |
| ★4 왕성 | ⚡ 마법 번개 | 3명 연쇄 |
| ★5 천공의 성 | ✨ 성스러운 빛줄기 | 관통 + 아군 소량 회복 |

- **적 성도 공격**: 우리 유닛·영웅을 쏨(관문이 오를수록 강해짐). 단, 적 성 공격은 **우리 성 공격보다 약하게**(성 공략이 너무 어려워지지 않게).
- 성 앞에 적이 몰리면 성이 직접 막아 줘서 초반 버티기가 쉬워짐 → 1~2관문 난이도가 내려가므로 적 수를 약간 늘릴지 플레이 테스트 필요.

## 2. 성 업그레이드 (강화 화면 🏰 기지 탭에 추가)
| 항목 | 효과/레벨 | 최대 | 비용 |
|---|---|---|---|
| 🏰 **성 레벨** | 성 체력 +10% · 성 공격력 +12% · 사거리 +8px | 20 | 200 + 150×Lv |
| 🎯 성 공격 속도 | 발사 간격 -6% | 10 | 250 + 180×Lv |

- 성 체력 = 관문 기본 체력 × (1 + 0.1 × 성 레벨) → 관문 난이도 구조는 유지.
- 전투 중 🛒 상점에서 올려도 바로 반영(체력 비율 유지, 그림 교체).
- **[결정]** 성 레벨을 영웅처럼 **20레벨·5단계**로 할지(추천, 영웅과 같은 리듬) / 10레벨·5단계로 짧게 할지.

## 3. 업그레이드에 따라 형태 변경 (우리 성 5단계)
| 단계 | 성 레벨 | 모습 |
|---|---|---|
| ★1 | Lv0~4 | 🗼 **돌 망루** — 지금 그림 그대로 |
| ★2 | Lv5~9 | 🧱 성벽 요새 — 망루 + 낮은 성벽·나무 성문·궁수 발판 |
| ★3 | Lv10~14 | 🏯 성채 — 탑 2개 + 성벽 + 투석기 + 파란 깃발 여러 개 |
| ★4 | Lv15~19 | 🏰 왕성 — 높은 첨탑 3개 · 금장식 · 마법 수정이 박힌 탑 |
| ★5 | Lv20 | ☁️ 천공의 성 — 하얀·금색 성이 구름 받침 위에, 빛나는 후광·날개 장식 |

- 단계마다 **파손 3컷**(멀쩡 / 금 감 / 무너짐)은 그대로 유지 → 체력이 줄면 단계 안에서 무너짐.
- 단계가 오르면 성 그림이 커짐(★1 높이 245px → ★5 약 290px). 화면 왼쪽 끝을 넘지 않게 위치 자동 조정.
- 진화 순간 강화 화면에서 "✨ 진화! 성채" 연출(영웅·유닛과 같은 방식).

## 4. 적 성도 관문이 오르면 업그레이드·변형
| 단계 | 관문 | 모습 | 공격 |
|---|---|---|---|
| ★1 | 1~4 | 🪵 **오크 가시 망루** — 지금 그림 그대로 | 돌팔매 |
| ★2 | 5~8 | ☠️ 해골 요새 — 뼈·두개골 장식 목책, 해골 깃발 | 독화살 |
| ★3 | 9~12 | 🔥 용암 요새 — 검은 바위·용암이 흐르는 성벽 | 화염탄(범위) |
| ★4 | 13~16 | 🌑 암흑 성채 — 보라 마법 결정·뾰족 첨탑 | 암흑 구슬 |
| ★5 | 17~20 | 👹 마왕성 — 거대한 해골 입 성문·뿔 첨탑·붉은 눈 | 저주 번개(연쇄) |

- 적 성 체력은 지금처럼 관문 값(`baseHp`) 그대로, **공격력·사거리만 단계에 따라** 올라감.
- ♾️ 무한 모드: 웨이브 4·8·12·16마다 적 성이 한 단계씩 진화(진화하는 순간 흔들림 + "적 성이 강해졌다!" 배너).

## 5. 구현 계획
| 단계 | 내용 | 파일 |
|---|---|---|
| A | 성 공격(우리·적) — 사거리·피해·간격, 단계별 발사체 5+5종 | `entities/Base.ts`, `scenes/Battle.ts` |
| B | 성 레벨·공격 속도 강화(저장·강화 탭·전투 중 상점 반영) | `systems/castle.ts`(순수 계산+테스트), `upgrades.ts`, `Upgrade.ts` |
| C | 단계별 그림 교체(우리=성 레벨, 적=관문/웨이브), 그림 없으면 지금 그림 | `Base.ts`, `Preload.ts`, `sprites.config.json` |
| D | 개발자 모드에 성 레벨·적 성 단계 조절 추가, 밸런스 | `Dev.ts` |

- 그림이 없어도 A·B·D는 바로 동작(★1 그림 + 단계별 발사체로 차이가 보임). 그림이 들어오면 C가 자동 적용.

---

## 6. 🎨 성 그림 프롬프트 (8장 — ★1은 지금 그림 사용)

**공통 규칙**
- 한 장에 **같은 성의 파손 3컷을 가로로**: 왼쪽 멀쩡 → 가운데 금 가고 일부 부서짐 → 오른쪽 크게 무너지고 연기.
- 지금 성 그림(`art/tower_damage_stages_sheet.png`)을 **참고 이미지로 첨부** → 같은 화풍.
- 저장: `D:\AI\workspace\game\images\image\castle\Castle_<ally|enemy>_t<2~5>.png`

### 🔵 우리 성 ★2 성벽 요새 → `Castle_ally_t2.png`
```
Pixel art of a player castle for a 2D side-scrolling tower defense game, the castle stands on the LEFT side of the battlefield so its front gate faces RIGHT. Same art style as the attached reference (the blue-roof stone watchtower), upgraded: a stone fortress made of the blue-roof round watchtower plus a short crenellated stone wall on its right with a wooden gate and a small wooden archer platform, blue banners with a white fleur-de-lis, warm torch light.

Show the SAME castle 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: cracks, a few fallen stones, torn banner, 3) heavily ruined: collapsed wall and roof, broken beams, rubble pile, grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔵 우리 성 ★3 성채 → `Castle_ally_t3.png`
```
Pixel art of a player castle for a 2D side-scrolling tower defense game, the castle stands on the LEFT side of the battlefield so its front gate faces RIGHT. Same art style as the attached reference (the blue-roof stone watchtower), upgraded further: a sturdy stone citadel with two round towers with blue cone roofs joined by a thick crenellated wall, a big iron-banded gate, a wooden catapult on the wall, several blue fleur-de-lis banners and flags, glowing windows.

Show the SAME castle 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: cracks, a few fallen stones, torn banner, 3) heavily ruined: collapsed wall and roof, broken beams, rubble pile, grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔵 우리 성 ★4 왕성 → `Castle_ally_t4.png`
```
Pixel art of a player castle for a 2D side-scrolling tower defense game, the castle stands on the LEFT side of the battlefield so its front gate faces RIGHT. Same art style as the attached reference (the blue-roof stone watchtower), upgraded to a royal palace: a grand white-stone royal castle with three tall spires with blue-and-gold roofs, gold trims and a golden crown ornament on the main spire, a large ornate gate, glowing blue magic crystals set into the towers, long royal blue banners with gold lions.

Show the SAME castle 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: cracks, a few fallen stones, torn banner, a dimmed crystal, 3) heavily ruined: collapsed spires, broken crystals, rubble pile, grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔵 우리 성 ★5 천공의 성 → `Castle_ally_t5.png`
```
Pixel art of a player castle for a 2D side-scrolling tower defense game, the castle stands on the LEFT side of the battlefield so its front gate faces RIGHT. Same art style as the attached reference (the blue-roof stone watchtower), the ultimate legendary form: a radiant celestial castle of white marble and gold resting on a base of soft clouds, tall spires with golden roofs, a glowing golden halo ring above the main spire, white feather-wing ornaments on the towers, shining sunlight crystals, flowing white-and-gold banners, gentle sparkles.

Show the SAME castle 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: cracks, a broken wing ornament, dimmed halo, 3) heavily ruined: collapsed spires, fading halo, rubble and drifting feathers, grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔴 적 성 ★2 해골 요새 → `Castle_enemy_t2.png`
```
Pixel art of an ENEMY monster fortress for a 2D side-scrolling tower defense game, the fortress stands on the RIGHT side of the battlefield so its front faces LEFT. Same art style as the attached reference (the red-roof orc spiked wooden tower), upgraded: a skeleton fortress of dark wooden palisades decorated with bones, horned skulls and a big skull above the gate, tattered black flags with a white skull, green ghostly torches.

Show the SAME fortress 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: broken stakes, fallen skulls, torn flag, 3) heavily ruined: collapsed palisade, pile of bones and wood, grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔴 적 성 ★3 용암 요새 → `Castle_enemy_t3.png`
```
Pixel art of an ENEMY monster fortress for a 2D side-scrolling tower defense game, the fortress stands on the RIGHT side of the battlefield so its front faces LEFT. Same art style as the attached reference (the red-roof orc spiked wooden tower), upgraded: a volcanic fortress of jagged black rock with glowing orange lava flowing through cracks, iron spikes, a fire brazier on top, red war banners with an orc fist symbol, embers in the air.

Show the SAME fortress 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: cracked rock, lava leaking, broken spikes, torn banner, 3) heavily ruined: collapsed rock pile with cooling lava, grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔴 적 성 ★4 암흑 성채 → `Castle_enemy_t4.png`
```
Pixel art of an ENEMY monster fortress for a 2D side-scrolling tower defense game, the fortress stands on the RIGHT side of the battlefield so its front faces LEFT. Same art style as the attached reference (the red-roof orc spiked wooden tower), upgraded: a dark sorcerer citadel of black stone with sharp thorny spires, large glowing purple magic crystals, floating dark runes, a gate shaped like a fanged mouth, purple flames in iron braziers, dark violet banners.

Show the SAME fortress 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: cracked spires, a broken crystal, dimmed runes, 3) heavily ruined: collapsed spires, shattered crystals, rubble, grey-purple smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

### 🔴 적 성 ★5 마왕성 → `Castle_enemy_t5.png`
```
Pixel art of an ENEMY monster fortress for a 2D side-scrolling tower defense game, the fortress stands on the RIGHT side of the battlefield so its front faces LEFT. Same art style as the attached reference (the red-roof orc spiked wooden tower), the ultimate demon lord castle: a towering black-and-crimson castle with huge curved horns on the main tower, a giant skull gate with glowing red eyes, red lava moat, hellfire torches, crimson demon banners, swirling dark red aura and floating embers.

Show the SAME fortress 3 times in one horizontal row with generous empty space between them, all standing on the same ground line and same size:
1) intact, 2) damaged: broken horn, cracked skull gate, dimmed eyes, torn banner, 3) heavily ruined: collapsed towers, shattered skull, fire and grey smoke.

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, cute chibi fantasy style. Plain dark navy background (#1a2133). No text, no labels, no UI, no ground tiles, no characters. 1448x1086 PNG.
```

---

## 7. 진행 현황 (2026-10-21)
- ✅ 성 레벨 20 · 공격 속도 10 (강화 화면 🏰 기지 탭, 전투 중 상점 반영, 개발자 모드 🗺️ 진행 탭)
- ✅ 우리 성·적 성 공격(단계별 발사체 10종), 적 성 단계 = 관문 / 무한 모드 웨이브 4·8·12·16 진화
- ✅ 단계 그림 자리(`base_ally_t2~t5`, `base_enemy_t2~t5`) — 그림이 없으면 지금 그림
- ⏳ 성 그림 8장 → `images/image/castle/`에 넣으면 `tools/sprites.config.json`에 등록(파손 3컷 `crops` + `anchors`, 지금 `base_ally`와 같은 방식)
