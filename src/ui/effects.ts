import Phaser from 'phaser';
import { txt } from './text';

/** Nube de píxeles al vencer a un enemigo (sin sangre: solo "puf"). */
export function puff(scene: Phaser.Scene, x: number, y: number, n = 10, tint = 0xffffff): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = 10 + Math.random() * 12;
    const p = scene.add.image(x, y, 'puff').setTint(tint).setDepth(50);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d - 6,
      alpha: 0,
      scale: 0.4,
      duration: 380 + Math.random() * 200,
      ease: 'Cubic.easeOut',
      onComplete: () => p.destroy(),
    });
  }
}

/** Texto flotante (puntos, "+ CAFÉ", etc.). */
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = '#ffffff'): void {
  const t = txt(scene, x, y, s, { color, origin: 0.5, stroke: true }).setDepth(60);
  scene.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 800, onComplete: () => t.destroy() });
}

/** Parpadeo y desaparición estilo arcade. */
export function blinkOut(scene: Phaser.Scene, obj: Phaser.GameObjects.Sprite, done: () => void): void {
  scene.tweens.add({
    targets: obj,
    alpha: 0,
    duration: 60,
    yoyo: true,
    repeat: 4,
    onComplete: done,
  });
}
