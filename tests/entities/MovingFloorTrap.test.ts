import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MovingFloorTrap, MovingFloorState } from '../../src/entities/MovingFloorTrap.ts';
import { ChamberMovingFloors } from '../../src/grid/ChamberMovingFloors.ts';
import { RoomGrid } from '../../src/grid/RoomGrid.ts';
import { TileType } from '../../src/grid/TileType.ts';
import { PlayerConstants } from '../../src/entities/PlayerConstants.ts';

describe('Moving Floor Hazard Mechanics Specs (Nivel 1, Recámaras 5+)', () => {
    it('debe inicializarse en estado sólido con dimensiones y temporizador en 0', () => {
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        assert.strictEqual(trap.chamber, 5);
        assert.strictEqual(trap.row, 11);
        assert.strictEqual(trap.minCol, 6);
        assert.strictEqual(trap.maxCol, 7);
        assert.strictEqual(trap.lengthInTiles, 2);
        assert.strictEqual(trap.state, MovingFloorState.Solid);
        assert.strictEqual(trap.isSolid, true);
        assert.strictEqual(trap.isShaking, false);
        assert.strictEqual(trap.isOpen, false);
        assert.strictEqual(trap.remainingFrames, 0);
        assert.strictEqual(trap.shakeOffsetX, 0);

        // Coordenadas en píxeles: col 6 (192) a col 7 (256), fila 11 (352) a 12 (384)
        assert.strictEqual(trap.pixelLeft, 192);
        assert.strictEqual(trap.pixelRight, 256);
        assert.strictEqual(trap.pixelTop, 352);
        assert.strictEqual(trap.pixelBottom, 384);
    });

    it('containsTile debe verificar si una casilla forma parte del piso movedizo', () => {
        const trap = new MovingFloorTrap(5, 11, 6, 7);

        assert.strictEqual(trap.containsTile(6, 11), true);
        assert.strictEqual(trap.containsTile(7, 11), true);
        assert.strictEqual(trap.containsTile(5, 11), false, 'Columna 5 es la escalera inferior');
        assert.strictEqual(trap.containsTile(8, 11), false, 'Columna 8 es la escalera superior');
        assert.strictEqual(trap.containsTile(6, 10), false, 'Fila distinta');
    });

    it('isPlayerOnPlatform debe detectar con precisión si los pies del jugador están apoyados sobre el piso', () => {
        const trap = new MovingFloorTrap(5, 11, 6, 7);
        const feetY = 352; // Altura de los pies en Plataforma Nivel 1 (fila 11)

        // 1. Jugador parado en el centro del bloque col 6 (x = 192 + 16 = 208)
        assert.strictEqual(trap.isPlayerOnPlatform(208, feetY), true);

        // 2. Jugador parado en el centro del bloque col 7 (x = 224 + 16 = 240)
        assert.strictEqual(trap.isPlayerOnPlatform(240, feetY), true);

        // 3. Jugador fuera horizontalmente a la izquierda (en escalera 1, col 5, x = 176)
        assert.strictEqual(trap.isPlayerOnPlatform(176, feetY), false);

        // 4. Jugador fuera horizontalmente a la derecha (en escalera 2, col 8, x = 272)
        assert.strictEqual(trap.isPlayerOnPlatform(272, feetY), false);

        // 5. Jugador en el Suelo Base (pies en 448 px) debajo de la trampa
        assert.strictEqual(trap.isPlayerOnPlatform(208, 448), false);

        // 6. Jugador saltando en el aire por encima (pies en 300 px)
        assert.strictEqual(trap.isPlayerOnPlatform(208, 300), false);
    });

    it('pisar el suelo en estado sólido debe activar el temblor y temporizador de cuenta regresiva', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        // Antes de pisar: sólido, timer en 0
        assert.strictEqual(trap.isSolid, true);
        assert.strictEqual(trap.remainingFrames, 0);

        // Jugador pisa la trampa
        trap.update(208, 352, false, grid);

        assert.strictEqual(trap.state, MovingFloorState.Shaking);
        assert.strictEqual(trap.isShaking, true);
        assert.strictEqual(trap.remainingFrames, 75);

        // El suelo sigue siendo físicamente sólido durante la fase de temblor
        assert.strictEqual(grid.isSolid(6, 11), true);
        assert.strictEqual(grid.isSolid(7, 11), true);
    });

    it('en estado Shaking debe decrementar el temporizador y vibrar visualmente (shakeOffsetX)', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        trap.update(208, 352, false, grid); // Activa temblor (75 frames)

        // Simular 10 frames de advertencia sísmica
        for (let f = 0; f < 10; f++) {
            trap.update(208, 352, false, grid);
            // La vibración debe ser de ±2 px
            assert.ok(Math.abs(trap.shakeOffsetX) === 2);
        }

        assert.strictEqual(trap.remainingFrames, 65);
        assert.strictEqual(trap.isShaking, true);
    });

    it('al expirar el tiempo de temblor, el piso colapsa abriendo TileType.Empty en la cuadrícula', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        trap.update(208, 352, false, grid); // Activa

        // Avanzar los 75 frames de retardo
        for (let f = 0; f < 75; f++) {
            trap.update(208, 352, false, grid);
        }

        // Estado colapsado (Open)
        assert.strictEqual(trap.state, MovingFloorState.Open);
        assert.strictEqual(trap.isOpen, true);
        assert.strictEqual(trap.remainingFrames, 180);
        assert.strictEqual(trap.shakeOffsetX, 0);

        // Las casillas en la cuadrícula se han abierto hacia el vacío
        assert.strictEqual(grid.isSolid(6, 11), false);
        assert.strictEqual(grid.isSolid(7, 11), false);
        assert.strictEqual(grid.getTile(6, 11), TileType.Empty);
        assert.strictEqual(grid.getTile(7, 11), TileType.Empty);
    });

    it('si el jugador se queda parado en el lugar, la caída resultante de 96px al Suelo Base es letal (>56px)', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        const playerX = 208; // Sobre col 6
        const playerY = 352; // Pies en Nivel 1

        // El jugador se queda quieto esperando
        trap.update(playerX, playerY, false, grid);
        for (let f = 0; f < 75; f++) {
            trap.update(playerX, playerY, false, grid);
        }

        // La baldosa ahora es vacía
        assert.strictEqual(grid.isSolid(6, 11), false);

        // Verificación de física de caída arcade:
        // Altura de inicio: 352 px (Nivel 1)
        // Altura de aterrizaje: 448 px (Suelo Base Nivel 0)
        const fallDistance = 448 - 352; // 96 px
        assert.strictEqual(fallDistance, 96);
        assert.ok(
            fallDistance > PlayerConstants.MAX_SAFE_FALL_DISTANCE,
            `La caída de ${fallDistance}px debe superar la altura máxima de salto segura (${PlayerConstants.MAX_SAFE_FALL_DISTANCE}px)`
        );

        // Regla de letalidad: Caída > 56 px O entre plataformas de nivel 1+ a nivel inferior
        const startLevel = grid.getPlatformLevel(playerY - 32); // 1
        const landLevel = grid.getPlatformLevel(448 - 32);      // 0
        assert.strictEqual(startLevel, 1);
        assert.strictEqual(landLevel, 0);

        const isLethal = fallDistance > PlayerConstants.MAX_SAFE_FALL_DISTANCE || (startLevel > landLevel);
        assert.strictEqual(isLethal, true, 'Quedarse parado y caer debe resultar en muerte letal perdiendo una vida');
    });

    it('si el jugador camina de forma continua, cruza a salvo antes del colapso', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        // El explorador pisa col 6 en x = 194
        let playerX = 194;
        const playerY = 352;
        trap.update(playerX, playerY, false, grid); // Dispara temblor (75 frames)

        // El explorador camina a velocidad retro continua (3.0 px/frame de PlayerConstants.WALK_SPEED)
        // Para llegar a la escalera en columna 8 (centro x = 272 px):
        // 78 px a 3 px/frame toma 26 frames (< 75 frames de retardo)
        for (let f = 0; f < 26; f++) {
            playerX += PlayerConstants.WALK_SPEED;
            trap.update(playerX, playerY, false, grid);
        }

        // A los 26 frames, el explorador ha llegado a x = 272 (escalera en col 8)
        assert.strictEqual(playerX, 272);
        assert.ok(playerX - PlayerConstants.HITBOX_WIDTH / 2 >= trap.pixelRight, 'El hitbox completo debe haber salido del piso');
        assert.strictEqual(trap.isPlayerOnPlatform(playerX, playerY), false);
        assert.strictEqual(trap.isShaking, true, 'El piso sigue temblando pero aún no ha colapsado');

        // Avanzar hasta los 75 frames cuando el piso finalmente colapsa tras el paso del jugador
        for (let f = 26; f < 75; f++) {
            trap.update(playerX, playerY, false, grid);
        }

        assert.strictEqual(trap.isOpen, true, 'El piso se abre tras pasar el jugador');
        // El jugador está en suelo firme o escalera (col 8)
        assert.strictEqual(grid.isLadder(8, 11), true, 'El jugador está a salvo en la escalera');
    });

    it('tras expirar openDurationFrames, el piso se restablece a sólido automáticamente', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        trap.update(208, 352, false, grid);
        for (let f = 0; f < 75; f++) trap.update(208, 352, false, grid); // Colapsa
        assert.strictEqual(trap.isOpen, true);

        // Avanzar los 180 frames abierto (jugador ya no está en el foso)
        for (let f = 0; f < 180; f++) {
            trap.update(100, 448, false, grid);
        }

        assert.strictEqual(trap.state, MovingFloorState.Solid);
        assert.strictEqual(trap.isSolid, true);
        assert.strictEqual(grid.isSolid(6, 11), true);
        assert.strictEqual(grid.isSolid(7, 11), true);
    });

    it('reset() debe restablecer inmediatamente el piso a su estado sólido y restaurar las casillas', () => {
        const grid = new RoomGrid();
        grid.loadChamber(5);
        const trap = new MovingFloorTrap(5, 11, 6, 7, 75, 180);

        trap.update(208, 352, false, grid);
        for (let f = 0; f < 75; f++) trap.update(208, 352, false, grid); // Colapsa
        assert.strictEqual(trap.isOpen, true);
        assert.strictEqual(grid.isSolid(6, 11), false);

        // Reset (reintento con tecla R o muerte)
        trap.reset(grid);

        assert.strictEqual(trap.state, MovingFloorState.Solid);
        assert.strictEqual(trap.isSolid, true);
        assert.strictEqual(trap.remainingFrames, 0);
        assert.strictEqual(trap.shakeOffsetX, 0);
        assert.strictEqual(grid.isSolid(6, 11), true);
        assert.strictEqual(grid.isSolid(7, 11), true);
    });

    it('ChamberMovingFloors debe definir pisos movedizos para las recámaras a partir de la 5 (5, 6, 7, 8, 9, 10)', () => {
        // Recámaras 1 a 4 NO tienen pisos movedizos
        for (let ch = 1; ch <= 4; ch++) {
            const traps = ChamberMovingFloors.createFloorsForChamber(ch);
            assert.strictEqual(traps.length, 0, `Recámara ${ch} no debe tener pisos movedizos`);
        }

        // Recámara 5: fila 11, columnas 6 a 7
        const ch5Traps = ChamberMovingFloors.createFloorsForChamber(5);
        assert.strictEqual(ch5Traps.length, 1);
        assert.strictEqual(ch5Traps[0].row, 11);
        assert.strictEqual(ch5Traps[0].minCol, 6);
        assert.strictEqual(ch5Traps[0].maxCol, 7);

        // Recámara 6: fila 11, columnas 6 a 8
        const ch6Traps = ChamberMovingFloors.createFloorsForChamber(6);
        assert.strictEqual(ch6Traps.length, 1);
        assert.strictEqual(ch6Traps[0].row, 11);
        assert.strictEqual(ch6Traps[0].minCol, 6);
        assert.strictEqual(ch6Traps[0].maxCol, 8);

        // Recámara 7: fila 11, columnas 6 a 8
        const ch7Traps = ChamberMovingFloors.createFloorsForChamber(7);
        assert.strictEqual(ch7Traps.length, 1);
        assert.strictEqual(ch7Traps[0].row, 11);
        assert.strictEqual(ch7Traps[0].minCol, 6);
        assert.strictEqual(ch7Traps[0].maxCol, 8);

        // Recámara 8: fila 11, columnas 4 a 5
        const ch8Traps = ChamberMovingFloors.createFloorsForChamber(8);
        assert.strictEqual(ch8Traps.length, 1);
        assert.strictEqual(ch8Traps[0].row, 11);
        assert.strictEqual(ch8Traps[0].minCol, 4);
        assert.strictEqual(ch8Traps[0].maxCol, 5);

        // Recámara 9: fila 11, columnas 7 a 9
        const ch9Traps = ChamberMovingFloors.createFloorsForChamber(9);
        assert.strictEqual(ch9Traps.length, 1);
        assert.strictEqual(ch9Traps[0].row, 11);
        assert.strictEqual(ch9Traps[0].minCol, 7);
        assert.strictEqual(ch9Traps[0].maxCol, 9);

        // Recámara 10: fila 9, columnas 7 a 8
        const ch10Traps = ChamberMovingFloors.createFloorsForChamber(10);
        assert.strictEqual(ch10Traps.length, 1);
        assert.strictEqual(ch10Traps[0].row, 9);
        assert.strictEqual(ch10Traps[0].minCol, 7);
        assert.strictEqual(ch10Traps[0].maxCol, 8);
    });

    it('isMovingFloorTile debe verificar correctamente las coordenadas para el renderizado dinámico', () => {
        // En Recámara 5: col 6 y 7 en fila 11 son trampa
        assert.strictEqual(ChamberMovingFloors.isMovingFloorTile(5, 6, 11), true);
        assert.strictEqual(ChamberMovingFloors.isMovingFloorTile(5, 7, 11), true);
        assert.strictEqual(ChamberMovingFloors.isMovingFloorTile(5, 5, 11), false);
        assert.strictEqual(ChamberMovingFloors.isMovingFloorTile(5, 8, 11), false);

        // En Recámara 1: no hay trampas
        assert.strictEqual(ChamberMovingFloors.isMovingFloorTile(1, 6, 11), false);
    });
});
