# 6. Escenografía y tiles

## 6.1 Tiles del suelo (16×16 cada uno)

Pídelos como una sola imagen en cuadrícula y luego recorta cada cuadro, o uno por uno.

```
[ESTILO de fondos]

A tileset for a 16-bit platformer: 8 square tiles in a single row, each tile seamless and
the same size, separated by a thin magenta gap:
1) grass-topped dirt ground (green grass strip on top, brown earth below);
2) plain brown dirt fill with a few darker pebbles (tiles seamlessly);
3) a thin wooden plank platform (only the top third of the tile, rest magenta);
4) an olive-green metal oil barrel, front view;
5) a wooden crate with a cross brace;
6) gray concrete floor top with a lighter edge line;
7) plain gray concrete fill with small cracks (tiles seamlessly);
8) red-orange brick wall (tiles seamlessly).
Flat magenta (#FF00FF) gaps and background. No text.
```

Orden y archivo: `tiles.png` de 128×16 (8 tiles de 16×16 en ese orden, ver `TILES` en `Textures.ts`).

```bash
# un tile por imagen:
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/tilesets/tiles.png --size 16x16 --keep-bg \
    dirtTop.png dirtFill.png platform.png barrel.png crate.png concTop.png concFill.png brick.png
```

## 6.2 Objetos

Empieza con `[ESTILO]` (el de sprites, fondo magenta) y agrega:

| Archivo | Tamaño | Línea a agregar |
|---|---|---|
| `truck.png` | 56×32 | `An old Soviet-style military cargo truck in olive green, canvas-covered back, round headlights, a small red star on the door. Side view facing right, wheels on the ground.` |
| `fridge.png` | 16×26 | `An old white 1950s rounded refrigerator with its door open, completely empty inside, dark interior.` |
| `flag-down.png` | 16×32 | `A tall thin metal flagpole with a plain gray folded cloth at the bottom.` |
| `flag-up.png` | 16×32 | `The same flagpole with the Cuban flag raised and waving at the top (three blue and two white horizontal stripes, red triangle with a white star on the left).` |
| `exit.png` | 16×24 | `A wooden signpost with a yellow sign showing a black arrow pointing right.` |

```bash
tools/.venv/Scripts/python tools/pixelize.py sprite truck.png public/assets/sprites/truck.png --size 56x32
tools/.venv/Scripts/python tools/pixelize.py sprite fridge.png public/assets/sprites/fridge.png --size 16x26
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/flag.png --size 16x32 flag-down.png flag-up.png
tools/.venv/Scripts/python tools/pixelize.py sprite exit.png public/assets/sprites/exit.png --size 16x24
```

## 6.3 Decorados grandes

Usa `[ESTILO de fondos]`. Estos van sin quitar fondo (`--keep-bg`), salvo el cielo alrededor de la sede.

| Archivo | Tamaño | Prompt |
|---|---|---|
| `house.png` | 224×120 | `Interior of a humble Cuban house at night during a blackout, side view cross-section: dark wooden walls, a window showing the moon, an unlit hanging light bulb, an old wall calendar, a wooden front door on the right. Dark, moody, but readable. Wide image 2:1.` |
| `hq.png` | 176×128 | `Front of a two-story provincial government building in a Cuban town: cream colored walls, tall windows, a second-floor balcony with an iron railing in the center, a big wooden double door, a long red banner along the top with a row of small yellow dots (no text). Magenta sky around it.` |

```bash
tools/.venv/Scripts/python tools/pixelize.py background house.png public/assets/bg/house.png --size 224x120
tools/.venv/Scripts/python tools/pixelize.py sprite hq.png public/assets/bg/hq.png --size 176x128
```

En `hq.png` el balcón tiene que quedar a la altura del 2.º piso (el jefe se para ahí: unos 60 px
desde arriba de la imagen final).
