import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import { t } from '../i18n';
import { InputManager } from '../systems/InputManager';
import { getVolume, setVolume, sfx, stopMusic } from '../systems/AudioManager';
import { txt } from '../ui/text';
import type { LevelScene } from './LevelScene';

const OPTIONS = ['resume', 'restart', 'toMap', 'volume'] as const;

export class PauseScene extends Phaser.Scene {
  private inp!: InputManager;
  private idx = 0;
  private items: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('Pause');
  }

  create(): void {
    this.inp = new InputManager(this);
    this.idx = 0;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, 200, 110, 0x101a4a, 0.95).setStrokeStyle(1, 0xffffff);
    txt(this, GAME_W / 2, 46, t('pause'), { origin: 0.5, color: '#f5d142', size: 16 });
    this.items = OPTIONS.map((_, i) => txt(this, 88, 72 + i * 16, ''));
    this.render();
  }

  private render(): void {
    OPTIONS.forEach((o, i) => {
      const label = o === 'volume' ? `${t('volume')} ${'#'.repeat(Math.round(getVolume() * 5)).padEnd(5, '-')}` : t(o);
      this.items[i].setText(`${i === this.idx ? '>' : ' '} ${label}`).setColor(i === this.idx ? '#f5d142' : '#ffffff');
    });
  }

  update(): void {
    this.inp.update();
    if (this.inp.justDown('down')) { this.idx = (this.idx + 1) % OPTIONS.length; sfx('select'); this.render(); }
    if (this.inp.justDown('up')) { this.idx = (this.idx + OPTIONS.length - 1) % OPTIONS.length; sfx('select'); this.render(); }

    if (OPTIONS[this.idx] === 'volume') {
      const d = (this.inp.justDown('right') ? 0.2 : 0) - (this.inp.justDown('left') ? 0.2 : 0);
      if (d) { setVolume(getVolume() + d); sfx('select'); this.render(); }
    }

    if (this.inp.justDown('start') && OPTIONS[this.idx] !== 'restart' && OPTIONS[this.idx] !== 'toMap') {
      this.resume();
      return;
    }
    if (this.inp.anyConfirm()) {
      switch (OPTIONS[this.idx]) {
        case 'resume': this.resume(); break;
        case 'restart': {
          const level = this.scene.get('Level') as LevelScene;
          this.scene.stop();
          level.scene.resume();
          level.restartFromStart();
          break;
        }
        case 'toMap':
          stopMusic();
          this.scene.stop('Level');
          this.scene.start('Map');
          break;
      }
    }
  }

  private resume(): void {
    sfx('select');
    this.scene.resume('Level');
    this.scene.stop();
  }
}
