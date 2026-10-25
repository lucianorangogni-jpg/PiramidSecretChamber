# Especificación Técnica: [US-020] Cofres de Tesoro en las 10 Recámaras, Sistema de Puntuación y HUD Retro Superior Derecho

**Autor:** @architect (Game Designer Técnico / Analista Funcional)  
**Fecha:** 2026-10-23  
**Estado:** ESPECIFICACIÓN APROBADA  
**Componentes Asociados:**  
- `src/entities/Treasure.ts`  
- `src/entities/TreasureState.ts`  
- `src/grid/ChamberTreasures.ts`  
- `src/graphics/TreasureGraphics.ts`  
- `src/scenes/GameScene.ts`  
- `tests/entities/Treasure.test.ts`  

---

## 1. Visión y Objetivos

Incorporar los cofres de tesoro ancestrales en las 10 recámaras de la pirámide:
1. **Recolección Directa en Plataformas:** Cada recámara dispone de 2 cofres de tesoro estratégicamente distribuidos en sus plataformas transitables (ej. Plataforma 0 y Plataforma Superior) para recolección inmediata al contacto con el arqueólogo.
2. **Presentación Visual Dinámica:**
   - Textura inicial: `treasure_closed` (cofre de oro y madera cerrado).
   - Al ser recolectado: conmuta de inmediato a `treasure_open` (cofre abierto repleto de gemas y oro brillante) y despliega una notificación flotante dorada con la recompensa (`+1000 PTS`).
3. **HUD Superior Derecho (Puntaje y Vidas):** Siguiendo las directrices retro arcade de [US-007]:
   - Encabezado: `ESTADO`
   - Puntuación: `PUNTOS: <puntos>` (con formato arcade)
   - Vidas: `VIDAS: ❤️❤️❤️ (3)`
4. **Persistencia y Control:**
   - Cambiar de recámara o reintentar con [R] restablece los tesoros de la recámara actual.
   - Rendimiento: 0 allocations continuas en el bucle principal de juego.

---

## 2. Modelado de Datos y Entidades

### `TreasureState` (`src/entities/TreasureState.ts`)
```typescript
export const TreasureState = {
    Available: 'Available',
    Collected: 'Collected'
} as const;

export type TreasureState = typeof TreasureState[keyof typeof TreasureState];
```

### `Treasure` (`src/entities/Treasure.ts`)
- `id: string`
- `gridX: number`, `gridY: number`: Coordenadas en la cuadrícula de 20x15 tiles (32x32 px cada uno).
- `value: number = 1000`: Puntos otorgados por defecto.
- `state: TreasureState`: Estado actual (`Available` o `Collected`).
- `collect(): number`: Si está `Available`, transiciona a `Collected` y retorna `value`. Si ya fue recolectado, retorna `0`.
- `reset(): void`: Restablece el estado a `Available`.
- `checkOverlap(playerX: number, playerY: number, hitboxWidth: number, hitboxHeight: number): boolean`: Verifica intersección AABB entre el cofre y el arqueólogo.

---

## 3. Catálogo de Tesoros por Recámara (`ChamberTreasures.ts`)

Para cada una de las 10 recámaras se establecen 2 tesoros en plataformas seguras y accesibles:
- **Recámara 1:** `(17, 13)` (Suelo Nivel 0) y `(8, 4)` (Plataforma Nivel 2).
- **Recámara 2:** `(17, 13)` (Suelo Nivel 0) y `(8, 5)` (Plataforma Nivel 2).
- **Recámara 3:** `(17, 13)` (Suelo Nivel 0) y `(12, 4)` (Plataforma Nivel 2).
- **Recámara 4:** `(17, 13)` (Suelo Nivel 0) y `(8, 5)` (Plataforma Nivel 2).
- **Recámara 5:** `(17, 13)` (Suelo Nivel 0) y `(14, 7)` (Plataforma Nivel 2).
- **Recámara 6:** `(17, 13)` (Suelo Nivel 0) y `(14, 7)` (Plataforma Nivel 2).
- **Recámara 7:** `(17, 13)` (Suelo Nivel 0) y `(14, 7)` (Plataforma Nivel 2).
- **Recámara 8:** `(17, 13)` (Suelo Nivel 0) y `(15, 7)` (Plataforma Nivel 2).
- **Recámara 9:** `(17, 13)` (Suelo Nivel 0) y `(14, 7)` (Plataforma Nivel 2).
- **Recámara 10:** `(17, 13)` (Suelo Nivel 0) y `(14, 4)` (Plataforma Nivel 2).

*Garantía espacial:* Ningún tesoro solapa escaleras, muros impenetrables o puertas de salida. Todos cuentan con suelo sólido debajo.

---

## 4. Texturas Procedurales Pixel-Art (`TreasureGraphics.ts`)

- `tile_treasure_closed` (o `treasure_closed`):
  - Dimensiones: 32x32 píxeles.
  - Paleta: Madera ancestral (`#543012`, `#764e12`), refuerzos de oro (`#ebbe46`, `#ffe47d`, `#84561c`), cerradura con joya turquesa (`#28cde1`).
- `tile_treasure_open` (o `treasure_open`):
  - Tapa abierta en ángulo hacia atrás.
  - Relleno de oro reluciente y gemas multicolor (rubíes rojos, esmeraldas verdes, zafiros cian).
  - Destello estelar en relieve.

---

## 5. Criterios de Aceptación (QA)

1. En cada una de las 10 recámaras existen exactamente 2 cofres visibles en sus plataformas.
2. Al iniciar la recámara, los cofres se muestran con el sprite de cofre cerrado (`treasure_closed`).
3. Al caminar o saltar sobre un cofre:
   - El cofre pasa inmediatamente al estado de cofre abierto (`treasure_open`).
   - Se incrementa la puntuación del jugador en +1000 puntos.
   - Se despliega una notificación flotante arcade `+1000 PTS` que sube y se desvanece.
4. El cofre ya abierto no puede volver a ser recolectado en la misma incursión.
5. El panel HUD superior derecho muestra:
   - Título `ESTADO`
   - Puntuación `PUNTOS: <pts>`
   - Vidas `VIDAS: ❤️❤️❤️ (3)`
6. Al reiniciar con [R], los tesoros de la recámara se restauran a su estado cerrado.
7. Las pruebas unitarias automatizadas (`npm test`) validan la lógica de recolección, catálogo de tesoros en las 10 recámaras y detección de colisiones.
8. La compilación de producción (`npm run build-nolog`) termina con 0 errores.

