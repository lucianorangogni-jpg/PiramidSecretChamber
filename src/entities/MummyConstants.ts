/**
 * Constantes de cinemática, dimensiones y balanceo para las momias patrulleras.
 */
export const MummyConstants = {
    // Velocidad de patrulla arcade (aprox. 60% de la velocidad del jugador que es 3.0)
    WALK_SPEED: 1.8,

    // Dimensiones de colisión AABB para pixel art de 32x32
    // Altura de 28px con base en los pies permite un paso aéreo limpio de ~28px en salto de 56px
    HITBOX_WIDTH: 24,
    HITBOX_HEIGHT: 28,

    // Cadencia de alternancia de animación de caminata (2 frames)
    ANIMATION_TICKS_PER_FRAME: 12
} as const;

