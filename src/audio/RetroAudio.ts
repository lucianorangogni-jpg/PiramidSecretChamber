import type * as Phaser from 'phaser';

/**
 * Gestor maestro de efectos de sonido retro para Pirámide: Secret Chamber.
 * Soporta reproducción dual:
 * 1. Reproducción de alta fidelidad mediante Phaser Sound Manager (archivos WAV optimizados).
 * 2. Síntesis procedural en tiempo real mediante Web Audio API como respaldo infalible.
 * 3. Ejecución segura en entornos headless / pruebas unitarias de Node.js (cero excepciones).
 */
export class RetroAudio {
    public static readonly SFX_JUMP = 'sfx_jump';
    public static readonly SFX_TREASURE = 'sfx_treasure';
    public static readonly SFX_KEY = 'sfx_key';
    public static readonly SFX_GEM = 'sfx_gem';
    public static readonly SFX_EXIT = 'sfx_exit';
    public static readonly SFX_DOOR_OPEN = 'sfx_door_open';
    public static readonly SFX_PUZZLE_SOLVED = 'sfx_puzzle_solved';
    public static readonly SFX_DEATH = 'sfx_death';

    // Pistas de música retro ambiental y de menú
    public static readonly MUSIC_MENU = 'music_menu';
    public static readonly MUSIC_CHAMBER = 'music_chamber';

    // Volúmenes de mezcla calibrados: la música de recámara es suave ("se escuche suave")
    public static readonly MENU_MUSIC_VOLUME = 0.35;
    public static readonly CHAMBER_MUSIC_VOLUME = 0.22;

    private static audioContext: AudioContext | null = null;
    private static isMuted: boolean = false;
    private static masterVolume: number = 0.6;
    private static currentMusic: any = null;
    private static currentMusicKey: string | null = null;

    /**
     * Precarga los archivos WAV de audio y música retro en el cargador de Phaser.
     */
    public static preload(scene: Phaser.Scene): void {
        if (!scene || !scene.load) return;

        scene.load.audio(this.SFX_JUMP, 'assets/audio/sfx_jump.wav');
        scene.load.audio(this.SFX_TREASURE, 'assets/audio/sfx_treasure.wav');
        scene.load.audio(this.SFX_KEY, 'assets/audio/sfx_key.wav');
        scene.load.audio(this.SFX_GEM, 'assets/audio/sfx_gem.wav');
        scene.load.audio(this.SFX_EXIT, 'assets/audio/sfx_exit.wav');
        scene.load.audio(this.SFX_DOOR_OPEN, 'assets/audio/sfx_door_open.wav');
        scene.load.audio(this.SFX_PUZZLE_SOLVED, 'assets/audio/sfx_puzzle_solved.wav');
        scene.load.audio(this.SFX_DEATH, 'assets/audio/sfx_death.wav');

        scene.load.audio(this.MUSIC_MENU, 'assets/audio/music_menu.wav');
        scene.load.audio(this.MUSIC_CHAMBER, 'assets/audio/music_chamber.wav');
    }

    /**
     * Reproduce un efecto de sonido retro con Phaser o síntesis Web Audio.
     */
    public static play(scene: Phaser.Scene | undefined, soundKey: string, volume: number = 1.0): void {
        if (this.isMuted) return;

        // 1. Intentar reproducción a través del Sound Manager de Phaser
        if (scene && scene.sound && scene.cache && scene.cache.audio && scene.cache.audio.exists(soundKey)) {
            try {
                scene.sound.play(soundKey, { volume: volume * this.masterVolume });
                return;
            } catch {
                // Si Phaser falla por autoplay policy o contexto suspendido, recurrir a Web Audio síntesis
            }
        }

        // 2. Respaldo de síntesis procedural Web Audio
        this.synthesizeSound(soundKey, volume);
    }

