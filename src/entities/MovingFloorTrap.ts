import { GameConstants } from '../core/GameConstants.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { TileType } from '../grid/TileType.ts';

/**
 * Estados posibles del piso movedizo / trampa desmoronable de Nivel 1.
 */
export const MovingFloorState = {
    Solid: 0,    // Firme e intacto (TileType.SolidWall)
    Shaking: 1,  // Crujiendo y temblando bajo el peso del jugador (advertencia visual)
    Open: 2      // Desplazado / colapsado en el abismo (TileType.Empty)
} as const;

export type MovingFloorState = typeof MovingFloorState[keyof typeof MovingFloorState];

/**
 * Configuración de una sección de piso movedizo.
 */
export interface MovingFloorConfig {
    readonly chamber: number;
    readonly row: number;
    readonly minCol: number;
    readonly maxCol: number;
    readonly triggerDelayFrames?: number;
    readonly openDurationFrames?: number;
}

/**
 * Entidad de Piso Movedizo Ancestral (Plataforma Nivel 1).
 * Implementa el peligro de derrumbe y caída letal:
 * - Cuando el jugador pisa la plataforma, comienza a temblar con crujidos visuales.
 * - Tras un retraso de ~1.2 a 1.4 segundos (75 a 85 frames a 60 FPS), el piso se abre hacia el vacío.
 * - Si el explorador camina de forma continua, cruza a salvo antes de que caiga.
 * - Si se queda parado en el lugar, cae desde el Nivel 1 (fila 11, y=352) al Suelo Base (fila 14, y=448),
 *   lo que produce una caída mayor a 56 px (96 px) y le cuesta una vida.
 * - Tras varios segundos abierto (3.0s), los bloques de arenisca vuelven a su lugar para evitar bloqueos.
 * - Garantiza CERO asignaciones de memoria (zero-allocation) en el bucle de actualización a 60 FPS.
 */
export class MovingFloorTrap {
    public static readonly DEFAULT_TRIGGER_DELAY_FRAMES = 80;   // ~1.33 segundos a 60 FPS
    public static readonly DEFAULT_OPEN_DURATION_FRAMES = 180;  // 3.0 segundos a 60 FPS

    public readonly chamber: number;
    public readonly row: number;
    public readonly minCol: number;
    public readonly maxCol: number;
    public readonly triggerDelayFrames: number;
    public readonly openDurationFrames: number;

    private _state: MovingFloorState = MovingFloorState.Solid;
    private timerFrames: number = 0;
    private _shakeOffsetX: number = 0;

    constructor(
        chamber: number,
        row: number,
        minCol: number,
        maxCol: number,
        triggerDelayFrames: number = MovingFloorTrap.DEFAULT_TRIGGER_DELAY_FRAMES,
        openDurationFrames: number = MovingFloorTrap.DEFAULT_OPEN_DURATION_FRAMES
    ) {
        this.chamber = chamber;
        this.row = row;
        this.minCol = Math.min(minCol, maxCol);
        this.maxCol = Math.max(minCol, maxCol);
        this.triggerDelayFrames = triggerDelayFrames;
        this.openDurationFrames = openDurationFrames;
    }

    public get state(): MovingFloorState {
        return this._state;
    }

    public get isSolid(): boolean {
        return this._state === MovingFloorState.Solid;
    }

    public get isShaking(): boolean {
        return this._state === MovingFloorState.Shaking;
    }

    public get isOpen(): boolean {
        return this._state === MovingFloorState.Open;
    }

    public get remainingFrames(): number {
        return this.timerFrames;
    }

    public get shakeOffsetX(): number {
        return this._shakeOffsetX;
    }

    public get lengthInTiles(): number {
        return this.maxCol - this.minCol + 1;
    }

    public get pixelLeft(): number {
        return this.minCol * GameConstants.TILE_SIZE;
    }

    public get pixelRight(): number {
        return (this.maxCol + 1) * GameConstants.TILE_SIZE;
    }

