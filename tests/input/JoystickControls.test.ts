import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GamepadManager } from '../../src/input/GamepadManager.ts';

describe('Joystick/Gamepad Controls & Exclusive Jump Rules [US-022]', () => {
    it('la zona muerta de sticks analógicos debe filtrar derivas menores al umbral 0.35', () => {
        assert.strictEqual(GamepadManager.ANALOG_DEADZONE, 0.35);

        // Simulamos un gamepad con pequeñas derivas neutras (ruido analógico menor a 0.35)
        const mockGamepads = [
            {
                connected: true,
                axes: [0.15, -0.2], // dentro de la zona muerta
                buttons: new Array(16).fill({ pressed: false })
            }
        ];

        const input = GamepadManager.pollRawGamepads(mockGamepads);
        assert.strictEqual(input.left, false, 'No debe activar izquierda con deriva leve');
        assert.strictEqual(input.right, false, 'No debe activar derecha con deriva leve');
        assert.strictEqual(input.up, false, 'No debe activar arriba con deriva leve');
        assert.strictEqual(input.down, false, 'No debe activar abajo con deriva leve');
        assert.strictEqual(input.jump, false, 'No debe activar salto');
    });

    it('el stick analógico y la cruceta D-Pad deben mapear correctamente las 4 direcciones', () => {
        // 1. Stick analógico superando umbral hacia la izquierda
        const mockAnalogLeft = [
            {
                connected: true,
                axes: [-0.8, 0],
                buttons: new Array(16).fill({ pressed: false })
            }
        ];
        let input = GamepadManager.pollRawGamepads(mockAnalogLeft);
        assert.strictEqual(input.left, true);
        assert.strictEqual(input.right, false);

        // 2. Cruceta D-Pad estándar: botón 15 (Derecha) y botón 12 (Arriba)
        const buttonsWithDPad = new Array(16).fill({ pressed: false });
        buttonsWithDPad[15] = { pressed: true }; // D-Pad Right
        buttonsWithDPad[12] = { pressed: true }; // D-Pad Up

        const mockDPad = [
            {
                connected: true,
                axes: [0, 0],
                buttons: buttonsWithDPad
            }
        ];
        input = GamepadManager.pollRawGamepads(mockDPad);
        assert.strictEqual(input.right, true);
        assert.strictEqual(input.up, true);
        assert.strictEqual(input.left, false);
        assert.strictEqual(input.down, false);
    });

    it('los botones frontales de acción del joystick (A, B, X, Y) deben mapear al salto', () => {
        // Probar Botón 0 (A / Cruz)
        const buttonsA = new Array(16).fill({ pressed: false });
        buttonsA[0] = { pressed: true };

        let input = GamepadManager.pollRawGamepads([{ connected: true, axes: [0, 0], buttons: buttonsA }]);
        assert.strictEqual(input.jump, true, 'Botón 0 (A) debe activar salto');

        // Probar Botón 2 (X / Cuadrado)
        const buttonsX = new Array(16).fill({ pressed: false });
        buttonsX[2] = { pressed: true };

        input = GamepadManager.pollRawGamepads([{ connected: true, axes: [0, 0], buttons: buttonsX }]);
        assert.strictEqual(input.jump, true, 'Botón 2 (X) debe activar salto');
    });

    it('REGLA ESTRICTA: La tecla o dirección ARRIBA NO debe mapear a la acción de salto', () => {
        // Solo dirección Arriba activa (D-Pad botón 12 y stick hacia arriba)
        const buttonsUp = new Array(16).fill({ pressed: false });
        buttonsUp[12] = { pressed: true };

        const mockOnlyUp = [
            {
                connected: true,
                axes: [0, -0.9],
                buttons: buttonsUp
            }
        ];

        const input = GamepadManager.pollRawGamepads(mockOnlyUp);
        assert.strictEqual(input.up, true, 'Arriba debe ser true');
        assert.strictEqual(input.jump, false, 'CRÍTICO: Arriba NUNCA debe activar jump');
    });

    it('la navegación de menú (TitleScene) responde a direcciones y confirmación del joystick', () => {
        const buttonsConfirm = new Array(16).fill({ pressed: false });
        buttonsConfirm[0] = { pressed: true }; // Botón A

        const mockMenuPad = [
            {
                connected: true,
                axes: [0, 0.7], // Stick hacia abajo
                buttons: buttonsConfirm
            }
        ];

        const menuInput = GamepadManager.pollMenuInput(undefined, mockMenuPad);
        assert.strictEqual(menuInput.down, true, 'Debe navegar hacia abajo');
        assert.strictEqual(menuInput.confirm, true, 'Debe confirmar selección');
    });
});
