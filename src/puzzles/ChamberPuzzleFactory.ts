import type { IChamberPuzzle } from './IChamberPuzzle.ts';
import { Chamber1Puzzle } from './Chamber1Puzzle.ts';
import { Chamber2Puzzle } from './Chamber2Puzzle.ts';
import { Chamber3Puzzle } from './Chamber3Puzzle.ts';
import { Chamber4Puzzle } from './Chamber4Puzzle.ts';

/**
 * Fábrica y catálogo de puzles por recámara.
 * Devuelve la máquina de estados correspondiente para las recámaras 1, 2, 3 y 4.
 */
export class ChamberPuzzleFactory {
    public static createPuzzleForChamber(chamberNumber: number): IChamberPuzzle | null {
        switch (chamberNumber) {
            case 1:
                return new Chamber1Puzzle();
            case 2:
                return new Chamber2Puzzle();
            case 3:
                return new Chamber3Puzzle();
            case 4:
                return new Chamber4Puzzle();
            default:
                return null;
        }
    }
}
