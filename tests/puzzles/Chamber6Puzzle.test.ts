import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber6Puzzle } from '../../src/puzzles/Chamber6Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 6 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Bóveda Inversa (Cofre N2 Primero -> Cofre N0 + Llave + 2 Ciclos Puerta)', () => {
        it('invalida el puzle si se recoge primero el cofre N0 antes que el cofre N2', () => {
            const puzzle = new Chamber6Puzzle();

            // Recoger cofre N0 primero (invalida el orden estricto)
            puzzle.notifyTreasureCollected('ch6_t1');
            assert.strictEqual(puzzle.puzzle1Stage, -1);

            puzzle.notifyTreasureCollected('ch6_t2');
            puzzle.notifyKeyCollected();
            puzzle.notifyWallActivated('ch6_wall1');
            puzzle.notifyWallActivated('ch6_wall1');

            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('revela el tesoro secreto si se sigue el orden estricto: Cofre N2 -> Cofre N0 -> Llave -> 2 ciclos', () => {
            const puzzle = new Chamber6Puzzle();

            // 1. Cofre N2
            puzzle.notifyTreasureCollected('ch6_t2');
            assert.strictEqual(puzzle.puzzle1Stage, 1);

            // 2. Cofre N0
            puzzle.notifyTreasureCollected('ch6_t1');
            assert.strictEqual(puzzle.puzzle1Stage, 1);

            // 3. Llave
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);
            assert.strictEqual(puzzle.puzzle1Stage, 2);

            // 4. 2 ciclos de puerta
            puzzle.notifyWallActivated('ch6_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
            puzzle.notifyWallActivated('ch6_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 2);
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

    describe('Puzle 2: Acrobacia en la Plataforma Alta (4 Saltos sobre Momia de Nivel 3)', () => {
        it('debe registrar 4 saltos sobre la momia de N3 (con 96px de espacio libre) para petrificarla y liberar la gema de Anubis', () => {
            const puzzle = new Chamber6Puzzle();

            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right); // Nivel 2 (y=256, 96px espacio libre)
            const mummyN3 = new Mummy(260, 128, 100, 350, Direction.Left);  // Nivel 3 (y=128, 96px espacio libre)
            const mummies = [mummyN2, mummyN3];

            for (let i = 1; i <= 3; i++) {
                puzzle.update(260, 128 - 16, true, mummies);
                puzzle.update(260, 128, false, mummies);
                assert.strictEqual(puzzle.mummyJumpsN3, i);
                assert.strictEqual(puzzle.isGemSpawned, false);
            }

            // 4.º salto
            puzzle.update(260, 128 - 16, true, mummies);
            assert.strictEqual(puzzle.mummyJumpsN3, 4);
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);

            // Saqueo en (12, 9)
            const gemX = 12 * GameConstants.TILE_SIZE + 16;
            const gemY = 9 * GameConstants.TILE_SIZE + 16;
            const gemPts = puzzle.checkGemCollection(gemX, gemY);
            assert.strictEqual(gemPts, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);
        });
    });
});
