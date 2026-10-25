import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';
import { Direction } from '../core/Direction.ts';
import { TileType } from '../grid/TileType.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { TileGraphics } from '../graphics/TileGraphics.ts';
import { PlayerGraphics } from '../graphics/PlayerGraphics.ts';
import { TreasureGraphics } from '../graphics/TreasureGraphics.ts';
import { MummyGraphics } from '../graphics/MummyGraphics.ts';
import { MovingWallGraphics } from '../graphics/MovingWallGraphics.ts';
import { KeyGraphics } from '../graphics/KeyGraphics.ts';
import { HieroglyphGraphics } from '../graphics/HieroglyphGraphics.ts';
import { Player } from '../entities/Player.ts';
import { Treasure } from '../entities/Treasure.ts';
import { Mummy } from '../entities/Mummy.ts';
import { MovingWall } from '../entities/MovingWall.ts';
import { Key } from '../entities/Key.ts';
import { ChamberTreasures } from '../grid/ChamberTreasures.ts';
import { ChamberMummies } from '../grid/ChamberMummies.ts';
import { ChamberMovingWalls } from '../grid/ChamberMovingWalls.ts';
import { ChamberKeys } from '../grid/ChamberKeys.ts';
import { Chamber1Puzzle } from '../puzzles/Chamber1Puzzle.ts';

export class GameScene extends Phaser.Scene {
    private grid!: RoomGrid;
    private player!: Player;
    private tileSprites: Phaser.GameObjects.Image[] = [];

    // Colección de tesoros de la recámara actual
    private treasures: Treasure[] = [];
    private treasureSprites: Phaser.GameObjects.Image[] = [];
    private currentScore: number = 0;
    private chamberStartScore: number = 0;

    // Paredes movedizas y activadores
    private movingWalls: MovingWall[] = [];
    private movingWallSprites: Phaser.GameObjects.Image[][] = [];
    private triggerSprites: Phaser.GameObjects.Image[] = [];
    private wallTimerTexts: Phaser.GameObjects.Text[] = [];

    // Llave ancestral y puerta de salida
    private chamberKey: Key | null = null;
    private keySprite: Phaser.GameObjects.Image | null = null;
    private chainSprites: Phaser.GameObjects.Image[] = [];
    private exitDoorSprite: Phaser.GameObjects.Image | null = null;
    private hasKey: boolean = false;
    private isChamberCompleted: boolean = false;
    private doorWarningCooldown: number = 0;

    // Sistema de Puzles Diegéticos (Recámara 1)
    private chamber1Puzzle: Chamber1Puzzle | null = null;
    private muralSprites: Phaser.GameObjects.Image[] = [];
    private secretTreasureSprite: Phaser.GameObjects.Image | null = null;
    private sacredGemSprite: Phaser.GameObjects.Image | null = null;
    private bgHieroglyphs?: Phaser.GameObjects.TileSprite;

    // Enemigos Momia de la recámara actual
    private mummies: Mummy[] = [];
    private mummySprites: Phaser.GameObjects.Image[] = [];

    // Elementos del HUD Izquierdo
    private chamberTitleText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private controlsText!: Phaser.GameObjects.Text;

    // Elementos del HUD Derecho (US-007)
    private hudStatusTitleText!: Phaser.GameObjects.Text;
    private hudScoreText!: Phaser.GameObjects.Text;
    private hudLivesText!: Phaser.GameObjects.Text;
    private hudKeyText!: Phaser.GameObjects.Text;

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
        this.load.image('hieroglyphs_wall', 'assets/hieroglyphs_wall_seamless.png');
        this.load.image('hieroglyphs_raw', 'jeroglificosEgipcios_2.png');
        this.load.image('mural_puzzle_1', 'assets/mural_puzzle_1.png');
        this.load.image('mural_puzzle_2', 'assets/mural_puzzle_2.png');

        TileGraphics.generateAll(this);
        PlayerGraphics.generateAll(this);
        TreasureGraphics.generateAll(this);
        MummyGraphics.generateAll(this);
        MovingWallGraphics.generateAll(this);
        KeyGraphics.generateAll(this);
        HieroglyphGraphics.generateAll(this);
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#100a04');

        // Fondo de la pirámide cubierto con los jeroglíficos egipcios auténticos (jeroglificosEgipcios_2.png)
        const bgKey = this.textures.exists('hieroglyphs_wall') ? 'hieroglyphs_wall' : 'hieroglyphs_raw';
        if (this.textures.exists(bgKey)) {
            this.bgHieroglyphs = this.add.tileSprite(
                0,
                0,
                GameConstants.VIRTUAL_WIDTH,
                GameConstants.VIRTUAL_HEIGHT,
                bgKey
            )
                .setOrigin(0, 0)
                .setTileScale(0.42, 0.42)
                .setTint(0x7c5427) // Tono cálido de bajorrelieve en piedra arenisca
                .setAlpha(0.38)    // Fondo visible y evocador manteniendo contraste retro con las plataformas y jugador
                .setDepth(-100);
            this.bgHieroglyphs.tilePositionX = (this.initialChamber - 1) * 66;
        }

