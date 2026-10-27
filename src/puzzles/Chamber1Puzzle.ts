import { GameConstants } from '../core/GameConstants.ts';
import { Mummy } from '../entities/Mummy.ts';
import { Treasure } from '../entities/Treasure.ts';
import type { IChamberPuzzle, PuzzleEventNotification } from './IChamberPuzzle.ts';

export type { PuzzleEventNotification };

/**
 * =========================================================================================
 * 🏛️ SISTEMA DE PUZLES ANCESTRALES - RECÁMARA 1 (MonoGame / Phaser Retro Engine)
 * =========================================================================================
 * 
 * Este archivo implementa y gobierna la lógica de los puzles diegéticos de la Recámara 1,
 * siguiendo estrictamente las directrices retro y de cero allocations en el bucle continuo.
 * 
 * -----------------------------------------------------------------------------------------
 * 📜 GUÍA DE RESOLUCIÓN DE PUZLES (DESCRIPCIÓN PARA DESARROLLADORES Y DISEÑADORES):
 * -----------------------------------------------------------------------------------------
 * 
 * 🏺 PUZLE 1: "LA RECARGA SECRETA DEL TESORO DEL FARAÓN" (Nivel 0)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?
 * 1. PASO 1 (Prerrequisitos): El arqueólogo debe explorar la recámara y saquear los DOS (2)
 *    tesoros iniciales:
 *    - Tesoro 1 en la bóveda inferior del Nivel 0 (17, 13).
 *    - Tesoro 2 en la bóveda superior del Nivel 2 (2, 4).
 * 2. PASO 2 (Obtención de la Llave): El arqueólogo debe saltar sobre el abismo del Nivel 1 (col 11)
 *    y capturar la Llave Sagrada suspendida (11, 7).
 * 3. PASO 3 (Invocación Ancestral): Con ambos tesoros y la llave en su poder, el arqueólogo debe
 *    regresar al Nivel 0 y accionar el activador de la pared movediza del Nivel 0 tres (3) veces
 *    consecutivas (3 ciclos de apertura de la pared movediza).
 * 4. RECOMPENSA: Al completar el tercer ciclo, el sello del faraón responde con un estruendo
 *    sagrado: el cofre de la bóveda de Nivel 0 reaparece recargado con el Tesoro Secreto del Faraón
 *    otorgando +1000 PUNTOS adicionales al ser saqueado nuevamente.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 0:
 *    [COFRE] + [COFRE] + [LLAVE] -> [III PUERTAS] -> [COFRE RADIANTE ☥]
 * 
 * -----------------------------------------------------------------------------------------
 * 🧟 PUZLE 2: "EL DOMINIO DE LA MOMIA GUARDIANA" (Salto Cuádruple IIII)
 * -----------------------------------------------------------------------------------------
 * ¿Cómo se resuelve?
 * 1. PASO 1 (Desafío de Habilidad): El jugador debe enfrentar a la momia patrullera de la recámara
 *    y saltar limpiamente sobre ella cuatro (4) veces consecutivas sin recibir daño alguno.
 * 2. PASO 2 (Sincronización): Cada salto debe sobrevolar a la momia aprovechando la altura arcade
 *    calibrada de 56 px. El sistema registra cada salto exitoso cuando los pies del jugador superan
 *    la cabeza de la momia en el eje horizontal de colisión.
 * 3. RECOMPENSA: Al completar el 4.º salto consecutivo:
 *    - La momia sufre una purga sagrada y queda PETRIFICADA temporalmente (inmóvil como estatua
 *      dorada durante 5 segundos / 300 frames), permitiendo caminar a su lado sin perder vidas.
 *    - En el descansillo intermedio del Nivel 1 (12, 8) se materializa la GEMA SAGRADA DE RA,
 *      un tesoro radiante que otorga +1000 PUNTOS al ser recolectado.
 * PISTA DIEGÉTICA: Grabada en el mural de bajorrelieve del Nivel 2 (pared superior sobre la patrulla de la momia):
 *    [SALTO PARABÓLICO 4x SOBRE LA MOMIA (IIII)] -> [MOMIA PETRIFICADA] -> [GEMA SAGRADA ☥]
 * =========================================================================================
 */
export class Chamber1Puzzle implements IChamberPuzzle {
    public readonly chamberNumber: number = 1;
    public static readonly REQUIRED_DOOR_CYCLES = 3;
    public static readonly REQUIRED_MUMMY_JUMPS = 4;
    public static readonly PETRIFY_DURATION_FRAMES = 5 * GameConstants.TARGET_FPS; // 300 frames (5s)

    // Estado Puzle 1: Recarga Secreta de Tesoro (Nivel 0)
    private _initialTreasuresCollected: number = 0;
    private _hasKey: boolean = false;
    private _doorCycleCount: number = 0;
    private _isSecretTreasureSpawned: boolean = false;
    private _isSecretTreasureCollected: boolean = false;
    public readonly secretTreasure: Treasure;

    // Estado Puzle 2: Salto sobre Momia (Nivel 1)
    private _mummyJumpCount: number = 0;
    private _isMummyPetrified: boolean = false;
    private _petrifyTimerFrames: number = 0;
    private _isGemSpawned: boolean = false;
    private _isGemCollected: boolean = false;
    private _hasJumpedCurrentAirborne: boolean = false;

    // Coordenadas de la Gema Sagrada (Descansillo Nivel 1: x=12, y=8)
    public readonly gemGridX: number = 12;
    public readonly gemGridY: number = 8;
    public readonly gemValue: number = 1000;

    // Cola de eventos ligeros para notificar a la escena (cero allocations en pooling)
    private pendingNotifications: PuzzleEventNotification[] = [];

