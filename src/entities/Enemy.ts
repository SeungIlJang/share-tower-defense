import Phaser from 'phaser';
import { Fighter } from './Fighter';

/** 적 유닛 (웨이브/생산으로 소환, 기지로 전진) */
export class Enemy extends Fighter {
  reward = 0;
  constructor(scene: Phaser.Scene) {
    super(scene);
  }
}
