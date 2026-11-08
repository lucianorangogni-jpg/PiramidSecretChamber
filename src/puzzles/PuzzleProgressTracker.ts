import { GameConstants } from '../core/GameConstants.ts';

export interface ChamberPuzzleProgress {
    puzzle1Solved: boolean; // Tesoro Secreto del Faraón recargado y saqueado (+1000 PTS)
    puzzle2Solved: boolean; // Momia petrificada y Gema Sagrada recolectada (+1000 PTS)
}

/**
 * Gestor global de progreso de puzles en toda la pirámide ancestral.
 * Registra la resolución de los puzles de cada recámara (1 a 9).
 * El Sarcófago del Faraón en la Recámara 10 (Cúspide) solo se desbloquea
 * cuando se han completado TODOS los puzles de las Recámaras 1 a 9.
 */
export class PuzzleProgressTracker {
    private static instance: PuzzleProgressTracker | null = null;

    private readonly progress: Map<number, ChamberPuzzleProgress> = new Map();

    constructor() {
        this.reset();
    }

    public static getInstance(): PuzzleProgressTracker {
        if (!PuzzleProgressTracker.instance) {
            PuzzleProgressTracker.instance = new PuzzleProgressTracker();
        }
        return PuzzleProgressTracker.instance;
    }

    public static resetInstance(): void {
        PuzzleProgressTracker.instance = new PuzzleProgressTracker();
    }

    public reset(): void {
        this.progress.clear();
        for (let c = 1; c <= GameConstants.TOTAL_CHAMBERS; c++) {
            this.progress.set(c, {
                puzzle1Solved: false,
                puzzle2Solved: false
            });
        }
    }

    public markPuzzle1Solved(chamber: number): void {
        const p = this.progress.get(chamber);
        if (p) {
            p.puzzle1Solved = true;
        }
    }

    public markPuzzle2Solved(chamber: number): void {
        const p = this.progress.get(chamber);
        if (p) {
            p.puzzle2Solved = true;
        }
    }

    public isPuzzle1Solved(chamber: number): boolean {
        return this.progress.get(chamber)?.puzzle1Solved ?? false;
    }

    public isPuzzle2Solved(chamber: number): boolean {
        return this.progress.get(chamber)?.puzzle2Solved ?? false;
    }

    public isChamberCompleted(chamber: number): boolean {
        const p = this.progress.get(chamber);
        if (!p) return false;
        return p.puzzle1Solved && p.puzzle2Solved;
    }

    public getChamberState(chamber: number): ChamberPuzzleProgress {
        return this.progress.get(chamber) ?? { puzzle1Solved: false, puzzle2Solved: false };
    }

    /**
     * Cuenta cuántas recámaras entre 1 y 9 tienen TODOS sus puzles resueltos.
     */
    public get completedChambersCount(): number {
        let count = 0;
        for (let c = 1; c < GameConstants.TOTAL_CHAMBERS; c++) {
            if (this.isChamberCompleted(c)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Total de recámaras prerrequisito previas a la cúspide (1 a 9 = 9 recámaras).
     */
    public get requiredChambersCount(): number {
        return GameConstants.TOTAL_CHAMBERS - 1; // 9
    }

    /**
     * Cuenta cuántos puzles individuales (de los 18 posibles en recámaras 1 a 9) han sido resueltos.
     */
    public get solvedPuzzlesCount(): number {
        let count = 0;
        for (let c = 1; c < GameConstants.TOTAL_CHAMBERS; c++) {
            if (this.isPuzzle1Solved(c)) count++;
            if (this.isPuzzle2Solved(c)) count++;
        }
        return count;
    }

    /**
     * Total de puzles requeridos en las recámaras 1 a 9 (9 recámaras * 2 puzles = 18 puzles).
     */
    public get totalRequiredPuzzles(): number {
        return (GameConstants.TOTAL_CHAMBERS - 1) * 2; // 18
    }

    /**
     * Cuántos puzles faltan por resolver antes de poder abrir el muro del Sarcófago en Recámara 10.
     */
    public get remainingPuzzlesCount(): number {
        return Math.max(0, this.totalRequiredPuzzles - this.solvedPuzzlesCount);
    }

    /**
     * Verifica si absolutamente todos los 18 puzles de las recámaras 1 a 9 han sido resueltos.
     */
    public get areAllPrerequisitePuzzlesSolved(): boolean {
        return this.remainingPuzzlesCount === 0;
    }

    /**
     * Devuelve el mensaje diegético exacto indicando cuántos puzles faltan resolver.
     */
    public getRemainingPuzzlesMessage(): string {
        const remaining = this.remainingPuzzlesCount;
        const solved = this.solvedPuzzlesCount;
        if (remaining === 0) {
            return `¡TODOS LOS PUZZLES RESUELTOS! (${solved}/${this.totalRequiredPuzzles})`;
        }
        if (remaining === 1) {
            return `FALTA 1 PUZZLE POR RESOLVER (${solved}/${this.totalRequiredPuzzles})`;
        }
        return `FALTAN ${remaining} PUZZLES POR RESOLVER (${solved}/${this.totalRequiredPuzzles})`;
    }

    /**
     * La Recámara 10 (Cúspide) y el Sarcófago del Faraón solo se desbloquean
     * si se han completado todos los puzles de las 9 recámaras anteriores.
     */
    public get isChamber10Unlocked(): boolean {
        return this.areAllPrerequisitePuzzlesSolved;
    }
}

