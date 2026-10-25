# Especificación Técnica: [US-021] Enemigos Momia (Mummies): Patrulla, Salto Evasivo y Letalidad por Contacto

**Autor:** @architect (Game Designer Técnico / Analista Funcional)  
**Fecha:** 2026-10-23  
**Estado:** ESPECIFICACIÓN APROBADA  
**Componentes Asociados:**  
- `src/entities/Mummy.ts`  
- `src/entities/MummyConstants.ts`  
- `src/graphics/MummyGraphics.ts`  
- `src/grid/ChamberMummies.ts`  
- `src/scenes/GameScene.ts`  
- `tests/entities/Mummy.test.ts`  

---

## 1. Visión y Objetivos

Incorporar las momias patrulleras ancestrales en las recámaras de la pirámide:
1. **Velocidad Moderada (Arcade Pacing):** Se desplazan a velocidad inferior a la del arqueólogo (`Player.WALK_SPEED = 3.0` px/frame -> `Mummy.WALK_SPEED = 1.8` px/frame, ~60% de la velocidad del jugador).
2. **Patrulla Autónoma:** Recorren horizontalmente sus plataformas de izquierda a derecha. Al topar con un muro sólido o con el borde de la plataforma (hueco/vacío), invierten el sentido de su marcha de forma automática y determinista.
3. **Mecánica de Evasión por Salto:**
   - La momia tiene una altura de hitbox de `28 px` (base en suelo).
   - El arqueólogo alcanza una altura máxima de salto de `56 px`, proporcionando un margen de paso aéreo seguro de `~28 px` para sobrevolar a la momia limpiamente en pleno salto.
4. **Letalidad y Pérdida de Vida:**
   - Si la momia entra en contacto físico directo (intersección AABB) con el arqueólogo mientras este está con vida, el arqueólogo es eliminado inmediatamente (`player.eliminate()`), descontando 1 vida.
   - Se muestra el mensaje `"¡ELIMINADO! Presiona [R] para reintentar"`. Si las vidas llegan a 0, pasa a estado `GAME OVER`.
   - Contactos continuados durante la animación de eliminación no descuentan vidas múltiples.
5. **Reinicio y Restauración:**
   - Al pulsar [R] o cambiar de recámara, las momias se restauran a sus posiciones y orientaciones iniciales.

---

## 2. Parámetros y Constantes (`MummyConstants.ts`)

- `WALK_SPEED`: `1.8` px/frame (a 60 FPS).
- `HITBOX_WIDTH`: `24` px.
- `HITBOX_HEIGHT`: `28` px (con origen `(0.5, 1.0)` en la base de los pies).
- `ANIMATION_TICKS_PER_FRAME`: `12` frames para ciclo de caminata retro de 2 pasos.

---

## 3. Catálogo de Momias por Recámara (`ChamberMummies.ts`)

Ubicación en plataformas clave donde el jugador debe esquivarlas para alcanzar tesoros o la salida:
- **Recámara 1:** Plataforma Nivel 2 (fila 4, $Y = 160$ px), patrullando entre columnas 3 y 15 ($X \in [112, 480]$).
- **Recámara 2:** Plataforma Nivel 2 (fila 5, $Y = 192$ px), patrullando entre columnas 4 y 17 ($X \in [144, 544]$).
- **Recámaras 3 a 10:** Plataformas intermedias y superiores asignadas según la topología de la recámara.

---

## 4. Texturas Pixel-Art Procedurales (`MummyGraphics.ts`)

- Textura `32x32` con paleta de vendajes envejecidos (`#d8c6a0`, `#ad9a74`, `#705d3c`), ojos brillantes carmesí/dorados (`#ff2040`, `#ffec60`) y tiras de lino sueltas.
- Dos cuadros de marcha: `mummy_walk_1` y `mummy_walk_2`.

---

## 5. Criterios de Aceptación (QA)

1. La momia se mueve de manera autónoma a velocidad 1.8 px/frame.
2. La momia invierte su dirección al alcanzar el límite izquierdo o derecho de su plataforma.
3. El jugador puede saltar limpiamente sobre la momia en el ápice de su salto sin sufrir daño.
4. Si el jugador colisiona a pie o a ras de suelo con la momia, el jugador pierde exactamente 1 vida y entra en estado `Eliminated`.
5. Durante el estado de eliminación, no se descuentan vidas adicionales.
6. Al reiniciar con [R], la momia vuelve a su punto de spawn y orientación inicial.
7. Las pruebas unitarias automatizadas (`npm test`) validan la cinemática, colisiones y catálogo de momias.
8. La compilación de producción (`npm run build-nolog`) termina con 0 errores.

