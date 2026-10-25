import { Direction } from '../core/Direction.ts';
import { MummyConstants } from './MummyConstants.ts';

/**
 * Entidad de la Momia Patrullera.
 * Maneja la cinemática de patrulla continua, inversión en límites de plataforma,
 * ciclo de animación de 2 cuadros y detección precisa de colisión AABB con el arqueólogo.
 */
export class Mummy {
    public readonly id: string;
    public readonly startX: number;
    public readonly startY: number;
    public readonly minX: number;
    public readonly maxX: number;
    public readonly initialDirection: Direction;
    public readonly speed: number;

    public x: number;
    public y: number;
    public direction: Direction;
    public isActive: boolean = true;

    public readonly hitboxWidth: number;
    public readonly hitboxHeight: number;

    private animTimer: number = 0;
    private currentFrameIndex: number = 0;

    constructor(
        x: number,
        y: number,
        minX: number,
        maxX: number,
        direction: Direction = Direction.Right,
        id?: string,
        speed: number = MummyConstants.WALK_SPEED
    ) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.minX = minX;
        this.maxX = maxX;
        this.initialDirection = direction;
        this.direction = direction;
        this.speed = speed;
        this.hitboxWidth = MummyConstants.HITBOX_WIDTH;
        this.hitboxHeight = MummyConstants.HITBOX_HEIGHT;
        this.id = id ?? `mummy_${Math.round(x)}_${Math.round(y)}`;
    }

    public get animFrame(): number {
        return this.currentFrameIndex;
    }

    public get textureKey(): string {
        return this.currentFrameIndex === 0 ? 'mummy_walk_1' : 'mummy_walk_2';
    }

    /**
     * Actualiza la posición de la momia según su dirección y límites de patrulla.
     */
    public update(): void {
        if (!this.isActive) return;

        // Desplazamiento horizontal determinista
        if (this.direction === Direction.Right) {
            this.x += this.speed;
            if (this.x >= this.maxX) {
                this.x = this.maxX;
                this.direction = Direction.Left;
            }
        } else if (this.direction === Direction.Left) {
            this.x -= this.speed;
            if (this.x <= this.minX) {
                this.x = this.minX;
                this.direction = Direction.Right;
            }
        }

        // Animación de caminata retro
        this.animTimer++;
        if (this.animTimer >= MummyConstants.ANIMATION_TICKS_PER_FRAME) {
            this.animTimer = 0;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % 2;
        }
    }

    /**
     * Restablece la momia a su posición y estado iniciales.
     */
    public reset(): void {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = this.initialDirection;
        this.animTimer = 0;
        this.currentFrameIndex = 0;
        this.isActive = true;
    }

    /**
     * Comprueba si el arqueólogo colisiona físicamente con la momia.
     * @param playerCenterX Centro horizontal del jugador en píxeles
     * @param playerFeetY Posición vertical de los pies del jugador en píxeles
     * @param playerHitboxWidth Ancho de colisión del jugador (28 por defecto)
     * @param playerHitboxHeight Alto de colisión del jugador (32 por defecto)
     */
    public checkOverlap(
        playerCenterX: number,
        playerFeetY: number,
        playerHitboxWidth: number = 28,
        playerHitboxHeight: number = 32
    ): boolean {
        if (!this.isActive) return false;

        const pLeft = playerCenterX - playerHitboxWidth / 2;
        const pRight = playerCenterX + playerHitboxWidth / 2;
        const pTop = playerFeetY - playerHitboxHeight;
        const pBottom = playerFeetY;

        const mLeft = this.x - this.hitboxWidth / 2;
        const mRight = this.x + this.hitboxWidth / 2;
        const mTop = this.y - this.hitboxHeight;
        const mBottom = this.y;

        return pLeft < mRight && pRight > mLeft && pTop < mBottom && pBottom > mTop;
    }
}

