import * as Phaser from 'phaser';

/**
 * Genera texturas pixel-art procedurales de 32x32 para las distintas poses y animaciones
 * del arqueólogo protagonista (Idle, Walk1/2, Climb1/2, Jump, Dead), replicando la paleta de PlayerRenderer.cs.
 */
export class PlayerGraphics {
    public static generateAll(scene: Phaser.Scene): void {
        this.generateIdle(scene);
        this.generateWalk(scene);
        this.generateClimb(scene);
        this.generateJump(scene);
        this.generateEliminated(scene);
    }

    private static generateBase(g: Phaser.GameObjects.Graphics, walkOffset: number = 0): void {
        // Paleta original de PlayerRenderer.cs
        const hatTop = 0xdcc38c;
        const hatBrim = 0xbea56e;
        const hatBand = 0x552d14;
        const skin = 0xffd2a5;
        const eye = 0x190f0a;
        const mustache = 0x462610;
        const shirt = 0xc3a069;
        const belt = 0x4b2812;
        const buckle = 0xffd73c;
        const pants = 0x6e5032;
        const boots = 0x3c200e;

        // Sombrero salacot
        g.fillStyle(hatTop, 1);
        g.fillRect(10, 2, 12, 4);
        g.fillRect(8, 6, 16, 2);
        g.fillStyle(hatBand, 1);
        g.fillRect(8, 8, 16, 2);
        g.fillStyle(hatBrim, 1);
        g.fillRect(4, 10, 24, 2);

        // Rostro y cabeza
        g.fillStyle(skin, 1);
        g.fillRect(8, 12, 16, 6);
        // Ojo
        g.fillStyle(eye, 1);
        g.fillRect(18, 14, 2, 2);
        // Bigote de arqueólogo
        g.fillStyle(mustache, 1);
        g.fillRect(16, 16, 6, 2);

        // Chaqueta caqui
        g.fillStyle(shirt, 1);
        g.fillRect(8, 18, 16, 6);

        // Cinturón y hebilla dorada
        g.fillStyle(belt, 1);
        g.fillRect(8, 24, 16, 2);
        g.fillStyle(buckle, 1);
        g.fillRect(14, 24, 4, 2);

        // Pantalones y botas con paso
        g.fillStyle(pants, 1);
        g.fillRect(8 + walkOffset, 26, 6, 4);
        g.fillRect(18 - walkOffset, 26, 6, 4);

        g.fillStyle(boots, 1);
        g.fillRect(8 + walkOffset, 30, 6, 2);
        g.fillRect(18 - walkOffset, 30, 6, 2);
    }

    public static generateIdle(scene: Phaser.Scene): void {
        if (scene.textures.exists('player_idle')) return;
        const g = scene.make.graphics({ x: 0, y: 0 });
        this.generateBase(g, 0);
        g.generateTexture('player_idle', 32, 32);
        g.destroy();
    }

    public static generateWalk(scene: Phaser.Scene): void {
        if (!scene.textures.exists('player_walk1')) {
            const g1 = scene.make.graphics({ x: 0, y: 0 });
            this.generateBase(g1, 2);
            g1.generateTexture('player_walk1', 32, 32);
            g1.destroy();
        }

        if (!scene.textures.exists('player_walk2')) {
            const g2 = scene.make.graphics({ x: 0, y: 0 });
            this.generateBase(g2, -2);
            g2.generateTexture('player_walk2', 32, 32);
            g2.destroy();
        }
    }

    public static generateClimb(scene: Phaser.Scene): void {
        if (!scene.textures.exists('player_climb1')) {
            const g1 = scene.make.graphics({ x: 0, y: 0 });
            this.generateClimbPose(g1, 2);
            g1.generateTexture('player_climb1', 32, 32);
            g1.destroy();
        }

        if (!scene.textures.exists('player_climb2')) {
            const g2 = scene.make.graphics({ x: 0, y: 0 });
            this.generateClimbPose(g2, -2);
            g2.generateTexture('player_climb2', 32, 32);
            g2.destroy();
        }
    }

    private static generateClimbPose(g: Phaser.GameObjects.Graphics, armOffset: number): void {
        const hatTop = 0xdcc38c;
        const hatBrim = 0xbea56e;
        const shirt = 0xc3a069;
        const pants = 0x6e5032;
        const boots = 0x3c200e;

        // Visto desde atrás
        g.fillStyle(hatTop, 1);
        g.fillRect(10, 4, 12, 6);
        g.fillStyle(hatBrim, 1);
        g.fillRect(6, 10, 20, 2);

        // Espalda y brazos agarrando la escalera
        g.fillStyle(shirt, 1);
        g.fillRect(8, 12, 16, 12);
        // Brazos trepando
        g.fillRect(4, 12 + armOffset, 4, 8);
        g.fillRect(24, 12 - armOffset, 4, 8);

        // Piernas
        g.fillStyle(pants, 1);
        g.fillRect(8, 24, 6, 6);
        g.fillRect(18, 24, 6, 6);

        g.fillStyle(boots, 1);
        g.fillRect(8, 30, 6, 2);
        g.fillRect(18, 30, 6, 2);
    }

    public static generateJump(scene: Phaser.Scene): void {
        if (scene.textures.exists('player_jump')) return;
        const g = scene.make.graphics({ x: 0, y: 0 });
        this.generateBase(g, 0);

        // Modificación de brazos alzados para salto arcade
        const shirt = 0xc3a069;
        g.fillStyle(shirt, 1);
        g.fillRect(4, 12, 4, 6);
        g.fillRect(24, 12, 4, 6);

        g.generateTexture('player_jump', 32, 32);
        g.destroy();
    }

    public static generateEliminated(scene: Phaser.Scene): void {
        if (scene.textures.exists('player_dead')) return;
        const g = scene.make.graphics({ x: 0, y: 0 });

        // Tumba / salacot caído
        const hatBrim = 0xbea56e;
        const hatTop = 0xdcc38c;
        const boneColor = 0xe0e0d0;

        g.fillStyle(boneColor, 1);
        g.fillRect(8, 24, 16, 4);
        g.fillRect(14, 20, 4, 12);

        g.fillStyle(hatTop, 1);
        g.fillRect(10, 12, 12, 4);
        g.fillStyle(hatBrim, 1);
        g.fillRect(6, 16, 20, 2);

        g.generateTexture('player_dead', 32, 32);
        g.destroy();
    }
}

