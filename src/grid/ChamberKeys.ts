import { Key } from '../entities/Key.ts';

export interface KeyConfig {
    readonly chamber: number;
    readonly gridX: number;
    readonly gridY: number;
    readonly ceilingGridY: number;
    readonly value?: number;
}

/**
 * Catálogo centralizado de Llaves Ancestrales por recámara.
 * Cada una de las 10 recámaras cuenta con una llave suspendida que debe ser
 * recolectada mediante un salto para desbloquear la puerta de salida (ExitDoor).
 */
export class ChamberKeys {
    private static readonly CONFIGS: readonly KeyConfig[] = [
        {
            chamber: 1,
            gridX: 11,
            gridY: 7,
            ceilingGridY: 5,
            value: 500
        },
        {
            chamber: 2,
            gridX: 12,
            gridY: 8,
            ceilingGridY: 6,
            value: 500
        },
        {
            chamber: 3,
            gridX: 11,
            gridY: 7,
            ceilingGridY: 5,
            value: 500
        },
        {
            chamber: 4,
            gridX: 11,
            gridY: 8,
            ceilingGridY: 6,
            value: 500
        },
        {
            chamber: 5,
            gridX: 6,
            gridY: 6,
            ceilingGridY: 4,
            value: 500
        },
        {
            chamber: 6,
            gridX: 12,
            gridY: 9,
            ceilingGridY: 8,
            value: 500
        },
        {
            chamber: 7,
            gridX: 11,
            gridY: 9,
            ceilingGridY: 8,
            value: 500
        },
        {
            chamber: 8,
            gridX: 12,
            gridY: 9,
            ceilingGridY: 8,
            value: 500
        },
        {
            chamber: 9,
            gridX: 12,
            gridY: 9,
            ceilingGridY: 8,
            value: 500
        },
        {
            chamber: 10,
            gridX: 11,
            gridY: 7,
            ceilingGridY: 5,
            value: 500
        }
    ];

    /**
     * Obtiene una nueva instancia de la llave para una recámara dada (1 a 10).
     */
    public static createKeyForChamber(chamberNumber: number): Key | null {
        const config = this.CONFIGS.find((c) => c.chamber === chamberNumber);
        if (!config) return null;

        return new Key(
            config.chamber,
            config.gridX,
            config.gridY,
            config.ceilingGridY,
            config.value ?? 500,
            `key_ch${chamberNumber}`
        );
    }

    /**
     * Comprueba si una recámara requiere llave para abrir su puerta de salida.
     */
    public static isKeyRequired(chamberNumber: number): boolean {
        return this.CONFIGS.some((c) => c.chamber === chamberNumber);
    }

    /**
     * Devuelve la configuración de la llave para una recámara dada.
     */
    public static getConfig(chamberNumber: number): KeyConfig | undefined {
        return this.CONFIGS.find((c) => c.chamber === chamberNumber);
    }
}
