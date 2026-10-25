import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { TileGraphics } from '../graphics/TileGraphics.ts';
import { PlayerGraphics } from '../graphics/PlayerGraphics.ts';
import { TitleMenuModel, TitleMenuOption } from './TitleMenuModel.ts';
import { GamepadManager } from '../input/GamepadManager.ts';

export { TitleMenuOption };

export class TitleScene extends Phaser.Scene {
    private menuModel: TitleMenuModel = new TitleMenuModel();
    private frameCounter: number = 0;

    // Elementos visuales
    private optionTexts: Phaser.GameObjects.Text[] = [];
    private pyramidLevelText!: Phaser.GameObjects.Text;
    private cursorBlinkState: boolean = true;

    // Controles de teclado
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private enterKey?: Phaser.Input.Keyboard.Key;
    private spaceKey?: Phaser.Input.Keyboard.Key;

    // Control de flancos de pulsación
    private prevUp: boolean = false;
    private prevDown: boolean = false;
    private prevLeft: boolean = false;
    private prevRight: boolean = false;
    private prevConfirm: boolean = false;

    constructor() {
        super('TitleScene');
    }

    preload(): void {
        TileGraphics.generateAll(this);
        PlayerGraphics.generateAll(this);
    }

    create(data?: { lastChamber?: number }): void {
        this.cameras.main.setBackgroundColor('#140d06');

        if (data?.lastChamber) {
            this.menuModel.selectedChamber = data.lastChamber;
        }

        const width = GameConstants.VIRTUAL_WIDTH;

        // 1. Cabecera y Título Retro
        this.add.text(width / 2, 40, '****************************************', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#875f2d'
        }).setOrigin(0.5);

        this.add.text(width / 2 + 3, 83, 'RETRO GAME PIRAMID', {
            fontFamily: 'Courier',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#3c230f'
        }).setOrigin(0.5);

        this.add.text(width / 2, 80, 'RETRO GAME PIRAMID', {
            fontFamily: 'Courier',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffd73c'
        }).setOrigin(0.5);

        this.add.text(width / 2, 125, '- EXPEDICIÓN EGIPCIA -', {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#d2af6e'
        }).setOrigin(0.5);

        this.add.text(width / 2, 155, '========================================', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#875f2d'
        }).setOrigin(0.5);

        // 2. Opciones de Menú
        const menuStartY = 195;
        const lineSpacing = 42;

        this.optionTexts = [];
        for (let i = 0; i < 4; i++) {
            const txt = this.add.text(width / 2, menuStartY + i * lineSpacing, '', {
                fontFamily: 'Courier',
                fontSize: '20px',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.optionTexts.push(txt);
        }

        this.pyramidLevelText = this.add.text(width / 2, 375, '', {
            fontFamily: 'Courier',
            fontSize: '15px',
            color: '#f6c672'
        }).setOrigin(0.5);

        // 3. Pie de página de instrucciones
        this.add.text(width / 2, 410, '========================================', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#875f2d'
        }).setOrigin(0.5);

        this.add.text(width / 2, 435, 'FLECHAS/JOYSTICK [↑][↓]: ELEGIR   ENTER/ESPACIO/BOTÓN: CONFIRMAR', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#aa8c5f'
        }).setOrigin(0.5);

        this.add.text(width / 2, 455, 'FLECHAS/JOYSTICK [←][→]: CAMBIAR RECÁMARA (1 - 10)', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#aa8c5f'
        }).setOrigin(0.5);

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        this.updateDisplay();
    }

    update(): void {
        this.frameCounter++;
        if (this.frameCounter % 15 === 0) {
            this.cursorBlinkState = !this.cursorBlinkState;
            this.updateDisplay();
        }

        const pad = GamepadManager.pollMenuInput(this);
        const isUp = !!this.cursors?.up.isDown || pad.up;
        const isDown = !!this.cursors?.down.isDown || pad.down;
        const isLeft = !!this.cursors?.left.isDown || pad.left;
        const isRight = !!this.cursors?.right.isDown || pad.right;
        const isConfirm = !!(this.enterKey?.isDown || this.spaceKey?.isDown || pad.confirm);

        const upJustPressed = isUp && !this.prevUp;
        const downJustPressed = isDown && !this.prevDown;
        const leftJustPressed = isLeft && !this.prevLeft;
        const rightJustPressed = isRight && !this.prevRight;
        const confirmJustPressed = isConfirm && !this.prevConfirm;

        this.prevUp = isUp;
        this.prevDown = isDown;
        this.prevLeft = isLeft;
        this.prevRight = isRight;
        this.prevConfirm = isConfirm;

        if (upJustPressed) {
            this.menuModel.navigateUp();
            this.updateDisplay();
        } else if (downJustPressed) {
            this.menuModel.navigateDown();
            this.updateDisplay();
        }

        if (this.menuModel.selectedOption === TitleMenuOption.SelectChamber) {
            if (leftJustPressed) {
                this.menuModel.changeChamberLeft();
                this.updateDisplay();
            } else if (rightJustPressed) {
                this.menuModel.changeChamberRight();
                this.updateDisplay();
            }
        }

        if (confirmJustPressed) {
            this.confirmSelection();
        }
    }

    private confirmSelection(): void {
        switch (this.menuModel.selectedOption) {
            case TitleMenuOption.NewGame:
                this.scene.start('GameScene', { chamber: 1 });
                break;

            case TitleMenuOption.Continue:
            case TitleMenuOption.SelectChamber:
                this.scene.start('GameScene', { chamber: this.menuModel.selectedChamber });
                break;

            case TitleMenuOption.Controls:
                this.menuModel.selectedOption = TitleMenuOption.SelectChamber;
                this.updateDisplay();
                break;
        }
    }

    private updateDisplay(): void {
        const optionNames = [
            'NUEVO JUEGO',
            'CONTINUAR',
            `RECAMARA: < ${this.menuModel.selectedChamber} >`,
            'CONTROLES: FLECHAS Y ESPACIO'
        ];

        for (let i = 0; i < this.optionTexts.length; i++) {
            const isSelected = this.menuModel.selectedOption === i;
            const cursor = isSelected ? (this.cursorBlinkState ? '>> ' : ' > ') : '   ';
            const text = cursor + optionNames[i];

            this.optionTexts[i].setText(text);
            if (isSelected) {
                this.optionTexts[i].setColor('#fff082');
                this.optionTexts[i].setFontSize(22);
            } else {
                this.optionTexts[i].setColor('#967850');
                this.optionTexts[i].setFontSize(20);
            }
        }

        const level = RoomGrid.getPyramidLevel(this.menuModel.selectedChamber);
        const levelNames = [
            '',
            'NIVEL PIRÁMIDE: 1 (BASE - RECÁMARAS 1 A 4)',
            'NIVEL PIRÁMIDE: 2 (GALERÍAS - RECÁMARAS 5 A 7)',
            'NIVEL PIRÁMIDE: 3 (SANTUARIOS - RECÁMARAS 8 Y 9)',
            'NIVEL PIRÁMIDE: 4 (CÚSPIDE DE MONTEZUMA - RECÁMARA 10)'
        ];

        this.pyramidLevelText.setText(levelNames[level] || '');
    }
}

