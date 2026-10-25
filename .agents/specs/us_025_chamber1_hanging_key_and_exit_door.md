# Especificación Técnica: [US-025] Llaves Ancestrales Obligatorias y Desbloqueo de Puertas de Salida en las 10 Recámaras

**Autor:** @architect (Game Designer Técnico / Analista Funcional)  
**Fecha:** 2026-10-25  
**Estado:** ESPECIFICACIÓN APROBADA Y COMPLETADA  
**Componentes Asociados:**  
- `src/entities/Key.ts`  
- `src/grid/ChamberKeys.ts`  
- `src/graphics/KeyGraphics.ts`  
- `src/scenes/GameScene.ts`  
- `tests/entities/Key.test.ts`  

---

## 1. Visión y Objetivos

Incorporar el objetivo principal de escape para **todas las 10 recámaras** de la pirámide: cada recámara cuenta con una **Llave Dorada Ancestral** suspendida en el aire que debe ser recolectada mediante un salto para poder abrir la puerta de salida (`ExitDoor`) y avanzar.

1. **Ubicación y Desafío de Salto por Recámara:**
   - Cada recámara sitúa su llave suspendida de una cadena anclada a una plataforma superior o techo sólido (`SolidWall`).
   - La altura está calibrada de tal forma que un arqueólogo caminando a pie no puede alcanzarla; requiere saltar para interceptar la llave en el aire.
   - En las recámaras con huecos en las plataformas (como Recámaras 1, 2, 3, 4, 6, 7, 8, 9, 10), la llave cuelga sobre el foso/abismo, exigiendo saltar sobre el espacio vacío para obtenerla.

2. **Mecánica de Bloqueo y Desbloqueo de Puerta (`ExitDoor`):**
   - Al iniciar o reiniciar una recámara, la puerta de salida está cerrada con un candado ancestral (`tile_door_locked`).
   - Si el jugador toca la puerta sin tener la llave:
     - La puerta permanece bloqueada e impenetrable.
     - Se notifica en pantalla: `🔒 ¡PUERTA CERRADA! NECESITAS LA LLAVE`.
   - Al capturar la llave en el salto:
     - `hasKey = true`.
     - Otorga `+500` puntos de bonificación con efecto visual.
     - La puerta de salida se desbloquea e ilumina (`tile_door_open`).
     - El HUD superior derecho muestra: `LLAVE: 🔑 SÍ`.
   - Al cruzar la puerta abierta con la llave:
     - Se completa la recámara (`¡RECAMARA X COMPLETADA! +1000 PTS`).
     - Avanza automáticamente a la siguiente recámara de la pirámide tras una breve celebración.

3. **Reinicio y Cero Allocations:**
   - Al reiniciar con [R] o morir, la llave vuelve a su estado suspendido (`hasKey = false`) y la puerta vuelve a estar cerrada.
   - Rendimiento optimizado: 0 asignaciones en heap durante el bucle de juego continuo.

---

## 2. Catálogo de Llaves por Recámara (`ChamberKeys.ts`)

| Recámara | Posición Llave `(gridX, gridY)` | Anclaje Techo `ceilingGridY` | Puerta de Salida | Desafío / Espacio Vacío |
| :---: | :---: | :---: | :---: | :--- |
| **1** | `(11, 7)` | Fila 5 | `(18, 4)` | Suspendida sobre el hueco de fila 9 (`x = 11`) |
| **2** | `(12, 8)` | Fila 6 | `(1, 5)` | Suspendida sobre el hueco de fila 10 (`x = 12`) |
| **3** | `(11, 7)` | Fila 5 | `(18, 4)` | Suspendida sobre el hueco de fila 9 (`x = 11`) |
| **4** | `(11, 8)` | Fila 6 | `(1, 5)` | Suspendida sobre el hueco de fila 10 (`x = 11`) |
| **5** | `(6, 6)` | Fila 4 | `(18, 3)` | Suspendida en Nivel 2 entre escaleras 4 y 8 |
| **6** | `(12, 9)` | Fila 8 | `(1, 3)` | Suspendida sobre el hueco de fila 11 (`x = 12`) |
| **7** | `(11, 9)` | Fila 8 | `(18, 3)` | Suspendida sobre el hueco de fila 11 (`x = 11`) |
| **8** | `(12, 9)` | Fila 8 | `(1, 2)` | Suspendida sobre el hueco de fila 11 (`x = 12`) |
| **9** | `(12, 9)` | Fila 8 | `(18, 2)` | Suspendida sobre el hueco de fila 11 (`x = 12`) |
| **10** | `(11, 7)` | Fila 5 | `(18, 4)` | Suspendida sobre el hueco de fila 9 (`x = 11`) |

---

## 3. Criterios de Aceptación (QA)

1. En cada una de las 10 recámaras existe exactamente una llave dorada suspendida.
2. Cada recámara tiene su puerta de salida inicialmente cerrada (`tile_door_locked`).
3. Tocar la puerta sin la llave no permite salir y muestra advertencia en pantalla.
4. Recoger la llave otorga 500 puntos, actualiza el HUD (`LLAVE: 🔑 SÍ`) y desbloquea la puerta (`tile_door_open`).
5. Cruzar la puerta con la llave completa la recámara (+1000 puntos) y avanza a la siguiente.
6. Al reiniciar con [R] o morir, la llave reaparece y la puerta vuelve a bloquearse.
7. Suite de pruebas automatizadas al 100% y 0 errores de compilación.
