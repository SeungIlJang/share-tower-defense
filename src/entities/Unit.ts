import Phaser from 'phaser';
import { Fighter } from './Fighter';

/** 아군 유닛 (플레이어가 골드로 소환) */
export class Unit extends Fighter {
  constructor(scene: Phaser.Scene) {
    super(scene, 0x4a9eff);
  }
}
