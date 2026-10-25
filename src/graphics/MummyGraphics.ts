import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';

/**
 * Generador procedural de texturas pixel-art para la Momia enemiga (32x32 px).
 * - `mummy_walk_1`: Pose de caminata cuadro 1 con vendajes egipcios y ojos carmesí.
 * - `mummy_walk_2`: Pose de caminata cuadro 2 con zancada invertida y jirones de lino.
 */
export class MummyGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateWalk1Texture(scene);
        this.generateWalk2Texture(scene);
    }

    public static generateWalk1Texture(scene: Phaser.Scene): void {
        if (scene.textures.exists('mummy_walk_1')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const outline = 0x24180d;
        const linenDark = 0x6e5a40;
        const linenMid = 0xab9574;
        const linenLight = 0xdec8a4;
        const linenHighlight = 0xf5eedb;
        const eyeRed = 0xff2040;
        const eyeGlow = 0xff99aa;

        // 1. Cabeza vendada (y=2 a y=11, x=10 a x=22)
        // Fondo cabeza
        g.fillStyle(linenMid, 1);
        g.fillRect(10, 2, 12, 10);

        // Contorno cabeza
        g.fillStyle(outline, 1);
        g.fillRect(11, 1, 10, 1); // Coronilla
        g.fillRect(9, 3, 1, 8);   // Lateral izq
        g.fillRect(22, 3, 1, 8);  // Lateral der
        g.fillRect(11, 12, 10, 1); // Barbilla

        // Tiras de vendaje en cabeza
        g.fillStyle(linenLight, 1);
        g.fillRect(10, 2, 12, 2);
        g.fillRect(10, 6, 12, 1);
        g.fillRect(10, 9, 12, 2);

        g.fillStyle(linenHighlight, 1);
        g.fillRect(12, 3, 4, 1);
        g.fillRect(13, 10, 5, 1);

        g.fillStyle(linenDark, 1);
        g.fillRect(10, 4, 12, 1);
        g.fillRect(10, 8, 12, 1);

        // Ranura de ojos y brillo maligno
        g.fillStyle(outline, 1);
        g.fillRect(12, 5, 9, 2);
        g.fillStyle(eyeRed, 1);
        g.fillRect(14, 5, 2, 2);
        g.fillRect(18, 5, 2, 2);
        g.fillStyle(eyeGlow, 1);
        g.fillRect(15, 5, 1, 1);
        g.fillRect(19, 5, 1, 1);

        // 2. Torso vendado (y=13 a y=22, x=9 a x=23)
        g.fillStyle(linenMid, 1);
        g.fillRect(11, 13, 10, 9);

        // Vendajes diagonales del pecho
        g.fillStyle(linenLight, 1);
        g.fillRect(10, 13, 12, 2);
        g.fillRect(11, 16, 10, 2);
        g.fillRect(10, 19, 12, 2);

        g.fillStyle(linenDark, 1);
        g.fillRect(10, 15, 12, 1);
        g.fillRect(11, 18, 10, 1);
        g.fillRect(10, 21, 12, 1);

        // Jirones de lino flotantes a la izquierda
        g.fillStyle(linenMid, 1);
        g.fillRect(7, 15, 3, 2);
        g.fillRect(6, 17, 2, 3);
        g.fillStyle(linenLight, 1);
        g.fillRect(8, 15, 2, 1);

        // 3. Brazos (Pose Frame 1: brazo derecho extendido hacia adelante)
        // Brazo frontal (derecha)
        g.fillStyle(outline, 1);
        g.fillRect(20, 13, 9, 5);
        g.fillStyle(linenMid, 1);
        g.fillRect(20, 14, 8, 3);
        g.fillStyle(linenLight, 1);
        g.fillRect(21, 14, 7, 1);
        g.fillStyle(linenDark, 1);
        g.fillRect(23, 16, 4, 1);
        // Mano frontal vendada
        g.fillStyle(linenHighlight, 1);
        g.fillRect(27, 14, 2, 3);

        // Brazo trasero (izquierda)
        g.fillStyle(linenDark, 1);
        g.fillRect(8, 14, 3, 6);
        g.fillStyle(linenMid, 1);
        g.fillRect(8, 15, 2, 4);

        // 4. Piernas (Pose Frame 1: pierna delantera derecha, trasera izquierda)
        // Pierna izquierda (retrasada)
        g.fillStyle(linenDark, 1);
        g.fillRect(10, 22, 4, 9);
        g.fillStyle(linenMid, 1);
        g.fillRect(11, 23, 3, 7);
        // Pie izquierdo
        g.fillStyle(linenDark, 1);
        g.fillRect(9, 30, 5, 2);

        // Pierna derecha (adelantada)
        g.fillStyle(linenMid, 1);
        g.fillRect(17, 22, 4, 9);
        g.fillStyle(linenLight, 1);
        g.fillRect(17, 23, 3, 7);
        g.fillStyle(linenHighlight, 1);
        g.fillRect(17, 25, 2, 2);
        g.fillStyle(linenDark, 1);
        g.fillRect(17, 26, 4, 1);
        // Pie derecho
        g.fillStyle(outline, 1);
        g.fillRect(17, 30, 6, 2);
        g.fillStyle(linenMid, 1);
        g.fillRect(18, 30, 5, 1);

        g.generateTexture('mummy_walk_1', size, size);
        g.destroy();
    }

    public static generateWalk2Texture(scene: Phaser.Scene): void {
        if (scene.textures.exists('mummy_walk_2')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const outline = 0x24180d;
        const linenDark = 0x6e5a40;
        const linenMid = 0xab9574;
        const linenLight = 0xdec8a4;
        const linenHighlight = 0xf5eedb;
        const eyeRed = 0xff2040;
        const eyeGlow = 0xff99aa;

        // 1. Cabeza vendada (con leve inclinación de marcha)
        g.fillStyle(linenMid, 1);
        g.fillRect(10, 3, 12, 10);

        g.fillStyle(outline, 1);
        g.fillRect(11, 2, 10, 1);
        g.fillRect(9, 4, 1, 8);
        g.fillRect(22, 4, 1, 8);
        g.fillRect(11, 13, 10, 1);

        g.fillStyle(linenLight, 1);
        g.fillRect(10, 3, 12, 2);
        g.fillRect(10, 7, 12, 1);
        g.fillRect(10, 10, 12, 2);

        g.fillStyle(linenHighlight, 1);
        g.fillRect(12, 4, 4, 1);
        g.fillRect(13, 11, 5, 1);

        g.fillStyle(linenDark, 1);
        g.fillRect(10, 5, 12, 1);
        g.fillRect(10, 9, 12, 1);

        // Ojos
        g.fillStyle(outline, 1);
        g.fillRect(12, 6, 9, 2);
        g.fillStyle(eyeRed, 1);
        g.fillRect(14, 6, 2, 2);
        g.fillRect(18, 6, 2, 2);
        g.fillStyle(eyeGlow, 1);
        g.fillRect(15, 6, 1, 1);
        g.fillRect(19, 6, 1, 1);

        // 2. Torso
        g.fillStyle(linenMid, 1);
        g.fillRect(11, 14, 10, 9);

        g.fillStyle(linenLight, 1);
        g.fillRect(10, 14, 12, 2);
        g.fillRect(11, 17, 10, 2);
        g.fillRect(10, 20, 12, 2);

        g.fillStyle(linenDark, 1);
        g.fillRect(10, 16, 12, 1);
        g.fillRect(11, 19, 10, 1);
        g.fillRect(10, 22, 12, 1);

        // Jirones de lino en movimiento
        g.fillStyle(linenMid, 1);
        g.fillRect(6, 16, 4, 2);
        g.fillRect(5, 18, 3, 3);
        g.fillStyle(linenLight, 1);
        g.fillRect(7, 16, 2, 1);

        // 3. Brazos (Pose Frame 2: ambos brazos alzados en tensión arcade)
        g.fillStyle(outline, 1);
        g.fillRect(19, 12, 10, 5);
        g.fillStyle(linenMid, 1);
        g.fillRect(19, 13, 9, 3);
        g.fillStyle(linenLight, 1);
        g.fillRect(20, 13, 8, 1);
        g.fillStyle(linenDark, 1);
        g.fillRect(22, 15, 5, 1);
        g.fillStyle(linenHighlight, 1);
        g.fillRect(27, 13, 2, 3);

        // 4. Piernas (Pose Frame 2: pierna izquierda adelantada, derecha atrasada)
        // Pierna izquierda (adelantada)
        g.fillStyle(linenMid, 1);
        g.fillRect(11, 23, 4, 8);
        g.fillStyle(linenLight, 1);
        g.fillRect(11, 24, 3, 6);
        g.fillStyle(linenHighlight, 1);
        g.fillRect(11, 25, 2, 2);
        g.fillStyle(linenDark, 1);
        g.fillRect(11, 27, 4, 1);
        // Pie izquierdo adelantado
        g.fillStyle(outline, 1);
        g.fillRect(10, 30, 6, 2);
        g.fillStyle(linenMid, 1);
        g.fillRect(11, 30, 5, 1);

        // Pierna derecha (retrasada)
        g.fillStyle(linenDark, 1);
        g.fillRect(17, 23, 4, 8);
        g.fillStyle(linenMid, 1);
        g.fillRect(17, 24, 3, 6);
        // Pie derecho atrasado
        g.fillStyle(linenDark, 1);
        g.fillRect(17, 30, 5, 2);

        g.generateTexture('mummy_walk_2', size, size);
        g.destroy();
    }
}

