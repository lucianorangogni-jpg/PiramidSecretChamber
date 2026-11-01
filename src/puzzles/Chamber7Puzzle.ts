import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 7 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 7
 * (Cripta del Viento Sagrado y el Ojo de Horus).
 * Garantiza cero allocations en el bucle continuo (60 FPS) y máxima fidelidad retro.
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "LA PURIFICACIÓN DE LA LLAVE Y QUÍNTUPLE ENGRANAJE" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Purificación de la Llave y los Guardianes): El jugador debe capturar la Llave
 *    Ancestral en Nivel 1 (11, 9) y ejecutar al menos un (1) salto limpio sobre la momia de Nivel 3
 *    y al menos un (1) salto limpio sobre la momia de Nivel 2.
 * 2. PASO 2 (Saqueo Sagrado): Habiendo completado los saltos y la llave, saquear ambos cofres base:
 *    - Tesoro de Nivel 0 en (17, 13).
 *    - Tesoro de Nivel 2 en (17, 7).
 * 3. PASO 3 (Quíntuple Engranaje): Accionar la pared movediza del Nivel 0 (ch7_wall1) cinco (5)
 *    veces completas (5 ciclos de apertura).
 * 4. RECOMPENSA: Al completar el quinto ciclo, el cofre de la bóveda inferior reaparece recargado
 *    con el Tesoro Secreto del Faraón otorgando +1000 PUNTOS adicionales.
 * PISTA DIEGÉTICA (Mural Nivel 0):
 *    [LLAVE + SALTO N3 + SALTO N2] -> [V PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL SALTO SINCRONIZADO DE LAS ALTURAS" (2 Saltos N3 + 3 Saltos N2)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Desafío Veloz): La momia guardiana de Nivel 2 patrulla a mayor velocidad (1.2 px/frame).
 *    El arqueólogo debe realizar:
 *    - Dos (2) saltos limpios sobre la momia de Nivel 3 (plataforma superior con 96px de espacio vertical).
 *    - Tres (3) saltos limpios sobre la veloz momia de Nivel 2 (con 96px de espacio vertical).
 * 2. RECOMPENSA: Al acumular los 5 saltos sincronizados (2 en N3 y 3 en N2):
 *    - Ambas momias se petrifican en estatuas doradas durante 5 segundos (300 frames).
 *    - En el descansillo de Nivel 1 en (11, 9) se materializa la radiante GEMA SAGRADA DE HORUS (+1000 PTS).
 * PISTA DIEGÉTICA (Mural Nivel 2):
 *    [SALTO 2x N3] + [SALTO 3x N2] -> [MOMIAS PETRIFICADAS] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber7Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 7;
    public static readonly REQUIRED_DOOR_CYCLES = 5;
    public static readonly REQUIRED_MUMMY_JUMPS_N3 = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N1 = 2; // Alias para compatibilidad
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 3;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Llave + Saltos de Purificación + 2 Cofres + 5 Ciclos
    private _initialTreasuresCollected: number = 0;
    private _hasKey: boolean = false;
    private _hasJumpedN3ForPrereq: boolean = false;
    private _hasJumpedN2ForPrereq: boolean = false;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 2 Saltos N3 + 3 Saltos N2
    private _mummyJumpsN3: number = 0;
    private _mummyJumpsN2: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Descansillo Nivel 1: col 11, row 9)
    public readonly gemGridX: number = 11;
    public readonly gemGridY: number = 9;
    public readonly gemValue: number = 1000;

    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch7_secret_pharaoh_treasure');
    }

    public get initialTreasuresCollected(): number {
        return this._initialTreasuresCollected;
    }

    public get hasKey(): boolean {
        return this._hasKey;
    }

    public get hasJumpedN3ForPrereq(): boolean {
        return this._hasJumpedN3ForPrereq;
    }

    /** @deprecated Alias para compatibilidad hacia atrás */
    public get hasJumpedN1ForPrereq(): boolean {
        return this._hasJumpedN3ForPrereq;
    }

    public get hasJumpedN2ForPrereq(): boolean {
        return this._hasJumpedN2ForPrereq;
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

    /** @deprecated Alias para compatibilidad hacia atrás */
    public get mummyJumpsN1(): number {
        return this._mummyJumpsN3;
    }

    public get mummyJumpsN2(): number {
        return this._mummyJumpsN2;
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

        const arePrerequisitesMet =
            this._hasKey &&
            this._hasJumpedN3ForPrereq &&
            this._hasJumpedN2ForPrereq &&
            this._initialTreasuresCollected >= 2;

        if (arePrerequisitesMet && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber7Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber7Puzzle.REQUIRED_DOOR_CYCLES})`,
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

                const isLevel3 = mummy.y <= 160;
                if (isLevel3) {
                    this._mummyJumpsN3++;
                    this._hasJumpedN3ForPrereq = true;
                } else {
                    this._mummyJumpsN2++;
                    this._hasJumpedN2ForPrereq = true;
                }

                if (!this._isGemSpawned) {
                    if (this._mummyJumpsN3 >= Chamber7Puzzle.REQUIRED_MUMMY_JUMPS_N3 &&
                        this._mummyJumpsN2 >= Chamber7Puzzle.REQUIRED_MUMMY_JUMPS_N2) {
                        this.triggerMummyPetrification(mummies);
                    } else {
                        const platformLabel = isLevel3 ? 'Nivel 3' : 'Nivel 2 (Rápida)';
                        const count = isLevel3 ? this._mummyJumpsN3 : this._mummyJumpsN2;
                        const target = isLevel3 ? Chamber7Puzzle.REQUIRED_MUMMY_JUMPS_N3 : Chamber7Puzzle.REQUIRED_MUMMY_JUMPS_N2;
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
        this._petrifyTimerFrames = Chamber7Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false;
        }

        this.pendingNotifications.push({
            text: '🗿 ¡MOMIAS PETRIFICADAS! GEMA SAGRADA DE HORUS +1000 PTS',
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
        this._hasJumpedN3ForPrereq = false;
        this._hasJumpedN2ForPrereq = false;
        this._doorCycleCount = 0;
        this._isSecretTreasureSpawned = false;
        this._isSecretTreasureCollected = false;
        this.secretTreasure.reset();

        this._mummyJumpsN3 = 0;
        this._mummyJumpsN2 = 0;
        this._isMummyPetrified = false;
        this._petrifyTimerFrames = 0;
        this._isGemSpawned = false;
        this._isGemCollected = false;
        this._hasJumpedCurrentAirborne = false;
        this.pendingNotifications.length = 0;
    }
}

