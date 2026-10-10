# 9. Santiago de Cuba (niveles 2-1 y 2-2)

Usa el `[ESTILO]` de sprites de [00-estilo.md](00-estilo.md) (fondo magenta, mirando a la derecha).

## 9.1 Policía (enemigo, 24×24 por frame, 5 frames)

```
[ESTILO]
Character reference sheet for a cartoon Cuban street police officer enemy: light blue uniform shirt,
navy blue trousers, navy peaked cap with a black visor and a small yellow badge, black shoes,
black belt. He carries a black side-handle baton (tonfa). Brown skin, mustache, stern but goofy face.
Front view, side view facing right, back view. No text, no real insignia.
```

Poses (mismo chat, una por imagen), en este orden:
`walkA` caminando · `walkB` pasos juntos · `windup` tonfa levantada detrás de la cabeza ·
`punch` golpe de tonfa hacia adelante, brazo estirado · `hurt` empujado hacia atrás, ojos cerrados.

## 9.2 Oficial del MININT (jefe, 40×48 por frame, 5 frames)

Funcionario **inventado y genérico**, no una persona real.

```
[ESTILO]
Character reference sheet for a comedic boss: a stocky middle-aged security officer in an olive-green
military uniform with gold epaulets and a row of colorful medals, a peaked cap with a red band and a
gold emblem, dark aviator sunglasses, mustache, brown belt with a holster, black boots.
Smug, bossy attitude. Front view, side view facing right, back view. No text.
```

Poses: `idle` de pie con las manos atrás · `idle2` igual respirando · `command` señalando al frente
con un walkie-talkie en la otra mano · `walk` caminando nervioso · `hurt` golpeado, gafas torcidas.

## 9.3 Escenografía

| Archivo | Tamaño | Prompt |
|---|---|---|
| `car.png` | 48×22 | `[ESTILO] A 1950s American classic car (Cuban "almendrón"), bright red with chrome bumpers, whitewall tires and small tail fins. Side view facing right.` *(pide también azul, amarillo y verde)* |
| `kiosk.png` | 64×44 | `[ESTILO] A small Cuban street kiosk that sells guarapo (sugarcane juice): red and white striped awning, a green sign board left blank (no text), a wooden counter, a metal sugarcane press and glasses of green-yellow juice, some sugarcane stalks.` |
| `guarapo.png` | 12×12 | `[ESTILO] A single glass of green-yellow sugarcane juice with ice and a red straw, bold simple icon.` |
| `minint.png` | 176×128 | `[ESTILO de fondos] Front of a gray concrete government security building: rows of dark windows, a second-floor balcony with a railing in the center, a big dark double door at ground level, an empty dark blue sign board on top (no text), a radio antenna on the roof. Magenta sky around it.` |

## 9.4 Fondo de la ciudad (capa cercana, 320×70)

```
[ESTILO de fondos]
Parallax background layer of Santiago de Cuba: colorful two- and three-story colonial buildings
(yellow, teal, coral, lilac, cream, light blue) with wrought-iron balconies, tall windows with green
and blue shutters, red tile roofs and cornices, and a cream cathedral with two bell towers.
Seen straight from the front. Magenta (#FF00FF) sky above. Leave the bottom 15% as gray sidewalk.
The image must tile seamlessly horizontally.
```
