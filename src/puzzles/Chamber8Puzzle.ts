import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 8 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 8
 * (Santuario de las Cinco Plataformas en el Nivel 3 de la pirámide).
 * Garantiza cero allocations en el bucle continuo (60 FPS) y máxima fidelidad retro.
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "LA ASCENSIÓN TOTAL Y CICLO ÚNICO DE LA CÚSPIDE" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Exploración en las 5 Alturas): El arqueólogo debe recorrer la gran estructura:
 *    - Saquear el cofre base del Nivel 0 en (17, 13).
 *    - Saquear el cofre base del Nivel 2 en (17, 7).
 *    - Capturar en pleno salto la Llave Ancestral en Nivel 1 (12, 9).
 *    - Escalar hasta el Nivel 3 y ejecutar al menos un (1) salto limpio sobre la momia superior.
 * 2. PASO 2 (Ciclo Único de Conclusión): Tras haber completado la ascensión total, regresar
 *    al Suelo Base (Nivel 0) y accionar la pared movediza (ch8_wall1) una (1) sola vez.
 * 3. RECOMPENSA: Al completar el ciclo único, el cofre de la bóveda inferior se recarga de
 *    inmediato con el Tesoro Secreto del Faraón otorgando +1000 PUNTOS adicionales.
 * PISTA DIEGÉTICA (Mural Nivel 0):
 *    [ASCENSIÓN COMPLETA (2 COFRES + LLAVE + N3)] -> [I PUERTA] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL DUELO DE LAS GUARDIANAS SAGRADAS" (2 Saltos N2 + 2 Saltos N3)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?:
 * 1. PASO 1 (Acrobacia en Altura Abierta): Dos momias patrullan plataformas con 128px de espacio libre:
 *    - Ejecutar dos (2) saltos limpios sobre la momia de Nivel 2 (cols 2..7, 128px de altura libre).
 *    - Ejecutar dos (2) saltos limpios sobre la momia de Nivel 3 (cols 9..16, 128px de altura libre).
 * 2. RECOMPENSA: Al cumplir la combinación (2 en N2 + 2 en N3):
 *    - Ambas momias se petrifican en estatuas doradas durante 5 segundos (300 frames).
 *    - En el descansillo de Nivel 1 en (12, 9) se materializa la radiante GEMA SAGRADA DE ISIS (+1000 PTS).
 * PISTA DIEGÉTICA (Mural Nivel 2):
 *    [SALTO 2x N2] + [SALTO 2x N3] -> [MOMIAS PETRIFICADAS] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber8Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 8;
    public static readonly REQUIRED_DOOR_CYCLES = 1;
    public static readonly REQUIRED_MUMMY_JUMPS_N1 = 0; // Deprecado, reemplazado por espacio abierto N2/N3
    public static readonly REQUIRED_MUMMY_JUMPS_N2 = 2;
    public static readonly REQUIRED_MUMMY_JUMPS_N3 = 2;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Ascensión Total + 1 Ciclo
    private _initialTreasuresCollected: number = 0;
    private _hasKey: boolean = false;
    private _hasJumpedN3ForPrereq: boolean = false;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: 2 N2 + 2 N3
    private _mummyJumpsN1: number = 0;
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
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch8_secret_pharaoh_treasure');
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

        const arePrerequisitesMet =
            this._initialTreasuresCollected >= 2 &&
            this._hasKey &&
            this._hasJumpedN3ForPrereq;

        if (arePrerequisitesMet && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber8Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber8Puzzle.REQUIRED_DOOR_CYCLES})`,
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

                // Clasificación de la momia por altura:
                // Nivel 2: y >= 200 (fila 8 = 256, cols 2..7 con 128px de altura libre)
                // Nivel 3: y < 200 (fila 5 = 160, cols 9..16 con 128px de altura libre)
                const isLevel2 = mummy.y >= 200;
                if (isLevel2) {
                    this._mummyJumpsN2++;
                } else {
                    this._mummyJumpsN3++;
                    this._hasJumpedN3ForPrereq = true;
                }

                if (!this._isGemSpawned) {
                    if (this._mummyJumpsN2 >= Chamber8Puzzle.REQUIRED_MUMMY_JUMPS_N2 &&
                        this._mummyJumpsN3 >= Chamber8Puzzle.REQUIRED_MUMMY_JUMPS_N3) {
                        this.triggerMummyPetrification(mummies);
                    } else {
                        const platformLabel = isLevel2 ? 'Nivel 2' : 'Nivel 3';
                        const count = isLevel2 ? this._mummyJumpsN2 : this._mummyJumpsN3;
                        const target = isLevel2 ? Chamber8Puzzle.REQUIRED_MUMMY_JUMPS_N2 : Chamber8Puzzle.REQUIRED_MUMMY_JUMPS_N3;
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
        this._petrifyTimerFrames = Chamber8Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false;
        }

        this.pendingNotifications.push({
            text: '🗿 ¡TRÍADA DE MOMIAS PETRIFICADA! GEMA SAGRADA DE ISIS +1000 PTS',
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
        this._doorCycleCount = 0;
        this._isSecretTreasureSpawned = false;
        this._isSecretTreasureCollected = false;
        this.secretTreasure.reset();

        this._mummyJumpsN1 = 0;
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

