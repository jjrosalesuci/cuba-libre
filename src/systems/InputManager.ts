import Phaser from 'phaser';
import { touchPresses, touchState } from './TouchControls';

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'start';

// Teclado: flechas para moverse, ↑ salta, Espacio pega con el palo, Enter pausa.
// ↑ cuenta como 'up' (menús) y como 'jump' (juego) a la vez.
const KEYS: Record<Action, string[]> = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  up: ['UP', 'W'],
  down: ['DOWN', 'S'],
  jump: ['UP', 'W', 'Z'],
  attack: ['SPACE', 'X', 'J'],
  start: ['ENTER', 'ESC', 'P'],
};

const ACTIONS = Object.keys(KEYS) as Action[];

/**
 * Abstrae teclado, gamepad y (en el futuro) controles táctiles detrás de acciones.
 * Llamar a update() una vez por frame antes de consultar justDown().
 */
export class InputManager {
  private keys: Record<Action, Phaser.Input.Keyboard.Key[]>;
  private prev: Record<string, boolean> = {};
  private cur: Record<string, boolean> = {};
  /** Pulsaciones vistas desde el último update (aunque la tecla ya se haya soltado). */
  private tapped: Partial<Record<Action, boolean>> = {};
  /** Estado inyectado por código (pruebas, demos). */
  virtual: Partial<Record<Action, boolean>> = {};
  /** Últimos contadores de toques vistos, para no perder toques más cortos que un frame. */
  private seenTouches: Partial<Record<Action, number>> = { ...touchPresses };

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = {} as Record<Action, Phaser.Input.Keyboard.Key[]>;
    for (const a of ACTIONS) {
      this.keys[a] = KEYS[a].map((k) => kb.addKey(k, true, false));
    }
    for (const a of ACTIONS) this.cur[a] = this.prev[a] = this.readRaw(a);
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      for (const a of ACTIONS) if (this.keys[a].some((k) => k.keyCode === e.keyCode)) this.tapped[a] = true;
    };
    kb.on('keydown', onDown);
    scene.events.once('shutdown', () => kb.off('keydown', onDown));
  }

  private pad(): Phaser.Input.Gamepad.Gamepad | undefined {
    const gp = this.scene.input.gamepad;
    return gp && gp.total > 0 ? gp.getPad(0) : undefined;
  }

  private readRaw(a: Action): boolean {
    if (this.virtual[a] || touchState[a]) return true;
    if (this.keys[a].some((k) => k.isDown)) return true;
    const p = this.pad();
    if (!p) return false;
    const ax = p.axes.length > 0 ? p.axes[0].getValue() : 0;
    const ay = p.axes.length > 1 ? p.axes[1].getValue() : 0;
    switch (a) {
      case 'left': return p.left || ax < -0.4;
      case 'right': return p.right || ax > 0.4;
      case 'up': return p.up || ay < -0.5;
      case 'down': return p.down || ay > 0.5;
      case 'jump': return p.A;
      case 'attack': return p.X || p.B;
      case 'start': return !!p.buttons[9]?.pressed;
    }
  }

  update(): void {
    for (const a of ACTIONS) {
      this.prev[a] = this.cur[a];
      const touches = touchPresses[a] ?? 0;
      const touchTap = touches !== (this.seenTouches[a] ?? 0);
      this.seenTouches[a] = touches;
      this.cur[a] = this.readRaw(a) || !!this.tapped[a] || touchTap;
    }
    this.tapped = {};
  }

  isDown(a: Action): boolean {
    return this.cur[a];
  }

  justDown(a: Action): boolean {
    return this.cur[a] && !this.prev[a];
  }

  justUp(a: Action): boolean {
    return !this.cur[a] && this.prev[a];
  }

  /**
   * Confirmar en menús y diálogos: Enter, palo (Espacio) o salto. Un salto que viene de ↑
   * no confirma, porque ↑ también sirve para moverse por los menús.
   */
  anyConfirm(): boolean {
    return this.justDown('start') || this.justDown('attack') || (this.justDown('jump') && !this.justDown('up'));
  }
}
