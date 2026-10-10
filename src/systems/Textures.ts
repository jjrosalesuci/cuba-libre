import Phaser from 'phaser';
import { PAL, TILE, GAME_W, GAME_H } from '../config';

/**
 * Placeholders de pixel art dibujados por código. Cada textura tiene el
 * tamaño, la orientación (mirando a la derecha) y el orden de frames que
 * deben respetar los sprites finales generados con IA (ver tools/pixelize.py),
 * así que reemplazarlos es solo cambiar el loader.
 */

type Px = (c: string, x: number, y: number, w?: number, h?: number) => void;
interface Painter { r: Px; line: (c: string, x0: number, y0: number, x1: number, y1: number) => void; ctx: CanvasRenderingContext2D; ox: number }

function painter(ctx: CanvasRenderingContext2D, ox: number, oy = 0): Painter {
  const r: Px = (c, x, y, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, w, h);
  };
  const line = (c: string, x0: number, y0: number, x1: number, y1: number) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      r(c, x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  return { r, line, ctx, ox };
}

function sheet(scene: Phaser.Scene, key: string, fw: number, fh: number, draws: Array<(p: Painter) => void>): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, fw * draws.length, fh)!;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draws.forEach((d, i) => d(painter(ctx, i * fw)));
  draws.forEach((_, i) => tex.add(i, 0, i * fw, 0, fw, fh));
  tex.refresh();
}

function single(scene: Phaser.Scene, key: string, w: number, h: number, draw: (p: Painter) => void): void {
  sheet(scene, key, w, h, [draw]);
}

// ------------------------------------------------------------------ héroe

type Legs = 'stand' | 'runA' | 'runB' | 'runC' | 'jump' | 'hurt';
type Stick = 'rest' | 'up' | 'fwd' | 'down';

function drawHero(p: Painter, legs: Legs, stick: Stick, hurt = false): void {
  const { r, line } = p;
  // piernas y chancletas
  const leg = (x: number, y: number, h: number, fx: number, fy: number) => {
    r(PAL.skin, x, y, 2, h);
    r(PAL.flip, fx, fy, 3, 1);
  };
  switch (legs) {
    case 'stand': leg(9, 18, 5, 8, 23); leg(13, 18, 5, 13, 23); break;
    case 'runA': leg(13, 18, 3, 14, 23); r(PAL.skin, 14, 21, 2, 2); leg(9, 18, 2, 6, 22); r(PAL.skin, 7, 20, 2, 2); break;
    case 'runB': leg(10, 18, 5, 10, 23); leg(12, 18, 4, 12, 22); break;
    case 'runC': leg(9, 18, 3, 9, 23); r(PAL.skin, 9, 21, 2, 2); leg(13, 18, 2, 15, 21); r(PAL.skin, 15, 19, 2, 2); break;
    case 'jump': leg(9, 18, 2, 10, 22); r(PAL.skin, 10, 20, 2, 2); leg(13, 18, 3, 14, 21); break;
    case 'hurt': leg(8, 18, 4, 6, 22); leg(14, 18, 4, 15, 22); break;
  }
  // short
  r(PAL.shorts, 8, 15, 8, 3);
  r(PAL.shortsDark, 11, 16, 2, 2);
  // brazo de atrás
  r(PAL.skinDark, 7, 10, 1, 4);
  // camiseta
  r(PAL.tank, 8, 9, 8, 6);
  r(PAL.tankShade, 8, 14, 8, 1);
  r(PAL.skin, 8, 9, 1, 1);
  r(PAL.skin, 15, 9, 1, 1);
  // cuello y cara
  r(PAL.skin, 10, 8, 3, 1);
  r(PAL.skin, 9, 3, 6, 5);
  r(PAL.skinDark, 9, 4, 1, 2);
  if (hurt) {
    r(PAL.black, 12, 4); r(PAL.black, 14, 4); r(PAL.black, 13, 5); r(PAL.black, 12, 6); r(PAL.black, 14, 6);
  } else {
    r(PAL.black, 13, 4, 1, 2);
    r(PAL.skinDark, 13, 7, 2, 1);
  }
  // pelo rizo
  r(PAL.hair, 8, 1, 8, 2);
  r(PAL.hair, 9, 0, 2, 1); r(PAL.hair, 12, 0, 2, 1);
  r(PAL.hair, 7, 2, 2, 3);
  r(PAL.hair, 15, 2, 1, 1);
  r(PAL.hair, 8, 3, 1, 1);
  // brazo de alante + palo
  switch (stick) {
    case 'rest':
      r(PAL.skin, 15, 10, 1, 4); r(PAL.skin, 16, 13);
      line(PAL.stick, 16, 14, 21, 4); line(PAL.stickDark, 17, 14, 22, 4);
      break;
    case 'up':
      r(PAL.skin, 15, 6, 1, 4); r(PAL.skin, 15, 5);
      line(PAL.stick, 15, 5, 8, 0); line(PAL.stickDark, 16, 5, 9, 0);
      break;
    case 'fwd':
      r(PAL.skin, 15, 11, 3, 1);
      r(PAL.stick, 18, 10, 6, 1); r(PAL.stickDark, 18, 11, 6, 1);
      break;
    case 'down':
      r(PAL.skin, 15, 12, 1, 3);
      r(PAL.stick, 15, 15, 1, 9); r(PAL.stickDark, 16, 15, 1, 9);
      break;
  }
}

