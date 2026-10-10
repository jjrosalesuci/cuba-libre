import type { Action } from './InputManager';
import { unlockAudio } from './AudioManager';

/**
 * Controles táctiles como capa HTML sobre el canvas: cruceta a la izquierda,
 * A (salto) y B (palo) a la derecha, pausa y pantalla completa arriba.
 * Solo se muestran en dispositivos táctiles. InputManager lee `touchState`
 * y `touchPresses` igual que lee el teclado.
 */

/** Acciones mantenidas ahora mismo. */
export const touchState: Partial<Record<Action, boolean>> = {};
/** Contador de pulsaciones por acción: detecta toques más cortos que un frame. */
export const touchPresses: Partial<Record<Action, number>> = {};

/** Táctil real, o forzado con ?touch en la URL (para probar los controles en escritorio). */
export function isTouchDevice(): boolean {
  return (
    new URLSearchParams(location.search).has('touch') ||
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window
  );
}

function capture(e: PointerEvent): void {
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {
    // algunos navegadores rechazan la captura en eventos sintéticos; no es necesaria para funcionar
  }
}

function press(a: Action, down: boolean): void {
  if (down && !touchState[a]) {
    touchPresses[a] = (touchPresses[a] ?? 0) + 1;
    navigator.vibrate?.(8);
  }
  touchState[a] = down;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent: HTMLElement, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  e.textContent = text;
  parent.appendChild(e);
  return e;
}

/** Botón simple: mantiene la acción mientras el dedo esté apoyado. */
function button(parent: HTMLElement, cls: string, label: string, action: Action, caption?: string): void {
  const b = el('div', `tc-btn ${cls}`, parent, label);
  if (caption) el('span', 'tc-cap', b, caption);
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    unlockAudio();
    capture(e);
    b.classList.add('on');
    press(action, true);
  });
  const up = () => {
    b.classList.remove('on');
    press(action, false);
  };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('lostpointercapture', up);
}

/** Cruceta analógica: la dirección sale de la posición del dedo respecto al centro. */
function dpad(parent: HTMLElement): void {
  const pad = el('div', 'tc-dpad', parent);
  for (const d of ['up', 'down', 'left', 'right']) el('div', `tc-arrow tc-d-${d}`, pad);
  let pointer: number | null = null;
  const dirs: Action[] = ['left', 'right', 'up', 'down'];

  const update = (e: PointerEvent) => {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dz = r.width * 0.14;
    const next: Record<string, boolean> = {
      left: dx < -dz,
      right: dx > dz,
      // vertical menos sensible para no agacharse/subir sin querer al correr
      up: dy < -dz * 1.8 && Math.abs(dy) > Math.abs(dx) * 0.7,
      down: dy > dz * 1.8 && Math.abs(dy) > Math.abs(dx) * 0.7,
    };
    for (const a of dirs) {
      press(a, next[a]);
      pad.querySelector(`.tc-d-${a}`)!.classList.toggle('on', next[a]);
    }
  };
  const release = () => {
    pointer = null;
    for (const a of dirs) {
      press(a, false);
      pad.querySelector(`.tc-d-${a}`)!.classList.remove('on');
    }
  };

  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    unlockAudio();
    if (pointer !== null) return;
    pointer = e.pointerId;
    capture(e);
    update(e);
  });
  pad.addEventListener('pointermove', (e) => e.pointerId === pointer && update(e));
  pad.addEventListener('pointerup', (e) => e.pointerId === pointer && release());
  pad.addEventListener('pointercancel', (e) => e.pointerId === pointer && release());
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      // en Android se puede fijar horizontal estando en pantalla completa
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
    }
  } catch {
    // iOS Safari no tiene pantalla completa para páginas: se ignora
  }
}

export function initTouchControls(): void {
  if (!isTouchDevice()) return;
  document.body.classList.add('is-touch');

  const root = el('div', 'tc-root', document.body);
  root.addEventListener('contextmenu', (e) => e.preventDefault());

  const left = el('div', 'tc-left', root);
  dpad(left);

  const right = el('div', 'tc-right', root);
  button(right, 'tc-b', 'B', 'attack', 'PALO');
  button(right, 'tc-a', 'A', 'jump', 'SALTO');

  const top = el('div', 'tc-top', root);
  button(top, 'tc-small', 'II', 'start');
  if ('requestFullscreen' in document.documentElement) {
    const fs = el('div', 'tc-btn tc-small', top);
    // ícono de pantalla completa: cuatro esquinas
    fs.innerHTML =
      '<svg viewBox="0 0 18 18" fill="none" stroke="#fff" stroke-width="2"><path d="M1 6V1h5M12 1h5v5M17 12v5h-5M6 17H1v-5"/></svg>';
    fs.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      unlockAudio();
      void toggleFullscreen();
    });
  }

  el('div', 'tc-rotate', document.body, 'Gira el teléfono para jugar ⟳');

  // si la app pierde el foco con un dedo apoyado, soltar todo
  const releaseAll = () => (Object.keys(touchState) as Action[]).forEach((a) => press(a, false));
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', releaseAll);
}
