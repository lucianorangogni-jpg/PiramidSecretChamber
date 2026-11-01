import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 6 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 6
 * (Galería de las Cadenas y el Abismo de Anubis).
 * Garantiza cero allocations en el bucle continuo (60 FPS) y máxima fidelidad retro.
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "EL TRIÁNGULO INVERSO: BÓVEDA SUPERIOR PRIMERO" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Regla Inversa de la Bóveda): El arqueólogo debe escalar hasta el Nivel 2 y saquear
 *    PRIMERO el cofre de la bóveda superior (17, 7) ANTES de saquear el cofre del Suelo Base (17, 13).
 *    (Si se abre o saquea el cofre de Nivel 0 antes de saquear el cofre superior, el sello se rompe).
 * 2. PASO 2 (Saqueo Inferior y Llave): Tras saquear el cofre superior, descender para saquear el
 *    cofre de Nivel 0 (17, 13) y capturar en pleno salto la Llave Ancestral en Nivel 1 (12, 9).
 * 3. PASO 3 (Doble Engranaje Rúnico): Con el orden estricto cumplido, accionar la pared movediza
 *    del Nivel 0 (ch6_wall1) dos (2) veces completas (2 ciclos de apertura).
 * 4. RECOMPENSA: Al completar el segundo ciclo, el cofre de la bóveda inferior reaparece recargado
 *    con el Tesoro Secreto del Faraón otorgando +1000 PUNTOS adicionales.
 * PISTA DIEGÉTICA (Mural Nivel 0):
 *    [COFRE N2 1.º] -> [COFRE N0 + LLAVE] -> [II PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "ACROBACIA EN LAS ALTURAS DE ANUBIS" (4 Saltos en Nivel 3)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Acrobacia en la Cima): En la amplia plataforma de Nivel 3 (fila 4, y=128, con 3 tiles
 *    de altura libre hasta el techo), el jugador debe enfrentar a la momia guardiana y ejecutar
 *    cuatro (4) saltos consecutivos y limpios en el aire sobre ella.
 * 2. RECOMPENSA: Al alcanzar el 4.º salto:
 *    - Ambas momias se petrifican en estatuas doradas durante 5 segundos (300 frames).
 *    - En el descansillo de Nivel 1 en (12, 9) se materializa la GEMA SAGRADA DE ANUBIS (+1000 PTS).
 * PISTA DIEGÉTICA (Mural Nivel 2):
 *    [SALTO 4x MOMIA N3 (IIII)] -> [MOMIAS PETRIFICADAS] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber6Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 6;
    public static readonly REQUIRED_DOOR_CYCLES = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N3 = 4;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Orden Inverso (Cofre N2 Primero)
    // Etapas:
    // 0: Inicial.
    // 1: Cofre N2 saqueado primero correctamente.
    // 2: Cofre N0 y Llave en poder del jugador. (Listo para 2 ciclos de puerta).
    // -1: Secuencia fallida (saqueó N0 antes que N2).
    private _puzzle1Stage: number = 0;
    private _hasKey: boolean = false;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 4 Saltos en N3 (plataforma con 96 px de altura libre)
    private _mummyJumpsN3: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Descansillo Nivel 1: col 12, row 9)
    public readonly gemGridX: number = 12;
    public readonly gemGridY: number = 9;
    public readonly gemValue: number = 1000;

    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch6_secret_pharaoh_treasure');
    }

    public get puzzle1Stage(): number {
        return this._puzzle1Stage;
    }

    public get hasKey(): boolean {
        return this._hasKey;
    }

    public get doorCycleCount(): number {
        return this._doorCycleCount;
    }

    public get isSecretTreasureSpawned(): boolean {
        return this._isSecretTreasureSpawned;
    }

    public get isSecretTreasureCollected(): boolean {
        return this._isSecretTreasureCollected;
    }

    public get mummyJumpsN3(): number {
        return this._mummyJumpsN3;
    }

    public get isMummyPetrified(): boolean {
        return this._isMummyPetrified;
    }

    public get isGemSpawned(): boolean {
        return this._isGemSpawned;
    }

    public get isGemCollected(): boolean {
        return this._isGemCollected;
    }

    public get gemPixelX(): number {
        return this.gemGridX * GameConstants.TILE_SIZE;
    }

    public get gemPixelY(): number {
        return this.gemGridY * GameConstants.TILE_SIZE;
    }

    public notifyTreasureCollected(treasureId?: string): void {
        const isUpperTreasure = treasureId && (treasureId.includes('ch6_t2') || treasureId.includes('17_7'));
        const isGroundTreasure = !treasureId || treasureId.includes('ch6_t1') || treasureId.includes('17_13');

        if (isUpperTreasure && this._puzzle1Stage === 0) {
            this._puzzle1Stage = 1;
            this.pendingNotifications.push({
                text: '🔺 ¡TRIÁNGULO INVERSO! (Paso 1/2: Cofre Nivel 2)',
                points: 0,
                x: 17 * GameConstants.TILE_SIZE + 16,
                y: 7 * GameConstants.TILE_SIZE - 20
            });
        } else if (isGroundTreasure) {
            if (this._puzzle1Stage === 1) {
                if (this._hasKey) {
                    this._puzzle1Stage = 2;
                }
            } else if (this._puzzle1Stage === 0) {
                // Saqueó N0 antes que N2 -> rompe la regla
                this._puzzle1Stage = -1;
            }
        }
    }

    public notifyKeyCollected(): void {
        this._hasKey = true;
        if (this._puzzle1Stage === 1) {
            this._puzzle1Stage = 2;
        }
    }

    public notifyWallActivated(wallId: string): void {
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        if (this._puzzle1Stage === 2 && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber6Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber6Puzzle.REQUIRED_DOOR_CYCLES})`,
                    points: 0,
                    x: 15 * GameConstants.TILE_SIZE + 16,
                    y: 13 * GameConstants.TILE_SIZE - 20
                });
            }
        }
    }

    private triggerSecretTreasureSpawn(): void {
        this._isSecretTreasureSpawned = true;
        this.secretTreasure.reset();

        this.pendingNotifications.push({
            text: '✨ ¡TESORO DEL FARAÓN RECARGADO! +1000 PTS',
            points: 0,
            x: 17 * GameConstants.TILE_SIZE + 16,
            y: 13 * GameConstants.TILE_SIZE - 20
        });
    }

    public checkSecretTreasureCollection(
        playerCenterX: number,
        playerFeetY: number,
        width: number = 28,
        height: number = 32
    ): number {
        if (!this._isSecretTreasureSpawned || this._isSecretTreasureCollected) {
            return 0;
        }

        if (this.secretTreasure.checkOverlap(playerCenterX, playerFeetY, width, height)) {
            const pts = this.secretTreasure.collect();
            this._isSecretTreasureCollected = true;
            return pts;
        }

        return 0;
    }

    public checkGemCollection(
        playerCenterX: number,
        playerFeetY: number,
        width: number = 28,
        height: number = 32
    ): number {
        if (!this._isGemSpawned || this._isGemCollected) {
            return 0;
        }

        const halfSize = 12;
        const gemCenterX = this.gemPixelX + GameConstants.TILE_SIZE / 2;
        const gemCenterY = this.gemPixelY + GameConstants.TILE_SIZE / 2;

        const gLeft = gemCenterX - halfSize;
        const gRight = gemCenterX + halfSize;
        const gTop = gemCenterY - halfSize;
        const gBottom = gemCenterY + halfSize;

        const pLeft = playerCenterX - width / 2;
        const pRight = playerCenterX + width / 2;
        const pTop = playerFeetY - height;
        const pBottom = playerFeetY;

        const overlap = pLeft < gRight && pRight > gLeft && pTop < gBottom && pBottom > gTop;
        if (overlap) {
            this._isGemCollected = true;
            return this.gemValue;
        }

        return 0;
    }

    public update(
        playerCenterX: number,
        playerFeetY: number,
        isJumping: boolean,
        mummies: readonly Mummy[]
    ): void {
        if (this._isMummyPetrified) {
            this._petrifyTimerFrames--;
            if (this._petrifyTimerFrames <= 0) {
                this._isMummyPetrified = false;
                this._petrifyTimerFrames = 0;
                for (const m of mummies) {
                    m.isActive = true;
                }
            }
        }

        if (!isJumping) {
            this._hasJumpedCurrentAirborne = false;
            return;
        }

        if (this._hasJumpedCurrentAirborne) {
            return;
        }

        for (const mummy of mummies) {
            if (!mummy.isActive) continue;

            const horizDistance = Math.abs(playerCenterX - mummy.x);
            const vertDistance = mummy.y - playerFeetY;
            if (horizDistance <= 24 && vertDistance >= 10 && vertDistance <= 64) {
                this._hasJumpedCurrentAirborne = true;

                // Momia de Nivel 3 (fila 4, y=128, con 96 px de altura libre hasta el techo)
                const isLevel3 = mummy.y <= 160;
                if (isLevel3) {
                    this._mummyJumpsN3++;

                    if (!this._isGemSpawned) {
                        if (this._mummyJumpsN3 >= Chamber6Puzzle.REQUIRED_MUMMY_JUMPS_N3) {
                            this.triggerMummyPetrification(mummies);
                        } else {
                            this.pendingNotifications.push({
                                text: `👣 ¡SALTO SOBRE MOMIA (Nivel 3)! (${this._mummyJumpsN3}/${Chamber6Puzzle.REQUIRED_MUMMY_JUMPS_N3})`,
                                points: 0,
                                x: mummy.x,
                                y: mummy.y - 36
                            });
                        }
                    }
                }
                break;
            }
        }
    }

    private triggerMummyPetrification(mummies: readonly Mummy[]): void {
        this._isMummyPetrified = true;
        this._petrifyTimerFrames = Chamber6Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false;
        }

        this.pendingNotifications.push({
            text: '🗿 ¡MOMIAS PETRIFICADAS! GEMA SAGRADA DE ANUBIS +1000 PTS',
            points: 0,
            x: this.gemPixelX + 16,
            y: this.gemPixelY - 20
        });
    }

    public consumePendingNotifications(): PuzzleEventNotification[] {
        if (this.pendingNotifications.length === 0) return [];
        const copy = [...this.pendingNotifications];
        this.pendingNotifications.length = 0;
        return copy;
    }

    public reset(): void {
        this._puzzle1Stage = 0;
        this._hasKey = false;
        this._doorCycleCount = 0;
        this._isSecretTreasureSpawned = false;
        this._isSecretTreasureCollected = false;
        this.secretTreasure.reset();

        this._mummyJumpsN3 = 0;
        this._isMummyPetrified = false;
        this._petrifyTimerFrames = 0;
        this._isGemSpawned = false;
        this._isGemCollected = false;
        this._hasJumpedCurrentAirborne = false;
        this.pendingNotifications.length = 0;
    }
}

