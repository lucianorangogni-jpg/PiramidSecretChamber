import { GameConstants } from '../core/GameConstants.ts';
import { TileType } from './TileType.ts';
import type { GridCoord } from './GridCoord.ts';
import type { PlatformInfo } from './PlatformInfo.ts';

/**
 * Representa la cuadrícula de la cámara de la pirámide (20 columnas x 15 filas).
 * Almacena los tiles en un array plano unidimensional para máxima eficiencia y cero allocations.
 */
export class RoomGrid {
    private static readonly ChamberNames: readonly string[] = [
        'Recámara 1: El Umbral',
        'Recámara 2: Corredor de las Sombras',
        'Recámara 3: Salón de Anubis',
        'Recámara 4: El Foso del Escarabajo',
        'Recámara 5: Galería de los Cuatro Vientos',
        'Recámara 6: Laberinto de Horus',
        'Recámara 7: Sancta Sanctorum',
        'Recámara 8: El Pozo de las Almas',
        'Recámara 9: Mirador de Ra',
        'Recámara 10: La Cúspide de Montezuma'
    ];

    private readonly tiles: TileType[] = new Array(GameConstants.GRID_COLUMNS * GameConstants.GRID_ROWS);
    private readonly platforms: PlatformInfo[] = [];

    public currentChamber: number = 1;
    public roomName: string = 'Recámara 1: El Umbral';

    public get columns(): number {
        return GameConstants.GRID_COLUMNS;
    }

    public get rows(): number {
        return GameConstants.GRID_ROWS;
    }

    public get pyramidLevel(): number {
        return RoomGrid.getPyramidLevel(this.currentChamber);
    }

    public get registeredPlatforms(): readonly PlatformInfo[] {
        return this.platforms;
    }

    constructor() {
        this.clear(TileType.Empty);
        this.loadChamber(1);
    }

    /**
     * Devuelve el nivel de la pirámide (1 a 4) según el número de recámara (1 a 10):
     * - Nivel 1 (Base): Recámaras 1, 2, 3, 4
     * - Nivel 2: Recámaras 5, 6, 7
     * - Nivel 3: Recámaras 8, 9
     * - Nivel 4 (Cúspide): Recámara 10
     */
    public static getPyramidLevel(chamberNumber: number): number {
        if (chamberNumber >= 1 && chamberNumber <= 4) return 1;
        if (chamberNumber >= 5 && chamberNumber <= 7) return 2;
        if (chamberNumber === 8 || chamberNumber === 9) return 3;
        if (chamberNumber === 10) return 4;
        return 1;
    }

    public static getIndex(x: number, y: number): number {
        return y * GameConstants.GRID_COLUMNS + x;
    }

    public inBounds(x: number, y: number): boolean {
        return x >= 0 && x < GameConstants.GRID_COLUMNS && y >= 0 && y < GameConstants.GRID_ROWS;
    }

    public inBoundsCoord(coord: GridCoord): boolean {
        return this.inBounds(coord.x, coord.y);
    }

    public getTile(x: number, y: number): TileType {
        if (!this.inBounds(x, y)) {
            return TileType.SolidWall; // Fuera de límites se trata como muro impenetrable
        }
        return this.tiles[RoomGrid.getIndex(x, y)];
    }

    public getTileCoord(coord: GridCoord): TileType {
        return this.getTile(coord.x, coord.y);
    }

    public setTile(x: number, y: number, type: TileType): void {
        if (this.inBounds(x, y)) {
            this.tiles[RoomGrid.getIndex(x, y)] = type;
        }
    }

    public setTileCoord(coord: GridCoord, type: TileType): void {
        this.setTile(coord.x, coord.y, type);
    }

    public isSolid(x: number, y: number): boolean {
        if (!this.inBounds(x, y)) return true;
        return this.tiles[RoomGrid.getIndex(x, y)] === TileType.SolidWall;
    }

