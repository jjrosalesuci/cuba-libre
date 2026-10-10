import Phaser from 'phaser';

/** Contorno aproximado de Cuba (lon, lat), de oeste a este por el norte y de vuelta por el sur. */
const OUTLINE: [number, number][] = [
  [-84.95, 21.86], [-84.4, 22.4], [-83.9, 22.75], [-83.1, 22.98], [-82.5, 23.05], [-82.35, 23.14],
  [-81.6, 23.15], [-81.2, 23.12], [-80.6, 22.95], [-80.0, 22.95], [-79.5, 22.6], [-78.7, 22.45],
  [-78.0, 22.3], [-77.4, 21.9], [-76.8, 21.5], [-76.0, 21.15], [-75.6, 21.1], [-75.2, 20.85],
  [-74.6, 20.5], [-74.13, 20.22], [-74.5, 20.05], [-75.2, 19.9], [-76.0, 19.97], [-76.8, 19.85],
  [-77.7, 19.85], [-77.3, 20.3], [-77.6, 20.7], [-78.1, 20.8], [-78.6, 21.4], [-79.4, 21.55],
  [-80.2, 21.8], [-80.9, 22.05], [-81.3, 22.15], [-81.8, 22.3], [-82.2, 22.65], [-82.8, 22.7],
  [-83.5, 22.2], [-84.3, 21.9],
];

export interface Province {
  id: string;
  name: string;
  lon: number;
  lat: number;
  /** Primer nivel jugable de la provincia; undefined = todavía no implementada. */
  firstLevel?: string;
}

/** En orden de juego: de oriente a occidente. */
export const PROVINCES: Province[] = [
  { id: 'guantanamo', name: 'GUANTÁNAMO', lon: -75.2, lat: 20.2, firstLevel: '1-1' },
  { id: 'santiago', name: 'SANTIAGO DE CUBA', lon: -75.85, lat: 20.1 },
  { id: 'granma', name: 'GRANMA', lon: -76.8, lat: 20.3 },
  { id: 'holguin', name: 'HOLGUÍN', lon: -75.95, lat: 20.8 },
  { id: 'lastunas', name: 'LAS TUNAS', lon: -76.95, lat: 21.0 },
  { id: 'camaguey', name: 'CAMAGÜEY', lon: -77.9, lat: 21.45 },
  { id: 'ciego', name: 'CIEGO DE ÁVILA', lon: -78.75, lat: 21.85 },
  { id: 'sancti', name: 'SANCTI SPÍRITUS', lon: -79.45, lat: 21.95 },
  { id: 'villaclara', name: 'VILLA CLARA', lon: -79.95, lat: 22.45 },
  { id: 'cienfuegos', name: 'CIENFUEGOS', lon: -80.45, lat: 22.15 },
  { id: 'matanzas', name: 'MATANZAS / MAYABEQUE', lon: -81.5, lat: 22.7 },
  { id: 'pinar', name: 'PINAR DEL RÍO', lon: -83.7, lat: 22.4 },
  { id: 'habana', name: 'LA HABANA', lon: -82.36, lat: 23.05 },
  { id: 'puntocero', name: 'PUNTO CERO', lon: -82.55, lat: 22.95 },
];

export interface Projection {
  x: number;
  y: number;
  w: number;
}

/** Convierte lon/lat a coordenadas de pantalla dentro de un rectángulo de ancho w. */
export function project(lon: number, lat: number, p: Projection): [number, number] {
  const scale = p.w / 11.0;
  return [Math.round(p.x + (lon + 85.1) * scale), Math.round(p.y + (23.3 - lat) * scale)];
}

export function outline(p: Projection): Phaser.Geom.Point[] {
  return OUTLINE.map(([lon, lat]) => {
    const [x, y] = project(lon, lat, p);
    return new Phaser.Geom.Point(x, y);
  });
}

/** Dibuja la isla con un contorno de 1px nítido (las líneas finas diagonales se pierden en WebGL). */
export function drawIsland(g: Phaser.GameObjects.Graphics, p: Projection, fill: number, edge: number): void {
  const pts = outline(p);
  g.fillStyle(edge, 1);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    g.fillPoints(pts.map((q) => new Phaser.Geom.Point(q.x + dx, q.y + dy)), true);
  }
  g.fillStyle(fill, 1).fillPoints(pts, true);
}
