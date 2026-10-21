import Phaser from 'phaser';
import unitsData from '../data/units.json';
import stagesData from '../data/stages.json';
import type { StageData, UnitStats } from '../types';
import { meta } from '../systems/upgrades';
import { WEAPONS } from '../systems/weapons';
import { SKINS, LEGEND_NAMES } from '../systems/skins';
import { BASE_MAX_LV, BASE_UPGRADES } from '../systems/baseUpgrades';
import { AURA_MAX_LV, HERO_MAX_LV, HERO_SKILLS, HERO_TIERS, SKILL_MAX_LV, heroTier } from '../systems/hero';
import { DEV_FLAG_INFO, clearDevFlags, devFlags, fmt, setDevFlag } from '../systems/dev';
import { openKeypad } from '../ui/Keypad';
import { sfx } from '../systems/sound';

const UNITS = unitsData as Record<string, UnitStats>;
const STAGES = stagesData as StageData[];
const MAX_STAGE = STAGES.length;
const UNIT_MAX_LV = 30; // 개발자 모드에서 올릴 수 있는 유닛·무기 최대 레벨
const GOLD_MAX = 999_999_999;

type Tab = 'gold' | 'progress' | 'units' | 'weapons' | 'hero' | 'reward' | 'cheat' | 'reset';
const TABS: [Tab, string][] = [
  ['gold', '💰 골드'],
  ['progress', '🗺️ 진행'],
  ['units', '🛡️ 유닛'],
  ['weapons', '🔥 무기'],
  ['hero', '👑 영웅·기지'],
  ['reward', '🎁 보상·스킨'],
  ['cheat', '⚔️ 전투 치트'],
  ['reset', '🧹 초기화'],
];

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** 🛠️ 개발자 모드 — 게임에서 바꿀 수 있는 값 전부(저장 데이터 + 전투 치트) */
export class DevScene extends Phaser.Scene {
  private tab: Tab = 'gold';
  private layer!: Phaser.GameObjects.Container;
  private tabBtns: Partial<Record<Tab, Phaser.GameObjects.Text>> = {};
  private goldText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private resetArmed = false;

  constructor() {
    super('Dev');
  }