    public get pixelTop(): number {
        return this.row * GameConstants.TILE_SIZE;
    }

    public get pixelBottom(): number {
        return (this.row + 1) * GameConstants.TILE_SIZE;
    }

    /**
     * Determina si una coordenada de cuadrícula (col, row) forma parte de este piso movedizo.
     */
    public containsTile(col: number, row: number): boolean {
        return row === this.row && col >= this.minCol && col <= this.maxCol;
    }

    /**
     * Comprueba si los pies del jugador están apoyados sobre la superficie superior de este piso movedizo.
     */
    public isPlayerOnPlatform(
        playerCenterX: number,
        playerFeetY: number,
        hitboxWidth: number = 28
    ): boolean {
        // La superficie de pisada está en pixelTop (y = row * 32)
        const platformTop = this.pixelTop;
        if (Math.abs(playerFeetY - platformTop) > 4.0) {
            return false;
        }

        const halfWidth = hitboxWidth * 0.5;
        const playerLeft = playerCenterX - halfWidth;
        const playerRight = playerCenterX + halfWidth;

        return playerRight > this.pixelLeft && playerLeft < this.pixelRight;
    }

    /**
     * Bucle de actualización frame a frame (60 FPS) con CERO asignaciones en memoria.
     */
    public update(
        playerCenterX: number,
        playerFeetY: number,
        isPlayerEliminated: boolean,
        grid: RoomGrid
    ): void {
        switch (this._state) {
            case MovingFloorState.Solid: {
                this._shakeOffsetX = 0;
                // Si el jugador vivo pisa el piso, comienza el temblor de derrumbe
                if (!isPlayerEliminated && this.isPlayerOnPlatform(playerCenterX, playerFeetY)) {
                    this._state = MovingFloorState.Shaking;
                    this.timerFrames = this.triggerDelayFrames;
                }
                break;
            }

            case MovingFloorState.Shaking: {
                if (this.timerFrames > 0) {
                    this.timerFrames--;
                }

                // Vibración visual retro de advertencia (±2px alternando cada 2 frames)
                this._shakeOffsetX = (this.timerFrames % 4 < 2) ? -2 : 2;

                // Al expirar el tiempo de advertencia, el piso colapsa
                if (this.timerFrames <= 0) {
                    this._state = MovingFloorState.Open;
                    this.timerFrames = this.openDurationFrames;
                    this._shakeOffsetX = 0;

                    // Abrir foso en la cuadrícula física para hacer caer al jugador
                    for (let col = this.minCol; col <= this.maxCol; col++) {
                        grid.setTile(col, this.row, TileType.Empty);
                    }
                }
                break;
            }

            case MovingFloorState.Open: {
                this._shakeOffsetX = 0;
                if (this.timerFrames > 0) {
                    this.timerFrames--;
                }

                // Al expirar el tiempo abierto, restaurar los bloques sólidos
                if (this.timerFrames <= 0) {
                    // Verificación de seguridad anti-atrapamiento: si el jugador estuviera justo en el espacio,
                    // posponer unos frames para evitar incrustaciones
                    const isPlayerInVoid = !isPlayerEliminated && this.isPlayerOnPlatform(playerCenterX, playerFeetY);
                    if (isPlayerInVoid) {
                        this.timerFrames = 10;
                    } else {
                        this._state = MovingFloorState.Solid;
                        this.timerFrames = 0;
                        for (let col = this.minCol; col <= this.maxCol; col++) {
                            grid.setTile(col, this.row, TileType.SolidWall);
                        }
                    }
                }
                break;
            }
        }
    }

    /**
     * Restablece el piso movedizo a su estado original sólido.
     */
    public reset(grid: RoomGrid): void {
        this._state = MovingFloorState.Solid;
        this.timerFrames = 0;
        this._shakeOffsetX = 0;
        for (let col = this.minCol; col <= this.maxCol; col++) {
            grid.setTile(col, this.row, TileType.SolidWall);
        }
    }
}
