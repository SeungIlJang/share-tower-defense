import Phaser from 'phaser';
import { ANIM_STATES, LOOPING, MANIFEST_URL, animKey, iconKey, parseManifest, sprites, textureKey } from '../systems/sprites';

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
  }

  create(): void {
    const { manifest, warnings } = parseManifest(this.cache.json.get('spriteManifest'));
    for (const w of warnings) console.warn(`[sprites] ${w}`);
    sprites.manifest = manifest;

    const types = Object.keys(manifest);
    if (types.length === 0) {
      this.scene.start('Menu');
      return;
    }
    for (const type of types) {
      const d = manifest[type];
      this.load.spritesheet(textureKey(type), `sprites/${d.file}`, {
        frameWidth: d.frameWidth,
        frameHeight: d.frameHeight,
      });
      if (d.icon) this.load.image(iconKey(type), `sprites/${d.icon}`);
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      for (const type of types) this.registerAnims(type);
      this.scene.start('Menu');
    });
    this.load.start();
  }

  private registerAnims(type: string): void {
    const d = sprites.manifest[type];
    const key = textureKey(type);
    if (!this.textures.exists(key)) {
      delete sprites.manifest[type]; // 이미지 로드 실패 → 벡터 폴백
      return;
    }
    this.textures
      .get(key)
      .setFilter(d.filter === 'nearest' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
    for (const s of ANIM_STATES) {
      const a = d.anims[s];
      if (!a || this.anims.exists(animKey(type, s))) continue;
      this.anims.create({
        key: animKey(type, s),
        frames: this.anims.generateFrameNumbers(key, { frames: a.frames }),
        frameRate: a.fps,
        repeat: LOOPING[s] ? -1 : 0,
      });
    }
  }
}
