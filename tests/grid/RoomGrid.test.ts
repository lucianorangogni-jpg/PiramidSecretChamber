import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RoomGrid } from '../../src/grid/RoomGrid.ts';
import { TileType } from '../../src/grid/TileType.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('RoomGrid Architecture & Chambers Specs', () => {
    it('debe mapear correctamente los 4 niveles de la pirámide', () => {
        // Nivel 1: Recámaras 1 a 4
        assert.strictEqual(RoomGrid.getPyramidLevel(1), 1);
        assert.strictEqual(RoomGrid.getPyramidLevel(2), 1);
        assert.strictEqual(RoomGrid.getPyramidLevel(3), 1);
        assert.strictEqual(RoomGrid.getPyramidLevel(4), 1);

        // Nivel 2: Recámaras 5 a 7
        assert.strictEqual(RoomGrid.getPyramidLevel(5), 2);
        assert.strictEqual(RoomGrid.getPyramidLevel(6), 2);
        assert.strictEqual(RoomGrid.getPyramidLevel(7), 2);

        // Nivel 3: Recámaras 8 y 9
        assert.strictEqual(RoomGrid.getPyramidLevel(8), 3);
        assert.strictEqual(RoomGrid.getPyramidLevel(9), 3);

        // Nivel 4: Cúspide (Recámara 10)
        assert.strictEqual(RoomGrid.getPyramidLevel(10), 4);
    });

    it('todas las 10 recámaras deben tener muros perimetrales impenetrables', () => {
        const grid = new RoomGrid();

        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            grid.loadChamber(ch);

            // Techo y Suelo inferior
            for (let x = 0; x < GameConstants.GRID_COLUMNS; x++) {
                assert.strictEqual(grid.getTile(x, 0), TileType.SolidWall, `Techo en recámara ${ch}, col ${x}`);
                assert.strictEqual(grid.getTile(x, GameConstants.GRID_ROWS - 1), TileType.SolidWall, `Suelo en recámara ${ch}, col ${x}`);
            }

            // Paredes izquierda y derecha
            for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
                assert.strictEqual(grid.getTile(0, y), TileType.SolidWall, `Pared izq en recámara ${ch}, fila ${y}`);
                assert.strictEqual(grid.getTile(GameConstants.GRID_COLUMNS - 1, y), TileType.SolidWall, `Pared der en recámara ${ch}, fila ${y}`);
            }
        }
    });

    it('fuera de límites debe considerarse siempre sólido para evitar salidas', () => {
        const grid = new RoomGrid();
        assert.strictEqual(grid.isSolid(-1, 5), true);
        assert.strictEqual(grid.isSolid(25, 5), true);
        assert.strictEqual(grid.isSolid(5, -1), true);
        assert.strictEqual(grid.isSolid(5, 20), true);
    });

    it('Recámara 1 debe tener escaleras en columna 5 y columna 10', () => {
        const grid = new RoomGrid();
        grid.loadChamber(1);

        // Escalera 1: col 5 (filas 9 a 13)
        for (let y = 9; y <= 13; y++) {
            assert.strictEqual(grid.isLadder(5, y), true, `Escalera 1 fila ${y}`);
        }

        // Escalera 2: col 10 (filas 5 a 9)
        for (let y = 5; y <= 9; y++) {
            assert.strictEqual(grid.isLadder(10, y), true, `Escalera 2 fila ${y}`);
        }

        // Placa de activación en (8, 13)
        assert.strictEqual(grid.isPressurePlate(8, 13), true);

        // Puerta de salida en (18, 4)
        assert.strictEqual(grid.isExitDoor(18, 4), true);
    });

    it('debe registrar y calcular las alturas de plataforma', () => {
        const grid = new RoomGrid();
        grid.loadChamber(1);

        assert.strictEqual(grid.registeredPlatforms.length, 3);
        assert.strictEqual(grid.registeredPlatforms[0].level, 0);
        assert.strictEqual(grid.registeredPlatforms[1].level, 1);
        assert.strictEqual(grid.registeredPlatforms[2].level, 2);
    });
});
