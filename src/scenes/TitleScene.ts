import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { TileGraphics } from '../graphics/TileGraphics.ts';
import { PlayerGraphics } from '../graphics/PlayerGraphics.ts';
import { TitleMenuModel, TitleMenuOption } from './TitleMenuModel.ts';
import { GamepadManager } from '../input/GamepadManager.ts';
import { PuzzleProgressTracker } from '../puzzles/PuzzleProgressTracker.ts';
import { RetroAudio } from '../audio/RetroAudio.ts';

export { TitleMenuOption };

export class TitleScene extends Phaser.Scene {
    private menuModel: TitleMenuModel = new TitleMenuModel();
    private frameCounter: number = 0;

    // Elementos visuales del menú principal
    private optionTexts: Phaser.GameObjects.Text[] = [];
    private pyramidLevelText!: Phaser.GameObjects.Text;
    private cursorBlinkState: boolean = true;
    private menuGameObjects: (Phaser.GameObjects.GameObject & { setVisible?(visible: boolean): any })[] = [];

    // Modo y vista de Historia / Objetivo
    private isShowingStory: boolean = false;
    private storyContainer!: Phaser.GameObjects.Container;
    private storyReturnPromptText!: Phaser.GameObjects.Text;
    private storyPromptBlink: boolean = true;

    // Controles de teclado
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private enterKey?: Phaser.Input.Keyboard.Key;
    private spaceKey?: Phaser.Input.Keyboard.Key;
    private escKey?: Phaser.Input.Keyboard.Key;

    // Control de flancos de pulsación
    private prevUp: boolean = false;
    private prevDown: boolean = false;
    private prevLeft: boolean = false;
    private prevRight: boolean = false;
    private prevConfirm: boolean = false;
    private prevBack: boolean = false;

    constructor() {
        super('TitleScene');
    }

    preload(): void {
        this.load.image('hieroglyphs_wall', 'assets/hieroglyphs_wall_seamless.png');
        this.load.image('hieroglyphs_raw', 'jeroglificosEgipcios_2.png');
        TileGraphics.generateAll(this);
        PlayerGraphics.generateAll(this);
        RetroAudio.preload(this);
    }

    create(data?: { lastChamber?: number; showStory?: boolean }): void {
        this.cameras.main.setBackgroundColor('#100a04');

        // Fondo de jeroglíficos egipcios auténticos en bajorrelieve
        const bgKey = this.textures.exists('hieroglyphs_wall') ? 'hieroglyphs_wall' : 'hieroglyphs_raw';
        if (this.textures.exists(bgKey)) {
            this.add.tileSprite(0, 0, GameConstants.VIRTUAL_WIDTH, GameConstants.VIRTUAL_HEIGHT, bgKey)
                .setOrigin(0, 0)
                .setTileScale(0.42, 0.42)
                .setTint(0x5a3c1c)
                .setAlpha(0.24)
                .setDepth(-100);
        }

        if (data?.lastChamber) {
            this.menuModel.selectedChamber = data.lastChamber;
        }

        const width = GameConstants.VIRTUAL_WIDTH;
        this.menuGameObjects = [];

        // 1. Cabecera y Título Retro
        const lineTop = this.add.text(width / 2, 38, '****************************************', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#875f2d'
        }).setOrigin(0.5);
        this.menuGameObjects.push(lineTop);

        const titleShadow = this.add.text(width / 2 + 3, 79, 'RETRO GAME PIRAMID', {
            fontFamily: 'Courier',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#3c230f'
        }).setOrigin(0.5);
        this.menuGameObjects.push(titleShadow);

        const titleGold = this.add.text(width / 2, 76, 'RETRO GAME PIRAMID', {
            fontFamily: 'Courier',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffd73c'
        }).setOrigin(0.5);
        this.menuGameObjects.push(titleGold);

        const subtitle = this.add.text(width / 2, 118, '- EXPEDICIÓN EGIPCIA -', {
            fontFamily: 'Courier',
            fontSize: '17px',
            color: '#d2af6e'
        }).setOrigin(0.5);
        this.menuGameObjects.push(subtitle);

