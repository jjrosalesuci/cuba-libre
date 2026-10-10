# Prompts de arte — "De Oriente a Punto Cero"

Prompts para generar el arte del juego con **ChatGPT** (generador de imágenes). Están en
inglés porque así responde mejor; las notas van en español.

## Orden recomendado

| # | Archivo | Qué sale | Tamaño final en el juego |
|---|---|---|---|
| 0 | [00-estilo.md](00-estilo.md) | Bloque de estilo que se pega en cada prompt | — |
| 1 | [01-heroe.md](01-heroe.md) | Protagonista: hoja de referencia + 10 poses | 24×24 por frame |
| 2 | [02-guardias.md](02-guardias.md) | Guardia patrullero y guardia del silbato | 24×24 por frame |
| 3 | [03-jefe-guantanamo.md](03-jefe-guantanamo.md) | El Secretario Provincial (jefe 1) | 40×48 por frame |
| 4 | [04-vecinos.md](04-vecinos.md) | Vecinos con cazuelas | 24×24 por frame |
| 5 | [05-items.md](05-items.md) | Café, colada, cazuela, croqueta, moneda, papeles, estrella | 12×12 |
| 6 | [06-escenografia.md](06-escenografia.md) | Tiles, camión, refri, bandera, cartel, casa, sede del PCC | varios |
| 7 | [07-fondos.md](07-fondos.md) | Fondos de parallax (montañas, pueblo, base militar) | 320×90 / 320×70 |
| 8 | [08-pantallas.md](08-pantallas.md) | Pantalla de título y arte promocional | 320×180 |

## Cómo trabajar en ChatGPT

1. **Abre un chat nuevo por personaje** y no lo cierres: ChatGPT recuerda la imagen anterior y así
   el diseño se mantiene igual en todas las poses.
2. Primero pide la **hoja de referencia** del personaje. Cuando te guste, pide las poses **una por una**
   con los prompts de "pose" (empiezan con *"Same character as the reference image…"*).
3. Si una pose cambia el diseño (otro pelo, otros colores), dile:
   > Keep the exact same design as the reference sheet: same colors, same proportions, same stick. Only change the pose.
4. Descarga cada imagen en PNG con el nombre que indica cada archivo (`idle.png`, `runA.png`…).
5. Conviértelas al tamaño del juego con el script:

   ```bash
   tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/hero.png --size 24x24 \
       idle.png runA.png runB.png runC.png jump.png windup.png swing.png airSwing.png down.png hurt.png
   ```

6. Retoca en Aseprite o LibreSprite (alinear los pies en la misma fila, limpiar píxeles sueltos).

## Reglas que ya incluyen los prompts (no las quites)

- **Fondo magenta plano (#FF00FF).** El script borra ese color. Con fondo blanco se borra la camiseta del héroe y la guayabera del jefe.
- **Mirando a la derecha, vista lateral.** El juego voltea el sprite solo cuando camina a la izquierda.
- **Un solo personaje por imagen, de cuerpo entero, con los pies tocando el borde de abajo del área.**
- **Sin texto, sin sombra en el piso, sin degradados ni antialiasing.**
- Tono **caricaturesco y sin sangre**.
- Los jefes son **funcionarios genéricos inventados**: no pidas que se parezcan a ninguna persona real (ChatGPT lo rechaza y además no hace falta).

## Si ChatGPT rechaza un prompt

Suaviza las palabras de combate: usa *"bonks"*, *"knocks out"*, *"defeats"* en vez de *"attacks"* o *"kills"*,
y quita referencias políticas explícitas de la imagen (el contexto está en el juego, no en el sprite).
