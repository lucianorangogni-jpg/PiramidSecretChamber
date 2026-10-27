import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';

/**
 * Generador procedural de texturas para las Pistas Visuales Diegéticas (Murales Jeroglíficos),
 * la Gema Sagrada de Ra y el estado Petrificado de la Momia.
 */
export class HieroglyphGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateMuralCh1P1(scene);
        this.generateMuralCh1P2(scene);
        this.generateMuralCh2P1(scene);
        this.generateMuralCh2P2(scene);
        this.generateMuralCh3P1(scene);
        this.generateMuralCh3P2(scene);
        this.generateMuralCh4P1(scene);
        this.generateMuralCh4P2(scene);
        this.generateSacredGemTexture(scene);
        this.generatePetrifiedMummyTexture(scene);
    }

    /**
     * Recámara 1 - Puzle 1: [Cofre] + [Cofre] + [Llave] -> [III] -> [Cofre Radiante]
     */
    public static generateMuralCh1P1(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch1_p1')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphDark = 0x221307;
        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;

        // Cofre 1
        g.fillStyle(glyphDark, 0.7); g.fillRect(7, 10, 14, 14);
        g.fillStyle(glyphBase, 1); g.fillRect(6, 9, 14, 14);
        g.fillStyle(glyphHighlight, 1); g.fillRect(7, 7, 12, 3);
        g.fillStyle(glyphDark, 1); g.fillRect(11, 13, 4, 6);

        // +
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(25, 12, 2, 8); g.fillRect(22, 15, 8, 2);

        // Cofre 2
        g.fillStyle(glyphDark, 0.7); g.fillRect(34, 10, 14, 14);
        g.fillStyle(glyphBase, 1); g.fillRect(33, 9, 14, 14);
        g.fillStyle(glyphHighlight, 1); g.fillRect(34, 7, 12, 3);
        g.fillStyle(glyphDark, 1); g.fillRect(38, 13, 4, 6);

        // +
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(52, 12, 2, 8); g.fillRect(49, 15, 8, 2);

        // Llave Ankh
        g.fillStyle(goldRadiance, 1);
        g.strokeCircle(66, 11, 4);
        g.fillRect(65, 14, 2, 10);
        g.fillRect(62, 17, 8, 2);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(76, 16, 6, 2); g.fillRect(80, 14, 2, 6);

        // III
        g.fillStyle(goldRadiance, 1);
        g.fillRect(88, 10, 2, 13);
        g.fillRect(92, 10, 2, 13);
        g.fillRect(96, 10, 2, 13);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(102, 16, 6, 2); g.fillRect(106, 14, 2, 6);

        // Cofre Radiante
        g.fillStyle(goldRadiance, 1); g.fillRect(110, 9, 14, 14);
        g.fillStyle(0xfff199, 1); g.fillRect(111, 7, 12, 3);
        g.fillStyle(0xffffff, 1); g.fillRect(115, 5, 2, 2);
        g.fillRect(114, 13, 6, 4);

        g.generateTexture('mural_ch1_p1', width, height);
        if (!scene.textures.exists('mural_puzzle_1')) {
            g.generateTexture('mural_puzzle_1', width, height);
        }
        g.destroy();
    }

    /**
     * Recámara 1 - Puzle 2: [Salto 4x sobre Momia] -> [Momia Petrificada] -> [Gema Sagrada]
     */
    public static generateMuralCh1P2(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch1_p2')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphDark = 0x221307;
        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;
        const gemRadiance = 0x48e4ff;

        // Momia bajo el arco
        g.fillStyle(glyphBase, 0.9);
        g.fillRect(23, 11, 6, 6);
        g.fillRect(21, 17, 10, 8);
        g.fillRect(22, 25, 4, 4);
        g.fillRect(27, 25, 4, 4);
        g.fillStyle(glyphDark, 1);
        g.fillRect(24, 13, 2, 2);

        // Arco parabólico
        g.lineStyle(2, goldRadiance, 1);
        g.beginPath();
        g.moveTo(6, 26);
        for (let x = 7; x <= 46; x++) {
            const t = (x - 6) / 40;
            const y = Math.round(26 - 23 * 4 * t * (1 - t));
            g.lineTo(x, y);
        }
        g.strokePath();

        // 4x
        g.fillStyle(goldRadiance, 1);
        g.fillRect(35, 2, 2, 3); g.fillRect(37, 2, 2, 6); g.fillRect(34, 4, 5, 2);
        g.fillRect(41, 3, 2, 2); g.fillRect(44, 3, 2, 2); g.fillRect(42, 4, 3, 2); g.fillRect(41, 6, 2, 2); g.fillRect(44, 6, 2, 2);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(51, 16, 6, 2); g.fillRect(55, 14, 2, 6);

        // Momia petrificada
        g.fillStyle(glyphBase, 1); g.fillRect(66, 26, 16, 3);
        g.fillStyle(goldRadiance, 1);
        g.fillRect(71, 9, 6, 6); g.fillRect(69, 15, 10, 11);
        g.fillStyle(0xffffff, 1); g.fillRect(73, 4, 3, 3);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(87, 16, 6, 2); g.fillRect(91, 14, 2, 6);

        // Gema
        g.fillStyle(gemRadiance, 1);
        g.fillTriangle(110, 8, 102, 17, 118, 17);
        g.fillTriangle(102, 17, 118, 17, 110, 26);
        g.fillStyle(0xffffff, 1); g.fillRect(109, 15, 3, 3);

        g.generateTexture('mural_ch1_p2', width, height);
        if (!scene.textures.exists('mural_puzzle_2')) {
            g.generateTexture('mural_puzzle_2', width, height);
        }
        g.destroy();
    }

    /**
     * Recámara 2 - Puzle 1: [Cofre N0] -> [Llave] -> [Salto Momia] -> [II] -> [Cofre Radiante]
     */
    public static generateMuralCh2P1(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch2_p1')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphDark = 0x221307;
        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;

        // Cofre N0
        g.fillStyle(glyphBase, 1); g.fillRect(5, 9, 14, 14);
        g.fillStyle(glyphHighlight, 1); g.fillRect(6, 7, 12, 3);
        g.fillStyle(glyphDark, 1); g.fillRect(9, 13, 6, 4);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(23, 16, 5, 2); g.fillRect(26, 14, 2, 5);

        // Llave Ankh
        g.fillStyle(goldRadiance, 1);
        g.strokeCircle(36, 11, 4);
        g.fillRect(35, 14, 2, 10);
        g.fillRect(32, 17, 8, 2);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(47, 16, 5, 2); g.fillRect(50, 14, 2, 5);

        // Salto sobre momia 1x
        g.fillStyle(glyphBase, 0.8);
        g.fillRect(64, 13, 8, 12);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(56, 26);
        for (let x = 57; x <= 78; x++) {
            const t = (x - 56) / 22;
            const y = Math.round(26 - 19 * 4 * t * (1 - t));
            g.lineTo(x, y);
        }
        g.strokePath();

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(84, 16, 5, 2); g.fillRect(87, 14, 2, 5);

        // II
        g.fillStyle(goldRadiance, 1);
        g.fillRect(95, 10, 2, 13);
        g.fillRect(99, 10, 2, 13);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(105, 16, 5, 2); g.fillRect(108, 14, 2, 5);

        // Cofre Radiante
        g.fillStyle(goldRadiance, 1); g.fillRect(112, 9, 13, 14);
        g.fillStyle(0xffffff, 1); g.fillRect(116, 6, 2, 2);

        g.generateTexture('mural_ch2_p1', width, height);
        g.destroy();
    }

    /**
     * Recámara 2 - Puzle 2: [Salto 2x N1] + [Salto 2x N2] -> [Momia Petrificada] -> [Gema Sagrada]
     */
    public static generateMuralCh2P2(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch2_p2')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;
        const gemRadiance = 0x48e4ff;

        // Salto 2x
        g.fillStyle(glyphBase, 0.8); g.fillRect(12, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(4, 26);
        for (let x = 5; x <= 26; x++) {
            const t = (x - 4) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();
        g.fillStyle(goldRadiance, 1);
        g.fillRect(20, 3, 5, 2); // 2

        // +
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(34, 12, 2, 8); g.fillRect(31, 15, 8, 2);

        // Salto 2x
        g.fillStyle(glyphBase, 0.8); g.fillRect(50, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(42, 26);
        for (let x = 43; x <= 64; x++) {
            const t = (x - 42) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();
        g.fillStyle(goldRadiance, 1);
        g.fillRect(58, 3, 5, 2); // 2

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(72, 16, 5, 2); g.fillRect(75, 14, 2, 5);

        // Estatua petrificada
        g.fillStyle(goldRadiance, 1);
        g.fillRect(85, 10, 8, 15);
        g.fillStyle(0xffffff, 1); g.fillRect(88, 5, 2, 2);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(99, 16, 5, 2); g.fillRect(102, 14, 2, 5);

        // Gema
        g.fillStyle(gemRadiance, 1);
        g.fillTriangle(116, 8, 109, 17, 123, 17);
        g.fillTriangle(109, 17, 123, 17, 116, 26);

        g.generateTexture('mural_ch2_p2', width, height);
        g.destroy();
    }

    /**
     * Recámara 3 - Puzle 1: [Llave 1.º] -> [Cofre + Cofre] -> [IIII] -> [Cofre Radiante]
     */
    public static generateMuralCh3P1(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch3_p1')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;

        // Llave Ankh + 1
        g.fillStyle(goldRadiance, 1);
        g.strokeCircle(10, 11, 4);
        g.fillRect(9, 14, 2, 10);
        g.fillRect(6, 17, 8, 2);
        g.fillRect(16, 16, 2, 5); // 1

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(24, 16, 5, 2); g.fillRect(27, 14, 2, 5);

        // Cofre + Cofre
        g.fillStyle(glyphBase, 1); g.fillRect(34, 10, 12, 12);
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(50, 13, 2, 6); g.fillRect(48, 15, 6, 2);
        g.fillStyle(glyphBase, 1); g.fillRect(58, 10, 12, 12);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(74, 16, 5, 2); g.fillRect(77, 14, 2, 5);

        // IIII
        g.fillStyle(goldRadiance, 1);
        g.fillRect(84, 10, 2, 13);
        g.fillRect(88, 10, 2, 13);
        g.fillRect(92, 10, 2, 13);
        g.fillRect(96, 10, 2, 13);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(102, 16, 5, 2); g.fillRect(105, 14, 2, 5);

        // Cofre Radiante
        g.fillStyle(goldRadiance, 1); g.fillRect(110, 9, 14, 14);
        g.fillStyle(0xffffff, 1); g.fillRect(115, 5, 2, 2);

        g.generateTexture('mural_ch3_p1', width, height);
        g.destroy();
    }

    /**
     * Recámara 3 - Puzle 2: [Salto 1x N1] + [Salto 3x N2] -> [Momia Petrificada] -> [Gema Sagrada]
     */
    public static generateMuralCh3P2(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch3_p2')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;
        const gemRadiance = 0x48e4ff;

        // Salto 1x
        g.fillStyle(glyphBase, 0.8); g.fillRect(12, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(4, 26);
        for (let x = 5; x <= 26; x++) {
            const t = (x - 4) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();
        g.fillStyle(goldRadiance, 1);
        g.fillRect(21, 3, 2, 5); // 1

        // +
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(34, 12, 2, 8); g.fillRect(31, 15, 8, 2);

        // Salto 3x
        g.fillStyle(glyphBase, 0.8); g.fillRect(50, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(42, 26);
        for (let x = 43; x <= 64; x++) {
            const t = (x - 42) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();
        g.fillStyle(goldRadiance, 1);
        g.fillRect(58, 3, 5, 2); // 3

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(72, 16, 5, 2); g.fillRect(75, 14, 2, 5);

        // Estatua petrificada
        g.fillStyle(goldRadiance, 1);
        g.fillRect(85, 10, 8, 15);
        g.fillStyle(0xffffff, 1); g.fillRect(88, 5, 2, 2);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(99, 16, 5, 2); g.fillRect(102, 14, 2, 5);

        // Gema
        g.fillStyle(gemRadiance, 1);
        g.fillTriangle(116, 8, 109, 17, 123, 17);
        g.fillTriangle(109, 17, 123, 17, 116, 26);

        g.generateTexture('mural_ch3_p2', width, height);
        g.destroy();
    }

    /**
     * Recámara 4 - Puzle 1: [2 Cofres + Llave + 2x Salto] -> [I] -> [Cofre Radiante]
     */
    public static generateMuralCh4P1(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch4_p1')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;

        // Cofres
        g.fillStyle(glyphBase, 1); g.fillRect(4, 10, 10, 12);
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(17, 13, 2, 6); g.fillRect(15, 15, 6, 2);

        // Llave
        g.fillStyle(goldRadiance, 1);
        g.strokeCircle(28, 11, 4);
        g.fillRect(27, 14, 2, 9);
        g.fillRect(25, 16, 6, 2);

        // +
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(39, 13, 2, 6); g.fillRect(37, 15, 6, 2);

        // Salto 2x
        g.fillStyle(glyphBase, 0.8); g.fillRect(54, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(46, 26);
        for (let x = 47; x <= 68; x++) {
            const t = (x - 46) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(78, 16, 5, 2); g.fillRect(81, 14, 2, 5);

        // I
        g.fillStyle(goldRadiance, 1);
        g.fillRect(92, 10, 3, 13);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(102, 16, 5, 2); g.fillRect(105, 14, 2, 5);

        // Cofre Radiante
        g.fillStyle(goldRadiance, 1); g.fillRect(111, 9, 13, 14);
        g.fillStyle(0xffffff, 1); g.fillRect(115, 5, 2, 2);

        g.generateTexture('mural_ch4_p1', width, height);
        g.destroy();
    }

    /**
     * Recámara 4 - Puzle 2: [Salto 3x N1] + [Salto 1x N2] -> [Momia Petrificada] -> [Gema Sagrada]
     */
    public static generateMuralCh4P2(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_ch4_p2')) return;

        const width = 128;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const glyphBase = 0xb88846;
        const glyphHighlight = 0xe0b268;
        const goldRadiance = 0xffdf6d;
        const gemRadiance = 0x48e4ff;

        // Salto 3x
        g.fillStyle(glyphBase, 0.8); g.fillRect(12, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(4, 26);
        for (let x = 5; x <= 26; x++) {
            const t = (x - 4) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();
        g.fillStyle(goldRadiance, 1);
        g.fillRect(19, 3, 5, 2); // 3

        // +
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(34, 12, 2, 8); g.fillRect(31, 15, 8, 2);

        // Salto 1x
        g.fillStyle(glyphBase, 0.8); g.fillRect(50, 15, 8, 10);
        g.lineStyle(1.5, goldRadiance, 1);
        g.beginPath();
        g.moveTo(42, 26);
        for (let x = 43; x <= 64; x++) {
            const t = (x - 42) / 22;
            g.lineTo(x, Math.round(26 - 18 * 4 * t * (1 - t)));
        }
        g.strokePath();
        g.fillStyle(goldRadiance, 1);
        g.fillRect(59, 3, 2, 5); // 1

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(72, 16, 5, 2); g.fillRect(75, 14, 2, 5);

        // Estatua petrificada
        g.fillStyle(goldRadiance, 1);
        g.fillRect(85, 10, 8, 15);
        g.fillStyle(0xffffff, 1); g.fillRect(88, 5, 2, 2);

        // ->
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(99, 16, 5, 2); g.fillRect(102, 14, 2, 5);

        // Gema
        g.fillStyle(gemRadiance, 1);
        g.fillTriangle(116, 8, 109, 17, 123, 17);
        g.fillTriangle(109, 17, 123, 17, 116, 26);

        g.generateTexture('mural_ch4_p2', width, height);
        g.destroy();
    }

    /**
     * Textura de la Gema Sagrada de Ra (32x32 px)
     */
    public static generateSacredGemTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('item_gem')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const gemCyan = 0x2be4ff;
        const gemDeep = 0x117ca8;
        const gemHighlight = 0xa3f6ff;
        const gemCore = 0xffffff;
        const auraGold = 0xffe066;

        // Aura mística exterior
        g.fillStyle(auraGold, 0.35);
        g.fillCircle(16, 16, 13);

        // Faceta inferior
        g.fillStyle(gemDeep, 1);
        g.fillTriangle(8, 13, 24, 13, 16, 27);

        // Faceta superior
        g.fillStyle(gemCyan, 1);
        g.fillTriangle(8, 13, 24, 13, 16, 5);

        // Facetas laterales
        g.fillStyle(gemHighlight, 1);
        g.fillTriangle(16, 5, 12, 13, 16, 13);
        g.fillTriangle(16, 13, 12, 13, 16, 27);

        // Brillo deslumbrante central
        g.fillStyle(gemCore, 1);
        g.fillRect(15, 11, 3, 4);
        g.fillRect(14, 12, 5, 2);

        g.generateTexture('item_gem', size, size);
        g.destroy();
    }

    /**
     * Textura de la Momia Petrificada (32x32 px)
     */
    public static generatePetrifiedMummyTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('mummy_petrified')) return;

        const size = GameConstants.TILE_SIZE; // 32
        const g = scene.make.graphics({ x: 0, y: 0 });

        const stoneBase = 0x7a6345;
        const stoneHighlight = 0xb59a72;
        const stoneDark = 0x473722;
        const goldVein = 0xe6bf43;

        // Silueta petrificada en piedra arenisca
        g.fillStyle(stoneBase, 1);
        g.fillRect(10, 4, 12, 8);
        g.fillStyle(stoneHighlight, 1);
        g.fillRect(10, 4, 12, 2);
        g.fillRect(10, 4, 2, 8);

        // Torso y vendajes de piedra
        g.fillStyle(stoneBase, 1);
        g.fillRect(8, 12, 16, 12);
        g.fillStyle(stoneDark, 1);
        g.fillRect(8, 15, 16, 2);
        g.fillRect(8, 20, 16, 2);

        // Vetas doradas de magia petrificadora
        g.fillStyle(goldVein, 1);
        g.fillRect(13, 7, 2, 2);
        g.fillRect(11, 14, 3, 1);
        g.fillRect(18, 18, 3, 1);
        g.fillRect(14, 22, 2, 2);

        // Piernas
        g.fillStyle(stoneBase, 1);
        g.fillRect(10, 24, 5, 8);
        g.fillRect(17, 24, 5, 8);
        g.fillStyle(stoneDark, 1);
        g.fillRect(10, 30, 12, 2);

        g.generateTexture('mummy_petrified', size, size);
        g.destroy();
    }
}
