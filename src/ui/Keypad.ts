import Phaser from 'phaser';
import { sfx } from '../systems/sound';

export interface KeypadOptions {
  title: string;
  mask?: boolean; // 비밀번호처럼 ●로 표시
  maxLen?: number;
  initial?: string;
  hint?: string;
}

/**
 * 🔢 숫자 키패드 창(휴대폰에서도 쉽게) — 1~9 · 0 · ← · C · 확인/취소. PC는 숫자키·Backspace·Enter·Esc.
 * 확인하면 onOk(입력값), 닫히면 onClose. 반환값.shake(msg) 로 틀렸을 때 흔들기.
 */
export function openKeypad(
  scene: Phaser.Scene,
  opts: KeypadOptions,
  onOk: (value: string) => void,
  onClose?: () => void
): { close: () => void; shake: (msg: string) => void } {
  const maxLen = opts.maxLen ?? 9;
  let value = opts.initial ?? '';
  const layer = scene.add.container(0, 0).setDepth(1000);
  const dim = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65).setInteractive();
  const panel = scene.add.graphics();
  panel.fillStyle(0x1a2133, 0.98).fillRoundedRect(440, 40, 400, 640, 28);
  panel.lineStyle(4, 0x6ab8ff, 1).strokeRoundedRect(440, 40, 400, 640, 28);
  const title = scene.add.text(640, 84, opts.title, { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0.5);
  const box = scene.add.rectangle(640, 146, 340, 64, 0x0b0f1a).setStrokeStyle(2, 0x3a4560);
  const shown = scene.add.text(640, 146, '', { fontFamily: 'sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
  const hint = scene.add.text(640, 192, opts.hint ?? '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#9fb3d0' }).setOrigin(0.5);
  layer.add([dim, panel, title, box, shown, hint]);

  const refresh = (): void => {
    shown.setText(value === '' ? ' ' : opts.mask ? '●'.repeat(value.length) : Number(value).toLocaleString('ko-KR'));
  };
  const press = (k: string): void => {
    if (k === '←') value = value.slice(0, -1);
    else if (k === 'C') value = '';
    else if (k === 'OK') {
      sfx(scene, 'click');
      onOk(value);
      return;
    } else if (value.length < maxLen) value = value === '0' && !opts.mask ? k : value + k;
    sfx(scene, 'click');
    refresh();
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];
  keys.forEach((k, i) => {
    const x = 640 + ((i % 3) - 1) * 112;
    const y = 262 + Math.floor(i / 3) * 86;
    const b = scene.add.rectangle(x, y, 100, 74, k === 'C' || k === '←' ? 0x3a3f55 : 0x2a3348).setStrokeStyle(2, 0x4a5878).setInteractive({ useHandCursor: true });
    const t = scene.add.text(x, y, k, { fontFamily: 'sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    b.on('pointerdown', () => {
      b.setFillStyle(0x4a6aa8);
      scene.time.delayedCall(90, () => b.active && b.setFillStyle(k === 'C' || k === '←' ? 0x3a3f55 : 0x2a3348));
      press(k);
    });
    layer.add([b, t]);
  });
  const ok = scene.add.rectangle(708, 630, 190, 62, 0x2f7a4d).setStrokeStyle(2, 0x5cff9e).setInteractive({ useHandCursor: true });
  const okT = scene.add.text(708, 630, '✓ 확인', { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
  const no = scene.add.rectangle(540, 630, 130, 62, 0x5a3040).setStrokeStyle(2, 0xff7a8a).setInteractive({ useHandCursor: true });
  const noT = scene.add.text(540, 630, '취소', { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
  ok.on('pointerdown', () => press('OK'));
  layer.add([ok, okT, no, noT]);

  const onKey = (ev: KeyboardEvent): void => {
    if (/^[0-9]$/.test(ev.key)) press(ev.key);
    else if (ev.key === 'Backspace') press('←');
    else if (ev.key === 'Enter') press('OK');
    else if (ev.key === 'Escape') close();
  };
  scene.input.keyboard?.on('keydown', onKey);

  const close = (): void => {
    scene.input.keyboard?.off('keydown', onKey);
    layer.destroy();
    onClose?.();
  };
  no.on('pointerdown', close);
  refresh();

  return {
    close,
    shake: (msg: string) => {
      hint.setText(msg).setColor('#ff7a8a');
      value = '';
      refresh();
      scene.tweens.add({ targets: [box, shown], x: '+=10', duration: 50, yoyo: true, repeat: 3 });
    },
  };
}
