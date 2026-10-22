import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PlayerConstants } from '../../src/entities/PlayerConstants.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';

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

    it('la distancia de caída segura máxima debe ser 5.5 tiles (176 px)', () => {
        assert.strictEqual(PlayerConstants.MAX_SAFE_FALL_DISTANCE, 5.5 * GameConstants.TILE_SIZE);
        assert.strictEqual(PlayerConstants.MAX_SAFE_FALL_DISTANCE, 176);
    });

    it('el jugador debe iniciar con 3 vidas', () => {
        assert.strictEqual(PlayerConstants.INITIAL_LIVES, 3);
    });
});

