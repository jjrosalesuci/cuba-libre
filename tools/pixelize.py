"""
Pipeline de assets IA -> pixel art para "De Oriente a Punto Cero".

Convierte imágenes generadas con Imagen/Veo (que "parecen" pixel art pero no
están en una cuadrícula real) en sprites listos para Phaser:

  1. quita el fondo plano (flood fill desde las esquinas)
  2. recorta al contenido
  3. reduce al tamaño del frame con vecino más cercano (sin suavizado)
  4. cuantiza a una paleta fija de pocos colores
  5. une varios frames en una tira horizontal + atlas JSON

Uso:
  # un sprite suelto
  python tools/pixelize.py sprite entrada.png salida.png --size 24x24

  # una tira de animación (el orden de las entradas = orden de frames)
  python tools/pixelize.py sheet public/assets/sprites/hero.png --size 24x24 \
      idle.png runA.png runB.png runC.png jump.png windup.png swing.png airSwing.png down.png hurt.png

  # un fondo de parallax repetible
  python tools/pixelize.py background montañas.png public/assets/bg/mountains.png --size 320x90

El orden de frames que espera el juego está en src/systems/Textures.ts
(HERO_FRAMES, GUARD_FRAMES, BOSS_FRAMES, ITEM_FRAMES).
Siempre conviene un retoque final en Aseprite/LibreSprite.

IMPORTANTE: pide a Imagen los personajes sobre un fondo plano MAGENTA (#ff00ff)
("on a solid flat magenta background"). Con fondo blanco, la camiseta blanca
del héroe o la guayabera del jefe se confunden con el fondo y se borran.
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image

# Paleta base del juego (ver PAL en src/config.ts). Se puede ampliar con --extra.
PALETTE_HEX = [
    "0b0b12", "f4f1e8", "a5653c", "7a4527", "d9a273", "24150c", "f2f2f2", "c9c9d4",
    "2a5bd7", "1b3d99", "f0c23a", "8b5a2b", "5c3a1a", "5b6b2f", "3c4720", "7b8c43",
    "1d1a16", "d42a2a", "8f1414", "1f4fbf", "f5d142", "8a8a96", "55555f", "c4c4cc",
    "6b4423", "a0703a", "6e4b25", "3f9a3a", "2a6b27", "9c9ca4", "6c6c76", "7fd3ff",
]


def parse_size(s: str) -> tuple[int, int]:
    w, h = s.lower().split("x")
    return int(w), int(h)


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def remove_background(img: Image.Image, tolerance: int) -> Image.Image:
    """Hace transparente la región de color plano conectada a las esquinas."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for c in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        q.append(c)
    ref = px[0, 0][:3]

    def close(c: tuple[int, int, int, int]) -> bool:
        return sum(abs(c[i] - ref[i]) for i in range(3)) <= tolerance

    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not close(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    return img


def fit(img: Image.Image, size: tuple[int, int], anchor_bottom: bool) -> Image.Image:
    """Escala manteniendo proporción y centra (apoyado abajo para personajes)."""
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    tw, th = size
    scale = min(tw / img.width, th / img.height)
    nw, nh = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    # primero reducir con BOX a 4x y luego NEAREST: evita perder detalles finos
    mid = img.resize((nw * 4, nh * 4), Image.BOX)
    small = mid.resize((nw, nh), Image.NEAREST)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    ox = (tw - nw) // 2
    oy = th - nh if anchor_bottom else (th - nh) // 2
    out.paste(small, (ox, oy), small)
    return out


def quantize(img: Image.Image, palette: list[tuple[int, int, int]], alpha_cut: int = 128) -> Image.Image:
    """Mapea cada píxel al color más cercano de la paleta; alfa binario."""
    img = img.convert("RGBA")
    px = img.load()
    cache: dict[tuple[int, int, int], tuple[int, int, int]] = {}
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a < alpha_cut:
                px[x, y] = (0, 0, 0, 0)
                continue
            key = (r, g, b)
            if key not in cache:
                cache[key] = min(palette, key=lambda p: (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2)
            px[x, y] = (*cache[key], 255)
    return img


def process(path: Path, size: tuple[int, int], args: argparse.Namespace, anchor_bottom: bool = True) -> Image.Image:
    img = Image.open(path)
    if not args.keep_bg:
        img = remove_background(img, args.tolerance)
    img = fit(img, size, anchor_bottom)
    palette = [hex_to_rgb(h) for h in PALETTE_HEX + (args.extra or [])]
    return quantize(img, palette)


def cmd_sprite(args: argparse.Namespace) -> None:
    out = process(Path(args.input), parse_size(args.size), args)
    out.save(args.output)
    print(f"ok: {args.output} {out.size}")


def cmd_sheet(args: argparse.Namespace) -> None:
    fw, fh = parse_size(args.size)
    frames = [process(Path(p), (fw, fh), args) for p in args.inputs]
    sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
    atlas = {"frames": {}, "meta": {"image": Path(args.output).name, "size": {"w": sheet.width, "h": fh}, "scale": "1"}}
    for i, (f, src) in enumerate(zip(frames, args.inputs)):
        sheet.paste(f, (i * fw, 0))
        atlas["frames"][str(i)] = {
            "frame": {"x": i * fw, "y": 0, "w": fw, "h": fh},
            "sourceSize": {"w": fw, "h": fh},
            "spriteSourceSize": {"x": 0, "y": 0, "w": fw, "h": fh},
            "source": Path(src).name,
        }
    sheet.save(args.output)
    Path(args.output).with_suffix(".json").write_text(json.dumps(atlas, indent=2), encoding="utf-8")
    print(f"ok: {args.output} ({len(frames)} frames de {fw}x{fh}) + atlas JSON")


def cmd_background(args: argparse.Namespace) -> None:
    w, h = parse_size(args.size)
    img = Image.open(args.input).convert("RGBA")
    # recorta al aspecto pedido y reduce; sin quitar fondo (es un fondo)
    target = w / h
    if img.width / img.height > target:
        nw = round(img.height * target)
        img = img.crop(((img.width - nw) // 2, 0, (img.width - nw) // 2 + nw, img.height))
    else:
        nh = round(img.width / target)
        img = img.crop((0, img.height - nh, img.width, img.height))
    img = img.resize((w * 4, h * 4), Image.BOX).resize((w, h), Image.NEAREST)
    palette = [hex_to_rgb(x) for x in PALETTE_HEX + (args.extra or [])]
    out = quantize(img, palette)
    if args.tileable:
        # mezcla los bordes para que el TileSprite no tenga costura
        blend = max(4, w // 16)
        px = out.load()
        for y in range(h):
            for i in range(blend):
                if i % 2 == 0:
                    px[w - blend + i, y] = px[i, y]
    out.save(args.output)
    print(f"ok: {args.output} {out.size}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(required=True)

    def common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--size", required=True, help="tamaño del frame, p. ej. 24x24")
        p.add_argument("--tolerance", type=int, default=30, help="tolerancia para quitar el fondo (0-765)")
        p.add_argument("--keep-bg", action="store_true", help="no quitar el fondo")
        p.add_argument("--extra", nargs="*", help="colores extra de paleta en hex")

    p = sub.add_parser("sprite", help="un sprite suelto")
    p.add_argument("input")
    p.add_argument("output")
    common(p)
    p.set_defaults(fn=cmd_sprite)

    p = sub.add_parser("sheet", help="tira de animación + atlas JSON")
    p.add_argument("output")
    p.add_argument("inputs", nargs="+")
    common(p)
    p.set_defaults(fn=cmd_sheet)

    p = sub.add_parser("background", help="fondo de parallax")
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--tileable", action="store_true", help="suaviza la costura para repetirlo")
    common(p)
    p.set_defaults(fn=cmd_background)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
