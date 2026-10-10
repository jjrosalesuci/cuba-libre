import Phaser from 'phaser';
import { GUARD_FRAMES } from '../systems/Textures';
import { sfx } from '../systems/AudioManager';
import { blinkOut, puff } from '../ui/effects';
import type { Hero } from './Hero';

export interface GuardStats {
  hp: number;
  speed: number;
  damage: number;
  detect: number;
  points: number;
  whistle: boolean;
}

export const GUARD_TYPES: Record<'patrol' | 'whistle', GuardStats> = {
  patrol: { hp: 3, speed: 40, damage: 1, detect: 110, points: 100, whistle: false },
  whistle: { hp: 3, speed: 34, damage: 1, detect: 140, points: 150, whistle: true },
};

type State = 'patrol' | 'chase' | 'windup' | 'punch' | 'recover' | 'hurt' | 'dying';

export class Guard extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  hp: number;
  mode: State = 'patrol';
  private dir: 1 | -1 = -1;
  private stateUntil = 0;
  private lastSwing = -1;
  private whistled = false;
  private readonly texKey: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly stats: GuardStats,
    private layer: Phaser.Tilemaps.TilemapLayer,
  ) {
    const key = stats.whistle ? 'guard-whistle' : 'guard';
    super(scene, x, y, key, 0);
    this.texKey = key;
    this.hp = stats.hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(15);
    this.body.setSize(10, 20).setOffset(7, 4);
    this.anims.play(`${key}-walk`);
  }

  get alive(): boolean {
    return this.mode !== 'dying';
  }

  /** Daña al héroe por contacto solo si está atacando o caminando hacia él. */
  get harmful(): boolean {
    return this.mode !== 'hurt' && this.mode !== 'dying';
  }

  update(time: number, hero: Hero): void {
    if (this.mode === 'dying') return;
    const b = this.body;
    const dx = hero.x - this.x;
    const dist = Math.abs(dx);
    const sameLevel = Math.abs(hero.y - this.y) < 40;
    const sees = !hero.dead && dist < this.stats.detect && sameLevel;

    switch (this.mode) {
      case 'patrol':
        if (this.blockedAhead()) this.dir = (this.dir * -1) as 1 | -1;
        b.velocity.x = this.dir * this.stats.speed;
        if (sees) {
          this.mode = 'chase';
          if (this.stats.whistle && !this.whistled) {
            this.whistled = true;
            sfx('whistle');
            this.emit('whistle', this);
          }
        }
        break;
      case 'chase':
        this.dir = dx < 0 ? -1 : 1;
        b.velocity.x = this.blockedAhead() ? 0 : this.dir * this.stats.speed * 1.6;
        if (dist < 24 && sameLevel) this.enter('windup', time, 320);
        else if (!sees && dist > this.stats.detect * 1.5) this.mode = 'patrol';
        break;
      case 'windup':
        b.velocity.x = 0;
        if (time > this.stateUntil) {
          this.enter('punch', time, 180);
          b.velocity.x = this.dir * 60;
        }
        break;
      case 'punch':
        if (time > this.stateUntil) this.enter('recover', time, 420);
        break;
      case 'recover':
        b.velocity.x = 0;
        if (time > this.stateUntil) this.mode = 'chase';
        break;
      case 'hurt':
        if (time > this.stateUntil && b.blocked.down) this.mode = 'chase';
        break;
    }

    this.setFlipX(this.dir < 0);
    this.updateFrame();
  }

  private enter(s: State, time: number, ms: number): void {
    this.mode = s;
    this.stateUntil = time + ms;
  }

  private updateFrame(): void {
    const frame: Partial<Record<State, number>> = {
      windup: GUARD_FRAMES.windup,
      punch: GUARD_FRAMES.punch,
      recover: GUARD_FRAMES.walkA,
      hurt: GUARD_FRAMES.hurt,
    };
    const f = frame[this.mode];
    if (f !== undefined) {
      this.anims.stop();
      this.setFrame(f);
    } else {
      this.anims.play(`${this.texKey}-walk`, true);
    }
    this.setTint(this.mode === 'windup' ? 0xffb0b0 : 0xffffff);
  }

  /** Pared o borde de precipicio delante. */
  private blockedAhead(): boolean {
    const b = this.body;
    if ((this.dir < 0 && b.blocked.left) || (this.dir > 0 && b.blocked.right)) return true;
    if (!b.blocked.down) return false;
    const aheadX = this.dir > 0 ? b.right + 2 : b.left - 2;
    const floor = this.layer.getTileAtWorldXY(aheadX, b.bottom + 4);
    return !floor || floor.index < 0;
  }

  getPunchBox(): Phaser.Geom.Rectangle | null {
    if (this.mode !== 'punch') return null;
    const b = this.body;
    const w = 14;
    return new Phaser.Geom.Rectangle(this.dir > 0 ? b.right : b.left - w, b.top + 4, w, 10);
  }

  /** Devuelve true si el golpe lo derrotó. */
  takeHit(swingId: number, damage: number, fromX: number, knock: number, time: number): boolean {
    if (!this.alive || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    this.hp -= damage;
    sfx('hit');
    const dir = this.x < fromX ? -1 : 1;
    this.body.velocity.x = dir * knock;
    this.body.velocity.y = -120;
    this.dir = (dir * -1) as 1 | -1;
    if (this.hp <= 0) {
      this.mode = 'dying';
      this.anims.stop();
      this.setFrame(GUARD_FRAMES.hurt).setTint(0xffffff);
      this.body.checkCollision.none = true;
      this.body.setAllowGravity(false);
      this.body.setVelocity(dir * 40, -30);
      blinkOut(this.scene, this, () => {
        sfx('puff');
        puff(this.scene, this.x, this.y - 12, 12, 0x9bb06a);
        this.destroy();
      });
      return true;
    }
    this.enter('hurt', time, 280);
    return false;
  }
}
