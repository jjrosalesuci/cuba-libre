# "De Oriente a Punto Cero" — Requerimientos del juego

## Contexto
El guion original es para un video en pixel art generado con Veo. Ahora se quiere convertir en un **juego jugable**: plataformas 2D de scroll lateral, estilo SNES 16-bit, caricaturesco y sin sangre. El protagonista avanza provincia por provincia de oriente (Guantánamo) a occidente (La Habana / Punto Cero).

Decisiones tomadas:
- **Plataforma:** Web, **Phaser 3 + TypeScript** (Vite como bundler).
- **Alcance v1:** *vertical slice* = Intro + Guantánamo completo (escenas 0–3, con boss) jugable y pulido. El resto de provincias queda en fases siguientes.
- **Assets:** generados con IA (Imagen / Veo en AI Studio) y procesados a pixel art. Mientras tanto, placeholders.

El directorio `D:\game` está vacío: el proyecto empieza desde cero.

---

## 1. Requerimientos funcionales

### 1.1 Flujo de pantallas
| Escena Phaser | Contenido |
|---|---|
| `BootScene` | Carga mínima, barra de progreso |
| `PreloadScene` | Carga de sprites, tilemaps, audio |
| `TitleScene` | Mapa de Cuba de noche, camino rojo que se enciende de este a oeste, título "DE ORIENTE A PUNTO CERO", "PRESIONA START" parpadeando, silueta del héroe en la loma |
| `MapScene` | Mapa de Cuba entre niveles; provincias liberadas en color, la actual parpadeando |
| `LevelScene` (genérica) | Recibe la config del nivel (tilemap, fondo, enemigos, boss) |
| `BossScene` / fase boss dentro del nivel | Arena cerrada con barra de vida del jefe |
| `DialogScene` (overlay) | Cajas de texto estilo RPG ("¡Se acabó, asere! Hoy arrancamos.") |
| `PauseScene` (overlay) | Continuar / Reiniciar nivel / Volver al mapa / Volumen |
| `GameOverScene` | "SE TE ACABÓ EL CAFÉ" → Continuar / Salir |
| `LevelClearScene` | "PROVINCIA LIBERADA", gente con banderas, puntaje |
| `EndingScene` + créditos | (fase final) Amanecer, luces que vuelven, "CUBA LIBRE – FIN" |

### 1.2 Protagonista
- Mulato cubano ~30 años, pelo rizo corto, camiseta blanca sin mangas, short azul, chancletas, palo de madera. **Mismo diseño en todo el juego.**
- Movimiento: caminar, correr, saltar (salto variable según duración del botón), *coyote time* (~100 ms) y *jump buffer* (~100 ms).
- Ataque: palo — golpe básico (combo de 3), golpe en el aire, golpe hacia abajo (rebote sobre enemigos).
- Vida: barra de 6 puntos en el HUD; invencibilidad + parpadeo 1 s tras recibir daño; *knockback*.
- Vidas: 3; al perderlas → Game Over con opción de continuar desde el inicio del nivel.
- Checkpoints: bandera cubana a mitad de nivel.

### 1.3 Enemigos (todos caricaturescos; al vencerlos parpadean y desaparecen en un "puf" de píxeles)
| Tipo | Comportamiento |
|---|---|
| Guardia patrullero (uniforme verde olivo, gorra) | Camina entre dos puntos, golpe cuerpo a cuerpo al acercarse |
| Guardia con silbato | Detecta al héroe y llama a otro guardia |
| Guardia en camión soviético | Sale del camión; el camión es obstáculo/plataforma |
| (fases futuras) reflectores, jeeps, lanchas, tren | Ver tabla de provincias §5 |

Parámetros configurables por enemigo en JSON: vida, velocidad, daño, rango de detección, puntos.

### 1.4 Jefes
- Funcionario gordito en guayabera blanca, sudando, con tabaco.
- **Boss Guantánamo (sede provincial del PCC):** edificio de 2 pisos con banderola roja. Lanza pilas de papeles "DISCURSOS" en arco; patrón de 3 fases (lanza papeles → baja a cargar → se cansa y queda vulnerable). Al vencerlo gira y desaparece en humo.
- Barra de vida del jefe visible en la parte inferior/superior durante el combate.
- Al terminar: texto "PROVINCIA LIBERADA" + vecinos aplaudiendo con banderas.

### 1.5 Power-ups e ítems
| Ítem | Efecto |
|---|---|
| Café cubano (tacita) | Recupera 2 de vida |
| Colada (termo) | Recupera toda la vida |
| Cazuela | Escudo temporal (bloquea 1 golpe) |
| Pan con croqueta | +1 vida extra (raro) |
| Monedas / "CUC" | Puntaje |

