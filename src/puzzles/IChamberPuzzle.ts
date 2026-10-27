import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';

export interface PuzzleEventNotification {
    readonly text: string;
    readonly points: number;
    readonly x: number;
    readonly y: number;
}

/**
 * Interfaz común para los controladores de puzles ancestrales de cada recámara.
 * Todos los controladores garantizan:
 * - Cero allocations en el bucle continuo (update a 60 FPS).
 * - Notificaciones retro flotantes con iconos temáticos.
 * - Sincronización con cofres secretos, gemas sagradas y petrificación de momias.
 */
export interface IChamberPuzzle {
    readonly chamberNumber: number;

    // Estado Puzle 1: Recarga Secreta de Tesoro (Nivel 0)
    readonly secretTreasure: Treasure;
    readonly isSecretTreasureSpawned: boolean;
    readonly isSecretTreasureCollected: boolean;
    readonly doorCycleCount: number;

    // Estado Puzle 2: Dominio de Momias / Gema Sagrada
    readonly isGemSpawned: boolean;
    readonly isGemCollected: boolean;
    readonly isMummyPetrified: boolean;
    readonly gemPixelX: number;
    readonly gemPixelY: number;

    notifyTreasureCollected(treasureId?: string): void;
    notifyKeyCollected(): void;
    notifyWallActivated(wallId: string): void;

    checkSecretTreasureCollection(
        playerCenterX: number,
        playerFeetY: number,
        width?: number,
        height?: number
    ): number;

    checkGemCollection(
        playerCenterX: number,
        playerFeetY: number,
        width?: number,
        height?: number
    ): number;

    update(
        playerCenterX: number,
        playerFeetY: number,
        isJumping: boolean,
        mummies: readonly Mummy[]
    ): void;

    consumePendingNotifications(): PuzzleEventNotification[];
    reset(): void;
}

