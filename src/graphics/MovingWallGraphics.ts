import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';

/**
 * Generador procedural de texturas pixel-art (32x32 px) para las Paredes Movedizas
 * y sus Activadores de suelo (placas de presión rúnicas).
 */
export class MovingWallGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateMovingWallTexture(scene);
        this.generateTriggerPlateTexture(scene);
        this.generateTriggerPlateActiveTexture(scene);
    }

    public static generateMovingWallTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_moving_wall')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const stoneDark = 0x36200c;
        const stoneBase = 0x9b6b28;
        const stoneHighlight = 0xd9a44b;
        const stoneShadow = 0x614013;
        const goldAccent = 0xf5cf67;
        const runeGlow = 0xffe891;

        // Fondo base de losa megalítica
        g.fillStyle(stoneBase, 1);
        g.fillRect(0, 0, size, size);

        // Bisel superior y lateral izquierdo
        g.fillStyle(stoneHighlight, 1);
        g.fillRect(0, 0, size, 2);
        g.fillRect(0, 0, 2, size);

        // Sombra inferior y lateral derecho
        g.fillStyle(stoneDark, 1);
        g.fillRect(0, size - 2, size, 2);
        g.fillRect(size - 2, 0, 2, size);

        // Ranuras verticales de deslizamiento a los costados
        g.fillStyle(stoneDark, 1);
        g.fillRect(3, 2, 2, size - 4);
        g.fillRect(size - 5, 2, 2, size - 4);

        g.fillStyle(stoneHighlight, 1);
        g.fillRect(5, 2, 1, size - 4);
        g.fillRect(size - 6, 2, 1, size - 4);

        // Panel central tallado con bajorrelieve
        g.fillStyle(stoneShadow, 1);
        g.fillRect(7, 4, 18, 24);
        g.fillStyle(stoneBase, 1);
        g.fillRect(8, 5, 16, 22);

        // Símbolo del Ojo de Horus / Ankh central
        g.fillStyle(goldAccent, 1);
        // Travesaño superior
        g.fillRect(12, 8, 8, 3);
        // Ojo / Lazo sagrado
        g.fillRect(14, 11, 4, 3);
        // Tronco vertical
        g.fillRect(15, 14, 2, 8);
        // Base
        g.fillRect(13, 22, 6, 2);

        // Brillo interior del símbolo
        g.fillStyle(runeGlow, 1);
        g.fillRect(15, 9, 2, 2);
        g.fillRect(15, 12, 2, 2);

        g.generateTexture('tile_moving_wall', size, size);
        g.destroy();
    }

    public static generateTriggerPlateTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_trigger_plate')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const foundation = 0x3d250f;
        const plateSurface = 0xa37b38;
        const plateHighlight = 0xd9b362;
        const plateShadow = 0x5a3e18;
        const runeCyan = 0x24bad1;
        const runeGlow = 0x82f1ff;

        // Cimiento embutido en el piso (y=26 a y=32)
        g.fillStyle(foundation, 1);
        g.fillRect(2, 27, 28, 5);

        // Superficie biselada de la losa rúnica
        g.fillStyle(plateHighlight, 1);
        g.fillRect(4, 21, 24, 2);
        g.fillStyle(plateSurface, 1);
        g.fillRect(4, 23, 24, 3);
        g.fillStyle(plateShadow, 1);
        g.fillRect(4, 26, 24, 2);

        // Runas místicas inactivas (color cian turquesa)
        g.fillStyle(runeCyan, 1);
        g.fillRect(10, 22, 12, 2);
        g.fillRect(13, 21, 6, 3);
        g.fillStyle(runeGlow, 1);
        g.fillRect(15, 22, 2, 1);

        g.generateTexture('tile_trigger_plate', size, size);
        g.destroy();
    }

    public static generateTriggerPlateActiveTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_trigger_plate_active')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const foundation = 0x2e1908;
        const plateSurface = 0xc4963e;
        const plateHighlight = 0xffe68a;
        const plateShadow = 0x664414;
        const runeGold = 0xffea60;
        const runeRadiant = 0xffffff;

        // Cimiento
        g.fillStyle(foundation, 1);
        g.fillRect(2, 28, 28, 4); // Ligeramente hundida por la pisada

        // Superficie hundida activa
        g.fillStyle(plateHighlight, 1);
        g.fillRect(4, 23, 24, 2);
        g.fillStyle(plateSurface, 1);
        g.fillRect(4, 25, 24, 3);
        g.fillStyle(plateShadow, 1);
        g.fillRect(4, 28, 24, 1);

        // Resplandor dorado de activación
        g.fillStyle(runeGold, 1);
        g.fillRect(8, 24, 16, 3);
        g.fillStyle(runeRadiant, 1);
        g.fillRect(12, 24, 8, 2);

        g.generateTexture('tile_trigger_plate_active', size, size);
        g.destroy();
    }
}

