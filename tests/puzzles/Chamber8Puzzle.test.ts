import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber8Puzzle } from '../../src/puzzles/Chamber8Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 8 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Ascensión Total (2 Cofres + Llave + Salto N3 + 1 Ciclo Puerta)', () => {
        it('no revela el tesoro si falta saltar sobre la momia de Nivel 3', () => {
            const puzzle = new Chamber8Puzzle();

            puzzle.notifyTreasureCollected('ch8_t1');
            puzzle.notifyTreasureCollected('ch8_t2');
            puzzle.notifyKeyCollected();
            puzzle.notifyWallActivated('ch8_wall1');

            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('revela el tesoro al completar los 4 requisitos y activar 1 ciclo', () => {
            const puzzle = new Chamber8Puzzle();

            puzzle.notifyTreasureCollected('ch8_t1');
            puzzle.notifyTreasureCollected('ch8_t2');
            puzzle.notifyKeyCollected();

            const mummyN3 = new Mummy(240, 160, 120, 360, Direction.Left);
            puzzle.update(240, 160 - 16, true, [mummyN3]);
            assert.strictEqual(puzzle.hasJumpedN3ForPrereq, true);

            puzzle.notifyWallActivated('ch8_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
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

    describe('Puzle 2: Duelo de Guardianas Sagradas (2 Saltos N2 + 2 Saltos N3)', () => {
        it('debe registrar 2 saltos en N2 y 2 saltos en N3 para petrificar y liberar la gema de Isis', () => {
            const puzzle = new Chamber8Puzzle();

            const mummyN2 = new Mummy(100, 256, 64, 224, Direction.Right);  // Nivel 2 (cols 2..7, y=256, 128px espacio libre)
            const mummyN3 = new Mummy(380, 160, 288, 512, Direction.Left);  // Nivel 3 (cols 9..16, y=160, 128px espacio libre)
            const mummies = [mummyN2, mummyN3];

            // 2 saltos N2
            puzzle.update(100, 256 - 16, true, mummies);
            puzzle.update(100, 256, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 1);

            puzzle.update(100, 256 - 16, true, mummies);
            puzzle.update(100, 256, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 2);
            assert.strictEqual(puzzle.isGemSpawned, false);

            // 2 saltos N3
            puzzle.update(380, 160 - 16, true, mummies);
            puzzle.update(380, 160, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN3, 1);
            assert.strictEqual(puzzle.isGemSpawned, false);

            puzzle.update(380, 160 - 16, true, mummies);
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
