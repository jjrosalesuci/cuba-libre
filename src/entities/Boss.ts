import Phaser from 'phaser';
import { GRAVITY } from '../config';
import { BOSS_FRAMES, ITEM_FRAMES } from '../systems/Textures';
import { sfx } from '../systems/AudioManager';
import { puff } from '../ui/effects';
import type { Hero } from './Hero';

export interface BossArena {
  balconyX: number;
  balconyY: number;
  groundY: number;
  leftX: number;
}

type Mode = 'idle' | 'throw' | 'leap' | 'brace' | 'charge' | 'tired' | 'dying';

/** Salto en arco de un jefe hasta (x, y). No llama a `done` si el jefe murió en el aire. */
export function leapArc(sprite: Phaser.GameObjects.Sprite, x: number, y: number, isDying: () => boolean, done: () => void): void {
  const x0 = sprite.x, y0 = sprite.y;
  const height = 50;
  sprite.scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 750,
    onUpdate: (tw) => {
      const t = tw.getValue();
      sprite.x = Phaser.Math.Linear(x0, x, t);
      sprite.y = Phaser.Math.Linear(y0, y, t) - Math.sin(Math.PI * t) * height;
    },
    onComplete: () => {
      if (!isDying()) done();
    },
  });
}

/** Derrota de un jefe: gira, se encoge entre humo y desaparece; emite 'defeated'. */
export function bossDeath(sprite: Phaser.Physics.Arcade.Sprite, frame: number): void {
  const scene = sprite.scene;
  (sprite.body as Phaser.Physics.Arcade.Body).enable = false;
  sprite.anims.stop();
  sprite.setFrame(frame).clearTint();
  scene.cameras.main.shake(400, 0.01);
  sprite.setOrigin(0.5, 0.5);
  sprite.y -= 24;
  scene.tweens.add({
    targets: sprite,
    angle: 1080,
    scale: 0.2,
    y: sprite.y - 30,
    duration: 1400,
    ease: 'Quad.easeIn',
    onUpdate: () => Math.random() < 0.3 && puff(scene, sprite.x, sprite.y, 3, 0xbbbbbb),
    onComplete: () => {
      sfx('puff');
      puff(scene, sprite.x, sprite.y, 24, 0xdddddd);
      sprite.emit('defeated');
      sprite.destroy();
    },
  });
}

/**
 * Jefe de Guantánamo: el Secretario Provincial.
 * Ciclo: lanza "DISCURSOS" desde el balcón → salta y embiste → choca contra la
 * pared y queda cansado (vulnerable) → vuelve al balcón. Tres fases según la vida.
 */
