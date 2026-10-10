# 2. Guardias

Tamaño en el juego: **24×24 px por frame**, 5 frames por tipo. Un chat para los dos tipos.

## 2.1 Hoja de referencia

```
[ESTILO]

Character reference sheet for a generic enemy soldier in a cartoon retro platformer.
A slightly clumsy, stocky soldier in an olive-green military uniform with a matching olive-green
soft cap with a short brim, black boots, a black belt with a small yellow buckle.
Light tan skin, thick black mustache, grumpy but goofy expression. Unarmed (fights with fists).
Show the same character three times: front view, side view facing right, back view.
Plain magenta background (#FF00FF). No text, no insignia, no flags, no weapons.
```

## 2.2 Poses del guardia patrullero

Empieza cada prompt con:

```
[ESTILO]
Same soldier as the reference image. Single pose, side view facing right, full body, magenta background.
```

| Archivo | Línea a agregar |
|---|---|
| `walkA.png` | `Walking, left leg forward, arms swinging.` |
| `walkB.png` | `Walking, legs together mid-step, arms at sides.` |
| `windup.png` | `Pulling his fist back, getting ready to punch, angry face.` |
| `punch.png` | `Throwing a straight punch forward, arm fully extended.` |
| `hurt.png` | `Knocked back, arms flailing up, dizzy cartoon face with eyes shut.` |

## 2.3 Guardia del silbato (variante)

Mismo chat. Primero:

```
[ESTILO]
Same soldier as the reference image, but with a red band around his cap and a yellow whistle
in his mouth. Side view facing right, standing, magenta background.
```

Luego repite las 5 poses de arriba agregando: `He has the red cap band and the yellow whistle.`
Guárdalas como `w-walkA.png`, `w-walkB.png`, `w-windup.png`, `w-punch.png`, `w-hurt.png`.

## Convertir

```bash
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/guard.png --size 24x24 \
    walkA.png walkB.png windup.png punch.png hurt.png
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/guard-whistle.png --size 24x24 \
    w-walkA.png w-walkB.png w-windup.png w-punch.png w-hurt.png
```
