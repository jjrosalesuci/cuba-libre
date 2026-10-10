# De Oriente a Punto Cero

[![Donar con PayPal](https://img.shields.io/badge/Donar-PayPal-blue.svg?logo=paypal)](https://www.paypal.com/donate/?business=jjrosalesuci%40gmail.com&currency_code=USD)
**Cómprame un café y lo sigo desarrollando.** · Jugar: https://jjrosalesuci.github.io/cuba-libre/

Plataformas 2D en pixel art (estilo SNES) hecho con **Phaser 3 + TypeScript + Vite**.
Un cubano con chancletas y un palo de escoba recorre la isla de Guantánamo a La Habana.
Requerimientos completos en [`docs/REQUERIMIENTOS.md`](docs/REQUERIMIENTOS.md).

Estado: **vertical slice** — título, mapa, Guantánamo 1-1, 1-2 y el jefe (1-3), pausa, game over,
pantalla de provincia liberada y guardado.

## Correr

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción en dist/
npm run preview    # sirve dist/
```

## Controles

| Acción | Teclado | Mando |
|---|---|---|
| Mover | ← → (o A / D) | D-pad / stick |
| Saltar (mantener = más alto) | ↑ (también W, Z) | A |
| Palo (combo x3) | Espacio (también X, J) | X / B |
| Golpe hacia abajo en el aire | ↓ + Espacio | ↓ + X |
| Pisotón (caerle encima a un guardia lo derrota) | — | — |
| Pausa / Start | Enter, Esc, P | Start |

En los menús: flechas para elegir, Enter o Espacio para confirmar.

**Móvil:** en pantallas táctiles aparecen una cruceta (se puede deslizar el dedo), **A** = saltar,
**B** = palo e **II** = pausa. Al abrir se muestra "TOCA LA PANTALLA PARA JUGAR" y ese toque pone el juego en
pantalla completa (si se sale, el siguiente toque vuelve a entrar). En iPhone, Safari no lo permite: hay que usar
Compartir → "Agregar a inicio" y abrirlo desde el ícono (el manifest lo abre a pantalla completa y en horizontal).
Se juega en horizontal; en vertical pide girar el teléfono.
Para probar los controles táctiles en la computadora: abrir `http://localhost:5173/?touch`.

## Progreso guardado

El progreso se guarda en el `localStorage` del navegador (clave `dopc-save-v1`) cada vez que se completa un nivel:
niveles completados, provincias liberadas, récord y volumen. En el mapa, una provincia a medias continúa en el primer
nivel que falte ("Enter: seguir en 1-2"); una liberada se puede rejugar desde el principio, y al vencer al jefe se
desbloquea la siguiente provincia. El progreso es por navegador y por dispositivo.

## Estructura

```
src/
  config.ts            constantes (resolución 320x180, física del héroe, paleta)
  data/levels.ts       niveles como cuadrículas de caracteres (leyenda arriba del archivo) y diálogos
  data/cuba.ts         contorno de Cuba y provincias para título y mapa
  entities/            Hero, Guard (patrullero y silbato), BossGuantanamo
  scenes/              Boot, Title, Map, Level, Pause, GameOver, LevelClear
  systems/             InputManager, AudioManager (chiptune sintetizado), SaveManager, Textures
  ui/                  HUD, DialogBox, texto y efectos
  i18n/es.json         todos los textos de interfaz
tools/pixelize.py      pipeline de imágenes IA -> sprites pixel art
```

## Agregar una provincia

1. Crear el mapa con `MapBuilder` en `src/data/levels.ts` y su entrada en `LEVELS` (tema, cielo, música, diálogos, `next`).
2. Poner `firstLevel` en la provincia en `src/data/cuba.ts` para que se pueda elegir en el mapa.
3. Solo hace falta código nuevo si la provincia trae enemigos o mecánicas nuevas (jeeps, reflectores, tren…).

## Arte final con IA

Los prompts listos para ChatGPT están en [`docs/prompts-arte/`](docs/prompts-arte/README.md).

Los gráficos actuales son placeholders dibujados por código (`src/systems/Textures.ts`) con el
tamaño y orden de frames definitivos. Para reemplazarlos:

1. Generar en Imagen (AI Studio) cada pose **sobre fondo plano magenta (#ff00ff)**, vista lateral, mirando a la derecha.
   Partir siempre de la misma imagen de referencia del personaje para mantener el diseño.
2. Convertir:
   ```bash
   python -m venv tools/.venv
   tools/.venv/Scripts/python -m pip install -r tools/requirements.txt
   tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/hero.png --size 24x24 \
       idle.png runA.png runB.png runC.png jump.png windup.png swing.png airSwing.png down.png hurt.png
   ```
3. Retocar en Aseprite/LibreSprite.
4. Cargar el PNG en `BootScene` con `this.load.spritesheet('hero', ..., { frameWidth: 24, frameHeight: 24 })`
   en lugar de generarlo (`generateTextures` no sobrescribe texturas que ya existan).

Tamaños: héroe y guardias 24×24, jefe 40×48, ítems 12×12, tiles 16×16, fondos 320×90 / 320×70.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica el juego en cada push a `main`
(también se puede lanzar a mano desde la pestaña **Actions** → *Deploy a GitHub Pages* → *Run workflow*).

Configuración, una sola vez:
1. El repo tiene que ser **público** (o tener GitHub Pro para Pages en repos privados).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Dirección del juego: `https://jjrosalesuci.github.io/cuba-libre/`

## Depuración

En `npm run dev` el juego queda accesible como `window.game` en la consola del navegador.
