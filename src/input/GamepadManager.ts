export interface SceneWithGamepad {
    input?: {
        gamepad?: {
            total?: number;
            gamepads?: Array<any>;
        } | null;
    } | null;
}

export interface PlayerInputState {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
}

export interface MenuInputState {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    confirm: boolean;
}

/**
 * Gestor de entrada para Joysticks / Gamepads físicos y arcade sticks.
 * Opera mediante HTML5 Gamepad API y el plugin de Gamepad de Phaser con tolerancia de zona muerta.
 * Diseñado con cero allocations continuas en el bucle principal de actualización.
 */
export class GamepadManager {
    public static readonly ANALOG_DEADZONE = 0.35;

    // Estructuras estáticas preasignadas para evitar recolector de basura (0 allocations)
    private static readonly cachedPlayerInput: PlayerInputState = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false
    };

    private static readonly cachedMenuInput: MenuInputState = {
        up: false,
        down: false,
        left: false,
        right: false,
        confirm: false
    };

    /**
     * Procesa una lista de gamepads genéricos (compatible con HTML5 Gamepad API o mocks).
     */
    public static pollRawGamepads(gamepads?: readonly (any | null)[]): Readonly<PlayerInputState> {
        const input = this.cachedPlayerInput;
        input.left = false;
        input.right = false;
        input.up = false;
        input.down = false;
        input.jump = false;

        if (!gamepads) return input;

        const deadzone = this.ANALOG_DEADZONE;

        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp || !gp.connected) continue;

            // 1. Ejes analógicos del stick izquierdo
            const axisX = gp.axes ? (gp.axes[0] ?? 0) : 0;
            const axisY = gp.axes ? (gp.axes[1] ?? 0) : 0;

            if (axisX < -deadzone) input.left = true;
            if (axisX > deadzone) input.right = true;
            if (axisY < -deadzone) input.up = true;
            if (axisY > deadzone) input.down = true;

            // 2. Cruceta D-Pad estándar W3C (12: Up, 13: Down, 14: Left, 15: Right)
            const buttons = gp.buttons;
            if (buttons) {
                if (buttons[14]?.pressed) input.left = true;
                if (buttons[15]?.pressed) input.right = true;
                if (buttons[12]?.pressed) input.up = true;
                if (buttons[13]?.pressed) input.down = true;

                // 3. Botones frontales de salto (0: A/Cruz, 1: B/Círculo, 2: X/Cuadrado, 3: Y/Triángulo, 5: R1)
                // REGLA: Los botones son los que saltan, la cruceta Arriba jamás salta
                if (
                    buttons[0]?.pressed ||
                    buttons[1]?.pressed ||
                    buttons[2]?.pressed ||
                    buttons[3]?.pressed ||
                    buttons[5]?.pressed
                ) {
                    input.jump = true;
                }
            }

            if (input.left || input.right || input.up || input.down || input.jump) {
                break;
            }
        }

        return input;
    }

    /**
     * Consulta el estado actual de los joysticks/gamepads conectados para el control del personaje.
     * @param scene Escena activa de Phaser (opcional para acceder a scene.input.gamepad)
     */
    public static pollPlayerInput(scene?: SceneWithGamepad | null): Readonly<PlayerInputState> {
        // 1. Sondeo mediante Phaser Gamepad Plugin si está inicializado
        if (scene?.input?.gamepad && (scene.input.gamepad.total ?? 0) > 0) {
            const pads = scene.input.gamepad.gamepads;
            if (pads) {
                for (let i = 0; i < pads.length; i++) {
                    const pad: any = pads[i];
                    if (!pad || !pad.connected) continue;

                    const input = this.cachedPlayerInput;
                    input.left = !!pad.left;
                    input.right = !!pad.right;
                    input.up = !!pad.up;
                    input.down = !!pad.down;
                    input.jump = !!(pad.A || pad.B || pad.X || pad.Y || (typeof pad.R1 === 'number' ? pad.R1 > 0 : pad.R1));

                    if (input.left || input.right || input.up || input.down || input.jump) {
                        return input;
                    }
                }
            }
        }

        // 2. Sondeo directo universal vía HTML5 Gamepad API
        if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
            try {
                const gamepads = navigator.getGamepads();
                if (gamepads && gamepads.length > 0) {
                    return this.pollRawGamepads(gamepads);
                }
            } catch {
                // Entorno sin soporte activo
            }
        }

        const input = this.cachedPlayerInput;
        input.left = false;
        input.right = false;
        input.up = false;
        input.down = false;
        input.jump = false;
        return input;
    }

    /**
     * Consulta el estado de los joysticks para la navegación en menús (TitleScene).
     */
    public static pollMenuInput(scene?: SceneWithGamepad | null, rawGamepads?: readonly (any | null)[]): Readonly<MenuInputState> {
        const input = this.cachedMenuInput;
        input.up = false;
        input.down = false;
        input.left = false;
        input.right = false;
        input.confirm = false;

        const playerInput = rawGamepads ? this.pollRawGamepads(rawGamepads) : this.pollPlayerInput(scene);
        input.up = playerInput.up;
        input.down = playerInput.down;
        input.left = playerInput.left;
        input.right = playerInput.right;
        input.confirm = playerInput.jump;

        // Comprobar también botón Start (botón 9)
        const pads = rawGamepads ?? (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : null);
        if (pads) {
            for (let i = 0; i < pads.length; i++) {
                const gp = pads[i];
                if (gp?.connected && gp.buttons && gp.buttons[9]?.pressed) {
                    input.confirm = true;
                    break;
                }
            }
        }

        return input;
    }
}
