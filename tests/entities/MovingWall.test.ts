import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MovingWall } from '../../src/entities/MovingWall.ts';
import { ChamberMovingWalls } from '../../src/grid/ChamberMovingWalls.ts';
import { ChamberTreasures } from '../../src/grid/ChamberTreasures.ts';
import { RoomGrid } from '../../src/grid/RoomGrid.ts';
import { TileType } from '../../src/grid/TileType.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Timed Moving Walls & Dual Triggers Specs [US-024]', () => {
    it('debe inicializarse en estado cerrado con coordenadas, altura vertical y temporizador en 0', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 },
            { gridX: 16, gridY: 13 },
            'ch1_t1',
            'test_wall_1',
            10 // topGridY
        );

        assert.strictEqual(wall.gridX, 15);
        assert.strictEqual(wall.gridY, 13);
        assert.strictEqual(wall.topGridY, 10);
        assert.strictEqual(wall.heightInTiles, 4); // filas 10, 11, 12, 13
        assert.strictEqual(wall.pixelX, 15 * 32);
        assert.strictEqual(wall.pixelY, 13 * 32);
        assert.strictEqual(wall.topPixelY, 10 * 32);
        assert.strictEqual(wall.pixelHeight, 4 * 32);
        assert.strictEqual(wall.isOpen, false);
        assert.strictEqual(wall.isClosed, true);
        assert.strictEqual(wall.remainingFrames, 0);
        assert.strictEqual(wall.remainingSeconds, 0);
        assert.strictEqual(wall.associatedTreasureId, 'ch1_t1');
        assert.strictEqual(wall.outerTrigger.gridX, 13);
        assert.strictEqual(wall.innerTrigger.gridX, 16);
    });

    it('activate() debe abrir la pared e iniciar el contador a 300 frames (5 segundos)', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 },
            { gridX: 16, gridY: 13 },
            'ch1_t1',
            undefined,
            10
        );

        wall.activate();

        assert.strictEqual(wall.isOpen, true);
        assert.strictEqual(wall.isClosed, false);
        assert.strictEqual(wall.remainingFrames, 300); // 5s * 60 FPS
        assert.strictEqual(wall.remainingSeconds, 5);
    });

    it('activar la pared mientras ya está abierta debe refrescar el temporizador al máximo (5s)', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 },
            { gridX: 16, gridY: 13 },
            'ch1_t1',
            undefined,
            10
        );

        wall.activate();
        // Simular que pasaron 120 frames (2 segundos)
        for (let i = 0; i < 120; i++) {
            wall.update(false);
        }
        assert.strictEqual(wall.remainingFrames, 180);
        assert.strictEqual(wall.remainingSeconds, 3);

        // Volver a pisar el activador
        wall.activate();
        assert.strictEqual(wall.remainingFrames, 300);
        assert.strictEqual(wall.remainingSeconds, 5);
        assert.strictEqual(wall.isOpen, true);
    });

    it('update() debe decrementar el temporizador y cerrarse automáticamente tras 300 frames (5s)', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 },
            { gridX: 16, gridY: 13 },
            'ch1_t1',
            undefined,
            10
        );

        wall.activate();

        // Actualizar 299 frames
        for (let i = 0; i < 299; i++) {
            wall.update(false);
        }
        assert.strictEqual(wall.isOpen, true);
        assert.strictEqual(wall.remainingFrames, 1);
        assert.strictEqual(wall.remainingSeconds, 1);

        // Frame 300 -> expira y se cierra
        wall.update(false);
        assert.strictEqual(wall.isOpen, false);
        assert.strictEqual(wall.isClosed, true);
        assert.strictEqual(wall.remainingFrames, 0);
        assert.strictEqual(wall.remainingSeconds, 0);
    });

    it('close() y reset() deben cerrar inmediatamente la pared y resetear el contador', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 },
            { gridX: 16, gridY: 13 },
            'ch1_t1',
            undefined,
            10
        );

        wall.activate();
        assert.strictEqual(wall.isOpen, true);

        wall.close();
        assert.strictEqual(wall.isOpen, false);
        assert.strictEqual(wall.remainingFrames, 0);

        wall.activate();
        wall.reset();
        assert.strictEqual(wall.isOpen, false);
        assert.strictEqual(wall.remainingFrames, 0);
    });

    it('anti-aplastamiento: no debe cerrarse si el jugador se encuentra cruzando la columna del muro', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 },
            { gridX: 16, gridY: 13 },
            'ch1_t1',
            undefined,
            10
        );

        wall.activate();

        // Simular que el temporizador llega a 1 frame restante
        for (let i = 0; i < 299; i++) {
            wall.update(false);
        }
        assert.strictEqual(wall.remainingFrames, 1);

        // En el frame de expiración, el jugador está en el umbral (isPlayerInThreshold = true)
        wall.update(true);
        assert.strictEqual(wall.isOpen, true, 'El muro debe permanecer abierto si el jugador está en el umbral');
        assert.strictEqual(wall.remainingFrames, 1);

        // Siguiente frame, sigue en el umbral
        wall.update(true);
        assert.strictEqual(wall.isOpen, true);
        assert.strictEqual(wall.remainingFrames, 1);

        // Jugador finalmente sale del umbral (isPlayerInThreshold = false)
        wall.update(false);
        assert.strictEqual(wall.isOpen, false, 'El muro debe cerrarse una vez el jugador desaloja el umbral');
        assert.strictEqual(wall.remainingFrames, 0);
    });

    it('debe detectar correctamente el contacto con el activador exterior y el activador interior', () => {
        const wall = new MovingWall(
            15,
            13,
            { gridX: 13, gridY: 13 }, // Trigger exterior: x [416, 448], y [416, 448]
            { gridX: 16, gridY: 13 }, // Trigger interior: x [512, 544], y [416, 448]
            'ch1_t1',
            undefined,
            10
        );

        // 1. Jugador pisando el trigger exterior (centro en 432, pies en 448)
        assert.strictEqual(wall.isPointOverTrigger(wall.outerTrigger, 432, 448), true);
        assert.strictEqual(wall.isPlayerOnAnyTrigger(432, 448), true);

        // 2. Jugador pisando el trigger interior (centro en 528, pies en 448)
        assert.strictEqual(wall.isPointOverTrigger(wall.innerTrigger, 528, 448), true);
        assert.strictEqual(wall.isPlayerOnAnyTrigger(528, 448), true);

        // 3. Jugador fuera de los activadores (ej. en medio del pasillo x: 300, y: 448)
        assert.strictEqual(wall.isPointOverTrigger(wall.outerTrigger, 300, 448), false);
        assert.strictEqual(wall.isPointOverTrigger(wall.innerTrigger, 300, 448), false);
        assert.strictEqual(wall.isPlayerOnAnyTrigger(300, 448), false);

        // 4. Detección de umbral en la base (gridY: 13 -> y [416, 448])
        assert.strictEqual(wall.isPlayerInsideWallThreshold(496, 448), true);
        assert.strictEqual(wall.isPlayerInsideWallThreshold(432, 448), false);

        // 5. Detección de umbral en la parte superior (topGridY: 10 -> y [320, 352])
        assert.strictEqual(wall.isPlayerInsideWallThreshold(496, 340), true, 'Debe detectar al jugador saltando en la parte superior del muro');
    });

    it('todas las 10 recámaras deben tener exactamente 2 paredes movedizas asociadas a sus 2 tesoros', () => {
        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            const walls = ChamberMovingWalls.createWallsForChamber(ch);
            const treasures = ChamberTreasures.createTreasuresForChamber(ch);

            assert.strictEqual(walls.length, 2, `Recámara ${ch} debe tener 2 paredes movedizas`);
            assert.strictEqual(treasures.length, 2, `Recámara ${ch} debe tener 2 tesoros`);

            for (let i = 0; i < walls.length; i++) {
                assert.strictEqual(
                    walls[i].associatedTreasureId,
                    treasures[i].id,
                    `Recámara ${ch}: Pared ${i + 1} debe asociarse a tesoro ${treasures[i].id}`
                );
            }
        }
    });

    it('todas las paredes de las 10 recámaras deben llegar verticalmente hasta la plataforma superior o techo', () => {
        const grid = new RoomGrid();

        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            grid.loadChamber(ch);
            const walls = ChamberMovingWalls.createWallsForChamber(ch);

            for (let i = 0; i < walls.length; i++) {
                const wall = walls[i];

                // 1. Debe tener al menos 2 tiles de altura
                assert.ok(
                    wall.heightInTiles >= 2,
                    `Recámara ${ch}: Pared ${wall.id} debe tener al menos 2 tiles de altura (tiene ${wall.heightInTiles})`
                );

                // 2. topGridY debe ser menor o igual que gridY
                assert.ok(
                    wall.topGridY <= wall.gridY,
                    `Recámara ${ch}: topGridY (${wall.topGridY}) debe ser <= gridY (${wall.gridY})`
                );

                // 3. El tile inmediatamente superior a topGridY debe ser un muro sólido o techo (SolidWall)
                const upperTile = grid.getTile(wall.gridX, wall.topGridY - 1);
                assert.strictEqual(
                    upperTile,
                    TileType.SolidWall,
                    `Recámara ${ch}: El tile superior a (${wall.gridX}, ${wall.topGridY}) debe ser SolidWall (es ${upperTile})`
                );

                // 4. Cada celda de la columna de la pared debe estar en el espacio libre del corredor
                for (let y = wall.topGridY; y <= wall.gridY; y++) {
                    const cellTile = grid.getTile(wall.gridX, y);
                    assert.strictEqual(
                        cellTile,
                        TileType.Empty,
                        `Recámara ${ch}: Celda (${wall.gridX}, ${y}) debe ser transitable/vacía antes del despliegue del muro`
                    );
                }
            }
        }
    });

    it('todas las paredes y activadores de las 10 recámaras deben tener geometría y suelo válidos sin bloqueos', () => {
        const grid = new RoomGrid();

        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            grid.loadChamber(ch);
            const walls = ChamberMovingWalls.createWallsForChamber(ch);
            const treasures = ChamberTreasures.createTreasuresForChamber(ch);

            for (let i = 0; i < walls.length; i++) {
                const wall = walls[i];
                const treasure = treasures[i];

                // 1. Verificación de límites de la pared
                assert.ok(
                    grid.inBounds(wall.gridX, wall.gridY),
                    `Recámara ${ch}: Pared ${wall.id} fuera de límites (${wall.gridX}, ${wall.gridY})`
                );

                // 2. La pared debe tener suelo sólido debajo
                const wallFloor = grid.getTile(wall.gridX, wall.gridY + 1);
                assert.strictEqual(
                    wallFloor,
                    TileType.SolidWall,
                    `Recámara ${ch}: Pared ${wall.id} en (${wall.gridX}, ${wall.gridY}) debe tener suelo sólido debajo (Tile: ${wallFloor})`
                );

                // 3. Activador exterior en límites y con suelo firme
                assert.ok(
                    grid.inBounds(wall.outerTrigger.gridX, wall.outerTrigger.gridY),
                    `Recámara ${ch}: Activador exterior fuera de límites`
                );
                const outerFloor = grid.getTile(wall.outerTrigger.gridX, wall.outerTrigger.gridY + 1);
                assert.strictEqual(
                    outerFloor,
                    TileType.SolidWall,
                    `Recámara ${ch}: Activador exterior debe tener suelo firme debajo`
                );

                // 4. Activador interior en límites y con suelo firme
                assert.ok(
                    grid.inBounds(wall.innerTrigger.gridX, wall.innerTrigger.gridY),
                    `Recámara ${ch}: Activador interior fuera de límites`
                );
                const innerFloor = grid.getTile(wall.innerTrigger.gridX, wall.innerTrigger.gridY + 1);
                assert.strictEqual(
                    innerFloor,
                    TileType.SolidWall,
                    `Recámara ${ch}: Activador interior debe tener suelo firme debajo`
                );

                // 5. Garantía Anti-Softlock:
                // El activador exterior debe estar en el lado exterior del muro.
                // El activador interior debe estar en el mismo lado que el tesoro (dentro de la bóveda).
                // Ambos activadores deben estar en la misma fila del suelo (gridY) que la pared.
                assert.strictEqual(wall.outerTrigger.gridY, wall.gridY);
                assert.strictEqual(wall.innerTrigger.gridY, wall.gridY);
                assert.strictEqual(treasure.gridY, wall.gridY);

                // El tesoro y el activador interior deben compartir la misma orientación respecto a la pared
                const isTreasureToTheRight = treasure.gridX > wall.gridX;
                const isInnerTriggerToTheRight = wall.innerTrigger.gridX > wall.gridX;
                const isOuterTriggerToTheRight = wall.outerTrigger.gridX > wall.gridX;

                assert.strictEqual(
                    isInnerTriggerToTheRight,
                    isTreasureToTheRight,
                    `Recámara ${ch}: El activador interior debe estar dentro de la bóveda con el tesoro`
                );
                assert.notStrictEqual(
                    isOuterTriggerToTheRight,
                    isTreasureToTheRight,
                    `Recámara ${ch}: El activador exterior debe estar en el lado accesible exterior de la bóveda`
                );

                // 6. Ningún elemento debe solaparse entre sí
                assert.notStrictEqual(wall.outerTrigger.gridX, wall.gridX);
                assert.notStrictEqual(wall.innerTrigger.gridX, wall.gridX);
                assert.notStrictEqual(wall.outerTrigger.gridX, wall.innerTrigger.gridX);
                assert.notStrictEqual(treasure.gridX, wall.gridX);
                assert.notStrictEqual(treasure.gridX, wall.innerTrigger.gridX);
            }
        }
    });
});
