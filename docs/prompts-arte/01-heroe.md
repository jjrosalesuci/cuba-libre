# 1. Protagonista

Tamaño en el juego: **24×24 px por frame**, 10 frames. Chat nuevo solo para él.

## 1.1 Hoja de referencia (primer prompt)

```
[ESTILO]

Character reference sheet for the hero of a retro platformer.
A Cuban mixed-race (mulato) man in his 30s, slim and athletic, warm brown skin,
short tightly curly black hair, friendly determined face, small stubble.
Wears a plain white tank top, blue shorts and yellow flip-flops.
Holds a simple wooden broom stick (no broom head) about as tall as his chest.
Show the SAME character three times side by side: front view, side view facing right, back view.
Plain magenta background (#FF00FF). No text labels.
```

Cuando te guste, guarda esa imagen: es la referencia para todo lo demás.

## 1.2 Poses (un prompt por imagen, en el mismo chat)

Empieza cada uno con:

```
[ESTILO]
Same character as the reference image (same face, curly hair, white tank top, blue shorts,
yellow flip-flops, wooden stick). Single pose, side view facing right, full body, magenta background.
```

…y agrega la línea de la pose:

| Archivo | Línea a agregar |
|---|---|
| `idle.png` | `Standing relaxed, stick resting on his right shoulder, slight confident smile.` |
| `runA.png` | `Running, front leg stretched forward, back leg pushing off, stick on shoulder.` |
| `runB.png` | `Running, mid-stride, legs passing each other under the body, stick on shoulder.` |
| `runC.png` | `Running, opposite stride to the first run pose: back leg forward, front leg back, stick on shoulder.` |
| `jump.png` | `Jumping in the air, knees tucked up, stick on shoulder, flip-flops still on.` |
| `windup.png` | `Winding up an overhead swing: stick raised high behind his head with both hands.` |
| `swing.png` | `Swinging the stick horizontally forward at chest height, arm fully extended, motion pose.` |
| `airSwing.png` | `In mid-air, swinging the stick forward horizontally, legs tucked.` |
| `down.png` | `In mid-air, pointing the stick straight down below his feet like a pogo strike.` |
| `hurt.png` | `Knocked back from a hit, leaning backwards, eyes shut tight in a cartoon "ouch" face, legs apart.` |

## 1.3 Extras del héroe

| Archivo | Prompt |
|---|---|
| `head.png` (icono de vidas, 8×8) | `[ESTILO] Tiny icon of the same hero's head only (curly hair, brown skin), side view facing right, magenta background.` |
| `hero-title.png` (silueta del título) | `[ESTILO] The same hero standing on a hilltop with the stick raised high in victory, seen as a dark silhouette against a sunrise. Side view.` *(este va sin fondo magenta: deja el amanecer)* |

## Convertir

```bash
tools/.venv/Scripts/python tools/pixelize.py sheet public/assets/sprites/hero.png --size 24x24 \
    idle.png runA.png runB.png runC.png jump.png windup.png swing.png airSwing.png down.png hurt.png
tools/.venv/Scripts/python tools/pixelize.py sprite head.png public/assets/sprites/head.png --size 8x8
```

El orden de frames tiene que ser exactamente ese (ver `HERO_FRAMES` en `src/systems/Textures.ts`).
