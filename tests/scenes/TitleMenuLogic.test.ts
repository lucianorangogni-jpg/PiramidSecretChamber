import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TitleMenuModel, TitleMenuOption } from '../../src/scenes/TitleMenuModel.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TitleMenu Navigation & Selection Specs', () => {
    it('debe iniciar por defecto en la opción NewGame y Recámara 1', () => {
        const menu = new TitleMenuModel();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.NewGame);
        assert.strictEqual(menu.selectedChamber, 1);
        assert.strictEqual(menu.selectedPyramidLevel, 1);
    });

    it('navegar hacia abajo debe ciclar secuencialmente las opciones', () => {
        const menu = new TitleMenuModel();

        menu.navigateDown();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Continue);

        menu.navigateDown();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.SelectChamber);

        menu.navigateDown();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Story);

        menu.navigateDown();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Controls);

        menu.navigateDown();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.NewGame);
    });

    it('navegar hacia arriba desde NewGame debe hacer wrap-around a Controls pasando por Historia', () => {
        const menu = new TitleMenuModel();

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Controls);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Story);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.SelectChamber);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Continue);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.NewGame);
    });

    it('debe definir correctamente el enum TitleMenuOption con 5 opciones incluyendo Story', () => {
        assert.strictEqual(TitleMenuOption.NewGame, 0);
        assert.strictEqual(TitleMenuOption.Continue, 1);
        assert.strictEqual(TitleMenuOption.SelectChamber, 2);
        assert.strictEqual(TitleMenuOption.Story, 3);
        assert.strictEqual(TitleMenuOption.Controls, 4);
    });

    it('cambiar de recámara con izquierda y derecha debe ciclar entre 1 y 10', () => {
        const menu = new TitleMenuModel();

        // 1 hacia la izquierda hace wrap a 10
        menu.changeChamberLeft();
        assert.strictEqual(menu.selectedChamber, 10);
        assert.strictEqual(menu.selectedPyramidLevel, 4); // Nivel 4 Cúspide

        // 10 hacia la derecha hace wrap a 1
        menu.changeChamberRight();
        assert.strictEqual(menu.selectedChamber, 1);
        assert.strictEqual(menu.selectedPyramidLevel, 1);

        menu.changeChamberRight();
        assert.strictEqual(menu.selectedChamber, 2);

        menu.changeChamberLeft();
        assert.strictEqual(menu.selectedChamber, 1);
    });

    it('la opción HISTORIA debe permitir selección directa y contener el objetivo del juego', () => {
        const menu = new TitleMenuModel();
        menu.selectedOption = TitleMenuOption.Story;
        assert.strictEqual(menu.selectedOption, 3);

        const expectedKeywords = [
            'Rob Lucky',
            'pirámide',
            'recámaras',
            'tesoros',
            'puzzles',
            '10',
            'EL SARCOFAGO DEL FARAON',
            'momias',
            'plataformas',
            'pisos que se mueven'
        ];

        const titleScenePath = path.join(__dirname, '..', '..', 'src', 'scenes', 'TitleScene.ts');
        const content = fs.readFileSync(titleScenePath, 'utf-8');
        for (const kw of expectedKeywords) {
            assert.ok(content.includes(kw), `TitleScene debe contener la palabra clave de historia: "${kw}"`);
        }
    });
});

