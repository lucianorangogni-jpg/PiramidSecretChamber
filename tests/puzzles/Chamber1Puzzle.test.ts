import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Chamber1Puzzle } from '../../src/puzzles/Chamber1Puzzle.ts';
import { Mummy } from '../../src/entities/Mummy.ts';
import { Direction } from '../../src/core/Direction.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('Chamber 1 Puzzles Mechanics & State Machine Specs', () => {
    describe('Puzle 1: Recarga Secreta del Tesoro del Faraón (Nivel 0)', () => {
        it('debe inicializarse con contadores en cero y tesoro secreto no materializado', () => {
            const puzzle = new Chamber1Puzzle();

            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            assert.strictEqual(puzzle.isSecretTreasureCollected, false);
            assert.strictEqual(puzzle.secretTreasure.gridX, 17);
            assert.strictEqual(puzzle.secretTreasure.gridY, 13);
            assert.strictEqual(puzzle.secretTreasure.value, 1000);
        });

        it('no debe incrementar ciclos de puerta si no se cumplen los prerrequisitos (2 tesoros + llave)', () => {
            const puzzle = new Chamber1Puzzle();

            // Activar pared sin tener tesoros ni llave
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);

            // Obtener 1 solo tesoro
            puzzle.notifyTreasureCollected();
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // Obtener segundo tesoro pero sin llave
            puzzle.notifyTreasureCollected();
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 0);

            // Llave obtenida -> ahora sí se cumplen los prerrequisitos
            puzzle.notifyKeyCollected();
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
        });

        it('ignora activaciones de otras paredes que no sean la pared 1 de la bóveda de Nivel 0', () => {
            const puzzle = new Chamber1Puzzle();
            puzzle.notifyTreasureCollected();
            puzzle.notifyTreasureCollected();
            puzzle.notifyKeyCollected();

            // Pared del nivel 2 (ch1_wall2)
            puzzle.notifyWallActivated('ch1_wall2');
            assert.strictEqual(puzzle.doorCycleCount, 0);
        });

        it('requiere exactamente 3 ciclos de apertura de pared para materializar el tesoro secreto', () => {
            const puzzle = new Chamber1Puzzle();
            puzzle.notifyTreasureCollected();
            puzzle.notifyTreasureCollected();
            puzzle.notifyKeyCollected();

            // Ciclo 1
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 1);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);

            let notifications = puzzle.consumePendingNotifications();
            assert.strictEqual(notifications.length, 1);
            assert.match(notifications[0].text, /ENGRANAJE RÚNICO/);

            // Ciclo 2
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 2);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);

            // Ciclo 3 -> Invocación completada
            puzzle.notifyWallActivated('ch1_wall1');
            assert.strictEqual(puzzle.doorCycleCount, 3);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, true);

            notifications = puzzle.consumePendingNotifications();
            assert.strictEqual(notifications.length, 2);
            assert.match(notifications[1].text, /TESORO DEL FARAÓN RECARGADO/);
        });

        it('permite saquear el tesoro secreto en (17, 13) otorgando 1000 puntos una sola vez', () => {
            const puzzle = new Chamber1Puzzle();
            puzzle.notifyTreasureCollected();
            puzzle.notifyTreasureCollected();
            puzzle.notifyKeyCollected();
            puzzle.notifyWallActivated('ch1_wall1');
            puzzle.notifyWallActivated('ch1_wall1');
            puzzle.notifyWallActivated('ch1_wall1');

            const playerX = 17 * GameConstants.TILE_SIZE + 16;
            const playerY = 13 * GameConstants.TILE_SIZE + 32;

            // Primer saqueo
            const pts1 = puzzle.checkSecretTreasureCollection(playerX, playerY);
            assert.strictEqual(pts1, 1000);
            assert.strictEqual(puzzle.isSecretTreasureCollected, true);

            // Segundo intento de saqueo: 0 puntos
            const pts2 = puzzle.checkSecretTreasureCollection(playerX, playerY);
            assert.strictEqual(pts2, 0);
        });
    });

    describe('Puzle 2: El Dominio de la Momia Guardiana (Salto Cuádruple IIII)', () => {
        it('debe inicializarse con contador de saltos en 0 y momia no petrificada', () => {
            const puzzle = new Chamber1Puzzle();

            assert.strictEqual(puzzle.mummyJumpCount, 0);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(puzzle.isGemSpawned, false);
            assert.strictEqual(puzzle.isGemCollected, false);
            assert.strictEqual(puzzle.gemGridX, 12);
            assert.strictEqual(puzzle.gemGridY, 8);
            assert.strictEqual(puzzle.gemValue, 1000);
        });

        it('no debe contar saltos si el jugador está en el suelo o camina sobre la momia', () => {
            const puzzle = new Chamber1Puzzle();
            const mummy = new Mummy(300, 160, 200, 400, Direction.Right);

            // Jugador caminando horizontalmente a la altura de la momia (sin saltar)
            puzzle.update(300, 160, false, [mummy]);
            assert.strictEqual(puzzle.mummyJumpCount, 0);
        });

        it('debe registrar 4 saltos consecutivos limpios en el aire sobre la momia', () => {
            const puzzle = new Chamber1Puzzle();
            const mummy = new Mummy(300, 160, 200, 400, Direction.Right);

            for (let jumpIndex = 1; jumpIndex <= 3; jumpIndex++) {
                // Vuelo por encima de la momia (pies en y = 160 - 24 = 136)
                puzzle.update(300, 136, true, [mummy]);
                assert.strictEqual(puzzle.mummyJumpCount, jumpIndex);
                assert.strictEqual(puzzle.isMummyPetrified, false);

                // El mismo vuelo no debe sumar de nuevo
                puzzle.update(302, 136, true, [mummy]);
                assert.strictEqual(puzzle.mummyJumpCount, jumpIndex);

                // Aterrizaje en el suelo (isJumping = false)
                puzzle.update(305, 160, false, [mummy]);
            }

            // 4.º salto limpio: desencadena la petrificación
            puzzle.update(300, 136, true, [mummy]);
            assert.strictEqual(puzzle.mummyJumpCount, 4);
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(puzzle.isGemSpawned, true);
            assert.strictEqual(mummy.isActive, false); // Momia queda inmóvil y no letal
        });

        it('la petrificación debe durar exactamente 5 segundos (300 frames) y reanudar a la momia tras expirar', () => {
            const puzzle = new Chamber1Puzzle();
            const mummy = new Mummy(300, 160, 200, 400, Direction.Right);

            // Realizar 3 saltos completos y el 4.º en el ápice
            for (let i = 0; i < 3; i++) {
                puzzle.update(300, 136, true, [mummy]);
                puzzle.update(300, 160, false, [mummy]);
            }
            // 4.º salto: activa la petrificación con 300 frames
            puzzle.update(300, 136, true, [mummy]);

            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(mummy.isActive, false);

            // Simular 299 frames de petrificación (300 -> 1 frame restante)
            for (let f = 0; f < 299; f++) {
                puzzle.update(200, 160, false, [mummy]);
            }
            assert.strictEqual(puzzle.isMummyPetrified, true);
            assert.strictEqual(mummy.isActive, false);

            // Frame 300: expira el efecto sagrado
            puzzle.update(200, 160, false, [mummy]);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(mummy.isActive, true);
        });

        it('permite recolectar la Gema Sagrada en (12, 8) otorgando 1000 puntos una sola vez', () => {
            const puzzle = new Chamber1Puzzle();
            const mummy = new Mummy(300, 160, 200, 400, Direction.Right);

            // Desencadenar puzle
            for (let i = 0; i < 4; i++) {
                puzzle.update(300, 136, true, [mummy]);
                puzzle.update(300, 160, false, [mummy]);
            }

            const gemCenterX = 12 * GameConstants.TILE_SIZE + 16;
            const gemBottomY = 8 * GameConstants.TILE_SIZE + 32;

            // Recolección
            const pts1 = puzzle.checkGemCollection(gemCenterX, gemBottomY);
            assert.strictEqual(pts1, 1000);
            assert.strictEqual(puzzle.isGemCollected, true);

            // Segundo intento: 0 puntos
            const pts2 = puzzle.checkGemCollection(gemCenterX, gemBottomY);
            assert.strictEqual(pts2, 0);
        });
    });

    describe('Restablecimiento y Reintentos [R]', () => {
        it('reset() debe restablecer todos los contadores, banderas y entidades de puzle al estado inicial', () => {
            const puzzle = new Chamber1Puzzle();
            puzzle.notifyTreasureCollected();
            puzzle.notifyTreasureCollected();
            puzzle.notifyKeyCollected();
            puzzle.notifyWallActivated('ch1_wall1');

            const mummy = new Mummy(300, 160, 200, 400, Direction.Right);
            puzzle.update(300, 136, true, [mummy]);

            assert.strictEqual(puzzle.initialTreasuresCollected, 2);
            assert.strictEqual(puzzle.doorCycleCount, 1);
            assert.strictEqual(puzzle.mummyJumpCount, 1);

            // Reset
            puzzle.reset();

            assert.strictEqual(puzzle.initialTreasuresCollected, 0);
            assert.strictEqual(puzzle.hasKey, false);
            assert.strictEqual(puzzle.doorCycleCount, 0);
            assert.strictEqual(puzzle.isSecretTreasureSpawned, false);
            assert.strictEqual(puzzle.isSecretTreasureCollected, false);
            assert.strictEqual(puzzle.mummyJumpCount, 0);
            assert.strictEqual(puzzle.isMummyPetrified, false);
            assert.strictEqual(puzzle.isGemSpawned, false);
            assert.strictEqual(puzzle.isGemCollected, false);
        });
    });
});
