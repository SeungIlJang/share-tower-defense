# ⭐ 유닛 진화 그림 2차 — ★4 마스터 · ★5 각성 + 🗿 설치물 진화 (Codex 전달용)

> 2026-10-28. 진화가 12단계(★1~★5 + 🌟초월 1~7, Lv 0·5·10·20·30·…·100)로 늘어남.
> 지금 ★4 이상은 ★3 그림 + 오라. 아래 그림이 오면 ★4(`_t4`)·★5(`_t5`)에 들어가고, 🌟초월 1~7은 ★5 그림 + 무지개 오라(코드가 자동으로 아래 단계 그림을 씀).

## 만드는 그림
| 묶음 | 장수 | 파일 |
|---|---|---|
| ⚪ 기본 ★4 마스터(Lv20) | 12 | `Unit_<유닛>_base_t4.png` |
| ⚪ 기본 ★5 각성(Lv30) | 12 | `Unit_<유닛>_base_t5.png` |
| 🗿 설치물 ★2·★3 | 6 | `Totem_<egg_cannon/fire/heal>_t2.png` · `_t3.png` |

**총 30장.** 한꺼번에 안 해도 됨 — 만든 것부터 들어가고, 없는 단계는 아래 단계 그림으로 나옴. 🟡 전설 스킨 ★4·★5(24장)는 이번엔 제외(전설 ★3 그림 + 오라).

## 저장 위치
- 유닛: `D:\AI\workspace\game\images\image\evolution\` (1차 ★2·★3과 같은 폴더)
- 설치물: `D:\AI\workspace\game\images\image\totems\`

## 같은 캐릭터로 보이게 하는 팁
- **참고 이미지 첨부:** ★1 기본 그림 + ★3 그림(`share-tower-defense/public/sprites/<유닛>_t3.png`) — ★5는 ★4 결과도 같이.
- 배치·크기·바닥선은 1차와 **똑같이**(5줄 4·6·5·4·4 프레임, 오른쪽을 봄, 남색 배경 #1a2133) — 그래야 자르는 도구가 그대로 씀.
- **몸 크기는 키우지 말 것**(게임이 단계마다 아주 조금씩 키움). 화려함은 갑옷·이펙트·색으로.
- ★4 = 금빛·고급 장비 느낌, ★5 = 빛·오라·날개 같은 '각성' 느낌으로 한눈에 구분되게.

---

## 병사 (`soldier`)

### ★★★★ 마스터 (Lv20) → `Unit_soldier_base_t4.png`
```
Pixel art sprite sheet of a cute chibi boy soldier with spiky brown hair, blue tunic, red scarf and a short iron sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: legendary commander: gleaming gold-and-blue royal plate armor, layered red cape with gold embroidery, winged gold headband, enchanted longsword trailing a faint blue light, small floating golden sparkles.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash)
Row 4 Skill: 4 frames (sword raised high with a shining burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_soldier_base_t5.png`
```
Pixel art sprite sheet of a cute chibi boy soldier with spiky brown hair, blue tunic, red scarf and a short iron sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened hero: shining sun-gold armor with a radiant sun emblem, flowing crimson-and-gold cape, sword blazing with white-blue holy light, golden aura and light particles around the body.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash)
Row 4 Skill: 4 frames (sword raised high with a shining burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 궁수 (`archer`)

### ★★★★ 마스터 (Lv20) → `Unit_archer_base_t4.png`
```
Pixel art sprite sheet of a cute chibi girl archer with an orange ponytail, green leather tunic and a simple wooden bow, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: master ranger: emerald-and-gold elven armor with leaf pauldrons, tall ornate bow of living wood with glowing vines, quiver of radiant green arrows, short glowing leaf cape.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (drawing the bow and shooting an arrow)
Row 4 Skill: 4 frames (aiming upward and releasing a glowing volley)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_archer_base_t5.png`
```
Pixel art sprite sheet of a cute chibi girl archer with an orange ponytail, green leather tunic and a simple wooden bow, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened wind spirit archer: armor of emerald crystal and gold, cloak made of swirling green wind, bow formed of pure green light, arrows of glowing energy, floating leaves orbiting.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (drawing the bow and shooting an arrow)
Row 4 Skill: 4 frames (aiming upward and releasing a glowing volley)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 기사 (`knight`)

### ★★★★ 마스터 (Lv20) → `Unit_knight_base_t4.png`
```
Pixel art sprite sheet of a cute chibi knight in full silver armor with a closed helmet and blue plume, a shield with a gold cross and a sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: paladin lord: radiant white-gold plate with blue gem inlays, huge golden-crested helm, holy tower shield glowing with a sun emblem, flaming blue sword, light blue cape.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Skill: 4 frames (shield raised with a holy light burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_knight_base_t5.png`
```
Pixel art sprite sheet of a cute chibi knight in full silver armor with a closed helmet and blue plume, a shield with a gold cross and a sword, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened holy knight: radiant platinum-and-gold armor with small angel wings on the back, crown-shaped helm, sun-disc shield shining brightly, sword of pure light, golden halo aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (sword slash behind the shield)
Row 4 Skill: 4 frames (shield raised with a holy light burst)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 창병 (`spear`)

### ★★★★ 마스터 (Lv20) → `Unit_spear_base_t4.png`
```
Pixel art sprite sheet of a cute chibi spearman with a teal helmet and teal scarf, light leather armor and a long iron spear, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: dragon lancer: teal-and-gold dragon-scale armor, dragon-wing helmet, long glowing dragon-head spear, flowing teal cape with gold edges.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (thrusting the spear forward)
Row 4 Skill: 4 frames (spinning the spear with a fiery sweep)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_spear_base_t5.png`
```
Pixel art sprite sheet of a cute chibi spearman with a teal helmet and teal scarf, light leather armor and a long iron spear, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened dragon knight: shining jade dragon armor with dragon-horn helmet, spear wrapped by a small coiling jade dragon spirit, wind ribbons and jade light aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (thrusting the spear forward)
Row 4 Skill: 4 frames (spinning the spear with a fiery sweep)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 마법사 (`mage`)

### ★★★★ 마스터 (Lv20) → `Unit_mage_base_t4.png`
```
Pixel art sprite sheet of a cute chibi girl mage with pink hair, a purple witch hat, purple robe and a wooden staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: grand archmage: midnight-blue robe full of star patterns, tall hat with a glowing crescent moon, floating spellbook, staff topped with a spinning galaxy orb, three orbiting runes.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a magic orb from the staff)
Row 4 Skill: 4 frames (raising the staff to summon a big magic circle)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_mage_base_t5.png`
```
Pixel art sprite sheet of a cute chibi girl mage with pink hair, a purple witch hat, purple robe and a wooden staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened celestial mage: robe made of starry night sky, floating crown of stars, staff topped with a small sun and moon, many orbiting glowing runes, cosmic purple aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a magic orb from the staff)
Row 4 Skill: 4 frames (raising the staff to summon a big magic circle)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 로그 (`rogue`)

