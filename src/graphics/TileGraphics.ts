import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants';

/**
 * Genera texturas pixel-art procedurales de 32x32 para los tiles de la pirámide,
 * replicando exactamente la paleta y estética retro de TileRenderer.cs en MonoGame.
 */
export class TileGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateWallTexture(scene);
        this.generateMovingFloorTexture(scene);
        this.generateLadderTexture(scene);
        this.generatePressurePlateTexture(scene);
        this.generateDoorTexture(scene);
        this.generateLeverTextures(scene);
        this.generatePharaohGateTexture(scene);
    }

    public static generateWallTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_wall')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        // Colores de la arenisca egipcia
        const mortar = 0x362210;
        const baseGold = 0xbc8634;
        const highlight = 0xe4af58;
        const shade = 0x84561c;
        const accent = 0xf6c672;

        // Fondo base
        g.fillStyle(baseGold, 1);
        g.fillRect(0, 0, size, size);

        // Fila 1 de ladrillos (mitad superior, 0 a 16 px)
        // Bisel superior claro
        g.fillStyle(highlight, 1);
        g.fillRect(0, 0, size, 2);
        // Mortero horizontal medio
        g.fillStyle(mortar, 1);
        g.fillRect(0, 15, size, 2);
        // Mortero vertical medio en x=16
        g.fillRect(15, 0, 2, 16);
        // Sombra inferior de ladrillos superiores
        g.fillStyle(shade, 1);
        g.fillRect(0, 13, 15, 2);
        g.fillRect(17, 13, 15, 2);

        // Fila 2 de ladrillos (mitad inferior, 16 a 32 px, decalados)
        // Mortero horizontal inferior
        g.fillStyle(mortar, 1);
        g.fillRect(0, 30, size, 2);
        // Morteros verticales decalados en x=8 y x=24
        g.fillRect(7, 16, 2, 16);
        g.fillRect(23, 16, 2, 16);
        // Bisel superior de ladrillos inferiores
        g.fillStyle(highlight, 1);
        g.fillRect(0, 17, 7, 2);
        g.fillRect(9, 17, 14, 2);
        g.fillRect(25, 17, 7, 2);
        // Sombra inferior
        g.fillStyle(shade, 1);
        g.fillRect(0, 28, 7, 2);
        g.fillRect(9, 28, 14, 2);
        g.fillRect(25, 28, 7, 2);

        // Acentos de textura / relieves
        g.fillStyle(accent, 1);
        g.fillRect(6, 6, 4, 3);
        g.fillRect(22, 8, 4, 3);
        g.fillRect(14, 22, 4, 3);

        g.generateTexture('tile_wall', size, size);
        g.destroy();
    }

    /**
     * Genera la textura para el piso movedizo inestable de la pirámide (tile_moving_floor).
     * Mantiene la tonalidad de la arenisca con grietas oscuras y juntas de presión
     * que indican visualmente una losa desmoronable.
     */
    public static generateMovingFloorTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_moving_floor')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const mortar = 0x362210;
        const crackDark = 0x221308;
        const baseGold = 0xb47e30; // Ligeramente más tostado
        const highlight = 0xe8b35a;
        const shade = 0x7c4e16;
        const accent = 0xf0c068;

        // Fondo base de la losa inestable
        g.fillStyle(baseGold, 1);
        g.fillRect(0, 0, size, size);

        // Bisel superior
        g.fillStyle(highlight, 1);
        g.fillRect(0, 0, size, 2);

        // Sombras y bordes laterales/inferiores
        g.fillStyle(mortar, 1);
        g.fillRect(0, size - 2, size, 2);
        g.fillRect(0, 0, 2, size);
        g.fillRect(size - 2, 0, 2, size);

        // Línea divisoria media
        g.fillStyle(shade, 1);
        g.fillRect(2, 15, size - 4, 2);

        // Fisuras y grietas profundas (características del piso movedizo desmoronable)
        g.fillStyle(crackDark, 1);
        // Grieta 1: Diagonal escalonada superior izquierda
        g.fillRect(6, 2, 2, 4);
        g.fillRect(7, 5, 3, 2);
        g.fillRect(9, 7, 2, 5);
        g.fillRect(11, 11, 3, 2);
        g.fillRect(13, 13, 2, 3);

        // Grieta 2: Fisuara transversal inferior derecha
        g.fillRect(18, 16, 2, 4);
        g.fillRect(20, 19, 4, 2);
        g.fillRect(23, 21, 2, 5);
        g.fillRect(22, 26, 3, 2);
        g.fillRect(24, 28, 2, 2);

        // Resaltes luminosos al borde de las grietas
        g.fillStyle(accent, 1);
        g.fillRect(8, 2, 1, 3);
        g.fillRect(12, 10, 1, 2);
        g.fillRect(19, 16, 1, 3);
        g.fillRect(24, 23, 1, 3);

        // Ranuras de encaje mecánico en los extremos inferiores
        g.fillStyle(mortar, 1);
        g.fillRect(4, 28, 4, 2);
        g.fillRect(size - 8, 28, 4, 2);

        g.generateTexture('tile_moving_floor', size, size);
        g.destroy();
    }

    public static generateLadderTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_ladder')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const railHighlight = 0xc48a46;
        const railBase = 0x905e2a;
        const railShadow = 0x543012;
        const rungHighlight = 0xdaa862;
        const rungShadow = 0x70461a;
        const ropeKnot = 0xeecc84;

        // Larguero vertical izquierdo (x=6 a x=10)
        g.fillStyle(railHighlight, 1);
        g.fillRect(6, 0, 2, size);
        g.fillStyle(railBase, 1);
        g.fillRect(8, 0, 2, size);
        g.fillStyle(railShadow, 1);
        g.fillRect(10, 0, 2, size);

        // Larguero vertical derecho (x=20 a x=24)
        g.fillStyle(railHighlight, 1);
        g.fillRect(20, 0, 2, size);
        g.fillStyle(railBase, 1);
        g.fillRect(22, 0, 2, size);
        g.fillStyle(railShadow, 1);
        g.fillRect(24, 0, 2, size);

        // Peldaños horizontales
        const rungs = [4, 14, 24];
        rungs.forEach((ry) => {
            // Peldaño madera
            g.fillStyle(rungHighlight, 1);
            g.fillRect(8, ry, 16, 2);
            g.fillStyle(rungShadow, 1);
            g.fillRect(8, ry + 2, 16, 2);

            // Nudos de cuerda
            g.fillStyle(ropeKnot, 1);
            g.fillRect(6, ry, 4, 4);
            g.fillRect(22, ry, 4, 4);
        });

        g.generateTexture('tile_ladder', size, size);
        g.destroy();
    }

    public static generatePressurePlateTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_plate')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const plateBevel = 0xdcb96e;
        const plateSurface = 0xaf8a55;
        const plateShadow = 0x5a4126;
        const foundation = 0x48321a;
        const jewelGlow = 0x78f0ff;
        const jewelCyan = 0x28cde1;

        // Cimiento inferior
        g.fillStyle(foundation, 1);
        g.fillRect(2, 26, 28, 6);

        // Superficie biselada
        g.fillStyle(plateBevel, 1);
        g.fillRect(4, 20, 24, 2);
        g.fillStyle(plateSurface, 1);
        g.fillRect(4, 22, 24, 3);
        g.fillStyle(plateShadow, 1);
        g.fillRect(4, 25, 24, 2);

        // Joya sagrada en el centro
        g.fillStyle(jewelCyan, 1);
        g.fillRect(13, 21, 6, 4);
        g.fillStyle(jewelGlow, 1);
        g.fillRect(14, 22, 4, 2);

        g.generateTexture('tile_plate', size, size);
        g.destroy();
    }

    public static generateDoorTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_door')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const archHighlight = 0xffe47d;
        const archGold = 0xebbe46;
        const archShadow = 0x94661c;
        const doorPanel = 0xb88622;
        const doorTrim = 0x764e12;
        const doorSeam = 0x37200a;
        const emblemGold = 0xf0c33c;
        const emblemRadiant = 0xfff5a0;
        const stoneStep = 0x73522e;

        // Escalón inferior
        g.fillStyle(stoneStep, 1);
        g.fillRect(0, 30, size, 2);

        // Fondo del pórtico
        g.fillStyle(doorPanel, 1);
        g.fillRect(6, 6, 20, 24);

        // Marco y columnas
        g.fillStyle(archGold, 1);
        g.fillRect(2, 4, 4, 26);
        g.fillRect(26, 4, 4, 26);

        // Arco superior
        g.fillStyle(archHighlight, 1);
        g.fillRect(4, 0, 24, 4);
        g.fillStyle(archShadow, 1);
        g.fillRect(2, 2, 2, 2);
        g.fillRect(28, 2, 2, 2);

        // Borde interior
        g.fillStyle(doorTrim, 1);
        g.strokeRect(6, 6, 20, 24);

        // Ranura central
        g.fillStyle(doorSeam, 1);
        g.fillRect(15, 6, 2, 24);

        // Emblema solar central
        g.fillStyle(emblemGold, 1);
        g.fillRect(13, 10, 6, 6);
        g.fillStyle(emblemRadiant, 1);
        g.fillRect(14, 11, 4, 4);

        g.generateTexture('tile_door', size, size);
        g.destroy();
    }

    /**
     * Genera las texturas de la palanca suspendida del Faraón en la Recámara 10.
     * `tile_lever_up`: palanca en posición de reposo (bloqueada/sin accionar).
     * `tile_lever_down`: palanca accionada tras salto exitoso con todos los puzles resueltos.
     */
    public static generateLeverTextures(scene: Phaser.Scene): void {
        const size = GameConstants.TILE_SIZE; // 32

        if (!scene.textures.exists('tile_lever_up')) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Base soporte de bronce oscuro anclada al techo
            g.fillStyle(0x3c2410, 1);
            g.fillRect(8, 0, 16, 6);
            g.fillStyle(0x8a5824, 1);
            g.fillRect(10, 2, 12, 3);

            // Carcasa de la palanca
            g.fillStyle(0x523214, 1);
            g.fillRect(11, 6, 10, 8);
            g.fillStyle(0xb88636, 1);
            g.fillRect(13, 8, 6, 4);

            // Pivote central
            g.fillStyle(0x221307, 1);
            g.fillCircle(16, 12, 4);
            g.fillStyle(0xffd73c, 1);
            g.fillCircle(16, 12, 2);

            // Brazo de la palanca inclinado hacia la derecha (hacia arriba)
            g.fillStyle(0xdca54c, 1);
            g.fillRect(16, 11, 4, 3);
            g.fillRect(19, 13, 4, 3);
            g.fillRect(22, 15, 4, 4);

            // Pomo / empuñadura de rubí sagrado
            g.fillStyle(0xd22020, 1);
            g.fillCircle(25, 18, 4);
            g.fillStyle(0xff8888, 1);
            g.fillCircle(24, 17, 2);

            // Indicador de bloqueo (gema roja inactiva)
            g.fillStyle(0x881111, 1);
            g.fillRect(14, 3, 4, 2);

            g.generateTexture('tile_lever_up', size, size);
            g.destroy();
        }

        if (!scene.textures.exists('tile_lever_down')) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Base soporte de bronce anclada al techo
            g.fillStyle(0x3c2410, 1);
            g.fillRect(8, 0, 16, 6);
            g.fillStyle(0x8a5824, 1);
            g.fillRect(10, 2, 12, 3);

            // Carcasa de la palanca
            g.fillStyle(0x523214, 1);
            g.fillRect(11, 6, 10, 8);
            g.fillStyle(0xb88636, 1);
            g.fillRect(13, 8, 6, 4);

            // Pivote central
            g.fillStyle(0x221307, 1);
            g.fillCircle(16, 12, 4);
            g.fillStyle(0xffd73c, 1);
            g.fillCircle(16, 12, 2);

            // Brazo de la palanca tirado hacia abajo
            g.fillStyle(0xdca54c, 1);
            g.fillRect(15, 14, 3, 4);
            g.fillRect(14, 18, 4, 4);
            g.fillRect(13, 22, 5, 4);

            // Pomo / empuñadura en posición baja
            g.fillStyle(0xffd73c, 1);
            g.fillCircle(15, 27, 4);
            g.fillStyle(0xfff6a0, 1);
            g.fillCircle(14, 26, 2);

            // Indicador de activación (escarabajo verde/esmeralda luminoso)
            g.fillStyle(0x20d260, 1);
            g.fillRect(14, 3, 4, 2);
            g.fillStyle(0x80ffb0, 1);
            g.fillRect(15, 3, 2, 1);

            g.generateTexture('tile_lever_down', size, size);
            g.destroy();
        }
    }

    /**
     * Genera la textura para el Muro del Faraón que cierra la escalera a la Cúspide (`tile_pharaoh_gate`).
     * Bloque de arenisca grabado con jeroglíficos ceremoniales y sello de oro.
     */
    public static generatePharaohGateTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_pharaoh_gate')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        // Base arenisca oscura
        g.fillStyle(0x84561c, 1);
        g.fillRect(0, 0, size, size);

        // Bisel dorado exterior
        g.fillStyle(0xc8943c, 1);
        g.fillRect(0, 0, size, 2);
        g.fillRect(0, 0, 2, size);
        g.fillStyle(0x42260e, 1);
        g.fillRect(0, size - 2, size, 2);
        g.fillRect(size - 2, 0, 2, size);

        // Relieve interior tallado
        g.fillStyle(0x5a3612, 1);
        g.fillRect(4, 4, 24, 24);

        // Sello sagrado de Ankh / Ojo de Horus en oro brillante
        g.fillStyle(0xffd73c, 1);
        g.fillRect(14, 8, 4, 16); // Barra vertical
        g.fillRect(10, 12, 12, 3); // Barra horizontal
        g.fillCircle(16, 8, 4);    // Lazo superior
        g.fillStyle(0x5a3612, 1);
        g.fillCircle(16, 8, 2);

        // Gemas luminosas en las esquinas
        g.fillStyle(0x40b0ff, 1); // Lapislázuli sagrado
        g.fillRect(5, 5, 2, 2);
        g.fillRect(25, 5, 2, 2);
        g.fillRect(5, 25, 2, 2);
        g.fillRect(25, 25, 2, 2);

        g.generateTexture('tile_pharaoh_gate', size, size);
        g.destroy();
    }
}

