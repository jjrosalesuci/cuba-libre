import Phaser from 'phaser';
import { GAME_W, GAME_H, GRAVITY } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { LevelScene } from './scenes/LevelScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LevelClearScene } from './scenes/LevelClearScene';

function start(): void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, debug: false } },
    input: { gamepad: true },
    scene: [BootScene, TitleScene, MapScene, LevelScene, PauseScene, GameOverScene, LevelClearScene],
  });
  // acceso desde la consola para depurar en desarrollo
  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
}

// Esperar la fuente pixel para que el texto no salga con la fuente de respaldo.
const fontReady = document.fonts?.load('8px "Press Start 2P"') ?? Promise.resolve();
Promise.race([fontReady, new Promise((r) => setTimeout(r, 2500))]).finally(start);