        const lineSep = this.add.text(width / 2, 146, '========================================', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#875f2d'
        }).setOrigin(0.5);
        this.menuGameObjects.push(lineSep);

        // 2. Opciones de Menú (5 opciones calibradas verticalmente)
        const menuStartY = 178;
        const lineSpacing = 36;

        this.optionTexts = [];
        for (let i = 0; i < 5; i++) {
            const txt = this.add.text(width / 2, menuStartY + i * lineSpacing, '', {
                fontFamily: 'Courier',
                fontSize: '20px',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            txt.setInteractive({ useHandCursor: true });
            txt.on('pointerover', () => {
                if (!this.isShowingStory) {
                    this.menuModel.selectedOption = i as TitleMenuOption;
                    this.updateDisplay();
                }
            });
            txt.on('pointerdown', () => {
                if (!this.isShowingStory) {
                    this.menuModel.selectedOption = i as TitleMenuOption;
                    this.confirmSelection();
                }
            });

            this.optionTexts.push(txt);
            this.menuGameObjects.push(txt);
        }

        this.pyramidLevelText = this.add.text(width / 2, 362, '', {
            fontFamily: 'Courier',
            fontSize: '15px',
            color: '#f6c672'
        }).setOrigin(0.5);
        this.menuGameObjects.push(this.pyramidLevelText);

        // 3. Pie de página de instrucciones
        const lineBottom = this.add.text(width / 2, 398, '========================================', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#875f2d'
        }).setOrigin(0.5);
        this.menuGameObjects.push(lineBottom);

        const instr1 = this.add.text(width / 2, 422, 'FLECHAS/JOYSTICK [↑][↓]: ELEGIR   ENTER/ESPACIO/BOTÓN: CONFIRMAR', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#aa8c5f'
        }).setOrigin(0.5);
        this.menuGameObjects.push(instr1);

        const instr2 = this.add.text(width / 2, 444, 'FLECHAS/JOYSTICK [←][→]: CAMBIAR RECÁMARA (1 - 10)', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#aa8c5f'
        }).setOrigin(0.5);
        this.menuGameObjects.push(instr2);

        // 4. Teclado e interacción
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            this.input.keyboard.once('keydown', () => {
                RetroAudio.playMenuMusic(this);
            });
        }

        this.input.once('pointerdown', () => {
            RetroAudio.playMenuMusic(this);
        });

        // Iniciar música del menú principal
        RetroAudio.playMenuMusic(this);

        // Construir la vista de Historia y Objetivo sobre el fondo egipcio
        this.createStoryOverlay();

        if (data?.showStory) {
            this.showStory();
        } else {
            this.updateDisplay();
        }
    }

    /**
     * Construye el panel con la historia y objetivo de Rob Lucky sobre el fondo egipcio.
     */
    private createStoryOverlay(): void {
        const width = GameConstants.VIRTUAL_WIDTH;

        this.storyContainer = this.add.container(0, 0);
        this.storyContainer.setDepth(100);
        this.storyContainer.setVisible(false);

        // Fondo de panel de piedra egipcia translúcido que permite apreciar los jeroglíficos
        const panel = this.add.rectangle(width / 2, 240, 604, 442, 0x110803, 0.88);
        panel.setStrokeStyle(3, 0xb48232);
        panel.setInteractive({ useHandCursor: true });
        panel.on('pointerdown', () => this.hideStory());
        this.storyContainer.add(panel);

        const innerBorder = this.add.rectangle(width / 2, 240, 588, 426);
        innerBorder.setStrokeStyle(1, 0x6e4a1f);
        this.storyContainer.add(innerBorder);

        // Cabecera decorativa de Historia
        const titleText = this.add.text(width / 2, 48, '★ HISTORIA Y OBJETIVO DE LA EXPEDICIÓN ★', {
            fontFamily: 'Courier',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffd73c'
        }).setOrigin(0.5);
        this.storyContainer.add(titleText);

        const headerLine = this.add.text(width / 2, 72, '====================================================', {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#875f2d'
        }).setOrigin(0.5);
        this.storyContainer.add(headerLine);

        // Narrativa principal solicitada por el usuario
        const storyP1 = this.add.text(
            width / 2,
            135,
            'El arqueólogo Rob Lucky ha encontrado una pirámide oculta en el desierto y debe recorrer todas las recámaras obteniendo los tesoros, resolviendo todos los puzzles para poder abrir en la última recámara "10" EL SARCOFAGO DEL FARAON y poder completar la historia de su vida de principio a su final.',
            {
                fontFamily: 'Courier',
                fontSize: '15px',
                color: '#f5e2b8',
                align: 'left',
                lineSpacing: 6,
                wordWrap: { width: 540 }
            }
        ).setOrigin(0.5);
        this.storyContainer.add(storyP1);

        // Sección de Desafíos y Mecánicas
        const challengeHeader = this.add.text(50, 204, 'Cada recámara representa un desafío en el que debe:', {
            fontFamily: 'Courier',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ffd73c'
        });
        this.storyContainer.add(challengeHeader);

        const bullet1 = this.add.text(64, 234, '• Esquivar momias patrulleras ancestrales.', {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffd27d'
        });
        this.storyContainer.add(bullet1);

        const bullet2 = this.add.text(64, 260, '• No caer desde las plataformas a gran altura.', {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffd27d'
        });
        this.storyContainer.add(bullet2);

        const bullet3 = this.add.text(64, 286, '• Evitar los pisos que se mueven y colapsan.', {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffd27d'
        });
        this.storyContainer.add(bullet3);

        const tipText = this.add.text(
            width / 2,
            335,
            'Pistas: Observa los murales de cada recámara para descifrar los acertijos.',
            {
                fontFamily: 'Courier',
                fontSize: '13px',
                color: '#aa8c5f'
            }
        ).setOrigin(0.5);
        this.storyContainer.add(tipText);

        const footerLine = this.add.text(width / 2, 375, '====================================================', {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#875f2d'
        }).setOrigin(0.5);
        this.storyContainer.add(footerLine);

        // Prompt de regreso interactivo
        this.storyReturnPromptText = this.add.text(
            width / 2,
            412,
            '>> PRESIONA [ENTER], [ESPACIO] O [ESC] PARA VOLVER <<',
            {
                fontFamily: 'Courier',
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#fff082'
            }
        ).setOrigin(0.5);
        this.storyReturnPromptText.setInteractive({ useHandCursor: true });
        this.storyReturnPromptText.on('pointerdown', () => this.hideStory());
        this.storyContainer.add(this.storyReturnPromptText);
    }

    /**
     * Muestra la pantalla de historia ocultando el menú principal.
     */
    public showStory(): void {
        this.isShowingStory = true;
        RetroAudio.playTreasure(this);
        for (const obj of this.menuGameObjects) {
            if (obj && typeof obj.setVisible === 'function') {
                obj.setVisible(false);
            }
        }
        this.storyContainer.setVisible(true);
    }

    /**
     * Oculta la historia y restaura el menú principal.
     */
    public hideStory(): void {
        this.isShowingStory = false;
        for (const obj of this.menuGameObjects) {
            if (obj && typeof obj.setVisible === 'function') {
                obj.setVisible(true);
            }
        }
        this.storyContainer.setVisible(false);
        this.updateDisplay();
    }

    update(): void {
        // En modo historia: gestionar retorno con tecla o botón
        if (this.isShowingStory) {
            this.frameCounter++;
            if (this.frameCounter % 20 === 0) {
                this.storyPromptBlink = !this.storyPromptBlink;
                if (this.storyReturnPromptText) {
                    this.storyReturnPromptText.setColor(this.storyPromptBlink ? '#fff082' : '#d2af6e');
                }
            }

            const pad = GamepadManager.pollMenuInput(this);
            const isConfirm = !!(this.enterKey?.isDown || this.spaceKey?.isDown || pad.confirm);
            const isBack = !!(this.escKey?.isDown);
            const confirmJustPressed = isConfirm && !this.prevConfirm;
            const backJustPressed = isBack && !this.prevBack;

            this.prevConfirm = isConfirm;
            this.prevBack = isBack;

            if (confirmJustPressed || backJustPressed) {
                this.hideStory();
            }
            return;
        }

        // Modo menú principal:
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
        const isBack = !!(this.escKey?.isDown);

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
        this.prevBack = isBack;

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

            case TitleMenuOption.Story:
                this.showStory();
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
            'HISTORIA',
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
        if (this.menuModel.selectedChamber === 10) {
            const tracker = PuzzleProgressTracker.getInstance();
            if (tracker.isChamber10Unlocked) {
                this.pyramidLevelText.setText('NIVEL PIRÁMIDE: 4 (CÚSPIDE - SARCOFAGO DESBLOQUEADO)');
            } else {
                this.pyramidLevelText.setText(`NIVEL PIRÁMIDE: 4 (CÚSPIDE - SARCOFAGO SELLADO ${tracker.completedChambersCount}/9)`);
            }
        } else {
            const levelNames = [
                '',
                'NIVEL PIRÁMIDE: 1 (BASE - RECÁMARAS 1 A 4)',
                'NIVEL PIRÁMIDE: 2 (GALERÍAS - RECÁMARAS 5 A 7)',
                'NIVEL PIRÁMIDE: 3 (SANTUARIOS - RECÁMARAS 8 Y 9)',
                'NIVEL PIRÁMIDE: 4 (CÚSPIDE - RECÁMARA 10)'
            ];
            this.pyramidLevelText.setText(levelNames[level] || '');
        }
    }
}
