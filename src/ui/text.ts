import Phaser from 'phaser';
import { FONT } from '../config';

export interface TextOpts {
  size?: number;
  color?: string;
  origin?: number | [number, number];
  stroke?: boolean;
  wrap?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean;
}

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, o: TextOpts = {}): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, {
    fontFamily: FONT,
    fontSize: `${o.size ?? 8}px`,
    color: o.color ?? '#ffffff',
    align: o.align ?? 'left',
    stroke: o.stroke ? '#000000' : undefined,
    strokeThickness: o.stroke ? 2 : 0,
    wordWrap: o.wrap ? { width: o.wrap } : undefined,
    lineSpacing: 3,
    // incluir mayúsculas con tilde para que no se recorten (Á, É, Ñ…)
    testString: '|ÁÉÍÓÚÑÜ¡¿qgy',
  });
  const origin = o.origin ?? 0;
  if (Array.isArray(origin)) t.setOrigin(origin[0], origin[1]);
  else t.setOrigin(origin);
  if (o.fixed) t.setScrollFactor(0);
  return t;
}
