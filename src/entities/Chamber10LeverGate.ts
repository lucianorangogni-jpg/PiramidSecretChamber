import { GameConstants } from '../core/GameConstants.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { TileType } from '../grid/TileType.ts';
import { PuzzleProgressTracker } from '../puzzles/PuzzleProgressTracker.ts';

export interface LeverGateInteractionResult {
    readonly success: boolean;
    readonly remainingPuzzles: number;
    readonly solvedPuzzles: number;
    readonly message: string;
}

/**
 * Entidad y controlador de la Palanca del Faraón y el Muro de la Cúspide en la Recámara 10.
 *
 * Mecánica [US-026]:
 * 1. La nueva plataforma Nivel 3 (Cúspide) se accede por una escalera en columna 13.
 * 2. La escalera se encuentra cerrada por un pesado muro de piedra (filas 3 y 4 en col 13).
 * 3. Para abrirlo, el jugador debe accionar la palanca suspendida (col 8, fila 3) mediante un SALTO en Nivel 2.
 * 4. Si NO están todos los puzles de las recámaras 1 a 9 resueltos (18 puzles en total),
 *    la palanca no funciona y muestra un mensaje indicando cuántos puzles faltan por resolver.
 * 5. Si todos los 18 puzles están resueltos, la palanca se activa, el muro se desliza y la escalera se abre.
 */
export class Chamber10LeverGate {
    // Dimensiones de colisión del jugador (desacopladas para pruebas headless sin DOM)
    public static readonly PLAYER_HITBOX_WIDTH = 28;
    public static readonly PLAYER_HITBOX_HEIGHT = 30;

    // Coordenadas de la palanca suspendida (col 8, fila 3)
    public static readonly LEVER_GRID_X = 8;
    public static readonly LEVER_GRID_Y = 3;

    // Coordenadas del muro de cierre de la escalera (col 13, filas 3 y 4)
    public static readonly WALL_GRID_X = 13;
    public static readonly WALL_ROWS: readonly number[] = [3, 4];

    public isLeverPulled: boolean = false;
    public isWallOpen: boolean = false;
    private cooldownFrames: number = 0;

    public get leverWorldX(): number {
        return Chamber10LeverGate.LEVER_GRID_X * GameConstants.TILE_SIZE + 16;
    }

    public get leverWorldY(): number {
        return Chamber10LeverGate.LEVER_GRID_Y * GameConstants.TILE_SIZE + 16;
    }

    public update(): void {
        if (this.cooldownFrames > 0) {
            this.cooldownFrames--;
        }
    }

    public reset(grid?: RoomGrid): void {
        this.isLeverPulled = false;
        this.isWallOpen = false;
        this.cooldownFrames = 0;

        if (grid) {
            for (const r of Chamber10LeverGate.WALL_ROWS) {
                grid.setTile(Chamber10LeverGate.WALL_GRID_X, r, TileType.SolidWall);
            }
        }
    }

    /**
     * Comprueba si el jugador está en contacto con la palanca suspendida.
     * La palanca cuelga a altura y = 112 (fila 3). En Nivel 2 (suelo y = 160),
     * un jugador de pie tiene la cabeza a y = 132, por lo que SOLO puede alcanzarla SALTANDO.
     */
    public isPlayerOverlappingLever(player: { x: number; y: number }): boolean {
        const halfW = Chamber10LeverGate.PLAYER_HITBOX_WIDTH / 2;
        const pLeft = player.x - halfW;
        const pRight = player.x + halfW;
        const pTop = player.y - Chamber10LeverGate.PLAYER_HITBOX_HEIGHT;
        const pBottom = player.y;

        const leverSize = 24;
        const lLeft = this.leverWorldX - leverSize / 2;
        const lRight = this.leverWorldX + leverSize / 2;
        const lTop = this.leverWorldY - leverSize / 2;
        const lBottom = this.leverWorldY + leverSize / 2;

        return pLeft < lRight && pRight > lLeft && pTop < lBottom && pBottom > lTop;
    }

    /**
     * Intenta accionar la palanca.
     * Retorna null si no hay contacto o si está en cooldown.
     * Retorna el resultado con el mensaje y estado exacto si hubo interacción.
     */
    public tryInteract(
        player: { x: number; y: number },
        tracker: PuzzleProgressTracker,
        grid: RoomGrid
    ): LeverGateInteractionResult | null {
        if (this.isWallOpen) return null;
        if (this.cooldownFrames > 0) return null;

        if (!this.isPlayerOverlappingLever(player)) return null;

        const remaining = tracker.remainingPuzzlesCount;
        const solved = tracker.solvedPuzzlesCount;
        const total = tracker.totalRequiredPuzzles;

        if (!tracker.areAllPrerequisitePuzzlesSolved) {
            this.cooldownFrames = 60; // 1 segundo de cooldown para evitar spam visual
            const desc = remaining === 1 ? 'Falta resolver 1 puzzle' : `Faltan resolver ${remaining} puzzles`;
            return {
                success: false,
                remainingPuzzles: remaining,
                solvedPuzzles: solved,
                message: `🔒 PALANCA BLOQUEADA: ${desc} de las Recámaras 1 a 9 (${solved}/${total})`
            };
        }

        // Todos los puzles resueltos: activar palanca y abrir el muro
        this.isLeverPulled = true;
        this.isWallOpen = true;

        // Convertir las casillas del muro en escalera transitable
        for (const r of Chamber10LeverGate.WALL_ROWS) {
            grid.setTile(Chamber10LeverGate.WALL_GRID_X, r, TileType.Ladder);
        }

        return {
            success: true,
            remainingPuzzles: 0,
            solvedPuzzles: solved,
            message: '✨ ¡MURO DEL FARAÓN ABIERTO! Acceso a la Cúspide concedido'
        };
    }
}
