import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber4Puzzle } from '../../src/puzzles/Chamber4Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 4 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Orden Libre con Doble Salto y Ciclo Único (Nivel 0)', () => {
        it('debe inicializarse con contadores en cero y tesoro secreto oculto', () => {
            const puzzle = new Chamber4Puzzle();

            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.totalMummyJumps, 0);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('no incrementa ciclos si falta alguno de los 4 prerrequisitos (2 cofres + llave + 2 saltos)', () => {
            const puzzle = new Chamber4Puzzle();

            // Solo 2 cofres
            puzzle.notifyTreasureCollected('ch4_t1');
            puzzle.notifyTreasureCollected('ch4_t2');
            puzzle.notifyWallActivated('ch4_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // Añadir llave pero sin saltos
            puzzle.notifyKeyCollected();
            puzzle.notifyWallActivated('ch4_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // 1 solo salto sobre momia
            const mummy = new Mummy(240, 320, 80, 336, Direction.Left, 1.0);
            puzzle.update(240, 320 - 16, true, [mummy]);
            assert.strictEqual(puzzle.totalMummyJumps, 1);
            puzzle.notifyWallActivated('ch4_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // 2.º salto sobre momia -> Prerrequisitos cumplidos en cualquier orden
            puzzle.update(240, 320, false, [mummy]);
            puzzle.update(240, 320 - 16, true, [mummy]);
            assert.strictEqual(puzzle.totalMummyJumps, 2);

            // Ciclo único de pared movediza -> Revelación inmediata
            puzzle.notifyWallActivated('ch4_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, true);

            // Saqueo
            const playerX = 17 * GameConstants.TILE_SIZE + 16;
            const playerY = 13 * GameConstants.TILE_SIZE + 32;
            const pts = puzzle.checkSecretTreasureCollection(playerX, playerY);
            assert.strictEqual(pts, 1000);
            assert.strictEqual(puzzle.isSecretTreasureCollected, true);
        });
    });

    describe('Puzle 2: Dominio Inverso de Momias (3 Saltos N1 + 1 Salto N2)', () => {
        it('debe registrar 3 saltos en N1 y 1 salto en N2 para petrificar y revelar la gema', () => {
            const puzzle = new Chamber4Puzzle();

            const mummyN1 = new Mummy(240, 320, 80, 336, Direction.Left, 1.0); // Nivel 1 (y = 320)
            const mummyN2 = new Mummy(280, 192, 176, 400, Direction.Right, 1.0); // Nivel 2 (y = 192)
            const mummies = [mummyN1, mummyN2];

            // 3 saltos en Nivel 1
            for (let i = 1; i <= 3; i++) {
                puzzle.update(240, 320 - 16, true, mummies);
                puzzle.update(240, 320, false, mummies);
                assert.strictEqual(puzzle.mummyJumpsN1, i);
                assert.strictEqual(puzzle.isGemSpawned, false);
            }

            // 1 salto en Nivel 2 -> Activación divina
            puzzle.update(280, 192 - 16, true, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 1);
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);

            // Saqueo de Gema Sagrada en (11, 8)
            const gemX = 11 * GameConstants.TILE_SIZE + 16;
            const gemY = 8 * GameConstants.TILE_SIZE + 16;
            const gemPts = puzzle.checkGemCollection(gemX, gemY);
            assert.strictEqual(gemPts, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);
        });
    });

    describe('Restablecimiento [R]', () => {
        it('reset() debe restablecer todos los estados y contadores', () => {
            const puzzle = new Chamber4Puzzle();
            puzzle.notifyKeyCollected();
            puzzle.notifyTreasureCollected('ch4_t1');
            puzzle.reset();

            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.totalMummyJumps, 0);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            assert.strictEqual(puzzle.mummyJumpsN1, 0);
            assert.strictEqual(puzzle.mummyJumpsN2, 0);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(puzzle.isGemSpawned, false);
        });
    });
});

