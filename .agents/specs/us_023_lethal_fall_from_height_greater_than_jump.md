# Especificación Técnica: [US-023] Nueva Dificultad: Caída Letal por Altura Superior al Salto

**Autor:** @architect (Game Designer Técnico / Analista Funcional)  
**Fecha:** 2026-10-25  
**Estado:** ESPECIFICACIÓN APROBADA  
**Componentes Asociados:**  
- `src/entities/PlayerConstants.ts`  
- `src/entities/Player.ts`  
- `tests/entities/PlayerKinematics.test.ts`  

---

## 1. Visión y Objetivos

Incorporar una nueva regla de dificultad arcade estricta inspirada en clásicos retro como *Montezuma's Revenge* y *Spelunker*:
1. **Regla de Caída Fatal por Altura:**
   - La distancia máxima de caída segura se calibra exactamente a la altura máxima que el arqueólogo es capaz de saltar:
     $$\text{MAX\_SAFE\_FALL\_DISTANCE} = \text{JUMP\_HEIGHT\_PIXELS} = 56\text{ px}$$
   - Si el arqueólogo cae desde una altura mayor a $56\text{ px}$ (equivalente a 1.75 tiles de 32 px), el impacto resulta fatal y pierde 1 vida (`player.eliminate()`).
2. **Caída por Espacios/Fosos en Plataformas (Nivel 1 o Superior):**
   - Las plataformas de la pirámide presentan diferencias de cota de al menos 4 o 5 baldosas ($128\text{ px}$ o $160\text{ px}$).
   - Caer por cualquier foso, borde o hueco de una plataforma de Nivel 1 o superior hacia un nivel inferior (ej. Nivel 1 a Nivel 0, o Nivel 2 a Nivel 1 o Nivel 0) supera con creces los $56\text{ px}$ de tolerancia y resulta inmediatamente letal.
3. **Caídas Seguras Permitidas:**
   - Desniveles menores o iguales a la altura de salto (escalones de 1 tile de $32\text{ px}$, o caídas dentro del mismo plano tras un salto sin desnivel) no causan daño.
   - El descenso controlado por escaleras (`Climbing`) no cuenta como caída libre y es 100% seguro.

---

## 2. Parámetros y Constantes (`PlayerConstants.ts`)

- `JUMP_HEIGHT_PIXELS`: `56` px.
- `MAX_SAFE_FALL_DISTANCE`: `56` px (reemplaza los antiguos 176 px / 5.5 tiles de tolerancia holgada).

---

## 3. Lógica de Evaluación en Aterrizaje (`landOnSurface`)

En `src/entities/Player.ts`:
```typescript
const fallDistance = landingY - this.fallStartY;

let isLethal = false;
if (fallDistance > Player.MAX_SAFE_FALL_DISTANCE) {
    isLethal = true;
} else if (startLevel !== -1 && landLevel !== -1 && startLevel > landLevel) {
    isLethal = true;
}
```

- Si `isLethal == true`:
  - `this.eliminate()`: Se descuenta 1 vida, se establece `PlayerState.Eliminated` y se despliega la textura `player_dead` y el aviso en el HUD.

---

## 4. Criterios de Aceptación (QA)

1. `PlayerConstants.MAX_SAFE_FALL_DISTANCE` es exactamente igual a `PlayerConstants.JUMP_HEIGHT_PIXELS` (56 px).
2. Un salto normal que aterriza en la misma plataforma (distancia de caída neta = 0 px) es seguro y el jugador continúa en `Idle`.
3. Caer desde una plataforma de Nivel 1 hacia el piso de Nivel 0 (distancia = 160 px > 56 px) elimina al jugador y descuenta 1 vida.
4. Caer desde una plataforma de Nivel 2 hacia el piso de Nivel 1 (distancia = 128 px > 56 px) o Nivel 0 (distancia = 288 px > 56 px) elimina al jugador y descuenta 1 vida.
5. Descender por una escalera hasta el suelo no activa la penalización de caída.
6. Todas las pruebas unitarias automatizadas (`npm test`) pasan satisfactoriamente.
7. La compilación de producción (`npm run build-nolog`) termina con 0 errores.

