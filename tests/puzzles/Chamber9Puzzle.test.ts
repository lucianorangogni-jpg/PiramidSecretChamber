import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber9Puzzle } from '../../src/puzzles/Chamber9Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 9 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Sello Final de la Cúspide (Llave Primero -> Cofres + 3 Saltos + 3 Ciclos)', () => {
        it('invalida el sello si se recoge un cofre antes de la llave sagrada', () => {
            const puzzle = new Chamber9Puzzle();

            puzzle.notifyTreasureCollected('ch9_t1');
            assert.strictEqual(puzzle.keyCollectedFirst, false);

            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);
            assert.strictEqual(puzzle.keyCollectedFirst, false);

            puzzle.notifyTreasureCollected('ch9_t2');

            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right);
            for (let i = 0; i < 3; i++) {
                puzzle.update(220, 256 - 16, true, [mummyN2]);
                puzzle.update(220, 256, false, [mummyN2]);
            }

            for (let i = 0; i < 3; i++) {
                puzzle.notifyWallActivated('ch9_wall1');
            }

            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('revela el tesoro al seguir la secuencia: Llave Primero -> Cofres -> 3 Saltos -> 3 Ciclos', () => {
            const puzzle = new Chamber9Puzzle();

            // 1. Llave primero
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);
            assert.strictEqual(puzzle.keyCollectedFirst, true);

            // 2. Cofres
            puzzle.notifyTreasureCollected('ch9_t1');
            puzzle.notifyTreasureCollected('ch9_t2');
            assert.strictEqual(puzzle.initialTreasuresCollected, 2);

            // 3. 3 saltos
            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right);
            for (let i = 1; i <= 3; i++) {
                puzzle.update(220, 256 - 16, true, [mummyN2]);
                puzzle.update(220, 256, false, [mummyN2]);
            }
            assert.strictEqual(puzzle.totalMummyJumps, 3);

            // 4. 3 ciclos de puerta
            for (let i = 1; i <= 3; i++) {
                puzzle.notifyWallActivated('ch9_wall1');
                assert.strictEqual(puzzle.doorCycleCount, i);
            }
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

    describe('Puzle 2: Saltos en la Cúspide (2 Saltos N2 + 2 Saltos N3)', () => {
        it('debe registrar 2 saltos en N2 y 2 saltos en N3 para petrificar y revelar la gema del Ojo de Horus', () => {
            const puzzle = new Chamber9Puzzle();

            const mummyN1 = new Mummy(260, 352, 100, 350, Direction.Left);
            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right);
            const mummyN3 = new Mummy(240, 160, 120, 360, Direction.Left);
            const mummies = [mummyN1, mummyN2, mummyN3];

            // 2 saltos N2
            for (let i = 1; i <= 2; i++) {
                puzzle.update(220, 256 - 16, true, mummies);
                puzzle.update(220, 256, false, mummies);
                assert.strictEqual(puzzle.mummyJumpsN2, i);
            }

            // 2 saltos N3
            puzzle.update(240, 160 - 16, true, mummies);
            puzzle.update(240, 160, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN3, 1);
            assert.strictEqual(puzzle.isGemSpawned, false);

            puzzle.update(240, 160 - 16, true, mummies);
            assert.strictEqual(puzzle.mummyJumpsN3, 2);
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
