import Phaser from 'phaser';
import { BootScene } from './scenes/Boot';
import { PreloadScene } from './scenes/Preload';
import { MenuScene } from './scenes/Menu';
import { StageSelectScene } from './scenes/StageSelect';
import { BattleScene } from './scenes/Battle';
import { UpgradeScene } from './scenes/Upgrade';
import { ResultScene } from './scenes/Result';
import { DevScene } from './scenes/Dev';
import { PrepareScene } from './scenes/Prepare';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0d1018',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    StageSelectScene,
    PrepareScene,
    BattleScene,
    UpgradeScene,
    ResultScene,
    DevScene,
  ],
};

const game = new Phaser.Game(config);
// 디버그/헤드리스 테스트용 핸들(프로덕션 무해)
(globalThis as unknown as { __LD?: Phaser.Game }).__LD = game;