export const HERO_FRAMES = {
  idle: 0, runA: 1, runB: 2, runC: 3, jump: 4, windup: 5, swing: 6, airSwing: 7, down: 8, hurt: 9,
} as const;

// ------------------------------------------------------------------ guardias

type GuardPose = 'walkA' | 'walkB' | 'windup' | 'punch' | 'hurt';

function drawGuard(p: Painter, pose: GuardPose, whistle: boolean): void {
  const { r } = p;
  const legsA = pose === 'walkA';
  // botas y pantalón
  if (pose === 'walkB') {
    r(PAL.oliveDark, 9, 16, 3, 5); r(PAL.oliveDark, 12, 16, 3, 5);
    r(PAL.boot, 8, 21, 4, 3); r(PAL.boot, 13, 21, 4, 3);
  } else if (legsA || pose === 'windup' || pose === 'punch') {
    r(PAL.oliveDark, 8, 16, 3, 5); r(PAL.oliveDark, 13, 16, 3, 5);
    r(PAL.boot, 7, 21, 4, 3); r(PAL.boot, 13, 21, 4, 3);
  } else {
    r(PAL.oliveDark, 7, 16, 3, 4); r(PAL.oliveDark, 14, 16, 3, 4);
    r(PAL.boot, 6, 20, 4, 3); r(PAL.boot, 15, 20, 4, 3);
  }
  // camisa
  r(PAL.olive, 8, 8, 8, 8);
  r(PAL.oliveLight, 9, 9, 2, 2);
  r(PAL.boot, 8, 14, 8, 1);
  r(PAL.yellow, 12, 14);
  // brazo
  switch (pose) {
    case 'windup': r(PAL.olive, 5, 9, 3, 2); r(PAL.skinLight, 4, 9, 1, 2); break;
    case 'punch': r(PAL.olive, 16, 10, 4, 2); r(PAL.skinLight, 20, 9, 2, 3); break;
    case 'hurt': r(PAL.olive, 16, 6, 2, 3); r(PAL.skinLight, 17, 5, 1, 1); r(PAL.olive, 6, 6, 2, 3); break;
    default: r(PAL.olive, 15, 9, 2, 5); r(PAL.skinLight, 15, 14, 2, 1);
  }
  // cara
  r(PAL.skinLight, 9, 2, 6, 6);
  r(PAL.skinDark, 9, 4, 1, 2);
  if (pose === 'hurt') {
    r(PAL.black, 12, 4); r(PAL.black, 14, 4);
    r(PAL.redDark, 12, 6, 2, 1);
  } else {
    r(PAL.black, 13, 4, 1, 1);
    r(PAL.hair, 12, 6, 3, 1); // bigote
  }
  // gorra
  r(PAL.oliveDark, 8, 0, 7, 3);
  r(PAL.olive, 9, 0, 5, 1);
  r(PAL.oliveDark, 14, 2, 3, 1);
  if (whistle) {
    r(PAL.red, 8, 2, 7, 1);
    r(PAL.yellow, 15, 6, 2, 1);
  }
}

export const GUARD_FRAMES = { walkA: 0, walkB: 1, windup: 2, punch: 3, hurt: 4 } as const;

// ------------------------------------------------------------------ jefe

type BossPose = 'idle' | 'idle2' | 'throw' | 'charge' | 'tired';

