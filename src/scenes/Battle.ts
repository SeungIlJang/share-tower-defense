import Phaser from 'phaser';
import unitsData from '../data/units.json';
import enemiesData from '../data/enemies.json';
import type { UnitStats, EnemyStats, StageData } from '../types';
import { Unit } from '../entities/Unit';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Base } from '../entities/Base';
import { UNIT_SCALE } from '../entities/Fighter';
import { FOOD_BASE, energyMax, energyRate, popBonus } from '../systems/baseUpgrades';
import { summonCooldown } from '../systems/pacing';
import { anyDevFlag, devFlags } from '../systems/dev';
import { UNIT_TIERS, unitTier } from '../systems/evolution';
import { enemyLevel, hexColor, pickVariant, variantTable } from '../systems/enemyVariants';
import { STAGES, WORLDS, goldMultFor } from '../systems/worlds';
import { BOSSES, BOSS_KEYS, bossForStage } from '../systems/bosses';
import { COUNTER_MULT, DECK_SIZE, counterMult, enemyKind, UNIT_COUNTER, type EnemyKind } from '../systems/counters';
import { dailyBonus, dailyRule, dailyStage, dailyStageId, dailyUnits, type DailyRule } from '../systems/daily';
import { chestForEndless, chestForStage, rankMult, rollChest, type ChestLoot } from '../systems/chests';
import { VOLLEY_CD, VOLLEY_MAX, VOLLEY_MULT, VOLLEY_NAMES, castleArchers, ALLY_CASTLE_TIERS, ENEMY_CASTLE_TIERS, allyCastleGun, allyCastleTier, castleHpMult, castleLook, castleTarget, enemyCastleGun, enemyCastleTier, type CastleShot } from '../systems/castle';
import { HERO_TYPE, HERO_TIERS, HERO_FALLBACK_LOOKS, heroTier, heroBodyScale, HERO_REGEN, HERO_SKILLS, AURA_ATK, AURA_GUARD, AURA_RADIUS, MANA_MAX, MANA_REGEN, MANA_START, MACE_MULT, MACE_RANGE, RALLY_SEC, RALLY_SPEED, HOLY_HEAL, HOLY_HERO_HEAL, HOLY_PUSH, HERO_ENEMY_HP, heroStats, heroLvMult, heroMoveRange, HERO_DRAG_MULT, heroSkillPower, auraRadius, inAura, maceTargets, stepToward } from '../systems/hero';
import { HERO_PANEL_X, HERO_BTN_R, HERO_BTN_Y } from '../ui/Hud';
import { Pool } from '../utils/pool';
import { ResourceSystem } from '../systems/resources';
import { WaveSystem } from '../systems/waves';
import { computeDamage, attackCooldown, inRange } from '../systems/combat';
import { meta, applyUpgrade } from '../systems/upgrades';
import { xpToNext, hasteMult, mimicMult, magicMult, supplyBonus, anyUpgradable, rollChoices, awakened, SKILL_BY_KEY, vigorMult, rechargeMult, powerMult, critChance, chargeMult, type SkillDef } from '../systems/skills';
import { Hud } from '../ui/Hud';
import { LevelUpOverlay } from '../ui/LevelUp';
import { TipPointer } from '../ui/Tutorial';
import { fxWarning, playFx, resetFx, type FxKey } from '../systems/fx';
import { KNOCK_MS, KNOCK_PX, knockChance } from '../systems/knockdown';
import { HERO_WEAPONS, burnMult, chainCount, frostSec, goldMaceMult, ringMult, ringPct, rollEquip, scepterHeal, weaponPower, type RingKey } from '../systems/equipment';
import { TOTEMS, TOTEM_LIFE, isTotem, totemHeal, totemX } from '../systems/totems';
import { LOOK_HOLD, SCREEN_W, followX, walkMult, worldWidth } from '../systems/camera';
import { RULE_INFO, targetBonus, targetTime, WAGON_BLOCK, WAGON_SPEED, breachGoal, holdProdMult, holdSeconds, stageRule, wagonHp, type StageRule } from '../systems/stageRules';
import { HERO_TIP_STAGE, TIP_TEXT, featureOn, nextTip, reachedStage, type Feature, type TipKey } from '../systems/tutorial';
import { showRewarded } from '../systems/ads';
import {
  UNIT_SKILLS,
  isSkillSwing,
  AURA_SKILL_POWER,
  skillMult,
  SINGLE_BONUS,
  GUARD_SEC as SKILL_GUARD_SEC,
  SLOW_SEC,
  PULL_PX,
  PUSH_PX,
  DASH_PX,
  PIERCE_MAX,
} from '../systems/unitSkills';
import { animKey, spriteOf, textureKey } from '../systems/sprites';
import { ensureHue, ensureSkin } from '../systems/skinTextures';
import { sfx, bgm, setMute } from '../systems/sound';
import { starsFor, STAR_GOLD } from '../systems/stars';
import { activeSynergies, synergyMult, type Synergy } from '../systems/synergy';
import type { Stats } from '../systems/missions';
import { endlessStage, endlessWaveAt, endlessMult, endlessReward } from '../systems/endless';

/** 배경 색(하늘 · 레인 · 레인 선) — 월드·모드별 */
const THEMES = {
  forest: [0x121826, 0x1d2740, 0x33406a],
  desert: [0x2a1f18, 0x4a3826, 0x7a5a36],
  endless: [0x1a1428, 0x2e2448, 0x5a4a8a],
} as const;

const ELITE_CHANCE = 0.08; // 일반 적이 엘리트로 나올 확률(2스테이지부터)
const EVENT_FIRST = 35; // 특수 웨이브 첫 발생(초)
const EVENT_EVERY = 40; // 이후 간격(초)
const STUN_TINT = 0x9a9a9a;

const CRIT_MULT = 1.5; // 치명타 배수(확률은 skills.critChance — 기본 10%)
const CRIT_MULT_AWAKE = 2.25; // 🎯 일격필살 각성
import {
  WEAPONS,
  WeaponCharge,
  meteorTarget,
  lightningTargets,
  snipeTarget,
  METEOR_DAMAGE,
  METEOR_RADIUS,
  ARROWS_DAMAGE,
  LIGHTNING_DAMAGE,
  HEAL_UNIT_RATIO,
  HEAL_BASE_RATIO,
  SHOCKWAVE_RANGE,
  SHOCKWAVE_PUSH,
  SHOCKWAVE_DAMAGE,
  FREEZE_SEC,
  GUARD_SEC,
  BERSERK_SEC,
  BERSERK_ATK,
  BERSERK_COOLDOWN,
  SNIPE_DAMAGE,
  weaponPowerMult,
  weaponChargeMult,
  weaponDurationMult,
} from '../systems/weapons';

// 원거리 유닛: 투사체 모양 · 명중 시 범위 피해 배율(없으면 단일)
const ORB_UNITS = new Set(['mage', 'earthmage', 'darkmage', 'cannon', 'goblin_shaman', 'necromancer', 'banshee', 'baby_dragon']);
const SPLASH: Record<string, number> = { mage: 0.6, earthmage: 0.8, cannon: 0.9 };
const ORB_COLOR: Record<string, number> = { earthmage: 0xd8903a, darkmage: 0x6a2aff, cannon: 0x2a2e36, goblin_shaman: 0xc88aff, necromancer: 0x8a3aff, banshee: 0xff8ad8, baby_dragon: 0xff6a2a };
const CLERIC_HEAL_MULT = 2.5; // 성직자 1회 치유량 = 공격력 × 2.5

const FROZEN_TINT = 0x7cd8ff;
const GUARD_TINT = 0xb0c4ff;
const BERSERK_TINT = 0xff9a9a;

const PROD_TYPES = ['goblin', 'wolf', 'slime', 'bat']; // 적 기지가 계속 생산하는 병력
const BOSS = BOSS_KEYS; // 👑 보스 타입(골렘·드래곤 + 월드 보스 8종)

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;
const VARIANTS = variantTable(ENEMIES); // 👾 기본 적 → 변종
// 관문 100개(1~20 직접 만든 관문 + 21~100 자동 생성)

const LANE_Y = 340; // 하단 HUD 2단(유닛 카드 + 특수 무기, 410~) 위 전장 바닥
const REACH = 14 * (UNIT_SCALE - 1) * 2; // 커진 몸집만큼 사거리 여유(겹침 방지)
const BASE_REACH = REACH + 40; // 커진 기지 앞에서 멈춤
const BASE_STOP = 55; // 성을 이보다 더 넘어갈 수 없음(성 중심 기준)
const BASE_FRONT = 75; // 성 앞(등장 위치·밀쳐내기 한계) — 성 중심에서 이만큼

export class BattleScene extends Phaser.Scene {
  private stage!: StageData;
  private energy!: ResourceSystem;
  private runGold = 0;
  private battleUpg: Record<string, number> = {}; // 전장 실시간 강화 레벨
  private waves!: WaveSystem;
  private hud!: Hud;
  private playerBase!: Base;
  private enemyBase!: Base;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossFill!: Phaser.GameObjects.Rectangle;
  private bossText!: Phaser.GameObjects.Text;

