import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';

/**
 * Generador procedural de texturas pixel-art para los cofres de tesoro (32x32 px).
 * - `treasure_closed`: Cofre cerrado con herrajes dorados y cerradura rúnica.
 * - `treasure_open`: Cofre abierto radiante con monedas de oro y gemas preciosas.
 */
export class TreasureGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateClosedChestTexture(scene);
        this.generateOpenChestTexture(scene);
    }

    public static generateClosedChestTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('treasure_closed')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        // Paleta de madera ancestral, oro faraónico y gemas
        const woodDark = 0x3d200a;
        const woodBase = 0x613714;
        const woodLight = 0x824e22;

        const goldShadow = 0x7a5010;
        const goldBase = 0xca9522;
        const goldHighlight = 0xffe26a;

        const keyholeBg = 0x211206;
        const cyanGem = 0x28cde1;
        const cyanGlow = 0x9ef5ff;

        // 1. Sombra base inferior en el suelo
        g.fillStyle(0x1a0f05, 0.8);
        g.fillRect(3, 29, 26, 3);

        // 2. Cuerpo del cofre (de y=10 a y=29, x=4 a x=28 -> ancho 24, alto 19)
        // Fondo madera base
        g.fillStyle(woodBase, 1);
        g.fillRect(4, 10, 24, 19);

        // Sombras de tablones de madera
        g.fillStyle(woodDark, 1);
        g.fillRect(4, 18, 24, 2);
        g.fillRect(4, 27, 24, 2);

        // Relieve claro de madera
        g.fillStyle(woodLight, 1);
        g.fillRect(5, 11, 22, 1);
        g.fillRect(5, 20, 22, 1);

        // 3. Tapa abovedada superior (de y=6 a y=12)
        g.fillStyle(woodDark, 1);
        g.fillRect(6, 6, 20, 4);
        g.fillStyle(woodBase, 1);
        g.fillRect(5, 8, 22, 4);
        g.fillStyle(woodLight, 1);
        g.fillRect(7, 7, 18, 2);

        // 4. Bandas de oro horizontales y perimetrales
        // Borde superior tapa
        g.fillStyle(goldHighlight, 1);
        g.fillRect(7, 6, 18, 1);

        // Banda divisoria de tapa / apertura (y=12)
        g.fillStyle(goldShadow, 1);
        g.fillRect(4, 12, 24, 2);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(4, 12, 24, 1);

        // Banda horizontal inferior de oro
        g.fillStyle(goldShadow, 1);
        g.fillRect(4, 27, 24, 2);
        g.fillStyle(goldBase, 1);
        g.fillRect(4, 26, 24, 1);

        // Refuerzos de esquinas y herrajes verticales
        // Herraje izquierdo (x=6..8)
        g.fillStyle(goldShadow, 1);
        g.fillRect(6, 6, 3, 23);
        g.fillStyle(goldBase, 1);
        g.fillRect(7, 6, 2, 23);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(7, 6, 1, 23);

        // Herraje derecho (x=23..25)
        g.fillStyle(goldShadow, 1);
        g.fillRect(23, 6, 3, 23);
        g.fillStyle(goldBase, 1);
        g.fillRect(23, 6, 2, 23);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(24, 6, 1, 23);

        // Remaches / pernos de oro
        g.fillStyle(goldHighlight, 1);
        g.fillRect(7, 8, 2, 2);
        g.fillRect(7, 15, 2, 2);
        g.fillRect(7, 24, 2, 2);
        g.fillRect(23, 8, 2, 2);
        g.fillRect(23, 15, 2, 2);
        g.fillRect(23, 24, 2, 2);

        // 5. Cerradura central con cerradero y joya sagrada
        // Placa de cerradura de oro
        g.fillStyle(goldShadow, 1);
        g.fillRect(13, 13, 6, 7);
        g.fillStyle(goldBase, 1);
        g.fillRect(14, 14, 4, 5);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(14, 13, 4, 1);

        // Joya / ranura central
        g.fillStyle(keyholeBg, 1);
        g.fillRect(15, 16, 2, 3);
        g.fillStyle(cyanGem, 1);
        g.fillRect(15, 14, 2, 2);
        g.fillStyle(cyanGlow, 1);
        g.fillRect(15, 14, 1, 1);

        g.generateTexture('treasure_closed', size, size);
        g.destroy();
    }

    public static generateOpenChestTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('treasure_open')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const woodDark = 0x3d200a;
        const woodBase = 0x613714;
        const goldShadow = 0x7a5010;
        const goldBase = 0xca9522;
        const goldHighlight = 0xffe26a;

        const rubyRed = 0xff3344;
        const rubyGlow = 0xff8899;
        const emeraldGreen = 0x22cc55;
        const emeraldGlow = 0x77ee99;
        const sapphireBlue = 0x2899f5;
        const coinShine = 0xfff099;
        const sparkleWhite = 0xffffff;

        // 1. Sombra base
        g.fillStyle(0x1a0f05, 0.8);
        g.fillRect(3, 29, 26, 3);

        // 2. Tapa abierta inclinada hacia atrás (de y=2 a y=10)
        g.fillStyle(woodDark, 1);
        g.fillRect(5, 2, 22, 6);
        g.fillStyle(goldShadow, 1);
        g.fillRect(4, 2, 24, 2);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(6, 1, 20, 1);

        // Herrajes de la tapa abierta
        g.fillStyle(goldBase, 1);
        g.fillRect(7, 2, 2, 6);
        g.fillRect(23, 2, 2, 6);

        // Interior oscuro de la tapa abierta
        g.fillStyle(0x241204, 1);
        g.fillRect(6, 7, 20, 4);

        // 3. Montículo desbordante de tesoro (y=9 a y=17)
        // Monedas de oro base
        g.fillStyle(goldBase, 1);
        g.fillRect(6, 10, 20, 6);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(7, 9, 18, 3);
        g.fillStyle(coinShine, 1);
        g.fillRect(9, 8, 14, 2);

        // Detalles de monedas circulares
        g.fillStyle(goldShadow, 1);
        g.fillRect(8, 11, 2, 2);
        g.fillRect(12, 10, 2, 2);
        g.fillRect(17, 11, 2, 2);
        g.fillRect(21, 10, 2, 2);

        // Gemas relucientes
        // Rubí
        g.fillStyle(rubyRed, 1);
        g.fillRect(10, 12, 3, 3);
        g.fillStyle(rubyGlow, 1);
        g.fillRect(10, 12, 1, 1);

        // Zafiro
        g.fillStyle(sapphireBlue, 1);
        g.fillRect(19, 12, 3, 3);
        g.fillStyle(sparkleWhite, 1);
        g.fillRect(20, 12, 1, 1);

        // Esmeralda central
        g.fillStyle(emeraldGreen, 1);
        g.fillRect(14, 11, 4, 4);
        g.fillStyle(emeraldGlow, 1);
        g.fillRect(15, 11, 2, 2);
        g.fillStyle(sparkleWhite, 1);
        g.fillRect(15, 12, 1, 1);

        // Destello estelar estroboscópico superior
        g.fillStyle(sparkleWhite, 1);
        g.fillRect(16, 5, 1, 5);
        g.fillRect(14, 7, 5, 1);
        g.fillStyle(coinShine, 1);
        g.fillRect(15, 6, 3, 3);

        // 4. Base del cofre (de y=16 a y=29)
        g.fillStyle(woodBase, 1);
        g.fillRect(4, 16, 24, 13);
        g.fillStyle(woodDark, 1);
        g.fillRect(4, 27, 24, 2);

        // Herrajes frontales
        g.fillStyle(goldBase, 1);
        g.fillRect(6, 16, 3, 13);
        g.fillRect(23, 16, 3, 13);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(7, 16, 1, 13);
        g.fillRect(24, 16, 1, 13);

        // Borde dorado de apertura
        g.fillStyle(goldHighlight, 1);
        g.fillRect(4, 16, 24, 2);

        // Cerradura abierta colgando
        g.fillStyle(goldShadow, 1);
        g.fillRect(14, 17, 4, 5);
        g.fillStyle(goldBase, 1);
        g.fillRect(14, 18, 4, 3);
        g.fillStyle(0x1a0f05, 1);
        g.fillRect(15, 20, 2, 2);

        g.generateTexture('treasure_open', size, size);
        g.destroy();
    }
}

