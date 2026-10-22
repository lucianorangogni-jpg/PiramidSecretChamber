export const PlayerState = {
    Idle: 'Idle',
    Walking: 'Walking',
    Climbing: 'Climbing',
    Jumping: 'Jumping',
    Falling: 'Falling',
    Eliminated: 'Eliminated'
} as const;

export type PlayerState = typeof PlayerState[keyof typeof PlayerState];
