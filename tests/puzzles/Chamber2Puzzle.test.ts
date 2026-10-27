import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber2Puzzle } from '../../src/puzzles/Chamber2Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 2 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Secuencia Estricta del Faraón (Nivel 0)', () => {
        it('debe inicializarse en etapa 0 con contadores en cero y tesoro no materializado', () => {
            const puzzle = new Chamber2Puzzle();

            assert.strictEqual(puzzle.puzzle1Stage, 0);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            assert.strictEqual(puzzle.isSecretTreasureCollected, false);
            assert.strictEqual(puzzle.secretTreasure.gridX, 17);
            assert.strictEqual(puzzle.secretTreasure.gridY, 13);
        });

        it('PASO 1: saquear primero el tesoro de Nivel 0 antes de la llave avanza a etapa 1', () => {
            const puzzle = new Chamber2Puzzle();

            puzzle.notifyTreasureCollected('ch2_t1');
            assert.strictEqual(puzzle.puzzle1Stage, 1);

            const notifs = puzzle.consumePendingNotifications();
            assert.strictEqual(notifs.length, 1);
            assert.match(notifs[0].text, /SECUENCIA RÚNICA INICIADA/);
        });

        it('FALLO: recolectar la llave antes del tesoro de Nivel 0 rompe la secuencia estricta (-1)', () => {
            const puzzle = new Chamber2Puzzle();

            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.puzzle1Stage, -1);

            // Incluso si luego recoge el tesoro de Nivel 0, la secuencia permanece bloqueada
            puzzle.notifyTreasureCollected('ch2_t1');
            assert.strictEqual(puzzle.puzzle1Stage, -1);

            // La activación de la pared movediza no incrementa ciclos
            puzzle.notifyWallActivated('ch2_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('PASO 2: recolectar la llave sagrada tras el cofre de N0 avanza a etapa 2', () => {
            const puzzle = new Chamber2Puzzle();

            puzzle.notifyTreasureCollected('ch2_t1');
            assert.strictEqual(puzzle.puzzle1Stage, 1);

            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.puzzle1Stage, 2);

            const notifs = puzzle.consumePendingNotifications();
            assert.strictEqual(notifs.length, 2);
            assert.match(notifs[1].text, /Paso 2\/3: Llave Obtenida/);
        });

        it('PASO 3: saltar sobre la momia de Nivel 1 en etapa 2 avanza a etapa 3', () => {
            const puzzle = new Chamber2Puzzle();
            puzzle.notifyTreasureCollected('ch2_t1');
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.puzzle1Stage, 2);

            // Momia en Nivel 1 (y = 320, x = 200)
            const mummyN1 = new Mummy(200, 320, 80, 368, Direction.Left, 1.0);
            const mummies = [mummyN1];

            puzzle.consumePendingNotifications();

            // Jugador salta limpiamente sobre la momia de N1
            puzzle.update(200, 320 - 16, true, mummies);
            assert.strictEqual(puzzle.puzzle1Stage, 3);
            assert.strictEqual(puzzle.mummyJumpsN1, 1);

            const notifs = puzzle.consumePendingNotifications();
            assert.strictEqual(notifs.length, 2);
            assert.match(notifs[0].text, /Paso 3\/3: Salto Momia N1/);
            assert.match(notifs[1].text, /SALTO SOBRE MOMIA/);
        });

        it('PASO 4: en etapa 3, completar 2 ciclos de puerta materializa el tesoro secreto en (17, 13)', () => {
            const puzzle = new Chamber2Puzzle();
            puzzle.notifyTreasureCollected('ch2_t1');
            puzzle.notifyKeyCollected();

            const mummyN1 = new Mummy(200, 320, 80, 368, Direction.Left, 1.0);
            puzzle.update(200, 320 - 16, true, [mummyN1]);
            assert.strictEqual(puzzle.puzzle1Stage, 3);

            // Ciclo 1 de pared movediza
            puzzle.notifyWallActivated('ch2_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);

            // Ciclo 2 de pared movediza -> Materialización
            puzzle.notifyWallActivated('ch2_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 2);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, true);

            // Saqueo del tesoro secreto
            const playerX = 17 * GameConstants.TILE_SIZE + 16;
            const playerY = 13 * GameConstants.TILE_SIZE + 32;
            const pts = puzzle.checkSecretTreasureCollection(playerX, playerY);
            assert.strictEqual(pts, 1000);
            assert.strictEqual(puzzle.isSecretTreasureCollected, true);

            // Segundo intento no otorga puntos dobles
            assert.strictEqual(puzzle.checkSecretTreasureCollection(playerX, playerY), 0);
        });
    });

    describe('Puzle 2: Doble Fase de Saltos de Momias (2 en N1 + 2 en N2)', () => {
        it('debe registrar 2 saltos en Nivel 1 y 2 saltos en Nivel 2 para petrificar y revelar la gema', () => {
            const puzzle = new Chamber2Puzzle();

            const mummyN1 = new Mummy(200, 320, 80, 368, Direction.Left, 1.0); // Nivel 1
            const mummyN2 = new Mummy(300, 192, 144, 400, Direction.Right, 1.0); // Nivel 2
            const mummies = [mummyN1, mummyN2];

            // Salto 1 en Nivel 1
            puzzle.update(200, 320 - 16, true, mummies);
            puzzle.update(200, 320, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN1, 1);
            assert.strictEqual(puzzle.isGemSpawned, false);

            // Salto 2 en Nivel 1
            puzzle.update(200, 320 - 16, true, mummies);
            puzzle.update(200, 320, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN1, 2);
            assert.strictEqual(puzzle.isGemSpawned, false);

            // Salto 1 en Nivel 2
            puzzle.update(300, 192 - 16, true, mummies);
            puzzle.update(300, 192, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 1);
            assert.strictEqual(puzzle.isGemSpawned, false);

            // Salto 2 en Nivel 2 -> Condición cumplida (2 en N1 + 2 en N2)
            puzzle.update(300, 192 - 16, true, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 2);
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);
            assert.strictEqual(mummyN1.isActive, false);
            assert.strictEqual(mummyN2.isActive, false);

            // Saqueo de la Gema Sagrada en (12, 8)
            const gemX = 12 * GameConstants.TILE_SIZE + 16;
            const gemY = 8 * GameConstants.TILE_SIZE + 16;
            const gemPts = puzzle.checkGemCollection(gemX, gemY);
            assert.strictEqual(gemPts, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);
        });

        it('la petrificación debe expirar tras 300 frames y reactivar a las momias', () => {
            const puzzle = new Chamber2Puzzle();
            const mummyN1 = new Mummy(200, 320, 80, 368, Direction.Left, 1.0);
            const mummyN2 = new Mummy(300, 192, 144, 400, Direction.Right, 1.0);
            const mummies = [mummyN1, mummyN2];

            // Cumplir saltos
            puzzle.update(200, 320 - 16, true, mummies);
            puzzle.update(200, 320, false, mummies);
            puzzle.update(200, 320 - 16, true, mummies);
            puzzle.update(200, 320, false, mummies);

            puzzle.update(300, 192 - 16, true, mummies);
            puzzle.update(300, 192, false, mummies);
            puzzle.update(300, 192 - 16, true, mummies);

            assert.strictEqual(puzzle.isMummyPetrified, true);

            // 299 frames
            for (let f = 0; f < 299; f++) {
                puzzle.update(50, 448, false, mummies);
                assert.strictEqual(puzzle.isMummyPetrified, true);
            }

            // Frame 300 -> Despetrificación
            puzzle.update(50, 448, false, mummies);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(mummyN1.isActive, true);
            assert.strictEqual(mummyN2.isActive, true);
        });
    });

    describe('Restablecimiento [R]', () => {
        it('reset() debe restablecer todos los contadores y banderas al estado inicial', () => {
            const puzzle = new Chamber2Puzzle();
            puzzle.notifyTreasureCollected('ch2_t1');
            puzzle.notifyKeyCollected();
            puzzle.reset();

            assert.strictEqual(puzzle.puzzle1Stage, 0);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            assert.strictEqual(puzzle.mummyJumpsN1, 0);
            assert.strictEqual(puzzle.mummyJumpsN2, 0);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(puzzle.isGemSpawned, false);
        });
    });
});
