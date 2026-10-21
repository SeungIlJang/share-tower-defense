# ⭐ 유닛 진화 그림 프롬프트 (스킨별 · 레벨별)

> 2026-10-21. ✅ 48장 모두 생성·게임 적용 완료(`tools/sprites.config.json`의 `<유닛>_t2/_t3`, `<유닛>@legend_t2/_t3`).
> 유닛 **강화 레벨**에 따라 모습이 바뀜: ★1 Lv0~4(지금 그림) → ★2 Lv5~9 → ★3 Lv10+

## 만드는 그림
| 스킨 | ★2 · ★3 그림 | 비고 |
|---|---|---|
| ⚪ 기본 | 유닛마다 2장 | 지금 기본 그림을 참고 이미지로 첨부 |
| 🔵 레어 | **필요 없음** | 기본 ★단계 그림의 색만 바꿔 자동 진화 |
| 🟡 전설 | 유닛마다 2장 | 지금 전설 그림을 참고 이미지로 첨부 |

**총 48장**(12유닛 × 기본 2 + 전설 2). 한꺼번에 만들 필요 없음 — 만든 것부터 게임에 들어가고, 없는 단계는 지금 그림 + ★ 표시로 나옴.

## 저장 위치 · 파일 이름 (영문)
`D:\AI\workspace\game\images\image\evolution\Unit_<유닛>_<base|legend>_t<2|3>.png`
예) `Unit_mage_base_t2.png`, `Unit_mage_legend_t3.png`

## 같은 캐릭터로 보이게 하는 팁
- 지금 그림(★1)을 **참고 이미지로 함께 첨부**. ★3을 만들 때는 ★2 결과도 같이 첨부하면 더 자연스러움.
- 배치(5줄 4·6·5·4·4 프레임, 오른쪽을 봄, 남색 배경)는 모든 그림이 같아야 바로 들어감.

---

