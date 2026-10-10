# 0. Bloque de estilo

Pega este bloque **al inicio de cada prompt** (donde los demás archivos dicen `[ESTILO]`).

## Para personajes, ítems y objetos (sprites)

```
16-bit pixel art sprite in the style of SNES side-scrolling platformers (Super Mario World, Mega Man X).
Chunky visible pixels, as if a tiny low-resolution sprite was upscaled with nearest-neighbor.
Hard pixel edges, NO anti-aliasing, NO gradients, NO blur, NO soft shadows.
Limited palette of about 16 flat colors with one darker shade per color for shading.
1-pixel dark outline around the character.
Side view, facing RIGHT. Full body, centered, feet touching the bottom of the drawing area.
Plain solid flat MAGENTA background (#FF00FF), no floor, no shadow, no text, no border, no watermark.
Cartoonish and family-friendly, no blood.
Square image, 1024x1024.
```

## Para fondos y escenarios

```
16-bit pixel art background for a SNES side-scrolling platformer.
Chunky visible pixels, hard edges, NO anti-aliasing, NO gradients except banded (stepped) sky colors.
Limited palette, flat colors, parallax-layer style.
No characters, no text, no UI.
```

## Paleta del juego (opcional, para clavar los colores)

Si quieres que ChatGPT use exactamente los colores del juego, agrega:

```
Use only these colors: skin #A5653C (shade #7A4527), hair #24150C, white tank top #F2F2F2,
blue shorts #2A5BD7, yellow flip-flops #F0C23A, wooden stick #8B5A2B, olive green uniform #5B6B2F
(shade #3C4720), boots #1D1A16, red #D42A2A, yellow #F5D142, grays #8A8A96 / #C4C4CC, outline #0B0B12.
```
