import { GameConstants } from '../core/GameConstants.ts';

/**
 * Constantes cinemáticas, físicas y de balanceo arcade del jugador.
 * Desacopladas de Phaser para permitir pruebas unitarias matemáticas puras.
 */
export const PlayerConstants = {
    HITBOX_WIDTH: 28,
    HITBOX_HEIGHT: 32,

    WALK_SPEED: 3.0,
    CLIMB_SPEED: 2.4,

    JUMP_DURATION_FRAMES: 24,
    JUMP_HEIGHT_PIXELS: 56,
    JUMP_HORIZONTAL_DISTANCE: 80,

    GRAVITY: 0.5,
    MAX_FALL_SPEED: 8.0,
    MAX_SAFE_FALL_DISTANCE: 5.5 * GameConstants.TILE_SIZE, // 176 px (5.5 tiles)

    INITIAL_LIVES: 3
} as const;

