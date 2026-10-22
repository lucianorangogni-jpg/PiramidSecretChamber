/**
 * Constantes globales para la simulación, rejilla y resolución del juego.
 * Adaptado a la arquitectura Phaser 640x480 (20 columnas x 15 filas de 32x32 píxeles).
 */
export const GameConstants = {
    // Resolución virtual base clásica (4:3 retro arcade escalado 2x de 320x240)
    VIRTUAL_WIDTH: 640,
    VIRTUAL_HEIGHT: 480,

    // Dimensiones de celdas (tiles) y cuadrícula de la cámara
    TILE_SIZE: 32,
    GRID_COLUMNS: 20, // 20 * 32 = 640 px
    GRID_ROWS: 15,    // 15 * 32 = 480 px

    // Cadencia de frames y física arcade (60 FPS)
    TARGET_FPS: 60,
    FIXED_TIME_STEP_SECONDS: 1 / 60,

    // Tiempos y mecánicas de gameplay
    STUN_DURATION_SECONDS: 3.5,
    WHIP_DURATION_FRAMES: 10,

    // Estructura piramidal de 10 recámaras distribuidas en 4 niveles
    TOTAL_CHAMBERS: 10,
    PYRAMID_LEVELS: 4
} as const;

