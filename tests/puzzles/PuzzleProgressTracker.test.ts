import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PuzzleProgressTracker } from '../../src/puzzles/PuzzleProgressTracker.ts';

describe('PuzzleProgressTracker Specs', () => {
    let tracker: PuzzleProgressTracker;

    beforeEach(() => {
        tracker = PuzzleProgressTracker.getInstance();
        tracker.reset();
    });

    it('debe iniciar con 0 recámaras completadas y la Cúspide (Recámara 10) bloqueada', () => {
        assert.strictEqual(tracker.completedChambersCount, 0);
        assert.strictEqual(tracker.isChamber10Unlocked, false);

        for (let ch = 1; ch <= 9; ch++) {
            assert.strictEqual(tracker.isChamberCompleted(ch), false);
            const state = tracker.getChamberState(ch);
            assert.strictEqual(state.puzzle1Solved, false);
            assert.strictEqual(state.puzzle2Solved, false);
        }
    });

    it('requiere que ambos puzles de una recámara sean completados para considerarla completada', () => {
        tracker.markPuzzle1Solved(1);
        assert.strictEqual(tracker.isChamberCompleted(1), false);
        assert.strictEqual(tracker.completedChambersCount, 0);

        tracker.markPuzzle2Solved(1);
        assert.strictEqual(tracker.isChamberCompleted(1), true);
        assert.strictEqual(tracker.completedChambersCount, 1);
        assert.strictEqual(tracker.isChamber10Unlocked, false);
    });

    it('desbloquea la Cúspide (Recámara 10) únicamente cuando las 9 recámaras están resueltas', () => {
        for (let ch = 1; ch <= 8; ch++) {
            tracker.markPuzzle1Solved(ch);
            tracker.markPuzzle2Solved(ch);
            assert.strictEqual(tracker.isChamber10Unlocked, false);
        }
        assert.strictEqual(tracker.completedChambersCount, 8);

        // Completar la 9.ª recámara
        tracker.markPuzzle1Solved(9);
        assert.strictEqual(tracker.isChamber10Unlocked, false);
        tracker.markPuzzle2Solved(9);

        assert.strictEqual(tracker.completedChambersCount, 9);
        assert.strictEqual(tracker.isChamber10Unlocked, true);
    });

    it('reset() reinicia todos los progresos a falso', () => {
        tracker.markPuzzle1Solved(3);
        tracker.markPuzzle2Solved(3);
        assert.strictEqual(tracker.completedChambersCount, 1);

        tracker.reset();
        assert.strictEqual(tracker.completedChambersCount, 0);
        assert.strictEqual(tracker.isChamberCompleted(3), false);
        assert.strictEqual(tracker.isChamber10Unlocked, false);
    });

    it('debe calcular exactamente los puzles resueltos, restantes (de 18) y generar los mensajes correctos', () => {
        tracker.reset();
        assert.strictEqual(tracker.totalRequiredPuzzles, 18);
        assert.strictEqual(tracker.solvedPuzzlesCount, 0);
        assert.strictEqual(tracker.remainingPuzzlesCount, 18);
        assert.strictEqual(tracker.areAllPrerequisitePuzzlesSolved, false);
        assert.strictEqual(tracker.getRemainingPuzzlesMessage(), 'FALTAN 18 PUZZLES POR RESOLVER (0/18)');

        // Resolver 3 puzles
        tracker.markPuzzle1Solved(1);
        tracker.markPuzzle2Solved(1);
        tracker.markPuzzle1Solved(2);
        assert.strictEqual(tracker.solvedPuzzlesCount, 3);
        assert.strictEqual(tracker.remainingPuzzlesCount, 15);
        assert.strictEqual(tracker.areAllPrerequisitePuzzlesSolved, false);
        assert.strictEqual(tracker.getRemainingPuzzlesMessage(), 'FALTAN 15 PUZZLES POR RESOLVER (3/18)');

        // Resolver hasta 17 puzles (falta 1)
        for (let ch = 3; ch <= 9; ch++) {
            tracker.markPuzzle1Solved(ch);
            tracker.markPuzzle2Solved(ch);
        }
        tracker.markPuzzle2Solved(2); // Ahora 18 resueltos
        assert.strictEqual(tracker.solvedPuzzlesCount, 18);
        assert.strictEqual(tracker.remainingPuzzlesCount, 0);
        assert.strictEqual(tracker.areAllPrerequisitePuzzlesSolved, true);
        assert.strictEqual(tracker.getRemainingPuzzlesMessage(), '¡TODOS LOS PUZZLES RESUELTOS! (18/18)');
    });
});

