import Phaser from 'phaser';
import { GAME_W } from '../config';
import { PROVINCES, Province, drawIsland, project, Projection } from '../data/cuba';
import { provinceLevels } from '../data/levels';
import { t } from '../i18n';
import { InputManager } from '../systems/InputManager';
import { playMusic, sfx } from '../systems/AudioManager';
import { load } from '../systems/SaveManager';
import { txt } from '../ui/text';

const PROJ: Projection = { x: 20, y: 34, w: 280 };

export class MapScene extends Phaser.Scene {
  private inp!: InputManager;
  private cursor = 0;
  private maxSelectable = 0;
  private markers!: Phaser.GameObjects.Graphics;
  private name!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private leaving = false;

  constructor() {
    super('Map');
  }

  create(): void {
    this.leaving = false;
    this.inp = new InputManager(this);
    this.cameras.main.fadeIn(300);
    playMusic('title');

    this.add.image(0, 0, 'sky-night').setOrigin(0);
    this.add.image(0, 0, 'bg-stars').setOrigin(0).setAlpha(0.6);

    drawIsland(this.add.graphics(), PROJ, 0x16391f, 0x6fbf73);

    const save = load();
    const liberated = new Set(save.liberated);
    // se puede elegir cualquier provincia liberada y la siguiente por liberar
    let firstOpen = PROVINCES.findIndex((p) => !liberated.has(p.id));
    if (firstOpen < 0) firstOpen = PROVINCES.length - 1;
    this.maxSelectable = firstOpen;
    this.cursor = firstOpen;

    // camino rojo por las provincias liberadas
    const path = this.add.graphics().lineStyle(2, 0xff3030, 1);
    for (let i = 1; i <= firstOpen; i++) {
      const a = project(PROVINCES[i - 1].lon, PROVINCES[i - 1].lat, PROJ);
      const b = project(PROVINCES[i].lon, PROVINCES[i].lat, PROJ);
      path.lineBetween(a[0], a[1], b[0], b[1]);
    }

    this.markers = this.add.graphics();
    txt(this, GAME_W / 2, 6, t('mapTitle'), { origin: [0.5, 0], color: '#f5d142', stroke: true });
    txt(this, 6, 20, `${t('score')} ${String(this.registry.get('score')).padStart(6, '0')}`, { color: '#ffffff' });
    txt(this, GAME_W - 6, 20, `${t('best')} ${String(save.best).padStart(6, '0')}`, { origin: [1, 0], color: '#c4c4cc' });

    this.add.rectangle(6, 140, GAME_W - 12, 34, 0x101a4a, 0.95).setOrigin(0).setStrokeStyle(1, 0xffffff);
    this.name = txt(this, GAME_W / 2, 146, '', { origin: [0.5, 0], color: '#f5d142' });
    this.status = txt(this, GAME_W / 2, 160, '', { origin: [0.5, 0] });
    this.refresh();
  }

  /**
   * Nivel con el que se entra a la provincia: si ya está liberada, desde el principio;
   * si no, el primero que todavía no se completó (el progreso se guarda nivel a nivel).
   */
  private entryLevel(p: Province): string | undefined {
    if (!p.firstLevel) return undefined;
    const levels = provinceLevels(p.firstLevel);
    if (load().liberated.includes(p.id)) return levels[0];
    const done = load().completed;
    return levels.find((id) => !done.includes(id)) ?? levels[0];
  }

  private refresh(): void {
    const p = PROVINCES[this.cursor];
    const liberated = load().liberated.includes(p.id);
    const entry = this.entryLevel(p);
    const resuming = !!entry && !liberated && entry !== p.firstLevel;
    this.name.setText(p.name);
    this.status.setText(
      liberated ? `${t('liberated')}  -  ${t('mapPlay')}` : resuming ? `${t('mapContinue')} ${entry}` : entry ? t('mapPlay') : t('comingSoon'),
    );
    this.status.setColor(liberated ? '#7bd389' : resuming ? '#f5d142' : entry ? '#ffffff' : '#8a8a96');
  }

  update(time: number): void {
    this.inp.update();
    this.drawMarkers(time);
    if (this.leaving) return;

    if (this.inp.justDown('left') || this.inp.justDown('down')) this.move(1);
    if (this.inp.justDown('right') || this.inp.justDown('up')) this.move(-1);

    if (this.inp.anyConfirm()) {
      const p = PROVINCES[this.cursor];
      const entry = this.entryLevel(p);
      if (!entry) {
        sfx('hurt');
        this.cameras.main.shake(120, 0.005);
        return;
      }
      sfx('select');
      this.leaving = true;
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { levelId: entry }));
    }
  }

  /** Oeste es "adelante" en el viaje: izquierda avanza, derecha retrocede. */
  private move(d: number): void {
    const next = Phaser.Math.Clamp(this.cursor + d, 0, this.maxSelectable);
    if (next !== this.cursor) {
      this.cursor = next;
      sfx('select');
      this.refresh();
    }
  }

  private drawMarkers(time: number): void {
    const g = this.markers.clear();
    const liberated = new Set(load().liberated);
    PROVINCES.forEach((p, i) => {
      const [x, y] = project(p.lon, p.lat, PROJ);
      const lib = liberated.has(p.id);
      const color = lib ? 0x7bd389 : i === this.maxSelectable ? 0xf5d142 : 0x55555f;
      const blink = i === this.maxSelectable && !lib && Math.floor(time / 300) % 2 === 0;
      if (!blink) g.fillStyle(color, 1).fillRect(x - 2, y - 2, 5, 5);
      if (p.id === 'puntocero') g.lineStyle(1, 0xff3030, 1).strokeRect(x - 4, y - 4, 9, 9);
      if (i === this.cursor) {
        const bob = Math.floor(time / 200) % 2;
        g.fillStyle(0xffffff, 1).fillTriangle(x - 3, y - 10 - bob, x + 3, y - 10 - bob, x, y - 6 - bob);
      }
    });
  }
}
