import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber7Puzzle } from '../../src/puzzles/Chamber7Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 7 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Ritual de Purificación (Llave + Saltos N3/N2 + Cofres + 5 Ciclos Puerta)', () => {
        it('no cuenta ciclos si los cofres o la puerta se activan antes de cumplir los prerrequisitos de purificación', () => {
            const puzzle = new Chamber7Puzzle();

            // Puerta activada sin nada
            puzzle.notifyWallActivated('ch7_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // Llave obtenida
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);

            // 1 solo salto en N3
            const mummyN3 = new Mummy(260, 128, 100, 350, Direction.Left);
            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right, 'mummy_fast', 1.2);
            puzzle.update(260, 128 - 16, true, [mummyN3, mummyN2]);
            assert.strictEqual(puzzle.hasJumpedN3ForPrereq, true);
            assert.strictEqual(puzzle.hasJumpedN2ForPrereq, false);

            puzzle.notifyWallActivated('ch7_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('revela el tesoro si se sigue la secuencia: Llave + Salto N3 + Salto N2 -> Cofres -> 5 ciclos', () => {
            const puzzle = new Chamber7Puzzle();

            // 1. Llave
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);

            // 2. Saltos en N3 y N2
            const mummyN3 = new Mummy(260, 128, 100, 350, Direction.Left);
            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right, 'mummy_fast', 1.2);
            const mummies = [mummyN3, mummyN2];

            puzzle.update(260, 128 - 16, true, mummies);
            puzzle.update(260, 128, false, mummies);
            assert.strictEqual(puzzle.hasJumpedN3ForPrereq, true);

            puzzle.update(220, 256 - 16, true, mummies);
            puzzle.update(220, 256, false, mummies);
            assert.strictEqual(puzzle.hasJumpedN2ForPrereq, true);

            // 3. Recoger ambos cofres
            puzzle.notifyTreasureCollected('ch7_t1');
            puzzle.notifyTreasureCollected('ch7_t2');
            assert.strictEqual(puzzle.initialTreasuresCollected, 2);

            // 4. 5 ciclos de puerta
            for (let i = 1; i <= 5; i++) {
                puzzle.notifyWallActivated('ch7_wall1');
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

    describe('Puzle 2: Dominio de la Momia Veloz (2 Saltos N3 + 3 Saltos Momia Rápida N2)', () => {
        it('debe registrar 2 saltos en N3 y 3 saltos en la momia veloz N2 para petrificar y obtener la gema de Horus', () => {
            const puzzle = new Chamber7Puzzle();

            const mummyN3 = new Mummy(260, 128, 100, 350, Direction.Left);
            const mummyN2 = new Mummy(220, 256, 120, 380, Direction.Right, 'mummy_fast', 1.2);
            const mummies = [mummyN3, mummyN2];

            // 2 saltos N3
            for (let i = 1; i <= 2; i++) {
                puzzle.update(260, 128 - 16, true, mummies);
                puzzle.update(260, 128, false, mummies);
                assert.strictEqual(puzzle.mummyJumpsN3, i);
            }

            // 3 saltos en la momia rápida N2
            for (let i = 1; i <= 3; i++) {
                puzzle.update(220, 256 - 16, true, mummies);
                puzzle.update(220, 256, false, mummies);
                assert.strictEqual(puzzle.mummyJumpsN2, i);
            }

            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);

            // Saqueo en (11, 9)
            const gemX = 11 * GameConstants.TILE_SIZE + 16;
            const gemY = 9 * GameConstants.TILE_SIZE + 16;
            const gemPts = puzzle.checkGemCollection(gemX, gemY);
            assert.strictEqual(gemPts, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);
        });
    });
});
