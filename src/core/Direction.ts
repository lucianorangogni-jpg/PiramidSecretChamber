export const Direction = {
    None: 'None',
    Left: 'Left',
    Right: 'Right',
    Up: 'Up',
    Down: 'Down'
} as const;

export type Direction = typeof Direction[keyof typeof Direction];
