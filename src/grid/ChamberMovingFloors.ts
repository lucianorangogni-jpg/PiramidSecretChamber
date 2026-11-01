import { MovingFloorTrap, type MovingFloorConfig } from '../entities/MovingFloorTrap.ts';

export interface ChamberMovingFloorsConfig {
    readonly chamber: number;
    readonly floors: readonly MovingFloorConfig[];
}

/**
 * Catálogo maestro de Pisos Movedizos / Trampas de Desmoronamiento de la pirámide.
 * A partir de la Recámara 5 (y en adelante: 6, 7, 8, 9, 10), la plataforma del Nivel 1
 * cuenta con losas inestables que comienzan a temblar al pisarlas y colapsan tras ~1.3 segundos.
 * Si el jugador cruza sin detenerse, logra pasar a salvo.
 * Si se queda parado en el lugar, cae al Suelo Base (96 px de caída > 56 px máximo seguro),
 * sufriendo una caída letal y perdiendo una vida.
 */
export class ChamberMovingFloors {
    private static readonly CONFIGS: readonly ChamberMovingFloorsConfig[] = [
        {
            chamber: 5,
            floors: [
                {
                    chamber: 5,
                    row: 11,
                    minCol: 6,
                    maxCol: 7,
                    triggerDelayFrames: 75, // ~1.25 segundos para cruzar 2 baldosas
                    openDurationFrames: 180 // 3 segundos abierto
                }
            ]
        },
        {
            chamber: 6,
            floors: [
                {
                    chamber: 6,
                    row: 11,
                    minCol: 6,
                    maxCol: 8,
                    triggerDelayFrames: 80, // ~1.33 segundos para cruzar 3 baldosas
                    openDurationFrames: 180
                }
            ]
        },
        {
            chamber: 7,
            floors: [
                {
                    chamber: 7,
                    row: 11,
                    minCol: 6,
                    maxCol: 8,
                    triggerDelayFrames: 80, // ~1.33 segundos para cruzar 3 baldosas
                    openDurationFrames: 180
                }
            ]
        },
        {
            chamber: 8,
            floors: [
                {
                    chamber: 8,
                    row: 11,
                    minCol: 4,
                    maxCol: 5,
                    triggerDelayFrames: 75,
                    openDurationFrames: 180
                }
            ]
        },
        {
            chamber: 9,
            floors: [
                {
                    chamber: 9,
                    row: 11,
                    minCol: 7,
                    maxCol: 9,
                    triggerDelayFrames: 80,
                    openDurationFrames: 180
                }
            ]
        },
        {
            chamber: 10,
            floors: [
                {
                    chamber: 10,
                    row: 9, // Plataforma Nivel 1 en Recámara 10 está en fila 9
                    minCol: 7,
                    maxCol: 8,
                    triggerDelayFrames: 75,
                    openDurationFrames: 180
                }
            ]
        }
    ];

    /**
     * Obtiene las configuraciones de pisos movedizos para la recámara solicitada.
     */
    public static getConfigForChamber(chamber: number): readonly MovingFloorConfig[] {
        for (let i = 0; i < this.CONFIGS.length; i++) {
            if (this.CONFIGS[i].chamber === chamber) {
                return this.CONFIGS[i].floors;
            }
        }
        return [];
    }

    /**
     * Instancia las entidades MovingFloorTrap para la recámara dada.
     */
    public static createFloorsForChamber(chamber: number): MovingFloorTrap[] {
        const configs = this.getConfigForChamber(chamber);
        const floors: MovingFloorTrap[] = [];
        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];
            floors.push(
                new MovingFloorTrap(
                    cfg.chamber,
                    cfg.row,
                    cfg.minCol,
                    cfg.maxCol,
                    cfg.triggerDelayFrames,
                    cfg.openDurationFrames
                )
            );
        }
        return floors;
    }

    /**
     * Comprueba si una coordenada específica (col, row) de una recámara corresponde a un piso movedizo dinámico.
     * Utilizado para evitar pintar tiles estáticos superpuestos durante renderChamber.
     */
    public static isMovingFloorTile(chamber: number, col: number, row: number): boolean {
        const configs = this.getConfigForChamber(chamber);
        for (let i = 0; i < configs.length; i++) {
            const c = configs[i];
            if (c.row === row && col >= c.minCol && col <= c.maxCol) {
                return true;
            }
        }
        return false;
    }
}

