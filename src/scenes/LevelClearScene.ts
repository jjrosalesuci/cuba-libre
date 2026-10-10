import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import { PROVINCES } from '../data/cuba';
import { t } from '../i18n';
import { InputManager } from '../systems/InputManager';
import { playMusic, sfx } from '../systems/AudioManager';
import { load } from '../systems/SaveManager';
import { txt } from '../ui/text';

/** "PROVINCIA LIBERADA": la gente sale a la calle con banderas. */
export class LevelClearScene extends Phaser.Scene {
  private inp!: InputManager;
  private ready = false;

  constructor() {
    super('LevelClear');
  }

  create(data: { province: string }): void {
    this.inp = new InputManager(this);
    this.ready = false;
    this.cameras.main.fadeIn(400);
    playMusic('clear');

    this.add.image(0, 0, 'sky-dawn').setOrigin(0);
    this.add.tileSprite(0, 62, GAME_W, 90, 'bg-mountains').setOrigin(0);
    this.add.tileSprite(0, 92, GAME_W, 70, 'bg-town').setOrigin(0);
    this.add.rectangle(0, 156, GAME_W, GAME_H - 156, 0xa0703a).setOrigin(0);
    this.add.rectangle(0, 156, GAME_W, 3, 0x3f9a3a).setOrigin(0);

    // multitud saltando con banderas
    for (let i = 0; i < 14; i++) {
      const x = 14 + i * 22 + Phaser.Math.Between(-4, 4);
      const v = i % 4;
      const npc = this.add.sprite(x, 157, `npc${v}`, 1).setOrigin(0.5, 1).setFlipX(i % 2 === 0);
      if (i % 3 === 0) {
        // el asta sale de la mano del vecino
        const flag = this.add.image(npc.flipX ? x - 14 : x + 3, 148, 'flag', 1).setOrigin(0, 1).setScale(0.7);
        this.tweens.add({ targets: flag, y: flag.y - 6, duration: 260 + i * 10, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
      } else {
        npc.anims.play(`npc${v}-bang`);
      }
      this.tweens.add({ targets: npc, y: npc.y - 6, duration: 260 + i * 10, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
    }
    const hero = this.add.sprite(GAME_W / 2, 157, 'hero', 5).setOrigin(0.5, 1).setDepth(5);
    this.tweens.add({ targets: hero, y: hero.y - 10, duration: 300, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });

    const name = PROVINCES.find((p) => p.id === data.province)?.name ?? '';
    txt(this, GAME_W / 2, 18, t('provinceLiberated'), { size: 16, origin: 0.5, color: '#f5d142', stroke: true });
    txt(this, GAME_W / 2, 38, name, { origin: 0.5, stroke: true });
    txt(this, GAME_W / 2, 56, `${t('score')} ${String(this.registry.get('score')).padStart(6, '0')}`, { origin: 0.5, stroke: true });
    txt(this, GAME_W / 2, 68, `${t('best')} ${String(load().best).padStart(6, '0')}`, { origin: 0.5, color: '#c4c4cc', stroke: true });
    const next = txt(this, GAME_W / 2, 84, t('next'), { origin: 0.5, stroke: true }).setAlpha(0);

    this.time.delayedCall(1200, () => {
      this.ready = true;
      this.tweens.add({ targets: next, alpha: 1, duration: 400, yoyo: true, repeat: -1 });
    });
  }

  update(): void {
    this.inp.update();
    if (this.ready && this.inp.anyConfirm()) {
      this.ready = false;
      sfx('select');
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
    }
  }
}
