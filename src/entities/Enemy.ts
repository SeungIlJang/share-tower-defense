import Phaser from 'phaser';
import { Fighter } from './Fighter';

/** 적 유닛 (웨이브/생산으로 소환, 기지로 전진) */
export class Enemy extends Fighter {
  reward = 0;
  abilityT = 0; // 👾 능력 타이머(치유·소환)
  raged = false; // 😡 분노 발동함
  constructor(scene: Phaser.Scene) {
    super(scene);
  }
}