function drawBoss(p: Painter, pose: BossPose): void {
  const { r } = p;
  const dy = pose === 'idle2' ? 1 : 0;
  // zapatos y pantalón
  r(PAL.boot, 10, 45, 8, 3); r(PAL.boot, 22, 45, 8, 3);
  r(PAL.grayDark, 11, 39, 7, 6); r(PAL.grayDark, 22, 39, 7, 6);
  // guayabera (barriga)
  r(PAL.white, 11, 14 + dy, 18, 4);
  r(PAL.white, 8, 18 + dy, 24, 17);
  r(PAL.white, 10, 35, 20, 4);
  for (const x of [12, 16, 23, 27]) r(PAL.grayLight, x, 16 + dy, 1, 20);
  r(PAL.grayLight, 20, 15 + dy, 1, 23);
  for (const y of [20, 25, 30, 35]) r(PAL.gray, 19, y + dy, 1, 1);
  r(PAL.grayLight, 10, 30, 6, 4); r(PAL.grayLight, 24, 30, 6, 4);
  // brazos
  if (pose === 'throw') {
    r(PAL.white, 30, 6, 4, 10); r(PAL.skinLight, 30, 3, 4, 3);
    r(PAL.white, 4, 18, 4, 10); r(PAL.skinLight, 4, 28, 4, 3);
  } else if (pose === 'charge') {
    r(PAL.white, 30, 20, 8, 4); r(PAL.skinLight, 37, 20, 3, 4);
    r(PAL.white, 2, 20, 6, 4); r(PAL.skinLight, 0, 20, 2, 4);
  } else if (pose === 'tired') {
    r(PAL.white, 32, 22, 4, 12); r(PAL.skinLight, 32, 34, 4, 3);
    r(PAL.white, 4, 22, 4, 12); r(PAL.skinLight, 4, 34, 4, 3);
  } else {
    r(PAL.white, 32, 18 + dy, 4, 12); r(PAL.skinLight, 32, 30 + dy, 4, 3);
    r(PAL.white, 4, 18 + dy, 4, 12); r(PAL.skinLight, 4, 30 + dy, 4, 3);
  }
  // cabeza
  const hy = pose === 'tired' ? 3 : dy;
  r(PAL.skinLight, 13, 1 + hy, 14, 13);
  r(PAL.skinLight, 14, 0 + hy, 12, 1);
  r(PAL.grayLight, 12, 3 + hy, 2, 6); r(PAL.grayLight, 26, 3 + hy, 2, 5);
  r(PAL.red, 15, 8 + hy, 2, 2); r(PAL.red, 24, 8 + hy, 2, 2); // cachetes
  if (pose === 'tired') {
    r(PAL.black, 18, 6 + hy, 2, 1); r(PAL.black, 23, 6 + hy, 2, 1);
    r(PAL.red, 21, 11 + hy, 2, 3); // lengua afuera
  } else {
    r(PAL.black, 19, 5 + hy, 1, 2); r(PAL.black, 23, 5 + hy, 1, 2);
    r(PAL.black, 18, 4 + hy, 2, 1); r(PAL.black, 22, 4 + hy, 2, 1); // cejas
    r(PAL.grayLight, 19, 9 + hy, 6, 1); // bigote
    // tabaco
    r(PAL.cigar, 24, 10 + hy, 6, 2); r(PAL.ember, 30, 10 + hy, 1, 2);
    r(PAL.grayLight, 31, 7 + hy); r(PAL.grayLight, 32, 5 + hy); r(PAL.grayLight, 31, 3 + hy);
  }
  // sudor
  r(PAL.sweat, 11, 4 + hy, 1, 2); r(PAL.sweat, 28, 9 + hy, 1, 2);
  if (pose !== 'idle') r(PAL.sweat, 12, 10 + hy, 1, 2);
}

export const BOSS_FRAMES = { idle: 0, idle2: 1, throw: 2, charge: 3, tired: 4 } as const;

// ------------------------------------------------------------------ vecinos

function drawNeighbor(p: Painter, shirt: string, hair: string, up: boolean): void {
  const { r } = p;
  r(PAL.skin, 9, 17, 2, 6); r(PAL.skin, 13, 17, 2, 6);
  r(PAL.flip, 8, 23, 3, 1); r(PAL.flip, 13, 23, 3, 1);
  r(PAL.grayDark, 8, 15, 8, 3);
  r(shirt, 8, 8, 8, 8);
  r(PAL.skin, 10, 7, 3, 1);
  r(PAL.skin, 9, 2, 6, 5);
  r(PAL.black, 13, 4);
  r(hair, 8, 0, 7, 2); r(hair, 8, 2, 1, 3);
  // cazuela y cuchara
  if (up) {
    r(PAL.skin, 15, 3, 1, 5); r(PAL.skin, 7, 3, 1, 5);
    r(PAL.gray, 5, 0, 5, 3); r(PAL.grayLight, 5, 0, 5, 1);
    r(PAL.grayLight, 16, 0, 1, 4);
  } else {
    r(PAL.skin, 15, 8, 1, 5); r(PAL.skin, 7, 8, 1, 5);
    r(PAL.gray, 4, 12, 5, 3); r(PAL.grayLight, 4, 12, 5, 1);
    r(PAL.grayLight, 16, 9, 2, 1);
  }
}

// ------------------------------------------------------------------ ítems

export const ITEM_FRAMES = { cafe: 0, colada: 1, cazuela: 2, croqueta: 3, coin: 4, paper: 5, star: 6 } as const;

function drawItems(scene: Phaser.Scene): void {
  sheet(scene, 'items', 12, 12, [
    // café cubano
    ({ r }) => {
      r(PAL.grayLight, 4, 0); r(PAL.grayLight, 6, 1); r(PAL.grayLight, 5, 2);
      r(PAL.white, 2, 4, 7, 6); r(PAL.brown, 3, 4, 5, 1); r(PAL.white, 9, 5, 2, 3); r(PAL.grayLight, 1, 10, 9, 1);
    },
    // colada (termo)
    ({ r }) => {
      r(PAL.red, 3, 2, 6, 9); r(PAL.redDark, 3, 9, 6, 2); r(PAL.grayLight, 4, 0, 4, 2); r(PAL.white, 4, 4, 1, 4);
    },
    // cazuela
    ({ r }) => {
      r(PAL.gray, 1, 4, 10, 6); r(PAL.grayLight, 1, 4, 10, 1); r(PAL.grayDark, 0, 5, 1, 2); r(PAL.grayDark, 11, 5, 1, 2);
      r(PAL.grayLight, 2, 6, 1, 3);
    },
    // pan con croqueta
    ({ r }) => {
      r(PAL.dirt, 1, 3, 10, 3); r(PAL.ember, 2, 6, 8, 2); r(PAL.dirt, 1, 8, 10, 2); r(PAL.yellow, 3, 4, 2, 1);
    },
    // moneda
    ({ r }) => {
      r(PAL.yellow, 3, 1, 6, 10); r(PAL.yellow, 2, 2, 8, 8); r(PAL.ember, 5, 3, 2, 6); r(PAL.white, 3, 3, 1, 2);
    },
    // papeles "DISCURSOS"
    ({ r }) => {
      r(PAL.white, 1, 2, 10, 8); r(PAL.grayLight, 2, 1, 9, 1);
      for (const y of [4, 6, 8]) r(PAL.gray, 2, y, 8, 1);
      r(PAL.red, 2, 3, 3, 1);
    },
    // estrella (mareo)
    ({ r }) => {
      r(PAL.yellow, 5, 1, 2, 10); r(PAL.yellow, 1, 5, 10, 2); r(PAL.yellow, 3, 3, 6, 6);
    },
  ]);
}

