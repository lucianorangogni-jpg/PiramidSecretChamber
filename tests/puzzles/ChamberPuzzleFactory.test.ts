import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChamberPuzzleFactory } from '../../src/puzzles/ChamberPuzzleFactory.ts';
import { Chamber1Puzzle } from '../../src/puzzles/Chamber1Puzzle.ts';
import { Chamber2Puzzle } from '../../src/puzzles/Chamber2Puzzle.ts';
import { Chamber3Puzzle } from '../../src/puzzles/Chamber3Puzzle.ts';
import { Chamber4Puzzle } from '../../src/puzzles/Chamber4Puzzle.ts';

describe('ChamberPuzzleFactory Specs', () => {
    it('debe instanciar la clase correcta para recámaras 1, 2, 3 y 4', () => {
        const p1 = ChamberPuzzleFactory.createPuzzleForChamber(1);
        assert.ok(p1 instanceof Chamber1Puzzle);
        assert.strictEqual(p1.chamberNumber, 1);

        const p2 = ChamberPuzzleFactory.createPuzzleForChamber(2);
        assert.ok(p2 instanceof Chamber2Puzzle);
        assert.strictEqual(p2.chamberNumber, 2);

        const p3 = ChamberPuzzleFactory.createPuzzleForChamber(3);
        assert.ok(p3 instanceof Chamber3Puzzle);
        assert.strictEqual(p3.chamberNumber, 3);

        const p4 = ChamberPuzzleFactory.createPuzzleForChamber(4);
        assert.ok(p4 instanceof Chamber4Puzzle);
        assert.strictEqual(p4.chamberNumber, 4);
    });

    it('debe devolver null para recámaras que aún no tienen puzles configurados (5 a 10)', () => {
        for (let c = 5; c <= 10; c++) {
            assert.strictEqual(ChamberPuzzleFactory.createPuzzleForChamber(c), null);
        }
        assert.strictEqual(ChamberPuzzleFactory.createPuzzleForChamber(0), null);
        assert.strictEqual(ChamberPuzzleFactory.createPuzzleForChamber(11), null);
    });
});

