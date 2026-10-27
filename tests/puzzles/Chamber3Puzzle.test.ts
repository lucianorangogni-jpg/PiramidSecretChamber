import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber3Puzzle } from '../../src/puzzles/Chamber3Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 3 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Protocolo de Llave Primero y Cuádruple Ciclo (Nivel 0)', () => {
        it('debe inicializarse con llave no recogida, 0 cofres y tesoro secreto oculto', () => {
            const puzzle = new Chamber3Puzzle();

            assert.strictEqual(puzzle.keyCollectedFirst, false);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('PASO 1: recolectar la llave primero antes de cualquier cofre activa el protocolo faraónico', () => {
            const puzzle = new Chamber3Puzzle();

            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.hasKey, true);
            assert.strictEqual(puzzle.keyCollectedFirst, true);

            const notifs = puzzle.consumePendingNotifications();
            assert.strictEqual(notifs.length, 1);
            assert.match(notifs[0].text, /LLAVE ANCESTRAL PRIMERO/);
        });

        it('FALLO: saquear un cofre antes de la llave invalida la condición de llave primero', () => {
            const puzzle = new Chamber3Puzzle();

            // Saquea cofre primero
            puzzle.notifyTreasureCollected('ch3_t1');
            assert.strictEqual(puzzle.initialTreasuresCollected, 1);

            // Luego recoge la llave -> keyCollectedFirst es falso
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.keyCollectedFirst, false);

            // Saquea segundo cofre
            puzzle.notifyTreasureCollected('ch3_t2');

            // Intenta accionar la pared movediza -> no debe incrementar ciclos
            puzzle.notifyWallActivated('ch3_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
        });

        it('PASO 2 y 3: llave primero + 2 cofres + 4 ciclos de pared materializan el tesoro secreto en (17, 13)', () => {
            const puzzle = new Chamber3Puzzle();

            // 1. Llave primero
            puzzle.notifyKeyCollected();
            assert.strictEqual(puzzle.keyCollectedFirst, true);

            // 2. Dos cofres base
            puzzle.notifyTreasureCollected('ch3_t1');
            puzzle.notifyTreasureCollected('ch3_t2');
            assert.strictEqual(puzzle.initialTreasuresCollected, 2);

            // 3. Cuatro ciclos de pared movediza
            for (let c = 1; c <= 3; c++) {
                puzzle.notifyWallActivated('ch3_wall1');
                assert.strictEqual(puzzle.doorCycleCount, c);
                assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            }

            // 4.º ciclo -> Revelación del tesoro
            puzzle.notifyWallActivated('ch3_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 4);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, true);

            // Saqueo
            const playerX = 17 * GameConstants.TILE_SIZE + 16;
            const playerY = 13 * GameConstants.TILE_SIZE + 32;
            const pts = puzzle.checkSecretTreasureCollection(playerX, playerY);
            assert.strictEqual(pts, 1000);
            assert.strictEqual(puzzle.isSecretTreasureCollected, true);
        });
    });

    describe('Puzle 2: Ritual Asimétrico de Momias (1 Salto N1 + 3 Saltos N2)', () => {
        it('debe registrar exactamente 1 salto en N1 y 3 saltos en N2 para petrificar y revelar la gema', () => {
            const puzzle = new Chamber3Puzzle();

            const mummyN1 = new Mummy(220, 288, 80, 336, Direction.Right, 1.0); // Nivel 1 (y = 288)
            const mummyN2 = new Mummy(350, 160, 200, 464, Direction.Left, 1.0); // Nivel 2 (y = 160)
            const mummies = [mummyN1, mummyN2];

            // 1 salto en Nivel 1
            puzzle.update(220, 288 - 16, true, mummies);
            puzzle.update(220, 288, false, mummies);
            assert.strictEqual(puzzle.mummyJumpsN1, 1);
            assert.strictEqual(puzzle.isGemSpawned, false);

            // 3 saltos en Nivel 2
            for (let i = 1; i <= 2; i++) {
                puzzle.update(350, 160 - 16, true, mummies);
                puzzle.update(350, 160, false, mummies);
                assert.strictEqual(puzzle.mummyJumpsN2, i);
                assert.strictEqual(puzzle.isGemSpawned, false);
            }

            // 3.er salto en Nivel 2 -> Activación divina
            puzzle.update(350, 160 - 16, true, mummies);
            assert.strictEqual(puzzle.mummyJumpsN2, 3);
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);

            // Saqueo de Gema Sagrada en (11, 7)
            const gemX = 11 * GameConstants.TILE_SIZE + 16;
            const gemY = 7 * GameConstants.TILE_SIZE + 16;
            const gemPts = puzzle.checkGemCollection(gemX, gemY);
            assert.strictEqual(gemPts, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);
        });
    });

    describe('Restablecimiento [R]', () => {
        it('reset() debe restablecer todos los valores al estado inicial', () => {
            const puzzle = new Chamber3Puzzle();
            puzzle.notifyKeyCollected();
            puzzle.notifyTreasureCollected('ch3_t1');
            puzzle.reset();

            assert.strictEqual(puzzle.keyCollectedFirst, false);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            assert.strictEqual(puzzle.mummyJumpsN1, 0);
            assert.strictEqual(puzzle.mummyJumpsN2, 0);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(puzzle.isGemSpawned, false);
        });
    });
});