// ------------------------------------------------------------------ tiles

/** Índices del tileset. -1 = vacío. */
export const TILES = {
  dirtTop: 0, dirtFill: 1, platform: 2, barrel: 3, crate: 4, concTop: 5, concFill: 6, brick: 7,
} as const;

function drawTiles(scene: Phaser.Scene): void {
  const S = TILE;
  sheet(scene, 'tiles', S, S, [
    ({ r }) => { r(PAL.dirt, 0, 0, S, S); r(PAL.grass, 0, 0, S, 4); r(PAL.grassDark, 0, 4, S, 1); r(PAL.grass, 3, 4, 2, 1); r(PAL.dirtDark, 4, 9, 2, 2); r(PAL.dirtDark, 11, 12, 2, 1); },
    ({ r }) => { r(PAL.dirt, 0, 0, S, S); r(PAL.dirtDark, 2, 3, 2, 2); r(PAL.dirtDark, 10, 7, 3, 2); r(PAL.dirtDark, 5, 12, 2, 2); },
    ({ r }) => { r(PAL.brown, 0, 0, S, 4); r(PAL.stick, 0, 0, S, 1); r(PAL.stickDark, 0, 4, S, 1); r(PAL.stickDark, 2, 5, 1, 3); r(PAL.stickDark, 13, 5, 1, 3); },
    ({ r }) => { r(PAL.olive, 1, 0, 14, S); r(PAL.oliveDark, 1, 3, 14, 2); r(PAL.oliveDark, 1, 11, 14, 2); r(PAL.oliveLight, 3, 0, 2, S); r(PAL.oliveDark, 0, 0, 1, S); r(PAL.oliveDark, 15, 0, 1, S); },
    ({ r }) => { r(PAL.brown, 0, 0, S, S); r(PAL.stick, 1, 1, 14, 14); r(PAL.brown, 1, 7, 14, 2); r(PAL.stickDark, 0, 0, S, 1); r(PAL.stickDark, 0, 15, S, 1); },
    ({ r }) => { r(PAL.concrete, 0, 0, S, S); r(PAL.grayLight, 0, 0, S, 2); r(PAL.concreteDark, 0, 2, S, 1); r(PAL.concreteDark, 7, 3, 1, 13); },
    ({ r }) => { r(PAL.concrete, 0, 0, S, S); r(PAL.concreteDark, 3, 4, 2, 1); r(PAL.concreteDark, 10, 10, 3, 1); r(PAL.concreteDark, 7, 0, 1, S); },
    ({ r }) => { r('#b5523b', 0, 0, S, S); for (const y of [3, 7, 11, 15]) r('#7d3426', 0, y, S, 1); r('#7d3426', 4, 0, 1, 3); r('#7d3426', 12, 4, 1, 3); r('#7d3426', 4, 8, 1, 3); r('#7d3426', 12, 12, 1, 3); },
  ]);
}

// ------------------------------------------------------------------ escenografía

