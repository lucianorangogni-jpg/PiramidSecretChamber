import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 3 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 3,
 * siguiendo con máxima fidelidad la referencia canónica en C# (RetroGamePiramid / PuzzleManager.cs)
 * y garantizando cero allocations en el bucle continuo (60 FPS).
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "EL PROTOCOLO DE LA LLAVE PRIMERO Y CUÁDRUPLE CICLO" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve? (Fiel a RetroGamePiramid / PuzzleManager.cs):
 * 1. PASO 1 (Llave Primero Obligatoria): El arqueólogo debe capturar en pleno salto la
 *    Llave Ancestral suspendida en Nivel 1 (11, 7) ANTES de abrir o saquear cualquiera de los
 *    dos (2) cofres base (Nivel 0 en 17, 13 y Nivel 2 en 2, 4). Si toca un cofre antes de la llave,
 *    el sello del faraón se bloquea para esta partida.
 * 2. PASO 2 (Saqueo de los 2 Cofres): Habiendo obtenido primero la llave, el jugador procede a saquear
 *    los dos cofres base de la recámara (Nivel 0 en 17, 13 y Nivel 2 en 2, 4).
 * 3. PASO 3 (Cuádruple Ciclo de Puerta): Con la llave y ambos cofres recolectados en el orden correcto,
 *    el jugador regresa al Nivel 0 y acciona la pared movediza (ch3_wall1) cuatro (4) veces completas
 *    (4 ciclos de apertura con su activador).
 * 4. RECOMPENSA: Al completarse el 4.º ciclo de apertura, el cofre de la bóveda inferior (17, 13)
 *    reaparece recargado con el Tesoro Secreto del Faraón otorgando +1000 PUNTOS adicionales.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 0:
 *    [LLAVE 1.º] -> [COFRE + COFRE] -> [IIII PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL RITUAL ASIMÉTRICO DE LAS MOMIAS" (1 Salto Nivel 1 + 3 Saltos Nivel 2)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve? (Fiel a RetroGamePiramid / PuzzleManager.cs):
 * 1. PASO 1: Saltar una (1) vez limpiamente sobre la momia patrullera del Nivel 1.
 * 2. PASO 2: Saltar tres (3) veces limpiamente sobre la momia patrullera superior del Nivel 2.
 * 3. RECOMPENSA: Al alcanzar exactamente 1 salto en Nivel 1 y 3 saltos en Nivel 2:
 *    - Ambas momias se petrifican en estatuas doradas durante 5 segundos (300 frames).
 *    - Brota la radiante GEMA SAGRADA en el descansillo de Nivel 1 (11, 7) otorgando +1000 PUNTOS.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 2:
 *    [SALTO 1x MOMIA N1] + [SALTO 3x MOMIA N2] -> [MOMIA PETRIFICADA] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber3Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 3;
    public static readonly REQUIRED_DOOR_CYCLES = 4;
    public static readonly REQUIRED_MUMMY_JUMPS_N1 = 1;
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 3;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Llave Primero + 4 Ciclos (Nivel 0)
    private _keyCollectedFirst: boolean = false;
    private _hasKey: boolean = false;
    private _initialTreasuresCollected: number = 0;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 1 Salto N1 + 3 Saltos N2
    private _mummyJumpsN1: number = 0;
    private _mummyJumpsN2: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Descansillo Nivel 1: col 11, row 7)
    public readonly gemGridX: number = 11;
    public readonly gemGridY: number = 7;
    public readonly gemValue: number = 1000;

    // Cola de eventos ligeros para notificar a la escena (cero allocations en pooling)
    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch3_secret_pharaoh_treasure');
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

    public get doorCycleCount(): number {
        return this._doorCycleCount;
    }

    public get isSecretTreasureSpawned(): boolean {
        return this._isSecretTreasureSpawned;
    }

    public get isSecretTreasureCollected(): boolean {
        return this._isSecretTreasureCollected;
    }

    public get mummyJumpsN1(): number {
        return this._mummyJumpsN1;
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

    /**
     * Notificación cuando el jugador recolecta la llave sagrada.
     */
    public notifyKeyCollected(): void {
        this._hasKey = true;

        // Si aún no se recogió ningún cofre, la llave fue tomada en primer lugar (requisito cumplido)
        if (this._initialTreasuresCollected === 0) {
            this._keyCollectedFirst = true;
            this.pendingNotifications.push({
                text: '🗝️ ¡LLAVE ANCESTRAL PRIMERO! (Protocolo Faraónico Activo)',
                points: 0,
                x: this.gemPixelX + 16,
                y: this.gemPixelY - 20
            });
        } else {
            this._keyCollectedFirst = false;
        }
    }

    /**
     * Notificación cuando el jugador recolecta un cofre de la recámara.
     */
    public notifyTreasureCollected(_treasureId?: string): void {
        this._initialTreasuresCollected++;
    }

    /**
     * Notificación cuando la pared movediza del Nivel 0 se activa.
     */
    public notifyWallActivated(wallId: string): void {
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        // Requiere: Llave tomada primero + 2 cofres base recogidos
        const arePrerequisitesMet = this._keyCollectedFirst && this._hasKey && this._initialTreasuresCollected >= 2;

        if (arePrerequisitesMet && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber3Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber3Puzzle.REQUIRED_DOOR_CYCLES})`,
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

    /**
     * Actualización frame a frame de la lógica de puzles (cero allocations).
     */
    public update(
        playerCenterX: number,
        playerFeetY: number,
        isJumping: boolean,
        mummies: readonly Mummy[]
    ): void {
        // 1. Manejo del temporizador de petrificación
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

        // 2. Control de salto limpio sobre momias
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
            if (horizDistance <= 24) {
                const isOverhead = playerFeetY <= mummy.y - 12;
                if (isOverhead) {
                    this._hasJumpedCurrentAirborne = true;

                    // Determinar nivel de la momia: Nivel 1 (y >= 250) o Nivel 2 (y < 250)
                    const isLevel1 = mummy.y >= 250;

                    if (isLevel1) {
                        this._mummyJumpsN1++;
                    } else {
                        this._mummyJumpsN2++;
                    }

                    // Puzle 2: 1 salto en N1 y 3 saltos en N2
                    if (!this._isGemSpawned) {
                        if (this._mummyJumpsN1 >= Chamber3Puzzle.REQUIRED_MUMMY_JUMPS_N1 &&
                            this._mummyJumpsN2 >= Chamber3Puzzle.REQUIRED_MUMMY_JUMPS_N2) {
                            this.triggerMummyPetrification(mummies);
                        } else {
                            const currentPlatformName = isLevel1 ? 'Nivel 1' : 'Nivel 2';
                            const count = isLevel1 ? this._mummyJumpsN1 : this._mummyJumpsN2;
                            const target = isLevel1 ? Chamber3Puzzle.REQUIRED_MUMMY_JUMPS_N1 : Chamber3Puzzle.REQUIRED_MUMMY_JUMPS_N2;
                            this.pendingNotifications.push({
                                text: `👣 ¡SALTO SOBRE MOMIA (${currentPlatformName})! (${count}/${target})`,
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
    }

    private triggerMummyPetrification(mummies: readonly Mummy[]): void {
        this._isMummyPetrified = true;
        this._petrifyTimerFrames = Chamber3Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false;
        }

        this.pendingNotifications.push({
            text: '🗿 ¡MOMIAS PETRIFICADAS! GEMA SAGRADA REVELADA +1000 PTS',
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
        this._doorCycleCount = 0;
        this._isSecretTreasureSpawned = false;
        this._isSecretTreasureCollected = false;
        this.secretTreasure.reset();

        this._mummyJumpsN1 = 0;
        this._mummyJumpsN2 = 0;
        this._isMummyPetrified = false;
        this._petrifyTimerFrames = 0;
        this._isGemSpawned = false;
        this._isGemCollected = false;
        this._hasJumpedCurrentAirborne = false;
        this.pendingNotifications.length = 0;
    }
}