  private unitPool!: Pool<Unit>;
  private enemyPool!: Pool<Enemy>;
  private projPool!: Pool<Projectile>;
  private units: Unit[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private over = false;
  private paused = false; // ⏸️ 일시정지
  private pauseLayer: Phaser.GameObjects.Container | null = null;
  private reviving = false; // 부활 제안 중(업데이트 정지)
  private revivedOnce = false; // 한 판에 광고 부활 1회
  // 레벨업 스킬(한 판 로그라이트)
  private level = 1;
  private xp = 0;
  private rerolls = 1; // 🎲 레벨업 다시 뽑기(한 판 1회)
  private choices: SkillDef[] = []; // 지금 보여 주는 레벨업 후보
  private freeSummons = 0; // 🎁 무료 소환 남은 횟수
  private summonCount = 0; // 💎 마나 순환(5번째마다 공짜)
  private summonCd: Record<string, number> = {}; // ⏱️ 유닛별 소환 대기(남은 초)
  private hero!: Unit; // 👑 영웅(쓰러지면 패배)
  private heroTarget: number | null = null; // 탭한 이동 목표 x
  private heroDir = 0; // 키보드 A/D 이동(-1/0/1)
  private heroDrag: { px: number; hx: number } | null = null; // 손가락 끌기 시작(손가락 x · 영웅 x)
  private aura!: Phaser.GameObjects.Container; // ⭕ 오라 원
  private mana!: ResourceSystem; // 💧 영웅 스킬 전용
  private heroCd: number[] = []; // 영웅 스킬별 남은 대기(초)
  private rallyUntil = 0; // 📯 돌격 함성 끝나는 시각(clock)
  private allyGunT = 0; // 🏰 우리 성 다음 발사까지(초)
  private enemyGunT = 0;
  private enemyTier = 0; // 🏰 적 성 단계(0~4)
  private archers: { ally: Phaser.GameObjects.Sprite[]; enemy: Phaser.GameObjects.Sprite[] } = { ally: [], enemy: [] }; // 성벽 궁수
  private shooterIdx = 0;
  private volleyT = 0; // 🎯 성 특수 공격 남은 대기(초)
  private volleyGauge!: Phaser.GameObjects.Graphics;
  private volleyIcon!: Phaser.GameObjects.Text;
  private xpNext = xpToNext(1);
  private skills: Record<string, number> = {};
  private picking = false;
  private levelUp!: LevelUpOverlay;
  // 🎓 첫 경험 — 관문마다 하나씩 열리는 기능 + 👆 손가락 안내
  private feat: Record<Feature, boolean> = { heroSkill: true, weapon: true, prepare: true, volley: true, levelup: true, perfect: true };
  private reached = 1;
  private tip!: TipPointer;
  private usedUnits: Record<string, number> = {}; // 🎁 이번 판 유닛별 소환 수(상자 조각 비율)
  private deck: string[] = []; // ⚔️ 출전 덱
  private rule: DailyRule | null = null; // 📅 오늘의 도전 규칙
  // 🎯 특수 관문 — 🛒 호위(마차) · 🏰 수성(시간) · 🏃 돌파(결승선)
  private sRule: StageRule = 'normal';
  private wagon: Unit | null = null;
  private holdLeft = 0;
  private goals = 0;
  private goalNeed = 0;
  private objText: Phaser.GameObjects.Text | null = null;
  // 🎥 넓은 전장 + 카메라(영웅 따라가기 · 지도로 둘러보기 · 화면 밖 알림)
  private worldW = SCREEN_W;
  private walkK = 1;
  private lookX: number | null = null; // 둘러보는 중이면 카메라 왼쪽 끝
  private lookT = 0;
  private homeBtn!: Phaser.GameObjects.Text;
  private alertL!: Phaser.GameObjects.Text;
  private alertR!: Phaser.GameObjects.Text;
  private lastBaseHp = 0;
  private baseHitAt = -99;
  private uiQueue: Phaser.GameObjects.GameObject[] = [];
  private totemEnd = new Map<Unit, number>(); // 🗿 설치물 사라지는 시각(clock)
  private burns: { x: number; until: number; dmg: number; t: number }[] = []; // 🔥 화염 메이스 불바다
  private uiConts = new Set<Phaser.GameObjects.Container>();
  private counterFxT = 0; // '효과적!' 표시 간격
  private kills: Record<string, number> = {}; // 📖 이번 판 적별 처치
  private metNew = new Set<string>(); // 📖 이번 판에 '새 몬스터!' 알린 적
  private prodTimer = 0; // 적 기지 생산 타이머
  private prodInterval = 4; // 생산 간격(초)
  private prodIdx = 0;
  private looks: Record<string, string> = {}; // 👗 유닛별 착용 스킨 텍스처 이름
  // ♾️ 무한 모드
  private endless = false;
  private waveNo = 0;
  private waveText: Phaser.GameObjects.Text | null = null;
  // 🤝 조합 · 📋 이번 판 기록 · 🌊 특수 웨이브
  private synergies: Synergy[] = [];
  private synergyKeys = '';
  private run: Stats = {};
  private eventT = EVENT_FIRST;
  private committed = false;
  // ⏩ 배속(×1/×2, 판이 바뀌어도 유지) · 보스 처치 슬로모션
  private static speed = 1;
  private slowmo = 1;
  private speedBtn!: Phaser.GameObjects.Text;
  // 🔥 특수 무기 — 게이지(해금된 것만) + 효과 지속 시각(전투 시계 기준)
  private weapons: (WeaponCharge | null)[] = []; // 구매 안 한 무기 = null
  private clock = 0;
  private frozenUntil = 0;
  private guardUntil = 0;
  private berserkUntil = 0;
  // ⏱️ 리듬 소환
  private beat = 0;
  private beatDir = 1;
  private static readonly BEAT_SPEED = 0.85;
  private static readonly PERFECT_WIN = 0.08;
  private static readonly RANGED = 100; // 사거리 이 이상이면 투사체 발사

  constructor() {
    super('Battle');
  }

  init(data: { stageId: number; mode?: 'endless' | 'daily' }): void {
    this.endless = data.mode === 'endless';
    this.stage = this.endless ? endlessStage() : STAGES.find((s) => s.id === data.stageId) ?? STAGES[0];
    // 📅 오늘의 도전 — 오늘 규칙 + 깬 관문 근처
    this.rule = data.mode === 'daily' ? dailyRule(meta.today()) : null;
    if (this.rule) this.stage = dailyStage(STAGES.find((s) => s.id === dailyStageId(meta.today(), meta.clearedMax)) ?? STAGES[2], this.rule);
  }

  /** 🌄 전장 배경 — 하늘 그라데이션 · 달 · 별 · 먼 언덕 2겹(위쪽 빈 공간 채우기) */
  private drawBackdrop(sky: number, lane: number, line: number): void {
    const mix = (a: number, b: number, t: number): number => {
      const ca = Phaser.Display.Color.IntegerToColor(a);
      const cb = Phaser.Display.Color.IntegerToColor(b);
      return Phaser.Display.Color.GetColor(ca.red + (cb.red - ca.red) * t, ca.green + (cb.green - ca.green) * t, ca.blue + (cb.blue - ca.blue) * t);
    };
    // 🎥 원근감 3겹 — 하늘·달(고정) / 먼 언덕(0.3배 속도) / 가까운 언덕(0.6배 속도)
    const g = this.add.graphics().setDepth(-9).setScrollFactor(0);
    const horizon = mix(sky, line, 0.55);
    g.fillGradientStyle(sky, sky, horizon, horizon, 1);
    g.fillRect(0, 44, 1280, LANE_Y - 44);
    // 달
    g.fillStyle(0xfff4c8, 0.12);
    g.fillCircle(980, 130, 58);
    g.fillStyle(0xfff4c8, 0.85);
    g.fillCircle(980, 130, 34);
    // 먼 언덕(뒤) → 가까운 언덕(앞) — 느리게 움직이는 겹일수록 좁게 그려도 됨
    const hills = (baseY: number, amp: number, color: number, seed: number, f: number): void => {
      const h = this.add.graphics().setDepth(-9).setScrollFactor(f, 1);
      const w = 1280 + (this.worldW - 1280) * f;
      h.fillStyle(color, 1);
      h.beginPath();
      h.moveTo(0, LANE_Y);
      for (let x = 0; x <= w; x += 20) h.lineTo(x, baseY - amp * (0.55 + 0.45 * Math.sin(x / 140 + seed) * Math.cos(x / 310 + seed * 2)));
      h.lineTo(w, LANE_Y);
      h.closePath();
      h.fillPath();
    };
    hills(LANE_Y - 120, 90, mix(sky, line, 0.35), 1.3, 0.3);
    hills(LANE_Y - 40, 70, mix(sky, lane, 0.8), 4.1, 0.6);
    // 반짝이는 별(하늘과 함께 고정)
    for (let i = 0; i < 26; i++) {
      const st = this.add.circle(Phaser.Math.Between(10, 1270), Phaser.Math.Between(56, LANE_Y - 170), Phaser.Math.FloatBetween(1, 2.4), 0xffffff, 0.8).setDepth(-8).setScrollFactor(0);
      this.tweens.add({ targets: st, alpha: 0.15, duration: Phaser.Math.Between(900, 2200), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
    }
  }

  create(): void {
    this.over = false;
    resetFx();
    this.totemEnd = new Map();
    this.burns = [];
    this.pinUiSetup();
    this.paused = false;
    this.pauseLayer = null;
    this.reviving = false;
    this.revivedOnce = false;
    this.units = [];
    this.enemies = [];
    this.projectiles = [];
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpToNext(1);
    this.skills = {};
    this.rerolls = 1;
    this.choices = [];
    this.freeSummons = 0;
    this.summonCount = 0;
    this.summonCd = {};
    this.picking = false;
    this.levelUp = new LevelUpOverlay(this);
    this.synergies = [];
    this.synergyKeys = '';
    this.run = {};
    this.eventT = EVENT_FIRST;
    this.committed = false;
    this.usedUnits = {};
    this.deck = this.rule ? dailyUnits(this.rule, Object.keys(UNITS).filter((k) => meta.ownsUnit(k))).slice(0, DECK_SIZE) : meta.activeDeck(Object.keys(UNITS));
    this.counterFxT = 0;
    this.kills = {};
    this.metNew = new Set();
    this.reached = reachedStage(this.endless ? 99 : this.stage.id, meta.clearedMax);
    for (const k of Object.keys(this.feat) as Feature[]) this.feat[k] = featureOn(k, this.reached, this.endless || !!this.rule);

    // 배경 + 레인
    const [sky, lane, line] = this.endless ? THEMES.endless : WORLDS[(this.stage.world ?? 1) - 1].battle; // 🗺️ 월드별 배경색
    // 🎥 전장 폭(1~3관문은 화면 한 장) · 카메라 범위 · 넓어진 만큼 이동 속도 보정
    const W = worldWidth(this.stage.id, this.endless, !!this.rule);
    this.worldW = W;
    this.walkK = walkMult(W);
    this.lookX = null;
    this.cameras.main.setBounds(0, 0, W, 720).setScroll(0, 0);
    this.add.rectangle(640, 360, 1280, 720, sky).setDepth(-10).setScrollFactor(0);
    this.drawBackdrop(sky, lane, line);
    this.add.rectangle(W / 2, LANE_Y + 40, W, 80, lane).setDepth(-5);
    this.add.rectangle(W / 2, LANE_Y + 2, W, 3, line).setDepth(-4);

    // 🏰 우리 성: 성 레벨로 체력·단계 / 적 성: 관문(무한=웨이브)으로 단계
    const ct = allyCastleTier(meta.castleLevel('castle'));
    this.playerBase = new Base(this, 105, LANE_Y - 10, Math.round(this.stage.baseHp * castleHpMult(meta.castleLevel('castle'))), 0x2f6fe0, [castleLook('ally', ct), 'base_ally'], 1 + 0.04 * ct);
    this.enemyTier = enemyCastleTier(this.endless, this.stage.id, 0);
    // 무한 모드: 적 기지는 부서지지 않는 생산 기지(버틴 웨이브가 기록)
    this.sRule = this.endless || this.rule ? 'normal' : stageRule(this.stage.id);
    const tough = this.sRule === 'hold' || this.sRule === 'breach'; // 수성·돌파는 적 성을 부술 필요 없음
    this.enemyBase = new Base(this, W - 105, LANE_Y - 10, this.endless || tough ? 1e9 : this.stage.baseHp, 0xc0392b, [castleLook('enemy', this.enemyTier), 'base_enemy'], 1 + 0.04 * this.enemyTier);
    this.allyGunT = 1;
    this.enemyGunT = 2.5;
    this.archers = { ally: [], enemy: [] };
    this.placeArchers('ally');
    this.placeArchers('enemy');
    // 🎯 우리 성을 누르면 특수 공격(20초마다) — 성 위 게이지
    this.volleyT = 6;
    this.volleyGauge = this.add.graphics().setDepth(96);
    this.volleyIcon = this.add.text(0, 0, '🏹', { fontSize: '22px', padding: { top: 10, bottom: 4 } }).setOrigin(0.5).setDepth(97);
    this.playerBase.onTap(() => this.castleVolley());
    this.spawnHero();
    this.setupRule(tough);
    this.devHud();
    this.waveNo = 0;
    this.waveText = null;
    if (this.endless) {
      this.add.text(this.enemyBase.x, this.enemyBase.top - 26, '∞', { fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#d8b0ff', stroke: '#2a1a4a', strokeThickness: 5 }).setOrigin(0.5).setDepth(60);
      this.waveText = this.add
        .text(285, 22, '', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#d8b0ff', stroke: '#000000', strokeThickness: 3 }) // LV와 VS 바 사이(골드와 안 겹치게)
        .setOrigin(0.5)
        .setDepth(101);
    }

    this.energy = new ResourceSystem(40, energyRate(meta.baseLevel('energy')) * (this.rule?.energy ?? 1), energyMax(meta.baseLevel('energy'))); // 소환 에너지(기본 초당 9·상한 100, 🏰 기지 강화로 증가 · 📅 에너지 폭주)
    this.runGold = 0;
    this.battleUpg = {};
    this.waves = new WaveSystem(this.stage);
    this.prodInterval = Math.max(2.5, 4.5 - this.stage.id * 0.3);
    this.prodTimer = this.prodInterval;
    this.prodIdx = 0;
    this.beat = 0;
    this.beatDir = 1;
    this.clock = 0;
    this.frozenUntil = 0;
    this.guardUntil = 0;
    this.berserkUntil = 0;
    // 🛒 구매한 무기만 게이지(영구 강화: 충전 단축)
    this.weapons = WEAPONS.map((w) => (meta.ownsWeapon(w.key) ? new WeaponCharge(w.chargeSec * weaponChargeMult(meta.weaponLevel(w.key))) : null));

    this.unitPool = new Pool<Unit>(
      () => new Unit(this),
      (u) => u.deactivate()
    );
    this.enemyPool = new Pool<Enemy>(
      () => new Enemy(this),
      (e) => e.deactivate()
    );
    this.projPool = new Pool<Projectile>(
      () => new Projectile(this),
      (p) => p.deactivate()
    );

    // 👗 착용 스킨 텍스처 미리 준비(HUD 얼굴에도 적용)
    this.looks = Object.fromEntries(Object.keys(UNITS).map((k) => [k, ensureSkin(this, k, meta.equippedSkin(k), meta.level(k))]));
    this.hud = this.makeHud();
    this.tip = new TipPointer(this);
    this.setupCameraUi();
    // 키보드 1~9 = 특수 무기
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.heroDir = -1;
      else if (k === 'd' || k === 'arrowright') this.heroDir = 1;
      const hs = HERO_SKILLS.findIndex((s) => s.hotkey.toLowerCase() === k);
      if (hs >= 0) this.castHeroSkill(hs);
    });
    this.input.keyboard?.on('keyup', (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if ((k === 'a' || k === 'arrowleft') && this.heroDir < 0) this.heroDir = 0;
      if ((k === 'd' || k === 'arrowright') && this.heroDir > 0) this.heroDir = 0;
    });
    // 👑 전장을 손가락으로 좌우로 끌면 영웅이 그만큼 움직임(하단 HUD·상단 바·영웅 스킬 버튼 제외)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.heroDrag = null;
      if (this.over || this.picking || this.paused || this.reviving || !this.hero?.active) return;
      if (p.y < 60 || p.y > 405) return;
      if (p.x > HERO_PANEL_X - HERO_SKILLS.length * (HERO_BTN_R * 2 + 14) - 10 && p.y < HERO_BTN_Y + HERO_BTN_R + 10) return; // 영웅 스킬 버튼·마나 바
      this.heroDrag = { px: p.x, hx: this.hero.x };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.heroDrag || !p.isDown || !this.hero?.active) return;
      const dx = p.x - this.heroDrag.px;
      if (Math.abs(dx) < 6) return; // 살짝 누른 건 무시
      this.heroTarget = this.heroDrag.hx + dx * HERO_DRAG_MULT;
      if (Math.abs(dx) > 40) this.tipDone('hero');
      this.lookX = null; // 🎥 영웅을 움직이면 영웅에게 돌아옴
    });
    this.input.on('pointerup', () => {
      this.heroDrag = null;
    });
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      const n = Number(ev.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      if (this.picking && this.levelUp.open) {
        const c = this.choices[n - 1]; // 레벨업 중엔 1~3 = 카드 고르기
        if (c) {
          this.levelUp.hide();
          this.pickSkill(c.key);
        }
        return;
      }
      this.fireWeapon(n - 1);
    });

    // 보스 HP 바(상단, 보스 등장 시만)
    this.bossBarBg = this.add.rectangle(620, 60, 420, 20, 0x000000, 0.6).setDepth(102).setVisible(false);
    this.bossFill = this.add.rectangle(620 - 202, 60, 404, 14, 0xff3b3b).setOrigin(0, 0.5).setDepth(103).setVisible(false);
    this.bossText = this.add
      .text(620, 60, '', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(110)
      .setVisible(false);

    // ⏩ 배속 · 🛒 상점 · ⏸️ 일시정지 — 상단 오른쪽(휴대폰 가장자리에 가리지 않게 안쪽)
    const topBtn = (x: number, label: string, color: string): Phaser.GameObjects.Text =>
      this.add
        .text(x, 22, label, { fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', color, backgroundColor: '#1d2740', padding: { x: 10, y: 6 } })
        .setOrigin(0.5)
        .setDepth(105) // 상단 바(100) 위
        .setInteractive({ useHandCursor: true });
    this.speedBtn = topBtn(965, '', '#ffe680');
    this.speedBtn.on('pointerdown', () => {
      BattleScene.speed = BattleScene.speed === 1 ? 2 : 1;
      sfx(this, 'click');
      this.applySpeed();
    });
    topBtn(1068, '🛒 상점', '#ffd34d').on('pointerdown', () => this.openShop());
    topBtn(1170, '⏸ 정지', '#cfe0ff').on('pointerdown', () => this.openPause());
    this.slowmo = 1;
    this.applySpeed();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (this.anims.globalTimeScale = 1));
    bgm(this, 'bgm_battle');
  }

  /** 배속 × 슬로모션 → 이동·타이머·트윈·애니메이션 모두 */
  private applySpeed(): void {
    const k = BattleScene.speed * this.slowmo;
    this.time.timeScale = k;
    this.tweens.timeScale = k;
    this.anims.globalTimeScale = k;
    this.speedBtn.setText(BattleScene.speed === 2 ? '⏩ ×2' : '▶ ×1');
  }

  /** HUD 만들기(전투 중 상점에서 산 것이 생기면 다시 만듦) */
  private makeHud(): Hud {
    const hud = this.buildHud();
    hud.setRadar(this.worldW, (x) => this.lookAt(x)); // 🗺️ 지도로 둘러보기
    hud.setSkillIcon(0, textureKey('equip_weapon_icons'), (HERO_WEAPONS.find((w) => w.key === meta.weaponEq) ?? HERO_WEAPONS[0]).frame); // 🛡️ 장착 무기
    return hud;
  }

  private buildHud(): Hud {
    // ⚔️ 출전 덱 유닛 + (아직 안 산 유닛은 '구매' 안내용) — 덱에 없는 보유 유닛은 숨김
    const shown = Object.fromEntries(Object.keys(UNITS).filter((k) => this.deck.includes(k) || !meta.ownsUnit(k)).map((k) => [k, UNITS[k]]));
    const deckFirst = Object.fromEntries([...this.deck.map((k) => [k, UNITS[k]] as const), ...Object.entries(shown).filter(([k]) => !this.deck.includes(k))]);
    return new Hud(
      this,
      deckFirst,
      (type) => this.trySpawnUnit(type),
      (type) => this.doBattleUpgrade(type),
      (i) => this.fireWeapon(i),
      this.weapons.map((w) => !!w),
      this.unitOwned,
      this.looks,
      (i) => this.castHeroSkill(i),
      HERO_SKILLS.map((s) => meta.ownsHeroSkill(s.key)),
      this.feat
    );
  }

  /** ⏸️ 일시정지 — 계속 · 상점 · 다시 시작 · 소리 · 그만하기 */
  private openPause(): void {
    if (this.over || this.reviving || this.paused || this.picking) return;
    this.paused = true;
    const layer = this.add.container(0, 0).setDepth(200);
    this.pauseLayer = layer;
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65).setInteractive();
    const panel = this.add.rectangle(640, 360, 480, 520, 0x182238).setStrokeStyle(3, 0x3a7bff);
    const title = this.add.text(640, 145, '⏸️ 일시정지', { fontFamily: 'sans-serif', fontSize: '36px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
    layer.add([dim, panel, title]);
    const close = (): void => {
      layer.destroy();
      this.pauseLayer = null;
    };
    const item = (y: number, label: string, bg: string, fn: () => void, size = 26): Phaser.GameObjects.Text => {
      const t = this.add
        .text(640, y, label, { fontFamily: 'sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color: '#fff', backgroundColor: bg, padding: { x: 20, y: 10 }, fixedWidth: 320, align: 'center' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        sfx(this, 'click');
        fn();
      });
      layer.add(t);
      return t;
    };
    item(225, '▶ 계속하기', '#2eae5a', () => {
      close();
      this.paused = false;
    });
    item(300, '🛒 상점(강화)', '#d8962a', () => {
      close();
      this.paused = false;
      this.openShop();
    });
    item(375, '🔄 다시 시작', '#3a7bff', () => {
      close();
      this.paused = false;
      this.commitRun();
      this.scene.restart({ stageId: this.endless ? 0 : this.stage.id, mode: this.endless ? 'endless' : this.rule ? 'daily' : undefined });
    });
    const mute = item(450, this.sound.mute ? '🔇 소리 꺼짐' : '🔊 소리 켜짐', '#20304e', () => {
      setMute(this, !this.sound.mute);
      mute.setText(this.sound.mute ? '🔇 소리 꺼짐' : '🔊 소리 켜짐');
    }, 22);
    let armed = false;
    const quit = item(530, '🏳️ 그만하기', '#5a3040', () => {
      if (!armed) {
        armed = true; // 실수 방지 — 한 번 더
        quit.setText('정말 그만할까요? (한 번 더)').setBackgroundColor('#c0303a');
        return;
      }
      close();
      this.paused = false;
      this.commitRun();
      this.scene.start('StageSelect');
    }, 22);
  }

  /** 🛒 전투 중 상점 — 전투를 멈추고 강화 화면을 위에 띄움, 돌아오면 산 것을 바로 반영 */
  private openShop(): void {
    if (this.over || this.reviving || this.picking) return;
    if (this.pauseLayer) {
      this.pauseLayer.destroy();
      this.pauseLayer = null;
    }
    const snap = this.shopSnapshot();
    this.paused = true;
    this.events.once(Phaser.Scenes.Events.RESUME, () => this.afterShop(snap));
    this.scene.pause();
    this.scene.launch('Upgrade', { fromBattle: true });
  }

  private shopSnapshot(): string {
    return JSON.stringify([meta.ownedUnits, meta.ownedWeapons, meta.heroOwned, meta.skinEquipped]);
  }

  /** 상점에서 돌아옴 — 새 유닛·무기·영웅 스킬 버튼, 영웅 레벨, 기지 강화를 바로 적용 */
  private afterShop(snap: string): void {
    this.paused = false;
    // 🏰 기지 강화(소환 에너지 충전·상한) · 인구는 매번 계산
    this.energy.setRate(energyRate(meta.baseLevel('energy')) * (this.rule?.energy ?? 1));
    this.energy.setCap(energyMax(meta.baseLevel('energy')) + (awakened(this.skills, 'recharge') ? 50 : 0));
    // 🏰 성 강화(체력 비율 유지 · 단계 그림)
    const clv = meta.castleLevel('castle');
    this.playerBase.setMaxHp(Math.round(this.stage.baseHp * castleHpMult(clv)));
    const nt = allyCastleTier(clv);
    if (castleLook('ally', nt) !== this.playerBase.look) {
      this.playerBase.setLook([castleLook('ally', nt), 'base_ally'], 1 + 0.04 * nt);
      this.placeArchers('ally');
    }
    // 🔥 새로 산 특수 무기
    WEAPONS.forEach((w, i) => {
      if (!this.weapons[i] && meta.ownsWeapon(w.key)) this.weapons[i] = new WeaponCharge(w.chargeSec * weaponChargeMult(meta.weaponLevel(w.key)));
    });
    // 👑 영웅 레벨(체력 비율 유지)
    const h = this.hero;
    if (h?.active) {
      const base = heroStats(this.stage.id, this.endless ? 1 : this.stage.enemyMult ?? 1);
      const hm = heroLvMult(meta.heroLevel('hero'));
      const ratio = h.hp / h.maxHp;
      h.stats = { ...h.stats, atk: Math.round(base.atk * hm) };
      h.maxHp = Math.round(base.hp * hm);
      h.hp = h.maxHp * ratio;
      h.heal(0);
    }
    // 🛡️ 새 유닛 · 🔥 무기 · 👑 스킬 · 👗 스킨 → HUD 다시
    if (this.shopSnapshot() !== snap) {
      this.looks = Object.fromEntries(Object.keys(UNITS).map((k) => [k, ensureSkin(this, k, meta.equippedSkin(k), meta.level(k))]));
      this.hud.destroy();
      this.hud = this.makeHud();
      this.updateSynergies();
    }
    bgm(this, 'bgm_battle');
  }

  /** 최대 인구 = 기본 40 + 🏰 기지 강화 + 보급 스킬 */
  private get foodMax(): number {
    return FOOD_BASE + popBonus(meta.baseLevel('pop')) + supplyBonus(this.skills.supply ?? 0);
  }

  private usedFood(): number {
    let f = 0;
    for (const u of this.units) if (u.active) f += u.pop;
    return f;
  }

  /** 🛒 유닛 보유 여부(강화 화면에서 구매) */
  private get unitOwned(): Record<string, boolean> {
    return Object.fromEntries(Object.keys(UNITS).map((k) => [k, meta.ownsUnit(k)]));
  }

  private trySpawnUnit(type: string): void {
    if (this.over || this.picking) return;
    const base = UNITS[type];
    if (!base || !meta.ownsUnit(type) || !this.deck.includes(type)) return; // 🔒 구매 안 한 유닛 · 덱에 없는 유닛
    if ((this.summonCd[type] ?? 0) > 0) {
      this.hud.deny(type, 'cooldown'); // ⏱️ 아직 대기 중
      return;
    }
    if (this.usedFood() + base.pop > this.foodMax) {
      this.hud.deny(type, 'food'); // 인구 초과 안내
      return;
    }
    // 💎 소환 할인 / 🎁 무료 소환 / 💎 마나 순환(각성: 5번째마다 공짜)
    const energyCost = this.nextSummonFree() ? 0 : Math.round(base.cost * magicMult(this.skills.magic ?? 0));
    if (!this.energy.spend(energyCost)) {
      this.hud.deny(type, 'energy'); // 에너지 부족 안내
      return;
    }
    const m0 = applyUpgrade(base, meta.level(type)); // 영구 강화 적용
    const rm = rankMult(meta.rank(type)); // 🃏 카드 랭크
    const m = { ...m0, hp: Math.round(m0.hp * rm), atk: Math.round(m0.atk * rm) };
    this.usedUnits[type] = (this.usedUnits[type] ?? 0) + 1;
    const perfect = this.feat.perfect && Math.abs(this.beat - 0.5) <= BattleScene.PERFECT_WIN; // ⏱️ 타이밍 명중(🎓 6관문부터)
    this.tipDone('summon');
    if (this.tip.key === 'perfect') this.tipDone('perfect');
    const pm = perfect ? 1.3 : 1;
    const bm = 1 + (this.battleUpg[type] ?? 0) * 0.2; // 🛠️ 전장 강화
    if (this.freeSummons > 0) this.freeSummons--;
    this.summonCount++;
    if (!devFlags.noCooldown) this.summonCd[type] = summonCooldown(base.cost); // ⏱️ 같은 유닛 재소환 대기(🛠️ 치트면 없음)
    const vm = vigorMult(this.skills.vigor ?? 0); // ❤️ 튼튼한 몸
    const stats = { ...m, hp: Math.round(m.hp * bm * pm * vm), atk: Math.round(m.atk * bm * pm) };
    const u = this.unitPool.acquire();
    const totem = isTotem(type); // 🗿 설치물은 영웅 앞에 설치
    const nTot = this.units.filter((o) => o.active && isTotem(o.type)).length; // 여러 개면 조금씩 옆으로
    const sx = totem ? totemX(this.hero?.active ? this.hero.x + (nTot % 3) * 38 : null, this.playerBase.x + BASE_FRONT, this.enemyBase.x - BASE_FRONT - 160) : this.playerBase.x + BASE_FRONT;
    u.spawn(sx, LANE_Y, stats, type, 'ally', this.looks[type] ?? type); // 👗 착용 스킨
    if (totem) {
      u.skillMotion(); // 땅에서 솟아오르는 등장 동작
      this.totemEnd.set(u, this.clock + TOTEM_LIFE);
      this.puff(sx, 0xd8c8a0);
    }
    u.setStars(UNIT_TIERS[unitTier(meta.level(type))].stars); // ⭐ 진화 단계(★★부터 머리 위 표시)
    u.pop = base.pop;
    sfx(this, 'spawn');
    this.track('spawns');
    if (perfect) this.track('perfects');
    this.units.push(u);
    if (perfect) {
      const t = this.add
        .text(this.playerBase.x + 60, LANE_Y - 70, 'PERFECT! ⚡', {
          fontFamily: 'sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#ffe14d',
        })
        .setOrigin(0.5)
        .setDepth(70);
      this.tweens.add({ targets: t, y: LANE_Y - 112, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }
  }

  private upgCost(type: string): number {
    return 40 + (this.battleUpg[type] ?? 0) * 30;
  }

  private doBattleUpgrade(type: string): void {
    if (this.over || this.picking) return;
    const cost = this.upgCost(type);
    if (this.runGold < cost) return;
    this.runGold -= cost;
    const old = 1 + (this.battleUpg[type] ?? 0) * 0.2;
    this.battleUpg[type] = (this.battleUpg[type] ?? 0) + 1;
    const neu = 1 + this.battleUpg[type] * 0.2;
    const r = neu / old;
    // 이미 깔린 같은 종류 유닛도 즉시 강화
    for (const u of this.units) {
      if (u.active && u.type === type) {
        u.maxHp = Math.round(u.maxHp * r);
        u.hp = Math.round(u.hp * r);
        u.stats = { ...u.stats, atk: Math.round(u.stats.atk * r) };
      }
    }
    const t = this.add
      .text(this.playerBase.x + 60, LANE_Y - 70, '🛠️ 강화!', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#8affb0' })
      .setOrigin(0.5)
      .setDepth(70);
    this.tweens.add({ targets: t, y: LANE_Y - 110, alpha: 0, duration: 650, onComplete: () => t.destroy() });
  }

  private upgMap(): Record<string, { lv: number; cost: number; afford: boolean }> {
    const m: Record<string, { lv: number; cost: number; afford: boolean }> = {};
    for (const k of Object.keys(UNITS)) {
      const lv = this.battleUpg[k] ?? 0;
      const cost = this.upgCost(k);
      m[k] = { lv: lv + 1, cost, afford: this.runGold >= cost };
    }
    return m;
  }

  /** ⏱️ 유닛별 남은 대기 비율(1=방금 소환, 0=준비됨) */
  private cdMap(): Record<string, number> {
    const m: Record<string, number> = {};
    for (const [k, left] of Object.entries(this.summonCd)) if (left > 0) m[k] = left / summonCooldown(UNITS[k].cost);
    return m;
  }

  private affordMap(): Record<string, boolean> {
    const m: Record<string, boolean> = {};
    const food = this.usedFood();
    for (const k of Object.keys(UNITS)) {
      const u = UNITS[k];
      const ec = this.nextSummonFree() ? 0 : Math.round(u.cost * magicMult(this.skills.magic ?? 0));
      m[k] = this.energy.amount >= ec && food + u.pop <= this.foodMax && (this.summonCd[k] ?? 0) <= 0;
    }
    return m;
  }

  private gainXp(base: number): void {
    this.xp += Math.round(base * mimicMult(this.skills.mimic ?? 0) * this.ring('ring_exp')); // 💍 경험의 반지
    while (this.xp >= this.xpNext && !this.picking) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpToNext(this.level);
      this.levelUpBurst();
      if (this.feat.levelup && anyUpgradable(this.skills)) {
        this.picking = true;
        sfx(this, 'levelup');
        this.choices = rollChoices(this.skills, Math.random);
        this.showLevelUp();
        break; // 한 번에 한 레벨만 선택(나머지는 선택 후 이어서)
      }
    }
  }

  /** 적 등장 — at: 위치(없으면 적 기지 앞) · exact: 변종으로 바꾸지 않음(소환·분열) */
  private spawnEnemy(type: string, elite = false, at?: number, exact = false): void {
    if (!exact && !BOSS.has(type)) type = pickVariant(type, enemyLevel(this.endless, this.stage.id, this.waveNo), VARIANTS, Math.random); // 👾 변종
    const stats = ENEMIES[type];
    if (!stats) return;
    const e = this.enemyPool.acquire();
    const x = Phaser.Math.Clamp(at ?? this.enemyBase.x - BASE_FRONT, this.playerBase.x + BASE_FRONT, this.enemyBase.x - BASE_FRONT);
    // 전용 그림이 없으면 빌린 그림(색상 회전 사본 또는 곱하기 색)
    const own = !!spriteOf(type);
    const look = own ? type : stats.hue !== undefined && stats.look ? ensureHue(this, stats.look, stats.hue) : stats.look ?? type;
    e.spawn(x, LANE_Y, stats, type, 'enemy', look);
    if (!(meta.kills[type] > 0) && !this.metNew.has(type)) {
      // 📖 처음 만나는 적 — 잡으면 도감에 등록
      this.metNew.add(type);
      const t = this.add
        .text(this.enemyBase.x - 160, LANE_Y - 150, `📖 새 몬스터! ${stats.name}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe14d', backgroundColor: '#0d1424cc', padding: { x: 10, y: 5 } })
        .setOrigin(0.5)
        .setDepth(95);
      this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, delay: 1400, duration: 500, onComplete: () => t.destroy() });
    }
    e.setVariant(own ? null : hexColor(stats.tint), stats.scale ?? 1);
    e.abilityT = 0;
    e.raged = false;
    e.reward = Math.round(stats.reward * (this.rule?.reward ?? 1) * this.ring('ring_gold')); // 📅 도전 보상 배수 · 💍 황금의 반지
    e.maxHp = Math.round(e.maxHp * HERO_ENEMY_HP); // ⚖️ 영웅이 생긴 만큼 적 체력 +15%
    e.hp = e.maxHp;
    const mult = this.endless ? endlessMult(endlessWaveAt(this.clock)) : this.stage.enemyMult ?? 1;
    if (mult !== 1) {
      e.stats = { ...e.stats, atk: Math.round(e.stats.atk * (1 + (mult - 1) * 0.6)) };
      e.maxHp = Math.round(e.maxHp * mult);
      e.hp = e.maxHp;
      e.reward = Math.round(e.reward * (1 + (mult - 1) * 0.3));
    }
    this.enemies.push(e);
    if (elite || (!BOSS.has(type) && (this.endless || this.stage.id >= 2) && Math.random() < ELITE_CHANCE)) this.makeElite(e);
    if (BOSS.has(type)) {
      this.cameras.main.shake(300, 0.012);
      sfx(this, 'alert');
      const t = this.add
        .text(640, 210, `👑 ${BOSSES[type]?.name ?? '보스'} 등장!`, { fontFamily: 'sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#ff5a6e' })
        .setOrigin(0.5)
        .setDepth(110);
      this.tweens.add({ targets: t, y: 170, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
    }
  }

  private updateBossBar(): void {
    const boss = this.enemies.find((e) => e.active && BOSS.has(e.type));
    if (boss) {
      this.bossBarBg.setVisible(true);
      this.bossFill.setVisible(true).setSize(404 * Math.max(0, boss.hp / boss.maxHp), 14);
      this.bossText.setVisible(true).setText(`👑 ${boss.stats.name}  ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp}`);
    } else {
      this.bossBarBg.setVisible(false);
      this.bossFill.setVisible(false);
      this.bossText.setVisible(false);
    }
  }

  private nearest(x: number, list: { x: number; active: boolean }[]): { x: number } | null {
    let best: { x: number } | null = null;
    let bestD = Infinity;
    for (const o of list) {
      if (!o.active) continue;
      const d = Math.abs(o.x - x);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  update(_time: number, deltaMs: number): void {
    if (this.over || this.picking || this.paused || this.reviving) return; // 정지 상태
    const dt = Math.min(0.05, deltaMs / 1000) * BattleScene.speed * this.slowmo; // ⏩ 배속

    // ⏱️ 리듬 바 진행(0↔1 핑퐁)
    this.beat += this.beatDir * dt * BattleScene.BEAT_SPEED;
    if (this.beat >= 1) {
      this.beat = 1;
      this.beatDir = -1;
    } else if (this.beat <= 0) {
      this.beat = 0;
      this.beatDir = 1;
    }

    this.clock += dt;
    this.tutorialTick();
    const wc = chargeMult(this.skills.charge ?? 0); // 🔥 무기 충전
    for (const w of this.weapons) w?.update(dt * wc * (this.rule?.charge ?? 1)); // 📅 무기 대잔치
    const frozen = this.clock < this.frozenUntil;
    const guard = this.clock < this.guardUntil;
    const berserk = this.clock < this.berserkUntil;

    this.energy.update(dt * rechargeMult(this.skills.recharge ?? 0)); // 🔋 에너지 충전
    for (const k in this.summonCd) this.summonCd[k] = Math.max(0, this.summonCd[k] - dt);
    this.mana.update(dt * (1 + 0.2 * (this.skills.prayer ?? 0)) * (this.rule?.mana ?? 1) * this.ring('ring_mana')); // 🙏 기도 · 📅 마법 축제 · 💍 마나의 반지
    this.updateBurns(dt);
    this.applyDevCheats();
    this.heroCd = this.heroCd.map((c) => Math.max(0, c - dt));
    this.updateHero(dt);
    this.updateCastles(dt);
    for (const ev of this.waves.update(dt)) this.spawnEnemy(ev.type);

    // 적 기지가 병력을 계속 생산(기지 파괴 전까지) → 기지를 부숴야 생산이 멈춤
    if (!this.enemyBase.destroyed) {
      this.prodTimer -= dt * (this.sRule === 'hold' ? 1 / holdProdMult(holdSeconds(this.stage.id) - this.holdLeft, holdSeconds(this.stage.id)) : 1); // 🏰 수성: 점점 빨리
      if (this.prodTimer <= 0) {
        this.prodTimer = this.prodInterval;
        this.spawnEnemy(PROD_TYPES[this.prodIdx % PROD_TYPES.length]);
        this.prodIdx++;
      }
    }

    // 아군: 적 추격/공격, 없으면 전진 → 적 기지 공격
    this.updateSynergies();
    if (this.endless) {
      const w = endlessWaveAt(this.clock);
      if (w !== this.waveNo) {
        this.waveNo = w;
        this.waveText?.setText(`🌊 웨이브 ${w}   (최고 ${meta.endlessBest})`);
        const et = enemyCastleTier(true, 0, w);
        if (et > this.enemyTier) {
          this.enemyTier = et; // 🏰 무한 모드: 적 성 진화
          this.enemyBase.setLook([castleLook('enemy', et), 'base_enemy'], 1 + 0.04 * et);
          this.placeArchers('enemy');
          this.cameras.main.shake(400, 0.01);
          this.time.delayedCall(900, () => this.banner(`🏰 적 성이 강해졌다! ${ENEMY_CASTLE_TIERS[et].name}`, 0xff5a4a));
        }
        this.banner(w % 5 === 0 ? `🌊 웨이브 ${w} — 👑 보스!` : `🌊 웨이브 ${w}`, 0xd8b0ff);
      }
    }
    this.updateEvents(dt);
    const allyTint = guard ? GUARD_TINT : berserk ? BERSERK_TINT : null;
    for (const u of this.units) {
      if (!u.active) continue;
      const stunned = u.stunned;
      u.setStatus(stunned ? STUN_TINT : allyTint);
      if (stunned) {
        u.idle(); // 💫 보스 땅 내려치기로 기절
        continue;
      }
      if (isTotem(u.type)) {
        this.totemAct(u, dt); // 🗿 설치물 — 움직이지 않음
        continue;
      }
      if (u.type === 'cleric') {
        // ✚ 성직자: 공격하지 않음 — 다친 아군 치유, 없으면 맨 앞 아군 뒤를 따라감
        if (!this.clericHeal(u, dt)) this.clericFollow(u, dt);
        continue;
      }
      const target = this.nearest(u.x, this.enemies) as Enemy | null;
      u.cooldown -= dt;
      if (target && inRange(u.x, target.x, u.stats.range + REACH)) {
        this.attack(u, target);
      } else if (this.sRule === 'breach' && inRange(u.x, this.enemyBase.x, Math.min(u.stats.range, 60) + BASE_REACH)) {
        this.goalIn(u); // 🏃 돌파: 결승선 도착
      } else if (!this.enemyBase.destroyed && this.sRule !== 'breach' && inRange(u.x, this.enemyBase.x, u.stats.range + BASE_REACH)) {
        // 🏰 적 기지에 닿으면 더 지나가지 않고 기지를 공격(다른 적을 쫓느라 지나치지 않게)
        if (u.cooldown <= 0) {
          this.enemyBase.takeDamage(computeDamage(u.stats.atk * (berserk ? BERSERK_ATK : 1), 0));
          u.cooldown = attackCooldown(u.stats.atkSpeed) * (berserk ? BERSERK_COOLDOWN : 1);
          u.lunge();
        } else {
          u.idle();
        }
      } else {
        u.moveBy(u.stats.speed * dt * this.walkK);
      }
    }

    // 적: 아군 추격/공격, 없으면 전진 → 플레이어 기지 공격 (👑 영웅도 노림)
    const allyTargets: Unit[] = [...this.units, ...(this.hero?.active ? [this.hero] : []), ...(this.wagon?.active ? [this.wagon] : [])]; // 🛒 마차도 노림
    this.updateRule(dt);
    for (const e of this.enemies) {
      if (!e.active) continue;
      const knocked = e.stunned; // 💫 넉다운
      e.setStatus(frozen ? FROZEN_TINT : knocked ? STUN_TINT : null, frozen);
      if (frozen) continue; // ❄️ 빙결: 이동·공격 정지
      if (knocked) {
        e.idle();
        continue;
      }
      if (BOSS.has(e.type)) this.bossPattern(e, dt);
      else if (ENEMIES[e.type]?.ability) this.enemyAbility(e, dt); // 👾 치유·소환·분노
      const target = this.nearest(e.x, allyTargets) as Unit | null;
      e.cooldown -= dt;
      if (target && inRange(e.x, target.x, e.stats.range + REACH)) {
        this.attack(e, target);
      } else if (inRange(e.x, this.playerBase.x, e.stats.range + BASE_REACH)) {
        // 🏰 우리 성에 닿으면 더 지나가지 않고 성을 공격(뒤쪽 영웅·유닛을 쫓느라 지나치지 않게)
        if (e.cooldown <= 0) {
          this.playerBase.takeDamage(computeDamage(e.stats.atk, 0));
          e.cooldown = attackCooldown(e.stats.atkSpeed);
          e.lunge();
        } else {
          e.idle();
        }
      } else {
        e.moveBy(-e.stats.speed * e.speedMult * dt * this.walkK);
      }
    }

    // 🏰 성을 지나간 전투원은 성 앞으로 되돌림(밀쳐내기·끌어당기기 등으로 넘어간 경우)
    this.keepOffBases();

    // 투사체 이동/명중
    for (const p of this.projectiles) {
      if (p.active && p.update(dt)) this.projPool.release(p);
    }
    this.projectiles = this.projectiles.filter((p) => p.active);

    this.cleanupDead();
    this.updateBossBar();
    this.updateCamera(dt);
    this.hud.updateHero(
      this.mana.amount,
      this.mana.max,
      HERO_SKILLS.map((s, i) => ({ cd: (this.heroCd[i] ?? 0) / s.cooldown, enough: this.mana.amount >= s.mana && this.hero?.active && meta.ownsHeroSkill(s.key) })),
      this.hero?.active ? this.hero.hp / this.hero.maxHp : 0
    );
    this.hud.update({
      lv: this.level,
      gold: this.runGold,
      energy: this.energy.amount,
      energyMax: this.energy.max,
      food: this.usedFood(),
      foodMax: this.foodMax,
      radar: {
        w: this.worldW,
        view: this.cameras.main.scrollX,
        allies: this.units.filter((u) => u.active).map((u) => u.x),
        enemies: this.enemies.filter((e) => e.active && !BOSS.has(e.type)).map((e) => e.x),
        bosses: this.enemies.filter((e) => e.active && BOSS.has(e.type)).map((e) => e.x),
        hero: this.hero?.active ? this.hero.x : null,
        wagon: this.wagon?.active ? this.wagon.x : null,
      },
      afford: this.affordMap(),
      cd: this.cdMap(),
      beat: this.beat,
      perfectWin: BattleScene.PERFECT_WIN,
      upg: this.upgMap(),
      weapons: this.weapons.map((w) => (w ? { ratio: w.ratio, ready: w.ready } : null)),
      good: this.goodMap(),
    });
    this.checkEnd();
  }

  /** ⚔️ 지금 전장(오른쪽 끝까지)에 상성 적이 있는 덱 유닛 */
  private goodMap(): Record<string, boolean> {
    const kinds = new Set<EnemyKind>();
    for (const e of this.enemies) {
      const k = e.active ? enemyKind(e.type) : null;
      if (k) kinds.add(k);
    }
    return Object.fromEntries(this.deck.map((u) => [u, !!UNIT_COUNTER[u] && kinds.has(UNIT_COUNTER[u]!)]));
  }

  /** 성직자 이동: 맨 앞 아군보다 50px 뒤까지만 전진(아군이 없으면 제자리) */
  private clericFollow(u: Unit, dt: number): void {
    let front = -Infinity;
    for (const o of this.units) if (o.active && o !== u && o.type !== 'cleric' && o.x > front) front = o.x;
    if (front > -Infinity && u.x < front - 50) u.moveBy(u.stats.speed * dt * this.walkK);
    else u.idle();
  }

  /** 성직자: 사거리 안에서 가장 많이 다친 아군을 치유. 치유 대상이 있으면 true(그 프레임은 이동·공격 안 함) */
  private clericHeal(u: Unit, dt: number): boolean {
    let best: Unit | null = null;
    for (const o of this.units) {
      if (!o.active || o === u || o.hp >= o.maxHp) continue;
      if (!inRange(u.x, o.x, u.stats.range)) continue;
      if (!best || o.hp / o.maxHp < best.hp / best.maxHp) best = o;
    }
    if (!best) return false;
    u.cooldown -= dt;
    if (u.cooldown > 0) {
      u.idle();
      return true;
    }
    const lv = meta.level(u.type);
    u.swings++;
    if (lv > 0 && isSkillSwing(u.swings, lv)) {
      this.castSkill(u, best, lv, 1); // ✨ 치유의 빛: 주변 아군 전체
      u.cooldown = attackCooldown(u.stats.atkSpeed) * hasteMult(this.skills.haste ?? 0);
      return true;
    }
    best.heal(Math.round(u.stats.atk * CLERIC_HEAL_MULT * synergyMult(this.synergies, u.type, 'heal')));
    playFx(this, 'heal', best.x, LANE_Y + 6, { scale: 0.6, volume: 0.6, depth: 55 }); // 💚 회복(발밑)
    u.lunge();
    u.cooldown = attackCooldown(u.stats.atkSpeed) * hasteMult(this.skills.haste ?? 0);
    return true;
  }

  private attack(att: Unit | Enemy, def: Unit | Enemy): void {
    if (att.cooldown > 0) {
      att.idle(); // 사거리 안 쿨다운 대기
      return;
    }
    const berserk = att.side === 'ally' && this.clock < this.berserkUntil; // ⚔️ 광폭
    // ✨ 유닛 스킬: 영구 강화 Lv1부터, 일반 공격 N번마다
    if (att.side === 'ally') {
      att.swings++;
      const inA = this.inHeroAura(att.x);
      const lv = Math.max(meta.level(att.type), inA ? 1 : 0); // ⭕ 오라 안에선 Lv0 유닛도 스킬을 씀
      if (lv > 0 && UNIT_SKILLS[att.type] && isSkillSwing(att.swings, lv, inA ? this.skills.auraSkill ?? 0 : 0, inA)) {
        if (inA) this.auraSpark(att.x); // ⭕ 오라 특수기 표시
        const resonance = inA && awakened(this.skills, 'auraSkill') ? 1.5 : 1; // 🌟 오라 공명
        this.castSkill(att, def, lv, (berserk ? BERSERK_ATK : 1) * powerMult(this.skills.power ?? 0) * (inA ? AURA_ATK * AURA_SKILL_POWER : 1) * resonance);
        let scd = attackCooldown(att.stats.atkSpeed) * hasteMult(this.skills.haste ?? 0);
        if (berserk) scd *= BERSERK_COOLDOWN;
        att.cooldown = scd;
        return;
      }
    }
    const ally = att.side === 'ally';
    const crit = ally && Math.random() < critChance(this.skills.crit ?? 0) + (this.ring('ring_luck') - 1); // 💥 치명타(🎯 스킬 · 💍 행운의 반지)
    const critMul = awakened(this.skills, 'power') ? CRIT_MULT_AWAKE : CRIT_MULT; // 💪 일격필살
    const attInAura = ally && this.inHeroAura(att.x);
    const lowHp = attInAura && att.hp / att.maxHp < 0.3 && (this.skills.auraBerserk ?? 0) > 0; // 😡 광폭 오라
    const auraAtk = attInAura ? AURA_ATK * (lowHp ? 1 + 0.4 * (this.skills.auraBerserk ?? 0) : 1) : 1; // ⭕ 오라
    const synAtk = ally ? synergyMult(this.synergies, att.type, 'atk') * powerMult(this.skills.power ?? 0) * auraAtk : 1; // 🤝 조합 · 💪 공격력
    let dmg = computeDamage(att.stats.atk * (berserk ? BERSERK_ATK : 1) * (crit ? critMul : 1) * synAtk, def.stats.def);
    if (def.side === 'ally') {
      dmg = Math.max(1, Math.round(dmg * synergyMult(this.synergies, def.type, 'guard')));
      if (awakened(this.skills, 'vigor')) dmg = Math.max(1, Math.round(dmg * 0.85)); // ❤️ 강철 피부
      if (this.inHeroAura(def.x)) dmg = Math.max(1, Math.round(dmg * AURA_GUARD * (1 - 0.06 * (this.skills.auraGuard ?? 0)))); // ⭕ 오라 · 🛡️ 수호 오라
    }
    if (ally && counterMult(att.type, def.type) > 1) {
      dmg = Math.round(dmg * COUNTER_MULT); // ⚔️ 상성
      if (this.clock - this.counterFxT > 0.7) {
        this.counterFxT = this.clock;
        const t = this.add.text(def.x, LANE_Y - 92, '🎯 효과적!', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ffe14d', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(72);
        this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 650, onComplete: () => t.destroy() });
      }
    }
    if (devFlags.oneHit && ally) dmg = Math.max(dmg, def.hp + 1); // 🛠️ 한 방 처치
    if (!ally && ENEMIES[att.type]?.ability === 'lifesteal') att.heal(Math.round(dmg * 0.5)); // 🦇 흡혈
    // 🎯 연쇄 폭발(각성): 치명타 때 주변 적도 절반 피해
    const chainDmg = Math.round(dmg * 0.5);
    const chain = crit && awakened(this.skills, 'crit') ? (x: number): void => this.splash(x, chainDmg, 'ally') : null;
    if (att.stats.range >= BattleScene.RANGED) {
      // 원거리: 궁수=화살(직선·빠름), 마법사=마법 구슬(느림·명중 시 광역)
      const p = this.projPool.acquire();
      const splashMul = SPLASH[att.type];
      const orb = ORB_UNITS.has(att.type);
      const onHit =
        splashMul || chain || ally
          ? (x: number, d: number) => {
              if (ally) playFx(this, crit ? 'critical' : orb ? 'magic' : 'arrow', x, LANE_Y - 36, { scale: crit ? 1 : orb ? 1 : 0.9 }); // 💥 명중 효과 + 소리
              if (splashMul) this.splash(x, Math.round(d * splashMul), att.side);
              chain?.(x);
            }
          : undefined;
      p.spawn(att.x + (att.side === 'ally' ? 14 : -14), LANE_Y - 24, def, dmg, att.type === 'totem_egg' ? 'egg' : ORB_UNITS.has(att.type) ? 'orb' : 'arrow', onHit, ORB_COLOR[att.type], crit);
      this.projectiles.push(p);
    } else {
      // 근접: 즉시 — 🛡️ 수호 중인 아군은 피해 없음
      if (!(def.side === 'ally' && this.clock < this.guardUntil)) def.takeDamage(dmg, crit);
      const kc = knockChance(att.type, att.side, def.type); // 💫 넉다운
      if (kc > 0 && def.active && def.hp > 0 && Math.random() < kc) this.knock(def, ally ? 1 : -1);
      chain?.(def.x);
      if (ally) playFx(this, crit ? 'critical' : 'slash', def.x - 6, LANE_Y - 36, { scale: crit ? 1 : 0.9 }); // ⚔️ 베기 · 💥 치명타(소리 포함)
      else sfx(this, 'hit');
    }
    att.lunge(); // 공격 찌르기 모션
    let cd = attackCooldown(att.stats.atkSpeed);
    if (att.side === 'ally') cd *= hasteMult(this.skills.haste ?? 0); // 신속 오라
    if (berserk) cd *= BERSERK_COOLDOWN;
    if (att.side === 'ally') cd *= synergyMult(this.synergies, att.type, 'speed');
    if (attInAura && this.clock < this.rallyUntil) cd /= RALLY_SPEED; // 📯 돌격 함성
    if (lowHp && awakened(this.skills, 'auraBerserk')) cd *= 0.5; // 😡 최후의 발악
    if (ally && awakened(this.skills, 'haste') && Math.random() < 0.2) cd = 0.12; // ⚔️ 연속 공격
    att.cooldown = cd;
  }

  /** ✨ 유닛 스킬 발동 — 효과 적용 + 스킬 동작 + 이펙트 그림 + 이름 표시 */
  private castSkill(u: Unit | Enemy, target: Unit | Enemy, lv: number, atkMul: number): void {
    const sk = UNIT_SKILLS[u.type];
    const power = u.stats.atk * atkMul * skillMult(lv) * synergyMult(this.synergies, u.type, 'atk');
    this.track('skills');
    const hit = (e: Unit | Enemy, mul = 1): void => {
      if (e.active) e.takeDamage(computeDamage(power * mul, e.stats.def));
    };
    const foes = this.enemies.filter((e) => e.active);
    const near = (x: number, r: number): Enemy[] => foes.filter((e) => Math.abs(e.x - x) <= r);
    const ahead = (len: number): Enemy[] =>
      foes
        .filter((e) => e.x >= u.x - 10 && e.x - u.x <= u.stats.range + len)
        .sort((a, b) => a.x - b.x)
        .slice(0, PIERCE_MAX);
    const now = this.time.now;
    let fxX = target.x;

    switch (sk.kind) {
      case 'aoe':
        for (const e of near(target.x, sk.radius)) hit(e);
        break;
      case 'single':
        hit(target, SINGLE_BONUS);
        break;
      case 'pierce':
        for (const e of ahead(sk.radius)) hit(e);
        fxX = u.x + Math.min(sk.radius, u.stats.range + 40);
        break;
      case 'guard':
        for (const e of near(target.x, sk.radius)) hit(e);
        u.guardUntil = now + SKILL_GUARD_SEC * 1000;
        fxX = u.x;
        break;
      case 'slow':
        for (const e of near(target.x, sk.radius)) {
          hit(e);
          e.slowUntil = now + SLOW_SEC * 1000;
        }
        break;
      case 'pull':
        for (const e of near(target.x, sk.radius)) {
          hit(e);
          const d = target.x - e.x;
          e.moveBy(Math.sign(d) * Math.min(PULL_PX, Math.abs(d)));
        }
        break;
      case 'push':
        hit(target);
        target.moveBy(Math.min(PUSH_PX, Math.max(0, this.enemyBase.x - BASE_FRONT - target.x)));
        break;
      case 'dash': {
        const len = Math.max(0, Math.min(DASH_PX, this.enemyBase.x - BASE_FRONT - u.x));
        for (const e of foes) if (e.x >= u.x - 10 && e.x <= u.x + len + u.stats.range) hit(e);
        u.moveBy(len);
        fxX = u.x;
        break;
      }
      case 'heal':
        for (const a of this.units) {
          if (a.active && Math.abs(a.x - u.x) <= sk.radius) a.heal(Math.round(power * CLERIC_HEAL_MULT * synergyMult(this.synergies, u.type, 'heal')));
        }
        fxX = u.x;
        break;
    }

    u.skillMotion();
    sfx(this, sk.kind === 'heal' ? 'heal' : u.type === 'cannon' ? 'boom_big' : 'skill');
    this.skillFx(u.type, fxX, sk.color, sk.radius);
    const t = this.add
      .text(u.x, LANE_Y - 78, `✨${sk.name}`, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffe680', stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(85);
    this.tweens.add({ targets: t, y: LANE_Y - 104, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  /** 스킬 이펙트 그림(public/sprites/fx_<유닛>) — 없으면 색 원 폭발 */
  private skillFx(type: string, x: number, color: number, radius: number): void {
    const key = textureKey(`fx_${type}`);
    if (this.textures.exists(key)) {
      const base = spriteOf(`fx_${type}`)?.scale ?? 1; // 매니페스트 height 기준 배율
      const img = this.add.image(x, LANE_Y - 18, key, 0).setDepth(78);
      img.setScale(base * 0.6).setAlpha(1);
      this.tweens.add({ targets: img, scale: base * 1.15, alpha: 0, duration: 520, ease: 'Quad.easeOut', onComplete: () => img.destroy() });
      return;
    }
    this.burst(x, color, radius);
  }

  /** 🔥 특수 무기 발사 — 게이지가 가득 찬 해금 무기만 */
  private fireWeapon(i: number): void {
    if (this.over || this.picking || this.paused || this.reviving || !this.feat.weapon) return;
    const charge = this.weapons[i];
    if (!charge) return;
    if (!charge.ready) {
      this.hud.weaponDeny(i, `⏳ 충전 중 ${Math.floor(charge.ratio * 100)}%`); // 왜 안 나가는지 알려 줌
      return;
    }
    const def = WEAPONS[i];
    const live = this.enemies.filter((e) => e.active);
    // 대상이 필요한 무기는 적이 없으면 게이지를 쓰지 않음
    const needsEnemy = ['meteor', 'arrows', 'lightning', 'shockwave', 'snipe'].includes(def.key);
    if (needsEnemy && live.length === 0) {
      this.hud.weaponDeny(i, '🎯 적이 없어요');
      return;
    }
    charge.fire();
    this.tipDone('weapon');
    if (awakened(this.skills, 'charge')) charge.fill(0.3); // 🔥 무기 달인
    this.track('weapons');
    this.banner(`${def.icon} ${def.name}!`, def.color);
    sfx(this, def.key === 'heal' ? 'heal' : def.key === 'meteor' || def.key === 'shockwave' ? 'boom_big' : 'weapon');
    // 🔧 영구 강화: 위력(피해·회복·밀어내기) / 지속시간
    const lv = meta.weaponLevel(def.key);
    const P = weaponPowerMult(lv);
    const D = weaponDurationMult(lv);
    const pw = (v: number): number => Math.round(v * P);

    switch (def.key) {
      case 'meteor': {
        const x = meteorTarget(live.map((e) => e.x)) ?? live[0].x;
        const rock = this.add.circle(x - 120, -40, 22, 0xff7a3c).setStrokeStyle(4, 0xffd34d).setDepth(80);
        this.tweens.add({
          targets: rock,
          x,
          y: LANE_Y - 10,
          duration: 380,
          ease: 'Quad.easeIn',
          onComplete: () => {
            rock.destroy();
            for (const e of this.enemies) if (e.active && Math.abs(e.x - x) <= METEOR_RADIUS) e.takeDamage(pw(METEOR_DAMAGE));
            this.burst(x, 0xff7a3c, METEOR_RADIUS);
            this.cameras.main.shake(250, 0.01);
          },
        });
        break;
      }
      case 'arrows':
        for (const e of live) {
          const a = this.add.rectangle(e.x - 30, LANE_Y - 260, 4, 26, 0xc8e06a).setAngle(-20).setDepth(80);
          this.tweens.add({ targets: a, x: e.x, y: LANE_Y - 20, duration: 260 + Math.random() * 120, onComplete: () => a.destroy() });
        }
        this.time.delayedCall(330, () => {
          for (const e of live) if (e.active) e.takeDamage(pw(ARROWS_DAMAGE));
        });
        break;
      case 'lightning':
        for (const idx of lightningTargets(live.map((e) => e.x))) {
          const e = live[idx];
          const bolt = this.add.rectangle(e.x, LANE_Y - 200, 6, 400, 0xfff6b0).setDepth(80);
          this.tweens.add({ targets: bolt, alpha: 0, scaleX: 3, duration: 260, onComplete: () => bolt.destroy() });
          e.takeDamage(pw(LIGHTNING_DAMAGE));
        }
        this.cameras.main.flash(120, 255, 240, 160);
        break;
      case 'heal':
        for (const u of this.units) {
          if (!u.active) continue;
          u.heal(Math.round(u.maxHp * Math.min(1, HEAL_UNIT_RATIO * P)));
          this.burst(u.x, 0x5cff9e, 24);
        }
        this.playerBase.heal(Math.round(this.playerBase.maxHp * HEAL_BASE_RATIO * P));
        this.burst(this.playerBase.x, 0x5cff9e, 50);
        break;
      case 'shockwave': {
        const front = Math.min(...live.map((e) => e.x));
        for (const e of live) {
          if (e.x - front > SHOCKWAVE_RANGE) continue;
          e.moveBy(Math.min(pw(SHOCKWAVE_PUSH), Math.max(0, this.enemyBase.x - BASE_FRONT - e.x)));
          e.takeDamage(pw(SHOCKWAVE_DAMAGE));
        }
        this.burst(front, 0xffa94d, SHOCKWAVE_RANGE / 2);
        this.cameras.main.shake(200, 0.008);
        break;
      }
      case 'freeze':
        this.frozenUntil = this.clock + FREEZE_SEC * D;
        this.cameras.main.flash(200, 120, 200, 255);
        break;
      case 'guard':
        this.guardUntil = this.clock + GUARD_SEC * D;
        for (const u of this.units) if (u.active) this.burst(u.x, 0x9ab4ff, 26);
        break;
      case 'berserk':
        this.berserkUntil = this.clock + BERSERK_SEC * D;
        for (const u of this.units) if (u.active) this.burst(u.x, 0xff5a6e, 26);
        break;
      case 'snipe': {
        const t = live[snipeTarget(live.map((e) => e.hp))];
        const mark = this.add.circle(t.x, LANE_Y - 20, 40).setStrokeStyle(3, 0xd58cff).setDepth(80);
        this.tweens.add({
          targets: mark,
          scale: 0.3,
          duration: 300,
          onComplete: () => {
            mark.destroy();
            if (t.active) t.takeDamage(pw(SNIPE_DAMAGE));
            this.burst(t.x, 0xd58cff, 30);
          },
        });
        break;
      }
    }
  }

  /** 무기 이름 배너 */
  /** 👑 영웅 등장 + ⭕ 오라 원 + 이동 깃발 + 💧 마나 */
  private spawnHero(): void {
    const tier = heroTier(meta.heroLevel('hero')); // 👑 진화 단계
    const look = [HERO_TIERS[tier].look, ...HERO_FALLBACK_LOOKS].find((l) => this.textures.exists(textureKey(l))) ?? HERO_TYPE;
    this.hero = new Unit(this);
    const base = heroStats(this.stage.id, this.endless ? 1 : this.stage.enemyMult ?? 1);
    const hm = heroLvMult(meta.heroLevel('hero')); // 👑 영구 강화
    this.hero.spawn(this.playerBase.x + BASE_FRONT + 40, LANE_Y, { ...base, hp: Math.round(base.hp * hm * this.ring('ring_life')), atk: Math.round(base.atk * hm) }, HERO_TYPE, 'ally', look); // 💍 생명의 반지
    this.rallyUntil = 0;
    this.hero.setBodyScale(heroBodyScale(tier));
    this.heroTarget = null;
    this.heroDir = 0;
    this.heroCd = HERO_SKILLS.map(() => 0);
    this.mana = new ResourceSystem(MANA_START, MANA_REGEN, MANA_MAX);
    // 바닥 오라 — 납작한 노란 타원 + 바깥 점선 느낌(천천히 숨쉬기)
    const fill = this.add.ellipse(0, 0, AURA_RADIUS * 2, 46, 0xffd34d, 0.13);
    const ring = this.add.ellipse(0, 0, AURA_RADIUS * 2, 46).setStrokeStyle(4, 0xffd34d, 0.85);
    const inner = this.add.ellipse(0, 0, AURA_RADIUS * 1.2, 26).setStrokeStyle(2, 0xfff0a0, 0.6);
    this.aura = this.add.container(this.hero.x, LANE_Y + 34, [fill, ring, inner]).setDepth(-3);
    this.tweens.add({ targets: [ring, inner], scaleX: 1.04, scaleY: 1.12, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /** 🎓 👆 안내 — 아직 안 본 것 중 지금 쓸 수 있는 첫 번째를 보여 줌 */
  private tutorialTick(): void {
    if (this.endless || this.tip.key) return;
    const live = this.enemies.filter((e) => e.active);
    const ahead = live.some((e) => e.x > this.hero.x && e.x - this.hero.x <= MACE_RANGE);
    const wi = this.weapons.findIndex((w) => !!w?.ready);
    const ready: Partial<Record<TipKey, boolean>> = {
      summon: this.clock > 0.3,
      hero: this.reached >= HERO_TIP_STAGE && this.clock > 2 && !!this.hero?.active,
      mace: this.feat.heroSkill && this.hero?.active && ahead && this.mana.amount >= HERO_SKILLS[0].mana && (this.heroCd[0] ?? 0) <= 0,
      weapon: this.feat.weapon && wi >= 0 && live.length > 0,
      volley: this.feat.volley && this.volleyT <= 0 && live.some((e) => e.x - this.playerBase.x <= 520),
      perfect: this.feat.perfect && this.clock > 4,
    };
    const k = nextTip(meta.tips, ready);
    if (!k) return;
    const t = TIP_TEXT[k];
    if (k === 'summon') {
      const p = this.hud.unitCardPos(Object.keys(UNITS).find((u) => meta.ownsUnit(u)) ?? '');
      if (p) this.tip.show(k, p.x, p.y, t, { ring: 74, bubbleY: 300 });
    } else if (k === 'hero') this.tip.show(k, this.hero.x - 40, LANE_Y - 40, t, { drag: true, ring: 0, bubbleY: 180, world: true });
    else if (k === 'mace') {
      const p = this.hud.heroSkillPos(0);
      if (p) this.tip.show(k, p.x, p.y, t, { ring: 50, bubbleY: 230 });
    } else if (k === 'weapon') {
      const p = this.hud.weaponPos(wi);
      if (p) this.tip.show(k, p.x, p.y, t, { from: 'above', ring: 44, bubbleY: 300 });
    } else if (k === 'volley') this.tip.show(k, this.playerBase.cx, this.playerBase.top - 34, t, { ring: 40, bubbleY: 160, world: true });
    else if (k === 'perfect') {
      const p = this.hud.beatPos();
      this.tip.show(k, p.x, p.y, t, { from: 'above', ring: 0, bubbleY: 300 });
    }
  }

  /** 🎓 안내한 행동을 했음 → 숨기고 다시 안 보여 줌 */
  private tipDone(k: TipKey): void {
    if (this.endless) return;
    if (this.tip.key === k) this.tip.hide();
    meta.markTip(k);
  }

  /** 💫 넉다운 — 뒤로 튕기고 잠깐 멈춤 */
  private knock(f: Unit | Enemy, dir: 1 | -1): void {
    f.moveBy(dir * KNOCK_PX);
    f.stunUntil = this.time.now + KNOCK_MS;
    const t = this.add.text(f.x, LANE_Y - 84, '💫', { fontSize: '22px', padding: { top: 8, bottom: 2 } }).setOrigin(0.5).setDepth(72);
    this.tweens.add({ targets: t, angle: 360, alpha: 0, y: t.y - 16, duration: KNOCK_MS, onComplete: () => t.destroy() });
    const dust = this.add.ellipse(f.x - dir * 10, LANE_Y + 30, 40, 12, 0xd8c8a0, 0.6).setDepth(-2);
    this.tweens.add({ targets: dust, scaleX: 2, alpha: 0, duration: 380, onComplete: () => dust.destroy() });
  }

  /** ⭕ 오라 안에서 스킬이 나가면 머리 위에 반짝 */
  private auraSpark(x: number): void {
    const t = this.add.text(x, LANE_Y - 96, '✨', { fontSize: '22px', padding: { top: 8, bottom: 2 } }).setOrigin(0.5).setDepth(72);
    this.tweens.add({ targets: t, y: t.y - 26, alpha: 0, scale: 1.4, duration: 520, onComplete: () => t.destroy() });
  }

  /** 🎥 화면에 붙는 UI — 깊이 98 이상(HUD·버튼·창·안내)은 카메라가 움직여도 제자리. 전장 위 안내는 setData('world') */
  private pinUiSetup(): void {
    this.uiQueue = [];
    this.uiConts = new Set();
    const onAdd = (go: Phaser.GameObjects.GameObject): void => {
      this.uiQueue.push(go);
    };
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdd);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.pinUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdd);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.pinUi, this);
    });
  }

  private pinUi(): void {
    type Pinnable = Phaser.GameObjects.GameObject & { depth?: number; setScrollFactor?: (x: number, y?: number) => unknown };
    for (const go of this.uiQueue as Pinnable[]) {
      if (!go.scene || (go.depth ?? 0) < 98 || go.getData('world')) continue;
      go.setScrollFactor?.(0, 0);
      if (go instanceof Phaser.GameObjects.Container) this.uiConts.add(go);
    }
    this.uiQueue = [];
    // 창(레벨업·일시정지 등)은 나중에 자식이 붙으므로 매번 확인(입력 판정도 자식 기준)
    const zero = (c: Phaser.GameObjects.Container): void => {
      for (const ch of c.list as (Phaser.GameObjects.GameObject & { scrollFactorX?: number; setScrollFactor?: (x: number, y?: number) => unknown })[]) {
        if (ch.scrollFactorX !== 0) ch.setScrollFactor?.(0, 0);
        if (ch instanceof Phaser.GameObjects.Container) zero(ch);
      }
    };
    for (const c of this.uiConts) {
      if (!c.scene) this.uiConts.delete(c);
      else zero(c);
    }
  }

  /** 🎥 📍 영웅에게 · ◀ 화면 밖 알림 ▶ */
  private setupCameraUi(): void {
    this.lastBaseHp = this.playerBase.hp;
    this.baseHitAt = -99;
    const style = { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff', padding: { x: 10, y: 6 } };
    this.homeBtn = this.add.text(1218, 96, '📍 영웅', { ...style, backgroundColor: '#2a5fd0ee' }).setOrigin(0.5).setDepth(106).setVisible(false).setInteractive({ useHandCursor: true });
    this.homeBtn.on('pointerdown', () => {
      this.lookX = null;
      sfx(this, 'click');
    });
    this.alertL = this.add.text(8, 190, '◀ 🏰 성이 공격받아요!', { ...style, backgroundColor: '#c0392bee' }).setOrigin(0, 0.5).setDepth(106).setVisible(false).setInteractive({ useHandCursor: true });
    this.alertL.on('pointerdown', () => this.lookAt(this.playerBase.x + 400));
    this.alertR = this.add.text(1272, 190, '👑 보스 ▶', { ...style, backgroundColor: '#8a2a8aee' }).setOrigin(1, 0.5).setDepth(106).setVisible(false).setInteractive({ useHandCursor: true });
    this.alertR.on('pointerdown', () => {
      const b = this.enemies.find((e) => e.active && BOSS.has(e.type));
      if (b) this.lookAt(b.x);
    });
  }

  /** 🗺️ 지도에서 고른 곳을 화면 가운데로(3초 손을 떼면 영웅에게 돌아옴) */
  private lookAt(x: number): void {
    if (this.worldW <= SCREEN_W) return;
    this.lookX = x - SCREEN_W / 2;
    this.lookT = LOOK_HOLD;
  }

  /** 🎥 카메라 — 영웅을 화면 왼쪽 1/3에 부드럽게 따라감 / 둘러보는 중이면 그곳 + 화면 밖 알림 */
  private updateCamera(dt: number): void {
    const cam = this.cameras.main;
    if (this.playerBase.hp < this.lastBaseHp) this.baseHitAt = this.clock;
    this.lastBaseHp = this.playerBase.hp;
    if (this.worldW <= SCREEN_W) return;
    if (this.lookX !== null) {
      this.lookT -= dt;
      if (this.lookT <= 0) this.lookX = null;
    }
    const front = this.units.reduce((m, u) => (u.active ? Math.max(m, u.x) : m), this.playerBase.x);
    const target = this.lookX ?? followX(this.hero?.active ? this.hero.x : front, this.worldW);
    const k = Math.min(1, dt * (this.lookX !== null ? 12 : 5));
    cam.scrollX += (Phaser.Math.Clamp(target, 0, this.worldW - SCREEN_W) - cam.scrollX) * k;
    this.homeBtn.setVisible(this.lookX !== null);
    // ◀ 성이 화면 밖인데 맞고 있음 / 보스가 화면 오른쪽 밖 ▶
    const blink = 0.55 + 0.45 * Math.sin(this.time.now / 130);
    const baseHidden = cam.scrollX > this.playerBase.x + 40;
    this.alertL.setVisible(baseHidden && this.clock - this.baseHitAt < 1.5).setAlpha(blink);
    const boss = this.enemies.find((e) => e.active && BOSS.has(e.type) && e.x > cam.scrollX + SCREEN_W - 30);
    this.alertR.setVisible(!!boss).setAlpha(blink);
  }

  /** 🎯 특수 관문 준비 — 규칙 안내 + 목표 표시 + (호위) 마차 */
  private setupRule(tough: boolean): void {
    this.wagon = null;
    this.goals = 0;
    this.objText = null;
    if (this.sRule === 'normal') return;
    const info = RULE_INFO[this.sRule];
    if (tough) this.add.text(this.enemyBase.x, this.enemyBase.top - 26, info.icon, { fontSize: '30px', padding: { top: 10, bottom: 4 } }).setOrigin(0.5).setDepth(60); // 부술 필요 없는 성
    this.objText = this.add
      .text(470, 74, '', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe680', backgroundColor: '#0d1424cc', padding: { x: 12, y: 5 } })
      .setOrigin(0.5)
      .setDepth(101);
    // 시작 안내 카드(3.5초)
    const card = this.add
      .text(640, 190, `${info.icon} ${info.name}
${info.desc}`, { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#3a2a10', align: 'center', lineSpacing: 8, backgroundColor: '#fff4c8', padding: { x: 22, y: 14 } })
      .setOrigin(0.5)
      .setDepth(110);
    this.tweens.add({ targets: card, alpha: 0, delay: 3500, duration: 500, onComplete: () => card.destroy() });
    if (this.sRule === 'hold') this.holdLeft = holdSeconds(this.stage.id);
    if (this.sRule === 'breach') this.goalNeed = breachGoal(this.stage.id);
    if (this.sRule === 'escort') {
      const w = new Unit(this);
      const hp = wagonHp(this.stage.baseHp, this.stage.enemyMult ?? 1);
      w.spawn(this.playerBase.x + BASE_FRONT + 10, LANE_Y, { name: '짐마차', hp, atk: 0, def: 4, atkSpeed: 1, range: 0, speed: WAGON_SPEED }, 'wagon', 'ally');
      const g = this.add.graphics();
      g.fillStyle(0xf4e6c0, 1).fillEllipse(0, -6, 58, 34); // 천 덮개
      g.lineStyle(2, 0x8a6a3a, 1).strokeEllipse(0, -6, 58, 34);
      g.fillStyle(0x3a2a1a, 1).fillCircle(-20, 26, 9).fillCircle(20, 26, 9); // 바퀴
      g.fillStyle(0xc8a060, 1).fillCircle(-20, 26, 3).fillCircle(20, 26, 3);
      g.fillStyle(0xff4a4a, 1).fillTriangle(24, -38, 24, -26, 36, -32); // 깃발
      g.lineStyle(2, 0x5a3a1a, 1).lineBetween(24, -38, 24, -12);
      w.attach(g);
      this.wagon = w;
    }
  }

  /** 🎯 특수 관문 진행 — 마차 이동 · 수성 시간 · 목표 표시 */
  private updateRule(dt: number): void {
    if (this.sRule === 'normal' || !this.objText) return;
    if (this.sRule === 'escort' && this.wagon?.active) {
      const w = this.wagon;
      const blocked = this.enemies.some((e) => e.active && e.x > w.x && e.x - w.x < WAGON_BLOCK); // 앞을 막으면 멈춤
      if (blocked || w.stunned) w.idle();
      else w.moveBy(WAGON_SPEED * this.walkK * dt);
      const left = Math.max(0, Math.round((this.enemyBase.x - BASE_FRONT - 20 - w.x) / 10));
      this.objText.setText(`🛒 마차 호위 — 남은 거리 ${left}m · ❤️ ${Math.ceil((w.hp / w.maxHp) * 100)}%${blocked ? ' · ⛔ 길이 막혔어요!' : ''}`);
    } else if (this.sRule === 'hold') {
      this.holdLeft = Math.max(0, this.holdLeft - dt);
      const s = Math.ceil(this.holdLeft);
      this.objText.setText(`🏰 수성 — 남은 시간 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`).setColor(s <= 10 ? '#7cff9a' : '#ffe680');
    } else if (this.sRule === 'breach') {
      this.objText.setText(`🏃 돌파 — 🏁 ${this.goals} / ${this.goalNeed}`);
    }
  }

  /** 🏃 돌파 — 결승선에 닿은 아군은 골인(사라짐) */
  private goalIn(u: Unit): void {
    this.goals++;
    const t = this.add.text(u.x, LANE_Y - 80, '🏁 골인!', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7cff9a', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    sfx(this, 'coin', 1.2);
    u.deactivate();
    this.unitPool.release(u);
  }

  /** ⭕ 지금 오라 반지름(영구 강화 + 레벨업 '오라 확장' + 각성) */
  private auraR(): number {
    return auraRadius(meta.heroLevel('aura'), this.skills.auraSize ?? 0, awakened(this.skills, 'auraSize'));
  }

  /** 🛠️ 개발자 치트(설정은 개발자 모드 ⚔️ 탭) */
  private applyDevCheats(): void {
    if (devFlags.infEnergy) this.energy.add(this.energy.max);
    if (devFlags.infMana) this.mana.add(this.mana.max);
    if (devFlags.godBase && this.playerBase.hp < this.playerBase.maxHp) this.playerBase.heal(this.playerBase.maxHp);
    if (devFlags.godHero && this.hero?.active) this.hero.heal(this.hero.maxHp);
    if (devFlags.noCooldown) {
      this.summonCd = {};
      this.heroCd = this.heroCd.map(() => 0);
      for (const w of this.weapons) w?.fill(1);
      this.volleyT = 0;
    }
  }

  /** 🛠️ 전투 화면 DEV 표시 + (켜 두면) 즉시 승리 · 레벨업 · 적 전멸 버튼 */
  private devHud(): void {
    if (!anyDevFlag()) return;
    const mk = (x: number, label: string, color: string, fn: () => void): void => {
      const t = this.add
        .text(x, 96, label, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff', backgroundColor: color, padding: { x: 8, y: 5 } })
        .setOrigin(0, 0.5)
        .setDepth(120)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => !this.over && !this.picking && fn());
    };
    this.add.text(12, 96, '🛠️ DEV', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffd34d', backgroundColor: '#3a2a10cc', padding: { x: 8, y: 5 } }).setOrigin(0, 0.5).setDepth(120);
    if (!devFlags.battleButtons) return;
    mk(96, '🏆 승리', '#2f7a4dee', () => (this.endless ? this.end(false) : this.end(true)));
    mk(178, '⬆️ 레벨업', '#2f5a8aee', () => this.gainXp(Math.max(1, this.xpNext - this.xp)));
    mk(280, '💀 적 전멸', '#8a3a3aee', () => {
      for (const e of this.enemies) if (e.active) e.hp = 0;
    });
  }

  /** 🏰 성 공격 — 우리 성은 적을, 적 성은 우리 유닛·영웅을 자동으로 쏨 */
  private updateCastles(dt: number): void {
    this.volleyT = Math.max(0, this.volleyT - dt);
    this.drawVolleyGauge();
    if (!this.playerBase.destroyed) {
      const lv = meta.castleLevel('castle');
      const gun = allyCastleGun(lv, meta.castleLevel('castleRate'));
      this.allyGunT -= dt;
      if (this.allyGunT <= 0) {
        const t = castleTarget(this.playerBase.x, 1, gun.range, this.enemies);
        if (t) {
          this.allyGunT = gun.interval;
          this.castleFire('ally', ALLY_CASTLE_TIERS[allyCastleTier(lv)].shot, t, gun.dmg);
        }
      }
    }
    if (!this.enemyBase.destroyed || this.endless) {
      const mult = this.endless ? endlessMult(this.waveNo) : this.stage.enemyMult ?? 1;
      const gun = enemyCastleGun(this.enemyTier, mult);
      this.enemyGunT -= dt;
      if (this.enemyGunT <= 0) {
        const targets: Unit[] = this.hero?.active ? [...this.units, this.hero] : this.units;
        const t = castleTarget(this.enemyBase.x, -1, gun.range, targets);
        if (t) {
          this.enemyGunT = gun.interval;
          this.castleFire('enemy', ENEMY_CASTLE_TIERS[this.enemyTier].shot, t, gun.dmg);
        }
      }
    }
  }

  /** 🏹 성 발사 — 단계별 발사체(화살·대포·번개·빛줄기 / 돌·독·불·암흑·저주) */
  private castleFire(side: 'ally' | 'enemy', shot: CastleShot, target: Unit | Enemy, dmg: number): void {
    const base = side === 'ally' ? this.playerBase : this.enemyBase;
    const shooters = this.archers[side];
    const from = shooters.length ? shooters[this.shooterIdx++ % shooters.length] : null;
    const sx = from ? from.x + (side === 'ally' ? 10 : -10) : base.cx + (side === 'ally' ? 20 : -20);
    const sy = from ? from.y - 12 : base.top + 30;
    if (from) this.tweens.add({ targets: from, x: from.x + (side === 'ally' ? -3 : 3), duration: 60, yoyo: true });
    // 💥 쏘는 순간 섬광
    const flash = this.add.circle(sx, sy, 9, side === 'ally' ? 0xfff0a0 : 0xff9a6a, 0.9).setDepth(86);
    this.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
    const foes: (Unit | Enemy)[] = side === 'ally' ? this.enemies : this.hero?.active ? [...this.units, this.hero] : this.units;
    const hit = (o: Unit | Enemy, d: number): void => {
      if (!o.active) return;
      if (o.side === 'ally' && this.clock < this.guardUntil) return; // 🛡️ 수호
      o.takeDamage(Math.max(1, computeDamage(d, o.stats.def)));
    };
    base.recoil();
    // 즉발: ⚡ 연쇄 번개 · ✨ 빛줄기 · 💀 저주 번개
    if (shot === 'chain' || shot === 'curse') {
      const color = shot === 'chain' ? 0x9ae8ff : 0xff3a5a;
      const chain = foes.filter((o) => o.active && Math.abs(o.x - target.x) <= 160).sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x)).slice(0, 3);
      const g = this.add.graphics().setDepth(85);
      g.lineStyle(4, color, 1).beginPath().moveTo(sx, sy);
      chain.forEach((o, i) => {
        g.lineTo(o.x, LANE_Y - 30);
        hit(o, dmg * (i === 0 ? 1 : 0.6));
      });
      g.strokePath();
      this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
      sfx(this, 'magic');
      return;
    }
    if (shot === 'beam') {
      const x1 = target.x + 90;
      const beam = this.add.rectangle((sx + x1) / 2, LANE_Y - 30, Math.abs(x1 - sx), 14, 0xfff0a0, 0.85).setDepth(85);
      this.tweens.add({ targets: beam, scaleY: 0.1, alpha: 0, duration: 380, onComplete: () => beam.destroy() });
      for (const o of foes) if (o.active && o.x >= sx && o.x <= x1) hit(o, dmg); // 관통
      for (const u of this.units) if (u.active) u.heal(Math.round(u.maxHp * 0.03)); // 아군 소량 회복
      sfx(this, 'magic');
      return;
    }
    // 날아가는 발사체
    const look: Record<string, [number, number, number]> = {
      // 색, 크기, 비행 시간(ms)
      arrow: [0xffe14d, 8, 300],
      arrow2: [0xffe14d, 8, 300],
      cannon: [0x2a2e36, 15, 460],
      rock: [0x8a7a6a, 13, 460],
      poison: [0x8aff5a, 8, 340],
      fire: [0xff7a2a, 15, 460],
      dark: [0x9a5aff, 14, 420],
    };
    const [color, size, ms] = look[shot] ?? look.arrow;
    const arrowLike = shot === 'arrow' || shot === 'arrow2' || shot === 'poison';
    const fly = (delay: number): void => {
      this.time.delayedCall(delay, () => {
        if (this.over || !target.active) return;
        const tx = target.x;
        const ty = LANE_Y - 30;
        const o = arrowLike
          ? this.add.rectangle(sx, sy, 36, size, color).setStrokeStyle(2, 0x3a2a00, 0.8).setDepth(80)
          : this.add.circle(sx, sy, size, color).setStrokeStyle(3, 0x000000, 0.5).setDepth(80);
        let trailN = 0;
        if (arrowLike) o.setRotation(Math.atan2(ty - sy, tx - sx));
        // 포물선(위로 솟았다가 떨어짐)
        const peak = Math.min(sy, ty) - (arrowLike ? 30 : 70);
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: ms,
          onUpdate: (tw) => {
            const k = tw.getValue() ?? 0;
            o.x = sx + (tx - sx) * k;
            const ny = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * peak + k * k * ty;
            if (arrowLike) o.setRotation(Math.atan2(ny - o.y, (tx - sx) / 20 || 1));
            o.y = ny;
            if (trailN++ % 2 === 0) {
              // 꼬리(잘 보이게)
              const tr = this.add.circle(o.x, o.y, arrowLike ? 3 : size * 0.6, shot === 'cannon' ? 0xb0b0b0 : color, 0.6).setDepth(79);
              this.tweens.add({ targets: tr, alpha: 0, scale: 0.3, duration: 260, onComplete: () => tr.destroy() });
            }
          },
          onComplete: () => {
            o.destroy();
            if (shot === 'cannon' || shot === 'fire') {
              for (const f of foes) if (f.active && Math.abs(f.x - tx) <= 70) hit(f, dmg); // 착탄 범위
              const boom = this.add.circle(tx, ty, 16, color === 0x2a2e36 ? 0xffa04a : color, 0.6).setDepth(80);
              this.tweens.add({ targets: boom, scale: 4, alpha: 0, duration: 320, onComplete: () => boom.destroy() });
              sfx(this, 'boom');
            } else {
              hit(target, dmg);
            }
          },
        });
        sfx(this, arrowLike ? 'arrow' : 'magic');
      });
    };
    fly(0);
    if (shot === 'arrow2') fly(160); // ★2: 연속 2발
  }

  /** 🏹 성벽 궁수 — 단계마다 늘어남(1~4), 성 쏘는 위치. 우리 = 궁수 / 적 = 고블린 궁수 */
  private placeArchers(side: 'ally' | 'enemy'): void {
    for (const a of this.archers[side]) a.destroy();
    this.archers[side] = [];
    const base = side === 'ally' ? this.playerBase : this.enemyBase;
    const tier = side === 'ally' ? allyCastleTier(meta.castleLevel('castle')) : this.enemyTier;
    const key = side === 'ally' ? 'archer' : 'goblin_archer';
    const d = spriteOf(key);
    if (!d || !this.textures.exists(textureKey(key))) return;
    const n = castleArchers(tier);
    const y = base.top + 46; // 성벽 위
    for (let i = 0; i < n; i++) {
      const x = base.cx + (n === 1 ? 0 : (i / (n - 1) - 0.5) * base.width * 0.55);
      const s = this.add
        .sprite(x, y, textureKey(key), d.anims.idle!.frames[0])
        .setOrigin(0.5, d.footY / d.frameHeight)
        .setScale((34 / d.frameHeight) * (d.frameHeight / (d.footY || d.frameHeight)))
        .setFlipX(side === 'enemy')
        .setDepth(0);
      s.play(animKey(key, 'idle'));
      this.archers[side].push(s);
    }
  }

  /** 🎯 성 특수 공격 게이지(우리 성 위) — 다 차면 반짝 */
  private drawVolleyGauge(): void {
    const g = this.volleyGauge;
    const x = this.playerBase.cx;
    const y = this.playerBase.top - 34;
    const r = 20;
    g.clear();
    if (this.playerBase.destroyed || !this.feat.volley) {
      this.volleyIcon.setVisible(false);
      return;
    }
    const ready = this.volleyT <= 0;
    g.fillStyle(0x0b0f1a, 0.75).fillCircle(x, y, r + 3);
    g.lineStyle(5, ready ? 0xffd34d : 0x6ab8ff, 1);
    g.beginPath();
    g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - this.volleyT / VOLLEY_CD), false);
    g.strokePath();
    if (ready) g.lineStyle(2, 0xffffff, 0.5 + 0.5 * Math.sin(this.time.now / 150)).strokeCircle(x, y, r + 6);
    const icon = VOLLEY_NAMES[allyCastleTier(meta.castleLevel('castle'))].split(' ')[0];
    this.volleyIcon.setVisible(true).setPosition(x, y).setText(icon).setAlpha(ready ? 1 : 0.5).setScale(ready ? 1 + 0.08 * Math.sin(this.time.now / 120) : 1);
  }

  /** 🎯 성 특수 공격 — 단계별(화살비·화살 폭풍·일제 포격·번개 폭풍·성광 기둥) */
  private castleVolley(): void {
    if (this.over || this.paused || this.picking || this.reviving || this.playerBase.destroyed || !this.feat.volley) return;
    if (this.volleyT > 0) {
      this.hud.heroDeny(`🏰 ${Math.ceil(this.volleyT)}초 후 사용 가능`);
      return;
    }
    const lv = meta.castleLevel('castle');
    const tier = allyCastleTier(lv);
    const gun = allyCastleGun(lv, meta.castleLevel('castleRate'));
    const targets = this.enemies
      .filter((e) => e.active && e.x - this.playerBase.x <= gun.range + 120)
      .sort((a, b) => a.x - b.x)
      .slice(0, VOLLEY_MAX);
    if (!targets.length) {
      this.hud.heroDeny('🏰 사거리 안에 적이 없어요');
      return;
    }
    this.volleyT = VOLLEY_CD;
    this.tipDone('volley');
    const dmg = gun.dmg * VOLLEY_MULT;
    this.banner(VOLLEY_NAMES[tier] + '!', 0xffd34d);
    this.cameras.main.shake(250, 0.006);
    sfx(this, 'weapon');
    this.playerBase.recoil();
    const hit = (o: Enemy, d: number): void => {
      if (o.active) o.takeDamage(Math.max(1, computeDamage(d, o.stats.def)), true);
    };
    targets.forEach((e, i) => {
      this.time.delayedCall(i * 90, () => {
        if (this.over || !e.active) return;
        const x = e.x;
        const y = LANE_Y - 30;
        if (tier <= 1) {
          // 🏹 하늘에서 화살이 쏟아짐
          for (let k = 0; k < (tier === 0 ? 3 : 5); k++) {
            const a = this.add.rectangle(x - 30 + k * 15, y - 260, 6, 30, 0xffe14d).setStrokeStyle(1, 0x3a2a00).setDepth(85);
            this.tweens.add({ targets: a, y, duration: 230 + k * 25, ease: 'Quad.easeIn', onComplete: () => a.destroy() });
          }
          this.time.delayedCall(240, () => hit(e, dmg));
        } else if (tier === 2) {
          // 💣 포탄 낙하 + 폭발(범위)
          const ball = this.add.circle(x, y - 280, 15, 0x2a2e36).setStrokeStyle(3, 0x000000).setDepth(85);
          this.tweens.add({
            targets: ball,
            y,
            duration: 320,
            ease: 'Quad.easeIn',
            onComplete: () => {
              ball.destroy();
              for (const o of this.enemies) if (o.active && Math.abs(o.x - x) <= 80) hit(o, dmg * 0.8);
              const boom = this.add.circle(x, y, 20, 0xffa04a, 0.7).setDepth(85);
              this.tweens.add({ targets: boom, scale: 4.5, alpha: 0, duration: 380, onComplete: () => boom.destroy() });
              sfx(this, 'boom');
            },
          });
        } else if (tier === 3) {
          // ⚡ 번개
          const bolt = this.add.rectangle(x, y - 160, 10, 320, 0xbff0ff, 0.95).setDepth(85);
          this.tweens.add({ targets: bolt, alpha: 0, scaleX: 3, duration: 280, onComplete: () => bolt.destroy() });
          hit(e, dmg);
          sfx(this, 'magic');
        } else {
          // ✨ 성광 기둥 + 아군 회복
          const pillar = this.add.rectangle(x, y - 150, 60, 340, 0xfff6c0, 0.8).setDepth(85);
          this.tweens.add({ targets: pillar, alpha: 0, scaleX: 0.2, duration: 450, onComplete: () => pillar.destroy() });
          hit(e, dmg * 1.2);
        }
      });
    });
    if (tier === 4) for (const u of this.units) if (u.active) u.heal(Math.round(u.maxHp * 0.1));
  }

  /** 🏰 적은 우리 성 앞, 아군은 적 성 앞까지만 */
  private keepOffBases(): void {
    const enemyMin = this.playerBase.x + BASE_STOP;
    for (const e of this.enemies) if (e.active && e.x < enemyMin) e.moveBy(enemyMin - e.x);
    if (this.enemyBase.destroyed) return;
    const allyMax = this.enemyBase.x - BASE_STOP;
    for (const u of this.units) if (u.active && u.x > allyMax) u.moveBy(allyMax - u.x);
  }

  private inHeroAura(x: number): boolean {
    return !!this.hero?.active && inAura(x, this.hero.x, this.auraR());
  }

  /** 👑 영웅 — 탭/키로 이동, 서 있을 땐 가까운 적·적 기지 공격, 조금씩 체력 회복 */
  private updateHero(dt: number): void {
    const h = this.hero;
    if (!h?.active) return;
    h.heal(h.maxHp * HERO_REGEN * dt);
    h.cooldown -= dt;
    if (h.stunned) {
      // 💫 기절: 이동·공격 불가(끌어 둔 목표는 기절이 풀리면 이어서)
      h.setStatus(STUN_TINT);
      h.idle();
      this.aura.x = h.x;
      return;
    }
    h.setStatus(null);
    const min = this.playerBase.x + BASE_FRONT - 10;
    const max = this.enemyBase.x - BASE_FRONT - 20;
    const goal = this.heroDir !== 0 ? h.x + this.heroDir * 200 : this.heroTarget;
    let moved = false;
    if (goal !== null && Math.abs(Phaser.Math.Clamp(goal, min, max) - h.x) > 2) {
      // 적을 지나갈 수 없음 — 앞(뒤) 가장 가까운 적 앞에서 멈추고 싸움, 적이 쓰러지면 다시 이동
      const [lo, hi] = heroMoveRange(h.x, this.enemies.filter((e) => e.active).map((e) => e.x), min, max);
      const nx = stepToward(h.x, goal, h.stats.speed * this.walkK * this.ring('ring_wind'), dt, lo, hi); // 💍 바람의 반지
      if (Math.abs(nx - h.x) > 0.3) {
        h.faceDir(nx < h.x ? -1 : 1);
        h.moveBy(nx - h.x);
        moved = true;
      }
    } else {
      this.heroTarget = null;
    }
    if (!moved) {
      h.faceDir(1);
      const target = this.nearest(h.x, this.enemies) as Enemy | null;
      if (target && inRange(h.x, target.x, h.stats.range + REACH + 10)) {
        this.attack(h, target);
      } else if (!this.enemyBase.destroyed && inRange(h.x, this.enemyBase.x, h.stats.range + BASE_REACH + 30)) {
        if (h.cooldown <= 0) {
          this.enemyBase.takeDamage(computeDamage(h.stats.atk, 0));
          h.cooldown = attackCooldown(h.stats.atkSpeed);
          h.lunge();
        } else h.idle();
      } else {
        h.idle();
      }
    }
    this.aura.x = h.x;
    this.aura.scaleX = this.auraR() / AURA_RADIUS; // 오라가 넓어지면 원도 커짐
    const rally = this.clock < this.rallyUntil;
    this.aura.setAlpha(rally ? 1 : 0.85);
    // 🛡️ 치유의 땅(수호 오라 각성): 오라 안 아군 초당 2% 회복
    if (awakened(this.skills, 'auraGuard')) for (const u of this.units) if (u.active && this.inHeroAura(u.x)) u.heal(u.maxHp * 0.02 * dt);
  }

  /** 👑 영웅 스킬 사용 — 💧 마나 + 대기시간 */
  private castHeroSkill(i: number): void {
    if (this.over || this.picking || this.paused || this.reviving || !this.hero?.active || !this.feat.heroSkill) return;
    if (this.hero.stunned) {
      this.hud.heroDeny('💫 기절 중!');
      return;
    }
    const sk = HERO_SKILLS[i];
    if (!sk || (this.heroCd[i] ?? 0) > 0) return;
    if (!meta.ownsHeroSkill(sk.key)) {
      this.hud.heroDeny('🔒 강화 화면에서 해금!');
      return;
    }
    if (!this.mana.spend(sk.mana)) {
      this.hud.heroDeny('💧 마나 부족!');
      return;
    }
    this.heroCd[i] = sk.cooldown;
    if (sk.key === 'mace') this.tipDone('mace');
    const pw = heroSkillPower(meta.heroLevel(sk.key)); // 👑 스킬 강화
    this.hero.skillMotion(); // 진화 그림의 스킬 동작
    if (sk.key === 'mace') this.throwMace(pw);
    else if (sk.key === 'rally') this.rally(pw);
    else if (sk.key === 'holy') this.holyLight(pw);
  }

  /** 📯 돌격 함성 — 오라 안 유닛 공격 속도 증가(지속 = 5초 × 위력) */
  private rally(pw: number): void {
    this.rallyUntil = this.clock + RALLY_SEC * pw;
    this.banner('📯 돌격!', 0xffb02e);
    sfx(this, 'weapon');
    const ring = this.add.ellipse(this.hero.x, LANE_Y + 34, this.auraR() * 2, 46).setStrokeStyle(8, 0xffb02e).setDepth(85);
    this.tweens.add({ targets: ring, scaleX: 1.5, scaleY: 2.2, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
  }

  /** ✨ 성스러운 빛 — 오라 안 아군 회복 + 오라 안 적 밀쳐내기 */
  private holyLight(pw: number): void {
    const h = this.hero;
    for (const u of this.units) if (u.active && this.inHeroAura(u.x)) u.heal(Math.round(u.maxHp * HOLY_HEAL * pw));
    h.heal(Math.round(h.maxHp * HOLY_HERO_HEAL * pw));
    for (const e of this.enemies) {
      if (!e.active || BOSS.has(e.type) || !this.inHeroAura(e.x)) continue;
      e.moveBy(Math.min(HOLY_PUSH, Math.max(0, this.enemyBase.x - BASE_FRONT - e.x)));
    }
    this.banner('✨ 성스러운 빛!', 0xfff0a0);
    if (!playFx(this, 'heal', h.x, LANE_Y + 6, { scale: 1.1 })) sfx(this, 'heal');
    const r = this.auraR();
    const pillar = this.add.rectangle(h.x, LANE_Y - 140, r * 2, 300, 0xfff6c0, 0.45).setDepth(84);
    this.tweens.add({ targets: pillar, alpha: 0, scaleX: 1.2, duration: 700, onComplete: () => pillar.destroy() });
  }

  /** 🔨 철퇴 던지기 — 앞으로 빙글빙글 날아가 가까운 적 2명 관통 */
  private throwMace(pw = 1): void {
    const h = this.hero;
    // 🛡️ 장착 무기 — 그림이 회전하며 날아가고, 무기마다 추가 효과
    const wk = meta.weaponEq;
    const g = Math.max(1, meta.equipGrade(wk));
    const wdef = HERO_WEAPONS.find((w) => w.key === wk) ?? HERO_WEAPONS[0];
    const targets = maceTargets(h.x, this.enemies);
    const scepter = wk === 'healing_scepter';
    const dmg = Math.round(h.stats.atk * MACE_MULT * pw * powerMult(this.skills.power ?? 0) * weaponPower(g) * (scepter ? 0.6 : 1));
    const endX = targets.length ? targets[targets.length - 1].x : h.x + MACE_RANGE;
    sfx(this, 'slash');
    const m: Phaser.GameObjects.Image | Phaser.GameObjects.Text = this.textures.exists(textureKey('equip_weapon_icons'))
      ? this.add.image(h.x + 20, LANE_Y - 60, textureKey('equip_weapon_icons'), wdef.frame).setDisplaySize(52, 52).setDepth(80)
      : this.add.text(h.x + 20, LANE_Y - 60, '🔨', { fontSize: '34px' }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: m, angle: 720, duration: 320 });
    if (scepter) {
      // 🌿 치유의 홀 — 던지는 순간 오라 안 아군 회복
      const heal = scepterHeal(g);
      for (const u of [...this.units, h]) if (u.active && this.inHeroAura(u.x)) u.heal(Math.round(u.maxHp * heal));
      playFx(this, 'heal', h.x, LANE_Y + 6, { scale: 1.1 });
    }
    this.tweens.add({
      targets: m,
      x: endX,
      y: LANE_Y - 30,
      duration: 320,
      ease: 'Quad.easeIn',
      onComplete: () => {
        for (const e of targets) {
          if (!e.active) continue;
          e.takeDamage(computeDamage(dmg, e.stats.def), true);
          if (wk === 'frost_mace') e.slowUntil = this.time.now + frostSec(g) * 1000; // ❄️ 느려짐
          if (wk === 'golden_mace' && e.hp <= 0) {
            // 💰 황금 철퇴로 처치 — 골드 추가
            const extra = Math.round(e.reward * (goldMaceMult(g) - 1));
            this.runGold += extra;
            const t = this.add.text(e.x, LANE_Y - 90, `+🪙${extra}`, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffe14d', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(80);
            this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
          }
        }
        if (wk === 'thunder_hammer' && targets.length) this.chainBolt(targets[targets.length - 1].x, Math.round(dmg * 0.5), chainCount(g), targets);
        if (wk === 'flame_mace') this.burns.push({ x: endX, until: this.clock + 3, dmg: Math.round(h.stats.atk * burnMult(g)), t: 0 });
        if (wk === 'frost_mace') playFx(this, 'frost', endX + 60, LANE_Y + 26, { scale: 0.6, sound: false, depth: 56 });
        if (targets.length) sfx(this, 'hit');
        this.tweens.add({ targets: m, alpha: 0, y: m.y - 30, duration: 200, onComplete: () => m.destroy() });
      },
    });
  }

  /** ⚡ 번개 망치 — 맞은 자리에서 가까운 적 n명에게 번개가 튐 */
  private chainBolt(fromX: number, dmg: number, n: number, skip: Enemy[]): void {
    const near = this.enemies
      .filter((e) => e.active && !skip.includes(e) && Math.abs(e.x - fromX) <= 220)
      .sort((a, b) => Math.abs(a.x - fromX) - Math.abs(b.x - fromX))
      .slice(0, n);
    let px = fromX;
    near.forEach((e, i) => {
      this.time.delayedCall(i * 70, () => {
        if (!e.active) return;
        const gfx = this.add.graphics().setDepth(81);
        gfx.lineStyle(4, 0xfff27a, 1).beginPath();
        gfx.moveTo(px, LANE_Y - 50);
        gfx.lineTo((px + e.x) / 2, LANE_Y - 80);
        gfx.lineTo(e.x, LANE_Y - 40);
        gfx.strokePath();
        px = e.x;
        this.tweens.add({ targets: gfx, alpha: 0, duration: 260, onComplete: () => gfx.destroy() });
        e.takeDamage(computeDamage(dmg, e.stats.def), false);
      });
    });
    if (near.length) sfx(this, 'magic');
  }

  /** 🔥 화염 메이스 불바다 — 0.5초마다 주변 적 피해 */
  private updateBurns(dt: number): void {
    for (const b of this.burns) {
      b.t -= dt;
      if (b.t > 0) continue;
      b.t = 0.5;
      const f = this.add.text(b.x + Phaser.Math.Between(-40, 40), LANE_Y + 6, '🔥', { fontSize: '24px', padding: { top: 8, bottom: 2 } }).setOrigin(0.5, 1).setDepth(56);
      this.tweens.add({ targets: f, y: f.y - 24, alpha: 0, duration: 450, onComplete: () => f.destroy() });
      for (const e of this.enemies) if (e.active && Math.abs(e.x - b.x) <= 70) e.takeDamage(Math.max(1, Math.round(b.dmg * 0.5)), false);
    }
    this.burns = this.burns.filter((b) => this.clock < b.until);
  }

  /** 💍 장착 반지 배수(다른 반지면 1) */
  private ring(k: RingKey): number {
    return ringMult(meta.ringEq, meta.ringEq ? meta.equipGrade(meta.ringEq) : 0, k);
  }

  /** 🗿 설치물 — 알 대포는 쏘고, 화염은 주변 불, 회복은 주변 회복. 60초 지나면 사라짐 */
  private totemAct(u: Unit, dt: number): void {
    const end = this.totemEnd.get(u) ?? Infinity;
    if (this.clock >= end) {
      u.hp = 0; // 사라짐(정리 단계에서 사라지는 동작)
      this.totemEnd.delete(u);
      return;
    }
    u.setStatus(end - this.clock < 5 && Math.floor(this.time.now / 200) % 2 === 0 ? 0x8a8a8a : null); // 곧 사라짐 — 깜빡
    const kind = TOTEMS[u.type].kind;
    u.cooldown -= dt;
    if (kind === 'shooter') {
      const t = this.enemies.find((e) => e.active && e.x > u.x - 20 && e.x - u.x <= u.stats.range);
      if (t) this.attack(u, t);
      else u.idle();
      return;
    }
    if (u.cooldown > 0) return;
    if (kind === 'burn') {
      const hit = this.enemies.filter((e) => e.active && Math.abs(e.x - u.x) <= u.stats.range);
      if (!hit.length) return u.idle();
      for (const e of hit) e.takeDamage(computeDamage(u.stats.atk * powerMult(this.skills.power ?? 0), e.stats.def), false);
      u.cooldown = 1 / u.stats.atkSpeed;
      u.lunge();
      return;
    }
    const hurt = [...this.units, ...(this.hero?.active ? [this.hero] : [])].filter((a) => a.active && a !== u && a.hp < a.maxHp && Math.abs(a.x - u.x) <= u.stats.range);
    if (!hurt.length) return u.idle();
    for (const a of hurt) a.heal(totemHeal(u.stats.atk));
    playFx(this, 'heal', u.x, LANE_Y + 6, { scale: 0.7, volume: 0.4, depth: 55 });
    u.cooldown = 1 / u.stats.atkSpeed;
    u.lunge();
  }

  /** 다음 소환이 공짜인가 — 🎁 무료 소환 남음 / 💎 마나 순환(각성: 5번째마다) */
  private nextSummonFree(): boolean {
    return this.freeSummons > 0 || (awakened(this.skills, 'magic') && this.summonCount % 5 === 4);
  }

  /** 레벨업 카드 보여 주기(다시 뽑기 포함) */
  private showLevelUp(): void {
    if (!meta.tips.includes('levelup')) {
      this.tip.show('levelup', 640, 96, TIP_TEXT.levelup, { depth: 320, ring: 0, bubbleY: 34, finger: false });
      meta.markTip('levelup');
    }
    this.levelUp.show(
      this.skills,
      this.choices,
      this.rerolls,
      (key) => this.pickSkill(key),
      () => {
        if (this.rerolls <= 0) return;
        this.rerolls--;
        sfx(this, 'click');
        this.choices = rollChoices(this.skills, Math.random);
        this.showLevelUp();
      }
    );
  }

  /** 레벨업 스킬 적용 — 즉시 효과는 바로, 나머지는 레벨 +1(MAX면 ✨ 각성) */
  private pickSkill(key: string): void {
    if (this.tip.key === 'levelup') this.tip.hide();
    const def = SKILL_BY_KEY[key];
    this.picking = false;
    this.choices = [];
    if (!def) return;
    if (def.instant) {
      if (key === 'energyNow') this.energy.add(this.energy.max);
      else if (key === 'repair') this.playerBase.heal(Math.round(this.playerBase.maxHp * 0.3));
      else if (key === 'freeSummon') this.freeSummons += 3;
      this.banner(`${def.icon} ${def.name}!`, 0x7cff9a);
      return;
    }
    this.skills[key] = (this.skills[key] ?? 0) + 1;
    if (def.awaken && this.skills[key] >= def.max) {
      if (key === 'recharge') this.energy.raiseCap(50); // 🔋 마력 폭주
      sfx(this, 'levelup');
      this.banner(`✨ 각성! ${def.awaken.name}`, 0xffe14d);
    }
  }

  /** 🎉 레벨업 순간 보너스 — 에너지 +30 · 아군 20% 회복 · 적 밀쳐내기 + 반짝 */
  private levelUpBurst(): void {
    this.energy.add(30);
    for (const u of this.units) if (u.active) u.heal(Math.round(u.maxHp * 0.2));
    if (this.hero?.active) this.hero.heal(Math.round(this.hero.maxHp * 0.2));
    for (const e of this.enemies) if (e.active && !BOSS.has(e.type)) e.moveBy(Math.min(40, Math.max(0, this.enemyBase.x - BASE_FRONT - e.x)));
    const ring = this.add.circle(this.playerBase.x + 80, LANE_Y - 30, 30).setStrokeStyle(8, 0xffe14d).setDepth(85);
    this.tweens.add({ targets: ring, scale: 14, alpha: 0, duration: 650, onComplete: () => ring.destroy() });
    const flash = this.add.rectangle(640, 360, 1280, 720, 0xfff6c0, 0.35).setDepth(98);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
  }

  private banner(text: string, color: number): void {
    const t = this.add
      .text(640, 230, text, {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(110);
    this.tweens.add({ targets: t, y: 200, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  /** 원형 폭발/효과 링 */
  private burst(x: number, color: number, radius: number): void {
    const c = this.add.circle(x, LANE_Y - 10, Math.max(8, radius / 3), color, 0.45).setDepth(75);
    this.tweens.add({ targets: c, scale: 3, alpha: 0, duration: 380, onComplete: () => c.destroy() });
  }

  /** 📋 이번 판 기록(판 끝날 때 meta에 한 번에 반영) */
  private track(k: keyof Stats, n = 1): void {
    this.run[k] = (this.run[k] ?? 0) + n;
  }

  private commitRun(): void {
    if (this.committed) return;
    this.committed = true;
    if ((this.run.kills ?? 0) >= 100) this.track('bigRuns'); // 🏅 한 판 기록 업적
    if (this.level - 1 >= 8) this.track('levelRuns');
    meta.addRunStats(this.run);
    meta.addKills(this.kills);
  }

  /** 🤝 전장 유닛 조합 갱신 — 새로 켜지면 배너 */
  private updateSynergies(): void {
    const types = this.units.filter((u) => u.active).map((u) => u.type);
    const now = activeSynergies(types);
    const keys = now.map((s) => s.key).join(',');
    if (keys === this.synergyKeys) return;
    const prev = new Set(this.synergyKeys.split(','));
    this.synergyKeys = keys;
    this.synergies = now;
    this.hud.setSynergies(now);
    let row = 0;
    for (const s of now) {
      if (prev.has(s.key)) continue;
      const t = this.add
        .text(640, 150 + 32 * row++, `🤝 ${s.icon} ${s.name}!  ${s.desc}`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#aef5ff', stroke: '#0a2a4a', strokeThickness: 5 })
        .setOrigin(0.5)
        .setDepth(110);
      this.tweens.add({ targets: t, y: t.y - 25, alpha: 0, delay: 1100, duration: 500, onComplete: () => t.destroy() });
    }
  }

  /** ⭐ 엘리트: 체력 3배·공격 1.5배·보상 3배, 크고 금빛 */
  private makeElite(e: Enemy): void {
    e.stats = { ...e.stats, atk: Math.round(e.stats.atk * 1.5) };
    e.maxHp = Math.round(e.maxHp * 3);
    e.hp = e.maxHp;
    e.reward *= 3;
    e.makeElite();
  }

  /** 🌊 특수 웨이브 — 2스테이지부터 주기적으로 */
  private updateEvents(dt: number): void {
    if ((!this.endless && this.stage.id < 2) || this.enemyBase.destroyed) return;
    this.eventT -= dt;
    if (this.eventT > 0) return;
    this.eventT = EVENT_EVERY;
    const events = [
      { text: '🦇 박쥐 떼 습격!', go: () => this.burstSpawn('bat', 8, 260) },
      { text: '🐺 늑대 무리 돌진!', go: () => this.burstSpawn('wolf', 6, 320) },
      { text: '⭐ 엘리트 부대 출현!', go: () => ['goblin', 'orc', 'skeleton'].forEach((t, i) => this.time.delayedCall(i * 700, () => this.spawnEnemy(t, true))) },
      { text: '👻 유령 행렬!', go: () => this.burstSpawn('ghost', 6, 360) },
    ];
    // 👾 변종 특수 웨이브 — 그 변종이 나오는 단계부터
    const lv = enemyLevel(this.endless, this.stage.id, this.waveNo);
    const exact = (type: string, n: number, gap: number) => (): void => {
      for (let i = 0; i < n; i++) this.time.delayedCall(i * gap, () => !this.over && this.spawnEnemy(type, false, undefined, true));
    };
    if (lv >= 3) events.push({ text: '💣 고블린 폭탄 돌격!', go: exact('goblin_bomber', 5, 420) });
    if (lv >= 4) events.push({ text: '🧪 독 부대 행진!', go: () => (exact('poison_slime', 3, 600)(), exact('toxic_mushroom', 3, 700)()) });
    if (lv >= 5) events.push({ text: '🏹 해골 궁수대!', go: exact('skeleton_archer', 5, 500) });
    if (lv >= 6) events.push({ text: '🟡 킹 슬라임 출현!', go: exact('king_slime', 1, 0) });
    if (lv >= 8) events.push({ text: '💀 강령술사 등장!', go: () => (exact('necromancer', 1, 0)(), exact('skeleton_knight', 2, 900)()) });
    if (lv >= 9) events.push({ text: '🐲 새끼 드래곤 무리!', go: exact('baby_dragon', 3, 800) });
    const ev = events[Math.floor(Math.random() * events.length)];
    sfx(this, 'alert');
    this.banner(ev.text, 0xff9a3c);
    ev.go();
  }

  /** 👾 변종 능력 — 💚 치유(3초마다 주변 적) · 📣 소환 · 😡 분노(체력 40% 아래 공격력 ×1.8) */
  private enemyAbility(e: Enemy, dt: number): void {
    const d = ENEMIES[e.type];
    e.abilityT += dt;
    if (d.ability === 'heal' && e.abilityT >= 3) {
      e.abilityT = 0;
      const amt = Math.round(e.stats.atk * 2.5);
      let any = false;
      for (const o of this.enemies) {
        if (!o.active || o.hp >= o.maxHp || Math.abs(o.x - e.x) > 140) continue;
        o.heal(amt);
        any = true;
      }
      if (any) {
        const fx = this.add.circle(e.x, LANE_Y - 20, 20, 0x8aff8a, 0.4).setDepth(55);
        this.tweens.add({ targets: fx, scale: 5, alpha: 0, duration: 500, onComplete: () => fx.destroy() });
      }
    } else if (d.ability === 'summon' && d.summon && e.abilityT >= (d.every ?? 8)) {
      e.abilityT = 0;
      this.spawnEnemy(d.summon, false, e.x + 40, true);
      const fx = this.add.circle(e.x + 40, LANE_Y - 10, 16, 0x9a5aff, 0.5).setDepth(55);
      this.tweens.add({ targets: fx, scale: 3, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
    } else if (d.ability === 'rage' && !e.raged && e.hp < e.maxHp * 0.4) {
      e.raged = true;
      e.stats = { ...e.stats, atk: Math.round(e.stats.atk * 1.8), speed: Math.round(e.stats.speed * 1.3) };
      e.setVariant(0xff3a2a, (d.scale ?? 1) * 1.15);
      const t = this.add.text(e.x, LANE_Y - 90, '😡 분노!', { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff5a4a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }
  }

  /** 👾 쓰러질 때 — 💥 폭발(주변 아군·영웅 피해) · 🟢 분열(작은 적 여러 마리) */
  private onEnemyDeath(e: Enemy): void {
    const d = ENEMIES[e.type];
    if (!d?.ability) return;
    if (d.ability === 'explode') {
      const dmg = Math.round((d.power ?? 40) * (e.stats.atk / d.atk));
      const r = 85;
      const victims: (Unit | null)[] = [...this.units, this.hero ?? null];
      for (const u of victims) if (u?.active && Math.abs(u.x - e.x) <= r && this.clock >= this.guardUntil) u.takeDamage(dmg);
      const color = hexColor(d.tint) ?? 0xff8a3a;
      const boom = this.add.circle(e.x, LANE_Y - 10, 20, color, 0.6).setDepth(80);
      this.tweens.add({ targets: boom, scale: (r / 20) * 1.1, alpha: 0, duration: 420, onComplete: () => boom.destroy() });
      sfx(this, 'boom');
    } else if (d.ability === 'split' && d.split) {
      const n = d.count ?? 2;
      for (let i = 0; i < n; i++) this.spawnEnemy(d.split, false, e.x + (i - (n - 1) / 2) * 34, true);
    }
  }

  private burstSpawn(type: string, n: number, gapMs: number): void {
    for (let i = 0; i < n; i++) this.time.delayedCall(i * gapMs, () => !this.over && this.spawnEnemy(type));
  }

  /** 👑 보스 패턴 — 골렘: 땅 내려치기(주변 기절) / 드래곤: 화염 숨결 + 박쥐 소환. 0.8초 전 경고 */
  private bossPattern(e: Enemy, dt: number): void {
    const def = BOSSES[e.type];
    if (!def) return;
    e.patternT += dt;
    e.summonT += dt;
    // 📣 주기 소환(드래곤 박쥐 · 마왕 오크 족장)
    if (def.summon && def.summon.every > 0 && e.summonT >= def.summon.every) {
      e.summonT = 0;
      for (let i = 0; i < def.summon.n; i++) this.time.delayedCall(i * 300, () => !this.over && e.active && this.spawnEnemy(def.summon!.type, false, e.x + 30, true));
    }
    if (e.patternT < def.every) return;
    e.patternT = 0;
    const x0 = e.x - def.reach[0]; // 영향 범위(왼쪽 = 우리 쪽)
    const x1 = e.x + def.reach[1];
    const warn = this.dangerZone(x0, x1, def.color, def.icon, 800);
    fxWarning(this); // ⚠️ 예고음
    e.skillMotion(); // 👑 보스 스킬 동작
    this.time.delayedCall(800, () => {
      warn.destroy();
      if (!e.active || this.over) return;
      this.bossSkill(e, def, x0, x1);
    });
  }

  /** 👑 보스 스킬 효과 — 구역 안 아군·영웅에게 피해 + 스킬별 추가 효과 */
  private bossSkill(e: Enemy, def: (typeof BOSSES)[string], x0: number, x1: number): void {
    const now = this.time.now;
    const mul: Record<string, number> = { roots: 1.0, slam: 1.2, breath: 1.4, frost: 1.1, poison: 0.9, eruption: 1.5, raise: 0.6, shards: 1.6, charge: 1.3, shadow: 1.0, hellfire: 1.5 };
    const victims: Unit[] = this.hero?.active ? [...this.units, this.hero] : this.units;
    for (const u of victims) {
      if (!u.active || u.x < x0 || u.x > x1) continue;
      const guard = u === this.hero ? 1 : synergyMult(this.synergies, u.type, 'guard');
      const dmg = computeDamage(e.stats.atk * (mul[def.skill] ?? 1.2), u.stats.def) * guard;
      if (this.clock >= this.guardUntil) u.takeDamage(Math.max(1, Math.round(dmg)));
      if (def.skill === 'slam') u.stunUntil = now + 1500; // 💫 기절
      if (def.skill === 'frost') u.stunUntil = now + 2000; // ❄️ 빙결
      if (def.skill === 'roots') u.stunUntil = now + 2000; // 🌿 뿌리 묶기
      if (def.skill === 'poison') this.poisonTick(u, Math.round(dmg * 0.25), 4); // 🧪 독(4초)
      if (def.skill === 'shadow') u.stats = { ...u.stats, atk: Math.round(u.stats.atk * 0.97) }; // 🌑 공격력 조금씩 약화
    }
    const fx = (color: number, emoji: string): void => {
      const n = Math.max(4, Math.round((x1 - x0) / 40));
      for (let i = 0; i < n; i++) {
        const fxX = x0 + ((i + 0.5) * (x1 - x0)) / n;
        const f = this.add.text(fxX, LANE_Y + 10, emoji, { fontSize: `${28 + Math.random() * 14}px`, padding: { top: 10, bottom: 4 } }).setOrigin(0.5, 1).setDepth(56).setScale(0.2);
        this.tweens.add({ targets: f, scale: 1, y: LANE_Y - 10 - Math.random() * 20, delay: i * 25, duration: 180, ease: 'Back.easeOut' });
        this.tweens.add({ targets: f, alpha: 0, y: f.y - 50, delay: 260 + i * 25, duration: 320, onComplete: () => f.destroy() });
      }
      const glow = this.add.ellipse((x0 + x1) / 2, LANE_Y + 30, x1 - x0, 50, color, 0.5).setDepth(-2);
      this.tweens.add({ targets: glow, alpha: 0, duration: 600, onComplete: () => glow.destroy() });
    };
    // 💥 효과 팩 그림이 있는 기술 — 시전자 발밑에서 왼쪽(우리 쪽)으로 펼쳐짐, 범위에 맞춰 늘림(소리 포함)
    const PACK: Partial<Record<string, FxKey>> = { slam: 'slam', frost: 'frost', breath: 'breath', hellfire: 'hellfire', eruption: 'eruption', charge: 'charge' };
    const packKey = PACK[def.skill];
    if (packKey) {
      const sx = Phaser.Math.Clamp(def.reach[0] / 300, 1.15, 1.8); // 게임 속 보스는 크게 그려져서 최소 1.15배
      if (playFx(this, packKey, e.x, LANE_Y + 26, { scale: sx, scaleY: Math.min(sx, 1.5), depth: 56 })) {
        if (def.skill === 'slam') this.cameras.main.shake(300, 0.012);
        else if (def.skill === 'hellfire') this.cameras.main.shake(400, 0.014);
        else if (def.skill !== 'breath' && def.skill !== 'charge') this.cameras.main.shake(300, 0.01);
        if (def.skill === 'charge') e.moveBy(-Math.min(def.reach[0] * 0.6, Math.max(0, e.x - (this.playerBase.x + BASE_FRONT + 40)))); // ⚡ 돌진
        return;
      }
    }
    switch (def.skill) {
      case 'roots':
        fx(0x6ad84a, '🌿');
        for (let i = 0; i < (def.summon?.n ?? 2); i++) this.time.delayedCall(i * 250, () => !this.over && e.active && this.spawnEnemy(def.summon?.type ?? 'mushroom', false, e.x - 50 - i * 40, true));
        sfx(this, 'boom');
        break;
      case 'slam':
        this.cameras.main.shake(300, 0.012);
        this.burst(e.x, 0xb08a5a, 120);
        sfx(this, 'boom');
        break;
      case 'frost':
        this.cameras.main.shake(300, 0.01);
        fx(0x7ad8ff, '❄️');
        sfx(this, 'boom');
        break;
      case 'breath':
      case 'hellfire':
        fx(def.color, '🔥');
        if (def.skill === 'hellfire') this.cameras.main.shake(400, 0.014);
        sfx(this, 'boom_big');
        break;
      case 'poison':
        fx(0x8aff5a, '🧪');
        sfx(this, 'magic');
        break;
      case 'eruption':
        fx(0xff6a2a, '🌋');
        this.cameras.main.shake(350, 0.012);
        sfx(this, 'boom_big');
        break;
      case 'raise':
        for (let i = 0; i < (def.summon?.n ?? 3); i++) this.time.delayedCall(i * 200, () => !this.over && this.spawnEnemy(def.summon?.type ?? 'skeleton', false, e.x - 60 - i * 40, true));
        fx(0x5aff9a, '💀');
        sfx(this, 'magic');
        break;
      case 'shards':
        fx(0xc08aff, '💎');
        sfx(this, 'magic');
        break;
      case 'charge': {
        const dash = Math.min(def.reach[0] * 0.6, Math.max(0, e.x - (this.playerBase.x + BASE_FRONT + 40)));
        e.moveBy(-dash); // ⚡ 앞으로 돌진
        fx(0xffe14d, '⚡');
        sfx(this, 'boom');
        break;
      }
      case 'shadow':
        fx(0x9a5aff, '🌑');
        sfx(this, 'magic');
        break;
    }
  }

  /** 🧪 독 — 1초마다 n번 피해 */
  private poisonTick(u: Unit, dmg: number, n: number): void {
    for (let i = 1; i <= n; i++) this.time.delayedCall(i * 1000, () => u.active && !this.over && u.takeDamage(Math.max(1, dmg)));
    u.setStatus(0x8aff5a);
    this.time.delayedCall(n * 1000, () => u.active && u.setStatus(null));
  }

  /** ⚠️ 보스 공격 예고 구역 — 바닥에 납작한 원 + 가운데서 차오르는 원(차면 공격) + 위에 아이콘 */
  private dangerZone(x0: number, x1: number, color: number, icon: string, ms: number): { destroy: () => void } {
    const w = x1 - x0;
    const h = 52;
    const glow = this.add.ellipse(0, 0, w + 24, h + 14, color, 0.12);
    const base = this.add.ellipse(0, 0, w, h, color, 0.16);
    const edge = this.add.ellipse(0, 0, w, h).setStrokeStyle(3, color, 0.95);
    const inner = this.add.ellipse(0, 0, w * 0.55, h * 0.55).setStrokeStyle(2, 0xffffff, 0.35);
    const fill = this.add.ellipse(0, 0, w, h, color, 0.38).setScale(0.05); // 차오르는 타이밍
    const cx = (x0 + x1) / 2;
    // 구역 양 끝 바닥에 경고 아이콘(큰 보스 몸에 가리지 않게)
    const mark = this.add.text(x0 + 14, LANE_Y + 30, icon, { fontSize: '24px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setDepth(70);
    const bang = this.add.text(x1 - 14, LANE_Y + 30, '⚠️', { fontSize: '22px' }).setOrigin(0.5).setDepth(70);
    const c = this.add.container(cx, LANE_Y + 30, [glow, base, fill, edge, inner]).setDepth(-2); // 바닥(유닛 아래)
    this.tweens.add({ targets: fill, scale: 1, duration: ms, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: [edge, glow], alpha: 0.35, duration: 160, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: [mark, bang], scale: 1.25, duration: 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return {
      destroy: () => {
        c.destroy();
        mark.destroy();
        bang.destroy();
      },
    };
  }

  /** 👑 보스 처치 — 잠깐 슬로모션 + 화면 번쩍 + 문구 */
  private bossDown(x: number): void {
    this.slowmo = 0.3;
    this.applySpeed();
    this.cameras.main.flash(250, 255, 240, 200);
    this.cameras.main.shake(400, 0.015);
    sfx(this, 'boom_big');
    this.burst(x, 0xffd34d, 140);
    const t = this.add
      .text(640, 220, '👑 BOSS DOWN!', { fontFamily: 'sans-serif', fontSize: '56px', fontStyle: 'bold', color: '#ffe14d', stroke: '#7a3a00', strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(110)
      .setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 700, duration: 300, onComplete: () => t.destroy() });
    // 실제 시간 0.9초 뒤 원래 속도(슬로모션 영향 안 받게 브라우저 타이머)
    window.setTimeout(() => {
      if (!this.scene.isActive()) return;
      this.slowmo = 1;
      this.applySpeed();
    }, 900);
  }

  /** 마법 구슬 광역 피해 — 명중 지점 주변 적(또는 아군)에게 추가 피해 + 폭발 이펙트 */
  private splash(x: number, dmg: number, side: 'ally' | 'enemy'): void {
    const list = side === 'ally' ? this.enemies : this.units;
    for (const o of list) {
      if (o.active && Math.abs(o.x - x) <= 64) o.takeDamage(dmg);
    }
    const fx = this.add.circle(x, LANE_Y - 10, 14, 0xb98cff, 0.5).setDepth(55);
    this.tweens.add({ targets: fx, scale: 3.4, alpha: 0, duration: 300, onComplete: () => fx.destroy() });
  }

  private puff(x: number, color: number): void {
    const y = LANE_Y - 10;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 28 + Math.random() * 46;
      const c = this.add.circle(x, y, 3 + Math.random() * 2, color).setDepth(60);
      this.tweens.add({
        targets: c,
        x: x + Math.cos(a) * sp,
        y: y + Math.sin(a) * sp - 10,
        alpha: 0,
        duration: 380,
        onComplete: () => c.destroy(),
      });
    }
  }

  private cleanupDead(): void {
    for (const e of this.enemies) {
      if (e.active && e.hp <= 0) {
        this.runGold += e.reward;
        this.gainXp(e.reward);
        sfx(this, 'coin');
        this.track('kills');
        if (e.elite) this.track('elites');
        if (BOSS.has(e.type)) {
          this.track('bosses');
          this.bossDown(e.x);
        }
        this.kills[e.type] = (this.kills[e.type] ?? 0) + 1; // 📖 도감
        this.onEnemyDeath(e); // 💥 폭발 · 🟢 분열
        e.playDeath();
        this.puff(e.x, 0xff8a6a);
        this.enemyPool.release(e);
      }
    }
    for (const u of this.units) {
      if (u.active && u.hp <= 0) {
        u.playDeath();
        this.puff(u.x, 0x8ab4ff);
        this.unitPool.release(u);
      }
    }
    this.enemies = this.enemies.filter((e) => e.active);
    this.units = this.units.filter((u) => u.active);
  }

  private checkEnd(): void {
    // 승리 = 적 생산기지 파괴 / 패배 = 우리 기지 파괴
    if (!this.endless && this.enemyBase.destroyed) return this.end(true);
    // 🎯 특수 관문 승패
    if (this.sRule === 'escort' && this.wagon) {
      if (this.wagon.hp <= 0) {
        this.puff(this.wagon.x, 0x9a6a3a);
        this.wagon.deactivate();
        this.banner('🛒 마차가 부서졌어요…', 0xff7a8a);
        return this.end(false);
      }
      if (this.wagon.x >= this.enemyBase.x - BASE_FRONT - 20) {
        this.banner('🛒 마차 도착!', 0x7cff9a);
        return this.end(true);
      }
    }
    if (this.sRule === 'hold' && this.holdLeft <= 0) {
      this.banner('🏰 성을 지켜냈다!', 0x7cff9a);
      return this.end(true);
    }
    if (this.sRule === 'breach' && this.goals >= this.goalNeed) {
      this.banner('🏁 돌파 성공!', 0x7cff9a);
      return this.end(true);
    }
    if (this.hero && this.hero.hp <= 0 && this.hero.active) {
      // 👑 영웅이 쓰러지면 바로 패배
      this.hero.playDeath();
      this.puff(this.hero.x, 0xffd34d);
      this.hero.deactivate();
      this.aura.setVisible(false);
      this.banner('👑 영웅이 쓰러졌어요…', 0xff7a8a);
      return this.end(false);
    }
    if (this.playerBase.destroyed) {
      if (!this.revivedOnce) {
        this.offerRevive(); // 광고 보고 부활 1회 제안
        return;
      }
      return this.end(false);
    }
  }

  /** 💔 기지 파괴 → 광고 보고 부활 제안(한 판 1회) */
  private offerRevive(): void {
    if (this.reviving || this.revivedOnce) return;
    this.reviving = true; // 업데이트 정지
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setInteractive();
    const panel = this.add.rectangle(640, 360, 480, 340, 0x241824).setStrokeStyle(3, 0xff5a6e);
    const title = this.add.text(640, 250, '💔 기지 파괴!', { fontFamily: 'sans-serif', fontSize: '40px', color: '#ff5a6e' }).setOrigin(0.5);
    const sub = this.add.text(640, 310, '광고를 보고 기지를 부활시킬까요?', { fontFamily: 'sans-serif', fontSize: '20px', color: '#cfd6e6' }).setOrigin(0.5);
    layer.add([dim, panel, title, sub]);

    const watch = this.add
      .text(640, 380, '📺 광고 보고 부활', { fontFamily: 'sans-serif', fontSize: '26px', color: '#fff', backgroundColor: '#2eae5a', padding: { x: 24, y: 12 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    watch.on('pointerdown', () => {
      watch.disableInteractive().setText('⏳ 광고…');
      void showRewarded().then((ok) => {
        layer.destroy();
        if (ok) this.doRevive();
        else {
          this.reviving = false;
          this.end(false);
        }
      });
    });

    const give = this.add
      .text(640, 450, '포기', { fontFamily: 'sans-serif', fontSize: '20px', color: '#8892b0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    give.on('pointerdown', () => {
      layer.destroy();
      this.reviving = false;
      this.end(false);
    });
    layer.add([watch, give]);
  }

  /** 부활 실행 — 기지 HP 복구 + 전장 적 밀어내기 */
  private doRevive(): void {
    this.revivedOnce = true;
    this.reviving = false;
    this.playerBase.heal(Math.round(this.playerBase.maxHp * 0.6));
    // 기지 근처 적들을 적 진영 쪽으로 밀어내 숨 돌릴 틈 제공
    for (const e of this.enemies) {
      if (e.active) e.moveBy(260);
    }
    this.energy.add(60);
    const t = this.add
      .text(640, 300, '✨ 부활! ✨', { fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#ffe14d' })
      .setOrigin(0.5)
      .setDepth(120);
    this.tweens.add({ targets: t, y: 240, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  /** 🎁 상자 내용 정하고 바로 지급(결과 화면은 여는 연출만) */
  private openChest(tier: ChestLoot['tier'], goldMult: number): ChestLoot {
    const owned = Object.keys(UNITS).filter((k) => meta.ownsUnit(k));
    // 💍 행운의 반지: 확률로 상자 한 등급 위
    const up = Math.random() < (ringPct('ring_luck', meta.ringEq === 'ring_luck' ? meta.equipGrade('ring_luck') : 0) * 2) / 100;
    const t = Math.min(3, tier + (up ? 1 : 0)) as ChestLoot['tier'];
    const loot = rollChest(t, owned, this.usedUnits, goldMult, Math.random);
    loot.equip = rollEquip(t, Math.random); // 🛡️ 영웅 장비
    meta.grantChest(loot);
    return loot;
  }

  private end(win: boolean): void {
    this.over = true;
    this.picking = false;
    this.levelUp.hide();
    if (this.endless) {
      // ♾️ 버틴 웨이브 기록 + 보상(웨이브×20 + 처치 골드 20%)
      const wave = Math.max(1, this.waveNo);
      const earned = endlessReward(wave) + Math.floor(this.runGold * 0.2);
      meta.addGold(earned);
      const newBest = meta.recordEndless(wave);
      const ct = chestForEndless(wave);
      const chest = ct === null ? null : this.openChest(ct, 1);
      this.commitRun();
      bgm(this, null);
      sfx(this, newBest ? 'win' : 'lose');
      this.slowmo = 1;
      this.time.delayedCall(600, () => this.scene.start('Result', { win: false, stageId: 0, earned, mode: 'endless', wave, newBest, chest }));
      return;
    }
    if (this.rule) {
      // 📅 오늘의 도전 — 별·관문 기록 없음, 하루 첫 승리에 보너스 + 금 상자
      const first = win && meta.winDaily();
      const bonus = first ? dailyBonus(this.stage.id) : 0;
      const earned = this.runGold + bonus;
      meta.addGold(earned);
      const chest = first ? this.openChest(2, goldMultFor(this.stage.id)) : null;
      if (win) this.track('clears');
      this.commitRun();
      bgm(this, null);
      sfx(this, win ? 'win' : 'lose');
      this.slowmo = 1;
      this.time.delayedCall(600, () => this.scene.start('Result', { win, stageId: this.stage.id, earned, mode: 'daily', dailyBonus: bonus, ruleName: this.stage.name, chest }));
      return;
    }
    // ⭐ 별 평가: 우리 기지 남은 체력(부활했으면 1개), 처음 얻는 별마다 보너스 골드
    const stars = win ? starsFor(this.playerBase.hp / this.playerBase.maxHp, this.revivedOnce) : 0;
    const prevStars = meta.starsOf(this.stage.id);
    const gained = win ? meta.recordStars(this.stage.id, stars) : 0;
    const starGold = gained * STAR_GOLD;
    const earned = win ? Math.round((this.runGold + 60 + this.stage.id * 30) * goldMultFor(this.stage.id)) + starGold : 0; // 💰 깊은 월드일수록 골드 ↑
    const prevCleared = meta.clearedMax; // 🎓 결과 화면 '다음 관문에서 해금' 안내
    if (win) {
      meta.addGold(earned); // 처치 골드 + 승리 보너스 + 새 별 보너스(강화용)
      meta.clearStage(this.stage.id); // 다음 스테이지 해금
    }
    // 🎁 보물 상자 — 별·보스·첫 클리어로 등급
    const boss = bossForStage(this.stage.id);
    const slot = ((this.stage.id - 1) % 10) + 1;
    const chest = win ? this.openChest(chestForStage(stars, this.stage.id > prevCleared, boss ? (slot === 10 ? 'world' : 'mid') : null), goldMultFor(this.stage.id)) : null;
    // ⏱️ 클리어 시간(게임 시간 기준 — 배속과 무관)
    const time = Math.round(this.clock);
    const timeRec = win ? meta.recordTime(this.stage.id, time) : null;
    // ⏱️ 목표 시간 안에 깨면 보너스
    const target = targetTime(this.stage, this.sRule);
    const targetGold = win && target !== null && time <= target ? Math.round(targetBonus(this.stage.id) * goldMultFor(this.stage.id)) : 0;
    if (targetGold > 0) {
      meta.addGold(targetGold);
      this.track('timeGoals');
    }
    if (win) {
      this.track('clears');
      if (this.sRule !== 'normal') this.track('specials');
    }
    this.commitRun();
    bgm(this, null);
    sfx(this, win ? 'win' : 'lose');
    this.slowmo = 1;
    this.time.delayedCall(600, () =>
      this.scene.start('Result', { win, stageId: this.stage.id, earned, stars, prevStars, starGold, time, timeRec, prevCleared, chest, target, targetGold })
    );
  }
}
