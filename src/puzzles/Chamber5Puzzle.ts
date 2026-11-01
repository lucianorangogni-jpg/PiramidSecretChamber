import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 5 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 5
 * (Primer templo de 4 plataformas en el Nivel 2 de la pirámide).
 * Garantiza cero allocations en el bucle continuo (60 FPS) y máxima fidelidad retro.
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "LA DANZA DE LAS BÓVEDAS GEMELAS Y TRIPLE CICLO" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Exploración): El arqueólogo debe explorar las plataformas de 4 alturas y saquear
 *    los dos (2) tesoros base:
 *    - Tesoro 1 en la bóveda inferior del Nivel 0 (17, 13).
 *    - Tesoro 2 en la bóveda intermedia del Nivel 2 (17, 7).
 * 2. PASO 2 (Llave Ancestral): En Nivel 1, saltar con precisión para capturar la Llave Ancestral
 *    suspendida en (6, 6).
 * 3. PASO 3 (Invocación Ancestral): Con ambos cofres saqueados y la llave en su poder, regresar
 *    al Suelo Base (Nivel 0) y accionar la pared movediza (ch5_wall1) tres (3) veces completas.
 * 4. RECOMPENSA: Al completar el tercer ciclo, el sello del faraón responde: reaparece el
 *    Tesoro Secreto del Faraón en (17, 13) otorgando +1000 PUNTOS adicionales.
 * PISTA DIEGÉTICA (Mural Nivel 0):
 *    [COFRE + COFRE + LLAVE] -> [III PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL DESAFÍO DE LAS CUMBRES SAGRADAS" (2 Saltos N2 + 2 Saltos N3)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Salto en Nivel 2): Subir a la plataforma de Nivel 2 (fila 8, y=256, con 3 tiles de
 *    altura despejada) y saltar dos (2) veces limpiamente sobre la momia de Nivel 2.
 * 2. PASO 2 (Salto en Nivel 3): Subir a la plataforma de Nivel 3 (fila 4, y=128, con 3 tiles de
 *    altura hasta el techo) y saltar dos (2) veces sobre la momia patrullera superior.
 * 3. RECOMPENSA: Al acumular los 4 saltos (2 en Nivel 2 y 2 en Nivel 3):
 *    - Todas las momias se petrifican en estatuas doradas durante 5 segundos (300 frames).
 *    - En la plataforma de Nivel 1 en (6, 10) brota la radiante GEMA SAGRADA DE OSIRIS (+1000 PTS).
 * PISTA DIEGÉTICA (Mural Nivel 2):
 *    [SALTO 2x MOMIA N2] + [SALTO 2x MOMIA N3] -> [MOMIAS PETRIFICADAS] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber5Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 5;
    public static readonly REQUIRED_DOOR_CYCLES = 3;
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N3 = 2;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Doble Bóveda + Llave + 3 Ciclos
    private _initialTreasuresCollected: number = 0;
    private _hasKey: boolean = false;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 2 Saltos N2 + 2 Saltos N3 (plataformas con 96 px de altura libre)
    private _mummyJumpsN2: number = 0;
    private _mummyJumpsN3: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Plataforma Nivel 1: col 6, row 10)
    public readonly gemGridX: number = 6;
    public readonly gemGridY: number = 10;
    public readonly gemValue: number = 1000;

    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch5_secret_pharaoh_treasure');
    }

    public get initialTreasuresCollected(): number {
        return this._initialTreasuresCollected;
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

    public get mummyJumpsN2(): number {
        return this._mummyJumpsN2;
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

    public notifyTreasureCollected(_treasureId?: string): void {
        this._initialTreasuresCollected++;
    }

    public notifyKeyCollected(): void {
        this._hasKey = true;
    }

    public notifyWallActivated(wallId: string): void {
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        const arePrerequisitesMet = this._initialTreasuresCollected >= 2 && this._hasKey;

        if (arePrerequisitesMet && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber5Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber5Puzzle.REQUIRED_DOOR_CYCLES})`,
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

                // Clasificación de la momia: Nivel 3 (fila 4, y <= 160), Nivel 2 (fila 8, y > 160)
                const isUpperN3 = mummy.y <= 160;

                if (isUpperN3) {
                    this._mummyJumpsN3++;
                } else {
                    this._mummyJumpsN2++;
                }

                if (!this._isGemSpawned) {
                    if (this._mummyJumpsN3 >= Chamber5Puzzle.REQUIRED_MUMMY_JUMPS_N3 &&
                        this._mummyJumpsN2 >= Chamber5Puzzle.REQUIRED_MUMMY_JUMPS_N2) {
                        this.triggerMummyPetrification(mummies);
                    } else {
                        const platformLabel = isUpperN3 ? 'Nivel 3' : 'Nivel 2';
                        const count = isUpperN3 ? this._mummyJumpsN3 : this._mummyJumpsN2;
                        const target = isUpperN3 ? Chamber5Puzzle.REQUIRED_MUMMY_JUMPS_N3 : Chamber5Puzzle.REQUIRED_MUMMY_JUMPS_N2;
                        this.pendingNotifications.push({
                            text: `👣 ¡SALTO SOBRE MOMIA (${platformLabel})! (${count}/${target})`,
                            points: 0,
                            x: mummy.x,
                            y: mummy.y - 36
                        });
                    }
                }
                break;
            }
        }
    }

    private triggerMummyPetrification(mummies: readonly Mummy[]): void {
        this._isMummyPetrified = true;
        this._petrifyTimerFrames = Chamber5Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false;
        }

        this.pendingNotifications.push({
            text: '🗿 ¡MOMIAS PETRIFICADAS! GEMA SAGRADA DE OSIRIS +1000 PTS',
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
        this._initialTreasuresCollected = 0;
        this._hasKey = false;
        this._doorCycleCount = 0;
        this._isSecretTreasureSpawned = false;
        this._isSecretTreasureCollected = false;
        this.secretTreasure.reset();

        this._mummyJumpsN2 = 0;
        this._mummyJumpsN3 = 0;
        this._isMummyPetrified = false;
        this._petrifyTimerFrames = 0;
        this._isGemSpawned = false;
        this._isGemCollected = false;
        this._hasJumpedCurrentAirborne = false;
        this.pendingNotifications.length = 0;
    }
}