### ★★★★ 마스터 (Lv20) → `Unit_rogue_base_t4.png`
```
Pixel art sprite sheet of a cute chibi rogue with white hair, a dark green hood, black leather armor and two daggers, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: phantom blade: dark emerald shadow armor, long smoky hooded cloak that fades into mist at the edges, twin glowing green daggers, glowing eyes under the hood.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (quick twin dagger slashes)
Row 4 Skill: 4 frames (vanishing dash with a shadow strike)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_rogue_base_t5.png`
```
Pixel art sprite sheet of a cute chibi rogue with white hair, a dark green hood, black leather armor and two daggers, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened shadow lord: sleek jet-black armor with glowing emerald lines, cloak of living shadow with green flames at the hem, twin long blades of green light, afterimage trail.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (quick twin dagger slashes)
Row 4 Skill: 4 frames (vanishing dash with a shadow strike)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 성직자 (`cleric`)

### ★★★★ 마스터 (Lv20) → `Unit_cleric_base_t4.png`
```
Pixel art sprite sheet of a cute chibi girl cleric with blonde hair, a white-and-blue nun habit and a golden cross staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: saint: shining white-and-gold vestments, large halo ring behind the head, small feathered wings, ornate cross staff emitting soft light rays, floating holy book.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (raising the staff to heal (no attack))
Row 4 Skill: 4 frames (casting a big healing light pillar)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_cleric_base_t5.png`
```
Pixel art sprite sheet of a cute chibi girl cleric with blonde hair, a white-and-blue nun habit and a golden cross staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened archangel priestess: radiant white-gold armor-robe, large glowing angel wings, bright double halo, staff with a shining star, soft rainbow light aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (raising the staff to heal (no attack))
Row 4 Skill: 4 frames (casting a big healing light pillar)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 흙마법사 (`earthmage`)