  create(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x0d1424);
    this.add.text(640, 40, '🛠️ 개발자 모드', { fontFamily: 'sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0.5);
    this.goldText = this.add.text(1180, 40, '', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe14d' }).setOrigin(1, 0.5);
    // 휴대폰 가장자리(둥근 모서리·제스처 영역)에 가리지 않게 안쪽에 + 아래쪽에도 하나 더
    this.btn(150, 40, '← 메인', 0x3a7bff, () => this.scene.start('Menu'), 22);
    this.btn(640, 690, '🏠 메인으로', 0x3a7bff, () => this.scene.start('Menu'), 20);
    TABS.forEach(([key, label], i) => {
      const t = this.add
        .text(640 + (i - 3.5) * 146, 96, label, { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#fff', padding: { x: 8, y: 8 }, fixedWidth: 138, align: 'center' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        this.tab = key;
        this.resetArmed = false;
        sfx(this, 'click');
        this.render();
      });
      this.tabBtns[key] = t;
    });
    this.layer = this.add.container(0, 0);
    this.render();
  }

  // ───────── 공용 UI
  private btn(x: number, y: number, label: string, color: number, fn: () => void, size = 17): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color: '#ffffff', backgroundColor: `#${color.toString(16).padStart(6, '0')}`, padding: { x: 12, y: 8 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => {
      sfx(this, 'click');
      fn();
    });
    return t;
  }

  /** 한 줄: 이름 · 지금 값 · 버튼들 */
  private row(y: number, label: string, value: string, buttons: [string, () => void, number?][], cols: [number, number] = [360, 580]): void {
    this.layer.add(this.add.text(90, y, label, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#cfe0ff' }).setOrigin(0, 0.5));
    this.layer.add(this.add.text(cols[0], y, value, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe680' }).setOrigin(0, 0.5));
    let x = cols[1];
    for (const [lab, fn, color] of buttons) {
      const b = this.btn(0, y, lab, color ?? 0x2f5a8a, () => {
        fn();
        this.render();
      });
      b.setX(x + b.width / 2);
      x += b.width + 8;
      this.layer.add(b);
    }
  }

  private edit(fn: Parameters<typeof meta.devEdit>[0], msg?: string): void {
    meta.devEdit(fn);
    if (msg) this.say(msg);
  }

  private say(msg: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(640, 640, msg, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7cff9a', backgroundColor: '#0b0f1acc', padding: { x: 16, y: 8 } })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1400, duration: 400 });
  }

  /** 숫자 입력(키패드) */
  private askNumber(title: string, initial: number, max: number, done: (v: number) => void): void {
    const kp = openKeypad(this, { title, initial: String(initial), maxLen: String(max).length, hint: `0 ~ ${fmt(max)}` }, (v) => {
      kp.close();
      done(clamp(Number(v || 0), 0, max));
      this.render();
    });
  }

  private render(): void {
    this.layer.removeAll(true);
    this.goldText.setText(`🪙 ${fmt(meta.gold)}`);
    for (const [key, t] of Object.entries(this.tabBtns) as [Tab, Phaser.GameObjects.Text][]) {
      const on = key === this.tab;
      t.setBackgroundColor(on ? '#3a7bff' : '#20304e').setColor(on ? '#fff' : '#8ea0c0');
    }
    ({
      gold: () => this.renderGold(),
      progress: () => this.renderProgress(),
      units: () => this.renderUnits(),
      weapons: () => this.renderWeapons(),
      hero: () => this.renderHero(),
      reward: () => this.renderReward(),
      cheat: () => this.renderCheat(),
      reset: () => this.renderReset(),
    })[this.tab]();
  }

  // ───────── 💰 골드
  private renderGold(): void {
    const add = (n: number) => (): void => this.edit((m) => (m.gold = clamp(m.gold + n, 0, GOLD_MAX)), `🪙 ${n > 0 ? '+' : ''}${fmt(n)}`);
    const set = (n: number) => (): void => this.edit((m) => (m.gold = n), `🪙 = ${fmt(n)}`);
    this.row(170, '보유 골드', fmt(meta.gold), [['🔢 직접 입력', () => this.askNumber('🪙 골드 설정', meta.gold, GOLD_MAX, (v) => this.edit((m) => (m.gold = v), `🪙 = ${fmt(v)}`)), 0x7a4ad8]]);
    this.row(240, '더하기', '', [['+100', add(100)], ['+1,000', add(1000)], ['+10,000', add(10000)], ['+100,000', add(100000)], ['+1,000,000', add(1000000)]]);
    this.row(310, '빼기', '', [['-100', add(-100), 0x8a3a3a], ['-1,000', add(-1000), 0x8a3a3a], ['-10,000', add(-10000), 0x8a3a3a], ['절반', () => this.edit((m) => (m.gold = Math.floor(m.gold / 2)), '🪙 절반'), 0x8a3a3a]]);
    this.row(380, '한 번에 설정', '', [['0', set(0), 0x5a5a6a], ['1,000', set(1000)], ['10,000', set(10000)], ['100,000', set(100000)], ['9,999,999', set(9_999_999), 0xd8962a]]);
    this.row(450, '두 배', '', [['× 2', () => this.edit((m) => (m.gold = clamp(m.gold * 2, 0, GOLD_MAX)), '🪙 × 2')], ['× 10', () => this.edit((m) => (m.gold = clamp(m.gold * 10, 0, GOLD_MAX)), '🪙 × 10')]]);
    this.layer.add(this.add.text(90, 540, '※ 골드는 강화·유닛/무기 구매·스킨·영웅 강화에 쓰여요. 최대 999,999,999', { fontFamily: 'sans-serif', fontSize: '16px', color: '#7c8aa0' }));
  }

  // ───────── 🗺️ 진행
  private renderProgress(): void {
    this.row(160, '클리어한 관문', `${meta.clearedMax} / ${MAX_STAGE}`, [
      ['-1', () => this.edit((m) => (m.clearedMax = clamp(m.clearedMax - 1, 0, MAX_STAGE)))],
      ['+1', () => this.edit((m) => (m.clearedMax = clamp(m.clearedMax + 1, 0, MAX_STAGE)))],
      ['🔢 입력', () => this.askNumber('클리어한 관문', meta.clearedMax, MAX_STAGE, (v) => this.edit((m) => (m.clearedMax = v)))],
      ['전부 해금', () => this.edit((m) => (m.clearedMax = MAX_STAGE), '🗺️ 전 관문 해금'), 0x2f7a4d],
      ['처음(0)', () => this.edit((m) => (m.clearedMax = 0)), 0x8a3a3a],
    ]);
    this.row(225, '별', `⭐ ${meta.totalStars} / ${MAX_STAGE * 3}`, [
      ['전부 ⭐3', () => this.edit((m) => STAGES.forEach((s) => (m.stars[s.id] = 3)), '⭐ 전부 3개'), 0x2f7a4d],
      ['해금한 곳만 ⭐3', () => this.edit((m) => STAGES.filter((s) => s.id <= m.clearedMax).forEach((s) => (m.stars[s.id] = 3)))],
      ['별 초기화', () => this.edit((m) => (m.stars = {})), 0x8a3a3a],
    ]);
    this.row(290, '클리어 시간 기록', `${Object.keys(meta.bestTimes).length}개`, [['기록 지우기', () => this.edit((m) => (m.bestTimes = {}), '⏱️ 기록 지움'), 0x8a3a3a]]);
    this.row(355, '♾️ 무한 모드 기록', `최고 🌊 ${meta.endlessBest}`, [['명예의 전당 지우기', () => this.edit((m) => (m.endlessTop = []), '♾️ 기록 지움'), 0x8a3a3a]]);
    this.row(420, '바로 전투', '', [
      ['🔢 관문 번호로 시작', () => this.askNumber('몇 관문?', 1, MAX_STAGE, (v) => this.scene.start('Battle', { stageId: Math.max(1, v) })), 0x7a4ad8],
      ['♾️ 무한 모드', () => this.scene.start('Battle', { stageId: 0, mode: 'endless' }), 0x7a4ad8],
      ['🔟 보스(10)', () => this.scene.start('Battle', { stageId: 10 }), 0x7a4ad8],
      ['🐉 보스(20)', () => this.scene.start('Battle', { stageId: 20 }), 0x7a4ad8],
    ]);
  }

  // ───────── 🛡️ 유닛
  private renderUnits(): void {
    const keys = Object.keys(UNITS);
    this.row(150, '한 번에', `보유 ${meta.ownedUnits.length}/${keys.length}`, [
      ['전부 보유', () => this.edit((m) => (m.ownedUnits = [...keys]), '🛡️ 전부 보유'), 0x2f7a4d],
      ['병사만', () => this.edit((m) => (m.ownedUnits = [keys[0]])), 0x8a3a3a],
      ['모두 Lv+1', () => this.edit((m) => keys.forEach((k) => (m.levels[k] = clamp((m.levels[k] ?? 0) + 1, 0, UNIT_MAX_LV))))],
      ['모두 Lv10', () => this.edit((m) => keys.forEach((k) => (m.levels[k] = 10)))],
      ['모두 Lv0', () => this.edit((m) => (m.levels = {})), 0x8a3a3a],
    ]);
    keys.forEach((k, i) => {
      const x = 640 + ((i % 4) - 1.5) * 285;
      const y = 250 + Math.floor(i / 4) * 130;
      const owned = meta.ownsUnit(k);
      const lv = meta.level(k);
      this.layer.add(this.add.rectangle(x, y, 270, 115, owned ? 0x1e2a44 : 0x20242e).setStrokeStyle(2, owned ? 0x4a78c8 : 0x3a3f4a));
      this.layer.add(this.add.text(x - 122, y - 34, UNITS[k].name, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: owned ? '#fff' : '#7c8698' }).setOrigin(0, 0.5));
      const own = this.btn(x + 72, y - 34, owned ? '✓ 보유' : '보유 안 함', owned ? 0x2f7a4d : 0x4a4f60, () => {
        this.edit((m) => (m.ownedUnits = owned ? m.ownedUnits.filter((u) => u !== k) : [...m.ownedUnits, k]));
        this.render();
      }, 15);
      this.layer.add(own);
      this.layer.add(this.add.text(x - 122, y + 22, `Lv ${lv}`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe680' }).setOrigin(0, 0.5));
      const step = (d: number) => (): void => {
        this.edit((m) => (m.levels[k] = clamp(lv + d, 0, UNIT_MAX_LV)));
        this.render();
      };
      this.layer.add([this.btn(x - 6, y + 22, '−', 0x8a3a3a, step(-1), 20), this.btn(x + 44, y + 22, '+', 0x2f7a4d, step(1), 20), this.btn(x + 96, y + 22, '+5', 0x2f5a8a, step(5), 16)]);
    });
  }

  // ───────── 🔥 특수 무기
  private renderWeapons(): void {
    const keys = WEAPONS.map((w) => w.key);
    this.row(150, '한 번에', `보유 ${meta.ownedWeapons.length}/${keys.length}`, [
      ['전부 보유', () => this.edit((m) => (m.ownedWeapons = [...keys]), '🔥 전부 보유'), 0x2f7a4d],
      ['메테오만', () => this.edit((m) => (m.ownedWeapons = [keys[0]])), 0x8a3a3a],
      ['모두 Lv+1', () => this.edit((m) => keys.forEach((k) => (m.weaponLevels[k] = clamp((m.weaponLevels[k] ?? 0) + 1, 0, UNIT_MAX_LV))))],
      ['모두 Lv10', () => this.edit((m) => keys.forEach((k) => (m.weaponLevels[k] = 10)))],
      ['모두 Lv0', () => this.edit((m) => (m.weaponLevels = {})), 0x8a3a3a],
    ]);
    WEAPONS.forEach((w, i) => {
      const x = 640 + ((i % 3) - 1) * 380;
      const y = 250 + Math.floor(i / 3) * 130;
      const owned = meta.ownsWeapon(w.key);
      const lv = meta.weaponLevel(w.key);
      this.layer.add(this.add.rectangle(x, y, 360, 115, owned ? 0x1e2a44 : 0x20242e).setStrokeStyle(2, owned ? 0x4a78c8 : 0x3a3f4a));
      this.layer.add(this.add.text(x - 165, y - 34, `${w.icon} ${w.name}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: owned ? '#fff' : '#7c8698' }).setOrigin(0, 0.5));
      this.layer.add(
        this.btn(x + 110, y - 34, owned ? '✓ 보유' : '보유 안 함', owned ? 0x2f7a4d : 0x4a4f60, () => {
          this.edit((m) => (m.ownedWeapons = owned ? m.ownedWeapons.filter((u) => u !== w.key) : [...m.ownedWeapons, w.key]));
          this.render();
        }, 15)
      );
      this.layer.add(this.add.text(x - 165, y + 22, `Lv ${lv}`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe680' }).setOrigin(0, 0.5));
      const step = (d: number) => (): void => {
        this.edit((m) => (m.weaponLevels[w.key] = clamp(lv + d, 0, UNIT_MAX_LV)));
        this.render();
      };
      this.layer.add([this.btn(x + 20, y + 22, '−', 0x8a3a3a, step(-1), 20), this.btn(x + 72, y + 22, '+', 0x2f7a4d, step(1), 20), this.btn(x + 126, y + 22, '+5', 0x2f5a8a, step(5), 16)]);
    });
  }

  // ───────── 👑 영웅 · 🏰 기지
  private renderHero(): void {
    const hl = meta.heroLevel('hero');
    const setH = (key: string, v: number, max: number) => (): void => this.edit((m) => (m.heroLevels[key] = clamp(v, 0, max)));
    this.row(150, '👑 영웅 레벨', `Lv ${hl} · ${HERO_TIERS[heroTier(hl)].name}`, [
      ['−', setH('hero', hl - 1, HERO_MAX_LV), 0x8a3a3a],
      ['+', setH('hero', hl + 1, HERO_MAX_LV), 0x2f7a4d],
      ...HERO_TIERS.map((t): [string, () => void] => [`Lv${t.min}`, setH('hero', t.min, HERO_MAX_LV)]),
    ]);
    const al = meta.heroLevel('aura');
    this.row(210, '⭕ 오라 크기', `Lv ${al} / ${AURA_MAX_LV}`, [
      ['−', setH('aura', al - 1, AURA_MAX_LV), 0x8a3a3a],
      ['+', setH('aura', al + 1, AURA_MAX_LV), 0x2f7a4d],
      ['MAX', setH('aura', AURA_MAX_LV, AURA_MAX_LV)],
    ]);
    HERO_SKILLS.forEach((sk, i) => {
      const owned = meta.ownsHeroSkill(sk.key);
      const lv = meta.heroLevel(sk.key);
      this.row(270 + i * 60, `${sk.icon} ${sk.name}`, `${owned ? '보유' : '없음'} · Lv ${lv}/${SKILL_MAX_LV}`, [
        [owned ? '해금 취소' : '해금', () => this.edit((m) => (m.heroOwned = owned ? m.heroOwned.filter((k) => k !== sk.key || k === 'mace') : [...m.heroOwned, sk.key])), owned ? 0x8a3a3a : 0x2f7a4d],
        ['−', setH(sk.key, lv - 1, SKILL_MAX_LV), 0x8a3a3a],
        ['+', setH(sk.key, lv + 1, SKILL_MAX_LV), 0x2f7a4d],
        ['MAX', setH(sk.key, SKILL_MAX_LV, SKILL_MAX_LV)],
      ]);
    });
    BASE_UPGRADES.forEach((b, i) => {
      const lv = meta.baseLevel(b.key);
      const set = (v: number) => (): void => this.edit((m) => (m.baseLevels[b.key] = clamp(v, 0, BASE_MAX_LV)));
      this.row(470 + i * 60, `🏰 ${b.icon} ${b.name}`, `Lv ${lv} / ${BASE_MAX_LV}`, [['−', set(lv - 1), 0x8a3a3a], ['+', set(lv + 1), 0x2f7a4d], ['MAX', set(BASE_MAX_LV)]]);
      this.layer.add(this.add.text(820, 470 + i * 60, b.effect(lv), { fontFamily: 'sans-serif', fontSize: '16px', color: '#9fb3d0' }).setOrigin(0, 0.5));
    });
    this.row(600, '한 번에', '', [
      ['👑 전부 최대', () => this.edit((m) => {
        m.heroLevels = { hero: HERO_MAX_LV, aura: AURA_MAX_LV, ...Object.fromEntries(HERO_SKILLS.map((s) => [s.key, SKILL_MAX_LV])) };
        m.heroOwned = HERO_SKILLS.map((s) => s.key);
        BASE_UPGRADES.forEach((b) => (m.baseLevels[b.key] = BASE_MAX_LV));
      }, '👑 영웅·기지 최대'), 0xd8962a],
      ['처음 상태', () => this.edit((m) => {
        m.heroLevels = {};
        m.heroOwned = ['mace'];
        m.baseLevels = {};
      }), 0x8a3a3a],
    ]);
  }

  // ───────── 🎁 보상 · 👗 스킨
  private renderReward(): void {
    const C: [number, number] = [330, 660]; // 값이 길어서 버튼을 오른쪽으로
    this.row(160, '📅 일일 출석', `연속 ${meta.dailyDayNumber()}일째 · ${meta.canClaimDaily() ? '받을 수 있음' : '오늘 받음'}`, [
      ['다시 받게', () => this.edit((m) => (m.lastDaily = -1), '📅 오늘 다시 받기 가능'), 0x2f7a4d],
      ['연속 −1', () => this.edit((m) => (m.streak = Math.max(0, m.streak - 1)))],
      ['연속 +1', () => this.edit((m) => (m.streak += 1))],
    ], C);
    const hours = Math.floor((Date.now() - meta.lastSeen) / 3600_000);
    this.row(225, '💤 방치 보상', `${hours}시간 쌓임 · 🪙 ${fmt(meta.pendingIdle())}`, [
      ['+1시간', () => this.edit((m) => (m.lastSeen -= 3600_000))],
      ['가득(8시간)', () => this.edit((m) => (m.lastSeen = Date.now() - 8 * 3600_000), '💤 가득'), 0x2f7a4d],
      ['0으로', () => this.edit((m) => (m.lastSeen = Date.now())), 0x8a3a3a],
    ], C);
    this.row(290, '📋 오늘 미션', `받음 ${meta.daily.claimed.length}개`, [
      ['진행·받기 초기화', () => this.edit((m) => (m.daily = { day: -1, stats: {}, claimed: [] }), '📋 오늘 미션 초기화'), 0x8a3a3a],
    ], C);
    this.row(355, '🏅 업적', `받음 ${meta.achClaimed.length}개`, [
      ['받기 초기화', () => this.edit((m) => (m.achClaimed = [])), 0x8a3a3a],
      ['누적 기록 지우기', () => this.edit((m) => (m.totals = {})), 0x8a3a3a],
    ], C);
    const allSkins = Object.keys(SKINS).flatMap((u) => [`${u}:rare`, ...(LEGEND_NAMES[u] ? [`${u}:legend`] : [])]);
    this.row(440, '👗 스킨', `보유 ${meta.skinsOwned.length}/${allSkins.length}`, [
      ['레어 전부', () => this.edit((m) => (m.skinsOwned = [...new Set([...m.skinsOwned, ...allSkins.filter((s) => s.endsWith(':rare'))])])), 0x3a8adf],
      ['전설 전부', () => this.edit((m) => (m.skinsOwned = [...new Set([...m.skinsOwned, ...allSkins.filter((s) => s.endsWith(':legend'))])])), 0xd8962a],
      ['전부 보유', () => this.edit((m) => (m.skinsOwned = [...allSkins]), '👗 전부 보유'), 0x2f7a4d],
      ['착용 해제', () => this.edit((m) => (m.skinEquipped = {}))],
      ['스킨 초기화', () => this.edit((m) => {
        m.skinsOwned = [];
        m.skinEquipped = {};
      }), 0x8a3a3a],
    ], C);
  }

  // ───────── ⚔️ 전투 치트(이 기기에만 저장)
  private renderCheat(): void {
    this.layer.add(this.add.text(90, 140, '전투에 바로 적용 · 이 기기에만 저장 · 켜져 있으면 전투 화면 왼쪽 위에 🛠️ DEV 표시', { fontFamily: 'sans-serif', fontSize: '16px', color: '#9fb3d0' }));
    DEV_FLAG_INFO.forEach((f, i) => {
      const on = devFlags[f.key];
      this.row(195 + i * 62, f.label, on ? '🟢 ON' : '⚪ OFF', [[on ? '끄기' : '켜기', () => setDevFlag(f.key, !on), on ? 0x8a3a3a : 0x2f7a4d]], [620, 760]);
    });
    this.row(195 + DEV_FLAG_INFO.length * 62, '한 번에', '', [
      ['전부 켜기', () => DEV_FLAG_INFO.forEach((f) => setDevFlag(f.key, true)), 0x2f7a4d],
      ['전부 끄기', () => clearDevFlags(), 0x8a3a3a],
    ], [620, 760]);
  }

  // ───────── 🧹 초기화
  private renderReset(): void {
    this.row(180, '⚔️ 전투 치트', '', [['전부 끄기', () => (clearDevFlags(), this.say('⚔️ 치트 전부 끔')), 0x8a3a3a]]);
    this.row(260, '💾 저장 전부 초기화', this.resetArmed ? '⚠️ 한 번 더 누르면 삭제!' : '처음 설치한 상태로', [
      [
        this.resetArmed ? '정말 초기화' : '초기화',
        () => {
          if (!this.resetArmed) {
            this.resetArmed = true;
            return;
          }
          this.resetArmed = false;
          meta.devReset();
          this.say('💾 저장을 모두 초기화했어요');
        },
        0xc0303a,
      ],
    ]);
    this.layer.add(
      this.add.text(90, 340, '골드 · 관문 · 별 · 유닛/무기/영웅/기지 강화 · 스킨 · 출석 · 미션 · 기록이 모두 지워져요. 되돌릴 수 없어요.', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ff9a9a' })
    );
  }
}
