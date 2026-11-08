import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Chamber10LeverGate } from '../../src/entities/Chamber10LeverGate.ts';
import { RoomGrid } from '../../src/grid/RoomGrid.ts';
import { TileType } from '../../src/grid/TileType.ts';
import { PuzzleProgressTracker } from '../../src/puzzles/PuzzleProgressTracker.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 10 Pharaoh Lever & Apex Gate Specs [US-026]', () => {
    it('debe definir las coordenadas correctas de la palanca suspendida y del muro de la escalera', () => {
        assert.strictEqual(Chamber10LeverGate.LEVER_GRID_X, 8);
        assert.strictEqual(Chamber10LeverGate.LEVER_GRID_Y, 3);
        assert.strictEqual(Chamber10LeverGate.WALL_GRID_X, 13);
        assert.deepStrictEqual(Chamber10LeverGate.WALL_ROWS, [3, 4]);

        const gate = new Chamber10LeverGate();
        assert.strictEqual(gate.leverWorldX, 8 * GameConstants.TILE_SIZE + 16); // 272
        assert.strictEqual(gate.leverWorldY, 3 * GameConstants.TILE_SIZE + 16); // 112
        assert.strictEqual(gate.isLeverPulled, false);
        assert.strictEqual(gate.isWallOpen, false);
    });

    it('la palanca suspendida en fila 3 NO debe ser alcanzada por el jugador de pie caminando en Nivel 2', () => {
        const gate = new Chamber10LeverGate();
        const player = { x: gate.leverWorldX, y: 5 * GameConstants.TILE_SIZE }; // Suelo Nivel 2 (y = 160)

        // Jugador parado debajo de la palanca
        const overlapsStanding = gate.isPlayerOverlappingLever(player);
        assert.strictEqual(
            overlapsStanding,
            false,
            'Un jugador de pie (cabeza en y=132) no debe alcanzar la palanca que cuelga en y=112'
        );
    });

    it('la palanca suspendida solo debe ser alcanzada mientras el jugador SALTA en el aire', () => {
        const gate = new Chamber10LeverGate();
        // Durante el salto, el jugador sube hasta y = 124 (cabeza en y = 96)
        const jumpingPlayer = { x: gate.leverWorldX, y: 128 };

        const overlapsJumping = gate.isPlayerOverlappingLever(jumpingPlayer);
        assert.strictEqual(
            overlapsJumping,
            true,
            'El jugador saltando en el aire debe intersectar la palanca suspendida'
        );
    });

    it('si faltan puzles por resolver, accionar la palanca debe fallar y reportar los puzles restantes', () => {
        const gate = new Chamber10LeverGate();
        const tracker = new PuzzleProgressTracker();
        tracker.reset();
        const grid = new RoomGrid();
        grid.loadChamber(10);

        const jumpingPlayer = { x: gate.leverWorldX, y: 128 };

        // Caso 1: 0 puzles resueltos (faltan 18)
        const result0 = gate.tryInteract(jumpingPlayer, tracker, grid);
        assert.ok(result0);
        assert.strictEqual(result0.success, false);
        assert.strictEqual(result0.remainingPuzzles, 18);
        assert.strictEqual(result0.solvedPuzzles, 0);
        assert.ok(result0.message.includes('Faltan resolver 18 puzzles'));
        assert.strictEqual(gate.isWallOpen, false);
        assert.strictEqual(grid.getTile(13, 3), TileType.SolidWall);
        assert.strictEqual(grid.getTile(13, 4), TileType.SolidWall);

        // Intentar inmediatamente debe retornar null por el cooldown
        const inCooldown = gate.tryInteract(jumpingPlayer, tracker, grid);
        assert.strictEqual(inCooldown, null);

        // Actualizar 60 frames para expirar el cooldown
        for (let i = 0; i < 60; i++) gate.update();

        // Caso 2: Resolver 15 puzles (faltan 3)
        for (let ch = 1; ch <= 7; ch++) {
            tracker.markPuzzle1Solved(ch);
            tracker.markPuzzle2Solved(ch);
        }
        tracker.markPuzzle1Solved(8); // 15 resueltos

        const result15 = gate.tryInteract(jumpingPlayer, tracker, grid);
        assert.ok(result15);
        assert.strictEqual(result15.success, false);
        assert.strictEqual(result15.remainingPuzzles, 3);
        assert.strictEqual(result15.solvedPuzzles, 15);
        assert.ok(result15.message.includes('Faltan resolver 3 puzzles'));

        for (let i = 0; i < 60; i++) gate.update();

        // Caso 3: Falta 1 puzle (17 resueltos)
        tracker.markPuzzle2Solved(8);
        tracker.markPuzzle1Solved(9); // 17 resueltos

        const result17 = gate.tryInteract(jumpingPlayer, tracker, grid);
        assert.ok(result17);
        assert.strictEqual(result17.success, false);
        assert.strictEqual(result17.remainingPuzzles, 1);
        assert.strictEqual(result17.solvedPuzzles, 17);
        assert.ok(result17.message.includes('Falta resolver 1 puzzle'));
    });

    it('si TODOS los 18 puzles están resueltos, accionar la palanca debe abrir el muro y la escalera', () => {
        const gate = new Chamber10LeverGate();
        const tracker = new PuzzleProgressTracker();
        tracker.reset();
        const grid = new RoomGrid();
        grid.loadChamber(10);

        // Resolver todos los 18 puzles de las recámaras 1 a 9
        for (let ch = 1; ch <= 9; ch++) {
            tracker.markPuzzle1Solved(ch);
            tracker.markPuzzle2Solved(ch);
        }
        assert.strictEqual(tracker.areAllPrerequisitePuzzlesSolved, true);

        const jumpingPlayer = { x: gate.leverWorldX, y: 128 };
        const result = gate.tryInteract(jumpingPlayer, tracker, grid);

        assert.ok(result);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.remainingPuzzles, 0);
        assert.strictEqual(result.solvedPuzzles, 18);
        assert.ok(result.message.includes('MURO DEL FARAÓN ABIERTO'));

        // Estado de la entidad
        assert.strictEqual(gate.isLeverPulled, true);
        assert.strictEqual(gate.isWallOpen, true);

        // Verificación en la cuadrícula: las casillas cerradas del muro se abrieron en escalera transitable
        assert.strictEqual(grid.getTile(13, 3), TileType.Ladder);
        assert.strictEqual(grid.getTile(13, 4), TileType.Ladder);
    });

    it('Recámara 10 debe configurar la nueva plataforma Nivel 3 accesible por escalera cerrada por muro', () => {
        const grid = new RoomGrid();
        grid.loadChamber(10);

        // Debe tener 4 plataformas registradas
        assert.strictEqual(grid.registeredPlatforms.length, 4);
        assert.strictEqual(grid.registeredPlatforms[0].level, 0); // Suelo Base (fila 14)
        assert.strictEqual(grid.registeredPlatforms[1].level, 1); // Nivel 1 (fila 9)
        assert.strictEqual(grid.registeredPlatforms[2].level, 2); // Nivel 2 (fila 5)
        assert.strictEqual(grid.registeredPlatforms[3].level, 3); // NUEVA PLATAFORMA Cúspide (fila 2)

        // La nueva plataforma Nivel 3 está en fila 2 (columnas 14 a 18 suelo firme, col 13 acceso de escalera)
        for (let x = 14; x <= 18; x++) {
            assert.strictEqual(grid.getTile(x, 2), TileType.SolidWall, `Plataforma Nivel 3 en col ${x}, fila 2`);
        }

        // Escalera 3 en columna 13: fila 2 y 5 son peldaños transitables
        assert.strictEqual(grid.getTile(13, 2), TileType.Ladder);
        assert.strictEqual(grid.getTile(13, 5), TileType.Ladder);

        // Muro de cierre que bloquea la escalera en filas 3 y 4
        assert.strictEqual(grid.getTile(13, 3), TileType.SolidWall, 'Muro de cierre en col 13, fila 3');
        assert.strictEqual(grid.getTile(13, 4), TileType.SolidWall, 'Muro de cierre en col 13, fila 4');

        // Puerta de salida en la nueva plataforma superior (col 18, fila 1)
        assert.strictEqual(grid.isExitDoor(18, 1), true, 'Puerta de salida en Nivel 3 (18, 1)');
    });
});
