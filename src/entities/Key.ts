import { GameConstants } from '../core/GameConstants.ts';

/**
 * Entidad Llave Ancestral.
 * Puede colgar suspendida en el aire requiriendo un salto del jugador para ser recolectada.
 * Es necesaria para desbloquear la puerta de salida (ExitDoor) de la recámara.
 */
export class Key {
    public static readonly DEFAULT_POINTS = 500;
    public static readonly HITBOX_SIZE = 24;

    public readonly chamber: number;
    public readonly gridX: number;
    public readonly gridY: number;
    public readonly ceilingGridY: number; // Fila donde se ancla la cadena en la plataforma superior
    public readonly value: number;
    public readonly id: string;

    private _isCollected: boolean = false;

    constructor(
        chamber: number,
        gridX: number,
        gridY: number,
        ceilingGridY: number = 5,
        value: number = Key.DEFAULT_POINTS,
        id?: string
    ) {
        this.chamber = chamber;
        this.gridX = gridX;
        this.gridY = gridY;
        this.ceilingGridY = ceilingGridY;
        this.value = value;
        this.id = id ?? `key_ch${chamber}_${gridX}_${gridY}`;
    }

    public get isCollected(): boolean {
        return this._isCollected;
    }

    public get isAvailable(): boolean {
        return !this._isCollected;
    }

    public get pixelX(): number {
        return this.gridX * GameConstants.TILE_SIZE;
    }

    public get pixelY(): number {
        return this.gridY * GameConstants.TILE_SIZE;
    }

    public get ceilingPixelY(): number {
        return this.ceilingGridY * GameConstants.TILE_SIZE;
    }

    /**
     * Recolecta la llave y otorga los puntos si aún estaba disponible.
     */
    public collect(): number {
        if (this._isCollected) return 0;
        this._isCollected = true;
        return this.value;
    }

    /**
     * Restablece la llave a su estado inicial suspendido.
     */
    public reset(): void {
        this._isCollected = false;
    }

    /**
     * Comprobación AABB de contacto de la llave con la hitbox del jugador (cero allocations).
     */
    public checkOverlap(
        playerCenterX: number,
        playerFeetY: number,
        hitboxWidth: number = 28,
        hitboxHeight: number = 32
    ): boolean {
        if (this._isCollected) return false;

        const halfHitbox = Key.HITBOX_SIZE / 2;
        const centerX = this.pixelX + GameConstants.TILE_SIZE / 2;
        const centerY = this.pixelY + GameConstants.TILE_SIZE / 2;

        const keyLeft = centerX - halfHitbox;
        const keyRight = centerX + halfHitbox;
        const keyTop = centerY - halfHitbox;
        const keyBottom = centerY + halfHitbox;

        const pLeft = playerCenterX - hitboxWidth / 2;
        const pRight = playerCenterX + hitboxWidth / 2;
        const pTop = playerFeetY - hitboxHeight;
        const pBottom = playerFeetY;

        return pLeft < keyRight && pRight > keyLeft && pTop < keyBottom && pBottom > keyTop;
    }
}

