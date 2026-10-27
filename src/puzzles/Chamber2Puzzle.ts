import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 2 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 2,
 * siguiendo con máxima fidelidad la referencia canónica en C# (RetroGamePiramid / PuzzleManager.cs)
 * y garantizando cero allocations en el bucle continuo (60 FPS).
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "SECUENCIA ESTRICTA DEL FARAÓN" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve? (Fiel a RetroGamePiramid / PuzzleManager.cs):
 * 1. PASO 1 (Tesoro Nivel 0 Primero): El arqueólogo debe abrir la pared movediza del Nivel 0
 *    y saquear el tesoro de la bóveda inferior (17, 13) ANTES de tocar o recoger la llave.
 *    (Si toma la llave antes de recoger este cofre, la secuencia estricta se rompe).
 * 2. PASO 2 (Llave Ancestral Segundo): Con el cofre de Nivel 0 ya recogido, el jugador sube
 *    al Nivel 1 y salta sobre el foso (col 12) para capturar la Llave Ancestral en (12, 8).
 * 3. PASO 3 (Salto sobre Momia de Nivel 1): Tras poseer el cofre y la llave, debe saltar
 *    al menos una (1) vez limpiamente sobre la momia patrullera del Nivel 1.
 * 4. PASO 4 (Doble Ciclo de Puerta): Habiendo cumplido estrictamente los pasos 1, 2 y 3,
 *    el jugador regresa al Nivel 0 y acciona la pared movediza (ch2_wall1) dos (2) veces
 *    consecutivas (2 ciclos de apertura).
 * 5. RECOMPENSA: Al completar el segundo ciclo, reaparece el Tesoro Secreto del Faraón en (17, 13)
 *    otorgando +1000 PUNTOS adicionales al ser saqueado nuevamente.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 0:
 *    [COFRE N0] -> [LLAVE] -> [SALTO MOMIA] -> [II PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "LA DOBLE FASE DE LAS MOMIAS GUARDIANAS" (2 Saltos Nivel 1 + 2 Saltos Nivel 2)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve? (Fiel a RetroGamePiramid / PuzzleManager.cs):
 * 1. FASE 1: Con la momia de Nivel 1 activa, el jugador debe saltar sobre ella dos (2) veces
 *    en la plataforma de Nivel 1.
 * 2. FASE 2: Luego, debe saltar dos (2) veces sobre la momia de la plataforma superior de Nivel 2.
 * 3. RECOMPENSA: Al acumular los 4 saltos (2 en Nivel 1 y 2 en Nivel 2):
 *    - Ambas momias se petrifican temporalmente en estatuas doradas durante 5 segundos (300 frames).
 *    - En el descansillo central del Nivel 1 (12, 8) brota la radiante GEMA SAGRADA (+1000 PUNTOS).
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 2:
 *    [SALTO 2x MOMIA N1] + [SALTO 2x MOMIA N2] -> [MOMIA PETRIFICADA] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber2Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 2;
    public static readonly REQUIRED_DOOR_CYCLES = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N1 = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 2;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Secuencia Estricta (Nivel 0)
    // Etapas:
    // 0: Estado inicial.
    // 1: Tesoro de Nivel 0 recogido antes de la llave.
    // 2: Llave recogida después del tesoro de Nivel 0.
    // 3: Salto sobre la momia de Nivel 1 completado. (Listo para ciclos de puerta).
    // -1: Secuencia fallida (ej. recogió la llave antes del tesoro de Nivel 0).
    private _puzzle1Stage: number = 0;
    private _hasKey: boolean = false;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: Doble Fase de Saltos (N1 + N2)
    private _mummyJumpsN1: number = 0;
    private _mummyJumpsN2: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Descansillo Nivel 1: col 12, row 8)
    public readonly gemGridX: number = 12;
    public readonly gemGridY: number = 8;
    public readonly gemValue: number = 1000;

    // Cola de eventos ligeros para notificar a la escena (cero allocations en pooling)
    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch2_secret_pharaoh_treasure');
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
     * Notificación cuando el jugador recolecta un cofre de la recámara.
     */
    public notifyTreasureCollected(treasureId?: string): void {
        const isNivel0Treasure = !treasureId || treasureId.includes('ch2_t1') || treasureId.includes('17_13');

        // Paso 1 de Secuencia Estricta: el tesoro de Nivel 0 debe recogerse ANTES de tomar la llave
        if (isNivel0Treasure && this._puzzle1Stage === 0) {
            if (!this._hasKey) {
                this._puzzle1Stage = 1;
                this.pendingNotifications.push({
                    text: '📜 ¡SECUENCIA RÚNICA INICIADA! (Paso 1/3: Tesoro N0)',
                    points: 0,
                    x: 17 * GameConstants.TILE_SIZE + 16,
                    y: 13 * GameConstants.TILE_SIZE - 20
                });
            } else {
                this._puzzle1Stage = -1; // Secuencia invalidada por haber recogido la llave antes
            }
        }
    }

    /**
     * Notificación cuando el jugador recolecta la llave sagrada.
     */
    public notifyKeyCollected(): void {
        this._hasKey = true;

        // Paso 2: Si ya recogió el tesoro de Nivel 0, avanza a etapa 2
        if (this._puzzle1Stage === 1) {
            this._puzzle1Stage = 2;
            this.pendingNotifications.push({
                text: '📜 ¡SECUENCIA RÚNICA! (Paso 2/3: Llave Obtenida)',
                points: 0,
                x: this.gemPixelX + 16,
                y: this.gemPixelY - 20
            });
        } else if (this._puzzle1Stage === 0) {
            // Se tomó la llave antes del tesoro de Nivel 0 -> falla la secuencia estricta
            this._puzzle1Stage = -1;
        }
    }

    /**
     * Notificación cuando la pared movediza del Nivel 0 se activa.
     */
    public notifyWallActivated(wallId: string): void {
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        // Requiere haber completado la secuencia estricta (Etapa 3)
        if (this._puzzle1Stage === 3 && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber2Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber2Puzzle.REQUIRED_DOOR_CYCLES})`,
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
                        // Paso 3 de Puzle 1: Registrar salto sobre momia de N1 si la etapa es 2
                        if (this._puzzle1Stage === 2) {
                            this._puzzle1Stage = 3;
                            this.pendingNotifications.push({
                                text: '📜 ¡SECUENCIA RÚNICA! (Paso 3/3: Salto Momia N1)',
                                points: 0,
                                x: mummy.x,
                                y: mummy.y - 36
                            });
                        }
                    } else {
                        this._mummyJumpsN2++;
                    }

                    // Puzle 2: Doble fase de saltos (2 saltos en N1 y 2 saltos en N2)
                    if (!this._isGemSpawned) {
                        if (this._mummyJumpsN1 >= Chamber2Puzzle.REQUIRED_MUMMY_JUMPS_N1 &&
                            this._mummyJumpsN2 >= Chamber2Puzzle.REQUIRED_MUMMY_JUMPS_N2) {
                            this.triggerMummyPetrification(mummies);
                        } else {
                            const currentPlatformName = isLevel1 ? 'Nivel 1' : 'Nivel 2';
                            const count = isLevel1 ? this._mummyJumpsN1 : this._mummyJumpsN2;
                            const target = isLevel1 ? Chamber2Puzzle.REQUIRED_MUMMY_JUMPS_N1 : Chamber2Puzzle.REQUIRED_MUMMY_JUMPS_N2;
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
        this._petrifyTimerFrames = Chamber2Puzzle.PETRIFY_DURATION_FRAMES;
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
        this._puzzle1Stage = 0;
        this._hasKey = false;
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
