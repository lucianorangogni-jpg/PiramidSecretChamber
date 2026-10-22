export const TileType = {
    Empty: 0,
    SolidWall: 1,
    Ladder: 2,
    PressurePlate: 3,
    ExitDoor: 4
} as const;

export type TileType = typeof TileType[keyof typeof TileType];
