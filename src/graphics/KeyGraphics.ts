import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';

/**
 * Generador procedural de texturas pixel art (32x32 px) para:
 * - La Llave Dorada Ancestral (`item_key`)
 * - La Cadena de Suspensión (`item_chain`)
 * - La Puerta de Salida Bloqueada (`tile_door_locked`)
 * - La Puerta de Salida Desbloqueada/Abierta (`tile_door_open`)
 */
export class KeyGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateKeyTexture(scene);
        this.generateChainTexture(scene);
        this.generateDoorLockedTexture(scene);
        this.generateDoorOpenTexture(scene);
    }

    public static generateKeyTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('item_key')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const goldBase = 0xe0a828;
        const goldHighlight = 0xfff085;
        const goldShadow = 0x825208;
        const runeGlow = 0xffffff;

        // 1. Cabeza / Anilla de la Llave (estilo Ankh / lazo sagrado)
        // Borde exterior
        g.fillStyle(goldShadow, 1);
        g.fillCircle(16, 9, 7);

        // Superficie dorada
        g.fillStyle(goldBase, 1);
        g.fillCircle(16, 9, 6);

        // Agujero interior
        g.fillStyle(0x181108, 1); // Color de fondo de la recámara
        g.fillCircle(16, 9, 3);

        // Brillo superior de la anilla
        g.fillStyle(goldHighlight, 1);
        g.fillRect(15, 3, 3, 2);
        g.fillRect(11, 7, 2, 2);

        // Travesaño ornamental (Ankh)
        g.fillStyle(goldShadow, 1);
        g.fillRect(11, 14, 10, 3);
        g.fillStyle(goldBase, 1);
        g.fillRect(12, 14, 8, 2);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(13, 14, 6, 1);

        // 2. Vástago / Eje cilíndrico de la llave
        g.fillStyle(goldShadow, 1);
        g.fillRect(15, 16, 4, 12);
        g.fillStyle(goldBase, 1);
        g.fillRect(15, 16, 3, 12);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(15, 16, 1, 12);

        // 3. Dientes / Paletón rúnico
        g.fillStyle(goldShadow, 1);
        g.fillRect(18, 21, 5, 2);
        g.fillRect(18, 25, 4, 3);
        g.fillStyle(goldBase, 1);
        g.fillRect(18, 21, 4, 2);
        g.fillRect(18, 25, 3, 2);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(18, 21, 2, 1);
        g.fillRect(18, 25, 2, 1);

        // 4. Destello místico
        g.fillStyle(runeGlow, 1);
        g.fillRect(16, 6, 1, 1);
        g.fillRect(19, 14, 1, 1);

        g.generateTexture('item_key', size, size);
        g.destroy();
    }

    public static generateChainTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('item_chain')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const chainDark = 0x24170a;
        const chainBase = 0x6e4e26;
        const chainHighlight = 0xb58b52;

        // Dibujar 4 eslabones entrelazados verticalmente en la columna central (x = 16)
        for (let y = 0; y < size; y += 8) {
            // Eslabón frontal (anillo)
            g.fillStyle(chainDark, 1);
            g.fillRect(14, y, 4, 7);

            g.fillStyle(chainBase, 1);
            g.fillRect(14, y, 3, 7);

            g.fillStyle(0x181108, 1); // Hueco interior
            g.fillRect(15, y + 2, 1, 3);

            g.fillStyle(chainHighlight, 1);
            g.fillRect(14, y + 1, 1, 5);
        }

        g.generateTexture('item_chain', size, size);
        g.destroy();
    }

    public static generateDoorLockedTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_door_locked')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const archGold = 0xebbe46;
        const archHighlight = 0xffe47d;
        const archShadow = 0x94661c;
        const doorPanel = 0x8a5d12;
        const doorSeam = 0x2e1906;
        const lockBronze = 0xbf7824;
        const lockHighlight = 0xffcc66;
        const lockShadow = 0x542c06;

        // Marco y escalón
        g.fillStyle(0x73522e, 1);
        g.fillRect(0, 30, size, 2);
        g.fillStyle(doorPanel, 1);
        g.fillRect(6, 6, 20, 24);
        g.fillStyle(archGold, 1);
        g.fillRect(2, 4, 4, 26);
        g.fillRect(26, 4, 4, 26);
        g.fillStyle(archHighlight, 1);
        g.fillRect(4, 0, 24, 4);
        g.fillStyle(archShadow, 1);
        g.fillRect(2, 2, 2, 2);
        g.fillRect(28, 2, 2, 2);

        // Ranura central
        g.fillStyle(doorSeam, 1);
        g.fillRect(15, 6, 2, 24);

        // Candado ancestral en el centro (x = 13..19, y = 14..22)
        // Arco del candado
        g.fillStyle(lockShadow, 1);
        g.fillRect(13, 11, 6, 4);
        g.fillStyle(0x8a5d12, 1);
        g.fillRect(15, 13, 2, 2);

        // Cuerpo del candado
        g.fillStyle(lockShadow, 1);
        g.fillRect(12, 15, 8, 8);
        g.fillStyle(lockBronze, 1);
        g.fillRect(13, 16, 6, 6);
        g.fillStyle(lockHighlight, 1);
        g.fillRect(13, 16, 6, 1);
        g.fillRect(13, 16, 1, 6);

        // Ojo de la cerradura
        g.fillStyle(0x181108, 1);
        g.fillRect(15, 18, 2, 2);
        g.fillRect(15, 20, 2, 1);

        g.generateTexture('tile_door_locked', size, size);
        g.destroy();
    }

    public static generateDoorOpenTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('tile_door_open')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const archGold = 0xebbe46;
        const archHighlight = 0xffe47d;
        const archShadow = 0x94661c;
        const exitGlow = 0xffea78;
        const portalRadiance = 0xffffff;

        // Marco y escalón
        g.fillStyle(0x73522e, 1);
        g.fillRect(0, 30, size, 2);
        g.fillStyle(archGold, 1);
        g.fillRect(2, 4, 4, 26);
        g.fillRect(26, 4, 4, 26);
        g.fillStyle(archHighlight, 1);
        g.fillRect(4, 0, 24, 4);
        g.fillStyle(archShadow, 1);
        g.fillRect(2, 2, 2, 2);
        g.fillRect(28, 2, 2, 2);

        // Umbral abierto iluminado hacia la salida
        g.fillStyle(0xdba12e, 1);
        g.fillRect(6, 6, 20, 24);
        g.fillStyle(exitGlow, 1);
        g.fillRect(8, 8, 16, 22);
        g.fillStyle(portalRadiance, 1);
        g.fillRect(11, 11, 10, 19);

        g.generateTexture('tile_door_open', size, size);
        g.destroy();
    }
}

