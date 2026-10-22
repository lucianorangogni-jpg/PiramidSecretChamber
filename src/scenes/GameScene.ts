import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';
import { TileType } from '../grid/TileType.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { TileGraphics } from '../graphics/TileGraphics.ts';
import { PlayerGraphics } from '../graphics/PlayerGraphics.ts';
import { Player } from '../entities/Player.ts';

export class GameScene extends Phaser.Scene {
    private grid!: RoomGrid;
    private player!: Player;
    private tileSprites: Phaser.GameObjects.Image[] = [];

    // Elementos del HUD
    private chamberTitleText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private controlsText!: Phaser.GameObjects.Text;

    // Teclas
    private numberKeys!: { [key: string]: Phaser.Input.Keyboard.Key };
    private keyR!: Phaser.Input.Keyboard.Key;
    private keyEsc!: Phaser.Input.Keyboard.Key;
    private keyM!: Phaser.Input.Keyboard.Key;

    private initialChamber: number = 1;

    constructor() {
        super('GameScene');
    }

    init(data?: { chamber?: number }): void {
        this.initialChamber = data?.chamber && data.chamber >= 1 && data.chamber <= 10 ? data.chamber : 1;
    }

    preload(): void {
        TileGraphics.generateAll(this);
        PlayerGraphics.generateAll(this);
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#181108');

        // Inicializar cuadrícula con la recámara seleccionada
        this.grid = new RoomGrid();
        this.grid.loadChamber(this.initialChamber);

        // Construir visualmente los tiles de la recámara con origen (0, 0)
        this.renderChamber();

        // Spawn del jugador: centro horizontal de columna 2 y pies sobre el suelo (fila 14 = 448 px)
        const startX = 2 * GameConstants.TILE_SIZE + 16;
        const startY = (GameConstants.GRID_ROWS - 1) * GameConstants.TILE_SIZE; // 14 * 32 = 448
        this.player = new Player(this, startX, startY);

        // Textos del HUD
        this.chamberTitleText = this.add.text(12, 10, '', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#f6c672'
        });

        this.statusText = this.add.text(12, 30, '', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#ffd2a5'
        });

        this.controlsText = this.add.text(12, 460, '[←][→] Moverse | [↑][↓] Escaleras | [Espacio] Salto | [ESC/M] Menú | [R] Reintentar', {
            fontFamily: 'Courier',
            fontSize: '11px',
            color: '#bc8634'
        });

        // Registrar teclas
        if (this.input.keyboard) {
            this.numberKeys = {
                '1': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
                '2': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
                '3': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
                '4': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
                '5': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
                '6': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX),
                '7': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN),
                '8': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT),
                '9': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE),
                '0': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO)
            };
            this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
            this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        }

        this.updateHUD();
    }

    update(): void {
        if (this.player) {
            this.player.updateWithGrid(this.grid);
            this.updateHUD();
        }

        // Volver al Menú Principal con ESC o M
        if ((this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) ||
            (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM))) {
            this.scene.start('TitleScene', { lastChamber: this.grid.currentChamber });
            return;
        }

        // Cambio rápido de recámara con 1..0
        if (this.numberKeys) {
            for (let i = 1; i <= 9; i++) {
                if (Phaser.Input.Keyboard.JustDown(this.numberKeys[i.toString()])) {
                    this.switchChamber(i);
                    return;
                }
            }
            if (Phaser.Input.Keyboard.JustDown(this.numberKeys['0'])) {
                this.switchChamber(10);
                return;
            }
        }

        // Reintentar con R
        if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
            this.respawnPlayer();
        }
    }

    private switchChamber(chamberNumber: number): void {
        this.grid.loadChamber(chamberNumber);
        this.renderChamber();
        this.respawnPlayer();
    }

    private respawnPlayer(): void {
        const startX = 2 * GameConstants.TILE_SIZE + 16;
        const startY = (GameConstants.GRID_ROWS - 1) * GameConstants.TILE_SIZE; // 448
        this.player.respawn(startX, startY);
        this.updateHUD();
    }

    private renderChamber(): void {
        this.tileSprites.forEach((sprite) => sprite.destroy());
        this.tileSprites = [];

        const size = GameConstants.TILE_SIZE;

        for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
            for (let x = 0; x < GameConstants.GRID_COLUMNS; x++) {
                const tile = this.grid.getTile(x, y);
                if (tile === TileType.Empty) continue;

                let textureKey = '';
                switch (tile) {
                    case TileType.SolidWall:
                        textureKey = 'tile_wall';
                        break;
                    case TileType.Ladder:
                        textureKey = 'tile_ladder';
                        break;
                    case TileType.PressurePlate:
                        textureKey = 'tile_plate';
                        break;
                    case TileType.ExitDoor:
                        textureKey = 'tile_door';
                        break;
                }

                if (textureKey) {
                    // Renderizado nítido con origen en esquina superior izquierda
                    const img = this.add.image(x * size, y * size, textureKey).setOrigin(0, 0);
                    this.tileSprites.push(img);
                }
            }
        }

        if (this.player) this.children.bringToTop(this.player);
        if (this.chamberTitleText) this.children.bringToTop(this.chamberTitleText);
        if (this.statusText) this.children.bringToTop(this.statusText);
        if (this.controlsText) this.children.bringToTop(this.controlsText);
    }

    private updateHUD(): void {
        if (!this.chamberTitleText || !this.statusText || !this.player) return;

        this.chamberTitleText.setText(
            `🏛️ RETRO PIRÁMIDE: ${this.grid.roomName} [Nivel ${this.grid.pyramidLevel}/4]`
        );

        const livesDisplay = '❤️'.repeat(Math.max(0, this.player.currentLives));
        const statusMsg = this.player.isEliminated
            ? '¡ELIMINADO! Presiona [R] para reintentar'
            : `Estado: ${this.player.currentState}`;

        this.statusText.setText(`Vidas: ${livesDisplay} (${this.player.currentLives}) | ${statusMsg}`);
    }
}
