import { GameConstants } from '../core/GameConstants.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';

export const TitleMenuOption = {
    NewGame: 0,
    Continue: 1,
    SelectChamber: 2,
    Controls: 3
} as const;

export type TitleMenuOption = typeof TitleMenuOption[keyof typeof TitleMenuOption];

/**
 * Modelo de estado desacoplado para el menú de inicio (fiel a TitleMenu.cs).
 * Totalmente testeable de forma independiente del ciclo de vida de Phaser.
 */
export class TitleMenuModel {
    public selectedOption: TitleMenuOption = TitleMenuOption.NewGame;
    public selectedChamber: number = 1;

    public get selectedPyramidLevel(): number {
        return RoomGrid.getPyramidLevel(this.selectedChamber);
    }

    public navigateUp(): void {
        switch (this.selectedOption) {
            case TitleMenuOption.NewGame:
                this.selectedOption = TitleMenuOption.Controls;
                break;
            case TitleMenuOption.Continue:
                this.selectedOption = TitleMenuOption.NewGame;
                break;
            case TitleMenuOption.SelectChamber:
                this.selectedOption = TitleMenuOption.Continue;
                break;
            case TitleMenuOption.Controls:
                this.selectedOption = TitleMenuOption.SelectChamber;
                break;
        }
    }

    public navigateDown(): void {
        switch (this.selectedOption) {
            case TitleMenuOption.NewGame:
                this.selectedOption = TitleMenuOption.Continue;
                break;
            case TitleMenuOption.Continue:
                this.selectedOption = TitleMenuOption.SelectChamber;
                break;
            case TitleMenuOption.SelectChamber:
                this.selectedOption = TitleMenuOption.Controls;
                break;
            case TitleMenuOption.Controls:
                this.selectedOption = TitleMenuOption.NewGame;
                break;
        }
    }

    public changeChamberLeft(): void {
        this.selectedChamber = this.selectedChamber > 1 ? this.selectedChamber - 1 : GameConstants.TOTAL_CHAMBERS;
    }

    public changeChamberRight(): void {
        this.selectedChamber = this.selectedChamber < GameConstants.TOTAL_CHAMBERS ? this.selectedChamber + 1 : 1;
    }
}

