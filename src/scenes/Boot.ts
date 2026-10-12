import Phaser from 'phaser';

/** 부트: 전역 설정 후 Preload로 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  create(): void {
    this.scale.lockOrientation('landscape');
    this.scene.start('Preload');
  }
}