export class BossGuantanamo extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly maxHp = 18;
  hp = this.maxHp;
  mode: Mode = 'idle';
  private until = 0;
  private thrown = 0;
  private nextThrow = 0;
  private lastSwing = -1;
  /** Pequeña invulnerabilidad entre golpes para que no se derrita con el combo. */
  private hitCooldownUntil = 0;
  private stars: Phaser.GameObjects.Image[] = [];
  /** Solo el salto hacia el suelo hace daño; el de regreso al balcón es una retirada. */
  private leapHarmful = false;

  constructor(
    scene: Phaser.Scene,
    private arena: BossArena,
    private papers: Phaser.Physics.Arcade.Group,
  ) {
    super(scene, arena.balconyX, arena.balconyY, 'boss', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(14).setFlipX(true);
    this.body.setAllowGravity(false).setImmovable(true);
    // caja algo menor que el dibujo: saltar la embestida debe ser exigente pero justo
    this.body.setSize(26, 36).setOffset(7, 12);
    this.anims.play('boss-idle');
  }

  get phase(): 1 | 2 | 3 {
    return this.hp > 12 ? 1 : this.hp > 6 ? 2 : 3;
  }

  get harmful(): boolean {
    return (this.mode === 'leap' && this.leapHarmful) || this.mode === 'charge' || this.mode === 'brace';
  }

  /** Solo se le puede hacer daño cuando está cansado. */
  get vulnerable(): boolean {
    return this.mode === 'tired';
  }

  start(time: number): void {
    this.beginThrow(time);
  }

  private beginThrow(time: number): void {
    this.mode = 'throw';
    this.thrown = 0;
    this.nextThrow = time + 500;
  }

  update(time: number, delta: number, hero: Hero): void {
    const dt = delta / 1000;
    const p = this.phase;
    switch (this.mode) {
      case 'throw': {
        const count = [0, 3, 4, 5][p];
        const interval = [0, 750, 600, 450][p];
        if (this.thrown < count && time >= this.nextThrow) {
          this.throwPaper(hero);
          this.thrown++;
          this.nextThrow = time + interval;
        } else if (this.thrown >= count && time >= this.nextThrow + 300) {
          this.leapTo(this.arena.balconyX, this.arena.groundY, () => {
            this.mode = 'brace';
            this.until = this.scene.time.now + 350;
            sfx('bossHit');
            this.scene.cameras.main.shake(150, 0.01);
          });
        }
        if (time < this.nextThrow - interval + 250 && this.thrown > 0) {
          this.anims.stop();
          this.setFrame(BOSS_FRAMES.throw);
        } else {
          this.anims.play('boss-idle', true);
        }
        break;
      }
      case 'brace':
        this.anims.stop();
        this.setFrame(BOSS_FRAMES.charge);
        this.setTint(Math.floor(time / 80) % 2 ? 0xff8080 : 0xffffff);
        if (time > this.until) this.mode = 'charge';
        break;
      case 'charge': {
        const speed = [0, 105, 130, 155][p];
        this.x -= speed * dt;
        if (Math.floor(time / 120) % 2 === 0 && Math.random() < 0.2) puff(this.scene, this.x + 14, this.y - 2, 2, 0xc9b38a);
        if (this.x <= this.arena.leftX) {
          this.x = this.arena.leftX;
          this.mode = 'tired';
          this.until = time + [0, 2400, 2000, 1600][p];
          this.setTint(0xffffff);
          sfx('bossHit');
          this.scene.cameras.main.shake(250, 0.015);
          this.showStars(true);
        }
        break;
      }
      case 'tired':
        this.anims.stop();
        this.setFrame(BOSS_FRAMES.tired);
        this.updateStars(time);
        if (time > this.until) {
          this.showStars(false);
          this.leapTo(this.arena.balconyX, this.arena.balconyY, () => this.beginThrow(this.scene.time.now));
        }
        break;
    }
  }

  private leapTo(x: number, y: number, done: () => void): void {
    this.mode = 'leap';
    this.leapHarmful = y > this.y;
    this.anims.stop();
    this.setFrame(BOSS_FRAMES.charge);
    this.setFlipX(x < this.x || x === this.x);
    leapArc(this, x, y, () => this.mode === 'dying', () => {
      this.setFlipX(true);
      done();
    });
  }

  private throwPaper(hero: Hero): void {
    const sx = this.x - 10;
    const sy = this.y - 40;
    const paper = this.papers.create(sx, sy, 'items', ITEM_FRAMES.paper) as Phaser.Physics.Arcade.Image;
    paper.setDepth(16);
    const T = [0, 1.15, 1.0, 0.85][this.phase];
    const tx = hero.x + Phaser.Math.Between(-12, 12);
    const ty = this.arena.groundY - 6;
    const body = paper.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 8);
    body.setVelocity((tx - sx) / T, (ty - sy - 0.5 * GRAVITY * T * T) / T);
    body.setAngularVelocity(360);
    sfx('paper');
  }

  private showStars(on: boolean): void {
    this.stars.forEach((s) => s.destroy());
    this.stars = [];
    if (!on) return;
    for (let i = 0; i < 3; i++) {
      this.stars.push(this.scene.add.image(this.x, this.y - 50, 'items', ITEM_FRAMES.star).setScale(0.6).setDepth(30));
    }
  }

  private updateStars(time: number): void {
    this.stars.forEach((s, i) => {
      const a = time / 250 + (i * Math.PI * 2) / 3;
      s.setPosition(this.x + Math.cos(a) * 14, this.y - 50 + Math.sin(a) * 4);
    });
  }

  /** Devuelve true si el golpe hizo daño. */
  takeHit(swingId: number, damage: number): boolean {
    if (this.mode === 'dying' || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    if (this.mode !== 'tired') {
      sfx('pot');
      return false;
    }
    const now = this.scene.time.now;
    if (now < this.hitCooldownUntil) return false;
    this.hitCooldownUntil = now + 320;
    this.hp = Math.max(0, this.hp - damage);
    sfx('bossHit');
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.mode !== 'dying' && this.clearTint());
    puff(this.scene, this.x, this.y - 30, 5);
    if (this.hp <= 0) this.die();
    return true;
  }

  private die(): void {
    this.mode = 'dying';
    this.showStars(false);
    bossDeath(this, BOSS_FRAMES.tired);
  }
}
