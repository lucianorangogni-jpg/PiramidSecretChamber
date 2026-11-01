import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChamberPuzzleFactory } from '../../src/puzzles/ChamberPuzzleFactory.ts';
import { Chamber1Puzzle } from '../../src/puzzles/Chamber1Puzzle.ts';
import { Chamber2Puzzle } from '../../src/puzzles/Chamber2Puzzle.ts';
import { Chamber3Puzzle } from '../../src/puzzles/Chamber3Puzzle.ts';
import { Chamber4Puzzle } from '../../src/puzzles/Chamber4Puzzle.ts';
import { Chamber5Puzzle } from '../../src/puzzles/Chamber5Puzzle.ts';
import { Chamber6Puzzle } from '../../src/puzzles/Chamber6Puzzle.ts';
import { Chamber7Puzzle } from '../../src/puzzles/Chamber7Puzzle.ts';
import { Chamber8Puzzle } from '../../src/puzzles/Chamber8Puzzle.ts';
import { Chamber9Puzzle } from '../../src/puzzles/Chamber9Puzzle.ts';

describe('ChamberPuzzleFactory Specs', () => {
    it('debe instanciar la clase correcta para recámaras 1 a 9', () => {
        const p1 = ChamberPuzzleFactory.createPuzzleForChamber(1);
        assert.ok(p1 instanceof Chamber1Puzzle);
        assert.strictEqual(p1?.chamberNumber, 1);

        const p2 = ChamberPuzzleFactory.createPuzzleForChamber(2);
        assert.ok(p2 instanceof Chamber2Puzzle);
        assert.strictEqual(p2?.chamberNumber, 2);

        const p3 = ChamberPuzzleFactory.createPuzzleForChamber(3);
        assert.ok(p3 instanceof Chamber3Puzzle);
        assert.strictEqual(p3?.chamberNumber, 3);

        const p4 = ChamberPuzzleFactory.createPuzzleForChamber(4);
        assert.ok(p4 instanceof Chamber4Puzzle);
        assert.strictEqual(p4?.chamberNumber, 4);

        const p5 = ChamberPuzzleFactory.createPuzzleForChamber(5);
        assert.ok(p5 instanceof Chamber5Puzzle);
        assert.strictEqual(p5?.chamberNumber, 5);

        const p6 = ChamberPuzzleFactory.createPuzzleForChamber(6);
        assert.ok(p6 instanceof Chamber6Puzzle);
        assert.strictEqual(p6?.chamberNumber, 6);

        const p7 = ChamberPuzzleFactory.createPuzzleForChamber(7);
        assert.ok(p7 instanceof Chamber7Puzzle);
        assert.strictEqual(p7?.chamberNumber, 7);

        const p8 = ChamberPuzzleFactory.createPuzzleForChamber(8);
        assert.ok(p8 instanceof Chamber8Puzzle);
        assert.strictEqual(p8?.chamberNumber, 8);

        const p9 = ChamberPuzzleFactory.createPuzzleForChamber(9);
        assert.ok(p9 instanceof Chamber9Puzzle);
        assert.strictEqual(p9?.chamberNumber, 9);
    });

    it('debe devolver null para la recámara 10 (pendiente de diseño de puzle único) y valores fuera de rango', () => {
        assert.strictEqual(ChamberPuzzleFactory.createPuzzleForChamber(10), null);
        assert.strictEqual(ChamberPuzzleFactory.createPuzzleForChamber(0), null);
        assert.strictEqual(ChamberPuzzleFactory.createPuzzleForChamber(11), null);
    });
});
