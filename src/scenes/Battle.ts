import Phaser from 'phaser';
import unitsData from '../data/units.json';
import enemiesData from '../data/enemies.json';
import stagesData from '../data/stages.json';
import type { UnitStats, EnemyStats, StageData } from '../types';
import { Unit } from '../entities/Unit';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Base } from '../entities/Base';
import { UNIT_SCALE } from '../entities/Fighter';
import { FOOD_BASE, energyMax, energyRate, popBonus } from '../systems/baseUpgrades';
import { summonCooldown } from '../systems/pacing';
import { HERO_TYPE, HERO_LOOKS, HERO_REGEN, HERO_SKILLS, AURA_ATK, AURA_GUARD, AURA_RADIUS, MANA_MAX, MANA_REGEN, MANA_START, MACE_MULT, MACE_RANGE, RALLY_SEC, RALLY_SPEED, HOLY_HEAL, HOLY_HERO_HEAL, HOLY_PUSH, HERO_ENEMY_HP, heroStats, heroLvMult, heroSkillPower, auraRadius, inAura, maceTargets, stepToward } from '../systems/hero';
import { HERO_PANEL_X, HERO_BTN_R, HERO_BTN_Y } from '../ui/Hud';
import { Pool } from '../utils/pool';
import { ResourceSystem } from '../systems/resources';
import { WaveSystem } from '../systems/waves';
import { computeDamage, attackCooldown, inRange } from '../systems/combat';
import { meta, applyUpgrade } from '../systems/upgrades';
import { xpToNext, hasteMult, mimicMult, magicMult, supplyBonus, anyUpgradable, rollChoices, awakened, SKILL_BY_KEY, vigorMult, rechargeMult, powerMult, critChance, chargeMult, type SkillDef } from '../systems/skills';
import { Hud } from '../ui/Hud';
import { LevelUpOverlay } from '../ui/LevelUp';
import { showRewarded } from '../systems/ads';
import {
  UNIT_SKILLS,
  isSkillSwing,
  skillMult,
  SINGLE_BONUS,
  GUARD_SEC as SKILL_GUARD_SEC,
  SLOW_SEC,
  PULL_PX,
  PUSH_PX,
  DASH_PX,
  PIERCE_MAX,
} from '../systems/unitSkills';
import { spriteOf, textureKey } from '../systems/sprites';
import { ensureSkin } from '../systems/skinTextures';
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
const ORB_UNITS = new Set(['mage', 'earthmage', 'darkmage', 'cannon']);
const SPLASH: Record<string, number> = { mage: 0.6, earthmage: 0.8, cannon: 0.9 };
const ORB_COLOR: Record<string, number> = { earthmage: 0xd8903a, darkmage: 0x6a2aff, cannon: 0x2a2e36 };
const CLERIC_HEAL_MULT = 2.5; // 성직자 1회 치유량 = 공격력 × 2.5

const FROZEN_TINT = 0x7cd8ff;
const GUARD_TINT = 0xb0c4ff;
const BERSERK_TINT = 0xff9a9a;

const PROD_TYPES = ['goblin', 'wolf', 'slime', 'bat']; // 적 기지가 계속 생산하는 병력
const BOSS = new Set(['ogre', 'dragon']); // 보스 타입

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;
const STAGES = stagesData as StageData[];