### 1.6 HUD
- Arriba: barra de vida, vidas, puntaje, nombre del nivel.
- Durante jefe: barra de vida del jefe.
- Fuente pixel con soporte de tildes y ñ (á, é, í, ó, ú, ñ, ¡, ¿).

### 1.7 Controles
- Teclado: ←/→ (o A/D) mover, Z/Espacio saltar, X/J atacar, Enter pausa/start.
- Gamepad (API de Gamepad del navegador, mando estándar).
- Táctil en móvil: D-pad virtual + botones A/B (fase 2, pero la arquitectura de input debe abstraerlo desde el día 1).

### 1.8 Persistencia
- `localStorage` (con try/catch): provincias liberadas, mejor puntaje, opciones de volumen.

---

## 2. Requerimientos no funcionales
- Resolución lógica **320×180** (16:9), escalado entero (*pixel-perfect*, `pixelArt: true`, `roundPixels: true`).
- 60 FPS estables en laptop media y en Chrome Android de gama media.
- Física: Phaser Arcade Physics (suficiente para plataformas).
- Idioma: español cubano en todos los textos; textos centralizados en `src/i18n/es.json` para poder traducir después.
- Tono: caricaturesco, sin sangre ni muertes explícitas (requisito de diseño y para publicar en portales web).
- Tamaño de descarga inicial < 15 MB para el vertical slice.

---

## 3. Arquitectura técnica

```
D:\game
├─ index.html
├─ package.json            (phaser, typescript, vite)
├─ vite.config.ts
├─ tsconfig.json
├─ public/assets/
│  ├─ sprites/   (hero.png + hero.json atlas, enemies, bosses, items)
│  ├─ tilesets/  (guantanamo.png)
│  ├─ maps/      (level1-1.json … exportados de Tiled)
│  ├─ bg/        (capas de parallax por nivel)
│  ├─ audio/     (música .ogg/.mp3, sfx)
│  └─ fonts/     (fuente bitmap pixel)
├─ src/
│  ├─ main.ts               (config de Phaser)
│  ├─ scenes/               (Boot, Preload, Title, Map, Level, Dialog, Pause, GameOver, LevelClear)
│  ├─ entities/             (Hero, Enemy base + subclases, Boss base + BossGuantanamo, Pickup)
│  ├─ systems/              (InputManager, Combat/Hitbox, Camera, Parallax, AudioManager, SaveManager)
│  ├─ ui/                   (HUD, DialogBox, BossBar)
│  ├─ data/levels.ts        (config de cada provincia: mapa, fondo, música, enemigos, jefe)
│  └─ i18n/es.json
└─ tools/
   └─ pixelize.py           (pipeline de assets IA → pixel art, ver §4)
```

Claves:
- **Niveles data-driven:** cada provincia es una entrada en `levels.ts` + un tilemap de Tiled. Agregar una provincia no debe requerir código nuevo salvo enemigos/jefes nuevos.
- **Tiled** para diseñar mapas; capas: `ground`, `platforms` (one-way), `hazards`, objetos `spawn_enemy`, `pickup`, `checkpoint`, `boss_trigger`.
- **Combate por hitboxes:** el palo genera un hitbox temporal durante frames activos de la animación.
- **Máquina de estados** simple para héroe, enemigos y jefes (idle/run/jump/attack/hurt/dead).

---

## 4. Pipeline de assets con IA

Veo genera video, no sprites; Imagen genera imágenes "pixel-art-looking" que no están en una cuadrícula real. Se necesita un paso de limpieza:

1. **Hoja de personaje de referencia** en Imagen (héroe, guardia, jefe) con el bloque de estilo del guion, fondo plano, vista lateral.
2. **Poses por separado** (idle, correr ×6, saltar, atacar ×3, daño) usando la imagen de referencia para consistencia.
3. **`tools/pixelize.py`** (Pillow): quitar fondo → reducir a tamaño objetivo (héroe 32×32, jefe 64×64) con *nearest neighbor* → cuantizar a paleta fija (≤32 colores) → armar spritesheet + JSON de atlas.
4. **Retoque manual** en Aseprite/Libresprite (alinear pies, limpiar píxeles sueltos). *Esto es inevitable para que se vea bien.*
5. **Fondos de parallax**: Imagen genera 3 capas (cielo, montañas, pueblo) por provincia → mismo script, ancho repetible (tileable).
6. **Clips de Veo**: se reutilizan como cinemáticas (intro, entre provincias, final) reproducidas como video en Phaser.
7. **Audio**: música chiptune salsa/son en loop (herramienta de música IA o tracker tipo FamiTracker/BeepBox); efectos con jsfxr. El audio de Veo sirve para las cinemáticas, no para loops.
8. Mientras no esté el arte final: **placeholders** de rectángulos de color con el tamaño correcto, para no bloquear el desarrollo.

