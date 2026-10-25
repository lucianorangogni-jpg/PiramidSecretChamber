import { GameConstants } from '../core/GameConstants.ts';

export interface TriggerPoint {
    readonly gridX: number;
    readonly gridY: number;
}

/**
 * Entidad de Pared Movediza Ancestral.
 * Resguarda un cofre de tesoro. Se extiende verticalmente desde el piso hasta la plataforma
 * superior (o techo) que delimita el corredor, evitando que se pueda saltar por encima.
 * Se activa durante 5 segundos al pisar cualquiera de sus dos activadores de piso (exterior o interior),
 * garantizando total ausencia de bloqueos (anti-softlock).
 */
export class MovingWall {
    public static readonly DEFAULT_DURATION_SECONDS = 5;
    public static readonly DEFAULT_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames a 60 FPS

    public readonly id: string;
    public readonly gridX: number;
    public readonly gridY: number;      // Fila inferior (directamente sobre la plataforma/suelo base)
    public readonly topGridY: number;   // Fila superior (llega hasta donde empieza la plataforma superior o techo)
    public readonly heightInTiles: number;
    public readonly outerTrigger: TriggerPoint;
    public readonly innerTrigger: TriggerPoint;
    public readonly associatedTreasureId: string;

    private _isOpen: boolean = false;
    private timerFrames: number = 0;

    constructor(
        gridX: number,
        gridY: number,
        outerTrigger: TriggerPoint,
        innerTrigger: TriggerPoint,
        associatedTreasureId: string,
        id?: string,
        topGridY?: number
    ) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.topGridY = topGridY !== undefined ? topGridY : gridY;
        this.heightInTiles = Math.max(1, this.gridY - this.topGridY + 1);
        this.outerTrigger = outerTrigger;
        this.innerTrigger = innerTrigger;
        this.associatedTreasureId = associatedTreasureId;
        this.id = id ?? `moving_wall_${gridX}_${gridY}`;
    }

    public get isOpen(): boolean {
        return this._isOpen;
    }

    public get isClosed(): boolean {
        return !this._isOpen;
    }

    public get remainingFrames(): number {
        return this.timerFrames;
    }

    public get remainingSeconds(): number {
        return Math.ceil(this.timerFrames / GameConstants.TARGET_FPS);
    }

    public get pixelX(): number {
        return this.gridX * GameConstants.TILE_SIZE;
    }

    public get pixelY(): number {
        return this.gridY * GameConstants.TILE_SIZE;
    }

    public get topPixelY(): number {
        return this.topGridY * GameConstants.TILE_SIZE;
    }

    public get pixelHeight(): number {
        return this.heightInTiles * GameConstants.TILE_SIZE;
    }

    /**
     * Abre la pared movediza e inicia el temporizador de 5 segundos.
     * Si ya estaba abierta, refresca el temporizador al máximo (5 segundos).
     */
    public activate(durationFrames: number = MovingWall.DEFAULT_DURATION_FRAMES): void {
        this._isOpen = true;
        this.timerFrames = durationFrames;
    }

    /**
     * Cierra inmediatamente la pared.
     */
    public close(): void {
        this._isOpen = false;
        this.timerFrames = 0;
    }

    /**
     * Restablece la pared a su estado inicial cerrado.
     */
    public reset(): void {
        this.close();
    }

    /**
     * Bucle de actualización frame a frame (60 FPS).
     * @param isPlayerInThreshold Indica si el jugador se encuentra cruzando la columna del muro (anti-aplastamiento)
     */
    public update(isPlayerInThreshold: boolean = false): void {
        if (!this._isOpen) return;

        if (this.timerFrames > 0) {
            this.timerFrames--;
        }

        // Si expiró el tiempo:
        if (this.timerFrames <= 0) {
            // Regla de seguridad anti-aplastamiento / anti-stuck:
            // Si el jugador está justo cruzando el umbral de la puerta, posponer el cierre
            if (isPlayerInThreshold) {
                this.timerFrames = 1; // Mantiene abierto 1 frame más hasta que desaloje la columna
            } else {
                this._isOpen = false;
                this.timerFrames = 0;
            }
        }
    }

    /**
     * Comprueba si el jugador pisa un activador específico en la cuadrícula.
     */
    public isPointOverTrigger(
        trigger: TriggerPoint,
        playerCenterX: number,
        playerFeetY: number,
        hitboxWidth: number = 28,
        hitboxHeight: number = 32
    ): boolean {
        const triggerLeft = trigger.gridX * GameConstants.TILE_SIZE;
        const triggerRight = triggerLeft + GameConstants.TILE_SIZE;
        const triggerTop = trigger.gridY * GameConstants.TILE_SIZE;
        const triggerBottom = triggerTop + GameConstants.TILE_SIZE;

        const pLeft = playerCenterX - hitboxWidth / 2;
        const pRight = playerCenterX + hitboxWidth / 2;
        const pTop = playerFeetY - hitboxHeight;
        const pBottom = playerFeetY;

        return pLeft < triggerRight && pRight > triggerLeft && pTop < triggerBottom && pBottom > triggerTop;
    }

    /**
     * Comprueba si el jugador está pisando el activador exterior O el activador interior.
     */
    public isPlayerOnAnyTrigger(
        playerCenterX: number,
        playerFeetY: number,
        hitboxWidth: number = 28,
        hitboxHeight: number = 32
    ): boolean {
        return (
            this.isPointOverTrigger(this.outerTrigger, playerCenterX, playerFeetY, hitboxWidth, hitboxHeight) ||
            this.isPointOverTrigger(this.innerTrigger, playerCenterX, playerFeetY, hitboxWidth, hitboxHeight)
        );
    }

    /**
     * Comprueba si el jugador se encuentra dentro del umbral físico completo de la columna de la pared.
     * Cubre desde topGridY hasta gridY verticalmente.
     */
    public isPlayerInsideWallThreshold(
        playerCenterX: number,
        playerFeetY: number,
        hitboxWidth: number = 28,
        hitboxHeight: number = 32
    ): boolean {
        const wallLeft = this.pixelX;
        const wallRight = this.pixelX + GameConstants.TILE_SIZE;
        const wallTop = this.topPixelY;
        const wallBottom = this.pixelY + GameConstants.TILE_SIZE;

        const pLeft = playerCenterX - hitboxWidth / 2;
        const pRight = playerCenterX + hitboxWidth / 2;
        const pTop = playerFeetY - hitboxHeight;
        const pBottom = playerFeetY;

        return pLeft < wallRight && pRight > wallLeft && pTop < wallBottom && pBottom > wallTop;
    }
}
