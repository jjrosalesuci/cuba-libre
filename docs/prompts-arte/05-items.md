# 5. Ítems y HUD

Tamaño en el juego: **12×12 px** (corazón 8×8). Conviene pedirlos uno por imagen: a ese tamaño
cualquier detalle de más se pierde, así que pide formas simples y colores fuertes.

Empieza cada prompt con:

```
[ESTILO]
A single game pickup icon, centered, bold simple shape readable at very small size, magenta background.
```

| Archivo | Línea a agregar |
|---|---|
| `cafe.png` | `A tiny white Cuban espresso cup (tacita) full of dark coffee with a little curl of steam.` |
| `colada.png` | `A red thermos bottle with a gray cap, for sharing Cuban coffee (colada).` |
| `cazuela.png` | `A dented gray metal cooking pot with two small handles, seen from the side.` |
| `croqueta.png` | `A Cuban bread sandwich with an orange-brown croquette inside (pan con croqueta).` |
| `coin.png` | `A shiny gold coin with a simple star stamped in the middle.` |
| `star.png` | `A simple bright yellow five-pointed star, cartoon dizzy star.` |
| `heart.png` | `A red pixel heart for a health bar, with a small white shine.` |
| `heart-empty.png` | `The same heart shape but empty and dark gray.` |

## Convertir

```bash
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/items.png --size 12x12 \
    cafe.png colada.png cazuela.png croqueta.png coin.png paper.png star.png
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/heart.png --size 8x8 \
    heart.png heart-empty.png
```

`paper.png` sale del archivo del jefe ([03-jefe-guantanamo.md](03-jefe-guantanamo.md)).
El orden tiene que coincidir con `ITEM_FRAMES` en `src/systems/Textures.ts`.