function drawProps(scene: Phaser.Scene): void {
  // bandera cubana en asta (frame 0 bajada, 1 izada)
  const cubanFlag = (r: Px, x: number, y: number) => {
    for (let i = 0; i < 5; i++) r(i % 2 === 0 ? PAL.blue : PAL.white, x, y + i * 2, 14, 2);
    for (let i = 0; i < 5; i++) r(PAL.red, x, y + i, 5 - Math.abs(2 - i) * 2 + 2, 1);
    r(PAL.red, x, y + 5, 3, 3); r(PAL.red, x, y + 8, 2, 1);
    r(PAL.white, x + 1, y + 4, 1, 1);
  };
  sheet(scene, 'flag', 16, 32, [
    ({ r }) => { r(PAL.grayLight, 1, 0, 1, 32); r(PAL.gray, 2, 22, 10, 7); r(PAL.grayDark, 2, 22, 10, 1); },
    ({ r }) => { r(PAL.grayLight, 1, 0, 1, 32); cubanFlag(r, 2, 1); },
  ]);
  single(scene, 'exit', 16, 24, ({ r }) => {
    r(PAL.brown, 7, 8, 2, 16);
    r(PAL.yellow, 0, 0, 16, 9); r(PAL.black, 0, 0, 16, 1); r(PAL.black, 0, 8, 16, 1);
    r(PAL.black, 3, 4, 8, 1); r(PAL.black, 9, 2, 1, 5); r(PAL.black, 10, 3, 1, 3); r(PAL.black, 11, 4, 1, 1);
  });
  // camión soviético 56x32
  single(scene, 'truck', 56, 32, ({ r }) => {
    r(PAL.oliveDark, 0, 4, 38, 20); r(PAL.olive, 1, 5, 36, 3); // lona
    for (const x of [8, 18, 28]) r(PAL.oliveDark, x, 5, 1, 18);
    r(PAL.olive, 38, 10, 16, 14); r(PAL.oliveDark, 38, 10, 16, 1);
    r('#9fd3e6', 42, 12, 8, 5); r(PAL.oliveLight, 52, 18, 3, 3);
    r(PAL.boot, 0, 22, 56, 3);
    for (const x of [6, 22, 44]) { r(PAL.boot, x, 22, 10, 10); r(PAL.grayDark, x + 3, 25, 4, 4); }
    r(PAL.red, 44, 7, 3, 3); // estrella roja
  });
  single(scene, 'fridge', 16, 26, ({ r }) => {
    r(PAL.grayLight, 0, 0, 12, 26); r(PAL.white, 1, 1, 10, 24); r(PAL.gray, 1, 9, 10, 1);
    r(PAL.gray, 10, 3, 1, 4); r(PAL.gray, 10, 12, 1, 5);
    // puerta abierta, vacío
    r('#30343c', 12, 1, 4, 24); r(PAL.grayLight, 12, 0, 4, 1);
  });
  // bohío por dentro (fondo de la escena del despertar)
  single(scene, 'house', 224, 120, ({ r }) => {
    // paredes de tabla de palma
    r('#8a6a42', 0, 0, 224, 120);
    for (let x = 0; x < 224; x += 7) r('#6e5232', x, 0, 1, 120);
    for (let x = 3; x < 224; x += 14) r('#9c7a4e', x, 20, 2, 100);
    // techo de guano visto desde adentro, con vigas de madera
    r('#b08a4a', 0, 0, 224, 16);
    for (let x = 0; x < 224; x += 3) r('#8f6b32', x, 0, 1, 12 + ((x * 7) % 5));
    r('#5c3a1a', 0, 16, 224, 3);
    for (const x of [30, 110, 190]) r('#5c3a1a', x, 0, 4, 19);
    // ventana con postigo abierto: afuera es de día
    r('#5aa0e0', 40, 34, 28, 22); r('#ffffff', 46, 40, 10, 3); r('#ffffff', 49, 38, 5, 2);
    r('#4c8a3a', 40, 50, 28, 6); // monte afuera
    r('#5c3a1a', 38, 32, 32, 2); r('#5c3a1a', 38, 56, 32, 2); r('#5c3a1a', 38, 32, 2, 26); r('#5c3a1a', 68, 32, 2, 26);
    r('#6b4a2b', 70, 34, 10, 22); // postigo
    // bombillo apagado colgando de la viga
    r(PAL.grayDark, 112, 19, 1, 14); r(PAL.gray, 109, 33, 7, 6); r(PAL.grayLight, 110, 34, 2, 2);
    // puerta de tablas
    r('#6b4423', 196, 50, 22, 70); r('#4a2f18', 198, 52, 18, 66);
    for (const y of [60, 84, 108]) r('#6b4423', 198, y, 18, 2);
    // almanaque viejo, sombrero de yarey colgado y un machete
    r(PAL.white, 150, 40, 16, 20); r(PAL.red, 150, 40, 16, 5);
    r('#e0c47a', 128, 44, 14, 3); r('#d4b060', 131, 40, 8, 4);
    r(PAL.grayLight, 176, 46, 2, 18); r('#3a2814', 176, 64, 2, 5);
  });
  // sede provincial del PCC (fondo del jefe) 176x128
  single(scene, 'hq', 176, 128, ({ r }) => {
    r('#d9c9a3', 0, 16, 176, 112); r('#bba983', 0, 16, 176, 3);
    r('#a8946c', 0, 64, 176, 4); // entrepiso
    r('#c2b08a', 0, 0, 176, 16); r('#8f7d58', 0, 14, 176, 2);
    // ventanas
    for (const x of [12, 44, 108, 140]) { r('#3a4a5c', x, 26, 20, 26); r('#5c7088', x + 2, 28, 4, 22); r('#3a4a5c', x, 80, 20, 30); }
    // balcón del 2do piso donde se para el jefe
    r(PAL.grayDark, 66, 60, 60, 4); for (let x = 68; x < 126; x += 6) r(PAL.grayDark, x, 50, 2, 10); r(PAL.grayDark, 66, 48, 60, 2);
    // banderola roja
    r(PAL.red, 30, 2, 116, 11); r(PAL.redDark, 30, 12, 116, 1);
    for (let x = 36; x < 140; x += 8) r(PAL.yellow, x, 6, 4, 3);
    // puerta grande
    r('#5a3a20', 72, 84, 32, 44); r('#3e2814', 87, 84, 2, 44);
  });
  // estrellitas del cielo y "puf"
  single(scene, 'puff', 4, 4, ({ r }) => { r(PAL.white, 1, 0, 2, 4); r(PAL.white, 0, 1, 4, 2); });
  single(scene, 'pixel', 1, 1, ({ r }) => r('#ffffff', 0, 0));
  sheet(scene, 'heart', 8, 8, [
    ({ r }) => { r(PAL.red, 1, 1, 2, 1); r(PAL.red, 5, 1, 2, 1); r(PAL.red, 0, 2, 8, 2); r(PAL.red, 1, 4, 6, 1); r(PAL.red, 2, 5, 4, 1); r(PAL.red, 3, 6, 2, 1); r(PAL.white, 1, 2); },
    ({ r }) => { r(PAL.grayDark, 1, 1, 2, 1); r(PAL.grayDark, 5, 1, 2, 1); r(PAL.grayDark, 0, 2, 8, 2); r(PAL.grayDark, 1, 4, 6, 1); r(PAL.grayDark, 2, 5, 4, 1); r(PAL.grayDark, 3, 6, 2, 1); },
  ]);
  single(scene, 'head', 8, 8, ({ r }) => { r(PAL.skin, 1, 2, 6, 6); r(PAL.hair, 0, 0, 8, 3); r(PAL.black, 5, 4); });
}

