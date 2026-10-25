import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';
import { Direction } from '../core/Direction.ts';
import { RoomGrid } from '../grid/RoomGrid.ts';
import { PlayerState } from './PlayerState.ts';
import { PlayerConstants } from './PlayerConstants.ts';
import { GamepadManager, type PlayerInputState } from '../input/GamepadManager.ts';

/**
 * Entidad del arqueólogo protagonista.
 * Implementa la física determinista, máquina de estados, escalada por escaleras,
 * saltos parabólicos arcade y control de caídas letales fiel a RetroGamePiramid.
 * 
 * Coordenadas:
 * - this.x representa el centro horizontal del personaje (ancho 32px, hitbox 28px).
 * - this.y representa la posición de los pies del personaje (setOrigin(0.5, 1.0)).
 * De este modo, cuando el jugador está sobre una plataforma en fila R, this.y = R * 32 exactamente,
 * garantizando cero holgura (gap) con el suelo.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
    public static readonly HITBOX_WIDTH = PlayerConstants.HITBOX_WIDTH;
    public static readonly HITBOX_HEIGHT = PlayerConstants.HITBOX_HEIGHT;
    public static readonly WALK_SPEED = PlayerConstants.WALK_SPEED;
    public static readonly CLIMB_SPEED = PlayerConstants.CLIMB_SPEED;
    public static readonly JUMP_DURATION_FRAMES = PlayerConstants.JUMP_DURATION_FRAMES;
    public static readonly JUMP_HEIGHT_PIXELS = PlayerConstants.JUMP_HEIGHT_PIXELS;
    public static readonly JUMP_HORIZONTAL_DISTANCE = PlayerConstants.JUMP_HORIZONTAL_DISTANCE;
    public static readonly GRAVITY = PlayerConstants.GRAVITY;
    public static readonly MAX_FALL_SPEED = PlayerConstants.MAX_FALL_SPEED;
    public static readonly MAX_SAFE_FALL_DISTANCE = PlayerConstants.MAX_SAFE_FALL_DISTANCE;
    public static readonly INITIAL_LIVES = PlayerConstants.INITIAL_LIVES;

    // Estado y orientación
    private playerState: PlayerState = PlayerState.Idle;
    private facing: Direction = Direction.Right;
    private lives: number = Player.INITIAL_LIVES;
    private animationTimer: number = 0;

    // Cinemática de salto arcade determinista
    private verticalVelocity: number = 0;
    private jumpTimer: number = 0;
    private jumpStartX: number = 0;
    private jumpStartY: number = 0;
    private jumpDirection: Direction = Direction.None;

    // Control de caídas y letalidad
    private fallStartY: number = 0;
    private fallStartPlatformLevel: number = -1;

    // Teclas
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(scene: Phaser.Scene, startX: number, startY: number) {
        super(scene, startX, startY, 'player_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Origen en el centro horizontal y en la base inferior (pies)
        this.setOrigin(0.5, 1.0);
        this.setCollideWorldBounds(true);
        this.setBounce(0);

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(Player.HITBOX_WIDTH, Player.HITBOX_HEIGHT);
            body.setOffset((32 - Player.HITBOX_WIDTH) / 2, 0);
            body.setAllowGravity(false);
        }

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }

        this.fallStartY = startY;
    }

    public get currentState(): PlayerState {
        return this.playerState;
    }

    public get fallLevel(): number {
        return this.fallStartPlatformLevel;
    }

    public get currentLives(): number {
        return this.lives;
    }

    public get currentFacing(): Direction {
        return this.facing;
    }

    public get isEliminated(): boolean {
        return this.playerState === PlayerState.Eliminated;
    }

    public loseLife(): void {
        if (this.lives > 0) {
            this.lives--;
        }
    }

    public resetLives(): void {
        this.lives = Player.INITIAL_LIVES;
    }

    public eliminate(): void {
        if (this.playerState !== PlayerState.Eliminated) {
            this.playerState = PlayerState.Eliminated;
            this.loseLife();
            this.setTexture('player_dead');
        }
    }

    public respawn(x: number, y: number): void {
        this.setPosition(x, y);
        this.verticalVelocity = 0;
        this.jumpTimer = 0;
        this.fallStartY = y;
        this.fallStartPlatformLevel = -1;
        this.playerState = PlayerState.Idle;
        this.setTexture('player_idle');
    }

    /**
     * Bucle de actualización principal con simulación determinista.
     * Soporta teclado (flechas y espacio) y joystick/gamepad físico (stick, D-pad y botón de acción).
     * La tecla o dirección ARRIBA NO se usa para saltar.
     */
    public updateWithGrid(grid: RoomGrid, customInput?: PlayerInputState): void {
        if (this.playerState === PlayerState.Eliminated) {
            this.setTexture('player_dead');
            return;
        }

        this.animationTimer++;

        let isLeftDown: boolean;
        let isRightDown: boolean;
        let isUpDown: boolean;
        let isDownDown: boolean;
        let isJumpPressed: boolean;

        if (customInput) {
            isLeftDown = customInput.left;
            isRightDown = customInput.right;
            isUpDown = customInput.up;
            isDownDown = customInput.down;
            isJumpPressed = customInput.jump;
        } else {
            const pad = GamepadManager.pollPlayerInput(this.scene);
            isLeftDown = !!this.cursors?.left.isDown || pad.left;
            isRightDown = !!this.cursors?.right.isDown || pad.right;
            isUpDown = !!this.cursors?.up.isDown || pad.up;
            isDownDown = !!this.cursors?.down.isDown || pad.down;

            // REGLA ESTRICTA: El salto SOLO se inicia con Espacio o botón de joystick.
            // La dirección ARRIBA NO se usa para saltar.
            isJumpPressed = !!this.cursors?.space.isDown || pad.jump;
        }

        switch (this.playerState) {
            case PlayerState.Idle:
            case PlayerState.Walking:
                this.updateGrounded(grid, isLeftDown, isRightDown, isUpDown, isDownDown, isJumpPressed);
                break;
            case PlayerState.Climbing:
                this.updateClimbing(grid, isLeftDown, isRightDown, isUpDown, isDownDown, isJumpPressed);
                break;
            case PlayerState.Jumping:
                this.updateJumping(grid);
                break;
            case PlayerState.Falling:
                this.updateFalling(grid, isLeftDown, isRightDown);
                break;
        }

        this.updateVisualFrame();
    }

    private updateGrounded(
        grid: RoomGrid,
        left: boolean,
        right: boolean,
        up: boolean,
        down: boolean,
        jump: boolean
    ): void {
        // 1. Agarre e interacción con escaleras
        if (up || down) {
            if (this.tryEnterLadder(grid, up, down)) {
                this.playerState = PlayerState.Climbing;
                const moveY = up ? -Player.CLIMB_SPEED : Player.CLIMB_SPEED;
                this.y += moveY;
                this.fallStartY = this.y;
                return;
            }
        }

        // Si ya está alineado en escalera y no hay soporte firme debajo, agarrar escalera
        if (this.isOnLadder(grid, this.x, this.y) && !this.isGrounded(grid, this.x, this.y)) {
            this.snapToLadderCenter();
            this.playerState = PlayerState.Climbing;
            this.fallStartY = this.y;
            return;
        }

        // 2. Detección de caída libre (caminar al vacío)
        if (!this.isGrounded(grid, this.x, this.y)) {
            this.playerState = PlayerState.Falling;
            this.verticalVelocity = 0;
            this.fallStartY = this.y;
            this.fallStartPlatformLevel = grid.getPlatformLevel(this.y - 32);
            return;
        }

        this.fallStartY = this.y;
        this.fallStartPlatformLevel = grid.getPlatformLevel(this.y - 32);

        // 3. Salto arcade determinista
        if (jump) {
            this.startJump(left, right, grid);
            return;
        }

        // 4. Desplazamiento horizontal
        let moveX = 0;
        if (left) {
            moveX -= Player.WALK_SPEED;
            this.facing = Direction.Left;
        }
        if (right) {
            moveX += Player.WALK_SPEED;
            this.facing = Direction.Right;
        }

        if (moveX !== 0) {
            this.playerState = PlayerState.Walking;
            this.applyHorizontalMovement(grid, moveX);

            // Tras caminar, verificar si cayó al vacío
            if (!this.isGrounded(grid, this.x, this.y) && !this.isOnLadder(grid, this.x, this.y)) {
                this.playerState = PlayerState.Falling;
                this.verticalVelocity = 0;
                this.fallStartY = this.y;
                this.fallStartPlatformLevel = grid.getPlatformLevel(this.y - 32);

                // Acomodar al borde del foso (slip off ledge)
                const rowBelow = Math.round(this.y / GameConstants.TILE_SIZE);
                if (moveX < 0) {
                    const rightLedgeCol = Math.floor((this.x + 13) / GameConstants.TILE_SIZE);
                    if (grid.isSolid(rightLedgeCol, rowBelow)) {
                        this.x = rightLedgeCol * GameConstants.TILE_SIZE - 14;
                    }
                } else if (moveX > 0) {
                    const leftLedgeCol = Math.floor((this.x - 13) / GameConstants.TILE_SIZE);
                    if (grid.isSolid(leftLedgeCol, rowBelow)) {
                        this.x = (leftLedgeCol + 1) * GameConstants.TILE_SIZE + 14;
                    }
                }
            }
        } else {
            this.playerState = PlayerState.Idle;
        }
    }

    private updateClimbing(
        grid: RoomGrid,
        left: boolean,
        right: boolean,
        up: boolean,
        down: boolean,
        jump: boolean
    ): void {
        if (jump) {
            this.startJump(left, right, grid);
            return;
        }

        let moveY = 0;
        if (up) moveY -= Player.CLIMB_SPEED;
        if (down) moveY += Player.CLIMB_SPEED;

        const centerCol = Math.floor(this.x / GameConstants.TILE_SIZE);

        if (moveY < 0) {
            // Subiendo: verificar si alcanza la superficie superior de la plataforma
            const currentFootRow = Math.round(this.y / GameConstants.TILE_SIZE);
            const topLadderRow = this.getTopLadderRow(grid, centerCol, currentFootRow);
            const platformTopY = topLadderRow * GameConstants.TILE_SIZE;

            const newY = this.y + moveY;
            if (newY <= platformTopY) {
                // Llegó arriba: posar pies limpiamente sobre la plataforma
                this.y = platformTopY;
                this.fallStartY = this.y;
                this.playerState = PlayerState.Idle;
                return;
            }

            if (this.collidesWithSolid(grid, this.x, newY)) {
                const topTileY = Math.floor((newY - 32) / GameConstants.TILE_SIZE);
                this.y = (topTileY + 1) * GameConstants.TILE_SIZE + 32;
            } else {
                this.y = newY;
            }
            this.fallStartY = this.y;
        } else if (moveY > 0) {
            // Bajando: verificar llegada al suelo inferior
            const newY = this.y + moveY;
            const bottomTileY = Math.floor(newY / GameConstants.TILE_SIZE);

            if (grid.isSolid(centerCol, bottomTileY)) {
                this.y = bottomTileY * GameConstants.TILE_SIZE;
                this.fallStartY = this.y;
                this.playerState = PlayerState.Idle;
                return;
            }

            if (this.collidesWithSolid(grid, this.x, newY)) {
                this.y = bottomTileY * GameConstants.TILE_SIZE;
                this.fallStartY = this.y;
                this.playerState = PlayerState.Idle;
                return;
            }

            this.y = newY;
            this.fallStartY = this.y;
        }

        // Desmontarse a los lados si camina hacia una plataforma
        if (left || right) {
            const sideMove = left ? -Player.WALK_SPEED : Player.WALK_SPEED;
            const targetX = this.x + sideMove;
            if (!this.collidesWithSolid(grid, targetX, this.y)) {
                this.x = targetX;
                this.facing = left ? Direction.Left : Direction.Right;
                if (!this.isOnLadder(grid, this.x, this.y)) {
                    if (this.isGrounded(grid, this.x, this.y)) {
                        this.fallStartY = this.y;
                        this.playerState = PlayerState.Walking;
                    } else {
                        this.playerState = PlayerState.Falling;
                        this.verticalVelocity = 0;
                        this.fallStartY = this.y;
                    }
                }
            }
        }
    }

    private startJump(left: boolean, right: boolean, grid: RoomGrid): void {
        this.playerState = PlayerState.Jumping;
        this.jumpTimer = 0;
        this.jumpStartX = this.x;
        this.jumpStartY = this.y;
        this.fallStartY = this.y;
        this.fallStartPlatformLevel = grid.getPlatformLevel(this.y - 32);

        if (right) {
            this.jumpDirection = Direction.Right;
            this.facing = Direction.Right;
        } else if (left) {
            this.jumpDirection = Direction.Left;
            this.facing = Direction.Left;
        } else {
            this.jumpDirection = Direction.None;
        }
    }

    private updateJumping(grid: RoomGrid): void {
        this.jumpTimer++;
        const t = this.jumpTimer / Player.JUMP_DURATION_FRAMES;

        // Trayectoria parabólica: offset = 4 * h * t * (1 - t)
        const parabolaOffset = 4 * Player.JUMP_HEIGHT_PIXELS * t * (1 - t);
        const targetY = this.jumpStartY - parabolaOffset;

        let targetX = this.jumpStartX;
        if (this.jumpDirection === Direction.Right) {
            targetX += Player.JUMP_HORIZONTAL_DISTANCE * t;
        } else if (this.jumpDirection === Direction.Left) {
            targetX -= Player.JUMP_HORIZONTAL_DISTANCE * t;
        }

        // Comprobación horizontal
        if (!this.collidesWithSolid(grid, targetX, this.y)) {
            this.x = targetX;
        }

        // Comprobación vertical
        if (targetY < this.y) {
            // Ascenso (verificar techo)
            if (!this.collidesWithSolid(grid, this.x, targetY)) {
                this.y = targetY;
            } else {
                this.playerState = PlayerState.Falling;
                this.verticalVelocity = 0;
                this.fallStartY = this.jumpStartY;
                this.fallStartPlatformLevel = grid.getPlatformLevel(this.jumpStartY - 32);
                return;
            }
        } else {
            // Descenso
            this.y = targetY;
        }

        // Al finalizar la duración del salto
        if (this.jumpTimer >= Player.JUMP_DURATION_FRAMES) {
            if (this.isGrounded(grid, this.x, this.y)) {
                const landRow = Math.round(this.y / GameConstants.TILE_SIZE);
                this.y = landRow * GameConstants.TILE_SIZE;
                this.fallStartY = this.y;
                this.playerState = PlayerState.Idle;
            } else if (this.isOnLadder(grid, this.x, this.y)) {
                this.snapToLadderCenter();
                this.playerState = PlayerState.Climbing;
            } else {
                this.playerState = PlayerState.Falling;
                this.verticalVelocity = 0;
                this.fallStartY = this.jumpStartY;
                this.fallStartPlatformLevel = grid.getPlatformLevel(this.jumpStartY - 32);
            }
        }
    }

    private updateFalling(grid: RoomGrid, left: boolean, right: boolean): void {
        this.verticalVelocity = Math.min(this.verticalVelocity + Player.GRAVITY, Player.MAX_FALL_SPEED);
        const newY = this.y + this.verticalVelocity;

        const landTileY = Math.floor((newY - 0.1) / GameConstants.TILE_SIZE);
        const landingY = landTileY * GameConstants.TILE_SIZE;

        if (this.isGrounded(grid, this.x, landingY) || this.isGrounded(grid, this.x, newY)) {
            this.landOnSurface(grid, landingY);
            return;
        }

        this.y = newY;

        // Control aéreo limitado
        if (left) {
            const tx = this.x - Player.WALK_SPEED * 0.75;
            if (!this.collidesWithSolid(grid, tx, this.y)) this.x = tx;
        } else if (right) {
            const tx = this.x + Player.WALK_SPEED * 0.75;
            if (!this.collidesWithSolid(grid, tx, this.y)) this.x = tx;
        }

        // Posibilidad de agarrar escalera en el aire
        if (this.isOnLadder(grid, this.x, this.y)) {
            this.snapToLadderCenter();
            this.playerState = PlayerState.Climbing;
            this.verticalVelocity = 0;
            this.fallStartY = this.y;
        }
    }

    private landOnSurface(grid: RoomGrid, landingY: number): void {
        const fallDistance = landingY - this.fallStartY;
        this.y = landingY;
        this.verticalVelocity = 0;

        const landLevel = grid.getPlatformLevel(landingY - 32);
        const startLevel = this.fallStartPlatformLevel;

        // Dificultad [US-023]: Si cae de una altura mayor a la que puede saltar (56 px)
        // o si cae por algún espacio de plataformas de nivel 1 o superior hacia un nivel inferior, pierde 1 vida.
        let isLethal = false;
        if (fallDistance > Player.MAX_SAFE_FALL_DISTANCE) {
            isLethal = true;
        } else if (startLevel !== -1 && landLevel !== -1 && startLevel > landLevel) {
            isLethal = true;
        }

        if (isLethal) {
            this.eliminate();
        } else {
            this.playerState = PlayerState.Idle;
            this.fallStartY = landingY;
            this.fallStartPlatformLevel = landLevel;
        }
    }

    private applyHorizontalMovement(grid: RoomGrid, deltaX: number): void {
        const targetX = this.x + deltaX;

        if (!this.collidesWithSolid(grid, targetX, this.y)) {
            this.x = targetX;
        } else {
            if (deltaX > 0) {
                const rightEdge = targetX + 13;
                const hitCol = Math.floor(rightEdge / GameConstants.TILE_SIZE);
                this.x = hitCol * GameConstants.TILE_SIZE - 14;
            } else if (deltaX < 0) {
                const leftEdge = targetX - 13;
                const hitCol = Math.floor(leftEdge / GameConstants.TILE_SIZE);
                this.x = (hitCol + 1) * GameConstants.TILE_SIZE + 14;
            }
        }
    }

    private collidesWithSolid(grid: RoomGrid, testX: number, testY: number): boolean {
        const leftCol = Math.floor((testX - 13) / GameConstants.TILE_SIZE);
        const rightCol = Math.floor((testX + 13) / GameConstants.TILE_SIZE);
        const topRow = Math.floor((testY - 31) / GameConstants.TILE_SIZE);
        const bottomRow = Math.floor((testY - 2) / GameConstants.TILE_SIZE);

        for (let r = topRow; r <= bottomRow; r++) {
            for (let c = leftCol; c <= rightCol; c++) {
                if (grid.isSolid(c, r)) return true;
            }
        }
        return false;
    }

    private isGrounded(grid: RoomGrid, testX: number, testY: number): boolean {
        const footY = testY;
        const rowBelow = Math.round(footY / GameConstants.TILE_SIZE);

        const distToRow = Math.abs(footY - rowBelow * GameConstants.TILE_SIZE);
        if (distToRow > 4.0) return false;

        const leftCol = Math.floor((testX - 10) / GameConstants.TILE_SIZE);
        const rightCol = Math.floor((testX + 10) / GameConstants.TILE_SIZE);

        const leftSupported = grid.isSolid(leftCol, rowBelow) || this.isLadderTop(grid, leftCol, rowBelow);
        const rightSupported = grid.isSolid(rightCol, rowBelow) || this.isLadderTop(grid, rightCol, rowBelow);

        return leftSupported || rightSupported;
    }

    private isLadderTop(grid: RoomGrid, col: number, row: number): boolean {
        if (!grid.inBounds(col, row)) return false;
        return grid.isLadder(col, row) && (row === 0 || !grid.isLadder(col, row - 1));
    }

    private isOnLadder(grid: RoomGrid, testX: number, testY: number): boolean {
        const centerCol = Math.floor(testX / GameConstants.TILE_SIZE);
        const topRow = Math.floor((testY - 30) / GameConstants.TILE_SIZE);
        const midRow = Math.floor((testY - 16) / GameConstants.TILE_SIZE);
        const feetRow = Math.floor((testY - 2) / GameConstants.TILE_SIZE);

        return grid.isLadder(centerCol, topRow) || grid.isLadder(centerCol, midRow) || grid.isLadder(centerCol, feetRow);
    }

    private tryEnterLadder(grid: RoomGrid, up: boolean, down: boolean): boolean {
        const centerCol = Math.floor(this.x / GameConstants.TILE_SIZE);
        const midRow = Math.floor((this.y - 16) / GameConstants.TILE_SIZE);
        const topRow = Math.floor((this.y - 30) / GameConstants.TILE_SIZE);
        const feetRow = Math.round(this.y / GameConstants.TILE_SIZE);

        if (up) {
            if (grid.isLadder(centerCol, midRow) || grid.isLadder(centerCol, topRow)) {
                this.snapToLadderCenter();
                return true;
            }
        } else if (down) {
            if (grid.isLadder(centerCol, feetRow) || grid.isLadder(centerCol, midRow)) {
                this.snapToLadderCenter();
                return true;
            }
        }
        return false;
    }

    private snapToLadderCenter(): void {
        const centerCol = Math.floor(this.x / GameConstants.TILE_SIZE);
        this.x = centerCol * GameConstants.TILE_SIZE + 16;
    }

    private getTopLadderRow(grid: RoomGrid, col: number, fromRow: number): number {
        let r = Math.min(Math.max(fromRow, 0), GameConstants.GRID_ROWS - 1);
        while (r > 0 && grid.isLadder(col, r - 1)) {
            r--;
        }
        return r;
    }

    private updateVisualFrame(): void {
        this.setFlipX(this.facing === Direction.Left);

        switch (this.playerState) {
            case PlayerState.Eliminated:
                this.setTexture('player_dead');
                break;
            case PlayerState.Jumping:
            case PlayerState.Falling:
                this.setTexture('player_jump');
                break;
            case PlayerState.Climbing:
                const climbFrame = Math.floor(this.animationTimer / 10) % 2 === 0 ? 'player_climb1' : 'player_climb2';
                this.setTexture(climbFrame);
                break;
            case PlayerState.Walking:
                const walkFrame = Math.floor(this.animationTimer / 8) % 2 === 0 ? 'player_walk1' : 'player_walk2';
                this.setTexture(walkFrame);
                break;
            case PlayerState.Idle:
            default:
                this.setTexture('player_idle');
                break;
        }
    }
}
