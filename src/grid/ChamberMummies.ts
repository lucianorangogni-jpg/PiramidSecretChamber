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
 * Define puntos de spawn, cotas horizontales y dirección inicial de patrulla respetando las paredes movedizas.
 */
export class ChamberMummies {
    private static readonly CONFIGS: readonly MummySpawnConfig[] = [
        {
            chamber: 1,
            mummies: [
                {
                    x: 350,
                    y: 160, // Plataforma Nivel 2
                    minX: 200, // Fuera de la bóveda (muro en col 4)
                    maxX: 464,
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 2,
            mummies: [
                {
                    x: 280,
                    y: 192, // Plataforma Nivel 2
                    minX: 144,
                    maxX: 400, // Fuera de la bóveda (muro en col 15)
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
                    minX: 200,
                    maxX: 464,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 4,
            mummies: [
                {
                    x: 280,
                    y: 192,
                    minX: 176,
                    maxX: 400,
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
                    minX: 200,
                    maxX: 528,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 6,
            mummies: [
                {
                    x: 280,
                    y: 256,
                    minX: 144,
                    maxX: 400,
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 7,
            mummies: [
                {
                    x: 350,
                    y: 256,
                    minX: 200,
                    maxX: 496,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 8,
            mummies: [
                {
                    x: 280,
                    y: 256,
                    minX: 144,
                    maxX: 400,
                    direction: Direction.Right
                }
            ]
        },
        {
            chamber: 9,
            mummies: [
                {
                    x: 280,
                    y: 256,
                    minX: 144,
                    maxX: 400,
                    direction: Direction.Left
                }
            ]
        },
        {
            chamber: 10,
            mummies: [
                {
                    x: 350,
                    y: 160,
                    minX: 200,
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
                    350,
                    160,
                    200,
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
