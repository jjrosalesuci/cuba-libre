import Phaser from 'phaser';
import { GAME_W, HERO } from '../config';
import { t } from '../i18n';
import { InputManager } from '../systems/InputManager';
import { sfx } from '../systems/AudioManager';
import { load, save } from '../systems/SaveManager';
import { HERO_FRAMES } from '../systems/Textures';
import { txt } from '../ui/text';

export class GameOverScene extends Phaser.Scene {
  private inp!: InputManager;
  private idx = 0;
  private levelId = '1-1';
  private items: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('GameOver');
  }

  init(data: { levelId: string }): void {
    this.levelId = data.levelId;
    this.idx = 0;
  }

  create(): void {
    this.inp = new InputManager(this);
    const score = this.registry.get('score') as number;
    if (score > load().best) save({ best: score });

    this.cameras.main.setBackgroundColor('#0b0b12');
    this.add.sprite(GAME_W / 2, 70, 'hero', HERO_FRAMES.hurt).setScale(2).setOrigin(0.5, 1);
    this.add.image(GAME_W / 2 + 26, 66, 'items', 0).setScale(1.5).setAngle(100).setAlpha(0.7);
    txt(this, GAME_W / 2, 88, t('gameOver'), { origin: 0.5, color: '#ff5a4a', size: 8 });
    txt(this, GAME_W / 2, 104, `${t('score')} ${String(score).padStart(6, '0')}`, { origin: 0.5 });
    this.items = [txt(this, GAME_W / 2 - 40, 128, ''), txt(this, GAME_W / 2 - 40, 144, '')];
    this.render();
  }

  private render(): void {
    [t('continue'), t('quit')].forEach((s, i) => {
      this.items[i].setText(`${i === this.idx ? '>' : ' '} ${s}`).setColor(i === this.idx ? '#f5d142' : '#ffffff');
    });
  }

  update(): void {
    this.inp.update();
    if (this.inp.justDown('up') || this.inp.justDown('down')) { this.idx = 1 - this.idx; sfx('select'); this.render(); }
    if (this.inp.anyConfirm()) {
      sfx('select');
      if (this.idx === 0) {
        this.registry.set('lives', HERO.lives);
        this.registry.set('score', 0);
        this.scene.start('Level', { levelId: this.levelId });
      } else {
        this.scene.start('Title');
      }
    }
  }
}
