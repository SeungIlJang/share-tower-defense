# 라인 디펜스 — Play 스토어 등록 문구

- 패키지명: `com.moduseries.linedefense` · 퍼블리셔: 모두의시리즈 · 카테고리: 게임 > 전략(또는 캐주얼)
- AAB: `releases/linedefense-v1c1.aab` (versionCode 1 / versionName 1.0, 서명됨 CN=Moduseries)
- 서명 키: `C:\dev\keystores\linedefense-upload.jks` (alias `linedefense`) — ⚠️ repo에 커밋 금지, 백업 필수
- 아이콘 512: `store-assets/icon-512.png` · 피처: `store-assets/feature-1024x500.png` · 스크린샷: `store-assets/shot*.png`
- 개인정보처리방침 URL: `https://seungiljang.github.io/games/linedefense-privacy.html`
- 빌드: OTA형(앱이 seungiljang.github.io/games/linedefense/ 로드) → 게임 수정은 games 레포 푸시로 즉시 반영
- ⚠️ 광고: 현재 **테스트 광고(구글 테스트 ID, `src/systems/ads.ts` USE_TEST_ADS=true)**. 실수익화하려면 AdMob에 "라인 디펜스" 앱 생성 → 실제 리워드 광고단위 ID를 `PROD_REWARD_ANDROID`에 넣고 `USE_TEST_ADS=false`로 바꾼 뒤 재빌드.
- ⚠️ 데이터 안전성(Play Console): 광고 식별자 수집 "예"(AdMob), 개인식별정보 수집 "아니오"로 신고.

---

## 🇰🇷 한국어

### 앱 이름 (최대 30자)
라인 디펜스

### 간단한 설명 (최대 80자)
리듬에 맞춰 병사를 소환하고 라인을 지켜라! 손맛 가득한 라인 디펜스 ⚔️

### 자세한 설명 (최대 4000자)
◆ 라인 디펜스 ◆
밀려오는 적을 막고 적 기지를 부숴라! 한 손으로 즐기는 캐주얼 라인 디펜스.

병사·궁수·기사·창병·마법사를 소환해 전선을 밀어붙이세요. 핵심은 **리듬 소환** — 소환 바의 초록 존에 타이밍을 맞춰 탭하면 유닛이 더 강하게 등장합니다(PERFECT!). 단순한 탭에 타이밍의 손맛을 더한 이 게임만의 재미예요.

전투 중에는 골드로 유닛을 즉석 강화하고, 레벨업마다 스킬을 골라 내 전략을 완성하세요. 각 관문의 마지막엔 거대한 보스가 등장합니다. 막아낼 수 있을까요?

■ 이렇게 즐겨요
· 리듬 소환 — 타이밍 맞춰 탭하면 강화 소환(PERFECT)
· 다섯 유닛 — 근접·원거리·마법까지 조합
· 전장 실시간 강화 + 레벨업 스킬 선택(로그라이트)
· 거대 보스 스테이지
· 일일 출석 + 방치(오프라인) 보상으로 매일 성장
· 광고 보고 부활·골드 2배 등 선택형 보상

■ 이런 분께
· 짧고 전략적인 디펜스를 찾는 분
· 타이밍 손맛을 좋아하는 분
· 자투리 시간에 성장하는 재미를 원하는 분

지금 바로 라인을 지켜라! ⚔️🛡️

* 온라인 연결이 필요합니다.

---

## 🇺🇸 English

### App name (max 30)
Line Defense

### Short description (max 80)
Summon to the beat and hold the line! A snappy casual line-defense game ⚔️

### Full description (max 4000)
◆ Line Defense ◆
Stop the incoming horde and crush the enemy base! A one-handed casual line-defense game.

Summon soldiers, archers, knights, spearmen and mages to push the front line. The twist is **Rhythm Summon** — tap in time with the green zone of the summon bar to deploy stronger units (PERFECT!). Simple taps with a satisfying sense of timing — that's what makes this game special.

Upgrade your units mid-battle with gold, and pick a skill on every level-up to shape your strategy. A giant boss waits at the end of each stage. Can you hold?

■ Features
· Rhythm Summon — tap on beat for buffed units
· Five unit types — melee, ranged and magic
· Real-time battlefield upgrades + roguelite level-up skills
· Giant boss stages
· Daily check-in + idle (offline) rewards
· Optional rewarded ads: revive, double gold

Hold the line now! ⚔️🛡️

* Requires an internet connection.

---

## 📋 Play Console 릴리스 노트 (복사해서 붙여넣기)

```
[한국어]
라인 디펜스 첫 출시! ⚔️
· 리듬 소환 — 타이밍 맞춰 탭하면 강화 소환(PERFECT)
· 5종 유닛 + 전장 실시간 강화 + 레벨업 스킬
· 보스 스테이지
· 일일 출석 & 방치(오프라인) 보상
· 광고 보상(부활·골드 2배)
한 손으로 즐기는 캐주얼 라인 디펜스, 지금 라인을 지켜라!

[English]
Line Defense is here! ⚔️
· Rhythm Summon — tap on beat for buffed units (PERFECT)
· 5 unit types + real-time upgrades + level-up skills
· Boss stages
· Daily check-in & idle (offline) rewards
· Rewarded ads (revive, double gold)
A one-handed casual line-defense game — hold the line!
```
