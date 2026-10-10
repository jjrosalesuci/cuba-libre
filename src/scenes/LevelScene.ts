import Phaser from 'phaser';
import { GAME_W, GAME_H, TILE } from '../config';
import { LEVELS, LevelConfig } from '../data/levels';
import { t } from '../i18n';
import { Hero } from '../entities/Hero';
import { Guard, GUARD_TYPES } from '../entities/Guard';
import { BossGuantanamo } from '../entities/Boss';
import { InputManager } from '../systems/InputManager';
import { playMusic, sfx, stopMusic } from '../systems/AudioManager';
import { liberate } from '../systems/SaveManager';
import { ITEM_FRAMES, TILES } from '../systems/Textures';
import { HUD } from '../ui/HUD';
import { DialogBox } from '../ui/DialogBox';
import { floatText, puff } from '../ui/effects';
import { txt } from '../ui/text';

export interface LevelData {
  levelId: string;
  checkpoint?: { x: number; y: number };
  triggered?: string[];
}

type PickupKind = 'cafe' | 'colada' | 'cazuela' | 'croqueta' | 'coin';
const PICKUPS: Record<string, PickupKind> = { c: 'cafe', C: 'colada', P: 'cazuela', L: 'croqueta', $: 'coin' };

interface Truck {
  img: Phaser.Physics.Arcade.Image;
  spawned: boolean;
}

interface Flag {
  img: Phaser.GameObjects.Image;
  on: boolean;
}

const rect = (b: Phaser.Physics.Arcade.Body) => new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
const hit = Phaser.Geom.Intersects.RectangleToRectangle;

export class LevelScene extends Phaser.Scene {
  private cfg!: LevelConfig;
  private data0!: LevelData;
  private inp!: InputManager;
  private hero!: Hero;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private guards!: Phaser.GameObjects.Group;
  private papers!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private trucks: Truck[] = [];
  private flags: Flag[] = [];
  private npcs: Phaser.GameObjects.Sprite[] = [];
  private triggers: { x: number; key: string }[] = [];
  private triggered = new Set<string>();
  private boss?: BossGuantanamo;
  private bossStarted = false;
  private hud!: HUD;
  private dialog!: DialogBox;
  private blackout?: Phaser.GameObjects.Rectangle;
  /** f = cuánto sigue a la cámara; drift = deriva propia en px/s (nubes). */
  private parallax: { obj: Phaser.GameObjects.TileSprite; f: number; drift?: number }[] = [];
  private exitX = Infinity;
  private mapH = 0;
  private checkpoint?: { x: number; y: number };
  private ending = false;
  private nextPot = 0;

  constructor() {
    super('Level');
  }

  init(data: LevelData): void {
    this.data0 = data;
    this.cfg = LEVELS[data.levelId];
    this.checkpoint = data.checkpoint;
    this.triggered = new Set(data.triggered ?? []);
    this.trucks = [];
    this.flags = [];
    this.npcs = [];
    this.triggers = [];
    this.parallax = [];
    this.boss = undefined;
    this.bossStarted = false;
    this.blackout = undefined;
    this.exitX = Infinity;
    this.ending = false;
  }

