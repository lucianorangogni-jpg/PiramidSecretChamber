# Especificación Técnica: [US-024] Paredes Movedizas Temporizadas (5s) de Altura Completa y Activadores Dobles para Tesoros

**Autor:** @architect (Game Designer Técnico / Analista Funcional)  
**Fecha:** 2026-10-25  
**Estado:** ESPECIFICACIÓN APROBADA Y ACTUALIZADA  
**Componentes Asociados:**  
- `src/entities/MovingWall.ts`  
- `src/grid/ChamberMovingWalls.ts`  
- `src/graphics/MovingWallGraphics.ts`  
- `src/scenes/GameScene.ts`  
- `src/grid/ChamberTreasures.ts`  
- `tests/entities/MovingWall.test.ts`  

---

## 1. Visión y Objetivos

Incorporar un sistema de puzles arquitectónicos ancestrales en las 10 recámaras de la pirámide:
1. **Pared Movediza por cada Tesoro de Altura Completa:**
   - Cada uno de los 2 tesoros de cada recámara se encuentra resguardado tras una **Pared Movediza de Piedra** (`MovingWall`).
   - La pared se extiende verticalmente desde el suelo de la plataforma (`gridY`) hasta la base de la plataforma superior o techo (`topGridY`), formando una columna megalítica que sella completamente el pasillo y previene saltar por encima.
   - Cuando la pared está cerrada, todos sus tiles actúan como muros impenetrables (`SolidWall`), bloqueando el acceso al cofre.
2. **Temporizador de Desplazamiento (5 Segundos):**
   - Al pisar un activador de suelo, la pared se desplaza (se retrae verticalmente hacia el techo) durante **5 segundos** (300 frames a 60 FPS), transformando la columna en espacio transitable (`Empty`).
   - Durante este tiempo, el arqueólogo puede cruzar y saquear el tesoro.
   - Al expirar los 5 segundos, la pared desciende y vuelve a sellar el paso.
3. **Activadores Dobles (Exterior e Interior - Anti-Softlock):**
   - Para evitar bloqueos permanentes (*softlocks*), cada pared movediza dispone obligatoriamente de **dos activadores de suelo**:
     - **Activador Exterior:** Situado en el camino de aproximación a la pared.
     - **Activador Interior:** Situado dentro del cubículo del tesoro. Si la pared se cierra mientras el jugador está dentro saqueando el cofre, pisar el activador interior reactiva la apertura por otros 5 segundos, permitiendo salir con total seguridad.
4. **Seguridad en el Umbral (Anti-Crush / Anti-Stuck):**
   - Si los 5 segundos expiran mientras el jugador se encuentra físicamente cruzando la columna de la pared, el cierre se pospone hasta que el jugador abandone la columna del muro (hacia adentro o hacia afuera), evitando que quede atrapado dentro de tiles sólidos.
5. **Reinicio Determinista:**
   - Al pulsar [R] o cambiar de recámara, las paredes se restablecen a su estado inicial cerrado y sus temporizadores se reinician.

---

## 2. Parámetros y Constantes

- **Duración de Apertura:** `TIMER_SECONDS = 5` segundos (`TIMER_FRAMES = 300` frames a 60 FPS).
- **Dimensiones de Celda:** `32 x 32` px.
- **Altura de Pared:** Variable entre 2 y 5 tiles (`heightInTiles = gridY - topGridY + 1`), llegando exactamente hasta el suelo de la plataforma superior o techo.
- **Velocidad de Desplazamiento Visual:** Animación tween de elevación y desvanecimiento vertical en 250 ms.
- **Tolerancia de Activación:** Detección de contacto AABB con la placa de presión rúnica (hitbox de 28x32 px).

---

## 3. Catálogo de Paredes y Activadores por Recámara (`ChamberMovingWalls.ts`)

En cada una de las 10 recámaras se configuran 2 paredes movedizas con sus respectivos activadores:
- **Cámara del Suelo (Nivel 0):**
  - Muro movedizo: `gridX = 15, gridY = 13`
  - Altura vertical: Se extiende hasta la plataforma del Nivel 1 (`topGridY = 10` en Chambers 1, 3, 10; `topGridY = 11` en Chambers 2, 4; `topGridY = 12` en Chambers 5 a 9).
  - Activador exterior: `(13, 13)`
  - Activador interior: `(16, 13)`
  - Tesoro 1: `(17, 13)`
- **Cámara Superior (Nivel 2):**
  - En recámaras con bóveda en el lado izquierdo (Chambers 1, 3, 10):
    - Muro movedizo: `(4, 4)` con `topGridY = 1` (hasta el techo)
    - Activador exterior: `(6, 4)`
    - Activador interior: `(3, 4)`
    - Tesoro 2: `(2, 4)`
  - En recámaras con bóveda en el lado derecho:
    - Chambers 2, 4: Muro movedizo `(15, 5)` con `topGridY = 1` (hasta el techo), activador exterior `(14, 5)`, activador interior `(16, 5)`, tesoro `(17, 5)`.
    - Chambers 5, 6, 7: Muro movedizo `(15, 7)` con `topGridY = 5` (hasta plataforma Nivel 3 en row 4), activador exterior `(13, 7)`, activador interior `(16, 7)`, tesoro `(17, 7)`.
    - Chambers 8, 9: Muro movedizo `(15, 7)` con `topGridY = 6` (hasta plataforma Nivel 3 en row 5), activador exterior `(13, 7)`, activador interior `(16, 7)`, tesoro `(17, 7)`.

---

## 4. Criterios de Aceptación (QA)

1. Al iniciar la recámara, las 2 paredes movedizas están cerradas y son columnas sólidas hasta la plataforma superior; el jugador no puede atravesarlas ni saltar por encima.
2. Al pisar el activador exterior, la pared correspondiente se abre y toda la columna se vuelve transitable.
3. Se inicia una cuenta regresiva de 5 segundos (300 frames).
4. Mientras la pared está abierta, el jugador puede cruzar y recolectar el tesoro.
5. Al cumplirse los 5 segundos (y estando el jugador fuera del umbral), la pared se cierra de nuevo volviendo a ser sólida.
6. Si el jugador queda del lado interior con la pared cerrada, pisar el activador interior abre nuevamente la pared por 5 segundos, permitiendo salir sin quedar atrapado.
7. Al reiniciar con [R], las paredes vuelven a cerrarse y los temporizadores se reinician.
8. Pruebas unitarias automatizadas (`npm test`) validan la máquina de estados, el temporizador de 5 segundos, la altura vertical hasta la plataforma superior, la activación por ambos lados y la ausencia de softlocks.
9. Compilación limpia (`npm run build-nolog`) con 0 errores.
