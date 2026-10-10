/**
 * Niveles data-driven. Cada nivel es una cuadrícula de caracteres (12 filas de
 * 16px) generada con MapBuilder; más adelante se podrá sustituir por mapas de
 * Tiled sin tocar LevelScene, ya que ambos producen la misma lista de tiles y
 * objetos.
 *
 * Leyenda:
 *   .  vacío              #  suelo (top/relleno según tema)   =  plataforma de un solo sentido
 *   B  barril             Z  caja                             H  pared de ladrillo
 *   S  inicio del héroe   E  guardia patrullero               W  guardia con silbato
 *   K  camión con guardia G  jefe                             n  vecino con cazuela
 *   R  refrigerador       c  café   C  colada   P  cazuela   L  pan con croqueta   $  moneda
 *   F  punto de control   X  salida              1-9  disparadores de diálogo
 */

export type Speaker = 'hero' | 'vecina' | 'vecino' | 'boss' | 'radio';

export interface Line {
  who: Speaker;
  text: string;
}

export type Theme = 'rural' | 'town' | 'base' | 'hq';

export interface LevelConfig {
  id: string;
  province: string;
  title: string;
  subtitle: string;
  theme: Theme;
  sky: 'night' | 'dawn' | 'day' | 'dusk';
  music: 'level' | 'boss';
  rows: string[];
  dialogs: Record<string, Line[]>;
  /** Columna hasta donde dura el apagón (oscuridad) al inicio del nivel. */
  blackoutUntilCol?: number;
  boss?: 'guantanamo';
  next?: string;
}

class MapBuilder {
  private g: string[][];
  constructor(readonly w: number, readonly h = 12) {
    this.g = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  }
  /** Suelo desde la fila `top` hasta abajo entre las columnas x0..x1 (inclusive). */
  ground(x0: number, x1: number, top = 10): this {
    return this.fill('#', x0, x1, top, this.h - 1);
  }
  pit(x0: number, x1: number): this {
    return this.fill('.', x0, x1, 0, this.h - 1);
  }
  fill(ch: string, x0: number, x1: number, y0: number, y1: number): this {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.g[y][x] = ch;
    return this;
  }
  row(ch: string, x0: number, x1: number, y: number): this {
    return this.fill(ch, x0, x1, y, y);
  }
  put(ch: string, x: number, y = 9): this {
    this.g[y][x] = ch;
    return this;
  }
  build(): string[] {
    return this.g.map((r) => r.join(''));
  }
}

// ------------------------------------------------------------------ 1-1 El despertar

const l11 = new MapBuilder(116)
  .ground(0, 115)
  // casa: apagón y refri vacío
  .put('S', 2).put('1', 3).put('R', 6)
  // calle con cacerolazo
  .put('n', 17).put('n', 20).put('2', 21).put('n', 23).put('n', 26).put('n', 29)
  // pueblo
  .row('=', 34, 37, 7).row('$', 34, 37, 6)
  .put('E', 41)
  .ground(45, 53, 9).put('E', 51, 8).put('$', 47, 7).put('$', 48, 7)
  .pit(56, 58)
  .row('=', 61, 64, 7).put('c', 62, 6)
  .put('F', 67)
  .put('3', 69)
  .put('E', 73)
  .put('Z', 77).fill('Z', 78, 78, 8, 9).put('$', 78, 7)
  .put('E', 82)
  .pit(86, 88)
  .row('=', 90, 93, 7).put('P', 91, 6).row('$', 92, 93, 6)
  .put('E', 97)
  .put('$', 100, 8).put('$', 102, 8).put('$', 104, 8)
  .put('4', 106)
  .put('X', 112);

// ------------------------------------------------------------------ 1-2 Primera base militar