  create(): void {
    const cfg = this.cfg;
    this.inp = new InputManager(this);
    this.cameras.main.fadeIn(300);
    this.buildBackground();

    const { start, bossAt } = this.buildMap();
    const mapW = cfg.rows[0].length * TILE;

    const spawn = this.checkpoint ?? start;
    this.hero = new Hero(this, spawn.x, spawn.y, this.inp);
    this.hero.on('dead', () => this.onHeroDead());

    this.physics.world.setBounds(0, -200, mapW, this.mapH + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.physics.add.collider(this.hero, this.layer);
    this.physics.add.collider(this.guards, this.layer);
    for (const tr of this.trucks) {
      this.physics.add.collider(this.hero, tr.img);
      this.physics.add.collider(this.guards, tr.img);
    }
    this.physics.add.collider(this.papers, this.layer, (p) => this.popPaper(p as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.hero, this.pickups, (_h, p) => this.collect(p as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.hero, this.guards, (_h, g) => {
      const guard = g as Guard;
      if (!guard.alive) return;
      // caerle encima lo derrota y el héroe rebota
      if (this.hero.isLandingOn(guard.body)) {
        if (guard.stomp(this.time.now)) {
          this.hero.pogo();
          this.addScore(guard.stats.points);
          floatText(this, guard.x, guard.y - 26, `${guard.stats.points}`);
        }
        return;
      }
      if (guard.harmful) this.hero.hurt(guard.x, guard.stats.damage, this.time.now);
    });
    this.physics.add.overlap(this.hero, this.papers, (_h, p) => {
      if (this.hero.hurt((p as Phaser.Physics.Arcade.Image).x, 1, this.time.now)) this.popPaper(p as Phaser.Physics.Arcade.Image);
    });

    if (bossAt) this.setupBoss();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, mapW, this.mapH);
    cam.startFollow(this.hero, true, 0.15, 0.15, 0, 24);
    cam.setDeadzone(32, 48);

    this.hud = new HUD(this, cfg.title);
    this.dialog = new DialogBox(this);

    if (cfg.blackoutUntilCol && !this.checkpoint) {
      this.blackout = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000010, 0.7).setOrigin(0).setScrollFactor(0).setDepth(90);
    }

    if (!this.checkpoint) this.showBanner();
    if (cfg.music === 'level') playMusic('level');
    else stopMusic();
  }

  // ---------------------------------------------------------------- construcción

  private buildBackground(): void {
    const cfg = this.cfg;
    this.add.image(0, 0, `sky-${cfg.sky}`).setOrigin(0).setScrollFactor(0).setDepth(-20);
    if (cfg.sky === 'dusk' || cfg.sky === 'dawn') {
      this.add.image(0, 0, 'bg-stars').setOrigin(0).setScrollFactor(0).setDepth(-19).setAlpha(0.35);
    }
    if (cfg.sky === 'day') {
      const clouds = this.add.tileSprite(0, 6, GAME_W, 70, 'bg-clouds').setOrigin(0).setScrollFactor(0).setDepth(-19);
      this.parallax.push({ obj: clouds, f: 0.05, drift: 4 });
    }
    const mountains = this.add.tileSprite(0, 62, GAME_W, 90, 'bg-mountains').setOrigin(0).setScrollFactor(0).setDepth(-18);
    this.parallax.push({ obj: mountains, f: 0.15 });
    const nearKey = { rural: 'bg-rural', base: 'bg-base', town: 'bg-town', hq: 'bg-town' }[cfg.theme];
    const near = this.add.tileSprite(0, 92, GAME_W, 70, nearKey).setOrigin(0).setScrollFactor(0).setDepth(-17);
    this.parallax.push({ obj: near, f: 0.4 });
  }

  private buildMap(): { start: { x: number; y: number }; bossAt?: { x: number; y: number } } {
    const cfg = this.cfg;
    const rows = cfg.rows;
    const base = cfg.theme === 'base';
    const data: number[][] = [];
    let start = { x: 32, y: 160 };
    let bossAt: { x: number; y: number } | undefined;

    this.guards = this.add.group();
    this.papers = this.physics.add.group();
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.mapH = rows.length * TILE;

    const deferred: { ch: string; x: number; y: number }[] = [];
    rows.forEach((row, y) => {
      data.push([...row].map((ch, x) => {
        switch (ch) {
          case '#': {
            const top = y === 0 || rows[y - 1][x] !== '#';
            return base ? (top ? TILES.concTop : TILES.concFill) : top ? TILES.dirtTop : TILES.dirtFill;
          }
          case '=': return TILES.platform;
          case 'B': return TILES.barrel;
          case 'Z': return TILES.crate;
          case 'H': return TILES.brick;
          case '.': return -1;
          default:
            deferred.push({ ch, x, y });
            return -1;
        }
      }));
    });

    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles')!;
    this.layer = map.createLayer(0, tileset, 0, 0)!;
    this.layer.setCollision([TILES.dirtTop, TILES.dirtFill, TILES.barrel, TILES.crate, TILES.concTop, TILES.concFill, TILES.brick]);
    this.layer.forEachTile((tile) => {
      if (tile.index === TILES.platform) tile.setCollision(false, false, true, false);
    });

    if (cfg.blackoutUntilCol) this.add.image(0, this.mapH - 2 * TILE - 120, 'house').setOrigin(0).setDepth(-5);

    for (const { ch, x, y } of deferred) {
      const px = x * TILE + TILE / 2;
      const bottom = (y + 1) * TILE;
      if (ch === 'S') start = { x: px, y: bottom };
      else if (ch === 'E' || ch === 'W') this.spawnGuard(px, bottom, ch === 'W');
      else if (ch === 'K') {
        const img = this.physics.add.staticImage(x * TILE, bottom, 'truck').setOrigin(0, 1).setDepth(5);
        img.refreshBody();
        (img.body as Phaser.Physics.Arcade.StaticBody).setSize(52, 22).setOffset(2, 4);
        this.trucks.push({ img, spawned: false });
      } else if (ch === 'G') bossAt = { x: px, y: bottom };
      else if (ch === 'n') {
        const v = Phaser.Math.Between(0, 3);
        const npc = this.add.sprite(px, bottom, `npc${v}`).setOrigin(0.5, 1).setDepth(4).setFlipX(Math.random() < 0.5);
        npc.anims.play(`npc${v}-bang`);
        this.npcs.push(npc);
      } else if (ch === 'R') this.add.image(px, bottom, 'fridge').setOrigin(0.5, 1).setDepth(3);
      else if (ch === 'F') {
        const passed = !!this.checkpoint && this.checkpoint.x >= px - 8;
        const img = this.add.image(x * TILE + 4, bottom, 'flag', passed ? 1 : 0).setOrigin(0, 1).setDepth(3);
        this.flags.push({ img, on: passed });
      } else if (ch === 'X') {
        this.exitX = px;
        this.add.image(px, bottom, 'exit').setOrigin(0.5, 1).setDepth(3);
      } else if (/[1-9]/.test(ch)) {
        this.triggers.push({ x: x * TILE, key: ch });
      } else if (PICKUPS[ch]) {
        const kind = PICKUPS[ch];
        const p = this.pickups.create(px, bottom - 8, 'items', ITEM_FRAMES[kind]) as Phaser.Physics.Arcade.Image;
        p.setData('kind', kind).setDepth(6);
        this.tweens.add({ targets: p, y: p.y - 3, duration: 500 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    return { start, bossAt };
  }

  private spawnGuard(x: number, bottom: number, whistle: boolean): Guard {
    const g = new Guard(this, x, bottom, whistle ? GUARD_TYPES.whistle : GUARD_TYPES.patrol, this.layer);
    this.guards.add(g);
    g.on('whistle', (w: Guard) => {
      // refuerzo que cae desde arriba, detrás del del silbato
      const side = w.x > this.hero.x ? 1 : -1;
      this.time.delayedCall(500, () => {
        if (this.ending) return;
        const r = this.spawnGuard(w.x + side * 36, w.y - 70, false);
        r.mode = 'chase';
      });
    });
    return g;
  }

  private setupBoss(): void {
    this.add.image(136, 32, 'hq').setOrigin(0).setDepth(-5);
    this.boss = new BossGuantanamo(this, { balconyX: 232, balconyY: 92, groundY: this.mapH - 2 * TILE, leftX: 44 }, this.papers);
    this.physics.add.overlap(this.hero, this.boss, () => {
      const boss = this.boss;
      if (!boss?.active) return;
      // al jefe no se le mata de un pisotón: rebota, y si está cansado le quita 1 de vida
      if (this.hero.isLandingOn(boss.body)) {
        this.hero.pogo();
        if (boss.mode === 'tired' && boss.takeHit(-this.time.now, 1)) this.addScore(50);
        return;
      }
      if (boss.harmful) this.hero.hurt(boss.x, 1, this.time.now);
    });
    this.boss.on('defeated', () => this.onBossDefeated());
  }

  private showBanner(): void {
    const box = this.add.container(GAME_W / 2, 60).setScrollFactor(0).setDepth(150);
    box.add(this.add.rectangle(0, 0, 240, 34, 0x000000, 0.7));
    box.add(txt(this, 0, -7, this.cfg.title, { origin: 0.5, color: '#f5d142' }));
    box.add(txt(this, 0, 7, this.cfg.subtitle, { origin: 0.5 }));
    this.tweens.add({ targets: box, alpha: 0, delay: 1800, duration: 500, onComplete: () => box.destroy() });
  }

  // ---------------------------------------------------------------- bucle

  update(time: number, delta: number): void {
    this.inp.update();
    const hero = this.hero;

    if (this.dialog.active) {
      this.dialog.update(this.inp, delta);
      hero.frozen = true;
      hero.update(time, delta);
      for (const g of this.guards.getChildren() as Guard[]) if (g.alive) g.body.velocity.x = 0;
      this.updateParallax();
      return;
    }
    hero.frozen = this.ending;

    if (this.inp.justDown('start') && !this.ending && !hero.dead) {
      this.scene.launch('Pause', { levelId: this.cfg.id });
      this.scene.pause();
      return;
    }

    hero.update(time, delta);
    this.checkTriggers();
    this.checkFlags();
    this.checkTrucks();

    for (const g of [...this.guards.getChildren()] as Guard[]) {
      if (!g.active) continue;
      g.update(time, hero);
      const pb = g.getPunchBox();
      if (pb && hit(pb, rect(hero.body))) hero.hurt(g.x, g.stats.damage, time);
      if (g.y > this.mapH + 40) g.destroy();
    }

    if (this.boss?.active && this.bossStarted) {
      this.boss.update(time, delta, hero);
      this.hud.setBoss(this.boss.hp / this.boss.maxHp);
    }

    this.resolveHeroAttack(time);

    if (!hero.dead && hero.y > this.mapH + 30) hero.die();
    if (!this.ending && !hero.dead && hero.x >= this.exitX) this.completeLevel();

    if (this.blackout && hero.x > (this.cfg.blackoutUntilCol ?? 0) * TILE) {
      const b = this.blackout;
      this.blackout = undefined;
      this.tweens.add({ targets: b, alpha: 0, duration: 800, onComplete: () => b.destroy() });
    }

    this.bangPots(time);
    this.updateParallax();
    this.hud.update(hero.health, this.registry.get('lives'), this.registry.get('score'), hero.shield);
  }

  private resolveHeroAttack(time: number): void {
    const hb = this.hero.getHitbox(time);
    if (!hb) return;
    for (const g of this.guards.getChildren() as Guard[]) {
      if (!g.active || !g.alive || !hit(hb.rect, rect(g.body))) continue;
      const before = g.hp;
      const defeated = g.takeHit(hb.id, hb.damage, this.hero.x, hb.knock, time);
      if (g.hp === before) continue;
      if (hb.kind === 'down') this.hero.pogo();
      if (defeated) {
        this.addScore(g.stats.points);
        floatText(this, g.x, g.y - 26, `${g.stats.points}`);
      } else this.addScore(10);
    }
    for (const p of [...this.papers.getChildren()] as Phaser.Physics.Arcade.Image[]) {
      if (p.active && hit(hb.rect, rect(p.body as Phaser.Physics.Arcade.Body))) {
        this.popPaper(p);
        this.addScore(10);
      }
    }
    if (this.boss?.active && this.boss.body.enable && hit(hb.rect, rect(this.boss.body))) {
      if (this.boss.takeHit(hb.id, hb.damage)) {
        this.addScore(50);
        if (hb.kind === 'down') this.hero.pogo();
      }
    }
  }

  private checkTriggers(): void {
    for (const tr of this.triggers) {
      if (this.triggered.has(tr.key) || this.hero.x < tr.x || this.hero.dead) continue;
      this.triggered.add(tr.key);
      const lines = this.cfg.dialogs[tr.key];
      const onDone = this.boss && !this.bossStarted && tr.key === '1' ? () => this.startBoss() : undefined;
      if (lines) this.dialog.open(lines, onDone);
      else onDone?.();
      return;
    }
    // si se reaparece en el jefe con el diálogo ya visto, el combate arranca solo
    if (this.boss && !this.bossStarted && this.triggered.has('1') && !this.dialog.active) this.startBoss();
  }

  private startBoss(): void {
    if (this.bossStarted || !this.boss) return;
    this.bossStarted = true;
    this.hud.showBoss(t('bossName'));
    playMusic('boss');
    this.boss.start(this.time.now);
  }

  private checkFlags(): void {
    for (const f of this.flags) {
      if (f.on || Math.abs(this.hero.x - (f.img.x + 4)) > 10) continue;
      f.on = true;
      f.img.setFrame(1);
      sfx('checkpoint');
      floatText(this, f.img.x + 6, f.img.y - 40, t('checkpoint'), '#f5d142');
      this.checkpoint = { x: f.img.x + 8, y: f.img.y };
    }
  }

  private checkTrucks(): void {
    for (const tr of this.trucks) {
      if (tr.spawned || Math.abs(this.hero.x - (tr.img.x + 28)) > 150) continue;
      tr.spawned = true;
      // el guardia salta de la parte de atrás de la lona
      const g = this.spawnGuard(tr.img.x + 6, tr.img.y - 30, false);
      g.body.velocity.set(-50, -180);
      g.mode = 'chase';
      sfx('whistle');
    }
  }

  private collect(p: Phaser.Physics.Arcade.Image): void {
    const kind = p.getData('kind') as PickupKind;
    const h = this.hero;
    switch (kind) {
      case 'cafe': h.heal(2); floatText(this, p.x, p.y - 10, t('cafe'), '#f5d142'); sfx('pickup'); break;
      case 'colada': h.heal(99); floatText(this, p.x, p.y - 10, t('colada'), '#f5d142'); sfx('pickup'); break;
      case 'cazuela': h.shield = true; floatText(this, p.x, p.y - 10, t('cazuela'), '#c4c4cc'); sfx('pickup'); break;
      case 'croqueta':
        this.registry.set('lives', this.registry.get('lives') + 1);
        floatText(this, p.x, p.y - 10, t('croqueta'), '#7bd389');
        sfx('checkpoint');
        break;
      case 'coin': this.addScore(50); sfx('coin'); break;
    }
    if (kind !== 'coin') this.addScore(100);
    p.destroy();
  }

  private popPaper(p: Phaser.Physics.Arcade.Image): void {
    if (!p.active) return;
    puff(this, p.x, p.y, 5);
    sfx('paper');
    p.destroy();
  }

  private addScore(n: number): void {
    this.registry.set('score', this.registry.get('score') + n);
  }

  private bangPots(time: number): void {
    if (time < this.nextPot || this.npcs.length === 0) return;
    this.nextPot = time + 350;
    const view = this.cameras.main.worldView;
    if (this.npcs.some((n) => view.contains(n.x, n.y - 4)) && Math.random() < 0.6) sfx('pot');
  }

  private updateParallax(): void {
    const sx = this.cameras.main.scrollX;
    const t = this.time.now / 1000;
    for (const { obj, f, drift } of this.parallax) obj.tilePositionX = Math.round(sx * f + (drift ?? 0) * t);
  }

  // ---------------------------------------------------------------- fin de nivel / muerte

  private onHeroDead(): void {
    stopMusic();
    this.time.delayedCall(1700, () => {
      const lives = this.registry.get('lives') - 1;
      this.registry.set('lives', lives);
      if (lives > 0) {
        this.scene.restart({ levelId: this.cfg.id, checkpoint: this.checkpoint, triggered: [...this.triggered] } satisfies LevelData);
      } else {
        this.scene.start('GameOver', { levelId: this.cfg.id });
      }
    });
  }

  private completeLevel(): void {
    this.ending = true;
    this.hero.body.velocity.x = 0;
    sfx('clear');
    stopMusic();
    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { levelId: this.cfg.next! } satisfies LevelData));
    });
  }

  private onBossDefeated(): void {
    this.ending = true;
    this.hud.hideBoss();
    this.addScore(5000);
    stopMusic();
    sfx('clear');
    liberate(this.cfg.province, this.registry.get('score'));
    for (const p of this.papers.getChildren() as Phaser.Physics.Arcade.Image[]) puff(this, p.x, p.y, 4);
    this.papers.clear(true, true);
    const banner = txt(this, GAME_W / 2, 70, t('provinceLiberated'), { size: 16, origin: 0.5, color: '#f5d142', stroke: true })
      .setScrollFactor(0).setDepth(150).setScale(0);
    this.tweens.add({ targets: banner, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.time.delayedCall(2800, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LevelClear', { province: this.cfg.province }));
    });
  }

  /** Usado por la pantalla de pausa. */
  restartFromStart(): void {
    this.scene.restart({ levelId: this.data0.levelId } satisfies LevelData);
  }
}
