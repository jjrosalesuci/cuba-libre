import Phaser from 'phaser';
import { HERO } from '../config';
import { InputManager } from '../systems/InputManager';
import { HERO_FRAMES } from '../systems/Textures';
import { sfx } from '../systems/AudioManager';

export type AttackKind = 'ground' | 'air' | 'down';

interface Attack {
  id: number;
  kind: AttackKind;
  start: number;
  until: number;
  combo: number;
}

export interface Hitbox {
  rect: Phaser.Geom.Rectangle;
  id: number;
  damage: number;
  knock: number;
  kind: AttackKind;
}

let swingCounter = 0;

export class Hero extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  health: number = HERO.maxHealth;
  shield = false;
  dead = false;
  /** Bloquea el control (diálogos, cinemáticas). */
  frozen = false;

  private coyoteUntil = 0;
  private bufferUntil = 0;
  private invulnUntil = 0;
  private lockUntil = 0;
  private attack: Attack | null = null;
  private lastAttackEnd = -1000;
  private combo = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, private controls: InputManager) {
    super(scene, x, y, 'hero', HERO_FRAMES.idle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 20).setOffset(7, 4);
    this.body.setMaxVelocityY(520);
    this.setCollideWorldBounds(true);
    this.setDepth(20);
  }

  get facing(): 1 | -1 {
    return this.flipX ? -1 : 1;
  }

  isInvulnerable(time: number): boolean {
    return this.dead || time < this.invulnUntil;
  }

  update(time: number, delta: number): void {
    if (this.dead) return;
    const b = this.body;
    const dt = delta / 1000;
    const onGround = b.blocked.down || b.touching.down;
    const locked = this.frozen || time < this.lockUntil;

    if (onGround) this.coyoteUntil = time + HERO.coyoteMs;
    if (!this.frozen && this.controls.justDown('jump')) this.bufferUntil = time + HERO.bufferMs;

    if (this.attack && time >= this.attack.until) {
      this.lastAttackEnd = time;
      this.attack = null;
    }

    // movimiento horizontal con aceleración
    let dir = 0;
    if (!locked) dir = (this.controls.isDown('right') ? 1 : 0) - (this.controls.isDown('left') ? 1 : 0);
    const groundAttack = this.attack?.kind === 'ground';
    const target = dir * HERO.runSpeed * (groundAttack ? 0.25 : 1);
    const rate = (dir === 0 ? HERO.drag : HERO.accel) * dt;
    if (!(time < this.lockUntil)) {
      b.velocity.x += Phaser.Math.Clamp(target - b.velocity.x, -rate, rate);
    }
    if (dir !== 0 && !this.attack) this.setFlipX(dir < 0);

    // salto con coyote time, buffer y altura variable
    if (!locked && this.bufferUntil > time && this.coyoteUntil > time) {
      b.velocity.y = HERO.jumpVelocity;
      this.bufferUntil = 0;
      this.coyoteUntil = 0;
      sfx('jump');
    }
    if (this.controls.justUp('jump') && b.velocity.y < 0) b.velocity.y *= HERO.jumpCut;

    // ataque con palo
    if (!locked && !this.attack && this.controls.justDown('attack')) {
      const kind: AttackKind = onGround ? 'ground' : this.controls.isDown('down') ? 'down' : 'air';
      this.combo = kind === 'ground' && time - this.lastAttackEnd < HERO.comboWindowMs ? (this.combo + 1) % 3 : 0;
      this.attack = { id: ++swingCounter, kind, start: time, until: time + HERO.attackMs, combo: this.combo };
      sfx('swing');
    }

    this.updateFrame(time, onGround);
    this.setAlpha(time < this.invulnUntil && Math.floor(time / 60) % 2 === 0 ? 0.3 : 1);
  }

  private updateFrame(time: number, onGround: boolean): void {
    if (time < this.lockUntil && !this.frozen) {
      this.anims.stop();
      this.setFrame(HERO_FRAMES.hurt);
      return;
    }
    if (this.attack) {
      this.anims.stop();
      const t = time - this.attack.start;
      if (this.attack.kind === 'down') this.setFrame(HERO_FRAMES.down);
      else if (this.attack.kind === 'air') this.setFrame(t < 50 ? HERO_FRAMES.windup : HERO_FRAMES.airSwing);
      else this.setFrame(t < 60 ? HERO_FRAMES.windup : HERO_FRAMES.swing);
      return;
    }
    if (!onGround) {
      this.anims.stop();
      this.setFrame(HERO_FRAMES.jump);
    } else if (Math.abs(this.body.velocity.x) > 15) {
      this.anims.play('hero-run', true);
    } else {
      this.anims.stop();
      this.setFrame(HERO_FRAMES.idle);
    }
  }

  /** Hitbox del palo si el ataque está en sus frames activos. */
  getHitbox(time: number): Hitbox | null {
    const a = this.attack;
    if (!a) return null;
    const t = time - a.start;
    if (t < 40 || t > 180) return null;
    const b = this.body;
    let rect: Phaser.Geom.Rectangle;
    if (a.kind === 'down') {
      rect = new Phaser.Geom.Rectangle(b.center.x - 8, b.bottom - 4, 16, 16);
    } else {
      const w = 20;
      const x = this.facing > 0 ? b.right - 2 : b.left - w + 2;
      rect = new Phaser.Geom.Rectangle(x, b.top - (a.kind === 'air' ? 6 : 0), w, a.kind === 'air' ? 22 : 16);
    }
    const finisher = a.kind === 'ground' && a.combo === 2;
    return { rect, id: a.id, damage: finisher ? 2 : 1, knock: finisher ? 200 : 110, kind: a.kind };
  }

  /** ¿Viene cayendo sobre la cabeza de ese cuerpo? (para pisotones) */
  isLandingOn(other: Phaser.Physics.Arcade.Body): boolean {
    return !this.dead && this.body.velocity.y > 0 && this.body.bottom <= other.top + 10;
  }

  /** Rebote al pegar hacia abajo sobre un enemigo. */
  pogo(): void {
    this.body.velocity.y = -260;
  }

  hurt(fromX: number, damage: number, time: number): boolean {
    if (this.isInvulnerable(time)) return false;
    if (this.shield) {
      this.shield = false;
      this.invulnUntil = time + 600;
      sfx('pot');
      return false;
    }
    this.health = Math.max(0, this.health - damage);
    this.invulnUntil = time + HERO.invulnMs;
    this.lockUntil = time + HERO.hurtLockMs;
    this.attack = null;
    const dir = this.x < fromX ? -1 : 1;
    this.body.velocity.x = dir * 140;
    this.body.velocity.y = -170;
    sfx('hurt');
    this.scene.cameras.main.shake(120, 0.006);
    if (this.health <= 0) this.die();
    return true;
  }

  heal(n: number): void {
    this.health = Math.min(HERO.maxHealth, this.health + n);
  }

  die(): void {
    if (this.dead) return;
    this.dead = true;
    this.health = 0;
    this.anims.stop();
    this.setFrame(HERO_FRAMES.hurt).setAlpha(1);
    this.body.enable = false;
    this.setCollideWorldBounds(false);
    sfx('die');
    // caída clásica de arcade
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      duration: 350,
      ease: 'Quad.easeOut',
      yoyo: false,
      onComplete: () => {
        this.scene.tweens.add({ targets: this, y: this.y + 260, duration: 900, ease: 'Quad.easeIn' });
      },
    });
    this.emit('dead');
  }
}
