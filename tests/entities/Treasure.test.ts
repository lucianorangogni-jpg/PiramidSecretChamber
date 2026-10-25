import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Treasure } from '../../src/entities/Treasure.ts';
import { TreasureState } from '../../src/entities/TreasureState.ts';
import { ChamberTreasures } from '../../src/grid/ChamberTreasures.ts';
import { RoomGrid } from '../../src/grid/RoomGrid.ts';
import { TileType } from '../../src/grid/TileType.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Treasure Mechanics & Chamber Layout Specs [US-020]', () => {
    it('debe inicializarse con coordenadas, valor por defecto y estado Available', () => {
        const treasure = new Treasure(17, 13);

        assert.strictEqual(treasure.gridX, 17);
        assert.strictEqual(treasure.gridY, 13);
        assert.strictEqual(treasure.value, 1000);
        assert.strictEqual(treasure.state, TreasureState.Available);
        assert.strictEqual(treasure.isAvailable, true);
        assert.strictEqual(treasure.isCollected, false);
        assert.strictEqual(treasure.pixelX, 17 * 32);
        assert.strictEqual(treasure.pixelY, 13 * 32);
    });

    it('collect() debe transicionar a Collected y otorgar puntos solo una vez', () => {
        const treasure = new Treasure(8, 4, 1000);

        // Primera recolección
        const pointsAwarded = treasure.collect();
        assert.strictEqual(pointsAwarded, 1000);
        assert.strictEqual(treasure.state, TreasureState.Collected);
        assert.strictEqual(treasure.isAvailable, false);
        assert.strictEqual(treasure.isCollected, true);

        // Segunda recolección inmediata (debe retornar 0 puntos)
        const secondAttempt = treasure.collect();
        assert.strictEqual(secondAttempt, 0);
        assert.strictEqual(treasure.state, TreasureState.Collected);
    });

    it('reset() debe devolver el cofre a su estado Available inicial', () => {
        const treasure = new Treasure(8, 4);
        treasure.collect();
        assert.strictEqual(treasure.isCollected, true);

        treasure.reset();
        assert.strictEqual(treasure.state, TreasureState.Available);
        assert.strictEqual(treasure.isAvailable, true);
        assert.strictEqual(treasure.isCollected, false);

        // Debe poder volver a recolectarse tras reset
        assert.strictEqual(treasure.collect(), 1000);
    });

    it('checkOverlap() debe detectar correctamente el contacto con el hitbox del jugador', () => {
        const treasure = new Treasure(10, 10); // x: 320..352, y: 320..352

        // Jugador centrado en (336, 352) con hitbox 28x32
        // X: [336 - 14, 336 + 14] = [322, 350], Y: [352 - 32, 352] = [320, 352]
        assert.strictEqual(treasure.checkOverlap(336, 352, 28, 32), true);

        // Jugador alejado a la izquierda (x: 200, y: 352) -> fuera de rango
        assert.strictEqual(treasure.checkOverlap(200, 352, 28, 32), false);

        // Jugador por encima del cofre (y: 280) -> sin solapamiento vertical
        assert.strictEqual(treasure.checkOverlap(336, 280, 28, 32), false);
    });

    it('cada una de las 10 recámaras debe tener exactamente 2 cofres de tesoro', () => {
        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            const treasures = ChamberTreasures.createTreasuresForChamber(ch);
            assert.strictEqual(treasures.length, 2, `Recámara ${ch} debe tener 2 tesoros`);
            assert.strictEqual(treasures[0].value, 1000);
            assert.strictEqual(treasures[1].value, 1000);
        }
    });

    it('todos los tesoros en las 10 recámaras deben situarse en espacio transitable con soporte de suelo firme', () => {
        const grid = new RoomGrid();

        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            grid.loadChamber(ch);
            const treasures = ChamberTreasures.createTreasuresForChamber(ch);

            for (const t of treasures) {
                // 1. Debe estar dentro de los límites de la pantalla
                assert.ok(grid.inBounds(t.gridX, t.gridY), `Recámara ${ch}: Tesoro fuera de límites (${t.gridX}, ${t.gridY})`);

                // 2. La celda del cofre debe estar libre (TileType.Empty)
                const currentTile = grid.getTile(t.gridX, t.gridY);
                assert.strictEqual(
                    currentTile,
                    TileType.Empty,
                    `Recámara ${ch}: La celda del tesoro (${t.gridX}, ${t.gridY}) no está vacía (TileType: ${currentTile})`
                );

                // 3. La celda inmediatamente inferior debe tener suelo firme (SolidWall)
                const floorTile = grid.getTile(t.gridX, t.gridY + 1);
                assert.strictEqual(
                    floorTile,
                    TileType.SolidWall,
                    `Recámara ${ch}: El tesoro en (${t.gridX}, ${t.gridY}) no tiene suelo sólido debajo (TileType: ${floorTile})`
                );

                // 4. No debe solapar una escalera
                assert.strictEqual(grid.isLadder(t.gridX, t.gridY), false);

                // 5. No debe solapar la puerta de salida
                assert.strictEqual(grid.isExitDoor(t.gridX, t.gridY), false);
            }
        }
    });
});

