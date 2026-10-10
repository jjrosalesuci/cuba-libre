import Phaser from 'phaser';
import { GAME_W, GAME_H, HERO } from '../config';
import { txt } from './text';

export class HUD {
  private hearts: Phaser.GameObjects.Image[] = [];
  private lives: Phaser.GameObjects.Text;
  private score: Phaser.GameObjects.Text;
  private shield: Phaser.GameObjects.Image;
  private bossBox?: Phaser.GameObjects.Container;
  private bossFill?: Phaser.GameObjects.Rectangle;

  constructor(private scene: Phaser.Scene, levelTitle: string) {
    const depth = 100;
    scene.add.rectangle(0, 0, GAME_W, 13, 0x000000, 0.55).setOrigin(0).setScrollFactor(0).setDepth(depth);
    for (let i = 0; i < HERO.maxHealth; i++) {
      this.hearts.push(scene.add.image(4 + i * 9, 3, 'heart', 0).setOrigin(0).setScrollFactor(0).setDepth(depth));
    }
    this.shield = scene.add.image(4 + HERO.maxHealth * 9 + 1, 1, 'items', 2).setOrigin(0).setScale(0.8)
      .setScrollFactor(0).setDepth(depth).setVisible(false);
    scene.add.image(76, 3, 'head').setOrigin(0).setScrollFactor(0).setDepth(depth);
    this.lives = txt(scene, 86, 3, 'x3', { fixed: true }).setDepth(depth);
    txt(scene, GAME_W / 2 + 18, 3, levelTitle, { fixed: true, origin: [0.5, 0], color: '#f5d142' }).setDepth(depth);
    this.score = txt(scene, GAME_W - 4, 3, '000000', { fixed: true, origin: [1, 0] }).setDepth(depth);
  }

  update(health: number, lives: number, score: number, shield: boolean): void {
    this.hearts.forEach((h, i) => h.setFrame(i < health ? 0 : 1));
    this.lives.setText(`x${lives}`);
    this.score.setText(String(score).padStart(6, '0'));
    this.shield.setVisible(shield);
  }

  showBoss(name: string): void {
    const s = this.scene;
    const w = 200;
    const box = s.add.container(GAME_W / 2, GAME_H - 12).setScrollFactor(0).setDepth(100);
    box.add(s.add.rectangle(0, 0, w + 4, 8, 0x000000).setStrokeStyle(1, 0xffffff));
    this.bossFill = s.add.rectangle(-w / 2, 0, w, 4, 0xd42a2a).setOrigin(0, 0.5);
    box.add(this.bossFill);
    box.add(txt(s, 0, -8, name, { origin: [0.5, 1], stroke: true }));
    this.bossBox = box;
  }

  setBoss(frac: number): void {
    this.bossFill?.setScale(Math.max(0, frac), 1);
  }

  hideBoss(): void {
    this.bossBox?.destroy();
    this.bossBox = undefined;
  }
}