---

## 5. Contenido por fases

**Fase 1 – Vertical slice (v1)**
- Título (escena 0), Mapa, Nivel 1-1 "El despertar" (casa en apagón, calle con cacerolazo, pueblo con palmas), Nivel 1-2 "Primera base militar" (barriles, camiones soviéticos, power-up café), 1-3 Boss sede del PCC.
- Héroe completo, 3 tipos de guardia, 1 jefe, 4 ítems, HUD, pausa, game over, guardado.

**Fase 2 – Oriente y centro** (un nivel + jefe por provincia; mecánica nueva en cada una)
| # | Provincia | Mecánica nueva |
|---|---|---|
| 4 | Santiago de Cuba | Calles en cuesta; boss con conga detrás |
| 5 | Granma | Guardias que salen de la caña |
| 6 | Holguín | Escaleras/plataformas verticales (Loma de la Cruz) |
| 7 | Las Tunas | Jeeps que cruzan y hay que saltar |
| 8 | Camagüey | Laberinto de callejones; tinajones como plataformas |
| 9 | Ciego de Ávila | Sigilo: torres y reflectores |
| 10 | Sancti Spíritus / Trinidad | Recorrido por techos coloniales |
| 11 | Villa Clara | Tren blindado como plataforma móvil |
| 12 | Cienfuegos | Saltos entre lanchas patrulleras |
| 13 | Matanzas / Mayabeque | Puentes y cuevas; seguidores con palos y cazuelas (ayudantes NPC) |

**Fase 3 – Occidente y final**
- 14 Pinar del Río (mogotes de Viñales, mini-boss en tractor), 15 La Habana (Malecón, techos de Centro Habana, Capitolio, oleadas), 16 Punto Cero (jefe final multifase en trono de libretas, rayos de "propaganda"), 17 Final + créditos.
- Controles táctiles, ajustes de dificultad, empaquetado PWA.

---

## 6. Criterios de aceptación del vertical slice
- Se puede jugar de la pantalla de título hasta "PROVINCIA LIBERADA" de Guantánamo sin errores en consola.
- Controles responden con teclado y gamepad; salto con coyote time y buffer se siente justo.
- El jefe tiene 3 fases distinguibles y se puede vencer sin recibir daño (patrón aprendible).
- Al recargar la página, Guantánamo aparece liberado en el mapa.
- Rendimiento ≥ 55 FPS en Chrome escritorio con el panel de rendimiento abierto.
- Todos los textos en español con tildes visibles correctamente.

---

## 7. Verificación
1. `npm install` y `npm run dev` → abrir `http://localhost:5173`.
2. Recorrido manual completo del vertical slice (título → mapa → 1-1 → 1-2 → boss → liberada → mapa).
3. `npm run build` sin errores de TypeScript; probar `npm run preview`.
4. Probar en móvil (Chrome Android) vía red local para medir FPS.
5. Revisar con la skill `run` / Chrome automatizado para capturas de cada escena.

---

## 8. Siguiente paso de implementación (al aprobar)
1. Scaffold Vite + Phaser 3 + TypeScript en `D:\game`.
2. Escenas Boot/Preload/Title con placeholders.
3. Héroe con física y controles + nivel de prueba en Tiled.
4. Enemigos, combate, HUD, ítems.
5. Boss Guantánamo y flujo LevelClear/Map/guardado.
6. Script `tools/pixelize.py` y primeros sprites generados por IA.

---

## 9. Estado de implementación (vertical slice)

Implementado y probado en Chrome: título, mapa, Guantánamo 1-1, 1-2 y 1-3 (jefe), pausa, game over,
"provincia liberada" y guardado en `localStorage`. Build de producción: ~1.5 MB.

Diferencias con el plan original:
- Los niveles se definen con `MapBuilder` (cuadrícula de caracteres) en `src/data/levels.ts` en lugar de Tiled;
  la escena ya trabaja sobre una cuadrícula de tiles + objetos, así que importar mapas de Tiled más adelante no cambia `LevelScene`.
- El diálogo es un componente (`ui/DialogBox.ts`) dentro de `LevelScene` y el jefe vive en la misma escena del nivel,
  no en escenas separadas.
- Arte y audio son placeholders generados por código (mismos tamaños y orden de frames que tendrá el arte final).
- Balance del jefe tras las pruebas: 18 de vida, fases en 12/6, invulnerabilidad corta entre golpes,
  el salto de regreso al balcón no hace daño y la embestida se esquiva saltando hacia él.

Pendiente de fase 1: controles táctiles (la abstracción de input ya admite `virtual`), arte final con IA, música final.