## 병사 (`soldier`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_soldier_base_t2.png`
```
Pixel art sprite sheet of a cute chibi boy soldier with spiky brown hair, blue tunic, red scarf and a short iron sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: veteran soldier: steel breastplate over the blue tunic, iron shoulder guards, longer red scarf flowing like a short cape, sharper broadsword, small steel headband.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash)
Row 4 Skill: 4 frames (sword raised high with a shining burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_soldier_base_t3.png`
```
Pixel art sprite sheet of a cute chibi boy soldier with spiky brown hair, blue tunic, red scarf and a short iron sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: heroic captain: polished silver-and-blue plate armor with gold trims, long red cape, gleaming longsword with a blue gem, small golden medal on the chest, confident pose.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash)
Row 4 Skill: 4 frames (sword raised high with a shining burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 황금 사자 ★★ (Lv5~9) → `Unit_soldier_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi boy warrior in golden lion armor with a red cape and a golden sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: golden lion knight: heavier golden armor with lion-head shoulder guards, longer crimson cape, golden broadsword with a lion hilt.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash)
Row 4 Skill: 4 frames (sword raised high with a shining burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 황금 사자 ★★★ (Lv10+) → `Unit_soldier_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi boy warrior in golden lion armor with a red cape and a golden sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: radiant lion warlord: blazing gold armor with a lion-mane helmet crest, flowing crimson-and-gold cape, huge glowing golden greatsword, warm sun aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash)
Row 4 Skill: 4 frames (sword raised high with a shining burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 궁수 (`archer`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_archer_base_t2.png`
```
Pixel art sprite sheet of a cute chibi girl archer with an orange ponytail, green leather tunic and a simple wooden bow, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: skilled ranger: green leather armor with a short hooded mantle, feathered cap, recurve bow and a full quiver.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (drawing the bow and shooting an arrow)
Row 4 Skill: 4 frames (aiming upward and releasing a glowing volley)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_archer_base_t3.png`
```
Pixel art sprite sheet of a cute chibi girl archer with an orange ponytail, green leather tunic and a simple wooden bow, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: elite sharpshooter: green-and-gold forest cloak, ornate longbow carved with leaves, glowing green arrow tips, leaf ornaments in the hair.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (drawing the bow and shooting an arrow)
Row 4 Skill: 4 frames (aiming upward and releasing a glowing volley)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 달빛 레인저 ★★ (Lv5~9) → `Unit_archer_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi girl ranger in teal-and-white moonlight clothes with a glowing silver bow, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: moonlight ranger: silver-trimmed teal armor with crescent moon ornaments, silver longbow, softly glowing arrows.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (drawing the bow and shooting an arrow)
Row 4 Skill: 4 frames (aiming upward and releasing a glowing volley)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 달빛 레인저 ★★★ (Lv10+) → `Unit_archer_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi girl ranger in teal-and-white moonlight clothes with a glowing silver bow, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: lunar archon: flowing white-and-teal cloak with star patterns, crescent moon halo behind the head, crystal bow shooting star-shaped arrows, sparkling moon aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (drawing the bow and shooting an arrow)
Row 4 Skill: 4 frames (aiming upward and releasing a glowing volley)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 기사 (`knight`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_knight_base_t2.png`
```
Pixel art sprite sheet of a cute chibi knight in full silver armor with a closed helmet and blue plume, a shield with a gold cross and a sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: veteran knight: thicker silver plate with blue enamel trims, larger kite shield with gold cross, longer blue plume, broadsword.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Skill: 4 frames (shield raised with a holy light burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_knight_base_t3.png`
```
Pixel art sprite sheet of a cute chibi knight in full silver armor with a closed helmet and blue plume, a shield with a gold cross and a sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: grand knight: ornate silver-and-gold plate, flowing blue cape, tall golden helmet crest, large shining tower shield with a gold lion cross, glowing sword.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Skill: 4 frames (shield raised with a holy light burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 성기사 ★★ (Lv5~9) → `Unit_knight_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi paladin knight in shining golden armor with a gold-and-white shield and holy sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: holy paladin: brighter gold-and-white armor with sun engravings, white cape, holy sword with golden glow.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Skill: 4 frames (shield raised with a holy light burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 성기사 ★★★ (Lv10+) → `Unit_knight_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi paladin knight in shining golden armor with a gold-and-white shield and holy sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: divine paladin: radiant white-gold armor with small feather wings on the helmet, halo of light, huge sun-emblem shield, blazing holy sword, golden light aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Skill: 4 frames (shield raised with a holy light burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 창병 (`spear`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_spear_base_t2.png`
```
Pixel art sprite sheet of a cute chibi spearman with a teal helmet and teal scarf, light leather armor and a long iron spear, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: veteran spearman: steel scale armor with teal trims, crested teal helmet, longer spear with a red tassel, small round buckler.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (thrusting the spear forward)
Row 4 Skill: 4 frames (spinning the spear with a fiery sweep)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_spear_base_t3.png`
```
Pixel art sprite sheet of a cute chibi spearman with a teal helmet and teal scarf, light leather armor and a long iron spear, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: royal lancer: polished teal-and-silver armor, flowing teal cape, winged helmet, long ornate halberd-spear with a glowing blade.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (thrusting the spear forward)
Row 4 Skill: 4 frames (spinning the spear with a fiery sweep)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 용창 기사 ★★ (Lv5~9) → `Unit_spear_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi dragon lancer in red dragon-scale armor with a red spear, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: dragon lancer: heavier crimson dragon-scale armor with horn-like helmet crest, dragon-head spear with a flame tassel.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (thrusting the spear forward)
Row 4 Skill: 4 frames (spinning the spear with a fiery sweep)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 용창 기사 ★★★ (Lv10+) → `Unit_spear_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi dragon lancer in red dragon-scale armor with a red spear, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: dragon lord lancer: blazing crimson-and-gold dragon armor with small dragon wings on the back, flaming dragon spear, ember aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (thrusting the spear forward)
Row 4 Skill: 4 frames (spinning the spear with a fiery sweep)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 마법사 (`mage`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_mage_base_t2.png`
```
Pixel art sprite sheet of a cute chibi girl mage with pink hair, a purple witch hat, purple robe and a wooden staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: adept mage: richer purple robe with gold trims and a short cape, taller witch hat with a star pin, staff with a glowing pink crystal, floating spell book.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a magic orb from the staff)
Row 4 Skill: 4 frames (raising the staff to summon a big magic circle)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_mage_base_t3.png`
```
Pixel art sprite sheet of a cute chibi girl mage with pink hair, a purple witch hat, purple robe and a wooden staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: archmage: flowing deep-purple robe with star embroidery, grand witch hat with a crescent ornament, ornate staff with a large glowing orb, two orbiting magic runes.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a magic orb from the staff)
Row 4 Skill: 4 frames (raising the staff to summon a big magic circle)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 별빛 대마법사 ★★ (Lv5~9) → `Unit_mage_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi girl archmage with pink hair, a starry night-blue robe and a star staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: starlight mage: night-blue robe sparkling with stars, wide hat with a golden star, star-tipped staff, small floating stars.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a magic orb from the staff)
Row 4 Skill: 4 frames (raising the staff to summon a big magic circle)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 별빛 대마법사 ★★★ (Lv10+) → `Unit_mage_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi girl archmage with pink hair, a starry night-blue robe and a star staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: cosmic grand sorceress: galaxy-patterned flowing robe, crown of stars on the hat, celestial staff holding a mini planet, swirling constellation aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a magic orb from the staff)
Row 4 Skill: 4 frames (raising the staff to summon a big magic circle)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 로그 (`rogue`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_rogue_base_t2.png`
```
Pixel art sprite sheet of a cute chibi rogue with white hair, a dark green hood, black leather armor and two daggers, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: skilled rogue: hooded dark-green cloak with a scarf mask, more belts and pouches, curved twin daggers.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (quick twin dagger slashes)
Row 4 Skill: 4 frames (vanishing dash with a shadow strike)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_rogue_base_t3.png`
```
Pixel art sprite sheet of a cute chibi rogue with white hair, a dark green hood, black leather armor and two daggers, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: master assassin: sleek black-and-green armor, long tattered hooded cloak, glowing green twin blades, faint green smoke trails.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (quick twin dagger slashes)
Row 4 Skill: 4 frames (vanishing dash with a shadow strike)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 그림자 암살자 ★★ (Lv5~9) → `Unit_rogue_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi shadow assassin with white hair in a purple-black hood with violet daggers, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: shadow assassin: deeper violet-black armor with silver buckles, glowing violet daggers, shadow wisps.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (quick twin dagger slashes)
Row 4 Skill: 4 frames (vanishing dash with a shadow strike)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 그림자 암살자 ★★★ (Lv10+) → `Unit_rogue_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi shadow assassin with white hair in a purple-black hood with violet daggers, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: void phantom: flowing shadow cloak that fades into smoke, glowing violet eyes, twin crescent void blades, swirling dark-purple aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (quick twin dagger slashes)
Row 4 Skill: 4 frames (vanishing dash with a shadow strike)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 성직자 (`cleric`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_cleric_base_t2.png`
```
Pixel art sprite sheet of a cute chibi girl cleric with blonde hair, a white-and-blue nun habit and a golden cross staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: priestess: longer white robe with gold embroidery, blue sash, taller headdress, golden cross staff with a glowing gem.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (raising the staff to heal (no attack))
Row 4 Skill: 4 frames (casting a big healing light pillar)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_cleric_base_t3.png`
```
Pixel art sprite sheet of a cute chibi girl cleric with blonde hair, a white-and-blue nun habit and a golden cross staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: high priestess: ornate white-and-gold robe, flowing light veil, grand cross staff radiating light, floating holy book.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (raising the staff to heal (no attack))
Row 4 Skill: 4 frames (casting a big healing light pillar)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 천사 성녀 ★★ (Lv5~9) → `Unit_cleric_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi angel saint girl with a halo, golden-white robe and a golden cross staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: angel saint: small white wings on the back, brighter halo, golden robe with feather trims.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (raising the staff to heal (no attack))
Row 4 Skill: 4 frames (casting a big healing light pillar)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 천사 성녀 ★★★ (Lv10+) → `Unit_cleric_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi angel saint girl with a halo, golden-white robe and a golden cross staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: seraph saint: large glowing white wings, double halo, radiant golden robe, cross staff shining like a star, falling feathers aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (raising the staff to heal (no attack))
Row 4 Skill: 4 frames (casting a big healing light pillar)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 흙마법사 (`earthmage`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_earthmage_base_t2.png`
```
Pixel art sprite sheet of a cute chibi boy earth mage with brown hair, a brown-olive robe and a wooden staff with an amber stone, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: stone mage: earthy robe with stone shoulder plates, staff with a bigger amber crystal, small floating pebbles.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a rock or vine spike forward)
Row 4 Skill: 4 frames (slamming the staff to raise earth spikes)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_earthmage_base_t3.png`
```
Pixel art sprite sheet of a cute chibi boy earth mage with brown hair, a brown-olive robe and a wooden staff with an amber stone, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: mountain sage: heavy robe with moss and rock armor pieces, rune-carved stone staff, orbiting boulders, glowing amber runes.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a rock or vine spike forward)
Row 4 Skill: 4 frames (slamming the staff to raise earth spikes)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 고대 드루이드 ★★ (Lv5~9) → `Unit_earthmage_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi druid boy in green leafy robes with a glowing green staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: grove druid: leafy cloak with flowers, antler-shaped headband, staff with a glowing green crystal and vines.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a rock or vine spike forward)
Row 4 Skill: 4 frames (slamming the staff to raise earth spikes)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 고대 드루이드 ★★★ (Lv10+) → `Unit_earthmage_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi druid boy in green leafy robes with a glowing green staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: ancient forest guardian: robe of bark and leaves, large antlers with glowing flowers, living wooden staff, swirling leaves and spirit lights aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a rock or vine spike forward)
Row 4 Skill: 4 frames (slamming the staff to raise earth spikes)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 암흑마법사 (`darkmage`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_darkmage_base_t2.png`
```
Pixel art sprite sheet of a cute chibi girl dark mage in a purple hood and dark purple robe with a dark staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: shadow mage: dark robe with silver trims, hood with small horns, staff with a glowing purple skull orb.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a dark orb forward)
Row 4 Skill: 4 frames (opening a swirling black hole)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_darkmage_base_t3.png`
```
Pixel art sprite sheet of a cute chibi girl dark mage in a purple hood and dark purple robe with a dark staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: archlich sorceress: flowing black-violet robe with runes, tall horned hood, floating dark grimoire, staff with a swirling dark orb, purple flame aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a dark orb forward)
Row 4 Skill: 4 frames (opening a swirling black hole)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 공허의 마녀 ★★ (Lv5~9) → `Unit_darkmage_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi void witch girl in a black-magenta hood with glowing magenta magic, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: void witch: black-magenta robe with void cracks, glowing magenta eyes, staff with a black hole orb.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a dark orb forward)
Row 4 Skill: 4 frames (opening a swirling black hole)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 공허의 마녀 ★★★ (Lv10+) → `Unit_darkmage_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi void witch girl in a black-magenta hood with glowing magenta magic, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: queen of the void: flowing star-void robe, crown of dark crystals, giant black hole orb above the staff, magenta void aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a dark orb forward)
Row 4 Skill: 4 frames (opening a swirling black hole)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 방패병 (`shield`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_shield_base_t2.png`
```
Pixel art sprite sheet of a cute chibi heavy shield bearer in steel armor with gold trims, a huge tower shield with a lion emblem and a flail, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: iron guardian: thicker steel armor with gold rivets, bigger lion tower shield, spiked flail.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (bashing with the shield and swinging the flail)
Row 4 Skill: 4 frames (planting the shield with a golden barrier wave)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_shield_base_t3.png`
```
Pixel art sprite sheet of a cute chibi heavy shield bearer in steel armor with gold trims, a huge tower shield with a lion emblem and a flail, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: fortress champion: massive gold-trimmed plate with a tall crested helmet, giant lion shield glowing at the edges, heavy morningstar, solid steel stance.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (bashing with the shield and swinging the flail)
Row 4 Skill: 4 frames (planting the shield with a golden barrier wave)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 요새 수호자 ★★ (Lv5~9) → `Unit_shield_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi fortress guardian in black-and-gold armor with a black-gold lion tower shield, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: fortress guardian: heavier black-gold armor with tower-shaped pauldrons, larger obsidian lion shield.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (bashing with the shield and swinging the flail)
Row 4 Skill: 4 frames (planting the shield with a golden barrier wave)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 요새 수호자 ★★★ (Lv10+) → `Unit_shield_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi fortress guardian in black-and-gold armor with a black-gold lion tower shield, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: living fortress: towering black-gold armor like castle walls with small battlements on the shoulders, giant fortress shield with a glowing gold lion, golden barrier aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (bashing with the shield and swinging the flail)
Row 4 Skill: 4 frames (planting the shield with a golden barrier wave)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 기병 (`cavalry`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_cavalry_base_t2.png`
```
Pixel art sprite sheet of a cute chibi cavalry knight with a red plume, light armor and red cape riding a brown horse with a lance, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: veteran cavalry: steel armor and red cape on an armored brown warhorse, longer lance with a red pennant.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (charging lance thrust)
Row 4 Skill: 4 frames (rearing horse with a powerful charge)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_cavalry_base_t3.png`
```
Pixel art sprite sheet of a cute chibi cavalry knight with a red plume, light armor and red cape riding a brown horse with a lance, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: royal dragoon: ornate steel-and-red armor, flowing red cape, armored black warhorse with red barding, long ornate lance.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (charging lance thrust)
Row 4 Skill: 4 frames (rearing horse with a powerful charge)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 왕실 기병 ★★ (Lv5~9) → `Unit_cavalry_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi royal cavalry knight in blue-gold armor riding a white horse with a lance, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: royal guard cavalry: brighter blue-gold armor with a blue plume, white horse with gold barding, royal lance with a blue banner.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (charging lance thrust)
Row 4 Skill: 4 frames (rearing horse with a powerful charge)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 왕실 기병 ★★★ (Lv10+) → `Unit_cavalry_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi royal cavalry knight in blue-gold armor riding a white horse with a lance, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: kings champion rider: radiant blue-gold armor with a crown crest, white armored warhorse with glowing gold hooves, golden lance, royal light aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (charging lance thrust)
Row 4 Skill: 4 frames (rearing horse with a powerful charge)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 대포병 (`cannon`)

### ⚪ 기본 ★★ (Lv5~9) → `Unit_cannon_base_t2.png`
```
Pixel art sprite sheet of a cute chibi cannoneer with aviator goggles, brown leather coat and a bronze cannon on wheels, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: veteran gunner: reinforced leather coat with brass buckles, bigger iron cannon with reinforced wheels, ammo belt.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (firing the cannon with a blast)
Row 4 Skill: 4 frames (charging a big overheated shot with steam)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ⚪ 기본 ★★★ (Lv10+) → `Unit_cannon_base_t3.png`
```
Pixel art sprite sheet of a cute chibi cannoneer with aviator goggles, brown leather coat and a bronze cannon on wheels, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: master artillerist: officer coat with gold trims, large ornate bronze cannon with a lion muzzle, smoking fuse, cannonball stack.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (firing the cannon with a blast)
Row 4 Skill: 4 frames (charging a big overheated shot with steam)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 스팀펑크 기술자 ★★ (Lv5~9) → `Unit_cannon_legend_t2.png`
```
Pixel art sprite sheet of a cute chibi steampunk engineer with goggles and a brass gear cannon, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: steampunk engineer: brass mechanical arm, goggles with lenses, cannon with gears and steam pipes.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (firing the cannon with a blast)
Row 4 Skill: 4 frames (charging a big overheated shot with steam)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🟡 전설 — 스팀펑크 기술자 ★★★ (Lv10+) → `Unit_cannon_legend_t3.png`
```
Pixel art sprite sheet of a cute chibi steampunk engineer with goggles and a brass gear cannon, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference (same face, same chibi proportions, same art style), evolved: steam titan engineer: brass exosuit backpack with pipes, glowing furnace cannon with spinning gears, steam clouds aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (firing the cannon with a blast)
Row 4 Skill: 4 frames (charging a big overheated shot with steam)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```
