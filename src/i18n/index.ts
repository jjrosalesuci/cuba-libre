import es from './es.json';

export type TextKey = keyof typeof es;

export function t(key: TextKey): string {
  return es[key];
}