    constructor() {
        // El tesoro secreto reaparece en la misma bóveda protegida del Nivel 0 (17, 13)
        this.secretTreasure = new Treasure(17, 13, 1000, 'ch1_secret_pharaoh_treasure');
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

    public get mummyJumpCount(): number {
        return this._mummyJumpCount;
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
     * Notificación cuando el jugador recolecta un tesoro de la recámara.
     */
    public notifyTreasureCollected(): void {
        this._initialTreasuresCollected++;
    }

    /**
     * Notificación cuando el jugador recolecta la llave sagrada.
     */
    public notifyKeyCollected(): void {
        this._hasKey = true;
    }

    /**
     * Notificación cuando la pared movediza del Nivel 0 se activa.
     * Avanza el contador de ciclos si se cumplen los prerrequisitos (2 tesoros + llave).
     */
    public notifyWallActivated(wallId: string): void {
        // Solo cuenta la pared movediza de la bóveda inferior del Nivel 0
        if (!wallId.includes('wall1') && !wallId.includes('15_13')) {
            return;
        }

        // Prerrequisitos de Puzle 1: Ambos tesoros iniciales y la llave sagrada
        if (this._initialTreasuresCollected >= 2 && this._hasKey && !this._isSecretTreasureSpawned) {
            this._doorCycleCount++;

            if (this._doorCycleCount >= Chamber1Puzzle.REQUIRED_DOOR_CYCLES) {
                this.triggerSecretTreasureSpawn();
            } else {
                this.pendingNotifications.push({
                    text: `⚙️ ¡ENGRANAJE RÚNICO! (${this._doorCycleCount}/${Chamber1Puzzle.REQUIRED_DOOR_CYCLES})`,
                    points: 0,
                    x: 15 * GameConstants.TILE_SIZE + 16,
                    y: 13 * GameConstants.TILE_SIZE - 20
                });
            }
        }
    }

    /**
     * Materializa el tesoro secreto recargado del Faraón en la bóveda de Nivel 0.
     */
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

    /**
     * Intenta recolectar el tesoro secreto recargado si el jugador está sobre él.
     */
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

    /**
     * Intenta recolectar la Gema Sagrada de Ra revelada por el Puzle de la Momia.
     */
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
     * Monitorea saltos limpios sobre la momia y temporizadores de petrificación.
     */
    public update(
        playerCenterX: number,
        playerFeetY: number,
        isJumping: boolean,
        mummies: readonly Mummy[]
    ): void {
        // 1. Manejo del temporizador de petrificación de la momia
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

        // 2. Control de salto limpio sobre momias (Puzle 2)
        if (!isJumping) {
            this._hasJumpedCurrentAirborne = false;
            return;
        }

        // Si ya computó el salto en este vuelo, no recontar
        if (this._hasJumpedCurrentAirborne) {
            return;
        }

        // Si la momia ya está petrificada y la gema ya brotó, no es necesario seguir contando
        if (this._isGemSpawned) {
            return;
        }

        for (const mummy of mummies) {
            if (!mummy.isActive) continue;

            const horizDistance = Math.abs(playerCenterX - mummy.x);
            // El jugador debe estar alineado horizontalmente con la momia
            if (horizDistance <= 24) {
                // Y sus pies deben estar por encima del torso/cabeza de la momia (vuelo limpio)
                const isOverhead = playerFeetY <= mummy.y - 12;
                if (isOverhead) {
                    this._hasJumpedCurrentAirborne = true;
                    this._mummyJumpCount++;

                    if (this._mummyJumpCount >= Chamber1Puzzle.REQUIRED_MUMMY_JUMPS) {
                        this.triggerMummyPetrification(mummies);
                    } else {
                        this.pendingNotifications.push({
                            text: `👣 ¡SALTO SOBRE MOMIA! (${this._mummyJumpCount}/${Chamber1Puzzle.REQUIRED_MUMMY_JUMPS})`,
                            points: 0,
                            x: mummy.x,
                            y: mummy.y - 36
                        });
                    }
                    break;
                }
            }
        }
    }

    /**
     * Desencadena la petrificación de la momia y materializa la Gema Sagrada en Nivel 1.
     */
    private triggerMummyPetrification(mummies: readonly Mummy[]): void {
        this._isMummyPetrified = true;
        this._petrifyTimerFrames = Chamber1Puzzle.PETRIFY_DURATION_FRAMES;
        this._isGemSpawned = true;

        for (const m of mummies) {
            m.isActive = false; // Detiene movimiento y daño letal mientras dure la petrificación
        }

        this.pendingNotifications.push({
            text: '🗿 ¡MOMIA PETRIFICADA! GEMA SAGRADA REVELADA +1000 PTS',
            points: 0,
            x: this.gemPixelX + 16,
            y: this.gemPixelY - 20
        });
    }

    /**
     * Extrae las notificaciones pendientes generadas por los eventos de puzle.
     */
    public consumePendingNotifications(): PuzzleEventNotification[] {
        if (this.pendingNotifications.length === 0) return [];
        const copy = [...this.pendingNotifications];
        this.pendingNotifications.length = 0;
        return copy;
    }

    /**
     * Restablece el sistema de puzles a su estado inicial de recámara.
     */
    public reset(): void {
        this._initialTreasuresCollected = 0;
        this._hasKey = false;
        this._doorCycleCount = 0;
        this._isSecretTreasureSpawned = false;
        this._isSecretTreasureCollected = false;
        this.secretTreasure.reset();

        this._mummyJumpCount = 0;
        this._isMummyPetrified = false;
        this._petrifyTimerFrames = 0;
        this._isGemSpawned = false;
        this._isGemCollected = false;
        this._hasJumpedCurrentAirborne = false;
        this.pendingNotifications.length = 0;
    }
}

