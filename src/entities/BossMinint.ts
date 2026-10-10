import Phaser from 'phaser';
import { MININT_FRAMES } from '../systems/Textures';
import { sfx } from '../systems/AudioManager';
import { floatText, puff } from '../ui/effects';
import { bossDeath, leapArc, type BossArena } from './Boss';
import type { Guard } from './Guard';
import type { Hero } from './Hero';

export interface MinintArena extends BossArena {
  /** Puerta del edificio por donde salen los policías. */
  doorX: number;
  rightX: number;
}

type Mode = 'idle' | 'command' | 'leap' | 'exposed' | 'dying';

/**
 * Jefe de Santiago: el oficial del MININT.
 * Ciclo: desde el balcón manda una oleada de policías por la puerta → cuando caen
 * todos, baja a la calle y queda expuesto (vulnerable) → vuelve a subir y manda otra.
 * Oleadas de 2, 3 y 4 policías según la vida que le quede.
 */
export class BossMinint extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly maxHp = 12;
  hp = this.maxHp;
  mode: Mode = 'idle';
  private wave: Guard[] = [];
  private toSpawn = 0;
  private nextSpawn = 0;
  private until = 0;
  private hitsThisExposure = 0;
  private lastSwing = -1;
  private hitCooldownUntil = 0;

  constructor(
    scene: Phaser.Scene,
    private arena: MinintArena,
    /** Crea un policía en (x, y) que ya viene a por el héroe. */
    private summon: (x: number, y: number) => Guard,
  ) {
    super(scene, arena.balconyX, arena.balconyY, 'boss-minint', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(14).setFlipX(true);
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.setSize(26, 40).setOffset(7, 8);
    this.anims.play('boss-minint-idle');
  }

  get phase(): 1 | 2 | 3 {
    return this.hp > 8 ? 1 : this.hp > 4 ? 2 : 3;
  }

  /** Él no pega: el peligro son sus policías. */
  get harmful(): boolean {
    return false;
  }

  get vulnerable(): boolean {
    return this.mode === 'exposed';
  }

  start(time: number): void {
    this.beginCommand(time);
  }

  private beginCommand(time: number): void {
    this.mode = 'command';
    this.wave = [];
    this.toSpawn = [0, 2, 3, 4][this.phase];
    this.nextSpawn = time + 700;
    floatText(this.scene, this.x, this.y - 56, '¡ARRÉSTENLO!', '#ff5a4a');
    sfx('whistle');
  }

  update(time: number, delta: number, hero: Hero): void {
    const dt = delta / 1000;
    switch (this.mode) {
      case 'command': {
        this.setFlipX(hero.x < this.x);
        if (this.toSpawn > 0 && time >= this.nextSpawn) {
          this.wave.push(this.summon(this.arena.doorX, this.arena.groundY));
          this.toSpawn--;
          this.nextSpawn = time + [0, 900, 750, 600][this.phase];
          puff(this.scene, this.arena.doorX, this.arena.groundY - 10, 6, 0x9c9ca4);
        }
        // señala con el brazo cada vez que sale un policía
        if (time < this.nextSpawn - 400 && this.wave.length > 0) {
          this.anims.stop();
          this.setFrame(MININT_FRAMES.command);
        } else {
          this.anims.play('boss-minint-idle', true);
        }
        const cleared = this.toSpawn === 0 && this.wave.every((g) => !g.active || !g.alive);
        if (cleared) {
          this.leap(this.arena.doorX - 28, this.arena.groundY, () => {
            this.mode = 'exposed';
            this.until = this.scene.time.now + [0, 4500, 4000, 3500][this.phase];
            this.hitsThisExposure = 0;
            floatText(this.scene, this.x, this.y - 56, '¡OYE, ESPERA!', '#ffffff');
          });
        }
        break;
      }
      case 'exposed': {
        // camina despacio hacia el héroe, nervioso
        const dir = Math.sign(hero.x - this.x);
        if (Math.abs(hero.x - this.x) > 26) this.x = Phaser.Math.Clamp(this.x + dir * 28 * dt, this.arena.leftX, this.arena.rightX);
        this.setFlipX(dir < 0);
        this.anims.play('boss-minint-walk', true);
        if (Math.random() < 0.02) puff(this.scene, this.x + Phaser.Math.Between(-12, 12), this.y - 44, 1, 0x7fd3ff);
        if (time > this.until || this.hitsThisExposure >= 4) {
          this.leap(this.arena.balconyX, this.arena.balconyY, () => this.beginCommand(this.scene.time.now));
        }
        break;
      }
    }
  }

  private leap(x: number, y: number, done: () => void): void {
    this.mode = 'leap';
    this.anims.stop();
    this.setFrame(MININT_FRAMES.walk);
    this.setFlipX(x < this.x);
    leapArc(this, x, y, () => this.mode === 'dying', () => {
      this.setFlipX(true);
      done();
    });
  }

  /** Devuelve true si el golpe hizo daño. */
  takeHit(swingId: number, damage: number): boolean {
    if (this.mode === 'dying' || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    if (this.mode !== 'exposed') {
      sfx('pot');
      return false;
    }
    const now = this.scene.time.now;
    if (now < this.hitCooldownUntil) return false;
    this.hitCooldownUntil = now + 320;
    this.hp = Math.max(0, this.hp - damage);
    this.hitsThisExposure++;
    sfx('bossHit');
    this.anims.stop();
    this.setFrame(MININT_FRAMES.hurt).setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.mode !== 'dying' && this.clearTint());
    puff(this.scene, this.x, this.y - 30, 5);
    if (this.hp <= 0) {
      this.mode = 'dying';
      bossDeath(this, MININT_FRAMES.hurt);
    }
    return true;
  }
}
