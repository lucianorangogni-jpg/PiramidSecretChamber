import { GameConstants } from '../core/GameConstants.ts';
import { TreasureState } from './TreasureState.ts';

/**
 * Representa un cofre de tesoro ancestral en la cuadrícula de una recámara.
 * Maneja la posición discreta y en píxeles, valor en puntos y estado de recolección.
 */
export class Treasure {
    public readonly id: string;
    public readonly gridX: number;
    public readonly gridY: number;
    public readonly value: number;

    private _state: TreasureState = TreasureState.Available;

    constructor(gridX: number, gridY: number, value: number = 1000, id?: string) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.value = value;
        this.id = id ?? `treasure_${gridX}_${gridY}`;
    }

    public get state(): TreasureState {
        return this._state;
    }

    public get isAvailable(): boolean {
        return this._state === TreasureState.Available;
    }

    public get isCollected(): boolean {
        return this._state === TreasureState.Collected;
    }

    public get pixelX(): number {
        return this.gridX * GameConstants.TILE_SIZE;
    }

    public get pixelY(): number {
        return this.gridY * GameConstants.TILE_SIZE;
    }

    /**
     * Intenta recolectar el tesoro.
     * Retorna los puntos sumados (1000 por defecto) si estaba disponible, o 0 si ya fue recolectado.
     */
    public collect(): number {
        if (this._state === TreasureState.Available) {
            this._state = TreasureState.Collected;
            return this.value;
        }
        return 0;
    }

    /**
     * Restablece el cofre al estado inicial disponible (ej. al reintentar recámara).
     */
    public reset(): void {
        this._state = TreasureState.Available;
    }

    /**
     * Comprueba si el arqueólogo intersecta con el área del cofre.
     * @param playerCenterX Centro horizontal del jugador en píxeles
     * @param playerFeetY Posición vertical de los pies del jugador en píxeles
     * @param hitboxWidth Ancho del hitbox del jugador (por defecto 28)
     * @param hitboxHeight Alto del hitbox del jugador (por defecto 32)
     */
    public checkOverlap(
        playerCenterX: number,
        playerFeetY: number,
        hitboxWidth: number = 28,
        hitboxHeight: number = 32
    ): boolean {
        const playerLeft = playerCenterX - hitboxWidth / 2;
        const playerRight = playerCenterX + hitboxWidth / 2;
        const playerTop = playerFeetY - hitboxHeight;
        const playerBottom = playerFeetY;

        const treasureLeft = this.pixelX;
        const treasureRight = this.pixelX + GameConstants.TILE_SIZE;
        const treasureTop = this.pixelY;
        const treasureBottom = this.pixelY + GameConstants.TILE_SIZE;

        return (
            playerLeft < treasureRight &&
            playerRight > treasureLeft &&
            playerTop < treasureBottom &&
            playerBottom > treasureTop
        );
    }
}

