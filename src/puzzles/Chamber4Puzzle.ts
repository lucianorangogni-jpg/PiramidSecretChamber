import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 4 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 4,
 * siguiendo con máxima fidelidad la referencia canónica en C# (RetroGamePiramid / PuzzleManager.cs)
 * y garantizando cero allocations en el bucle continuo (60 FPS).
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "ORDEN LIBRE CON DOBLE SALTO Y CICLO ÚNICO" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve? (Fiel a RetroGamePiramid / PuzzleManager.cs):
 * 1. PASO 1 (Prerrequisitos en cualquier orden): El arqueólogo puede completar en el orden
 *    que desee las siguientes cuatro condiciones:
 *    - Saquear el cofre base del Nivel 0 (17, 13).
 *    - Saquear el cofre base del Nivel 2 (17, 5).
 *    - Capturar en pleno salto la Llave Ancestral en Nivel 1 (11, 8).
 *    - Acumular al menos dos (2) saltos limpios sobre cualquier momia patrullera.
 * 2. PASO 2 (Ciclo Único de Puerta): Con los 4 requisitos previos cumplidos, el jugador acciona
 *    la pared movediza de la bóveda inferior (ch4_wall1) una (1) sola vez (1 ciclo de apertura).
 * 3. RECOMPENSA: Al completarse el ciclo, el cofre de Nivel 0 (17, 13) se recarga inmediatamente
 *    con el Tesoro Secreto del Faraón otorgando +1000 PUNTOS adicionales al ser saqueado.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 0:
 *    [2 COFRES + LLAVE + 2x SALTO MOMIA] -> [I PUERTA] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL DOMINIO INVERSO DE LAS MOMIAS" (3 Saltos Nivel 1 + 1 Salto Nivel 2)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve? (Fiel a RetroGamePiramid / PuzzleManager.cs):
 * 1. PASO 1: Realizar tres (3) saltos limpios sobre la momia patrullera del Nivel 1.
 * 2. PASO 2: Realizar un (1) salto limpio sobre la momia patrullera superior del Nivel 2.
 * 3. RECOMPENSA: Al alcanzar 3 saltos en Nivel 1 y 1 salto en Nivel 2:
 *    - Ambas momias se petrifican en estatuas doradas durante 5 segundos (300 frames).
 *    - Se materializa la GEMA SAGRADA en el descansillo de Nivel 1 (11, 8) por +1000 PUNTOS.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 2:
 *    [SALTO 3x MOMIA N1] + [SALTO 1x MOMIA N2] -> [MOMIA PETRIFICADA] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber4Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 4;
    public static readonly REQUIRED_DOOR_CYCLES = 1;
    public static readonly REQUIRED_PREREQ_MUMMY_JUMPS = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N1 = 3;
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 1;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Orden Libre + 1 Ciclo (Nivel 0)
    private _initialTreasuresCollected: number = 0;
    private _hasKey: boolean = false;
    private _totalMummyJumps: number = 0;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 3 Saltos N1 + 1 Salto N2
    private _mummyJumpsN1: number = 0;
    private _mummyJumpsN2: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Descansillo Nivel 1: col 11, row 8)
    public readonly gemGridX: number = 11;
    public readonly gemGridY: number = 8;
    public readonly gemValue: number = 1000;

    // Cola de eventos ligeros para notificar a la escena (cero allocations en pooling)
    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch4_secret_pharaoh_treasure');
    }

    public get initialTreasuresCollected(): number {
        return this._initialTreasuresCollected;
    }

    public get hasKey(): boolean {
        return this._hasKey;
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

    public notifyTreasureCollected(_treasureId?: string): void {
        this._initialTreasuresCollected++;
    }

    public notifyKeyCollected(): void {
        this._hasKey = true;
    }

    /**
     * Notificación cuando la pared movediza del Nivel 0 se activa.
     */
    public notifyWallActivated(wallId: string): void {
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        // Prerrequisitos de orden libre: 2 tesoros + llave + al menos 2 saltos sobre momias
        const arePrerequisitesMet =
            this._initialTreasuresCollected >= 2 &&
            this._hasKey &&
            this._totalMummyJumps >= Chamber4Puzzle.REQUIRED_PREREQ_MUMMY_JUMPS;

        if (arePrerequisitesMet && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber4Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber4Puzzle.REQUIRED_DOOR_CYCLES})`,
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
                    this._totalMummyJumps++;

                    // Determinar nivel de la momia: Nivel 1 (y >= 250) o Nivel 2 (y < 250)
                    const isLevel1 = mummy.y >= 250;

                    if (isLevel1) {
                        this._mummyJumpsN1++;
                    } else {
                        this._mummyJumpsN2++;
                    }

                    // Puzle 2: 3 saltos en N1 y 1 salto en N2
                    if (!this._isGemSpawned) {
                        if (this._mummyJumpsN1 >= Chamber4Puzzle.REQUIRED_MUMMY_JUMPS_N1 &&
                            this._mummyJumpsN2 >= Chamber4Puzzle.REQUIRED_MUMMY_JUMPS_N2) {
                            this.triggerMummyPetrification(mummies);
                        } else {
                            const currentPlatformName = isLevel1 ? 'Nivel 1' : 'Nivel 2';
                            const count = isLevel1 ? this._mummyJumpsN1 : this._mummyJumpsN2;
                            const target = isLevel1 ? Chamber4Puzzle.REQUIRED_MUMMY_JUMPS_N1 : Chamber4Puzzle.REQUIRED_MUMMY_JUMPS_N2;
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
        this._petrifyTimerFrames = Chamber4Puzzle.PETRIFY_DURATION_FRAMES;
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
        this._initialTreasuresCollected = 0;
        this._hasKey = false;
        this._totalMummyJumps = 0;
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
