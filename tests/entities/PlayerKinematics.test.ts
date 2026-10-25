import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PlayerConstants } from '../../src/entities/PlayerConstants.ts';

describe('Player Kinematics & Rules Specs', () => {
    it('debe definir las dimensiones de hitbox apropiadas para pixel art de 32x32', () => {
        assert.strictEqual(PlayerConstants.HITBOX_WIDTH, 28);
        assert.strictEqual(PlayerConstants.HITBOX_HEIGHT, 32);
    });

    it('la velocidad de caminata y trepado deben coincidir con la especificación arcade', () => {
        assert.strictEqual(PlayerConstants.WALK_SPEED, 3.0);
        assert.strictEqual(PlayerConstants.CLIMB_SPEED, 2.4);
    });

    it('la parábola de salto debe alcanzar el ápice en la mitad de la duración', () => {
        const totalFrames = PlayerConstants.JUMP_DURATION_FRAMES; // 24 frames
        const height = PlayerConstants.JUMP_HEIGHT_PIXELS; // 56 px

        // t = 0.5 (frame 12) debe dar el ápice exacto de 56 px
        const tHalf = 12 / totalFrames;
        const apexY = 4 * height * tHalf * (1 - tHalf);
        assert.strictEqual(apexY, height);

        // t = 0 y t = 1 deben dar 0 de elevación
        const tZero = 0;
        const yStart = 4 * height * tZero * (1 - tZero);
        assert.strictEqual(yStart, 0);

        const tEnd = 1;
        const yEnd = 4 * height * tEnd * (1 - tEnd);
        assert.strictEqual(yEnd, 0);
    });

    it('la distancia de caída segura máxima debe ser exactamente igual a la altura de salto (56 px) [US-023]', () => {
        assert.strictEqual(PlayerConstants.MAX_SAFE_FALL_DISTANCE, PlayerConstants.JUMP_HEIGHT_PIXELS);
        assert.strictEqual(PlayerConstants.MAX_SAFE_FALL_DISTANCE, 56);
    });

    it('regla de dificultad: cualquier caída superior a la altura de salto (56 px) o entre plataformas de nivel 1+ es letal', () => {
        const evaluateLethalFall = (fallDistance: number, startLevel: number, landLevel: number): boolean => {
            if (fallDistance > PlayerConstants.MAX_SAFE_FALL_DISTANCE) {
                return true;
            }
            if (startLevel !== -1 && landLevel !== -1 && startLevel > landLevel) {
                return true;
            }
            return false;
        };

        // 1. Salto en la misma plataforma (distancia 0 px) -> Seguro
        assert.strictEqual(evaluateLethalFall(0, 0, 0), false);
        assert.strictEqual(evaluateLethalFall(0, 1, 1), false);

        // 2. Pequeño desnivel de 1 baldosa (32 px <= 56 px) en mismo nivel -> Seguro
        assert.strictEqual(evaluateLethalFall(32, -1, -1), false);

        // 3. Caída justo en el límite de salto (56 px) -> Seguro
        assert.strictEqual(evaluateLethalFall(56, -1, -1), false);

        // 4. Caída superior a la altura de salto (ej. 64 px, 128 px) -> Letal
        assert.strictEqual(evaluateLethalFall(57, -1, -1), true);
        assert.strictEqual(evaluateLethalFall(64, -1, -1), true);

        // 5. Caída por hueco desde Plataforma Nivel 1 a Suelo Nivel 0 (160 px) -> Letal
        assert.strictEqual(evaluateLethalFall(160, 1, 0), true);

        // 6. Caída por hueco desde Plataforma Nivel 2 a Nivel 1 (128 px) o Nivel 0 (288 px) -> Letal
        assert.strictEqual(evaluateLethalFall(128, 2, 1), true);
        assert.strictEqual(evaluateLethalFall(288, 2, 0), true);
    });

    it('el jugador debe iniciar con 3 vidas', () => {
        assert.strictEqual(PlayerConstants.INITIAL_LIVES, 3);
    });
});