const LANE_Y = 340; // 하단 HUD 2단(유닛 카드 + 특수 무기, 410~) 위 전장 바닥
const REACH = 14 * (UNIT_SCALE - 1) * 2; // 커진 몸집만큼 사거리 여유(겹침 방지)
const BASE_REACH = REACH + 18; // 커진 기지 앞에서 멈춤

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
  private heroFlag!: Phaser.GameObjects.Text; // 이동 목표 깃발
  private aura!: Phaser.GameObjects.Container; // ⭕ 오라 원
  private mana!: ResourceSystem; // 💧 영웅 스킬 전용
  private heroCd: number[] = []; // 영웅 스킬별 남은 대기(초)
  private rallyUntil = 0; // 📯 돌격 함성 끝나는 시각(clock)
  private xpNext = xpToNext(1);
  private skills: Record<string, number> = {};
  private picking = false;
  private levelUp!: LevelUpOverlay;
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

  init(data: { stageId: number; mode?: 'endless' }): void {
    this.endless = data.mode === 'endless';
    this.stage = this.endless ? endlessStage() : STAGES.find((s) => s.id === data.stageId) ?? STAGES[0];
  }

  /** 🌄 전장 배경 — 하늘 그라데이션 · 달 · 별 · 먼 언덕 2겹(위쪽 빈 공간 채우기) */
  private drawBackdrop(sky: number, lane: number, line: number): void {
    const mix = (a: number, b: number, t: number): number => {
      const ca = Phaser.Display.Color.IntegerToColor(a);
      const cb = Phaser.Display.Color.IntegerToColor(b);
      return Phaser.Display.Color.GetColor(ca.red + (cb.red - ca.red) * t, ca.green + (cb.green - ca.green) * t, ca.blue + (cb.blue - ca.blue) * t);
    };
    const g = this.add.graphics().setDepth(-9);
    const horizon = mix(sky, line, 0.55);
    g.fillGradientStyle(sky, sky, horizon, horizon, 1);
    g.fillRect(0, 44, 1280, LANE_Y - 44);
    // 달
    g.fillStyle(0xfff4c8, 0.12);
    g.fillCircle(980, 130, 58);
    g.fillStyle(0xfff4c8, 0.85);
    g.fillCircle(980, 130, 34);
    // 먼 언덕(뒤) → 가까운 언덕(앞)
    const hills = (baseY: number, amp: number, color: number, seed: number): void => {
      g.fillStyle(color, 1);
      g.beginPath();
      g.moveTo(0, LANE_Y);
      for (let x = 0; x <= 1280; x += 20) g.lineTo(x, baseY - amp * (0.55 + 0.45 * Math.sin(x / 140 + seed) * Math.cos(x / 310 + seed * 2)));
      g.lineTo(1280, LANE_Y);
      g.closePath();
      g.fillPath();
    };
    hills(LANE_Y - 120, 90, mix(sky, line, 0.35), 1.3);
    hills(LANE_Y - 40, 70, mix(sky, lane, 0.8), 4.1);
    // 반짝이는 별
    for (let i = 0; i < 26; i++) {
      const st = this.add.circle(Phaser.Math.Between(10, 1270), Phaser.Math.Between(56, LANE_Y - 170), Phaser.Math.FloatBetween(1, 2.4), 0xffffff, 0.8).setDepth(-8);
      this.tweens.add({ targets: st, alpha: 0.15, duration: Phaser.Math.Between(900, 2200), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
    }
  }

  create(): void {
    this.over = false;
    this.paused = false;
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

    // 배경 + 레인
    const [sky, lane, line] = THEMES[this.endless ? 'endless' : this.stage.world === 2 ? 'desert' : 'forest'];
    this.add.rectangle(640, 360, 1280, 720, sky).setDepth(-10);
    this.drawBackdrop(sky, lane, line);
    this.add.rectangle(640, LANE_Y + 40, 1280, 80, lane).setDepth(-5);
    this.add.rectangle(640, LANE_Y + 2, 1280, 3, line).setDepth(-4);

    this.playerBase = new Base(this, 90, LANE_Y - 10, this.stage.baseHp, 0x2f6fe0, 'base_ally');
    // 무한 모드: 적 기지는 부서지지 않는 생산 기지(버틴 웨이브가 기록)
    this.enemyBase = new Base(this, 1190, LANE_Y - 10, this.endless ? 1e9 : this.stage.baseHp, 0xc0392b, 'base_enemy');
    this.spawnHero();
    this.waveNo = 0;
    this.waveText = null;
    if (this.endless) {
      this.add.text(1190, LANE_Y - 128, '∞', { fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#d8b0ff', stroke: '#2a1a4a', strokeThickness: 5 }).setOrigin(0.5).setDepth(60);
      this.waveText = this.add
        .text(900, 22, '', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#d8b0ff' })
        .setOrigin(0.5)
        .setDepth(101);
    }

    this.energy = new ResourceSystem(40, energyRate(meta.baseLevel('energy')), energyMax(meta.baseLevel('energy'))); // 소환 에너지(기본 초당 9·상한 100, 🏰 기지 강화로 증가)
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
    this.looks = Object.fromEntries(Object.keys(UNITS).map((k) => [k, ensureSkin(this, k, meta.equippedSkin(k))]));
    this.hud = new Hud(
      this,
      UNITS,
      (type) => this.trySpawnUnit(type),
      (type) => this.doBattleUpgrade(type),
      (i) => this.fireWeapon(i),
      this.weapons.map((w) => !!w),
      this.unitOwned,
      this.looks,
      (i) => this.castHeroSkill(i),
      HERO_SKILLS.map((s) => meta.ownsHeroSkill(s.key))
    );
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
    // 👑 전장을 탭하면 영웅이 그 자리로 이동(하단 HUD·상단 바·영웅 스킬 버튼 제외)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.over || this.picking || this.paused || this.reviving || !this.hero?.active) return;
      if (p.y < 60 || p.y > 405) return;
      if (p.x > HERO_PANEL_X - HERO_SKILLS.length * (HERO_BTN_R * 2 + 14) - 10 && p.y < HERO_BTN_Y + HERO_BTN_R + 10) return; // 영웅 스킬 버튼·마나 바
      this.heroTarget = p.x;
      this.heroFlag.setPosition(Phaser.Math.Clamp(p.x, this.playerBase.x + 40, this.enemyBase.x - 70), LANE_Y - 4).setVisible(true).setAlpha(1);
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
    this.bossBarBg = this.add.rectangle(640, 60, 540, 18, 0x000000, 0.6).setDepth(90).setVisible(false);
    this.bossFill = this.add.rectangle(640 - 260, 60, 520, 12, 0xff3b3b).setOrigin(0, 0.5).setDepth(91).setVisible(false);
    this.bossText = this.add
      .text(640, 60, '', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' })
      .setOrigin(0.5)
      .setDepth(92)
      .setVisible(false);

    // ⏸️ 일시정지 버튼(우상단)
    const pauseBtn = this.add
      .text(1250, 16, '⏸', { fontFamily: 'sans-serif', fontSize: '28px', color: '#cfe0ff', backgroundColor: '#1d2740', padding: { x: 10, y: 4 } })
      .setOrigin(1, 0)
      .setDepth(95)
      .setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.openPause());

    // ⏩ 배속 버튼(일시정지 왼쪽)
    this.speedBtn = this.add
      .text(1186, 16, '', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe680', backgroundColor: '#1d2740', padding: { x: 10, y: 7 } })
      .setOrigin(1, 0)
      .setDepth(95)
      .setInteractive({ useHandCursor: true });
    this.speedBtn.on('pointerdown', () => {
      BattleScene.speed = BattleScene.speed === 1 ? 2 : 1;
      sfx(this, 'click');
      this.applySpeed();
    });
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

  /** ⏸️ 일시정지 오버레이 — 계속 / 음소거 / 나가기 */
  private openPause(): void {
    if (this.over || this.reviving || this.paused) return;
    this.paused = true;
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65).setInteractive();
    const panel = this.add.rectangle(640, 360, 420, 320, 0x182238).setStrokeStyle(3, 0x3a7bff);
    const title = this.add.text(640, 250, '⏸️ 일시정지', { fontFamily: 'sans-serif', fontSize: '34px', color: '#fff' }).setOrigin(0.5);
    layer.add([dim, panel, title]);

    const resume = this.add
      .text(640, 330, '▶ 계속', { fontFamily: 'sans-serif', fontSize: '26px', color: '#fff', backgroundColor: '#2eae5a', padding: { x: 24, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => {
      this.paused = false;
      layer.destroy();
    });

    const muted = this.sound.mute;
    const mute = this.add
      .text(640, 395, muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffd34d', backgroundColor: '#20304e', padding: { x: 20, y: 8 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => {
      setMute(this, !this.sound.mute);
      mute.setText(this.sound.mute ? '🔇 소리 꺼짐' : '🔊 소리 켜짐');
    });

    const quit = this.add
      .text(640, 455, '🏳️ 나가기', { fontFamily: 'sans-serif', fontSize: '20px', color: '#8892b0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => {
      this.paused = false;
      layer.destroy();
      this.commitRun();
      this.scene.start('StageSelect');
    });
    layer.add([resume, mute, quit]);
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
    if (!base || !meta.ownsUnit(type)) return; // 🔒 구매 안 한 유닛
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
    const m = applyUpgrade(base, meta.level(type)); // 영구 강화 적용
    const perfect = Math.abs(this.beat - 0.5) <= BattleScene.PERFECT_WIN; // ⏱️ 타이밍 명중
    const pm = perfect ? 1.3 : 1;
    const bm = 1 + (this.battleUpg[type] ?? 0) * 0.2; // 🛠️ 전장 강화
    if (this.freeSummons > 0) this.freeSummons--;
    this.summonCount++;
    this.summonCd[type] = summonCooldown(base.cost); // ⏱️ 같은 유닛 재소환 대기
    const vm = vigorMult(this.skills.vigor ?? 0); // ❤️ 튼튼한 몸
    const stats = { ...m, hp: Math.round(m.hp * bm * pm * vm), atk: Math.round(m.atk * bm * pm) };
    const u = this.unitPool.acquire();
    u.spawn(this.playerBase.x + 50, LANE_Y, stats, type, 'ally', this.looks[type] ?? type); // 👗 착용 스킨
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
    this.xp += Math.round(base * mimicMult(this.skills.mimic ?? 0));
    while (this.xp >= this.xpNext && !this.picking) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpToNext(this.level);
      this.levelUpBurst();
      if (anyUpgradable(this.skills)) {
        this.picking = true;
        sfx(this, 'levelup');
        this.choices = rollChoices(this.skills, Math.random);
        this.showLevelUp();
        break; // 한 번에 한 레벨만 선택(나머지는 선택 후 이어서)
      }
    }
  }

  private linePos(): number {
    let front = this.playerBase.x;
    for (const u of this.units) if (u.active && u.x > front) front = u.x;
    const span = this.enemyBase.x - this.playerBase.x;
    return span > 0 ? (front - this.playerBase.x) / span : 0;
  }

  private spawnEnemy(type: string, elite = false): void {
    const stats = ENEMIES[type];
    if (!stats) return;
    const e = this.enemyPool.acquire();
    e.spawn(this.enemyBase.x - 50, LANE_Y, stats, type, 'enemy');
    e.reward = stats.reward;
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
        .text(640, 210, '👑 보스 등장!', { fontFamily: 'sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#ff5a6e' })
        .setOrigin(0.5)
        .setDepth(95);
      this.tweens.add({ targets: t, y: 170, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
    }
  }

  private updateBossBar(): void {
    const boss = this.enemies.find((e) => e.active && BOSS.has(e.type));
    if (boss) {
      this.bossBarBg.setVisible(true);
      this.bossFill.setVisible(true).setSize(520 * Math.max(0, boss.hp / boss.maxHp), 12);
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
    const wc = chargeMult(this.skills.charge ?? 0); // 🔥 무기 충전
    for (const w of this.weapons) w?.update(dt * wc);
    const frozen = this.clock < this.frozenUntil;
    const guard = this.clock < this.guardUntil;
    const berserk = this.clock < this.berserkUntil;

    this.energy.update(dt * rechargeMult(this.skills.recharge ?? 0)); // 🔋 에너지 충전
    for (const k in this.summonCd) this.summonCd[k] = Math.max(0, this.summonCd[k] - dt);
    this.mana.update(dt * (1 + 0.2 * (this.skills.prayer ?? 0))); // 🙏 기도
    this.heroCd = this.heroCd.map((c) => Math.max(0, c - dt));
    this.updateHero(dt);
    for (const ev of this.waves.update(dt)) this.spawnEnemy(ev.type);

    // 적 기지가 병력을 계속 생산(기지 파괴 전까지) → 기지를 부숴야 생산이 멈춤
    if (!this.enemyBase.destroyed) {
      this.prodTimer -= dt;
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
      if (u.type === 'cleric') {
        // ✚ 성직자: 공격하지 않음 — 다친 아군 치유, 없으면 맨 앞 아군 뒤를 따라감
        if (!this.clericHeal(u, dt)) this.clericFollow(u, dt);
        continue;
      }
      const target = this.nearest(u.x, this.enemies) as Enemy | null;
      u.cooldown -= dt;
      if (target && inRange(u.x, target.x, u.stats.range + REACH)) {
        this.attack(u, target);
      } else if (target) {
        u.moveBy(u.stats.speed * dt);
      } else if (inRange(u.x, this.enemyBase.x, u.stats.range + BASE_REACH)) {
        if (u.cooldown <= 0) {
          this.enemyBase.takeDamage(computeDamage(u.stats.atk * (berserk ? BERSERK_ATK : 1), 0));
          u.cooldown = attackCooldown(u.stats.atkSpeed) * (berserk ? BERSERK_COOLDOWN : 1);
          u.lunge();
        } else {
          u.idle();
        }
      } else {
        u.moveBy(u.stats.speed * dt);
      }
    }

    // 적: 아군 추격/공격, 없으면 전진 → 플레이어 기지 공격 (👑 영웅도 노림)
    const allyTargets: Unit[] = this.hero?.active ? [...this.units, this.hero] : this.units;
    for (const e of this.enemies) {
      if (!e.active) continue;
      e.setStatus(frozen ? FROZEN_TINT : null, frozen);
      if (frozen) continue; // ❄️ 빙결: 이동·공격 정지
      if (BOSS.has(e.type)) this.bossPattern(e, dt);
      const target = this.nearest(e.x, allyTargets) as Unit | null;
      e.cooldown -= dt;
      if (target && inRange(e.x, target.x, e.stats.range + REACH)) {
        this.attack(e, target);
      } else if (target) {
        e.moveBy(-e.stats.speed * e.speedMult * dt);
      } else if (inRange(e.x, this.playerBase.x, e.stats.range + BASE_REACH)) {
        if (e.cooldown <= 0) {
          this.playerBase.takeDamage(computeDamage(e.stats.atk, 0));
          e.cooldown = attackCooldown(e.stats.atkSpeed);
          e.lunge();
        } else {
          e.idle();
        }
      } else {
        e.moveBy(-e.stats.speed * e.speedMult * dt);
      }
    }

    // 투사체 이동/명중
    for (const p of this.projectiles) {
      if (p.active && p.update(dt)) this.projPool.release(p);
    }
    this.projectiles = this.projectiles.filter((p) => p.active);

    this.cleanupDead();
    this.updateBossBar();
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
      linePos: this.linePos(),
      afford: this.affordMap(),
      cd: this.cdMap(),
      beat: this.beat,
      perfectWin: BattleScene.PERFECT_WIN,
      upg: this.upgMap(),
      weapons: this.weapons.map((w) => (w ? { ratio: w.ratio, ready: w.ready } : null)),
    });
    this.checkEnd();
  }

  /** 성직자 이동: 맨 앞 아군보다 50px 뒤까지만 전진(아군이 없으면 제자리) */
  private clericFollow(u: Unit, dt: number): void {
    let front = -Infinity;
    for (const o of this.units) if (o.active && o !== u && o.type !== 'cleric' && o.x > front) front = o.x;
    if (front > -Infinity && u.x < front - 50) u.moveBy(u.stats.speed * dt);
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
    const fx = this.add.circle(best.x, LANE_Y - 30, 10, 0x5cff9e, 0.6).setDepth(55);
    this.tweens.add({ targets: fx, y: LANE_Y - 60, scale: 1.8, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
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
      const lv = meta.level(att.type);
      att.swings++;
      const inA = this.inHeroAura(att.x);
      if (lv > 0 && UNIT_SKILLS[att.type] && isSkillSwing(att.swings, lv, inA ? this.skills.auraSkill ?? 0 : 0)) {
        const resonance = inA && awakened(this.skills, 'auraSkill') ? 1.5 : 1; // 🌟 오라 공명
        this.castSkill(att, def, lv, (berserk ? BERSERK_ATK : 1) * powerMult(this.skills.power ?? 0) * (inA ? AURA_ATK : 1) * resonance);
        let scd = attackCooldown(att.stats.atkSpeed) * hasteMult(this.skills.haste ?? 0);
        if (berserk) scd *= BERSERK_COOLDOWN;
        att.cooldown = scd;
        return;
      }
    }
    const ally = att.side === 'ally';
    const crit = ally && Math.random() < critChance(this.skills.crit ?? 0); // 💥 치명타(🎯 스킬로 증가)
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
    // 🎯 연쇄 폭발(각성): 치명타 때 주변 적도 절반 피해
    const chainDmg = Math.round(dmg * 0.5);
    const chain = crit && awakened(this.skills, 'crit') ? (x: number): void => this.splash(x, chainDmg, 'ally') : null;
    if (att.stats.range >= BattleScene.RANGED) {
      // 원거리: 궁수=화살(직선·빠름), 마법사=마법 구슬(느림·명중 시 광역)
      const p = this.projPool.acquire();
      const splashMul = SPLASH[att.type];
      const onHit =
        splashMul || chain
          ? (x: number, d: number) => {
              if (splashMul) this.splash(x, Math.round(d * splashMul), att.side);
              chain?.(x);
            }
          : undefined;
      p.spawn(att.x + (att.side === 'ally' ? 14 : -14), LANE_Y - 24, def, dmg, ORB_UNITS.has(att.type) ? 'orb' : 'arrow', onHit, ORB_COLOR[att.type], crit);
      if (att.side === 'ally') sfx(this, ORB_UNITS.has(att.type) ? 'magic' : 'arrow');
      this.projectiles.push(p);
    } else {
      // 근접: 즉시 — 🛡️ 수호 중인 아군은 피해 없음
      if (!(def.side === 'ally' && this.clock < this.guardUntil)) def.takeDamage(dmg, crit);
      chain?.(def.x);
      sfx(this, att.side === 'ally' ? 'slash' : 'hit');
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
        target.moveBy(Math.min(PUSH_PX, Math.max(0, this.enemyBase.x - 50 - target.x)));
        break;
      case 'dash': {
        const len = Math.max(0, Math.min(DASH_PX, this.enemyBase.x - 60 - u.x));
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
    if (this.over || this.picking || this.paused || this.reviving) return;
    const charge = this.weapons[i];
    if (!charge?.ready) return;
    const def = WEAPONS[i];
    const live = this.enemies.filter((e) => e.active);
    // 대상이 필요한 무기는 적이 없으면 게이지를 쓰지 않음
    const needsEnemy = ['meteor', 'arrows', 'lightning', 'shockwave', 'snipe'].includes(def.key);
    if (needsEnemy && live.length === 0) return;
    charge.fire();
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
          e.moveBy(Math.min(pw(SHOCKWAVE_PUSH), Math.max(0, this.enemyBase.x - 50 - e.x)));
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
    const look = HERO_LOOKS.find((l) => this.textures.exists(textureKey(l))) ?? HERO_TYPE;
    this.hero = new Unit(this);
    const base = heroStats(this.stage.id, this.endless ? 1 : this.stage.enemyMult ?? 1);
    const hm = heroLvMult(meta.heroLevel('hero')); // 👑 영구 강화
    this.hero.spawn(this.playerBase.x + 90, LANE_Y, { ...base, hp: Math.round(base.hp * hm), atk: Math.round(base.atk * hm) }, HERO_TYPE, 'ally', look);
    this.rallyUntil = 0;
    this.hero.setBodyScale(1.3);
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
    this.heroFlag = this.add.text(0, 0, '🚩', { fontSize: '26px' }).setOrigin(0.2, 1).setDepth(60).setVisible(false);
    // 처음 두 관문은 조작 안내
    if (!this.endless && this.stage.id <= 2) {
      const tip = this.add
        .text(640, 150, ['👆 전장을 누르면 👑영웅이 그 자리로 가요', '⭕ 노란 원 안의 아군이 강해져요 · 🔨 J 철퇴 던지기', '⚠️ 영웅이 쓰러지면 패배!'].join('\n'), {
          fontFamily: 'sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 6,
          backgroundColor: '#0d1424cc',
          padding: { x: 18, y: 12 },
        })
        .setOrigin(0.5)
        .setDepth(95);
      this.tweens.add({ targets: tip, alpha: 0, delay: 6000, duration: 600, onComplete: () => tip.destroy() });
    }
  }

  /** ⭕ 지금 오라 반지름(영구 강화 + 레벨업 '오라 확장' + 각성) */
  private auraR(): number {
    return auraRadius(meta.heroLevel('aura'), this.skills.auraSize ?? 0, awakened(this.skills, 'auraSize'));
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
    const min = this.playerBase.x + 40;
    const max = this.enemyBase.x - 70;
    const goal = this.heroDir !== 0 ? h.x + this.heroDir * 200 : this.heroTarget;
    if (goal !== null && Math.abs(Phaser.Math.Clamp(goal, min, max) - h.x) > 2) {
      const nx = stepToward(h.x, goal, h.stats.speed, dt, min, max);
      h.faceDir(nx < h.x ? -1 : 1);
      h.moveBy(nx - h.x);
    } else {
      this.heroTarget = null;
      if (this.heroFlag.visible) this.tweens.add({ targets: this.heroFlag, alpha: 0, duration: 200, onComplete: () => this.heroFlag.setVisible(false) });
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
    if (this.over || this.picking || this.paused || this.reviving || !this.hero?.active) return;
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
    const pw = heroSkillPower(meta.heroLevel(sk.key)); // 👑 스킬 강화
    if (sk.key === 'mace') this.throwMace(pw);
    else if (sk.key === 'rally') this.rally(pw);
    else if (sk.key === 'holy') this.holyLight(pw);
  }

  /** 📯 돌격 함성 — 오라 안 유닛 공격 속도 증가(지속 = 5초 × 위력) */
  private rally(pw: number): void {
    this.rallyUntil = this.clock + RALLY_SEC * pw;
    this.banner('📯 돌격!', 0xffb02e);
    sfx(this, 'weapon');
    this.hero.lunge();
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
      e.moveBy(Math.min(HOLY_PUSH, Math.max(0, this.enemyBase.x - 50 - e.x)));
    }
    this.banner('✨ 성스러운 빛!', 0xfff0a0);
    sfx(this, 'heal');
    const r = this.auraR();
    const pillar = this.add.rectangle(h.x, LANE_Y - 140, r * 2, 300, 0xfff6c0, 0.45).setDepth(84);
    this.tweens.add({ targets: pillar, alpha: 0, scaleX: 1.2, duration: 700, onComplete: () => pillar.destroy() });
  }

  /** 🔨 철퇴 던지기 — 앞으로 빙글빙글 날아가 가까운 적 2명 관통 */
  private throwMace(pw = 1): void {
    const h = this.hero;
    const targets = maceTargets(h.x, this.enemies);
    const dmg = Math.round(h.stats.atk * MACE_MULT * pw * powerMult(this.skills.power ?? 0));
    const endX = targets.length ? targets[targets.length - 1].x : h.x + MACE_RANGE;
    h.lunge();
    sfx(this, 'slash');
    const m = this.add.text(h.x + 20, LANE_Y - 60, '🔨', { fontSize: '34px' }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: m, angle: 720, duration: 320 });
    this.tweens.add({
      targets: m,
      x: endX,
      y: LANE_Y - 30,
      duration: 320,
      ease: 'Quad.easeIn',
      onComplete: () => {
        for (const e of targets) if (e.active) e.takeDamage(computeDamage(dmg, e.stats.def), true);
        if (targets.length) sfx(this, 'hit');
        this.tweens.add({ targets: m, alpha: 0, y: m.y - 30, duration: 200, onComplete: () => m.destroy() });
      },
    });
  }

  /** 다음 소환이 공짜인가 — 🎁 무료 소환 남음 / 💎 마나 순환(각성: 5번째마다) */
  private nextSummonFree(): boolean {
    return this.freeSummons > 0 || (awakened(this.skills, 'magic') && this.summonCount % 5 === 4);
  }

  /** 레벨업 카드 보여 주기(다시 뽑기 포함) */
  private showLevelUp(): void {
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
    for (const e of this.enemies) if (e.active && !BOSS.has(e.type)) e.moveBy(Math.min(40, Math.max(0, this.enemyBase.x - 50 - e.x)));
    const ring = this.add.circle(this.playerBase.x + 80, LANE_Y - 30, 30).setStrokeStyle(8, 0xffe14d).setDepth(85);
    this.tweens.add({ targets: ring, scale: 14, alpha: 0, duration: 650, onComplete: () => ring.destroy() });
    const flash = this.add.rectangle(640, 360, 1280, 720, 0xfff6c0, 0.35).setDepth(84);
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
      .setDepth(96);
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
    meta.addRunStats(this.run);
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
        .setDepth(96);
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
    const ev = events[Math.floor(Math.random() * events.length)];
    sfx(this, 'alert');
    this.banner(ev.text, 0xff9a3c);
    ev.go();
  }

  private burstSpawn(type: string, n: number, gapMs: number): void {
    for (let i = 0; i < n; i++) this.time.delayedCall(i * gapMs, () => !this.over && this.spawnEnemy(type));
  }

  /** 👑 보스 패턴 — 골렘: 땅 내려치기(주변 기절) / 드래곤: 화염 숨결 + 박쥐 소환. 0.8초 전 경고 */
  private bossPattern(e: Enemy, dt: number): void {
    e.patternT += dt;
    e.summonT += dt;
    if (e.type === 'dragon' && e.summonT >= 14) {
      e.summonT = 0;
      for (let i = 0; i < 2; i++) this.time.delayedCall(i * 300, () => !this.over && this.spawnEnemy('bat'));
    }
    const every = e.type === 'dragon' ? 7 : 6;
    if (e.patternT < every) return;
    e.patternT = 0;
    const slam = e.type !== 'dragon';
    const x0 = slam ? e.x - 120 : e.x - 260; // 영향 범위(왼쪽 = 우리 쪽)
    const x1 = slam ? e.x + 120 : e.x;
    const warn = this.add.rectangle((x0 + x1) / 2, LANE_Y - 10, x1 - x0, 70, 0xff3030, 0.25).setStrokeStyle(3, 0xff5050).setDepth(54);
    this.tweens.add({ targets: warn, alpha: 0.6, duration: 200, yoyo: true, repeat: 1 });
    this.time.delayedCall(800, () => {
      warn.destroy();
      if (!e.active || this.over) return;
      const now = this.time.now;
      for (const u of this.units) {
        if (!u.active || u.x < x0 || u.x > x1) continue;
        const dmg = computeDamage(e.stats.atk * (slam ? 1.2 : 1.4), u.stats.def) * synergyMult(this.synergies, u.type, 'guard');
        if (this.clock >= this.guardUntil) u.takeDamage(Math.max(1, Math.round(dmg)));
        if (slam) u.stunUntil = now + 1500;
      }
      if (slam) {
        this.cameras.main.shake(300, 0.012);
        this.burst(e.x, 0xb08a5a, 120);
        sfx(this, 'boom');
      } else {
        const fire = this.add.rectangle((x0 + x1) / 2, LANE_Y - 14, x1 - x0, 46, 0xff7a2a, 0.75).setDepth(55);
        this.tweens.add({ targets: fire, alpha: 0, scaleY: 1.6, duration: 450, onComplete: () => fire.destroy() });
        sfx(this, 'boom_big');
      }
    });
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
      .setDepth(97)
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
      this.commitRun();
      bgm(this, null);
      sfx(this, newBest ? 'win' : 'lose');
      this.slowmo = 1;
      this.time.delayedCall(600, () => this.scene.start('Result', { win: false, stageId: 0, earned, mode: 'endless', wave, newBest }));
      return;
    }
    // ⭐ 별 평가: 우리 기지 남은 체력(부활했으면 1개), 처음 얻는 별마다 보너스 골드
    const stars = win ? starsFor(this.playerBase.hp / this.playerBase.maxHp, this.revivedOnce) : 0;
    const prevStars = meta.starsOf(this.stage.id);
    const gained = win ? meta.recordStars(this.stage.id, stars) : 0;
    const starGold = gained * STAR_GOLD;
    const earned = win ? this.runGold + 60 + this.stage.id * 30 + starGold : 0;
    if (win) {
      meta.addGold(earned); // 처치 골드 + 승리 보너스 + 새 별 보너스(강화용)
      meta.clearStage(this.stage.id); // 다음 스테이지 해금
    }
    // ⏱️ 클리어 시간(게임 시간 기준 — 배속과 무관)
    const time = Math.round(this.clock);
    const timeRec = win ? meta.recordTime(this.stage.id, time) : null;
    if (win) {
      this.track('clears');
    }
    this.commitRun();
    bgm(this, null);
    sfx(this, win ? 'win' : 'lose');
    this.slowmo = 1;
    this.time.delayedCall(600, () =>
      this.scene.start('Result', { win, stageId: this.stage.id, earned, stars, prevStars, starGold, time, timeRec })
    );
  }
}
