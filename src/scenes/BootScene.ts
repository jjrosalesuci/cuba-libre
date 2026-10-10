import Phaser from 'phaser';
import { HERO } from '../config';
import { createAnimations, generateTextures } from '../systems/Textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    createAnimations(this);
    resetRun(this.registry);
    this.scene.start('Title');
  }
}

export function resetRun(registry: Phaser.Data.DataManager): void {
  registry.set('lives', HERO.lives);
  registry.set('score', 0);
}