// ------------------------------------------------------------------ fondos

function gradient(scene: Phaser.Scene, key: string, stops: [number, string][]): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, GAME_W, GAME_H)!;
  const ctx = tex.getContext();
  // degradado por bandas (look 16-bit, sin suavizado)
  const bands = 12;
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  const img = ctx.getImageData(0, 0, 1, GAME_H).data;
  for (let b = 0; b < bands; b++) {
    const y0 = Math.floor((b * GAME_H) / bands);
    const y1 = Math.floor(((b + 1) * GAME_H) / bands);
    const i = y0 * 4;
    ctx.fillStyle = `rgb(${img[i]},${img[i + 1]},${img[i + 2]})`;
    ctx.fillRect(0, y0, GAME_W, y1 - y0);
  }
  tex.refresh();
}

/** Silueta periódica (tileable en 320px) a partir de una suma de senos. */
function ridge(x: number, terms: [number, number, number][]): number {
  return terms.reduce((s, [amp, freq, phase]) => s + amp * Math.sin((x / GAME_W) * Math.PI * 2 * freq + phase), 0);
}

function drawBackgrounds(scene: Phaser.Scene): void {
  gradient(scene, 'sky-night', [[0, '#05061a'], [0.6, '#1b1f4a'], [1, '#3b2a5a']]);
  gradient(scene, 'sky-dawn', [[0, '#2b2d6e'], [0.45, '#c2577a'], [0.8, '#f2a65a'], [1, '#ffe08a']]);
  gradient(scene, 'sky-day', [[0, '#3f7fd9'], [0.7, '#8ec5f0'], [1, '#d8f0ff']]);
  gradient(scene, 'sky-dusk', [[0, '#3a2a6e'], [0.5, '#d9604a'], [1, '#f7c56a']]);

  // lomas de la Sierra: verde claro al fondo, verde oscuro delante
  single(scene, 'bg-mountains', GAME_W, 90, ({ r }) => {
    for (let x = 0; x < GAME_W; x++) {
      const far = Math.round(36 + ridge(x, [[14, 2, 0.3], [7, 5, 1.1], [3, 11, 2]]));
      r('#9fd67a', x, far, 1, 2); // borde iluminado
      r('#7cc25e', x, far + 2, 1, 90);
      r('#68ad4f', x, far + 14 + Math.round(ridge(x, [[3, 9, 0.5]])), 1, 90);
      const near = Math.round(56 + ridge(x, [[10, 3, 2.2], [5, 7, 0.4], [2, 17, 1]]));
      r('#3f8f3a', x, near, 1, 2);
      r('#2e7a2f', x, near + 2, 1, 90);
      r('#226326', x, near + 10 + Math.round(ridge(x, [[2, 13, 1.7]])), 1, 90);
    }
  });

  // nubes blancas (tileable): bolas apiladas con sombra azulada abajo
  single(scene, 'bg-clouds', GAME_W, 70, ({ r }) => {
    const blob = (cx: number, cy: number, rad: number, c: string) => {
      for (let dy = -rad; dy <= rad; dy++) {
        const half = Math.round(Math.sqrt(rad * rad - dy * dy));
        for (let dx = -half; dx <= half; dx++) r(c, ((cx + dx) % GAME_W + GAME_W) % GAME_W, cy + dy);
      }
    };
    const cloud = (x: number, y: number, s: number) => {
      const parts: [number, number, number][] = [[0, 2, 6], [8, -2, 8], [18, 0, 7], [26, 3, 5], [12, 4, 6]];
      for (const [dx, dy, rad] of parts) blob(x + dx * s, y + dy * s + 2, Math.round(rad * s), '#c7dcf0');
      for (const [dx, dy, rad] of parts) blob(x + dx * s, y + dy * s, Math.round(rad * s), '#ffffff');
      r('#c7dcf0', x - Math.round(5 * s), y + Math.round(8 * s), Math.round(36 * s), 2);
    };
    cloud(20, 18, 1); cloud(120, 40, 0.7); cloud(190, 14, 1.2); cloud(280, 46, 0.6);
  });

  const palm = (r: Px, x: number, base: number) => {
    for (let i = 0; i < 26; i++) r('#6b4a2b', x + Math.round(Math.sin(i / 8) * 2), base - i, 2, 1);
    const top = base - 26;
    for (const [dx, dy] of [[-8, 2], [-5, 0], [-2, -2], [2, -2], [5, 0], [8, 2], [-6, 4], [6, 4]]) {
      r('#1f6b2a', x + dx - 1, top + dy, 4, 2);
    }
    r('#2e8a3a', x - 2, top - 1, 6, 3);
  };

  single(scene, 'bg-town', GAME_W, 70, ({ r }) => {
    const colors = ['#e8b04a', '#5fb3a1', '#e27d60', '#c38bd1', '#f1e3a0', '#7fb0e0'];
    let x = 0, i = 0;
    while (x < GAME_W) {
      const w = 34 + ((i * 13) % 20);
      const h = 26 + ((i * 7) % 16);
      const c = colors[i % colors.length];
      r(c, x, 70 - h, w - 2, h);
      r('#00000033', x, 70 - h, w - 2, 3);
      r('#8f3d2a', x - 1, 70 - h - 3, w, 3); // techo
      r('#3a2a20', x + 4, 70 - 14, 8, 14); // puerta
      r('#2a3a4a', x + w - 14, 70 - h + 8, 8, 8); // ventana
      x += w;
      i++;
    }
    palm(r, 30, 70); palm(r, 140, 70); palm(r, 250, 70);
  });

  // Cuba rural: bohíos con techo de guano, palmas reales, matas de plátano y cercas de palo
  const royalPalm = (r: Px, x: number, base: number, h: number) => {
    for (let i = 0; i < h; i++) {
      const bend = Math.round(Math.sin(i / 14) * 1.5);
      r('#c9c2b0', x + bend, base - i, 2, 1); // tronco liso y claro
      r('#9d9682', x + bend + 2, base - i, 1, 1);
    }
    const top = base - h;
    r('#5aa83e', x - 1, top, 4, 6); // yagua verde
    for (const [dx, dy, len] of [[-1, -1, 9], [1, -1, 9], [-1, 1, 8], [1, 1, 8], [0, -1, 6]]) {
      for (let k = 0; k < len; k++) {
        r(k < len - 3 ? '#2f7d2c' : '#3f9a3a', x + 1 + dx * k, top - 1 + dy * Math.round(k * k * 0.08) + (dy < 0 ? -1 : 0), 2, 1);
      }
    }
  };
  const plantain = (r: Px, x: number, base: number) => {
    r('#7a8f3a', x, base - 14, 3, 14);
    // hojas anchas que caen en arco hacia los lados
    for (const side of [-1, 1]) {
      for (const [len, lift] of [[11, 22], [9, 17]]) {
        for (let k = 0; k < len; k++) {
          const y = base - lift + Math.round((k * k) / 12);
          r('#6cc850', x + 1 + side * (k + 1), y, 1, 3);
          r('#3f9a3a', x + 1 + side * (k + 1), y + 3, 1, 1);
        }
      }
    }
    r('#6cc850', x, base - 24, 3, 6);
  };
  const bohio = (r: Px, x: number, base: number, w: number) => {
    const wallH = 14;
    const roofH = 20;
    // paredes de tabla de palma
    r('#b8915e', x, base - wallH, w, wallH);
    for (let i = 3; i < w; i += 4) r('#8a6a42', x + i, base - wallH, 1, wallH);
    // puerta y ventana con postigo abierto
    r('#3a2814', x + 5, base - 11, 7, 11);
    r('#6b4a2b', x + w - 13, base - 11, 6, 5); r('#2a1c0e', x + w - 12, base - 10, 4, 3); r('#8a6a42', x + w - 7, base - 11, 2, 5);
    // techo de guano a dos aguas con alero
    const top = base - wallH - roofH;
    for (let i = 0; i <= roofH; i++) {
      const half = Math.round(((w / 2 + 5) * i) / roofH);
      const cx = x + w / 2;
      r(i % 3 === 0 ? '#a07a3c' : '#c9a35a', Math.round(cx - half), top + i, half * 2, 1);
    }
    for (let i = 0; i < w + 10; i += 3) r('#8a6430', x - 5 + i, base - wallH, 1, 2 + ((i * 7) % 3)); // flecos del guano
    r('#7d5a2a', Math.round(x + w / 2) - 1, top - 1, 3, 2); // caballete
  };
  const fence = (r: Px, x0: number, x1: number, base: number) => {
    for (let x = x0; x <= x1; x += 6) r('#7a5530', x, base - 9, 2, 9);
    r('#8a6a42', x0, base - 7, x1 - x0 + 2, 1);
    r('#8a6a42', x0, base - 3, x1 - x0 + 2, 1);
  };

  // los ~14 px de abajo de la capa quedan tapados por el suelo del nivel: todo se apoya en y=55
  single(scene, 'bg-rural', GAME_W, 70, ({ r }) => {
    const g = 55;
    r('#4f9e3c', 0, g, GAME_W, 70 - g); // potrero
    r('#3f8a32', 0, g, GAME_W, 1);
    royalPalm(r, 8, g, 44);
    bohio(r, 28, g, 42);
    plantain(r, 86, g);
    fence(r, 98, 142, g);
    royalPalm(r, 152, g, 50);
    royalPalm(r, 168, g, 38);
    bohio(r, 188, g, 36);
    plantain(r, 238, g);
    royalPalm(r, 254, g, 46);
    fence(r, 264, 314, g);
  });

  single(scene, 'bg-base', GAME_W, 70, ({ r }) => {
    // cerca con alambre de púas, torre de vigilancia y barracas
    r('#4b5233', 20, 34, 70, 36); r('#3a4026', 20, 34, 70, 3); r('#2a2e1c', 40, 50, 10, 20);
    r('#4b5233', 180, 40, 90, 30); r('#3a4026', 180, 40, 90, 3);
    r('#3a3226', 130, 8, 4, 62); r('#3a3226', 150, 8, 4, 62); r('#4d4232', 124, 0, 36, 12);
    r(PAL.yellow, 136, 4, 12, 4);
    for (let x = 0; x < GAME_W; x += 16) r('#5c5c5c', x, 52, 2, 18);
    r('#7a7a7a', 0, 54, GAME_W, 1); r('#7a7a7a', 0, 60, GAME_W, 1);
    for (let x = 4; x < GAME_W; x += 6) { r('#9a9a9a', x, 53, 1, 3); r('#9a9a9a', x + 3, 59, 1, 3); }
  });

  single(scene, 'bg-stars', GAME_W, 100, ({ r }) => {
    let s = 7;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 70; i++) r(rnd() > 0.8 ? '#ffe9a8' : '#ffffff', Math.floor(rnd() * GAME_W), Math.floor(rnd() * 100));
  });
}

