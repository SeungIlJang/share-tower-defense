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
import { CodexScene } from './scenes/Codex';
import { VIEW_OFF, VIEW_W } from './systems/view';
import { trackScreen } from './systems/analytics';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0d1018',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW_W, // 📱 넓은 휴대폰이면 양옆까지 씀
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
    CodexScene,
  ],
};

const game = new Phaser.Game(config);
// 📱 전투 외 화면은 1280 기준으로 만들어 가운데 둠(양옆은 배경이 넓게 채움)
game.events.once(Phaser.Core.Events.READY, () => {
  for (const s of game.scene.scenes) {
    if (s.sys.settings.key === 'Battle') {
      s.events.on(Phaser.Scenes.Events.CREATE, () => trackScreen('Battle'));
      continue;
    }
    s.events.on(Phaser.Scenes.Events.CREATE, () => s.cameras.main.setScroll(-VIEW_OFF, 0));
    s.events.on(Phaser.Scenes.Events.CREATE, () => trackScreen(s.sys.settings.key)); // 📊 화면
    s.cameras?.main?.setScroll(-VIEW_OFF, 0); // 이미 시작한 첫 화면(Boot)
  }
});
// 디버그/헤드리스 테스트용 핸들(프로덕션 무해)
(globalThis as unknown as { __LD?: Phaser.Game }).__LD = game;
