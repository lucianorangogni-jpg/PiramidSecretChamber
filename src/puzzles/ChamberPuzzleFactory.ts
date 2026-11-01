import type { IChamberPuzzle } from './IChamberPuzzle.ts';
import { Chamber1Puzzle } from './Chamber1Puzzle.ts';
import { Chamber2Puzzle } from './Chamber2Puzzle.ts';
import { Chamber3Puzzle } from './Chamber3Puzzle.ts';
import { Chamber4Puzzle } from './Chamber4Puzzle.ts';
import { Chamber5Puzzle } from './Chamber5Puzzle.ts';
import { Chamber6Puzzle } from './Chamber6Puzzle.ts';
import { Chamber7Puzzle } from './Chamber7Puzzle.ts';
import { Chamber8Puzzle } from './Chamber8Puzzle.ts';
import { Chamber9Puzzle } from './Chamber9Puzzle.ts';

/**
 * Fábrica y catálogo maestro de puzles por recámara.
 * Devuelve la máquina de estados correspondiente para las recámaras 1 a 9.
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
            case 5:
                return new Chamber5Puzzle();
            case 6:
                return new Chamber6Puzzle();
            case 7:
                return new Chamber7Puzzle();
            case 8:
                return new Chamber8Puzzle();
            case 9:
                return new Chamber9Puzzle();
            default:
                return null;
        }
    }
}
