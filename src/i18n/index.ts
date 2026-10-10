import es from './es.json';
import { isTouchDevice } from '../systems/TouchControls';

type Texts = typeof es;
/** Claves de textos simples (las listas se piden con list()). */
export type TextKey = { [K in keyof Texts]: Texts[K] extends string ? K : never }[keyof Texts];
export type ListKey = { [K in keyof Texts]: Texts[K] extends string[] ? K : never }[keyof Texts];

const touch = isTouchDevice();

/** Texto de interfaz; en pantallas táctiles usa la variante "…Touch" si existe (A/B en vez de teclas). */
export function t(key: TextKey): string {
  const touchKey = `${key}Touch`;
  return touch && touchKey in es ? (es[touchKey as TextKey] as string) : es[key];
}

/** Lista de textos (p. ej. las frases que grita el héroe). */
export function list(key: ListKey): string[] {
  return es[key];
}
