import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Mummy } from '../../src/entities/Mummy.ts';
import { MummyConstants } from '../../src/entities/MummyConstants.ts';
import { Direction } from '../../src/core/Direction.ts';
import { ChamberMummies } from '../../src/grid/ChamberMummies.ts';
import { GameConstants } from '../../src/core/GameConstants.ts';
import { PlayerConstants } from '../../src/entities/PlayerConstants.ts';

describe('Mummy Enemy Patrol & Jump Mechanics Specs [US-021]', () => {
    it('debe inicializarse con velocidad inferior a la del jugador y hitbox calibrada', () => {
        const mummy = new Mummy(200, 160, 100, 300, Direction.Right);

        assert.strictEqual(mummy.speed, MummyConstants.WALK_SPEED);
        assert.ok(
            mummy.speed < PlayerConstants.WALK_SPEED,
            `La momia (${mummy.speed}) debe ser más lenta que el jugador (${PlayerConstants.WALK_SPEED})`
        );
        assert.strictEqual(mummy.hitboxWidth, 24);
        assert.strictEqual(mummy.hitboxHeight, 28);
        assert.strictEqual(mummy.x, 200);
        assert.strictEqual(mummy.y, 160);
        assert.strictEqual(mummy.direction, Direction.Right);
    });

    it('debe patrullar y rebotar en los extremos minX y maxX invirtiendo la dirección', () => {
        const speed = 2.0;
        const mummy = new Mummy(98, 160, 50, 100, Direction.Right, 'mummy_test', speed);

        // Frame 1: x pasa a 100 y alcanza maxX -> invierte a Left
        mummy.update();
        assert.strictEqual(mummy.x, 100);
        assert.strictEqual(mummy.direction, Direction.Left);

        // Frame 2: se mueve hacia la izquierda
        mummy.update();
        assert.strictEqual(mummy.x, 98);
        assert.strictEqual(mummy.direction, Direction.Left);

        // Simulamos avance hasta minX (50)
        mummy.x = 51;
        mummy.update();
        assert.strictEqual(mummy.x, 50);
        assert.strictEqual(mummy.direction, Direction.Right);
    });

    it('debe alternar la textura de caminata retro cada 12 ticks', () => {
        const mummy = new Mummy(200, 160, 100, 300);

        assert.strictEqual(mummy.textureKey, 'mummy_walk_1');

        for (let i = 0; i < MummyConstants.ANIMATION_TICKS_PER_FRAME; i++) {
            mummy.update();
        }
        assert.strictEqual(mummy.textureKey, 'mummy_walk_2');

        for (let i = 0; i < MummyConstants.ANIMATION_TICKS_PER_FRAME; i++) {
            mummy.update();
        }
        assert.strictEqual(mummy.textureKey, 'mummy_walk_1');
    });

    it('reset() debe devolver la momia a su posición y dirección de spawn inicial', () => {
        const mummy = new Mummy(200, 160, 100, 300, Direction.Right);

        // Movemos la momia
        for (let i = 0; i < 60; i++) mummy.update();
        assert.notStrictEqual(mummy.x, 200);

        mummy.reset();
        assert.strictEqual(mummy.x, 200);
        assert.strictEqual(mummy.y, 160);
        assert.strictEqual(mummy.direction, Direction.Right);
        assert.strictEqual(mummy.textureKey, 'mummy_walk_1');
    });

    it('debe colisionar si el jugador está en su mismo nivel de suelo', () => {
        const groundY = 160;
        const mummy = new Mummy(200, groundY, 100, 300);

        // Jugador en misma posición horizontal y pies en groundY
        const collision = mummy.checkOverlap(200, groundY, 28, 32);
        assert.strictEqual(collision, true, 'Debe haber colisión a ras de suelo');

        // Jugador a distancia segura
        const noCollision = mummy.checkOverlap(150, groundY, 28, 32);
        assert.strictEqual(noCollision, false, 'No debe haber colisión a distancia');
    });

    it('el jugador debe poder sobrevolar y saltar limpiamente sobre la momia', () => {
        const platformY = 160;
        const mummy = new Mummy(200, platformY, 100, 300);

        // En el ápice de un salto de 56px:
        // Los pies del jugador están en (platformY - 56) = 104px
        // La cabeza del jugador está en (104 - 32) = 72px
        // La momia ocupa verticalmente de (platformY - 28) = 132px hasta platformY = 160px
        const playerJumpApexFeetY = platformY - PlayerConstants.JUMP_HEIGHT_PIXELS; // 104px

        // Aunque estén alineados horizontalmente en X=200, verticalmente el jugador está por encima
        const isTouching = mummy.checkOverlap(200, playerJumpApexFeetY, 28, 32);
        assert.strictEqual(
            isTouching,
            false,
            'El jugador en el ápice de salto debe sobrevolar a la momia sin recibir daño'
        );
    });

    it('todas las 10 recámaras deben contar con momias configuradas dentro de plataformas válidas', () => {
        for (let ch = 1; ch <= GameConstants.TOTAL_CHAMBERS; ch++) {
            const mummies = ChamberMummies.createMummiesForChamber(ch);
            assert.ok(mummies.length >= 1, `Recámara ${ch} debe tener al menos una momia`);

            for (const m of mummies) {
                assert.ok(m.minX < m.maxX, `Recámara ${ch}: minX (${m.minX}) debe ser menor que maxX (${m.maxX})`);
                assert.ok(
                    m.startX >= m.minX && m.startX <= m.maxX,
                    `Recámara ${ch}: spawn (${m.startX}) debe estar dentro de [${m.minX}, ${m.maxX}]`
                );
                assert.ok(m.y > 0 && m.y < GameConstants.VIRTUAL_HEIGHT, `Recámara ${ch}: Y válida`);
            }
        }
    });

    it('las recámaras 1, 2, 3 y 4 deben tener una momia adicional en Nivel 1 que patrulla sobre suelo firme sin caer a vacíos', () => {
        for (let ch = 1; ch <= 4; ch++) {
            const mummies = ChamberMummies.createMummiesForChamber(ch);
            assert.strictEqual(mummies.length, 2, `Recámara ${ch} debe tener exactamente 2 momias`);

            const mummyLevel2 = mummies[0];
            const mummyLevel1 = mummies[1];

            // 1. La momia de Nivel 1 debe estar más abajo (mayor Y) que la de Nivel 2
            assert.ok(
                mummyLevel1.y > mummyLevel2.y,
                `Recámara ${ch}: la momia de Nivel 1 (y=${mummyLevel1.y}) debe estar debajo del Nivel 2 (y=${mummyLevel2.y})`
            );

            // 2. La velocidad de ambas momias debe ser idéntica
            assert.strictEqual(
                mummyLevel1.speed,
                mummyLevel2.speed,
                `Recámara ${ch}: velocidad de momia Nivel 1 (${mummyLevel1.speed}) debe ser idéntica a Nivel 2 (${mummyLevel2.speed})`
            );

            // 3. Sus cotas de patrulla (minX y maxX) no deben sobrepasar hacia el vacío
            // En recámaras 1, 3 y 4 el vacío empieza en columna 11 (x=352)
            // En recámara 2 el vacío está en columna 12 (x=384)
            if (ch === 1 || ch === 3 || ch === 4) {
                assert.ok(
                    mummyLevel1.maxX <= 336,
                    `Recámara ${ch}: maxX (${mummyLevel1.maxX}) debe detenerse antes del foso en columna 11`
                );
                assert.ok(
                    mummyLevel1.minX >= 64,
                    `Recámara ${ch}: minX (${mummyLevel1.minX}) debe comenzar sobre plataforma sólida (col 2+)`
                );
            } else if (ch === 2) {
                assert.ok(
                    mummyLevel1.maxX <= 368,
                    `Recámara 2: maxX (${mummyLevel1.maxX}) debe detenerse antes del foso en columna 12`
                );
            }
        }
    });
});

