import Phaser from 'phaser';
import { loadAudio } from '../systems/sound';
import { loadFx, registerFx } from '../systems/fx';
import { meta } from '../systems/upgrades';
import { registerSpriteAnims } from '../systems/skinTextures';
import { MANIFEST_URL, iconKey, parseManifest, sprites, textureKey } from '../systems/sprites';
import { HERO_TIERS, heroTier } from '../systems/hero';
import { unitOfKey, unitPreloadKeys } from '../systems/evolution';
import unitsData from '../data/units.json';

/**
 * 프리로드: sprites/manifest.json → 등록된 스프라이트시트 로드 → 애니메이션 생성 → Menu.
 * 매니페스트가 없거나 비어 있으면 전부 벡터 도형으로 폴백.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const t = this.add.text(640, 360, '불러오는 중…', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#8892b0',
    });
    t.setOrigin(0.5);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[sprites] 로드 실패: ${file.src}`);
    });
    this.load.json('spriteManifest', MANIFEST_URL);
    loadAudio(this); // 🔊 효과음·배경음
    loadFx(this); // 💥 전투 효과 팩
  }

  create(): void {
    const { manifest, warnings } = parseManifest(this.cache.json.get('spriteManifest'));
    for (const w of warnings) console.warn(`[sprites] ${w}`);
    sprites.manifest = manifest;
    registerFx(this);

    const types = Object.keys(manifest);
    if (types.length === 0) {
      this.scene.start('Menu');
      return;
    }
    // 👗 전설 스킨 등 '유닛@스킨' 그림은 착용 중인 것만(나머지는 스킨 창에서 열 때 받음)
    // ⭐ 유닛 그림은 유닛마다 기본(★1) + 지금 진화 단계(+ 전설 착용 시 전설 단계)만
    const unitNames = Object.keys(unitsData);
    const unitKeys = unitPreloadKeys(unitNames, (k) => !!manifest[k], (u) => meta.level(u), (u) => meta.equippedSkin(u));
    const needed = types.filter((t) => {
      if (unitNames.includes(unitOfKey(t))) return unitKeys.has(t);
      const [unit, skin] = t.split('@');
      if (t.startsWith('hero_')) return t === HERO_TIERS[heroTier(meta.heroLevel('hero'))].look; // 👑 지금 단계 영웅 그림만(나머지는 강화 화면에서)
      return !skin || meta.equippedSkin(unit) === skin;
    });
    for (const type of needed) {
      const d = manifest[type];
      this.load.spritesheet(textureKey(type), `sprites/${d.file}`, {
        frameWidth: d.frameWidth,
        frameHeight: d.frameHeight,
      });
      if (d.icon) this.load.image(iconKey(type), `sprites/${d.icon}`);
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      for (const type of needed) registerSpriteAnims(this, type);
      this.scene.start('Menu');
    });
    this.load.start();
  }
}
