import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameConstants } from '../../src/core/GameConstants.ts';

describe('GameConstants Specs', () => {
    it('debe tener resolución 640x480 con aspecto 4:3', () => {
        assert.strictEqual(GameConstants.VIRTUAL_WIDTH, 640);
        assert.strictEqual(GameConstants.VIRTUAL_HEIGHT, 480);
    });

    it('la rejilla de 20x15 con tiles de 32px debe cubrir exactamente 640x480', () => {
        assert.strictEqual(GameConstants.GRID_COLUMNS * GameConstants.TILE_SIZE, 640);
        assert.strictEqual(GameConstants.GRID_ROWS * GameConstants.TILE_SIZE, 480);
    });

    it('debe definir 10 recámaras y 4 niveles piramidales', () => {
        assert.strictEqual(GameConstants.TOTAL_CHAMBERS, 10);
        assert.strictEqual(GameConstants.PYRAMID_LEVELS, 4);
    });

    it('debe operar a cadencia arcade de 60 FPS', () => {
        assert.strictEqual(GameConstants.TARGET_FPS, 60);
        assert.ok(Math.abs(GameConstants.FIXED_TIME_STEP_SECONDS - (1 / 60)) < 0.0001);
    });
});
