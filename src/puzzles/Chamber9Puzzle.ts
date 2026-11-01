import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 9 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 9
 * (La Antesala de la Cúspide y el Guardián de los Nueve Sellos).
 * Garantiza cero allocations en el bucle continuo (60 FPS) y máxima fidelidad retro.
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "EL SELLO FINAL DE LOS NUEVE SELLOS" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Protocolo de la Llave en la Antesala): El arqueólogo debe capturar PRIMERO
 *    la Llave Ancestral en Nivel 1 (12, 9) antes de saquear cualquiera de los cofres base.
 * 2. PASO 2 (Saqueo Sagrado y Acrobacia):
 *    - Saquear los dos cofres base (Nivel 0 en 17, 13 y Nivel 2 en 17, 7).
 *    - Acumular al menos tres (3) saltos limpios sobre cualquiera de las momias patrulleras.
 * 3. PASO 3 (Triple Ciclo Sagrado): Regresar al Suelo Base (Nivel 0) y accionar la pared
 *    movediza (ch9_wall1) tres (3) veces completas (3 ciclos de apertura).
 * 4. RECOMPENSA: Al completar el tercer ciclo, el cofre de la bóveda inferior se recarga
 *    con el Tesoro Secreto del Faraón otorgando +1000 PUNTOS adicionales.
 * PISTA DIEGÉTICA (Mural Nivel 0):
 *    [LLAVE 1.º + 2 COFRES + 3x SALTOS] -> [III PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL DESPERTAR DE LA CÚSPIDE: SALTO CUÁDRUPLE ESCALONADO" (2 Saltos N2 + 2 Saltos N3)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Desafío de las Alturas): Las momias superiores custodian el acceso hacia la
 *    plataforma más alta que conduce a la Recámara 10.
 *    - Ejecutar dos (2) saltos limpios sobre la momia de Nivel 2.
 *    - Ejecutar dos (2) saltos limpios sobre la momia superior de Nivel 3.
 * 2. RECOMPENSA: Al alcanzar los 4 saltos escalonados (2 en N2 + 2 en N3):
 *    - Todas las momias de la recámara se petrifican en estatuas doradas durante 5 segundos.
 *    - En el descansillo de Nivel 1 en (12, 9) se materializa la radiante GEMA SAGRADA DEL OJO DE HORUS (+1000 PTS).
 * PISTA DIEGÉTICA (Mural Nivel 2):
 *    [SALTO 2x N2] + [SALTO 2x N3] -> [MOMIAS PETRIFICADAS] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber9Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 9;
    public static readonly REQUIRED_DOOR_CYCLES = 3;
    public static readonly REQUIRED_PREREQ_MUMMY_JUMPS = 3;
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N3 = 2;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Llave Primero + 2 Cofres + 3 Saltos + 3 Ciclos
    private _keyCollectedFirst: boolean = false;
    private _hasKey: boolean = false;
    private _initialTreasuresCollected: number = 0;
    private _totalMummyJumps: number = 0;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 2 N2 + 2 N3
    private _mummyJumpsN2: number = 0;
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
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch9_secret_pharaoh_treasure');
    }

    public get keyCollectedFirst(): boolean {
        return this._keyCollectedFirst;
    }

    public get hasKey(): boolean {
        return this._hasKey;
    }

    public get initialTreasuresCollected(): number {
        return this._initialTreasuresCollected;
    }

    public get totalMummyJumps(): number {
        return this._totalMummyJumps;
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

    public notifyKeyCollected(): void {
        this._hasKey = true;
        if (this._initialTreasuresCollected === 0) {
            this._keyCollectedFirst = true;
            this.pendingNotifications.push({
                text: '🗝️ ¡LLAVE ANCESTRAL PRIMERO! (Protocolo Antesala Activo)',
                points: 0,
                x: this.gemPixelX + 16,
                y: this.gemPixelY - 20
            });
        } else {
            this._keyCollectedFirst = false;
        }
    }

    public notifyTreasureCollected(_treasureId?: string): void {
        this._initialTreasuresCollected++;
    }

    public notifyWallActivated(wallId: string): void {
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        const arePrerequisitesMet =
            this._keyCollectedFirst &&
            this._hasKey &&
            this._initialTreasuresCollected >= 2 &&
            this._totalMummyJumps >= Chamber9Puzzle.REQUIRED_PREREQ_MUMMY_JUMPS;

        if (arePrerequisitesMet && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber9Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber9Puzzle.REQUIRED_DOOR_CYCLES})`,
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
                this._totalMummyJumps++;

                // Nivel 2 (200 <= y < 300) y Nivel 3 (y < 200)
                if (mummy.y >= 200 && mummy.y < 300) {
                    this._mummyJumpsN2++;
                } else if (mummy.y < 200) {
                    this._mummyJumpsN3++;
                }

                if (!this._isGemSpawned) {
                    if (this._mummyJumpsN2 >= Chamber9Puzzle.REQUIRED_MUMMY_JUMPS_N2 &&
                        this._mummyJumpsN3 >= Chamber9Puzzle.REQUIRED_MUMMY_JUMPS_N3) {
                        this.triggerMummyPetrification(mummies);
                    } else {
                        this.pendingNotifications.push({
                            text: `👣 ¡SALTO SOBRE MOMIA! (Total: ${this._totalMummyJumps})`,
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
        this._petrifyTimerFrames = Chamber9Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false;
        }

        this.pendingNotifications.push({
            text: '🗿 ¡MOMIAS PETRIFICADAS! GEMA SAGRADA DEL OJO DE HORUS +1000 PTS',
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
        this._keyCollectedFirst = false;
        this._hasKey = false;
        this._initialTreasuresCollected = 0;
        this._totalMummyJumps = 0;
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

