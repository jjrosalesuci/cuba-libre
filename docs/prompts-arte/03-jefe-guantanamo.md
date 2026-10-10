# 3. Jefe 1: el Secretario Provincial

Tamaño en el juego: **40×48 px por frame**, 5 frames. Chat nuevo.
Es un funcionario **inventado y genérico**, no una persona real.

## 3.1 Hoja de referencia

```
[ESTILO]

Character reference sheet for a comedic boss in a retro platformer: a chubby middle-aged
bureaucrat with a big round belly, wearing a white guayabera shirt (pleated Cuban shirt with
four pockets and vertical pleats), dark gray trousers, black shoes.
Balding head with gray hair on the sides, gray mustache, rosy cheeks, sweating heavily
(light blue sweat drops), a fat cigar in his mouth with a small orange ember and a puff of smoke.
Pompous, self-important expression. Short and wide proportions, cartoonish.
Show him three times: front view, side view facing right, back view.
Plain magenta background (#FF00FF). No text, no flags, no real person likeness.
```

## 3.2 Poses

Empieza cada prompt con:

```
[ESTILO]
Same chubby bureaucrat in a white guayabera as the reference image. Single pose,
side view facing right, full body, magenta background.
```

| Archivo | Línea a agregar |
|---|---|
| `idle.png` | `Standing proudly with hands on his belly, cigar in mouth, sweating.` |
| `idle2.png` | `Same as standing pose but breathing out: belly slightly lower, an extra sweat drop.` |
| `throw.png` | `Throwing a stack of papers overhead with one arm raised high, papers flying.` |
| `charge.png` | `Charging forward like a bull, leaning forward, both arms stretched ahead, determined face.` |
| `tired.png` | `Exhausted and dizzy after crashing into a wall: slumped, arms hanging, eyes shut, tongue out, lots of sweat. No cigar.` |

## 3.3 Proyectil

| Archivo | Prompt |
|---|---|
| `paper.png` (12×12) | `[ESTILO] A small stack of white paper sheets with gray text lines and a red header stripe, like a long boring speech, slightly fanned out. No readable text. Magenta background.` |

## Convertir

```bash
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/boss.png --size 40x48 \
    idle.png idle2.png throw.png charge.png tired.png
```
