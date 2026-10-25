export const TreasureState = {
    Available: 'Available',
    Collected: 'Collected'
} as const;

export type TreasureState = typeof TreasureState[keyof typeof TreasureState];