// ------------------------------------------------------------------ API

export function generateTextures(scene: Phaser.Scene): void {
  const heroPoses: [Legs, Stick, boolean?][] = [
    ['stand', 'rest'], ['runA', 'rest'], ['runB', 'rest'], ['runC', 'rest'], ['jump', 'rest'],
    ['stand', 'up'], ['stand', 'fwd'], ['jump', 'fwd'], ['jump', 'down'], ['hurt', 'rest', true],
  ];
  sheet(scene, 'hero', 24, 24, heroPoses.map(([l, s, h]) => (p: Painter) => drawHero(p, l, s, h)));

  const guardPoses: GuardPose[] = ['walkA', 'walkB', 'windup', 'punch', 'hurt'];
  sheet(scene, 'guard', 24, 24, guardPoses.map((g) => (p: Painter) => drawGuard(p, g, false)));
  sheet(scene, 'guard-whistle', 24, 24, guardPoses.map((g) => (p: Painter) => drawGuard(p, g, true)));

  const bossPoses: BossPose[] = ['idle', 'idle2', 'throw', 'charge', 'tired'];
  sheet(scene, 'boss', 40, 48, bossPoses.map((b) => (p: Painter) => drawBoss(p, b)));

  const looks: [string, string][] = [['#e94f64', PAL.hair], ['#f5d142', '#9a9a9a'], ['#4fb0e9', '#5a3a1a'], ['#7bd389', PAL.hair]];
  looks.forEach(([shirt, hair], i) =>
    sheet(scene, `npc${i}`, 24, 24, [(p) => drawNeighbor(p, shirt, hair, false), (p) => drawNeighbor(p, shirt, hair, true)]),
  );

  drawItems(scene);
  drawTiles(scene);
  drawProps(scene);
  drawBackgrounds(scene);
}

export function createAnimations(scene: Phaser.Scene): void {
  const a = scene.anims;
  if (a.exists('hero-run')) return;
  a.create({ key: 'hero-run', frames: a.generateFrameNumbers('hero', { frames: [1, 2, 3, 2] }), frameRate: 10, repeat: -1 });
  a.create({ key: 'guard-walk', frames: a.generateFrameNumbers('guard', { frames: [0, 1] }), frameRate: 5, repeat: -1 });
  a.create({ key: 'guard-whistle-walk', frames: a.generateFrameNumbers('guard-whistle', { frames: [0, 1] }), frameRate: 5, repeat: -1 });
  a.create({ key: 'boss-idle', frames: a.generateFrameNumbers('boss', { frames: [0, 1] }), frameRate: 3, repeat: -1 });
  for (let i = 0; i < 4; i++) {
    a.create({ key: `npc${i}-bang`, frames: a.generateFrameNumbers(`npc${i}`, { frames: [0, 1] }), frameRate: 4 + i, repeat: -1 });
  }
}
