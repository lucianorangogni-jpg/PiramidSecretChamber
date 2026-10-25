import { Treasure } from '../entities/Treasure.ts';

export interface TreasureSpawnConfig {
    readonly chamber: number;
    readonly treasures: readonly { readonly gridX: number; readonly gridY: number; readonly value?: number }[];
}

/**
 * Catálogo centralizado de cofres de tesoro para cada una de las 10 recámaras de la pirámide.
 * Garantiza que cada tesoro se ubique sobre una superficie transitable firme y sin interferir
 * con escaleras, muros impenetrables o puertas de salida.
 */
export class ChamberTreasures {
    private static readonly CONFIGS: readonly TreasureSpawnConfig[] = [
        {
            chamber: 1,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 8, gridY: 4, value: 1000 }    // Plataforma Superior Nivel 2
            ]
        },
        {
            chamber: 2,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 8, gridY: 5, value: 1000 }    // Plataforma Superior Nivel 2
            ]
        },
        {
            chamber: 3,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 12, gridY: 4, value: 1000 }   // Plataforma Superior Nivel 2
            ]
        },
        {
            chamber: 4,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 8, gridY: 5, value: 1000 }    // Plataforma Superior Nivel 2
            ]
        },
        {
            chamber: 5,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 14, gridY: 7, value: 1000 }   // Plataforma Nivel 2
            ]
        },
        {
            chamber: 6,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 14, gridY: 7, value: 1000 }   // Plataforma Nivel 2
            ]
        },
        {
            chamber: 7,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 14, gridY: 7, value: 1000 }   // Plataforma Nivel 2
            ]
        },
        {
            chamber: 8,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 15, gridY: 7, value: 1000 }   // Plataforma Nivel 2
            ]
        },
        {
            chamber: 9,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 14, gridY: 7, value: 1000 }   // Plataforma Nivel 2
            ]
        },
        {
            chamber: 10,
            treasures: [
                { gridX: 17, gridY: 13, value: 1000 }, // Suelo Base Nivel 0
                { gridX: 14, gridY: 4, value: 1000 }   // Plataforma Superior Nivel 2
            ]
        }
    ];

    /**
     * Obtiene instancias nuevas de tesoros para una recámara dada (1 a 10).
     */
    public static createTreasuresForChamber(chamberNumber: number): Treasure[] {
        const config = this.CONFIGS.find((c) => c.chamber === chamberNumber);
        if (!config) {
            // Fallback por defecto si no coincide
            return [
                new Treasure(17, 13, 1000, `ch${chamberNumber}_t1`),
                new Treasure(8, 4, 1000, `ch${chamberNumber}_t2`)
            ];
        }

        return config.treasures.map(
            (t, index) => new Treasure(t.gridX, t.gridY, t.value ?? 1000, `ch${chamberNumber}_t${index + 1}`)
        );
    }

    /**
     * Devuelve la configuración estática de tesoros para una recámara.
     */
    public static getConfig(chamberNumber: number): TreasureSpawnConfig | undefined {
        return this.CONFIGS.find((c) => c.chamber === chamberNumber);
    }
}

