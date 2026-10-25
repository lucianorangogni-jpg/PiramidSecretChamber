import { Direction } from '../core/Direction.ts';
import { Mummy } from '../entities/Mummy.ts';
import { MummyConstants } from '../entities/MummyConstants.ts';

export interface MummySpawnConfig {
    readonly chamber: number;
    readonly mummies: readonly {
        readonly x: number;
        readonly y: number;
        readonly minX: number;
        readonly maxX: number;
        readonly direction?: Direction;
        readonly speed?: number;
    }[];
}

/**
 * Catálogo centralizado de patrullas de momias para cada recámara de la pirámide.
 * Define puntos de spawn, cotas horizontales y dirección inicial de patrulla.
 */
export class ChamberMummies {
    private static readonly CONFIGS: readonly MummySpawnConfig[] = [
        {
            chamber: 1,
            mummies: [
                {
                    x: 384, // Columna 12
                    y: 160, // Plataforma Nivel 2 (fila 5 = 160 px)
                    minX: 112, // Columna 3.5
                    maxX: 464, // Columna 14.5
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 2,
            mummies: [
                {
                    x: 400, // Columna 12.5
                    y: 192, // Plataforma Nivel 2 (fila 6 = 192 px)
                    minX: 144, // Columna 4.5
                    maxX: 528, // Columna 16.5
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 3,
            mummies: [
                {
                    x: 350,
                    y: 160,
                    minX: 112,
                    maxX: 464,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 4,
            mummies: [
                {
                    x: 320,
                    y: 192,
                    minX: 176,
                    maxX: 528,
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 5,
            mummies: [
                {
                    x: 350,
                    y: 256,
                    minX: 112,
                    maxX: 528,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 6,
            mummies: [
                {
                    x: 320,
                    y: 256,
                    minX: 112,
                    maxX: 496,
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 7,
            mummies: [
                {
                    x: 320,
                    y: 256,
                    minX: 112,
                    maxX: 496,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 8,
            mummies: [
                {
                    x: 320,
                    y: 256,
                    minX: 80,
                    maxX: 528,
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 9,
            mummies: [
                {
                    x: 320,
                    y: 256,
                    minX: 80,
                    maxX: 528,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 10,
            mummies: [
                {
                    x: 320,
                    y: 160,
                    minX: 112,
                    maxX: 464,
                    direction: Direction.Right
                }
            ]
        }
    ];

    /**
     * Instancia nuevas momias para la recámara solicitada (1 a 10).
     */
    public static createMummiesForChamber(chamberNumber: number): Mummy[] {
        const config = this.CONFIGS.find((c) => c.chamber === chamberNumber);
        if (!config) {
            return [
                new Mummy(
                    384,
                    160,
                    112,
                    464,
                    Direction.Right,
                    `ch${chamberNumber}_m1`,
                    MummyConstants.WALK_SPEED
                )
            ];
        }

        return config.mummies.map(
            (m, index) =>
                new Mummy(
                    m.x,
                    m.y,
                    m.minX,
                    m.maxX,
                    m.direction ?? Direction.Right,
                    `ch${chamberNumber}_m${index + 1}`,
                    m.speed ?? MummyConstants.WALK_SPEED
                )
        );
    }
}

