# 7. Fondos de parallax

El juego mueve dos capas a distinta velocidad sobre un cielo fijo. Todas tienen que **repetirse
horizontalmente sin costura** (el borde izquierdo continúa en el derecho).

Pide imágenes **apaisadas (proporción 4:1 o 3:1)** y agrega siempre:

```
The image must tile seamlessly horizontally: the left edge must continue exactly into the right edge.
```

## 7.1 Montañas (capa lejana, 320×90)

```
[ESTILO de fondos]
Parallax background layer: rolling green mountains of eastern Cuba (Sierra Maestra style).
Far range in LIGHT green with a sunlit top edge, nearer hills in DARK green in front,
flat silhouettes with 2-3 shades of green each.
The top half is magenta (#FF00FF) sky so it can be cut out. Wide panoramic image.
The image must tile seamlessly horizontally.
```

## 7.2 Campo cubano con bohíos (capa cercana de Guantánamo 1-1, 320×70)

El primer nivel empieza en la Cuba rural.

```
[ESTILO de fondos]
Parallax background layer of the Cuban countryside: two traditional bohíos (rustic rural huts with
walls of vertical palm-wood planks and tall, steep thatched roofs of dry palm fronds called guano,
with a dark doorway and a small wooden-shutter window), tall royal palms with smooth pale gray trunks
and a bright green crown, plantain plants with big drooping leaves, a rustic wooden stick fence
and green pasture. Seen straight from the front. Magenta (#FF00FF) sky above.
Leave the bottom 15% as plain green pasture (it gets covered by the ground).
The image must tile seamlessly horizontally.
```

## 7.2b Pueblo (capa cercana de otros niveles y de "provincia liberada", 320×70)

```
[ESTILO de fondos]
Parallax background layer: a row of small colorful one-story Cuban town houses (yellow, teal,
coral, lilac, cream, light blue) with flat roofs, dark doors and windows, and a few tall royal palm
trees between them. Seen straight from the front. Magenta (#FF00FF) sky above the roofs.
The image must tile seamlessly horizontally.
```

## 7.3 Base militar (capa cercana de 1-2, 320×70)

```
[ESTILO de fondos]
Parallax background layer: a run-down military base: low olive-green barracks, a wooden watchtower
with a searchlight, a chain-link fence with barbed wire running along the bottom. Muted greens and grays.
Magenta (#FF00FF) sky above. The image must tile seamlessly horizontally.
```

## 7.4 Cielos (320×180, sin repetir)

Bandas de color planas, sin degradado suave:

| Archivo | Prompt |
|---|---|
| `sky-dawn.png` | `[ESTILO de fondos] Sunrise sky made of horizontal flat color bands: dark indigo at the top, then magenta-pink, orange, pale yellow at the horizon. A few faint stars at the top. 16:9.` |
| `sky-day.png` | `[ESTILO de fondos] Bright Cuban day sky in horizontal flat color bands from deep blue at the top to pale cyan at the horizon. No clouds (they are a separate layer). 16:9.` |
| `clouds.png` | `[ESTILO de fondos] Four puffy white pixel-art clouds of different sizes with light blue-gray shading on their undersides, on a magenta (#FF00FF) background, wide 4:1, must tile seamlessly horizontally.` |
| `sky-dusk.png` | `[ESTILO de fondos] Dusk sky in horizontal flat color bands: purple at the top, red-orange, golden yellow at the horizon. 16:9.` |
| `sky-night.png` | `[ESTILO de fondos] Night sky in horizontal flat bands from near-black navy to dark purple at the horizon, scattered tiny white and yellow stars. 16:9.` |

## Convertir

```bash
tools/.venv/Scripts/python tools/pixelize.py background montanas.png public/assets/bg/mountains.png --size 320x90 --tileable
tools/.venv/Scripts/python tools/pixelize.py background pueblo.png public/assets/bg/town.png --size 320x70 --tileable
tools/.venv/Scripts/python tools/pixelize.py background base.png public/assets/bg/base.png --size 320x70 --tileable
tools/.venv/Scripts/python tools/pixelize.py background sky-dawn.png public/assets/bg/sky-dawn.png --size 320x180
```

Después hay que volver transparente el magenta del cielo en montañas, pueblo y base
(en Aseprite: varita mágica sobre el magenta → borrar).

## Provincias futuras (misma receta, cambia la descripción)

| Provincia | Capa cercana |
|---|---|
| Santiago de Cuba | `steep colonial streets climbing a hill, balconies, Sierra Maestra behind` |
| Granma | `tall sugar cane fields` |
| Holguín | `Loma de la Cruz hill with a long stone staircase and a cross on top` |
| Las Tunas | `small town plaza with abstract sculptures` |
| Camagüey | `narrow winding colonial alleys with big clay jars (tinajones)` |
| Ciego de Ávila | `military region compound with watchtowers and searchlights at night` |
| Trinidad | `cobblestone colonial streets with red tile roofs and pastel facades` |
| Villa Clara | `railway tracks and an old armored train` |
| Cienfuegos | `bay with patrol boats and a seawall promenade` |
| Matanzas / Mayabeque | `stone bridges over a river and limestone caves` |
| Pinar del Río | `Viñales valley with limestone mogotes and tobacco fields at sunset` |
| La Habana | `the Malecón seawall at night with waves, classic 1950s cars, Centro Habana rooftops, the Capitolio dome` |
