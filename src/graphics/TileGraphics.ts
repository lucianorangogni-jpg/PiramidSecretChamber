import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants';

/**
 * Genera texturas pixel-art procedurales de 32x32 para los tiles de la pirámide,
 * replicando exactamente la paleta y estética retro de TileRenderer.cs en MonoGame.
 */
export class TileGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateWallTexture(scene);
        this.generateLadderTexture(scene);
        this.generatePressurePlateTexture(scene);
        this.generateDoorTexture(scene);
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
}

