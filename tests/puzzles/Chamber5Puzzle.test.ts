import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber5Puzzle } from '../../src/puzzles/Chamber5Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 5 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Recarga Sagrada del Faraón (2 Cofres + Llave + 3 Ciclos Puerta N0)', () => {
        it('debe inicializarse con contadores en cero y tesoro secreto oculto', () => {
            const puzzle = new Chamber5Puzzle();

            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('no incrementa ciclos si falta recoger la llave o los dos cofres iniciales', () => {
            const puzzle = new Chamber5Puzzle();

            puzzle.notifyTreasureCollected('ch5_t1');
            puzzle.notifyWallActivated('ch5_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            puzzle.notifyTreasureCollected('ch5_t2');
            puzzle.notifyWallActivated('ch5_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // Tras recoger la llave, ahora sí cuenta ciclos
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);

            puzzle.notifyWallActivated('ch5_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);

            puzzle.notifyWallActivated('ch5_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 2);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);

            puzzle.notifyWallActivated('ch5_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 3);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, true);

            // Saqueo
            const pts = puzzle.checkSecretTreasureCollection(
                17 * GameConstants.TILE_SIZE + 16,
                13 * GameConstants.TILE_SIZE + 32
            );
            assert.strictEqual(pts, 1000);
            assert.strictEqual(puzzle.isSecretTreasureCollected, true);
        });
    });

    describe('Puzle 2: Doble Salto Sagrado en Alturas con Espacio Libre (2 Saltos N2 + 2 Saltos N3)', () => {
        it('debe registrar 2 saltos en N2 y 2 saltos en N3 para petrificar y revelar la gema', () => {
            const puzzle = new Chamber5Puzzle();

            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right); // Nivel 2 (y=256, 96px espacio libre)
            const mummyN3 = new Mummy(200, 128, 80, 400, Direction.Left);   // Nivel 3 (y=128, 96px espacio libre)
            const mummies = [mummyN2, mummyN3];

            // 2 saltos sobre momia de Nivel 2
            puzzle.update(220, 256 - 16, true, mummies);
            puzzle.update(220, 256, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 1);

            puzzle.update(220, 256 - 16, true, mummies);
            puzzle.update(220, 256, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 2);
            assert.strictEqual(puzzle.isGemSpawned, false);

            // 2 saltos sobre momia de Nivel 3
            puzzle.update(200, 128 - 16, true, mummies);
            puzzle.update(200, 128, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN3, 1);
            assert.strictEqual(puzzle.isGemSpawned, false);

            puzzle.update(200, 128 - 16, true, mummies);
            assert.strictEqual(puzzle.mummyJumpsN3, 2);
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);

            // Saqueo de Gema Sagrada de Osiris en (6, 10)
            const gemX = 6 * GameConstants.TILE_SIZE + 16;
            const gemY = 10 * GameConstants.TILE_SIZE + 16;
            const gemPts = puzzle.checkGemCollection(gemX, gemY);
            assert.strictEqual(gemPts, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);
        });
    });

    describe('Restablecimiento [R]', () => {
        it('reset() restablece el estado correctamente', () => {
            const puzzle = new Chamber5Puzzle();
            puzzle.notifyKeyCollected();
            puzzle.notifyTreasureCollected('ch5_t1');
            puzzle.reset();

            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.doorCycleCount, 0);
        });
    });
});
