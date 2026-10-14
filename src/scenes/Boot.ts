import Phaser from 'phaser';
import { meta } from '../systems/upgrades';
import { initAds } from '../systems/ads';
import { restoreMute } from '../systems/sound';

/** 부트: 전역 설정 + 저장 로드 + 광고 초기화 후 Preload로 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  create(): void {
    this.scale.lockOrientation('landscape');
    // 저장(Preferences/localStorage) 로드 후 진행 — 메타 골드/진행도 준비
    void (async () => {
      await meta.init();
      await restoreMute(this.game);
      void initAds(); // 네이티브만 실제 초기화(웹은 무시)
      this.scene.start('Preload');
    })();
  }
}
