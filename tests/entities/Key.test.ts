import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Key } from '../../src/entities/Key.ts';
import { ChamberKeys } from '../../src/grid/ChamberKeys.ts';
import { ChamberTreasures } from '../../src/grid/ChamberTreasures.ts';
import { ChamberMovingWalls } from '../../src/grid/ChamberMovingWalls.ts';
import { RoomGrid } from '../../src/grid/RoomGrid.ts';
import { TileType } from '../../src/grid/TileType.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';
import { PlayerConstants } from '../../src/entities/PlayerConstants.ts';

describe('Hanging Key & Exit Door Mechanics Specs [US-025]', () => {
    it('debe inicializarse con coordenadas, valor por defecto y estado disponible', () => {
        const key = new Key(1, 11, 7, 5, 500);

        assert.strictEqual(key.chamber, 1);
        assert.strictEqual(key.gridX, 11);
        assert.strictEqual(key.gridY, 7);
        assert.strictEqual(key.ceilingGridY, 5);
        assert.strictEqual(key.value, 500);
        assert.strictEqual(key.isCollected, false);
        assert.strictEqual(key.isAvailable, true);
        assert.strictEqual(key.pixelX, 11 * 32);
        assert.strictEqual(key.pixelY, 7 * 32);
        assert.strictEqual(key.ceilingPixelY, 5 * 32);
    });

    it('collect() debe transicionar a recogida y otorgar 500 puntos una sola vez', () => {
        const key = new Key(1, 11, 7);

        // Primera recolección
        const points = key.collect();
        assert.strictEqual(points, 500);
        assert.strictEqual(key.isCollected, true);
        assert.strictEqual(key.isAvailable, false);

        // Intento de segunda recolección
        const secondAttempt = key.collect();
        assert.strictEqual(secondAttempt, 0);
    });

    it('reset() debe restablecer la llave a su estado inicial disponible', () => {
        const key = new Key(1, 11, 7);
        key.collect();
        assert.strictEqual(key.isCollected, true);

        key.reset();
        assert.strictEqual(key.isCollected, false);
        assert.strictEqual(key.isAvailable, true);
        assert.strictEqual(key.collect(), 500);
    });

    it('el jugador caminando por debajo en Nivel 1 no debe alcanzar la llave (requiere salto)', () => {
        const key = new Key(1, 11, 7); // y = 7 -> [224, 256] px, centro en 240 px, hitbox [228, 252] px

        // Jugador a pie en la plataforma del Nivel 1 (fila 9, Y = 9 * 32 = 288 px)
        // Hitbox del jugador: pies en 288, cabeza en 288 - 32 = 256 px
        // La base de la hitbox de la llave termina en 252 px, por lo que la cabeza (256 px) no la alcanza
        const playerCenterX = 11 * 32 + 16; // 368 px
        const playerFeetY = 288; // Suelo de Nivel 1

        const touchesWalking = key.checkOverlap(
            playerCenterX,
            playerFeetY,
            PlayerConstants.HITBOX_WIDTH,
            PlayerConstants.HITBOX_HEIGHT
        );

        assert.strictEqual(touchesWalking, false, 'No debe ser alcanzable caminando a pie');
    });

    it('el jugador saltando sobre el espacio vacío debe alcanzar la llave en el aire', () => {
        const key = new Key(1, 11, 7);

        // Jugador en el ápice de salto arcade (56 px de elevación desde Y = 288)
        // Pies en 288 - 56 = 232 px, cabeza en 232 - 32 = 200 px
        // Hitbox vertical del jugador en el salto: [200, 232] px
        // Hitbox de la llave: [228, 252] px -> Intersección limpia entre 228 y 232 px
        const playerCenterX = 11 * 32 + 16; // 368 px (sobre el espacio vacío)
        const playerApexFeetY = 288 - PlayerConstants.JUMP_HEIGHT_PIXELS; // 232 px

        const touchesInJump = key.checkOverlap(
            playerCenterX,
            playerApexFeetY,
            PlayerConstants.HITBOX_WIDTH,
            PlayerConstants.HITBOX_HEIGHT
        );

        assert.strictEqual(touchesInJump, true, 'Debe ser capturada limpiamente en el ápice del salto');
    });

    it('en Recámara 1 la llave debe quedar suspendida sobre un espacio vacío del Nivel 1 y anclada al techo', () => {
        const grid = new RoomGrid();
        grid.loadChamber(1);

        const key = ChamberKeys.createKeyForChamber(1);
        assert.ok(key !== null, 'Recámara 1 debe tener una llave configurada');
        assert.strictEqual(ChamberKeys.isKeyRequired(1), true, 'Recámara 1 debe requerir llave');

        // 1. La celda de la llave en sí misma debe ser espacio libre
        assert.strictEqual(grid.getTile(key.gridX, key.gridY), TileType.Empty);

        // 2. Directamente debajo en la plataforma del Nivel 1 (fila 9) debe ser un ESPACIO VACÍO (hueco)
        const platformTile = grid.getTile(key.gridX, 9);
        assert.strictEqual(
            platformTile,
            TileType.Empty,
            `En Recámara 1, la celda (${key.gridX}, 9) debe ser un espacio vacío/hueco`
        );

        // 3. El techo de anclaje de la cadena en fila 5 debe ser un muro sólido (SolidWall)
        const ceilingTile = grid.getTile(key.gridX, key.ceilingGridY);
        assert.strictEqual(
            ceilingTile,
            TileType.SolidWall,
            `El anclaje de la cadena en (${key.gridX}, ${key.ceilingGridY}) debe ser SolidWall`
        );

        // 4. La puerta de salida debe existir en la recámara
        assert.strictEqual(grid.isExitDoor(18, 4), true, 'La puerta de salida de Recámara 1 debe estar en (18, 4)');
    });

    it('todas las 10 recámaras deben contar con una llave configurada para poder abrir la puerta de salida', () => {
        const grid = new RoomGrid();

        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            grid.loadChamber(ch);

            // 1. Debe requerir llave
            assert.strictEqual(
                ChamberKeys.isKeyRequired(ch),
                true,
                `Recámara ${ch} debe requerir llave para salir`
            );

            // 2. Instancia válida de llave
            const key = ChamberKeys.createKeyForChamber(ch);
            assert.ok(key !== null, `Recámara ${ch} debe tener una llave instanciada`);
            assert.strictEqual(key.chamber, ch);
            assert.strictEqual(key.value, 500);

            // 3. La celda de la llave debe ser espacio transitable (TileType.Empty)
            assert.ok(
                grid.inBounds(key.gridX, key.gridY),
                `Recámara ${ch}: La llave (${key.gridX}, ${key.gridY}) está fuera de límites`
            );
            assert.strictEqual(
                grid.getTile(key.gridX, key.gridY),
                TileType.Empty,
                `Recámara ${ch}: La celda de la llave (${key.gridX}, ${key.gridY}) debe ser Empty`
            );

            // 4. El techo de anclaje de la cadena debe ser sólido
            assert.ok(
                key.ceilingGridY < key.gridY,
                `Recámara ${ch}: El techo de anclaje (${key.ceilingGridY}) debe estar sobre la llave (${key.gridY})`
            );
            assert.strictEqual(
                grid.getTile(key.gridX, key.ceilingGridY),
                TileType.SolidWall,
                `Recámara ${ch}: El techo en (${key.gridX}, ${key.ceilingGridY}) debe ser SolidWall`
            );

            // 5. Debe existir una puerta de salida en la recámara
            let hasDoor = false;
            for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
                for (let x = 0; x < GameConstants.GRID_COLUMNS; x++) {
                    if (grid.isExitDoor(x, y)) {
                        hasDoor = true;
                        break;
                    }
                }
                if (hasDoor) break;
            }
            assert.strictEqual(hasDoor, true, `Recámara ${ch} debe tener una puerta de salida (ExitDoor)`);

            // 6. La llave no debe solaparse con paredes movedizas, activadores, escaleras o tesoros
            const walls = ChamberMovingWalls.createWallsForChamber(ch);
            const treasures = ChamberTreasures.createTreasuresForChamber(ch);

            for (const w of walls) {
                assert.ok(
                    !(w.gridX === key.gridX && w.gridY === key.gridY),
                    `Recámara ${ch}: La llave no debe solapar pared movediza ${w.id}`
                );
                assert.ok(
                    !(w.outerTrigger.gridX === key.gridX && w.outerTrigger.gridY === key.gridY),
                    `Recámara ${ch}: La llave no debe solapar activador exterior`
                );
                assert.ok(
                    !(w.innerTrigger.gridX === key.gridX && w.innerTrigger.gridY === key.gridY),
                    `Recámara ${ch}: La llave no debe solapar activador interior`
                );
            }

            for (const t of treasures) {
                assert.ok(
                    !(t.gridX === key.gridX && t.gridY === key.gridY),
                    `Recámara ${ch}: La llave no debe solapar tesoro ${t.id}`
                );
            }

            assert.strictEqual(
                grid.isLadder(key.gridX, key.gridY),
                false,
                `Recámara ${ch}: La llave no debe solapar una escalera`
            );
        }
    });
});