### ★★★★ 마스터 (Lv20) → `Unit_earthmage_base_t4.png`
```
Pixel art sprite sheet of a cute chibi boy earth mage with brown hair, a brown-olive robe and a wooden staff with an amber stone, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: titan sage: robe fused with crystal-studded rock armor, staff of carved stone with a large amber crystal, ring of orbiting crystal boulders, glowing amber runes on the arms.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a rock or vine spike forward)
Row 4 Skill: 4 frames (slamming the staff to raise earth spikes)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_earthmage_base_t5.png`
```
Pixel art sprite sheet of a cute chibi boy earth mage with brown hair, a brown-olive robe and a wooden staff with an amber stone, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened mountain titan: armored in floating crystal plates and runes, staff of living crystal, orbiting ring of glowing boulders, amber energy cracks, small floating rocks.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a rock or vine spike forward)
Row 4 Skill: 4 frames (slamming the staff to raise earth spikes)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 암흑마법사 (`darkmage`)

### ★★★★ 마스터 (Lv20) → `Unit_darkmage_base_t4.png`
```
Pixel art sprite sheet of a cute chibi girl dark mage in a purple hood and dark purple robe with a dark staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: void sorceress: black-violet robe with glowing violet runes, crown of dark horns, floating twin grimoires, staff holding a swirling void orb, violet flame aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a dark orb forward)
Row 4 Skill: 4 frames (opening a swirling black hole)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_darkmage_base_t5.png`
```
Pixel art sprite sheet of a cute chibi girl dark mage in a purple hood and dark purple robe with a dark staff, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened abyss queen: flowing robe of dark violet flames, crown of black crystal horns, glowing violet eyes, orbiting dark orbs and runes, black-violet aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (casting a dark orb forward)
Row 4 Skill: 4 frames (opening a swirling black hole)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 방패병 (`shield`)

### ★★★★ 마스터 (Lv20) → `Unit_shield_base_t4.png`
```
Pixel art sprite sheet of a cute chibi heavy shield bearer in steel armor with gold trims, a huge tower shield with a lion emblem and a flail, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: bastion guardian: gold-trimmed heavy plate with a lion-mane helmet, giant tower shield with a glowing golden lion face, heavy flail, faint golden barrier glow.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (bashing with the shield and swinging the flail)
Row 4 Skill: 4 frames (planting the shield with a golden barrier wave)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_shield_base_t5.png`
```
Pixel art sprite sheet of a cute chibi heavy shield bearer in steel armor with gold trims, a huge tower shield with a lion emblem and a flail, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened immortal guardian: shining golden aegis armor, giant shield with a glowing lion head and a golden barrier dome effect, heavy glowing flail, golden aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (bashing with the shield and swinging the flail)
Row 4 Skill: 4 frames (planting the shield with a golden barrier wave)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 기병 (`cavalry`)

### ★★★★ 마스터 (Lv20) → `Unit_cavalry_base_t4.png`
```
Pixel art sprite sheet of a cute chibi cavalry knight with a red plume, light armor and red cape riding a brown horse with a lance, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: storm dragoon: ornate black-and-crimson armor, armored warhorse with crimson barding and a small horn on its helm, long lance crackling with red lightning, flowing crimson cape.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (charging lance thrust)
Row 4 Skill: 4 frames (rearing horse with a powerful charge)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_cavalry_base_t5.png`
```
Pixel art sprite sheet of a cute chibi cavalry knight with a red plume, light armor and red cape riding a brown horse with a lance, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened thunder dragoon: black-gold armor with crimson energy lines, armored warhorse with glowing red eyes and a flaming mane, lance surrounded by red lightning, crimson aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (charging lance thrust)
Row 4 Skill: 4 frames (rearing horse with a powerful charge)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

## 대포병 (`cannon`)