    /**
     * 1. Sonido para SALTAR: barrido de tono ascendente arcade retro (140 Hz -> 520 Hz).
     */
    public static playJump(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_JUMP, 0.7);
    }

    /**
     * 2. Sonido para OBTENER TESORO: arpegio brillante de cofre/recompensa retro (D5 -> A5).
     */
    public static playTreasure(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_TREASURE, 0.85);
    }

    /**
     * 3. Sonido para la LLAVE: campanilleo místico ascendente sagrado (A5 -> D6 -> A6).
     */
    public static playKey(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_KEY, 0.9);
    }

    /**
     * 4. Sonido para la GEMA SAGRADA: cristalización mágica y destello divino (E5 -> G#5 -> D6 -> G#6).
     */
    public static playGem(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_GEM, 0.95);
    }

    /**
     * 5. Sonido para SALIR / COMPLETAR RECÁMARA: fanfarria triunfal de victoria de recámara.
     */
    public static playExit(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_EXIT, 1.0);
    }

    /**
     * 6. Sonido para ABRIR UNA PUERTA: cerrojo metálico y deslizamiento de pesada losa de piedra.
     */
    public static playDoorOpen(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_DOOR_OPEN, 0.85);
    }

    /**
     * 7. Sonido para RESOLVER UN PUZLE: fanfarria mística de descubrimiento y revelación divina.
     */
    public static playPuzzleSolved(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_PUZZLE_SOLVED, 1.0);
    }

    /**
     * 8. Sonido para MORIR: secuencia retro arcade de derrota y eliminación.
     */
    public static playDeath(scene?: Phaser.Scene): void {
        this.play(scene, this.SFX_DEATH, 0.95);
    }

    /**
     * Inicia la reproducción en bucle continuo de una pista de música retro.
     * Si la misma pista ya está reproduciéndose, se mantiene sin reiniciarla para preservar la fluidez.
     */
    public static playMusic(scene: Phaser.Scene | undefined, musicKey: string, volume: number = 0.3): void {
        if (this.currentMusicKey === musicKey && this.currentMusic) {
            try {
                if (typeof this.currentMusic.isPlaying === 'boolean' ? this.currentMusic.isPlaying : true) {
                    return;
                }
            } catch {
                // Continuar reintento
            }
        }

        this.stopMusic();
        this.currentMusicKey = musicKey;

        if (this.isMuted) return;

        if (scene && scene.sound && scene.cache && scene.cache.audio && scene.cache.audio.exists(musicKey)) {
            try {
                const sound = scene.sound.add(musicKey, {
                    loop: true,
                    volume: volume * this.masterVolume
                });
                sound.play();
                this.currentMusic = sound;
            } catch {
                // Si el navegador bloquea la reproducción por política autoplay, la escena puede reintentar en input
            }
        }
    }

    /**
     * Reproduce la música del menú principal con bucle continuo retro aventurero.
     */
    public static playMenuMusic(scene?: Phaser.Scene): void {
        this.playMusic(scene, this.MUSIC_MENU, this.MENU_MUSIC_VOLUME);
    }

    /**
     * Reproduce la música de ambientación egipcia para las recámaras (escala Hijaz, instrumentos Nay y darbuka).
     * Calibrada con un volumen suave para acompañar la exploración sin sobrecargar ("se escuche suave").
     */
    public static playChamberMusic(scene?: Phaser.Scene): void {
        this.playMusic(scene, this.MUSIC_CHAMBER, this.CHAMBER_MUSIC_VOLUME);
    }

    /**
     * Detiene cualquier música actualmente activa y libera su instancia.
     */
    public static stopMusic(): void {
        if (this.currentMusic) {
            try {
                if (typeof this.currentMusic.stop === 'function') {
                    this.currentMusic.stop();
                }
                if (typeof this.currentMusic.destroy === 'function') {
                    this.currentMusic.destroy();
                }
            } catch {
                // Silencioso
            }
            this.currentMusic = null;
        }
        this.currentMusicKey = null;
    }

    /**
     * Retorna la clave de la pista musical activa actualmente (o null si está inactiva).
     */
    public static getCurrentMusicKey(): string | null {
        return this.currentMusicKey;
    }

    public static setMuted(muted: boolean): void {
        this.isMuted = muted;
        if (this.currentMusic) {
            try {
                if (muted && typeof this.currentMusic.pause === 'function') {
                    this.currentMusic.pause();
                } else if (!muted && typeof this.currentMusic.resume === 'function') {
                    this.currentMusic.resume();
                }
            } catch {
                // Silencioso
            }
        }
    }

    public static getMuted(): boolean {
        return this.isMuted;
    }

    public static setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic && typeof this.currentMusic.setVolume === 'function') {
            try {
                const baseVolume = this.currentMusicKey === this.MUSIC_CHAMBER
                    ? this.CHAMBER_MUSIC_VOLUME
                    : this.MENU_MUSIC_VOLUME;
                this.currentMusic.setVolume(baseVolume * this.masterVolume);
            } catch {
                // Silencioso
            }
        }
    }

    public static getMasterVolume(): number {
        return this.masterVolume;
    }

    /**
     * Obtiene o reanuda el AudioContext del navegador en entornos cliente.
     */
    private static getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                try {
                    this.audioContext = new AudioContextClass();
                } catch {
                    this.audioContext = null;
                }
            }
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }

        return this.audioContext;
    }

    /**
     * Síntesis de ondas retro chiptune (cuadrada/triangular) mediante Web Audio API en tiempo real.
     */
    private static synthesizeSound(soundKey: string, volume: number = 1.0): void {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const effectiveVolume = volume * this.masterVolume;
        const now = ctx.currentTime;

        switch (soundKey) {
            case this.SFX_JUMP: {
                // Barrido rápido 140 Hz a 520 Hz (onda cuadrada)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);

                gain.gain.setValueAtTime(effectiveVolume * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.16);
                break;
            }

            case this.SFX_TREASURE: {
                // Arpegio de 2 notas D5 (587Hz) y A5 (880Hz)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.setValueAtTime(880.0, now + 0.09);

                gain.gain.setValueAtTime(effectiveVolume * 0.4, now);
                gain.gain.setValueAtTime(effectiveVolume * 0.5, now + 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.28);
                break;
            }

            case this.SFX_KEY: {
                // Campanilla mística A5 (880Hz) -> D6 (1175Hz) -> A6 (1760Hz)
                const osc = ctx.createOscillator();
                const oscHarmonic = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                oscHarmonic.type = 'triangle';

                osc.frequency.setValueAtTime(880.0, now);
                osc.frequency.setValueAtTime(1174.66, now + 0.08);
                osc.frequency.setValueAtTime(1760.0, now + 0.16);

                oscHarmonic.frequency.setValueAtTime(1760.0, now);
                oscHarmonic.frequency.setValueAtTime(2349.32, now + 0.08);
                oscHarmonic.frequency.setValueAtTime(3520.0, now + 0.16);

                gain.gain.setValueAtTime(effectiveVolume * 0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

                osc.connect(gain);
                oscHarmonic.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                oscHarmonic.start(now);
                osc.stop(now + 0.38);
                oscHarmonic.stop(now + 0.38);
                break;
            }

            case this.SFX_GEM: {
                // Destello divino E5 (659Hz) -> G#5 (831Hz) -> D6 (1175Hz) -> G#6 (1661Hz)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(659.25, now);
                osc.frequency.setValueAtTime(830.61, now + 0.07);
                osc.frequency.setValueAtTime(1174.66, now + 0.14);
                osc.frequency.setValueAtTime(1661.22, now + 0.21);

                gain.gain.setValueAtTime(effectiveVolume * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.44);
                break;
            }

            case this.SFX_EXIT: {
                // Fanfarria C4 (262Hz) -> E4 (330Hz) -> G4 (392Hz) -> Acorde C5 (523Hz)
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'square';
                osc2.type = 'square';

                osc1.frequency.setValueAtTime(261.63, now);
                osc1.frequency.setValueAtTime(329.63, now + 0.12);
                osc1.frequency.setValueAtTime(392.0, now + 0.24);
                osc1.frequency.setValueAtTime(523.25, now + 0.36);

                osc2.frequency.setValueAtTime(523.25, now);
                osc2.frequency.setValueAtTime(659.25, now + 0.12);
                osc2.frequency.setValueAtTime(784.0, now + 0.24);
                osc2.frequency.setValueAtTime(659.25, now + 0.36);

                gain.gain.setValueAtTime(effectiveVolume * 0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.72);
                osc2.stop(now + 0.72);
                break;
            }

            case this.SFX_DOOR_OPEN: {
                // Clic de pestillo + deslizamiento sordo de losa de piedra
                const oscClick = ctx.createOscillator();
                const oscStone = ctx.createOscillator();
                const gain = ctx.createGain();

                oscClick.type = 'square';
                oscStone.type = 'triangle';

                // Cerrojo inicial (700Hz -> 300Hz)
                oscClick.frequency.setValueAtTime(700, now);
                oscClick.frequency.exponentialRampToValueAtTime(300, now + 0.05);

                // Fricción pesada de piedra (85Hz -> 58Hz)
                oscStone.frequency.setValueAtTime(85, now);
                oscStone.frequency.linearRampToValueAtTime(58, now + 0.45);

                gain.gain.setValueAtTime(effectiveVolume * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                oscClick.connect(gain);
                oscStone.connect(gain);
                gain.connect(ctx.destination);

                oscClick.start(now);
                oscStone.start(now);
                oscClick.stop(now + 0.06);
                oscStone.stop(now + 0.45);
                break;
            }

            case this.SFX_PUZZLE_SOLVED: {
                // Fanfarria mística 5 notas: G4 (392Hz) -> B4 (494Hz) -> D5 (587Hz) -> F#5 (740Hz) -> B5 (988Hz)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(392.00, now);
                osc.frequency.setValueAtTime(493.88, now + 0.08);
                osc.frequency.setValueAtTime(587.33, now + 0.16);
                osc.frequency.setValueAtTime(739.99, now + 0.24);
                osc.frequency.setValueAtTime(987.77, now + 0.32);

                gain.gain.setValueAtTime(effectiveVolume * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.56);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.56);
                break;
            }

            case this.SFX_DEATH: {
                // Golpe retro de impacto y caída tonal disonante (340Hz -> 65Hz)
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'sawtooth';
                osc2.type = 'square';

                osc1.frequency.setValueAtTime(340, now);
                osc1.frequency.exponentialRampToValueAtTime(65, now + 0.65);

                osc2.frequency.setValueAtTime(300, now);
                osc2.frequency.exponentialRampToValueAtTime(55, now + 0.65);

                gain.gain.setValueAtTime(effectiveVolume * 0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.68);
                osc2.stop(now + 0.68);
                break;
            }
        }
    }
}