    public isLadder(x: number, y: number): boolean {
        if (!this.inBounds(x, y)) return false;
        return this.tiles[RoomGrid.getIndex(x, y)] === TileType.Ladder;
    }

    public isPressurePlate(x: number, y: number): boolean {
        if (!this.inBounds(x, y)) return false;
        return this.tiles[RoomGrid.getIndex(x, y)] === TileType.PressurePlate;
    }

    public isExitDoor(x: number, y: number): boolean {
        if (!this.inBounds(x, y)) return false;
        return this.tiles[RoomGrid.getIndex(x, y)] === TileType.ExitDoor;
    }

    public isEmpty(x: number, y: number): boolean {
        if (!this.inBounds(x, y)) return false;
        return this.tiles[RoomGrid.getIndex(x, y)] === TileType.Empty;
    }

    public clear(tileType: TileType = TileType.Empty): void {
        this.tiles.fill(tileType);
    }

    private buildPerimeterWalls(): void {
        for (let x = 0; x < GameConstants.GRID_COLUMNS; x++) {
            this.setTile(x, 0, TileType.SolidWall); // Techo
            this.setTile(x, GameConstants.GRID_ROWS - 1, TileType.SolidWall); // Suelo base (fila 14)
        }

        for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
            this.setTile(0, y, TileType.SolidWall); // Pared izquierda
            this.setTile(GameConstants.GRID_COLUMNS - 1, y, TileType.SolidWall); // Pared derecha
        }
    }

    /**
     * Carga una de las 10 recámaras según la arquitectura original de RetroGamePiramid.
     */
    public loadChamber(chamberNumber: number): void {
        const normalized = chamberNumber >= 1 && chamberNumber <= GameConstants.TOTAL_CHAMBERS ? chamberNumber : 1;
        this.currentChamber = normalized;
        this.clear(TileType.Empty);
        this.platforms.length = 0;

        switch (normalized) {
            case 1:
                this.loadChamber1();
                break;
            case 2:
                this.loadChamber2();
                break;
            case 3:
                this.loadChamberVariant(3, 9, 5, 4, 9, true, 7, 11, 13);
                break;
            case 4:
                this.loadChamberVariant(4, 10, 6, 5, 13, false, 9, 11, -1);
                break;
            case 5:
                this.loadFourPlatformChamber(5, 11, 8, 4, 5, 8, 4, true, 8, -1, true);
                break;
            case 6:
                this.loadFourPlatformChamber(6, 11, 8, 4, 4, 10, 6, false, 7, 12);
                break;
            case 7:
                this.loadFourPlatformChamber(7, 11, 8, 4, 5, 9, 4, true, 9, 11);
                break;
            case 8:
                this.loadFivePlatformChamber(8, 11, 8, 5, 3, 6, 9, 11, 8, false, 8, 12);
                break;
            case 9:
                this.loadFivePlatformChamber(9, 11, 8, 5, 3, 5, 8, 5, 11, true, 7, 12);
                break;
            case 10:
                this.loadChamberVariant(10, 9, 5, 5, 10, true, 8, 11, 13);
                break;
        }
    }

    private loadChamber1(): void {
        this.buildPerimeterWalls();

        // Plataforma intermedia Nivel 1 (fila 9)
        for (let x = 2; x <= 10; x++) this.setTile(x, 9, TileType.SolidWall);
        this.setTile(12, 9, TileType.SolidWall); // Descansillo intermedio
        for (let x = 14; x <= 17; x++) this.setTile(x, 9, TileType.SolidWall);

        // Escalera 1: conecta el suelo (fila 13) con Nivel 1 (fila 9) en columna 5
        for (let y = 9; y <= 13; y++) this.setTile(5, y, TileType.Ladder);

        // Plataforma superior Nivel 2 (fila 5): columnas 2 a 15 y descansillo en 17 y 18
        for (let x = 2; x <= 15; x++) this.setTile(x, 5, TileType.SolidWall);
        this.setTile(17, 5, TileType.SolidWall);
        this.setTile(18, 5, TileType.SolidWall);

        // Escalera 2: conecta Nivel 1 con Nivel 2 en columna 10
        for (let y = 5; y <= 9; y++) this.setTile(10, y, TileType.Ladder);

        // Placa de presión en (8, 13)
        this.setTile(8, 13, TileType.PressurePlate);

        // Puerta de salida en (18, 4)
        this.setTile(18, 4, TileType.ExitDoor);

        this.roomName = RoomGrid.ChamberNames[0];
        this.platforms.push(
            { level: 0, row: GameConstants.GRID_ROWS - 1, minCol: 1, maxCol: GameConstants.GRID_COLUMNS - 2, name: 'Suelo Base Nivel 0' },
            { level: 1, row: 9, minCol: 2, maxCol: 17, name: 'Plataforma Nivel 1' },
            { level: 2, row: 5, minCol: 2, maxCol: 18, name: 'Plataforma Nivel 2' }
        );
    }

    private loadChamber2(): void {
        this.buildPerimeterWalls();

        // Plataforma Nivel 1 (fila 10) con foso en col 12
        for (let x = 2; x <= 17; x++) {
            if (x === 12) continue;
            this.setTile(x, 10, TileType.SolidWall);
        }

        // Escalera 1 en col 6 (filas 10 a 13)
        for (let y = 10; y <= 13; y++) this.setTile(6, y, TileType.Ladder);

        // Plataforma Nivel 2 (fila 6) con descansillo a la izquierda en 1 y 2, hueco en 3, resto 4 a 17
        this.setTile(1, 6, TileType.SolidWall);
        this.setTile(2, 6, TileType.SolidWall);
        for (let x = 4; x <= 17; x++) this.setTile(x, 6, TileType.SolidWall);

        // Escalera 2 en col 13 (filas 6 a 10)
        for (let y = 6; y <= 10; y++) this.setTile(13, y, TileType.Ladder);

        // Placa de presión en (8, 13)
        this.setTile(8, 13, TileType.PressurePlate);

        // Puerta de salida en (1, 5)
        this.setTile(1, 5, TileType.ExitDoor);

        this.roomName = RoomGrid.ChamberNames[1];
        this.platforms.push(
            { level: 0, row: GameConstants.GRID_ROWS - 1, minCol: 1, maxCol: GameConstants.GRID_COLUMNS - 2, name: 'Suelo Base Nivel 0' },
            { level: 1, row: 10, minCol: 2, maxCol: 17, name: 'Plataforma Nivel 1' },
            { level: 2, row: 6, minCol: 1, maxCol: 17, name: 'Plataforma Nivel 2' }
        );
    }

    private loadChamberVariant(
        chamberNumber: number,
        level1Row: number,
        level2Row: number,
        ladder1Col: number,
        ladder2Col: number,
        doorOnRight: boolean,
        stoneCol: number,
        level1GapColA: number,
        level1GapColB: number
    ): void {
        this.buildPerimeterWalls();

        // 1. Plataforma intermedia Nivel 1
        for (let x = 2; x <= 17; x++) {
            if (x === level1GapColA || x === level1GapColB) continue;
            this.setTile(x, level1Row, TileType.SolidWall);
        }

        // 2. Escalera 1: Suelo a Nivel 1
        for (let y = level1Row; y <= 13; y++) {
            this.setTile(ladder1Col, y, TileType.Ladder);
        }

        // 3. Plataforma superior Nivel 2
        let level2MinCol: number;
        let level2MaxCol: number;
        if (doorOnRight) {
            for (let x = 2; x <= 15; x++) this.setTile(x, level2Row, TileType.SolidWall);
            this.setTile(17, level2Row, TileType.SolidWall);
            this.setTile(18, level2Row, TileType.SolidWall);
            this.setTile(18, level2Row - 1, TileType.ExitDoor);
            level2MinCol = 2;
            level2MaxCol = 18;
        } else {
            this.setTile(1, level2Row, TileType.SolidWall);
            this.setTile(2, level2Row, TileType.SolidWall);
            for (let x = 4; x <= 17; x++) this.setTile(x, level2Row, TileType.SolidWall);
            this.setTile(1, level2Row - 1, TileType.ExitDoor);
            level2MinCol = 1;
            level2MaxCol = 17;
        }

        // 4. Escalera 2: Nivel 1 a Nivel 2
        for (let y = level2Row; y <= level1Row; y++) {
            this.setTile(ladder2Col, y, TileType.Ladder);
        }

        // 5. Placa de activación
        this.setTile(stoneCol, 13, TileType.PressurePlate);

        this.roomName = RoomGrid.ChamberNames[chamberNumber - 1];
        this.platforms.push(
            { level: 0, row: GameConstants.GRID_ROWS - 1, minCol: 1, maxCol: GameConstants.GRID_COLUMNS - 2, name: 'Suelo Base Nivel 0' },
            { level: 1, row: level1Row, minCol: 2, maxCol: 17, name: 'Plataforma Nivel 1' },
            { level: 2, row: level2Row, minCol: level2MinCol, maxCol: level2MaxCol, name: 'Plataforma Nivel 2' }
        );
    }

    private loadFourPlatformChamber(
        chamberNumber: number,
        level1Row: number,
        level2Row: number,
        level3Row: number,
        ladder1Col: number,
        ladder2Col: number,
        ladder3Col: number,
        doorOnRight: boolean,
        stoneCol: number,
        level1GapColA: number,
        extendLevel1And2ToCol18: boolean = false
    ): void {
        this.buildPerimeterWalls();
        const maxMidCol = extendLevel1And2ToCol18 ? 18 : 17;

        // Plataforma Nivel 1
        for (let x = 2; x <= maxMidCol; x++) {
            if (x === level1GapColA) continue;
            this.setTile(x, level1Row, TileType.SolidWall);
        }
        for (let y = level1Row; y <= 13; y++) this.setTile(ladder1Col, y, TileType.Ladder);

        // Plataforma Nivel 2
        for (let x = 2; x <= maxMidCol; x++) this.setTile(x, level2Row, TileType.SolidWall);
        for (let y = level2Row; y <= level1Row; y++) this.setTile(ladder2Col, y, TileType.Ladder);

        // Plataforma Nivel 3
        let level3MinCol: number;
        let level3MaxCol: number;
        if (doorOnRight) {
            for (let x = 2; x <= 15; x++) this.setTile(x, level3Row, TileType.SolidWall);
            this.setTile(17, level3Row, TileType.SolidWall);
            this.setTile(18, level3Row, TileType.SolidWall);
            this.setTile(18, level3Row - 1, TileType.ExitDoor);
            level3MinCol = 2;
            level3MaxCol = 18;
        } else {
            this.setTile(1, level3Row, TileType.SolidWall);
            this.setTile(2, level3Row, TileType.SolidWall);
            for (let x = 4; x <= 17; x++) this.setTile(x, level3Row, TileType.SolidWall);
            this.setTile(1, level3Row - 1, TileType.ExitDoor);
            level3MinCol = 1;
            level3MaxCol = 17;
        }
        for (let y = level3Row; y <= level2Row; y++) this.setTile(ladder3Col, y, TileType.Ladder);

        this.setTile(stoneCol, 13, TileType.PressurePlate);

        this.roomName = RoomGrid.ChamberNames[chamberNumber - 1];
        this.platforms.push(
            { level: 0, row: GameConstants.GRID_ROWS - 1, minCol: 1, maxCol: GameConstants.GRID_COLUMNS - 2, name: 'Suelo Base Nivel 0' },
            { level: 1, row: level1Row, minCol: 2, maxCol: maxMidCol, name: 'Plataforma Nivel 1' },
            { level: 2, row: level2Row, minCol: 2, maxCol: maxMidCol, name: 'Plataforma Nivel 2' },
            { level: 3, row: level3Row, minCol: level3MinCol, maxCol: level3MaxCol, name: 'Plataforma Nivel 3' }
        );
    }

    private loadFivePlatformChamber(
        chamberNumber: number,
        level1Row: number,
        level2Row: number,
        level3Row: number,
        level4Row: number,
        ladder1Col: number,
        ladder2Col: number,
        ladder3Col: number,
        ladder4Col: number,
        doorOnRight: boolean,
        stoneCol: number,
        level1GapColA: number
    ): void {
        this.buildPerimeterWalls();

        // Nivel 1
        for (let x = 1; x <= 17; x++) {
            if (x === level1GapColA) continue;
            this.setTile(x, level1Row, TileType.SolidWall);
        }
        for (let y = level1Row; y <= 13; y++) this.setTile(ladder1Col, y, TileType.Ladder);

        // Nivel 2
        for (let x = 1; x <= 18; x++) this.setTile(x, level2Row, TileType.SolidWall);
        for (let y = level2Row; y <= level1Row; y++) this.setTile(ladder2Col, y, TileType.Ladder);

        // Nivel 3 y 4
        let level3MinCol: number;
        let level3MaxCol: number;
        let level4MinCol: number;
        let level4MaxCol: number;

        if (doorOnRight) {
            for (let x = 2; x <= 11; x++) this.setTile(x, level3Row, TileType.SolidWall);
            for (let x = 14; x <= 18; x++) this.setTile(x, level3Row, TileType.SolidWall);
            level3MinCol = 2;
            level3MaxCol = 18;

            for (let x = 11; x <= 15; x++) this.setTile(x, level4Row, TileType.SolidWall);
            this.setTile(17, level4Row, TileType.SolidWall);
            this.setTile(18, level4Row, TileType.SolidWall);
            this.setTile(18, level4Row - 1, TileType.ExitDoor);
            level4MinCol = 11;
            level4MaxCol = 18;
        } else {
            for (let x = 8; x <= 18; x++) this.setTile(x, level3Row, TileType.SolidWall);
            level3MinCol = 8;
            level3MaxCol = 18;

            this.setTile(1, level4Row, TileType.SolidWall);
            this.setTile(2, level4Row, TileType.SolidWall);
            for (let x = 4; x <= 8; x++) this.setTile(x, level4Row, TileType.SolidWall);
            this.setTile(1, level4Row - 1, TileType.ExitDoor);
            level4MinCol = 1;
            level4MaxCol = 8;
        }

        for (let y = level3Row; y <= level2Row; y++) this.setTile(ladder3Col, y, TileType.Ladder);
        for (let y = level4Row; y <= level3Row; y++) this.setTile(ladder4Col, y, TileType.Ladder);

        this.setTile(stoneCol, 13, TileType.PressurePlate);

        this.roomName = RoomGrid.ChamberNames[chamberNumber - 1];
        this.platforms.push(
            { level: 0, row: GameConstants.GRID_ROWS - 1, minCol: 1, maxCol: GameConstants.GRID_COLUMNS - 2, name: 'Suelo Base Nivel 0' },
            { level: 1, row: level1Row, minCol: 1, maxCol: 17, name: 'Plataforma Nivel 1' },
            { level: 2, row: level2Row, minCol: 1, maxCol: 18, name: 'Plataforma Nivel 2' },
            { level: 3, row: level3Row, minCol: level3MinCol, maxCol: level3MaxCol, name: 'Plataforma Nivel 3' },
            { level: 4, row: level4Row, minCol: level4MinCol, maxCol: level4MaxCol, name: 'Plataforma Nivel 4' }
        );
    }

    public getPlatformLevel(posY: number): number {
        const footRow = Math.round((posY + GameConstants.TILE_SIZE) / GameConstants.TILE_SIZE);
        for (let i = 0; i < this.platforms.length; i++) {
            if (this.platforms[i].row === footRow) {
                return this.platforms[i].level;
            }
        }
        return -1;
    }
}

