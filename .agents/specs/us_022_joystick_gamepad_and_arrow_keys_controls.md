# Especificación Técnica: [US-022] Soporte de Joystick/Gamepad Físico, Teclas de Dirección y Restricción de Salto Exclusivo

**Autor:** @architect (Game Designer Técnico / Analista Funcional)  
**Fecha:** 2026-10-25  
**Estado:** ESPECIFICACIÓN APROBADA  
**Componentes Asociados:**  
- `src/input/GamepadManager.ts`  
- `src/entities/Player.ts`  
- `src/scenes/GameScene.ts`  
- `src/scenes/TitleScene.ts`  
- `src/main.ts`  
- `tests/input/JoystickControls.test.ts`  

---

## 1. Visión y Objetivos

Ajustar e implementar el sistema de controles para soportar mandos arcade / joysticks físicos y teclado con fidelidad estricta a las reglas retro clásicas:
1. **Desplazamiento y Escalada (Teclas de Dirección y Joystick):**
   - Teclado: Flechas `[←]` (izquierda), `[→]` (derecha), `[↑]` (subir escalera), `[↓]` (bajar escalera).
   - Joystick / Gamepad (D-Pad y Stick analógico izquierdo): Izquierda, Derecha, Arriba (subir escalera), Abajo (bajar escalera).
2. **Mecánica de Salto Determinista:**
   - Teclado: **Barra Espaciadora** (`[Espacio]`).
   - Joystick / Gamepad: **Botón de joystick** (Botón principal A / Cruz / Botón 0, y botones frontales B, X, Y).
3. **Regla Estricta de Restricción:**
   - **Bajo ninguna circunstancia la tecla de dirección arriba (`[↑]` / D-Pad Arriba / Stick Arriba) debe iniciar un salto.** La dirección arriba se reserva exclusivamente para la acción de subir por las escaleras (`Climbing`).
4. **Soporte en Menús:**
   - La navegación en la pantalla de inicio (`TitleScene`) permite usar las flechas del teclado y el D-Pad/Stick del joystick, confirmando con Enter, Espacio o Botón de joystick.

---

## 2. Parámetros y Mapeo (`GamepadManager.ts`)

- **Deadzone Analógico:** `DEADZONE = 0.35` para evitar derivas erráticas de palancas gastadas.
- **Mapeo Estándar Gamepad W3C:**
  - `Left`: `Axis 0 < -DEADZONE` o `Button 14 (D-Pad Left)`
  - `Right`: `Axis 0 > DEADZONE` o `Button 15 (D-Pad Right)`
  - `Up`: `Axis 1 < -DEADZONE` o `Button 12 (D-Pad Up)` (exclusivo para escalar)
  - `Down`: `Axis 1 > DEADZONE` o `Button 13 (D-Pad Down)` (exclusivo para descender)
  - `Jump`: `Button 0 (A/Cross)` || `Button 1 (B/Circle)` || `Button 2 (X/Square)` || `Button 3 (Y/Triangle)` || `Button 5 (R1)`
  - `MenuConfirm`: `Button 0` || `Button 9 (Start)`

---

## 3. Modelo de Entrada Unificada (`PlayerInputState`)

```typescript
export interface PlayerInputState {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
}
```

- En `Player.ts`:
  - `isLeftDown`: `keyboard.left || gamepad.left`
  - `isRightDown`: `keyboard.right || gamepad.right`
  - `isUpDown`: `keyboard.up || gamepad.up` (Solo trepar / subir)
  - `isDownDown`: `keyboard.down || gamepad.down` (Solo bajar)
  - `isJumpPressed`: `keyboard.space || gamepad.jump` (**Sin `isUpDown`**)

---

## 4. Criterios de Aceptación (QA)

1. Pulsar la tecla de flecha `[↑]` sobre suelo sólido sin escalera no produce salto; el jugador permanece quieto (`Idle`).
2. Pulsar la barra espaciadora produce el salto parabólico arcade de 56 px.
3. Con un joystick/gamepad conectado, pulsar el botón de acción (Botón 0 / A) produce el salto parabólico arcade de 56 px.
4. Con un joystick/gamepad conectado, mover el stick o la cruceta hacia arriba sobre una escalera hace ascender al arqueólogo.
5. Con un joystick/gamepad conectado, mover el stick o la cruceta hacia los lados desplaza horizontalmente al arqueólogo a velocidad normal.
6. En `TitleScene`, el joystick permite navegar entre las opciones y confirmar con el botón de salto.
7. Las pruebas unitarias automatizadas (`npm test`) validan que la flecha arriba no inicia saltos, que el espacio y botón sí inician salto, y que la cinemática de trepado responde a ambas entradas.
8. La compilación de producción (`npm run build-nolog`) termina con 0 errores.

