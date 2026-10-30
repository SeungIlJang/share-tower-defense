import Phaser from 'phaser';
import { loadAudio } from '../systems/sound';
import { meta } from '../systems/upgrades';
import { registerSpriteAnims } from '../systems/skinTextures';
import { MANIFEST_URL, iconKey, parseManifest, sprites, textureKey } from '../systems/sprites';
import { HERO_TIERS, heroTier } from '../systems/hero';
import { unitOfKey, unitPreloadKeys } from '../systems/evolution';
import { PARADE_ALLY, deferredType, loadingBar, stageEnemyTypes } from '../systems/assetLoad';
import { STAGES } from '../systems/worlds';
import unitsData from '../data/units.json';

/** 기다리는 동안 보여 줄 팁 */
const TIPS = [
  '💡 초록 칸에 맞춰 소환하면 PERFECT — 더 세게 나와요',
  '💡 같은 유닛을 강화하면 Lv5·10·20에 진화해요',
  '💡 성을 누르면 성 특수 공격!',
  '💡 상성이 맞으면 피해 ×1.5 — "유리!" 표시를 보세요',
  '💡 매주 월요일 새 주간 보스가 나타나요',
  '💡 보물 상자 조각으로 진화하고 랭크를 올려요',
];

/**
 * 프리로드: 메인 화면에 필요한 것만 먼저 받고(약 3~4MB) 메뉴로 — 적·보스·전투 효과·전투 배경음은
 * BgLoad 씬이 뒤에서 받고, 전투·도감 등 화면에 들어갈 때 아직 없으면 그 화면에서 받음(systems/assetLoad.ts).
 * 매니페스트가 없거나 비어 있으면 전부 벡터 도형으로 폴백.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  private bar!: { set: (v: number) => void; destroy: () => void };

  preload(): void {
    this.add.text(640, 250, '모두의 타워디펜스', { fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#ffd34d', stroke: '#3a2a00', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(640, 430, TIPS[Math.floor(Math.random() * TIPS.length)], { fontFamily: 'sans-serif', fontSize: '18px', color: '#8892b0' }).setOrigin(0.5);
    this.bar = loadingBar(this, 360);
    // 1단계(매니페스트·소리) 0~25% → 2단계(그림) 25~100%
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => this.bar.set(v * 0.25));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[sprites] 로드 실패: ${file.src}`);
    });
    this.load.json('spriteManifest', MANIFEST_URL);
    loadAudio(this); // 🔊 효과음(압축본)·메뉴 배경음
  }

  create(): void {
    const { manifest, warnings } = parseManifest(this.cache.json.get('spriteManifest'));
    for (const w of warnings) console.warn(`[sprites] ${w}`);
    sprites.manifest = manifest;

    // 다음에 할 관문의 적부터 뒤에서 받게
    const next = STAGES.find((s) => s.id === meta.clearedMax + 1) ?? STAGES[0];
    const go = (): void => {
      this.scene.launch('BgLoad', { first: stageEnemyTypes(next) });
      this.scene.start('Menu');
    };
    const types = Object.keys(manifest);
    if (types.length === 0) {
      go();
      return;
    }
    // ⭐ 유닛: 가진 유닛 + 메인 화면 행진 유닛만 그림(나머지는 얼굴 아이콘만 — 카드·잠금 표시용)
    // 👗 전설 스킨 등 '유닛@스킨'은 착용 중인 것만 · 👑 영웅은 지금 단계만 · 👾 적·보스는 행진하는 적만
    const unitNames = Object.keys(unitsData);
    const allUnitKeys = unitPreloadKeys(unitNames, (k) => !!manifest[k], (u) => meta.tier(u), (u) => meta.equippedSkin(u));
    const shownUnits = new Set([...unitNames.filter((u) => meta.ownsUnit(u)), ...PARADE_ALLY]);
    const needed = types.filter((t) => {
      if (deferredType(t)) return false;
      if (unitNames.includes(unitOfKey(t))) return allUnitKeys.has(t) && shownUnits.has(unitOfKey(t));
      const [unit, skin] = t.split('@');
      if (t.startsWith('hero_')) return t === HERO_TIERS[heroTier(meta.heroLevel('hero'))].look;
      return !skin || meta.equippedSkin(unit) === skin;
    });
    for (const type of needed) {
      const d = manifest[type];
      this.load.spritesheet(textureKey(type), `sprites/${d.file}`, { frameWidth: d.frameWidth, frameHeight: d.frameHeight });
      if (d.icon) this.load.image(iconKey(type), `sprites/${d.icon}`);
    }
    // 그림은 나중에 받는 유닛도 얼굴 아이콘은 지금(하단 카드·강화 화면)
    for (const t of allUnitKeys) {
      const d = manifest[t];
      if (d?.icon && !needed.includes(t)) this.load.image(iconKey(t), `sprites/${d.icon}`);
    }
    this.load.off(Phaser.Loader.Events.PROGRESS);
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => this.bar.set(0.25 + v * 0.75));
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      for (const type of needed) registerSpriteAnims(this, type);
      go();
    });
    this.load.start();
  }
}