        // Inicializar cuadrícula con la recámara seleccionada
        this.grid = new RoomGrid();
        this.grid.loadChamber(this.initialChamber);

        // Inicializar estado de llave y puerta
        this.hasKey = false;
        this.isChamberCompleted = false;
        this.doorWarningCooldown = 0;
        this.chamberKey = ChamberKeys.createKeyForChamber(this.initialChamber);

        // Sistema de Puzles Diegéticos (Recámara 1)
        this.chamber1Puzzle = this.initialChamber === 1 ? new Chamber1Puzzle() : null;

        // Construir visualmente los tiles estáticos de la recámara con origen (0, 0)
        this.renderChamber();

        // Renderizar murales jeroglíficos diegéticos
        this.renderMurals();

        // Renderizar llave colgada y cadenas de suspensión
        this.renderKey();

        // Cargar paredes movedizas y registrar solidez en la cuadrícula (desde topGridY hasta gridY)
        this.movingWalls = ChamberMovingWalls.createWallsForChamber(this.initialChamber);
        for (const wall of this.movingWalls) {
            for (let y = wall.topGridY; y <= wall.gridY; y++) {
                this.grid.setTile(wall.gridX, y, TileType.SolidWall);
            }
        }

        // Renderizar activadores y paredes movedizas dinámicas
        this.renderMovingWalls();

        // Cargar y renderizar los tesoros de la recámara
        this.treasures = ChamberTreasures.createTreasuresForChamber(this.initialChamber);
        this.renderTreasures();

        // Cargar y renderizar las momias patrulleras
        this.mummies = ChamberMummies.createMummiesForChamber(this.initialChamber);
        this.renderMummies();

        // Spawn del jugador: centro horizontal de columna 2 y pies sobre el suelo (fila 14 = 448 px)
        const startX = 2 * GameConstants.TILE_SIZE + 16;
        const startY = (GameConstants.GRID_ROWS - 1) * GameConstants.TILE_SIZE; // 14 * 32 = 448
        this.player = new Player(this, startX, startY);

        // Textos del HUD Izquierdo
        this.chamberTitleText = this.add.text(12, 10, '', {
            fontFamily: 'Courier',
            fontSize: '15px',
            color: '#f6c672'
        });

