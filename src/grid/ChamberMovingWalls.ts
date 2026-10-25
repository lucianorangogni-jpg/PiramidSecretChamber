import { MovingWall, type TriggerPoint } from '../entities/MovingWall.ts';

export interface MovingWallConfig {
    readonly gridX: number;
    readonly gridY: number;
    readonly topGridY: number;
    readonly outerTrigger: TriggerPoint;
    readonly innerTrigger: TriggerPoint;
    readonly associatedTreasureId: string;
}

export interface ChamberMovingWallsConfig {
    readonly chamber: number;
    readonly walls: readonly MovingWallConfig[];
}

/**
 * Catálogo maestro de Paredes Movedizas y sus respectivos activadores de suelo
 * para cada una de las 10 recámaras de la pirámide.
 * Garantiza que cada tesoro cuente con una pared movediza vertical que llega hasta la plataforma superior
 * y dos activadores (exterior e interior) que abren la pared durante 5 segundos.
 */
export class ChamberMovingWalls {
    private static readonly CONFIGS: readonly ChamberMovingWallsConfig[] = [
        {
            chamber: 1,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 10,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch1_t1'
                },
                {
                    gridX: 4,
                    gridY: 4,
                    topGridY: 1,
                    outerTrigger: { gridX: 6, gridY: 4 },
                    innerTrigger: { gridX: 3, gridY: 4 },
                    associatedTreasureId: 'ch1_t2'
                }
            ]
        },
        {
            chamber: 2,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 11,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch2_t1'
                },
                {
                    gridX: 15,
                    gridY: 5,
                    topGridY: 1,
                    outerTrigger: { gridX: 14, gridY: 5 },
                    innerTrigger: { gridX: 16, gridY: 5 },
                    associatedTreasureId: 'ch2_t2'
                }
            ]
        },
        {
            chamber: 3,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 10,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch3_t1'
                },
                {
                    gridX: 4,
                    gridY: 4,
                    topGridY: 1,
                    outerTrigger: { gridX: 6, gridY: 4 },
                    innerTrigger: { gridX: 3, gridY: 4 },
                    associatedTreasureId: 'ch3_t2'
                }
            ]
        },
        {
            chamber: 4,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 11,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch4_t1'
                },
                {
                    gridX: 15,
                    gridY: 5,
                    topGridY: 1,
                    outerTrigger: { gridX: 14, gridY: 5 },
                    innerTrigger: { gridX: 16, gridY: 5 },
                    associatedTreasureId: 'ch4_t2'
                }
            ]
        },
        {
            chamber: 5,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 12,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch5_t1'
                },
                {
                    gridX: 15,
                    gridY: 7,
                    topGridY: 5,
                    outerTrigger: { gridX: 13, gridY: 7 },
                    innerTrigger: { gridX: 16, gridY: 7 },
                    associatedTreasureId: 'ch5_t2'
                }
            ]
        },
        {
            chamber: 6,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 12,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch6_t1'
                },
                {
                    gridX: 15,
                    gridY: 7,
                    topGridY: 5,
                    outerTrigger: { gridX: 13, gridY: 7 },
                    innerTrigger: { gridX: 16, gridY: 7 },
                    associatedTreasureId: 'ch6_t2'
                }
            ]
        },
        {
            chamber: 7,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 12,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch7_t1'
                },
                {
                    gridX: 15,
                    gridY: 7,
                    topGridY: 5,
                    outerTrigger: { gridX: 13, gridY: 7 },
                    innerTrigger: { gridX: 16, gridY: 7 },
                    associatedTreasureId: 'ch7_t2'
                }
            ]
        },
        {
            chamber: 8,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 12,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch8_t1'
                },
                {
                    gridX: 15,
                    gridY: 7,
                    topGridY: 6,
                    outerTrigger: { gridX: 13, gridY: 7 },
                    innerTrigger: { gridX: 16, gridY: 7 },
                    associatedTreasureId: 'ch8_t2'
                }
            ]
        },
        {
            chamber: 9,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 12,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch9_t1'
                },
                {
                    gridX: 15,
                    gridY: 7,
                    topGridY: 6,
                    outerTrigger: { gridX: 13, gridY: 7 },
                    innerTrigger: { gridX: 16, gridY: 7 },
                    associatedTreasureId: 'ch9_t2'
                }
            ]
        },
        {
            chamber: 10,
            walls: [
                {
                    gridX: 15,
                    gridY: 13,
                    topGridY: 10,
                    outerTrigger: { gridX: 13, gridY: 13 },
                    innerTrigger: { gridX: 16, gridY: 13 },
                    associatedTreasureId: 'ch10_t1'
                },
                {
                    gridX: 4,
                    gridY: 4,
                    topGridY: 1,
                    outerTrigger: { gridX: 6, gridY: 4 },
                    innerTrigger: { gridX: 3, gridY: 4 },
                    associatedTreasureId: 'ch10_t2'
                }
            ]
        }
    ];

    /**
     * Crea las instancias de paredes movedizas para la recámara indicada (1 a 10).
     */
    public static createWallsForChamber(chamberNumber: number): MovingWall[] {
        const config = this.CONFIGS.find((c) => c.chamber === chamberNumber);
        if (!config) {
            return [
                new MovingWall(
                    15,
                    13,
                    { gridX: 13, gridY: 13 },
                    { gridX: 16, gridY: 13 },
                    `ch${chamberNumber}_t1`,
                    `ch${chamberNumber}_wall1`,
                    10
                ),
                new MovingWall(
                    4,
                    4,
                    { gridX: 6, gridY: 4 },
                    { gridX: 3, gridY: 4 },
                    `ch${chamberNumber}_t2`,
                    `ch${chamberNumber}_wall2`,
                    1
                )
            ];
        }

        return config.walls.map(
            (w, index) =>
                new MovingWall(
                    w.gridX,
                    w.gridY,
                    w.outerTrigger,
                    w.innerTrigger,
                    w.associatedTreasureId,
                    `ch${chamberNumber}_wall${index + 1}`,
                    w.topGridY
                )
        );
    }
}
