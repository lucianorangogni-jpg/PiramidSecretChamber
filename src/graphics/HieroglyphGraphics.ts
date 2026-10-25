import * as Phaser from 'phaser';
import { GameConstants } from '../core/GameConstants.ts';

/**
 * Generador procedural de texturas para las Pistas Visuales Diegéticas (Murales Jeroglíficos),
 * la Gema Sagrada de Ra y el estado Petrificado de la Momia.
 */
export class HieroglyphGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateMuralPuzzle1(scene);
        this.generateMuralPuzzle2(scene);
        this.generateSacredGemTexture(scene);
        this.generatePetrifiedMummyTexture(scene);
    }

    /**
     * Mural Jeroglífico Nivel 0:
     * Fórmula diegética: [Cofre] + [Cofre] + [Llave] -> [III] -> [Cofre Sagrado ☥]
     */
    public static generateMuralPuzzle1(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_puzzle_1')) return;

        const width = 96;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const stoneBg = 0x241508;
        const stoneBorder = 0x3d2510;
        const glyphDark = 0x5a3916;
        const glyphBase = 0x9e6f32;
        const glyphHighlight = 0xd9ab5b;
        const goldRadiance = 0xffdf6d;

        // Placa de piedra de fondo
        g.fillStyle(stoneBg, 0.85);
        g.fillRect(0, 0, width, height);
        g.fillStyle(stoneBorder, 1);
        g.strokeRect(1, 1, width - 2, height - 2);

        // --- ICONO 1: Cofre 1 (x: 4..14) ---
        g.fillStyle(glyphBase, 1);
        g.fillRect(4, 12, 10, 8);
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(5, 10, 8, 3);
        g.fillStyle(glyphDark, 1);
        g.fillRect(8, 14, 2, 3);

        // Signo "+" (x: 17..21)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(18, 12, 2, 8);
        g.fillRect(15, 15, 8, 2);

        // --- ICONO 2: Cofre 2 (x: 26..36) ---
        g.fillStyle(glyphBase, 1);
        g.fillRect(26, 12, 10, 8);
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(27, 10, 8, 3);
        g.fillStyle(glyphDark, 1);
        g.fillRect(30, 14, 2, 3);

        // Signo "+" (x: 39..43)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(40, 12, 2, 8);
        g.fillRect(37, 15, 8, 2);

        // --- ICONO 3: Llave Sagrada (x: 47..53) ---
        g.fillStyle(goldRadiance, 1);
        g.fillCircle(50, 12, 3);
        g.fillRect(49, 14, 2, 7);
        g.fillRect(51, 18, 2, 2);

        // Flecha "->" (x: 56..64)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(56, 15, 6, 2);
        g.fillRect(61, 13, 2, 6);
        g.fillRect(63, 14, 1, 4);

        // --- ICONO 4: Tres Marcas Sagradas "III" (x: 67..75) ---
        g.fillStyle(goldRadiance, 1);
        g.fillRect(67, 10, 2, 12);
        g.fillRect(71, 10, 2, 12);
        g.fillRect(75, 10, 2, 12);

        // Flecha "->" (x: 79..85)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(79, 15, 4, 2);
        g.fillRect(82, 13, 2, 6);

        // --- ICONO 5: Cofre Sagrado con Resplandor (x: 86..94) ---
        g.fillStyle(goldRadiance, 1);
        g.fillRect(86, 12, 8, 8);
        g.fillRect(85, 9, 10, 3);
        // Símbolo solar / Ankh en la tapa
        g.fillStyle(0xffffff, 1);
        g.fillRect(89, 7, 2, 2);
        g.fillRect(88, 14, 4, 2);

        g.generateTexture('mural_puzzle_1', width, height);
        g.destroy();
    }

    /**
     * Mural Jeroglífico Nivel 1:
     * Fórmula diegética: [Momia] + [Salto 4x (IIII)] -> [Momia Inmóvil] -> [Gema Sagrada ☥]
     */
    public static generateMuralPuzzle2(scene: Phaser.Scene): void {
        if (scene.textures.exists('mural_puzzle_2')) return;

        const width = 96;
        const height = 32;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const stoneBg = 0x241508;
        const stoneBorder = 0x3d2510;
        const glyphDark = 0x5a3916;
        const glyphBase = 0x9e6f32;
        const glyphHighlight = 0xd9ab5b;
        const gemRadiance = 0x48e4ff;

        // Placa de piedra de fondo
        g.fillStyle(stoneBg, 0.85);
        g.fillRect(0, 0, width, height);
        g.fillStyle(stoneBorder, 1);
        g.strokeRect(1, 1, width - 2, height - 2);

        // --- ICONO 1: Silueta Momia Caminando (x: 5..14) ---
        g.fillStyle(glyphBase, 1);
        g.fillRect(7, 8, 6, 6); // Cabeza
        g.fillRect(6, 14, 8, 8); // Torso
        g.fillRect(6, 22, 3, 5); // Pierna 1
        g.fillRect(11, 22, 3, 5); // Pierna 2
        g.fillStyle(glyphDark, 1);
        g.fillRect(8, 10, 2, 2); // Ojo

        // Signo "+" (x: 18..24)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(20, 12, 2, 8);
        g.fillRect(17, 15, 8, 2);

        // --- ICONO 2: Arco de Salto sobre 4 Marcas "IIII" (x: 28..46) ---
        // Arco parabólico de salto
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(28, 18, 2, 3);
        g.fillRect(30, 14, 2, 3);
        g.fillRect(32, 11, 8, 2); // Ápice
        g.fillRect(40, 14, 2, 3);
        g.fillRect(42, 18, 2, 3);

        // Cuatro marcas "IIII" bajo el arco
        g.fillStyle(0xffe680, 1);
        g.fillRect(31, 16, 2, 8);
        g.fillRect(34, 16, 2, 8);
        g.fillRect(37, 16, 2, 8);
        g.fillRect(40, 16, 2, 8);

        // Flecha "->" (x: 48..56)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(48, 15, 6, 2);
        g.fillRect(53, 13, 2, 6);

        // --- ICONO 3: Momia Petrificada / Estatua (x: 58..67) ---
        g.fillStyle(0xa68a56, 1);
        g.fillRect(60, 8, 6, 6);
        g.fillRect(59, 14, 8, 12);
        g.fillStyle(glyphDark, 1);
        g.strokeRect(59, 14, 8, 12);

        // Flecha "->" (x: 70..78)
        g.fillStyle(glyphHighlight, 1);
        g.fillRect(70, 15, 6, 2);
        g.fillRect(75, 13, 2, 6);

        // --- ICONO 4: Gema Sagrada Radiante (x: 81..91) ---
        g.fillStyle(gemRadiance, 1);
        g.fillTriangle(86, 7, 80, 15, 92, 15);
        g.fillTriangle(80, 15, 92, 15, 86, 25);
        // Destello blanco central
        g.fillStyle(0xffffff, 1);
        g.fillRect(85, 13, 3, 3);

        g.generateTexture('mural_puzzle_2', width, height);
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
        // Cabeza
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
        g.fillRect(13, 7, 2, 2); // Ojo dorado petrificado
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