        this.statusText = this.add.text(12, 30, '', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#ffd2a5'
        });

        // Panel HUD Derecho (US-007 / US-025: ESTADO / PUNTOS / VIDAS / LLAVE)
        this.hudStatusTitleText = this.add.text(628, 8, '═ ESTADO ═', {
            fontFamily: 'Courier',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f6c672'
        }).setOrigin(1, 0);

        this.hudScoreText = this.add.text(628, 22, 'PUNTOS: 000000', {
            fontFamily: 'Courier',
            fontSize: '12px',
            color: '#ffe26a'
        }).setOrigin(1, 0);

        this.hudLivesText = this.add.text(628, 36, 'VIDAS: ❤️❤️❤️ (3)', {
            fontFamily: 'Courier',
            fontSize: '12px',
            color: '#ffd2a5'
        }).setOrigin(1, 0);

        this.hudKeyText = this.add.text(628, 50, 'LLAVE: 🔒 NO', {
            fontFamily: 'Courier',
            fontSize: '12px',
            color: '#ff9d5c'
        }).setOrigin(1, 0);

        this.controlsText = this.add.text(12, 460, '[←][→]/Joystick: Mover | [↑][↓]: Escaleras | [Espacio/Botón]: Salto | [ESC/M]: Menú | [R]: Reintentar', {
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
        this.bringUIElementsToTop();
    }

    update(): void {
        if (this.doorWarningCooldown > 0) {
            this.doorWarningCooldown--;
        }

        if (this.player) {
            this.player.updateWithGrid(this.grid);
            this.updateMovingWalls();
            this.checkKeyCollection();
            this.checkExitDoorInteraction();
            this.checkTreasureCollection();
            this.updateChamber1Puzzle();
            this.updateMummies();
            this.checkMummyCollisions();
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

    /**
     * Actualiza la lógica de las paredes movedizas, activación por pisada y temporizadores de 5s.
     */
    private updateMovingWalls(): void {
        for (let i = 0; i < this.movingWalls.length; i++) {
            const wall = this.movingWalls[i];
            const wasOpen = wall.isOpen;

            // Detección de pisada en activador exterior o interior
            if (this.player && !this.player.isEliminated) {
                if (wall.isPlayerOnAnyTrigger(this.player.x, this.player.y, Player.HITBOX_WIDTH, Player.HITBOX_HEIGHT)) {
                    if (!wasOpen && this.chamber1Puzzle) {
                        this.chamber1Puzzle.notifyWallActivated(wall.id);
                    }
                    wall.activate(); // Inicia o reinicia el temporizador de 5 segundos
                }
            }

            // Comprobar si el jugador está atravesando la columna del muro (anti-aplastamiento)
            const isPlayerInThreshold = !!(
                this.player &&
                !this.player.isEliminated &&
                wall.isPlayerInsideWallThreshold(this.player.x, this.player.y, Player.HITBOX_WIDTH, Player.HITBOX_HEIGHT)
            );

            wall.update(isPlayerInThreshold);

            // Sincronizar solidez en la cuadrícula RoomGrid para toda la altura de la pared
            const targetTile = wall.isOpen ? TileType.Empty : TileType.SolidWall;
            for (let y = wall.topGridY; y <= wall.gridY; y++) {
                this.grid.setTile(wall.gridX, y, targetTile);
            }

            // Sincronizar representación visual
            const wallSprites = this.movingWallSprites[i];
            const timerText = this.wallTimerTexts[i];

            if (wall.isOpen) {
                if (!wasOpen && wallSprites) {
                    for (let sIdx = 0; sIdx < wallSprites.length; sIdx++) {
                        const originalY = (wall.topGridY + sIdx) * GameConstants.TILE_SIZE;
                        this.tweens.add({
                            targets: wallSprites[sIdx],
                            y: originalY - 32,
                            alpha: 0.0,
                            duration: 250,
                            ease: 'Power2'
                        });
                    }
                }
                if (timerText) {
                    timerText.setVisible(true);
                    timerText.setText(`${wall.remainingSeconds}s`);
                    timerText.setPosition(wall.pixelX + 16, wall.topPixelY - 10);
                }
            } else {
                if (wasOpen && wallSprites) {
                    for (let sIdx = 0; sIdx < wallSprites.length; sIdx++) {
                        const originalY = (wall.topGridY + sIdx) * GameConstants.TILE_SIZE;
                        this.tweens.add({
                            targets: wallSprites[sIdx],
                            y: originalY,
                            alpha: 1.0,
                            duration: 250,
                            ease: 'Power2'
                        });
                    }
                }
                if (timerText) {
                    timerText.setVisible(false);
                }
            }

            // Actualizar iluminación de las placas activadoras
            const outerSpr = this.triggerSprites[i * 2];
            const innerSpr = this.triggerSprites[i * 2 + 1];
            const plateTex = wall.isOpen ? 'tile_trigger_plate_active' : 'tile_trigger_plate';
            if (outerSpr) outerSpr.setTexture(plateTex);
            if (innerSpr) innerSpr.setTexture(plateTex);
        }
    }

    /**
     * Actualiza la patrulla autónoma de las momias y sincroniza sus sprites.
     */
    private updateMummies(): void {
        for (let i = 0; i < this.mummies.length; i++) {
            const mummy = this.mummies[i];
            mummy.update();

            const sprite = this.mummySprites[i];
            if (sprite) {
                sprite.setPosition(mummy.x, mummy.y);
                const isPetrified = this.chamber1Puzzle?.isMummyPetrified ?? false;
                const tex = isPetrified ? 'mummy_petrified' : mummy.textureKey;
                sprite.setTexture(tex);
                sprite.setFlipX(mummy.direction === Direction.Left);
            }
        }
    }

    /**
     * Detección de colisión letal con las momias patrulleras.
     */
    private checkMummyCollisions(): void {
        if (!this.player || this.player.isEliminated) return;

        for (const mummy of this.mummies) {
            if (mummy.checkOverlap(this.player.x, this.player.y, Player.HITBOX_WIDTH, Player.HITBOX_HEIGHT)) {
                this.player.eliminate();
                this.updateHUD();
                break;
            }
        }
    }

    /**
     * Detección de contacto con los cofres de tesoro para recolección inmediata.
     */
    private checkTreasureCollection(): void {
        if (!this.player || this.player.isEliminated) return;

        for (let i = 0; i < this.treasures.length; i++) {
            const treasure = this.treasures[i];
            if (
                treasure.isAvailable &&
                treasure.checkOverlap(this.player.x, this.player.y, Player.HITBOX_WIDTH, Player.HITBOX_HEIGHT)
            ) {
                const points = treasure.collect();
                if (points > 0) {
                    this.currentScore += points;
                    if (this.chamber1Puzzle) {
                        this.chamber1Puzzle.notifyTreasureCollected();
                    }

                    // Cambiar a sprite de cofre abierto
                    const sprite = this.treasureSprites[i];
                    if (sprite) {
                        sprite.setTexture('treasure_open');
                        this.tweens.add({
                            targets: sprite,
                            scaleX: 1.25,
                            scaleY: 1.25,
                            yoyo: true,
                            duration: 120
                        });
                    }

                    // Notificación flotante de puntuación
                    this.showFloatingScore(treasure.pixelX + 16, treasure.pixelY, `+${points} PTS!`);
                    this.updateHUD();
                }
            }
        }
    }

    private showFloatingScore(x: number, y: number, text: string): void {
        const popup = this.add.text(x, y, text, {
            fontFamily: 'Courier',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffe26a',
            stroke: '#281303',
            strokeThickness: 3
        }).setOrigin(0.5, 1);

        this.tweens.add({
            targets: popup,
            y: y - 28,
            alpha: 0,
            duration: 1200,
            ease: 'Power1',
            onComplete: () => {
                popup.destroy();
            }
        });
    }

    private switchChamber(chamberNumber: number): void {
        this.hasKey = false;
        this.isChamberCompleted = false;
        this.doorWarningCooldown = 0;
        this.chamberKey = ChamberKeys.createKeyForChamber(chamberNumber);

        // Sistema de Puzles Diegéticos
        this.chamber1Puzzle = chamberNumber === 1 ? new Chamber1Puzzle() : null;
        if (this.secretTreasureSprite) {
            this.secretTreasureSprite.destroy();
            this.secretTreasureSprite = null;
        }
        if (this.sacredGemSprite) {
            this.sacredGemSprite.destroy();
            this.sacredGemSprite = null;
        }

        this.grid.loadChamber(chamberNumber);
        if (this.bgHieroglyphs) {
            this.bgHieroglyphs.tilePositionX = (chamberNumber - 1) * 66;
        }
        this.renderChamber();
        this.renderMurals();
        this.renderKey();

        this.movingWalls = ChamberMovingWalls.createWallsForChamber(chamberNumber);
        for (const wall of this.movingWalls) {
            for (let y = wall.topGridY; y <= wall.gridY; y++) {
                this.grid.setTile(wall.gridX, y, TileType.SolidWall);
            }
        }
        this.renderMovingWalls();

        this.treasures = ChamberTreasures.createTreasuresForChamber(chamberNumber);
        this.renderTreasures();

        this.mummies = ChamberMummies.createMummiesForChamber(chamberNumber);
        this.renderMummies();

        this.chamberStartScore = this.currentScore;
        this.respawnPlayer();
    }

    private respawnPlayer(): void {
        const startX = 2 * GameConstants.TILE_SIZE + 16;
        const startY = (GameConstants.GRID_ROWS - 1) * GameConstants.TILE_SIZE; // 448
        this.player.respawn(startX, startY);

        this.hasKey = false;
        this.isChamberCompleted = false;
        this.doorWarningCooldown = 0;
        if (this.chamberKey) {
            this.chamberKey.reset();
        }
        if (this.exitDoorSprite) {
            const doorTexture = ChamberKeys.isKeyRequired(this.grid.currentChamber) ? 'tile_door_locked' : 'tile_door_open';
            this.exitDoorSprite.setTexture(doorTexture);
        }
        this.renderKey();

        // Restablecer sistema de puzles de la Recámara 1
        if (this.chamber1Puzzle) {
            this.chamber1Puzzle.reset();
        }
        if (this.secretTreasureSprite) {
            this.secretTreasureSprite.destroy();
            this.secretTreasureSprite = null;
        }
        if (this.sacredGemSprite) {
            this.sacredGemSprite.destroy();
            this.sacredGemSprite = null;
        }

        // Restablecer paredes movedizas al estado cerrado
        for (let i = 0; i < this.movingWalls.length; i++) {
            const wall = this.movingWalls[i];
            wall.reset();
            for (let y = wall.topGridY; y <= wall.gridY; y++) {
                this.grid.setTile(wall.gridX, y, TileType.SolidWall);
            }

            const sprites = this.movingWallSprites[i];
            if (sprites) {
                for (let sIdx = 0; sIdx < sprites.length; sIdx++) {
                    const rowY = wall.topGridY + sIdx;
                    sprites[sIdx].setPosition(wall.pixelX, rowY * GameConstants.TILE_SIZE);
                    sprites[sIdx].setAlpha(1.0);
                }
            }

            const timerText = this.wallTimerTexts[i];
            if (timerText) {
                timerText.setVisible(false);
            }

            const outerSpr = this.triggerSprites[i * 2];
            const innerSpr = this.triggerSprites[i * 2 + 1];
            if (outerSpr) outerSpr.setTexture('tile_trigger_plate');
            if (innerSpr) innerSpr.setTexture('tile_trigger_plate');
        }

        // Restablecer cofres de la recámara al estado disponible inicial
        for (let i = 0; i < this.treasures.length; i++) {
            this.treasures[i].reset();
            if (this.treasureSprites[i]) {
                this.treasureSprites[i].setTexture('treasure_closed');
            }
        }

        // Restablecer momias a sus posiciones iniciales de patrulla
        for (let i = 0; i < this.mummies.length; i++) {
            this.mummies[i].reset();
            const sprite = this.mummySprites[i];
            if (sprite) {
                sprite.setPosition(this.mummies[i].x, this.mummies[i].y);
                sprite.setTexture(this.mummies[i].textureKey);
                sprite.setFlipX(this.mummies[i].direction === Direction.Left);
            }
        }

        this.currentScore = this.chamberStartScore;
        this.updateHUD();
    }

    private renderChamber(): void {
        this.tileSprites.forEach((sprite) => sprite.destroy());
        this.tileSprites = [];
        this.exitDoorSprite = null;

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
                        textureKey = ChamberKeys.isKeyRequired(this.grid.currentChamber) && !this.hasKey
                            ? 'tile_door_locked'
                            : 'tile_door_open';
                        break;
                }

                if (textureKey) {
                    const img = this.add.image(x * size, y * size, textureKey).setOrigin(0, 0);
                    this.tileSprites.push(img);
                    if (tile === TileType.ExitDoor) {
                        this.exitDoorSprite = img;
                    }
                }
            }
        }
    }

    private renderMovingWalls(): void {
        for (const spriteGroup of this.movingWallSprites) {
            spriteGroup.forEach((s) => s.destroy());
        }
        this.movingWallSprites = [];
        this.triggerSprites.forEach((s) => s.destroy());
        this.triggerSprites = [];
        this.wallTimerTexts.forEach((t) => t.destroy());
        this.wallTimerTexts = [];

        for (const wall of this.movingWalls) {
            // Activador exterior e interior en el suelo
            const outerSprite = this.add.image(
                wall.outerTrigger.gridX * GameConstants.TILE_SIZE,
                wall.outerTrigger.gridY * GameConstants.TILE_SIZE,
                'tile_trigger_plate'
            ).setOrigin(0, 0);
            this.triggerSprites.push(outerSprite);

            const innerSprite = this.add.image(
                wall.innerTrigger.gridX * GameConstants.TILE_SIZE,
                wall.innerTrigger.gridY * GameConstants.TILE_SIZE,
                'tile_trigger_plate'
            ).setOrigin(0, 0);
            this.triggerSprites.push(innerSprite);

            // Sprites para cada segmento vertical de la pared (desde topGridY hasta gridY)
            const wallSegments: Phaser.GameObjects.Image[] = [];
            for (let y = wall.topGridY; y <= wall.gridY; y++) {
                const wallSprite = this.add.image(
                    wall.pixelX,
                    y * GameConstants.TILE_SIZE,
                    'tile_moving_wall'
                ).setOrigin(0, 0);
                wallSegments.push(wallSprite);
            }
            this.movingWallSprites.push(wallSegments);

            // Texto flotante de temporizador (oculto mientras esté cerrada)
            const timerText = this.add.text(wall.pixelX + 16, wall.topPixelY - 10, '', {
                fontFamily: 'Courier',
                fontSize: '12px',
                fontStyle: 'bold',
                color: '#ffe26a',
                stroke: '#281303',
                strokeThickness: 3
            }).setOrigin(0.5, 0.5).setVisible(false);
            this.wallTimerTexts.push(timerText);
        }

        this.bringUIElementsToTop();
    }

    private renderTreasures(): void {
        this.treasureSprites.forEach((sprite) => sprite.destroy());
        this.treasureSprites = [];

        for (const t of this.treasures) {
            const textureKey = t.isCollected ? 'treasure_open' : 'treasure_closed';
            const sprite = this.add.image(t.pixelX, t.pixelY, textureKey).setOrigin(0, 0);
            this.treasureSprites.push(sprite);
        }

        this.bringUIElementsToTop();
    }

    private renderMummies(): void {
        this.mummySprites.forEach((sprite) => sprite.destroy());
        this.mummySprites = [];

        for (const m of this.mummies) {
            const sprite = this.add.image(m.x, m.y, m.textureKey).setOrigin(0.5, 1.0);
            sprite.setFlipX(m.direction === Direction.Left);
            this.mummySprites.push(sprite);
        }

        this.bringUIElementsToTop();
    }

    private bringUIElementsToTop(): void {
        this.triggerSprites.forEach((s) => this.children.bringToTop(s));
        this.treasureSprites.forEach((s) => this.children.bringToTop(s));
        if (this.secretTreasureSprite) this.children.bringToTop(this.secretTreasureSprite);
        if (this.sacredGemSprite) this.children.bringToTop(this.sacredGemSprite);
        this.movingWallSprites.forEach((group) => group.forEach((s) => this.children.bringToTop(s)));
        this.wallTimerTexts.forEach((t) => this.children.bringToTop(t));
        this.chainSprites.forEach((s) => this.children.bringToTop(s));
        if (this.keySprite) this.children.bringToTop(this.keySprite);
        this.mummySprites.forEach((s) => this.children.bringToTop(s));
        if (this.player) this.children.bringToTop(this.player);
        if (this.chamberTitleText) this.children.bringToTop(this.chamberTitleText);
        if (this.statusText) this.children.bringToTop(this.statusText);
        if (this.hudStatusTitleText) this.children.bringToTop(this.hudStatusTitleText);
        if (this.hudScoreText) this.children.bringToTop(this.hudScoreText);
        if (this.hudLivesText) this.children.bringToTop(this.hudLivesText);
        if (this.hudKeyText) this.children.bringToTop(this.hudKeyText);
        if (this.controlsText) this.children.bringToTop(this.controlsText);
    }

    private renderKey(): void {
        if (this.keySprite) {
            this.keySprite.destroy();
            this.keySprite = null;
        }
        this.chainSprites.forEach((s) => s.destroy());
        this.chainSprites = [];

        if (!this.chamberKey) return;

        // Renderizar eslabones de cadena vertical desde la plataforma superior hasta la llave
        for (let y = this.chamberKey.ceilingGridY + 1; y < this.chamberKey.gridY; y++) {
            const chainImg = this.add.image(
                this.chamberKey.pixelX,
                y * GameConstants.TILE_SIZE,
                'item_chain'
            ).setOrigin(0, 0);
            this.chainSprites.push(chainImg);
        }

        // Renderizar la llave dorada colgada si no fue recogida
        if (!this.chamberKey.isCollected) {
            this.keySprite = this.add.image(
                this.chamberKey.pixelX,
                this.chamberKey.pixelY,
                'item_key'
            ).setOrigin(0, 0);

            // Animación sutil de balanceo retro suspendido
            this.tweens.add({
                targets: this.keySprite,
                y: this.chamberKey.pixelY + 3,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        this.bringUIElementsToTop();
    }

    /**
     * Detección de contacto en pleno salto con la llave dorada suspendida.
     */
    private checkKeyCollection(): void {
        if (!this.chamberKey || this.hasKey || this.chamberKey.isCollected || !this.player || this.player.isEliminated) {
            return;
        }

        if (this.chamberKey.checkOverlap(this.player.x, this.player.y, Player.HITBOX_WIDTH, Player.HITBOX_HEIGHT)) {
            const pts = this.chamberKey.collect();
            this.hasKey = true;
            this.currentScore += pts;
            if (this.chamber1Puzzle) {
                this.chamber1Puzzle.notifyKeyCollected();
            }

            // Animación retro de recogida
            if (this.keySprite) {
                this.tweens.add({
                    targets: this.keySprite,
                    scaleX: 1.4,
                    scaleY: 1.4,
                    alpha: 0,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.keySprite) {
                            this.keySprite.destroy();
                            this.keySprite = null;
                        }
                    }
                });
            }

            // Cambiar aspecto de la puerta de salida a abierta
            if (this.exitDoorSprite) {
                this.exitDoorSprite.setTexture('tile_door_open');
                this.tweens.add({
                    targets: this.exitDoorSprite,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    yoyo: true,
                    duration: 150
                });
            }

            this.showFloatingScore(
                this.chamberKey.pixelX + 16,
                this.chamberKey.pixelY,
                `+${pts} PTS! ¡LLAVE OBTENIDA!`
            );

            if (this.statusText) {
                this.statusText.setText('¡LLAVE OBTENIDA! La puerta de salida se ha abierto');
            }
            this.updateHUD();
        }
    }

    /**
     * Comprueba si el jugador toca la puerta de salida y gestiona el bloqueo o avance de nivel.
     */
    private checkExitDoorInteraction(): void {
        if (!this.player || this.player.isEliminated || this.isChamberCompleted) {
            return;
        }

        const pLeft = this.player.x - Player.HITBOX_WIDTH / 2;
        const pRight = this.player.x + Player.HITBOX_WIDTH / 2;
        const pTop = this.player.y - Player.HITBOX_HEIGHT;
        const pBottom = this.player.y;

        const minGridX = Math.floor(pLeft / GameConstants.TILE_SIZE);
        const maxGridX = Math.floor((pRight - 1) / GameConstants.TILE_SIZE);
        const minGridY = Math.floor(pTop / GameConstants.TILE_SIZE);
        const maxGridY = Math.floor((pBottom - 1) / GameConstants.TILE_SIZE);

        let touchingDoor = false;
        for (let gx = minGridX; gx <= maxGridX; gx++) {
            for (let gy = minGridY; gy <= maxGridY; gy++) {
                if (this.grid.isExitDoor(gx, gy)) {
                    touchingDoor = true;
                    break;
                }
            }
            if (touchingDoor) break;
        }

        if (!touchingDoor) return;

        const keyRequired = ChamberKeys.isKeyRequired(this.grid.currentChamber);
        if (keyRequired && !this.hasKey) {
            if (this.doorWarningCooldown <= 0) {
                this.doorWarningCooldown = 60; // 1 segundo a 60 FPS
                this.showFloatingScore(this.player.x, this.player.y - 20, '🔒 ¡PUERTA CERRADA!');
                if (this.statusText) {
                    this.statusText.setText('¡PUERTA CERRADA! Necesitas la llave colgada para salir');
                }
            }
        } else {
            this.completeChamber();
        }
    }

    private completeChamber(): void {
        this.isChamberCompleted = true;
        const completionBonus = 1000;
        this.currentScore += completionBonus;
        this.updateHUD();

        this.showFloatingScore(
            this.player.x,
            this.player.y - 30,
            `¡RECAMARA ${this.grid.currentChamber} COMPLETADA! +${completionBonus} PTS`
        );
        if (this.statusText) {
            this.statusText.setText(`¡VICTORIA! Recámara ${this.grid.currentChamber} superada`);
        }

        this.cameras.main.flash(350, 255, 235, 130);

        this.time.delayedCall(1600, () => {
            if (this.grid.currentChamber < GameConstants.TOTAL_CHAMBERS) {
                this.switchChamber(this.grid.currentChamber + 1);
            } else {
                if (this.statusText) {
                    this.statusText.setText('¡ENHORABUENA! ¡HAS COMPLETADO TODAS LAS RECÁMARAS!');
                }
            }
        });
    }

    private updateHUD(): void {
        if (!this.chamberTitleText || !this.statusText || !this.player) return;

        this.chamberTitleText.setText(
            `🏛️ RETRO PIRÁMIDE: ${this.grid.roomName} [Nivel ${this.grid.pyramidLevel}/4]`
        );

        let statusMsg: string;
        if (this.player.isEliminated) {
            statusMsg = this.player.currentLives <= 0
                ? '¡GAME OVER! Presiona [ESC/M] para volver al Menú'
                : '¡ELIMINADO! Presiona [R] para reintentar';
        } else {
            statusMsg = `Estado: ${this.player.currentState}`;
        }

        this.statusText.setText(statusMsg);

        // Actualizar HUD superior derecho (US-007 / US-025)
        if (this.hudScoreText) {
            const formattedScore = String(this.currentScore).padStart(6, '0');
            this.hudScoreText.setText(`PUNTOS: ${formattedScore}`);
        }

        if (this.hudLivesText) {
            const livesCount = Math.max(0, this.player.currentLives);
            const livesIcons = '❤️'.repeat(livesCount);
            this.hudLivesText.setText(`VIDAS: ${livesIcons} (${livesCount})`);
        }

        if (this.hudKeyText) {
            if (this.hasKey) {
                this.hudKeyText.setText('LLAVE: 🔑 SÍ');
                this.hudKeyText.setColor('#ffe26a');
            } else if (ChamberKeys.isKeyRequired(this.grid.currentChamber)) {
                this.hudKeyText.setText('LLAVE: 🔒 NO');
                this.hudKeyText.setColor('#ff9d5c');
            } else {
                this.hudKeyText.setText('LLAVE: ──');
                this.hudKeyText.setColor('#8a6b47');
            }
        }
    }

    /**
     * Renderiza los murales jeroglíficos diegéticos grabados en la roca de fondo para la Recámara 1.
     */
    private renderMurals(): void {
        this.muralSprites.forEach((sprite) => sprite.destroy());
        this.muralSprites = [];

        if (this.grid.currentChamber !== 1) return;

        // Mural Puzle 1 en Nivel 0 (columnas 7..9, fila 11): 96x32 px
        const mural1 = this.add.image(7 * GameConstants.TILE_SIZE, 11 * GameConstants.TILE_SIZE, 'mural_puzzle_1').setOrigin(0, 0);
        this.muralSprites.push(mural1);

        // Mural Puzle 2 en Nivel 1 (columnas 6..8, fila 7): 96x32 px
        const mural2 = this.add.image(6 * GameConstants.TILE_SIZE, 7 * GameConstants.TILE_SIZE, 'mural_puzzle_2').setOrigin(0, 0);
        this.muralSprites.push(mural2);
    }

    /**
     * Actualiza y sincroniza frame a frame la lógica de los puzles diegéticos de la Recámara 1.
     */
    private updateChamber1Puzzle(): void {
        if (!this.chamber1Puzzle || !this.player || this.player.isEliminated) return;

        // 1. Actualizar máquina de estados del puzzle (saltos sobre momia, temporizador petrificación)
        this.chamber1Puzzle.update(
            this.player.x,
            this.player.y,
            this.player.isJumping,
            this.mummies
        );

        // 2. Comprobar si se ha materializado el tesoro secreto y crearlo/mostrarlo si aún no tiene sprite
        if (this.chamber1Puzzle.isSecretTreasureSpawned && !this.chamber1Puzzle.isSecretTreasureCollected) {
            if (!this.secretTreasureSprite) {
                this.secretTreasureSprite = this.add.image(
                    this.chamber1Puzzle.secretTreasure.pixelX,
                    this.chamber1Puzzle.secretTreasure.pixelY,
                    'treasure_closed'
                ).setOrigin(0, 0);

                // Efecto de materialización divina
                this.tweens.add({
                    targets: this.secretTreasureSprite,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    yoyo: true,
                    duration: 200
                });
                this.bringUIElementsToTop();
            }

            // Chequeo de recolección del tesoro secreto
            const pts = this.chamber1Puzzle.checkSecretTreasureCollection(
                this.player.x,
                this.player.y,
                Player.HITBOX_WIDTH,
                Player.HITBOX_HEIGHT
            );
            if (pts > 0) {
                this.currentScore += pts;
                if (this.secretTreasureSprite) {
                    this.secretTreasureSprite.setTexture('treasure_open');
                    this.tweens.add({
                        targets: this.secretTreasureSprite,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        alpha: 0.8,
                        duration: 150
                    });
                }
                this.showFloatingScore(
                    this.chamber1Puzzle.secretTreasure.pixelX + 16,
                    this.chamber1Puzzle.secretTreasure.pixelY,
                    `+${pts} PTS! ¡TESORO SECRETO DEL FARAÓN!`
                );
                if (this.statusText) {
                    this.statusText.setText('¡PUZLE RESUELTO! Tesoro Secreto del Faraón reclamado');
                }
                this.updateHUD();
            }
        }

        // 3. Comprobar si se ha materializado la Gema Sagrada y crearla/mostrarla si aún no tiene sprite
        if (this.chamber1Puzzle.isGemSpawned && !this.chamber1Puzzle.isGemCollected) {
            if (!this.sacredGemSprite) {
                this.sacredGemSprite = this.add.image(
                    this.chamber1Puzzle.gemPixelX,
                    this.chamber1Puzzle.gemPixelY,
                    'item_gem'
                ).setOrigin(0, 0);

                // Flotación mística
                this.tweens.add({
                    targets: this.sacredGemSprite,
                    y: this.chamber1Puzzle.gemPixelY - 4,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.bringUIElementsToTop();
            }

            // Chequeo de recolección de la gema
            const gemPts = this.chamber1Puzzle.checkGemCollection(
                this.player.x,
                this.player.y,
                Player.HITBOX_WIDTH,
                Player.HITBOX_HEIGHT
            );
            if (gemPts > 0) {
                this.currentScore += gemPts;
                if (this.sacredGemSprite) {
                    this.tweens.add({
                        targets: this.sacredGemSprite,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            if (this.sacredGemSprite) {
                                this.sacredGemSprite.destroy();
                                this.sacredGemSprite = null;
                            }
                        }
                    });
                }
                this.showFloatingScore(
                    this.chamber1Puzzle.gemPixelX + 16,
                    this.chamber1Puzzle.gemPixelY,
                    `+${gemPts} PTS! ¡GEMA SAGRADA DE RA!`
                );
                if (this.statusText) {
                    this.statusText.setText('¡PUZLE RESUELTO! Gema Sagrada de Ra obtenida');
                }
                this.updateHUD();
            }
        }

        // 4. Procesar notificaciones pendientes
        const notifications = this.chamber1Puzzle.consumePendingNotifications();
        for (const notif of notifications) {
            this.showFloatingScore(notif.x, notif.y, notif.text);
        }
    }
}
