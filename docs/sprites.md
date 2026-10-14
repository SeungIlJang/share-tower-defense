# 스프라이트 추가하기

`public/sprites/` 에 시트 PNG를 넣고 `public/sprites/manifest.json` 에 등록하면 끝.
등록 안 된 유닛/적은 기존 벡터 도형(`src/entities/visuals.ts`)으로 그려지므로 한 종씩 교체 가능.

## 시트 규칙
- **오른쪽을 바라보게** 그린다 (적은 코드에서 좌우 반전).
- 모든 프레임은 같은 크기의 격자(frameWidth × frameHeight), 배경 투명 PNG.
- 프레임 index는 좌→우, 위→아래 순서 (0부터).
- 캐릭터 발바닥 위치를 모든 프레임에서 같은 높이로 맞춘다 → 그 높이가 `footY`.

## manifest.json 예시
```json
{
  "soldier": {
    "file": "soldier.png",
    "frameWidth": 32,
    "frameHeight": 32,
    "scale": 2,
    "footY": 30,
    "anims": {
      "idle":   { "frames": [0, 1, 2, 3], "fps": 6 },
      "walk":   { "frames": [4, 5, 6, 7], "fps": 10 },
      "attack": { "frames": [8, 9, 10, 11], "fps": 14 },
      "death":  { "frames": [12, 13, 14, 15], "fps": 10 }
    }
  }
}
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `file` | ✅ | `public/sprites/` 기준 경로 |
| `frameWidth`, `frameHeight` | ✅ | 한 프레임 크기(px, 정수) |
| `anims.idle` | ✅ | 대기. 정지 이미지 1장이면 `"frames": [0]` |
| `anims.walk` / `attack` / `death` | | 없으면 walk·attack은 idle 유지(공격은 기존 찌르기 모션), death는 파티클만 |
| `scale` | | 표시 배율, 기본 2. 32px 도트 → 2~3, 128px 고해상도 → 0.4~0.5 |
| `footY` | | 프레임 상단~발바닥 px(원본 기준), 기본 = frameHeight |
| `filter` | | `nearest`(확대 도트, 선명) / `linear`(축소 시 부드럽게). 기본: scale ≥ 1이면 nearest |
| `crop` | | (정지 이미지) 큰 그림에서 영역만 `[x0, y0, x1, y1]` — 배경이 불투명하면 테두리 색 자동 제거. `"holes": true`면 다리 사이 같은 안쪽 배경 구멍도 제거 |
| `fps` | | 기본 8 |

키 이름은 `src/data/units.json`, `enemies.json` 의 타입명(`soldier`, `archer`, `knight`, `spear`, `mage`, `goblin`, `orc`, `wolf`, `slime`, `bat`, `ogre`)과 같아야 한다.
`_` 로 시작하는 키는 메모로 무시된다. 형식 오류는 브라우저 콘솔에 `[sprites]` 경고로 표시되고 해당 타입만 벡터로 폴백.

## AI 생성 시트 자동 변환 (`tools/extract_sprites.py`)

어두운 배경에 행별(Idle/Walk/Attack/Hit/Dead…)로 그려진 캐릭터 시트를 투명 스프라이트시트로 바꾸고
`manifest.json` 항목까지 써 준다. 정지 이미지(투명 PNG)도 등록 가능.

```bash
python tools/extract_sprites.py tools/sprites.config.json --preview preview.png
```

- 설정은 `tools/sprites.config.json` — `rows`는 `[상태, 시트의 몇 번째 행(0부터), 프레임 수]`, `height`는 게임 속 키(px).
- 그림이 왼쪽을 보고 있으면 `"mirror": true` (게임은 오른쪽을 보는 그림 기준).
- 프레임 수가 예상과 다르면 `!` 경고가 나온다. `--preview` 이미지로 결과를 꼭 눈으로 확인.
- 필요 패키지: Pillow, numpy, scipy.

## 기지(타워) 이미지

키 이름 `base_ally`(왼쪽 우리 기지), `base_enemy`(오른쪽 적 기지). 없으면 기존 사각형.
기지는 **좌우 반전하지 않으므로** 적 타워는 왼쪽을 보게 그린다(필요하면 `"mirror": true`).

프레임이 여러 장이면 **파손 단계** — 첫 장=멀쩡, 마지막=거의 무너짐. HP 구간을 균등 분할해 교체
(3장: 100~67% / 67~33% / 33% 이하). 부활로 HP가 차면 다시 멀쩡한 모습으로.

`tools/sprites.config.json` 예시 (흰 배경 이미지도 자동으로 배경 제거):
```json
"base_ally":  { "images": ["tower/ally_0.png", "tower/ally_1.png", "tower/ally_2.png"], "height": 130 },
"base_enemy": { "image": "tower/enemy.png", "height": 130 }
```
`height`는 게임 속 키(px). 기존 사각형 기지는 110px.

한 장에 여러 단계를 그린 시트라면 `crops`로 영역을 나눠 자른다(현재 설정이 이 방식 — 원본 `art/tower_damage_stages_sheet.png`):
```json
"base_ally": {
  "image": "../art/tower_damage_stages_sheet.png",
  "crops": [[116, 0, 428, 527], [559, 0, 890, 527], [984, 0, 1404, 527]],
  "anchors": [315, 762, 1121],
  "keep_all": true,
  "height": 130
}
```
- `crops`: 원본에서 자를 영역 `[x0, y0, x1, y1]` 목록 — 한 영역 = 한 프레임
- `anchors`: 프레임마다 "같은 자리"인 원본 x좌표(아군=문 중앙, 적=횃불). 연기·잔해로 폭이 달라져도 탑이 단계마다 튀지 않게 맞춤. 없으면 가운데 정렬
- `keep_all`: 떨어져 있는 조각(연기 등)도 유지. 기본은 가장 큰 덩어리만 남김
- `resolution`: 게임 표시 크기의 몇 배로 저장할지(예: `2`). 큰 원본을 미리 줄여 용량 절약
- `palette`: `true`면 256색 PNG로 저장 — 눈으로는 같고 용량은 몇 분의 1 (타워 1.2MB → 약 0.1MB)
