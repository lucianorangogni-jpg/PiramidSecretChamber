import * as Phaser from 'phaser';
import { GameConstants } from './core/GameConstants';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';

/**
 * Configuración maestra del juego en Phaser 4 / Vite.
 * Inicia directamente en TitleScene (Menú Principal con estética retro arcade).
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GameConstants.VIRTUAL_WIDTH,   // 640
    height: GameConstants.VIRTUAL_HEIGHT, // 480
    parent: 'app',
    pixelArt: true, // Renderizado pixel-perfect nítido
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 }, // Físicas deterministas
            debug: false
        }
    },
    scene: [TitleScene, GameScene]
};

const game = new Phaser.Game(config);
export default game;
