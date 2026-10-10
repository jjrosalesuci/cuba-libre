import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import { Line, SPEAKER_NAMES } from '../data/levels';
import { InputManager } from '../systems/InputManager';
import { sfx } from '../systems/AudioManager';
import { txt } from './text';

const CHARS_PER_SEC = 45;

/** Caja de texto estilo RPG con efecto máquina de escribir. */
export class DialogBox {
  private box: Phaser.GameObjects.Container;
  private name: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Text;
  private lines: Line[] = [];
  private idx = 0;
  private shown = 0;
  private onDone?: () => void;
  active = false;

  constructor(scene: Phaser.Scene) {
    const h = 46;
    const y = GAME_H - h - 4;
    this.box = scene.add.container(0, 0).setScrollFactor(0).setDepth(200).setVisible(false);
    this.box.add(scene.add.rectangle(6, y, GAME_W - 12, h, 0x101a4a, 0.95).setOrigin(0).setStrokeStyle(1, 0xffffff));
    this.name = txt(scene, 12, y + 5, '', { color: '#f5d142' });
    this.body = txt(scene, 12, y + 17, '', { wrap: GAME_W - 26 });
    this.arrow = txt(scene, GAME_W - 16, y + h - 10, '>', { color: '#f5d142' });
    this.box.add([this.name, this.body, this.arrow]);
    scene.tweens.add({ targets: this.arrow, alpha: 0, duration: 300, yoyo: true, repeat: -1 });
  }

  open(lines: Line[], onDone?: () => void): void {
    this.lines = lines;
    this.idx = 0;
    this.onDone = onDone;
    this.active = true;
    this.box.setVisible(true);
    this.showLine();
  }

  private showLine(): void {
    const l = this.lines[this.idx];
    this.name.setText(SPEAKER_NAMES[l.who]);
    this.body.setText('');
    this.shown = 0;
  }

  update(input: InputManager, delta: number): void {
    if (!this.active) return;
    const full = this.lines[this.idx].text;
    if (this.shown < full.length) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(full.length, this.shown + (CHARS_PER_SEC * delta) / 1000);
      if (Math.floor(this.shown) !== before && before % 3 === 0) sfx('select');
      this.body.setText(full.slice(0, Math.floor(this.shown)));
    }
    this.arrow.setVisible(this.shown >= full.length);
    if (input.anyConfirm()) {
      if (this.shown < full.length) {
        this.shown = full.length;
        this.body.setText(full);
      } else if (++this.idx < this.lines.length) {
        this.showLine();
      } else {
        this.active = false;
        this.box.setVisible(false);
        this.onDone?.();
      }
    }
  }
}
