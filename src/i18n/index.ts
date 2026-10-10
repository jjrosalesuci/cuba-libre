import es from './es.json';
import { isTouchDevice } from '../systems/TouchControls';

export type TextKey = keyof typeof es;

const touch = isTouchDevice();

/** Texto de interfaz; en pantallas táctiles usa la variante "…Touch" si existe (A/B en vez de teclas). */
export function t(key: TextKey): string {
  const touchKey = `${key}Touch` as TextKey;
  return touch && touchKey in es ? es[touchKey] : es[key];
}
