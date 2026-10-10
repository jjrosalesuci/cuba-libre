import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import { PROVINCES, drawIsland, project, Projection } from '../data/cuba';
import { t } from '../i18n';
import { InputManager } from '../systems/InputManager';
import { playMusic, sfx } from '../systems/AudioManager';
import { HERO_FRAMES } from '../systems/Textures';
import { txt } from '../ui/text';
import { hideDonate, showDonate } from '../ui/DonateButton';
import { resetRun } from './BootScene';

const PROJ: Projection = { x: 30, y: 44, w: 260 };

export class TitleScene extends Phaser.Scene {
  private inp!: InputManager;
  private path!: Phaser.GameObjects.Graphics;
  private pathPts: [number, number][] = [];
  private progress = 0;
  private started = false;

  constructor() {
    super('Title');
  }

  create(): void {
    // botón de donación de PayPal solo en la portada
    showDonate();
    this.events.once('shutdown', hideDonate);
    this.started = false;
    this.progress = 0;
    this.inp = new InputManager(this);
    this.add.image(0, 0, 'sky-night').setOrigin(0);
    const stars = this.add.image(0, 0, 'bg-stars').setOrigin(0);
    this.tweens.add({ targets: stars, alpha: 0.5, duration: 1200, yoyo: true, repeat: -1 });

    // amanecer por abajo
    const glow = this.add.graphics();
    const bands = ['#3b2a5a', '#6b3a6a', '#b0506a', '#e08050', '#f2b060'];
    bands.forEach((c, i) => glow.fillStyle(Phaser.Display.Color.HexStringToColor(c).color, 1).fillRect(0, 150 + i * 6, GAME_W, 6));

    // isla de Cuba brillando
    const island = this.add.graphics();
    drawIsland(island, PROJ, 0x16391f, 0xf5d142);
    this.tweens.add({ targets: island, alpha: 0.75, duration: 900, yoyo: true, repeat: -1 });

    this.pathPts = PROVINCES.map((p) => project(p.lon, p.lat, PROJ));
    this.path = this.add.graphics();

    // loma con la silueta del héroe
    const hill = this.add.graphics();
    hill.fillStyle(0x05040a, 1).fillEllipse(48, GAME_H + 6, 140, 50);
    this.add.sprite(52, GAME_H - 18, 'hero', HERO_FRAMES.windup).setOrigin(0.5, 1).setTintFill(0x05040a).setScale(1.5);

    txt(this, GAME_W / 2, 8, t('title1'), { size: 16, origin: [0.5, 0], color: '#f5d142', stroke: true });
    txt(this, GAME_W / 2, 26, t('title2'), { size: 16, origin: [0.5, 0], color: '#ff5a4a', stroke: true });

    const press = txt(this, GAME_W / 2 + 30, 146, t('pressStart'), { origin: 0.5, stroke: true });
    this.tweens.add({ targets: press, alpha: 0, duration: 450, yoyo: true, repeat: -1, hold: 200 });
    txt(this, GAME_W / 2 + 30, 160, t('controlsHint'), { origin: 0.5, color: '#c4c4cc', stroke: true });

    // la música necesita un gesto del usuario: arranca con la primera tecla
    this.input.keyboard!.once('keydown', () => playMusic('title'));
    this.input.once('pointerdown', () => playMusic('title'));
  }

  update(_time: number, delta: number): void {
    this.inp.update();
    this.progress = Math.min(1, this.progress + delta / 4000);
    this.drawPath();

    if (!this.started && (this.inp.anyConfirm() || this.inp.justDown('jump'))) {
      this.started = true;
      playMusic('title');
      sfx('select');
      resetRun(this.registry);
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
    }
  }

  /** Camino rojo que se enciende de oriente a occidente. */
  private drawPath(): void {
    const g = this.path.clear();
    const n = this.pathPts.length - 1;
    const upTo = this.progress * n;
    g.lineStyle(2, 0xff3030, 1);
    g.beginPath();
    g.moveTo(...this.pathPts[0]);
    for (let i = 1; i <= Math.ceil(upTo); i++) {
      const [x0, y0] = this.pathPts[i - 1];
      const [x1, y1] = this.pathPts[i];
      const f = Math.min(1, upTo - (i - 1));
      g.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
    }
    g.strokePath();
    for (let i = 0; i <= Math.floor(upTo); i++) {
      g.fillStyle(0xffd040, 1).fillRect(this.pathPts[i][0] - 1, this.pathPts[i][1] - 1, 3, 3);
    }
  }
}
