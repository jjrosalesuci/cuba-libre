# 4. Vecinos con cazuelas

Tamaño en el juego: **24×24 px por frame**, 2 frames por vecino, 4 vecinos distintos.
Aparecen en la calle del nivel 1-1 (cacerolazo) y en la pantalla de "PROVINCIA LIBERADA".

## Hoja de referencia (un solo prompt para los 4)

```
[ESTILO]

Four different Cuban neighbors standing side by side, each one a separate full-body character
in side view facing right, evenly spaced:
1) a woman with dark hair in a bun, pink-red blouse, gray skirt, flip-flops;
2) an old man with gray hair, yellow shirt, gray pants, sandals;
3) a young man with brown hair, light blue t-shirt, gray shorts, flip-flops;
4) a woman with curly black hair, green blouse, gray pants, flip-flops.
Each one holds a metal cooking pot in one hand and a spoon in the other, cheerful protest mood.
Plain magenta background (#FF00FF), no text.
```

## Poses por vecino (mismo chat)

Para cada vecino N (1 a 4):

```
[ESTILO]
Same neighbor number N from the previous image, alone. Side view facing right, full body, magenta background.
```

| Archivo | Línea a agregar |
|---|---|
| `npcN-down.png` | `Holding the pot at waist height, spoon about to hit it.` |
| `npcN-up.png` | `Holding the pot raised above the head and banging it with the spoon, mouth open shouting happily.` |

## Convertir

```bash
for n in 0 1 2 3; do
  tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/npc$n.png --size 24x24 \
      npc$((n+1))-down.png npc$((n+1))-up.png
done
```
