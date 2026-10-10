const KEY = 'dopc-save-v1';

export interface SaveData {
  liberated: string[];
  best: number;
  volume: number;
}

const DEFAULTS: SaveData = { liberated: [], best: 0, volume: 0.6 };

let cache: SaveData | null = null;

export function load(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache!;
}

export function save(patch: Partial<SaveData>): SaveData {
  const data = { ...load(), ...patch };
  cache = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // almacenamiento bloqueado: el juego sigue funcionando sin guardar
  }
  return data;
}

export function liberate(provinceId: string, score: number): void {
  const d = load();
  const liberated = d.liberated.includes(provinceId) ? d.liberated : [...d.liberated, provinceId];
  save({ liberated, best: Math.max(d.best, score) });
}
