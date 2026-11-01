/**
 * =========================================================================================
 * 🏛️ GENERADOR GRÁFICO DEL HUD RETRO (Phaser / Retro Engine)
 * =========================================================================================
 * Genera texturas procedurales para los iconos del HUD superior:
 * - `hud_player_life`: Miniatura de la cabeza del arqueólogo (sombrero, rostro y bigote)
 *   del tamaño de los corazones para representar las vidas disponibles.
 * - `hud_key_icon`: Llave dorada estilo Ankh en miniatura para indicar posesión de la llave.
 * - `hud_sarcophagus_icon`: Sarcófago dorado de Faraón con tocado Nemes para el progreso
 *   de puzles completados de la pirámide (0/9).
 * =========================================================================================
 */
export class HUDGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generatePlayerLifeIcon(scene);
        this.generateKeyIcon(scene);
        this.generateSarcophagusIcon(scene);
    }

    /**
     * Genera el icono miniatura del personaje para el contador de vidas (16x16 px).
     */
    public static generatePlayerLifeIcon(scene: Phaser.Scene): void {
        if (scene.textures.exists('hud_player_life')) return;

        const size = 16;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const hatTop = 0xdcc38c;
        const hatBrim = 0xbea56e;
        const hatBand = 0x552d14;
        const skin = 0xffd2a5;
        const eye = 0x190f0a;
        const mustache = 0x462610;
        const shirt = 0xc3a069;

        // 1. Sombrero salacot de arqueólogo
        g.fillStyle(hatTop, 1);
        g.fillRect(5, 1, 6, 2);
        g.fillRect(4, 3, 8, 2);
        g.fillStyle(hatBand, 1);
        g.fillRect(4, 5, 8, 1);
        g.fillStyle(hatBrim, 1);
        g.fillRect(2, 6, 12, 2);

        // 2. Rostro
        g.fillStyle(skin, 1);
        g.fillRect(4, 8, 8, 5);

        // 3. Ojo
        g.fillStyle(eye, 1);
        g.fillRect(9, 9, 2, 2);

        // 4. Bigote característico
        g.fillStyle(mustache, 1);
        g.fillRect(8, 11, 4, 2);

        // 5. Cuello de la camisa de explorador
        g.fillStyle(shirt, 1);
        g.fillRect(4, 13, 8, 3);

        g.generateTexture('hud_player_life', size, size);
        g.destroy();
    }

    /**
     * Genera el icono miniatura de la llave ancestral estilo Ankh (16x16 px).
     */
    public static generateKeyIcon(scene: Phaser.Scene): void {
        if (scene.textures.exists('hud_key_icon')) return;

        const size = 16;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const goldBase = 0xe0a828;
        const goldHighlight = 0xfff085;
        const goldShadow = 0x825208;

        // 1. Cabeza / anilla de la llave estilo Ankh
        g.fillStyle(goldShadow, 1);
        g.fillCircle(8, 5, 4);
        g.fillStyle(goldBase, 1);
        g.fillCircle(8, 5, 3);
        g.fillStyle(0x000000, 1); // Hueco interior
        g.fillCircle(8, 5, 1.5);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(7, 2, 2, 1);

        // 2. Travesaño ornamental (Ankh)
        g.fillStyle(goldShadow, 1);
        g.fillRect(5, 8, 6, 2);
        g.fillStyle(goldBase, 1);
        g.fillRect(6, 8, 4, 1);

        // 3. Vástago
        g.fillStyle(goldShadow, 1);
        g.fillRect(7, 9, 2, 6);
        g.fillStyle(goldBase, 1);
        g.fillRect(7, 9, 1, 6);

        // 4. Dientes / paletón rúnico
        g.fillStyle(goldBase, 1);
        g.fillRect(9, 11, 2, 1);
        g.fillRect(9, 13, 3, 2);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(9, 13, 1, 1);

        g.generateTexture('hud_key_icon', size, size);
        g.destroy();
    }

    /**
     * Genera el icono miniatura del sarcófago del Faraón (16x16 px).
     */
    public static generateSarcophagusIcon(scene: Phaser.Scene): void {
        if (scene.textures.exists('hud_sarcophagus_icon')) return;

        const size = 16;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const goldBase = 0xe0a828;
        const goldHighlight = 0xfff085;
        const goldDark = 0x784a08;
        const lapisBlue = 0x185090;
        const turquoise = 0x24a8b8;
        const skinTone = 0xffd2a5;
        const eyeColor = 0x100804;

        // 1. Silueta base oscura
        g.fillStyle(goldDark, 1);
        g.fillRect(4, 1, 8, 14);
        g.fillRect(3, 3, 10, 8);

        // 2. Tocado Nemes (bandas oro y azul lapislázuli)
        g.fillStyle(goldBase, 1);
        g.fillRect(4, 1, 8, 2);
        g.fillStyle(lapisBlue, 1);
        g.fillRect(5, 1, 6, 1);

        // Laterales del tocado real
        g.fillStyle(lapisBlue, 1);
        g.fillRect(3, 3, 2, 6);
        g.fillRect(11, 3, 2, 6);
        g.fillStyle(goldHighlight, 1);
        g.fillRect(3, 4, 1, 4);
        g.fillRect(12, 4, 1, 4);

        // 3. Rostro dorado del Faraón
        g.fillStyle(skinTone, 1);
        g.fillRect(5, 3, 6, 4);
        // Ojos de Horus
        g.fillStyle(eyeColor, 1);
        g.fillRect(6, 4, 1, 1);
        g.fillRect(9, 4, 1, 1);
        // Barba postiza real
        g.fillStyle(goldDark, 1);
        g.fillRect(7, 7, 2, 2);

        // 4. Pecho con cetros reales cruzados (Cayo y Flagelo)
        g.fillStyle(goldBase, 1);
        g.fillRect(4, 8, 8, 3);
        g.fillStyle(turquoise, 1);
        g.fillRect(5, 9, 2, 1);
        g.fillRect(9, 9, 2, 1);

        // 5. Cuerpo y vendajes sagrados inferiores
        g.fillStyle(goldDark, 1);
        g.fillRect(5, 11, 6, 4);
        g.fillStyle(goldBase, 1);
        g.fillRect(5, 11, 6, 1);
        g.fillRect(5, 13, 6, 1);
        g.fillStyle(lapisBlue, 1);
        g.fillRect(6, 12, 4, 1);
        g.fillRect(6, 14, 4, 1);

        g.generateTexture('hud_sarcophagus_icon', size, size);
        g.destroy();
    }
}

