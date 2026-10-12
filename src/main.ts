import Phaser from 'phaser';
import { BootScene } from './scenes/Boot';
import { PreloadScene } from './scenes/Preload';
import { MenuScene } from './scenes/Menu';
import { StageSelectScene } from './scenes/StageSelect';
import { BattleScene } from './scenes/Battle';
import { UpgradeScene } from './scenes/Upgrade';
import { ResultScene } from './scenes/Result';

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
    BattleScene,
    UpgradeScene,
    ResultScene,
  ],
};

new Phaser.Game(config);