const l12 = new MapBuilder(130)
  .ground(0, 129)
  .put('S', 2).put('1', 4)
  .put('B', 10).put('B', 11).fill('B', 11, 11, 8, 8)
  .put('E', 15)
  .put('K', 20)
  .row('=', 27, 30, 7).put('c', 28, 6)
  .put('B', 33).fill('B', 34, 34, 8, 9).fill('B', 35, 35, 7, 9)
  .put('W', 38)
  .pit(44, 46)
  .ground(47, 54, 8).put('E', 50, 7).row('$', 48, 49, 6)
  .pit(55, 57)
  .put('F', 61)
  .put('2', 62)
  .put('K', 66)
  .row('=', 74, 77, 7).row('=', 79, 82, 4).put('L', 81, 3)
  .put('E', 75).put('W', 83)
  .put('B', 88).put('B', 89).fill('B', 89, 89, 8, 8)
  .put('c', 92)
  .put('K', 95)
  .pit(103, 105)
  .row('=', 102, 106, 7).put('C', 104, 6)
  .put('E', 110).put('E', 114)
  .row('$', 117, 120, 8)
  .put('3', 122)
  .put('X', 126);

// ------------------------------------------------------------------ 1-3 Jefe: sede provincial del PCC

const l13 = new MapBuilder(20)
  .ground(0, 19)
  .fill('H', 0, 0, 0, 9).fill('H', 19, 19, 0, 9)
  .put('S', 2).put('1', 3)
  .put('c', 1, 9)
  .put('G', 16);

export const LEVELS: Record<string, LevelConfig> = {
  '1-1': {
    id: '1-1',
    province: 'guantanamo',
    title: 'GUANTÁNAMO 1-1',
    subtitle: 'EL DESPERTAR',
    theme: 'rural',
    sky: 'day',
    music: 'level',
    rows: l11.build(),
    blackoutUntilCol: 14,
    next: '1-2',
    dialogs: {
      '1': [
        { who: 'hero', text: 'Se fue la corriente... otra vez.' },
        { who: 'hero', text: 'Y el refri vacío. Ni un huevo, asere.' },
        { who: 'hero', text: 'Bueno. Aquí está el palo de la escoba.' },
      ],
      '2': [
        { who: 'vecina', text: '¡Pa\'l carajo los apagones! ¡Dale, que la gente está en la calle!' },
        { who: 'hero', text: '¡Se acabó, asere! Hoy arrancamos.' },
      ],
      '3': [{ who: 'vecino', text: '¡Pa\'lante! ¡De Oriente a Punto Cero!' }],
      '4': [{ who: 'hero', text: 'La base militar está pasando la loma. Allá voy.' }],
    },
  },
  '1-2': {
    id: '1-2',
    province: 'guantanamo',
    title: 'GUANTÁNAMO 1-2',
    subtitle: 'PRIMERA BASE MILITAR',
    theme: 'base',
    sky: 'day',
    music: 'level',
    rows: l12.build(),
    next: '1-3',
    dialogs: {
      '1': [
        { who: 'hero', text: 'La base. Ojo con los del silbato, que llaman refuerzos.' },
        { who: 'radio', text: '...ksshh... todo tranquilo en el puesto... ksshh...' },
      ],
      '2': [{ who: 'hero', text: 'Un cafecito no me vendría mal ahora mismo.' }],
      '3': [{ who: 'hero', text: 'Ahí está la sede provincial. El Secretario tiene que estar adentro.' }],
    },
  },
  '1-3': {
    id: '1-3',
    province: 'guantanamo',
    title: 'GUANTÁNAMO 1-3',
    subtitle: 'SEDE PROVINCIAL DEL PARTIDO',
    theme: 'hq',
    sky: 'dusk',
    music: 'boss',
    rows: l13.build(),
    boss: 'guantanamo',
    dialogs: {
      '1': [
        { who: 'boss', text: '¡Compañero! ¡Esto es una provocación del enemigo!' },
        { who: 'boss', text: '¡Te voy a dar un discurso de seis horas!' },
        { who: 'hero', text: 'Mi socio, no hay corriente ni pa\'l micrófono.' },
      ],
    },
  },
};

export const SPEAKER_NAMES: Record<Speaker, string> = {
  hero: 'TÚ',
  vecina: 'VECINA',
  vecino: 'VECINO',
  boss: 'SECRETARIO',
  radio: 'RADIO',
};
