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
import { HUDGraphics } from '../graphics/HUDGraphics.ts';
import { Player } from '../entities/Player.ts';
import { Treasure } from '../entities/Treasure.ts';
import { Mummy } from '../entities/Mummy.ts';
import { MovingWall } from '../entities/MovingWall.ts';
import { Key } from '../entities/Key.ts';
import { ChamberTreasures } from '../grid/ChamberTreasures.ts';
import { ChamberMummies } from '../grid/ChamberMummies.ts';
import { ChamberMovingWalls } from '../grid/ChamberMovingWalls.ts';
import { ChamberMovingFloors } from '../grid/ChamberMovingFloors.ts';
import { ChamberKeys } from '../grid/ChamberKeys.ts';
import { MovingFloorTrap } from '../entities/MovingFloorTrap.ts';
import type { IChamberPuzzle } from '../puzzles/IChamberPuzzle.ts';
import { ChamberPuzzleFactory } from '../puzzles/ChamberPuzzleFactory.ts';
import { PuzzleProgressTracker } from '../puzzles/PuzzleProgressTracker.ts';
import { RetroAudio } from '../audio/RetroAudio.ts';
import { Chamber10LeverGate } from '../entities/Chamber10LeverGate.ts';

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

    // Pisos movedizos / trampas desmoronables de Nivel 1 (a partir de Recámara 5)
    private movingFloors: MovingFloorTrap[] = [];
    private movingFloorSprites: Phaser.GameObjects.Image[][] = [];

    // Mecánica especial de Recámara 10: Palanca del Faraón y Muro de Cúspide
    private chamber10Gate: Chamber10LeverGate | null = null;
    private chamber10LeverSprite: Phaser.GameObjects.Image | null = null;
    private chamber10GateWallSprites: Phaser.GameObjects.Image[] = [];
    private chamber10SarcophagusSprite: Phaser.GameObjects.Image | null = null;

    // Llave ancestral y puerta de salida
    private chamberKey: Key | null = null;
    private keySprite: Phaser.GameObjects.Image | null = null;
    private chainSprites: Phaser.GameObjects.Image[] = [];
    private exitDoorSprite: Phaser.GameObjects.Image | null = null;
    private hasKey: boolean = false;
    private isChamberCompleted: boolean = false;
    private doorWarningCooldown: number = 0;

    // Sistema de Puzles Diegéticos (Recámaras 1 a 4)
    private activePuzzle: IChamberPuzzle | null = null;
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
    private hudScoreText!: Phaser.GameObjects.Text;
    private hudLivesText!: Phaser.GameObjects.Text;
    private hudPuzzleText!: Phaser.GameObjects.Text;
    private hudPlayerLifeIcon!: Phaser.GameObjects.Image;
    private hudKeyIcon!: Phaser.GameObjects.Image;
    private hudSarcophagusIcon!: Phaser.GameObjects.Image;

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
        this.load.image('mural_ch1_p1', 'assets/mural_ch1_p1.png');
        this.load.image('mural_ch1_p2', 'assets/mural_ch1_p2.png');
        this.load.image('mural_ch2_p1', 'assets/mural_ch2_p1.png');
        this.load.image('mural_ch2_p2', 'assets/mural_ch2_p2.png');
        this.load.image('mural_ch3_p1', 'assets/mural_ch3_p1.png');
        this.load.image('mural_ch3_p2', 'assets/mural_ch3_p2.png');
        this.load.image('mural_ch4_p1', 'assets/mural_ch4_p1.png');
        this.load.image('mural_ch4_p2', 'assets/mural_ch4_p2.png');
        this.load.image('mural_ch5_p1', 'assets/mural_ch5_p1.png');
        this.load.image('mural_ch5_p2', 'assets/mural_ch5_p2.png');
        this.load.image('mural_ch6_p1', 'assets/mural_ch6_p1.png');
        this.load.image('mural_ch6_p2', 'assets/mural_ch6_p2.png');
        this.load.image('mural_ch7_p1', 'assets/mural_ch7_p1.png');
        this.load.image('mural_ch7_p2', 'assets/mural_ch7_p2.png');
        this.load.image('mural_ch8_p1', 'assets/mural_ch8_p1.png');
        this.load.image('mural_ch8_p2', 'assets/mural_ch8_p2.png');
        this.load.image('mural_ch9_p1', 'assets/mural_ch9_p1.png');
        this.load.image('mural_ch9_p2', 'assets/mural_ch9_p2.png');

        TileGraphics.generateAll(this);
        PlayerGraphics.generateAll(this);
        TreasureGraphics.generateAll(this);
        MummyGraphics.generateAll(this);
        MovingWallGraphics.generateAll(this);
        KeyGraphics.generateAll(this);
        HieroglyphGraphics.generateAll(this);
        HUDGraphics.generateAll(this);
        RetroAudio.preload(this);
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
        if (this.statusText) {
            this.statusText.setText('');
        }
        this.chamberKey = ChamberKeys.createKeyForChamber(this.initialChamber);

        // Sistema de Puzles Diegéticos (Recámaras 1 a 4)
        this.activePuzzle = ChamberPuzzleFactory.createPuzzleForChamber(this.initialChamber);

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

        // Cargar pisos movedizos dinámicos de Nivel 1 (a partir de Recámara 5)
        this.movingFloors = ChamberMovingFloors.createFloorsForChamber(this.initialChamber);
        this.renderMovingFloors();

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
            fontStyle: 'bold',
            color: '#f8f8fa',
            stroke: '#1c150b',
            strokeThickness: 3
        });

        this.statusText = this.add.text(12, 30, '', {
            fontFamily: 'Courier',
            fontSize: '13px',
            color: '#f0ede6',
            stroke: '#1c150b',
            strokeThickness: 2
        });

        // PUNTOS: situado a continuación del texto de Recámara X (se reposiciona dinámicamente)
        this.hudScoreText = this.add.text(0, 10, 'PUNTOS: 000000', {
            fontFamily: 'Courier',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ffe26a',
            stroke: '#1c150b',
            strokeThickness: 3
        });

        // Panel HUD Superior Derecho:
        // 1. Vidas: Icono del personaje (tamaño de corazones) + corazones
        this.hudLivesText = this.add.text(628, 9, '❤️❤️❤️ (3)', {
            fontFamily: 'Courier',
            fontSize: '12px',
            color: '#ffd2a5',
            stroke: '#1c150b',
            strokeThickness: 2
        }).setOrigin(1, 0);

        this.hudPlayerLifeIcon = this.add.image(530, 16, 'hud_player_life').setOrigin(0.5, 0.5);

        // 2. Sarcófago: Icono del sarcófago + 0/9
        this.hudPuzzleText = this.add.text(628, 28, '🔒 0/9', {
            fontFamily: 'Courier',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#71d4ff',
            stroke: '#1c150b',
            strokeThickness: 2
        }).setOrigin(1, 0);

        this.hudSarcophagusIcon = this.add.image(568, 35, 'hud_sarcophagus_icon').setOrigin(0.5, 0.5);

        // 3. Llave: Icono de llave grisada hasta recogerla
        this.hudKeyIcon = this.add.image(544, 35, 'hud_key_icon').setOrigin(0.5, 0.5);
        this.hudKeyIcon.setTint(0x555555);
        this.hudKeyIcon.setAlpha(0.35);

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

        if (this.initialChamber === 10) {
            this.setupChamber10Gate();
        }

        // Iniciar música de ambientación egipcia para las recámaras (suave y atmosférica)
        RetroAudio.playChamberMusic(this);
        this.input.once('pointerdown', () => {
            RetroAudio.playChamberMusic(this);
        });
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown', () => {
                RetroAudio.playChamberMusic(this);
            });
        }
    }

    update(): void {
        if (this.doorWarningCooldown > 0) {
            this.doorWarningCooldown--;
        }

        if (this.player) {
            this.updateMovingFloors();
            this.player.updateWithGrid(this.grid);
            this.updateMovingWalls();
            this.checkKeyCollection();
            this.checkExitDoorInteraction();
            this.checkTreasureCollection();
            this.updateActivePuzzle();
            this.updateMummies();
            this.checkMummyCollisions();
            this.updateChamber10Gate();
            this.updateHUD();
        }

        // Volver al Menú Principal con ESC o M
        if ((this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) ||
            (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM))) {
            RetroAudio.playMenuMusic(this);
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
     * Actualiza la lógica de los pisos movedizos / trampas de Nivel 1 (60 FPS, cero allocations).
     */
    private updateMovingFloors(): void {
        const playerX = this.player ? this.player.x : 0;
        const playerFeetY = this.player ? this.player.y : 0;
        const isEliminated = !this.player || this.player.isEliminated;

        for (let i = 0; i < this.movingFloors.length; i++) {
            const trap = this.movingFloors[i];
            trap.update(playerX, playerFeetY, isEliminated, this.grid);

            // Sincronizar visibilidad y temblor visual de los sprites de la trampa
            const sprites = this.movingFloorSprites[i];
            if (sprites) {
                const isVisible = !trap.isOpen;
                const shakeX = trap.shakeOffsetX;
                for (let sIdx = 0; sIdx < sprites.length; sIdx++) {
                    const col = trap.minCol + sIdx;
                    const spr = sprites[sIdx];
                    spr.setVisible(isVisible);
                    if (isVisible) {
                        spr.setPosition(col * GameConstants.TILE_SIZE + shakeX, trap.row * GameConstants.TILE_SIZE);
                    }
                }
            }
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
                    if (!wasOpen) {
                        RetroAudio.playDoorOpen(this);
                        if (this.activePuzzle) {
                            this.activePuzzle.notifyWallActivated(wall.id);
                        }
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
                const isPetrified = this.activePuzzle?.isMummyPetrified ?? false;
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
                    if (this.activePuzzle) {
                        this.activePuzzle.notifyTreasureCollected(treasure.id);
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
                    RetroAudio.playTreasure(this);
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
        if (this.statusText) {
            this.statusText.setText('');
        }
        this.chamberKey = ChamberKeys.createKeyForChamber(chamberNumber);

        // Sistema de Puzles Diegéticos
        this.activePuzzle = ChamberPuzzleFactory.createPuzzleForChamber(chamberNumber);
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

        this.movingFloors = ChamberMovingFloors.createFloorsForChamber(chamberNumber);
        this.renderMovingFloors();

        this.treasures = ChamberTreasures.createTreasuresForChamber(chamberNumber);
        this.renderTreasures();

        this.mummies = ChamberMummies.createMummiesForChamber(chamberNumber);
        this.renderMummies();

        this.chamberStartScore = this.currentScore;
        this.respawnPlayer();

        if (chamberNumber === 10) {
            this.setupChamber10Gate();
        } else {
            this.clearChamber10Gate();
        }
    }

    private respawnPlayer(): void {
        const startX = 2 * GameConstants.TILE_SIZE + 16;
        const startY = (GameConstants.GRID_ROWS - 1) * GameConstants.TILE_SIZE; // 448
        this.player.respawn(startX, startY);

        this.hasKey = false;
        this.isChamberCompleted = false;
        this.doorWarningCooldown = 0;
        if (this.statusText) {
            this.statusText.setText('');
        }
        if (this.chamberKey) {
            this.chamberKey.reset();
        }
        if (this.exitDoorSprite) {
            const doorTexture = ChamberKeys.isKeyRequired(this.grid.currentChamber) ? 'tile_door_locked' : 'tile_door_open';
            this.exitDoorSprite.setTexture(doorTexture);
        }
        this.renderKey();

        // Restablecer sistema de puzles de la recámara activa
        if (this.activePuzzle) {
            this.activePuzzle.reset();
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

        // Restablecer pisos movedizos de Nivel 1
        for (let i = 0; i < this.movingFloors.length; i++) {
            const trap = this.movingFloors[i];
            trap.reset(this.grid);

            const sprites = this.movingFloorSprites[i];
            if (sprites) {
                for (let sIdx = 0; sIdx < sprites.length; sIdx++) {
                    const col = trap.minCol + sIdx;
                    sprites[sIdx].setVisible(true);
                    sprites[sIdx].setPosition(col * GameConstants.TILE_SIZE, trap.row * GameConstants.TILE_SIZE);
                }
            }
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

        if (this.grid.currentChamber === 10) {
            this.setupChamber10Gate();
        }
    }

    /**
     * Inicializa y despliega la Palanca del Faraón, el Muro de la Cúspide y el Sarcófago en Recámara 10.
     */
    private setupChamber10Gate(): void {
        this.clearChamber10Gate();

        this.chamber10Gate = new Chamber10LeverGate();
        this.chamber10Gate.reset(this.grid);

        // 1. Renderizar la palanca suspendida en col 8, fila 3 (requiere salto desde Nivel 2)
        const leverX = this.chamber10Gate.leverWorldX;
        const leverY = this.chamber10Gate.leverWorldY;
        this.chamber10LeverSprite = this.add.image(leverX, leverY, 'tile_lever_up');
        this.chamber10LeverSprite.setDepth(20);

        // 2. Renderizar el muro que cierra la escalera a la nueva plataforma (col 13, filas 3 y 4)
        for (const row of Chamber10LeverGate.WALL_ROWS) {
            const spr = this.add.image(
                Chamber10LeverGate.WALL_GRID_X * GameConstants.TILE_SIZE + 16,
                row * GameConstants.TILE_SIZE + 16,
                'tile_pharaoh_gate'
            );
            spr.setDepth(15);
            this.chamber10GateWallSprites.push(spr);
        }

        // 3. Renderizar el Sarcófago del Faraón en la nueva plataforma Cúspide (col 16, fila 1)
        if (this.textures.exists('hud_sarcophagus_icon')) {
            this.chamber10SarcophagusSprite = this.add.image(
                16 * GameConstants.TILE_SIZE + 16,
                1 * GameConstants.TILE_SIZE + 16,
                'hud_sarcophagus_icon'
            );
            this.chamber10SarcophagusSprite.setScale(2.0); // 32x32 ceremonial
            this.chamber10SarcophagusSprite.setDepth(15);
        }

        const tracker = PuzzleProgressTracker.getInstance();
        if (!tracker.areAllPrerequisitePuzzlesSolved) {
            this.time.delayedCall(100, () => {
                const remaining = tracker.remainingPuzzlesCount;
                const solved = tracker.solvedPuzzlesCount;
                this.showFloatingScore(
                    leverX,
                    leverY - 24,
                    `🔒 FALTAN ${remaining} PUZZLES (${solved}/18)`
                );
                if (this.statusText) {
                    this.statusText.setText(
                        `🔒 PALANCA BLOQUEADA: Faltan resolver ${remaining} puzzles de las Recámaras 1 a 9 (${solved}/18)`
                    );
                }
            });
        }
    }

    /**
     * Limpia los elementos visuales de la palanca y muro de Recámara 10 al salir a otra recámara.
     */
    private clearChamber10Gate(): void {
        if (this.chamber10LeverSprite) {
            this.chamber10LeverSprite.destroy();
            this.chamber10LeverSprite = null;
        }
        for (const spr of this.chamber10GateWallSprites) {
            spr.destroy();
        }
        this.chamber10GateWallSprites = [];

        if (this.chamber10SarcophagusSprite) {
            this.chamber10SarcophagusSprite.destroy();
            this.chamber10SarcophagusSprite = null;
        }
        this.chamber10Gate = null;
    }

    /**
     * Detecta la activación de la palanca suspendida saltando en la Recámara 10.
     * Si no están todos los 18 puzles resueltos, muestra el mensaje con los puzles faltantes.
     * Si están todos resueltos, abre el muro y concede acceso a la Cúspide.
     */
    private updateChamber10Gate(): void {
        if (!this.chamber10Gate || this.grid.currentChamber !== 10) return;

        this.chamber10Gate.update();

        const tracker = PuzzleProgressTracker.getInstance();
        const result = this.chamber10Gate.tryInteract(this.player, tracker, this.grid);

        if (result) {
            if (!result.success) {
                // Palanca bloqueada: mensaje indicando cuántos puzles faltan por resolver
                this.showFloatingScore(
                    this.chamber10Gate.leverWorldX,
                    this.chamber10Gate.leverWorldY - 24,
                    `🔒 FALTAN ${result.remainingPuzzles} PUZZLES (${result.solvedPuzzles}/18)`
                );
                if (this.statusText) {
                    this.statusText.setText(result.message);
                }
                RetroAudio.playDoorOpen(this);

                // Sacudida visual de resistencia de la palanca bloqueada
                if (this.chamber10LeverSprite) {
                    this.tweens.add({
                        targets: this.chamber10LeverSprite,
                        x: this.chamber10Gate.leverWorldX + 4,
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    });
                }
            } else {
                // ¡Éxito! Todos los puzles resueltos y palanca accionada
                this.showFloatingScore(
                    this.chamber10Gate.leverWorldX,
                    this.chamber10Gate.leverWorldY - 24,
                    '✨ ¡MURO ABIERTO!'
                );
                if (this.statusText) {
                    this.statusText.setText(result.message);
                }
                RetroAudio.playDoorOpen(this);
                RetroAudio.playPuzzleSolved(this);

                if (this.chamber10LeverSprite) {
                    this.chamber10LeverSprite.setTexture('tile_lever_down');
                }

                // Animar apertura del muro deslizándose hacia arriba
                for (const spr of this.chamber10GateWallSprites) {
                    this.tweens.add({
                        targets: spr,
                        y: spr.y - 32,
                        alpha: 0,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => {
                            spr.destroy();
                        }
                    });
                }
                this.chamber10GateWallSprites = [];

                // Re-renderizar los tiles para mostrar la escalera abierta
                this.renderChamber();
            }
        }
    }

    private renderChamber(): void {
        this.tileSprites.forEach((sprite) => sprite.destroy());
        this.tileSprites = [];
        this.exitDoorSprite = null;

        const size = GameConstants.TILE_SIZE;

        for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
            for (let x = 0; x < GameConstants.GRID_COLUMNS; x++) {
                if (ChamberMovingFloors.isMovingFloorTile(this.grid.currentChamber, x, y)) {
                    continue;
                }
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

    private renderMovingFloors(): void {
        for (const spriteGroup of this.movingFloorSprites) {
            spriteGroup.forEach((s) => s.destroy());
        }
        this.movingFloorSprites = [];

        for (const trap of this.movingFloors) {
            const trapSprites: Phaser.GameObjects.Image[] = [];
            for (let col = trap.minCol; col <= trap.maxCol; col++) {
                const spr = this.add.image(
                    col * GameConstants.TILE_SIZE,
                    trap.row * GameConstants.TILE_SIZE,
                    'tile_moving_floor'
                ).setOrigin(0, 0);
                trapSprites.push(spr);
            }
            this.movingFloorSprites.push(trapSprites);
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
        this.movingFloorSprites.forEach((group) => group.forEach((s) => this.children.bringToTop(s)));
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
        if (this.hudScoreText) this.children.bringToTop(this.hudScoreText);
        if (this.statusText) this.children.bringToTop(this.statusText);
        if (this.hudPlayerLifeIcon) this.children.bringToTop(this.hudPlayerLifeIcon);
        if (this.hudLivesText) this.children.bringToTop(this.hudLivesText);
        if (this.hudKeyIcon) this.children.bringToTop(this.hudKeyIcon);
        if (this.hudSarcophagusIcon) this.children.bringToTop(this.hudSarcophagusIcon);
        if (this.hudPuzzleText) this.children.bringToTop(this.hudPuzzleText);
        if (this.controlsText) this.children.bringToTop(this.controlsText);
        if (this.chamber10LeverSprite) this.children.bringToTop(this.chamber10LeverSprite);
        this.chamber10GateWallSprites.forEach((s) => this.children.bringToTop(s));
        if (this.chamber10SarcophagusSprite) this.children.bringToTop(this.chamber10SarcophagusSprite);
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
            if (this.activePuzzle) {
                this.activePuzzle.notifyKeyCollected();
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
                RetroAudio.playDoorOpen(this);
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
            RetroAudio.playKey(this);
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
        RetroAudio.playExit(this);

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
            `${this.grid.roomName} [Nivel ${this.grid.pyramidLevel}/4]`
        );

        if (this.player.isEliminated) {
            const statusMsg = this.player.currentLives <= 0
                ? '¡GAME OVER! Presiona [ESC/M] para volver al Menú'
                : '¡ELIMINADO! Presiona [R] para reintentar';
            this.statusText.setText(statusMsg);
        } else if (
            this.statusText.text.startsWith('Estado:') ||
            this.statusText.text.includes('ELIMINADO') ||
            this.statusText.text.includes('GAME OVER')
        ) {
            this.statusText.setText('');
        }

        // PUNTOS: a continuación del texto de Recámara
        if (this.hudScoreText) {
            const formattedScore = String(this.currentScore).padStart(6, '0');
            this.hudScoreText.setText(`PUNTOS: ${formattedScore}`);
            this.hudScoreText.setPosition(
                this.chamberTitleText.x + this.chamberTitleText.width + 16,
                10
            );
        }

        if (this.hudLivesText) {
            const livesCount = Math.max(0, this.player.currentLives);
            const livesIcons = '❤️'.repeat(livesCount);
            this.hudLivesText.setText(`${livesIcons} (${livesCount})`);
            if (this.hudPlayerLifeIcon) {
                this.hudPlayerLifeIcon.setPosition(
                    628 - this.hudLivesText.width - 12,
                    16
                );
            }
        }

        if (this.hudPuzzleText) {
            const tracker = PuzzleProgressTracker.getInstance();
            const count = tracker.completedChambersCount;
            if (tracker.isChamber10Unlocked) {
                this.hudPuzzleText.setText('🔓 LISTO');
                this.hudPuzzleText.setColor('#ffe26a');
            } else {
                this.hudPuzzleText.setText(`🔒 ${count}/9`);
                this.hudPuzzleText.setColor('#71d4ff');
            }
            if (this.hudSarcophagusIcon) {
                this.hudSarcophagusIcon.setPosition(
                    628 - this.hudPuzzleText.width - 12,
                    35
                );
            }
        }

        if (this.hudKeyIcon && this.hudSarcophagusIcon) {
            this.hudKeyIcon.setPosition(
                this.hudSarcophagusIcon.x - 22,
                35
            );
            if (this.hasKey) {
                this.hudKeyIcon.clearTint();
                this.hudKeyIcon.setAlpha(1.0);
            } else {
                this.hudKeyIcon.setTint(0x555555);
                this.hudKeyIcon.setAlpha(0.35);
            }
        }
    }

    /**
     * Renderiza los murales jeroglíficos diegéticos grabados en la roca de fondo para las Recámaras 1 a 9.
     * Tienen fondo transparente y opacidad suave para fundirse orgánicamente con el muro de piedra.
     */
    private renderMurals(): void {
        this.muralSprites.forEach((sprite) => sprite.destroy());
        this.muralSprites = [];

        const chamber = this.grid.currentChamber;
        if (chamber < 1 || chamber > 9) return;

        const mural1Key = `mural_ch${chamber}_p1`;
        const mural2Key = `mural_ch${chamber}_p2`;

        // Coordenadas de los murales adaptadas a cada recámara para evitar colisiones con plataformas
        let mural1Col = 7;
        let mural1Row = 11;
        let mural2Col = 11;
        let mural2Row = 2;

        if (chamber === 2 || chamber === 4) {
            mural2Col = 7;
            mural2Row = 3;
        } else if (chamber === 5 || chamber === 7) {
            mural1Row = 12;
            mural2Col = 10;
            mural2Row = 2;
        } else if (chamber === 6) {
            mural1Row = 12;
            mural2Col = 6;
            mural2Row = 2;
        } else if (chamber === 8) {
            mural1Row = 12;
            mural2Col = 6;
            mural2Row = 1;
        } else if (chamber === 9) {
            mural1Row = 12;
            mural2Col = 9;
            mural2Row = 1;
        }

        // Mural Puzle 1 en Nivel 0 (columnas 7..10): 128x32 px
        const mural1 = this.add.image(mural1Col * GameConstants.TILE_SIZE, mural1Row * GameConstants.TILE_SIZE, mural1Key)
            .setOrigin(0, 0)
            .setAlpha(0.60)
            .setDepth(-10);
        this.muralSprites.push(mural1);

        // Mural Puzle 2 en Plataforma Superior: 128x32 px
        const mural2 = this.add.image(mural2Col * GameConstants.TILE_SIZE, mural2Row * GameConstants.TILE_SIZE, mural2Key)
            .setOrigin(0, 0)
            .setAlpha(0.60)
            .setDepth(-10);
        this.muralSprites.push(mural2);
    }

    /**
     * Actualiza y sincroniza frame a frame la lógica de los puzles diegéticos de la recámara activa.
     */
    private updateActivePuzzle(): void {
        if (!this.activePuzzle || !this.player || this.player.isEliminated) return;

        // 1. Actualizar máquina de estados del puzzle (saltos sobre momia, temporizador petrificación)
        this.activePuzzle.update(
            this.player.x,
            this.player.y,
            this.player.isJumping,
            this.mummies
        );

        // 2. Comprobar si se ha materializado el tesoro secreto y crearlo/mostrarlo si aún no tiene sprite
        if (this.activePuzzle.isSecretTreasureSpawned && !this.activePuzzle.isSecretTreasureCollected) {
            if (!this.secretTreasureSprite) {
                this.secretTreasureSprite = this.add.image(
                    this.activePuzzle.secretTreasure.pixelX,
                    this.activePuzzle.secretTreasure.pixelY,
                    'treasure_closed'
                ).setOrigin(0, 0);

                RetroAudio.playPuzzleSolved(this);

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
            const pts = this.activePuzzle.checkSecretTreasureCollection(
                this.player.x,
                this.player.y,
                Player.HITBOX_WIDTH,
                Player.HITBOX_HEIGHT
            );
            if (pts > 0) {
                this.currentScore += pts;
                PuzzleProgressTracker.getInstance().markPuzzle1Solved(this.grid.currentChamber);
                const tracker = PuzzleProgressTracker.getInstance();
                if (tracker.isChamberCompleted(this.grid.currentChamber)) {
                    this.showFloatingScore(
                        this.player.x,
                        this.player.y - 45,
                        `¡RECÁMARA ${this.grid.currentChamber} PURIFICADA! (${tracker.completedChambersCount}/9)`
                    );
                }
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
                    this.activePuzzle.secretTreasure.pixelX + 16,
                    this.activePuzzle.secretTreasure.pixelY,
                    `+${pts} PTS! ¡TESORO SECRETO DEL FARAÓN!`
                );
                if (this.statusText) {
                    this.statusText.setText('¡PUZLE RESUELTO! Tesoro Secreto del Faraón reclamado');
                }
                this.updateHUD();
                RetroAudio.playTreasure(this);
            }
        }

        // 3. Comprobar si se ha materializado la Gema Sagrada y crearla/mostrarla si aún no tiene sprite
        if (this.activePuzzle.isGemSpawned && !this.activePuzzle.isGemCollected) {
            if (!this.sacredGemSprite) {
                this.sacredGemSprite = this.add.image(
                    this.activePuzzle.gemPixelX,
                    this.activePuzzle.gemPixelY,
                    'item_gem'
                ).setOrigin(0, 0);

                RetroAudio.playPuzzleSolved(this);

                // Flotación mística
                this.tweens.add({
                    targets: this.sacredGemSprite,
                    y: this.activePuzzle.gemPixelY - 4,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.bringUIElementsToTop();
            }

            // Chequeo de recolección de la gema
            const gemPts = this.activePuzzle.checkGemCollection(
                this.player.x,
                this.player.y,
                Player.HITBOX_WIDTH,
                Player.HITBOX_HEIGHT
            );
            if (gemPts > 0) {
                this.currentScore += gemPts;
                PuzzleProgressTracker.getInstance().markPuzzle2Solved(this.grid.currentChamber);
                const tracker = PuzzleProgressTracker.getInstance();
                if (tracker.isChamberCompleted(this.grid.currentChamber)) {
                    this.showFloatingScore(
                        this.player.x,
                        this.player.y - 45,
                        `¡RECÁMARA ${this.grid.currentChamber} PURIFICADA! (${tracker.completedChambersCount}/9)`
                    );
                }
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
                    this.activePuzzle.gemPixelX + 16,
                    this.activePuzzle.gemPixelY,
                    `+${gemPts} PTS! ¡GEMA SAGRADA DE RA!`
                );
                if (this.statusText) {
                    this.statusText.setText('¡PUZLE RESUELTO! Gema Sagrada de Ra obtenida');
                }
                this.updateHUD();
                RetroAudio.playGem(this);
            }
        }

        // 4. Procesar notificaciones pendientes
        const notifications = this.activePuzzle.consumePendingNotifications();
        for (const notif of notifications) {
            this.showFloatingScore(notif.x, notif.y, notif.text);
        }
    }
}
