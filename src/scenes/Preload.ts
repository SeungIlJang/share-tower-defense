import Phaser from 'phaser';

/** 프리로드: (프로토타입은 생성 텍스처라 로드 자산 없음) → Menu */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }
  preload(): void {
    // 1단계: 스프라이트시트/아틀라스 로드 지점. 현재는 사각형 프로토타입.
    const t = this.add.text(640, 360, '불러오는 중…', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#8892b0',
    });
    t.setOrigin(0.5);
  }
  create(): void {
    this.scene.start('Menu');
  }
}