### ★★★★ 마스터 (Lv20) → `Unit_cannon_base_t4.png`
```
Pixel art sprite sheet of a cute chibi cannoneer with aviator goggles, brown leather coat and a bronze cannon on wheels, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: grand artillerist: navy admiral coat with gold epaulettes, huge golden cannon shaped like a roaring lion on reinforced wheels, glowing orange fuse, gear-shaped goggles.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (firing the cannon with a blast)
Row 4 Skill: 4 frames (charging a big overheated shot with steam)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### ★★★★★ 각성 (Lv30) → `Unit_cannon_base_t5.png`
```
Pixel art sprite sheet of a cute chibi cannoneer with aviator goggles, brown leather coat and a bronze cannon on wheels, for a 2D side-scrolling tower defense game, facing RIGHT. SAME character as the attached reference images (same face, same chibi proportions, same art style), evolved further: awakened siege master: golden steampunk armor coat, enormous ornate golden dragon-mouth cannon with glowing barrel runes, small floating gears, orange energy aura.

Layout: 5 rows on a plain dark navy background (#1a2133), each row clearly separated with generous empty space between frames, same character size and same ground line in every frame:
Row 1 Idle: 4 frames (breathing)
Row 2 Walk: 6 frames (walking forward)
Row 3 Attack: 5 frames (firing the cannon with a blast)
Row 4 Skill: 4 frames (charging a big overheated shot with steam)
Row 5 Death: 4 frames (falls down)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions (big head), identical style to the reference. Keep the character the SAME SIZE as the reference (only slightly bigger at most) - the extra glory comes from armor, effects and colors, not from size. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 🗿 설치물 진화 (지금은 진화해도 모습이 같음)
- 참고 이미지: 지금 그림 `images/image/totems/Totem_*.png`. 배치는 1차와 같은 **6칸 × 4줄** 격자(자르는 도구 `tools/extract_grid.py`가 그대로 씀).

### 🐔 알 대포 ★★ (Lv5) → `Totem_egg_cannon_t2.png`
```
Pixel art sprite sheet of a cute stationary "egg cannon chicken" turret, facing RIGHT. A plump chubby white hen with a red comb sitting inside a small wooden cannon barrel on wooden wheels, determined cute face. SAME totem as the attached reference (same face, same proportions, same cute style), upgraded: the barrel is now reinforced iron with brass bands, the hen wears a tiny aviator cap and goggles, sturdier wheels. For a 2D side-scrolling tower defense game.

Layout: 4 rows on a plain dark navy background (#1a2133), 6 equal columns per row (unused cells empty), each frame clearly separated, same size and same ground line in every frame:
Row 1 Appear: 4 frames (pops out of the ground in a puff of dust and feathers)
Row 2 Idle: 4 frames (blinking, wings fluttering, barrel bobbing)
Row 3 Attack: 5 frames (leans back and FIRES an egg forward to the right, small puff)
Row 4 Vanish: 4 frames (poof into feathers and disappears)
Also draw ONE extra small egg projectile in the 6th cell of row 3 (separated, used as the bullet).

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. Keep the SAME SIZE as the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🐔 알 대포 ★★★ (Lv10) → `Totem_egg_cannon_t3.png`
```
Pixel art sprite sheet of a cute stationary "egg cannon chicken" turret, facing RIGHT. A plump chubby white hen with a red comb sitting inside a small wooden cannon barrel on wooden wheels, determined cute face. SAME totem as the attached reference (same face, same proportions, same cute style), champion: golden cannon barrel with a crown-shaped muzzle, the hen wears a tiny gold crown and a red cape, glowing golden eggs. For a 2D side-scrolling tower defense game.

Layout: 4 rows on a plain dark navy background (#1a2133), 6 equal columns per row (unused cells empty), each frame clearly separated, same size and same ground line in every frame:
Row 1 Appear: 4 frames (pops out of the ground in a puff of dust and feathers)
Row 2 Idle: 4 frames (blinking, wings fluttering, barrel bobbing)
Row 3 Attack: 5 frames (leans back and FIRES an egg forward to the right, small puff)
Row 4 Vanish: 4 frames (poof into feathers and disappears)
Also draw ONE extra small egg projectile in the 6th cell of row 3 (separated, used as the bullet).

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. Keep the SAME SIZE as the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🔥 화염 토템 ★★ (Lv5) → `Totem_fire_t2.png`
```
Pixel art sprite sheet of a cute stationary "fire totem", facing RIGHT. A short carved wooden totem pole with a grinning tribal fire-spirit face, red and orange painted patterns, and a small bowl of flame burning on top. SAME totem as the attached reference (same face, same proportions, same cute style), upgraded: dark stone totem with glowing orange cracks, two small horns, a bigger flame on top and small fire runes. For a 2D side-scrolling tower defense game.

Layout: 4 rows on a plain dark navy background (#1a2133), 6 equal columns per row (unused cells empty), each frame clearly separated, same size and same ground line in every frame:
Row 1 Appear: 4 frames (rises out of the ground, flame ignites)
Row 2 Idle: 4 frames (flame flickering, face glowing)
Row 3 Attack: 5 frames (mouth opens and a ring of fire bursts outward around it)
Row 4 Vanish: 4 frames (flame goes out, crumbles into embers and ash)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. Keep the SAME SIZE as the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🔥 화염 토템 ★★★ (Lv10) → `Totem_fire_t3.png`
```
Pixel art sprite sheet of a cute stationary "fire totem", facing RIGHT. A short carved wooden totem pole with a grinning tribal fire-spirit face, red and orange painted patterns, and a small bowl of flame burning on top. SAME totem as the attached reference (same face, same proportions, same cute style), champion: obsidian-and-gold totem with a fierce glowing face, a blue-white flame crown on top, floating ember rings. For a 2D side-scrolling tower defense game.

Layout: 4 rows on a plain dark navy background (#1a2133), 6 equal columns per row (unused cells empty), each frame clearly separated, same size and same ground line in every frame:
Row 1 Appear: 4 frames (rises out of the ground, flame ignites)
Row 2 Idle: 4 frames (flame flickering, face glowing)
Row 3 Attack: 5 frames (mouth opens and a ring of fire bursts outward around it)
Row 4 Vanish: 4 frames (flame goes out, crumbles into embers and ash)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. Keep the SAME SIZE as the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🌿 회복 토템 ★★ (Lv5) → `Totem_heal_t2.png`
```
Pixel art sprite sheet of a cute stationary "healing totem", facing RIGHT. A small living tree-stump totem with a gentle smiling face, sprouting leaves and pink flowers on top, a glowing green crystal in its chest. SAME totem as the attached reference (same face, same proportions, same cute style), upgraded: taller blossoming tree totem with more pink flowers, a larger glowing crystal, small fireflies around it. For a 2D side-scrolling tower defense game.

Layout: 4 rows on a plain dark navy background (#1a2133), 6 equal columns per row (unused cells empty), each frame clearly separated, same size and same ground line in every frame:
Row 1 Appear: 4 frames (sprouts from the ground, leaves unfold)
Row 2 Idle: 4 frames (leaves swaying, crystal softly pulsing)
Row 3 Heal: 5 frames (raises leafy arms, a soft green light wave with tiny plus signs spreads outward)
Row 4 Vanish: 4 frames (wilts and sinks back into the ground with falling petals)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. Keep the SAME SIZE as the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

### 🌿 회복 토템 ★★★ (Lv10) → `Totem_heal_t3.png`
```
Pixel art sprite sheet of a cute stationary "healing totem", facing RIGHT. A small living tree-stump totem with a gentle smiling face, sprouting leaves and pink flowers on top, a glowing green crystal in its chest. SAME totem as the attached reference (same face, same proportions, same cute style), champion: sacred white-bark tree totem with golden leaves and a radiant green crystal heart, small halo of light and floating petals. For a 2D side-scrolling tower defense game.

Layout: 4 rows on a plain dark navy background (#1a2133), 6 equal columns per row (unused cells empty), each frame clearly separated, same size and same ground line in every frame:
Row 1 Appear: 4 frames (sprouts from the ground, leaves unfold)
Row 2 Idle: 4 frames (leaves swaying, crystal softly pulsing)
Row 3 Heal: 5 frames (raises leafy arms, a soft green light wave with tiny plus signs spreads outward)
Row 4 Vanish: 4 frames (wilts and sinks back into the ground with falling petals)

Style: crisp 32-bit pixel art, bold dark outlines, bright saturated colors, chibi proportions, expressive face, soft shading. Keep the SAME SIZE as the reference. No text, no labels, no UI, no shadows on the background, no overlapping between frames. 1448x1086 PNG.
```

---

## 🔧 받은 뒤 Claude가 할 일
1. 유닛: `tools/sprites.config.json`에 `<유닛>_t4`·`<유닛>_t5` 등록 → `tools/extract_sprites.py`로 잘라 `public/sprites/`(1차와 같은 방식)
2. 설치물: `tools/extract_grid.py`에 `totem_*_t2`·`_t3` 추가
3. 진화 단계 그림 자동 선택(`evolvedKey`)이라 코드 수정 없음 → 강화 화면·전투에서 확인 → 커밋·배포
