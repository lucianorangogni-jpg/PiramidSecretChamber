import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TitleMenuModel, TitleMenuOption } from '../../src/scenes/TitleMenuModel.ts';

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
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Controls);

        menu.navigateDown();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.NewGame);
    });

    it('navegar hacia arriba desde NewGame debe hacer wrap-around a Controls', () => {
        const menu = new TitleMenuModel();

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Controls);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.SelectChamber);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.Continue);

        menu.navigateUp();
        assert.strictEqual(menu.selectedOption, TitleMenuOption.NewGame);
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
});

