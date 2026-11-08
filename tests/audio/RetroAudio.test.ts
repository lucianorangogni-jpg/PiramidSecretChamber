import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RetroAudio } from "../../src/audio/RetroAudio.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioDir = path.join(__dirname, "..", "..", "public", "assets", "audio");

describe('Retro Audio System & Sound Effects Specs', () => {
    it('debe definir las claves de los 8 efectos de sonido y 2 pistas de música requeridas', () => {
        assert.strictEqual(RetroAudio.SFX_JUMP, 'sfx_jump');
        assert.strictEqual(RetroAudio.SFX_TREASURE, 'sfx_treasure');
        assert.strictEqual(RetroAudio.SFX_KEY, 'sfx_key');
        assert.strictEqual(RetroAudio.SFX_GEM, 'sfx_gem');
        assert.strictEqual(RetroAudio.SFX_EXIT, 'sfx_exit');
        assert.strictEqual(RetroAudio.SFX_DOOR_OPEN, 'sfx_door_open');
        assert.strictEqual(RetroAudio.SFX_PUZZLE_SOLVED, 'sfx_puzzle_solved');
        assert.strictEqual(RetroAudio.SFX_DEATH, 'sfx_death');

        assert.strictEqual(RetroAudio.MUSIC_MENU, 'music_menu');
        assert.strictEqual(RetroAudio.MUSIC_CHAMBER, 'music_chamber');
        assert.ok(RetroAudio.CHAMBER_MUSIC_VOLUME < RetroAudio.MENU_MUSIC_VOLUME, 'La música de recámara debe ser más suave');
    });

    it('los 10 archivos WAV (8 SFX y 2 pistas musicales) deben existir en disco con encabezado RIFF WAVE válido', () => {
        const expectedFiles = [
            'sfx_jump.wav',
            'sfx_treasure.wav',
            'sfx_key.wav',
            'sfx_gem.wav',
            'sfx_exit.wav',
            'sfx_door_open.wav',
            'sfx_puzzle_solved.wav',
            'sfx_death.wav',
            'music_menu.wav',
            'music_chamber.wav'
        ];

    for (const fileName of expectedFiles) {
      const filePath = path.join(audioDir, fileName);
      assert.ok(
        fs.existsSync(filePath),
        `El archivo ${fileName} debe existir en ${audioDir}`,
      );

      const buffer = fs.readFileSync(filePath);
      assert.ok(
        buffer.length > 44,
        `El archivo ${fileName} debe tener tamaño superior a 44 bytes`,
      );

      // Validar cabecera RIFF / WAVE
      const riffHeader = buffer.toString("ascii", 0, 4);
      const waveHeader = buffer.toString("ascii", 8, 12);
      assert.strictEqual(
        riffHeader,
        "RIFF",
        `${fileName} debe ser un archivo RIFF válido`,
      );
      assert.strictEqual(
        waveHeader,
        "WAVE",
        `${fileName} debe ser formato WAVE`,
      );

      // Validar subchunk fmt
      const fmtHeader = buffer.toString("ascii", 12, 16);
      assert.strictEqual(fmtHeader, "fmt ");

      // AudioFormat PCM = 1, Mono = 1, 16-bit = 16
      const audioFormat = buffer.readUInt16LE(20);
      const numChannels = buffer.readUInt16LE(22);
      const bitsPerSample = buffer.readUInt16LE(34);
      assert.strictEqual(audioFormat, 1, "AudioFormat debe ser PCM");
      assert.strictEqual(
        numChannels,
        1,
        "Debe ser mono para estética retro arcade",
      );
      assert.strictEqual(bitsPerSample, 16, "Debe ser PCM de 16 bits");
    }
  });

    it('preload debe registrar los 8 efectos y las 2 pistas de música en el cargador de Phaser', () => {
        const loadedAudio: { key: string; url: string }[] = [];
        const mockScene = {
            load: {
                audio: (key: string, url: string) => {
                    loadedAudio.push({ key, url });
                }
            }
        } as any;

    RetroAudio.preload(mockScene);

        assert.strictEqual(loadedAudio.length, 10);
        const keys = loadedAudio.map(a => a.key);
        assert.ok(keys.includes(RetroAudio.SFX_JUMP));
        assert.ok(keys.includes(RetroAudio.SFX_TREASURE));
        assert.ok(keys.includes(RetroAudio.SFX_KEY));
        assert.ok(keys.includes(RetroAudio.SFX_GEM));
        assert.ok(keys.includes(RetroAudio.SFX_EXIT));
        assert.ok(keys.includes(RetroAudio.SFX_DOOR_OPEN));
        assert.ok(keys.includes(RetroAudio.SFX_PUZZLE_SOLVED));
        assert.ok(keys.includes(RetroAudio.SFX_DEATH));
        assert.ok(keys.includes(RetroAudio.MUSIC_MENU));
        assert.ok(keys.includes(RetroAudio.MUSIC_CHAMBER));
    });

  it("los métodos de reproducción deben ejecutarse de forma segura en entornos sin interfaz de audio", () => {
    // En Node.js (sin DOM ni Web Audio), no deben arrojar excepciones
    assert.doesNotThrow(() => {
      RetroAudio.playJump();
      RetroAudio.playTreasure();
      RetroAudio.playKey();
      RetroAudio.playGem();
      RetroAudio.playExit();
      RetroAudio.playDoorOpen();
      RetroAudio.playPuzzleSolved();
      RetroAudio.playDeath();
    });
  });

  it("debe permitir configurar y consultar el estado de silencio (mute) y volumen maestro", () => {
    RetroAudio.setMuted(true);
    assert.strictEqual(RetroAudio.getMuted(), true);

    RetroAudio.setMuted(false);
    assert.strictEqual(RetroAudio.getMuted(), false);

    RetroAudio.setMasterVolume(0.8);
    assert.strictEqual(RetroAudio.getMasterVolume(), 0.8);

    // Clamping de volumen entre 0.0 y 1.0
    RetroAudio.setMasterVolume(1.5);
    assert.strictEqual(RetroAudio.getMasterVolume(), 1.0);

    RetroAudio.setMasterVolume(-0.2);
    assert.strictEqual(RetroAudio.getMasterVolume(), 0.0);

    // Restaurar volumen por defecto
    RetroAudio.setMasterVolume(0.6);
  });

  it("debe priorizar scene.sound si está disponible en la escena mock", () => {
    const playedSounds: string[] = [];
    const mockScene = {
      sound: {
        play: (key: string) => {
          playedSounds.push(key);
        },
      },
      cache: {
        audio: {
          exists: (_key: string) => true,
        },
      },
    } as any;

    RetroAudio.playJump(mockScene);
    RetroAudio.playTreasure(mockScene);
    RetroAudio.playKey(mockScene);
    RetroAudio.playGem(mockScene);
    RetroAudio.playExit(mockScene);
    RetroAudio.playDoorOpen(mockScene);
    RetroAudio.playPuzzleSolved(mockScene);
    RetroAudio.playDeath(mockScene);

    assert.deepStrictEqual(playedSounds, [
      RetroAudio.SFX_JUMP,
      RetroAudio.SFX_TREASURE,
      RetroAudio.SFX_KEY,
      RetroAudio.SFX_GEM,
      RetroAudio.SFX_EXIT,
      RetroAudio.SFX_DOOR_OPEN,
      RetroAudio.SFX_PUZZLE_SOLVED,
      RetroAudio.SFX_DEATH,
    ]);
  });

    it('la reproducción y detención de música debe ser segura en entornos sin interfaz de audio', () => {
        assert.doesNotThrow(() => {
            RetroAudio.playMenuMusic();
            assert.strictEqual(RetroAudio.getCurrentMusicKey(), RetroAudio.MUSIC_MENU);

            RetroAudio.playChamberMusic();
            assert.strictEqual(RetroAudio.getCurrentMusicKey(), RetroAudio.MUSIC_CHAMBER);

            RetroAudio.stopMusic();
            assert.strictEqual(RetroAudio.getCurrentMusicKey(), null);
        });
    });

    it('debe gestionar la música en bucle continuo y cambiar fluidamente entre menú y recámaras en la escena mock', () => {
        let createdSounds: { key: string; config: any; isPlaying: boolean; stopped: boolean; destroyed: boolean; volume: number }[] = [];

        const mockScene = {
            sound: {
                add: (key: string, config: any) => {
                    const soundObj = {
                        key,
                        config,
                        isPlaying: false,
                        stopped: false,
                        destroyed: false,
                        volume: config.volume,
                        play: function() { this.isPlaying = true; },
                        stop: function() { this.isPlaying = false; this.stopped = true; },
                        destroy: function() { this.destroyed = true; },
                        setVolume: function(v: number) { this.volume = v; }
                    };
                    createdSounds.push(soundObj);
                    return soundObj;
                }
            },
            cache: {
                audio: {
                    exists: (_key: string) => true
                }
            }
        } as any;

        // Iniciar música de menú
        RetroAudio.playMenuMusic(mockScene);
        assert.strictEqual(RetroAudio.getCurrentMusicKey(), RetroAudio.MUSIC_MENU);
        assert.strictEqual(createdSounds.length, 1);
        assert.strictEqual(createdSounds[0].key, RetroAudio.MUSIC_MENU);
        assert.strictEqual(createdSounds[0].config.loop, true);
        assert.strictEqual(createdSounds[0].isPlaying, true);

        // Cambiar a música de recámara (debe detener la de menú y empezar la de recámara suave)
        RetroAudio.playChamberMusic(mockScene);
        assert.strictEqual(RetroAudio.getCurrentMusicKey(), RetroAudio.MUSIC_CHAMBER);
        assert.strictEqual(createdSounds[0].stopped, true);
        assert.strictEqual(createdSounds.length, 2);
        assert.strictEqual(createdSounds[1].key, RetroAudio.MUSIC_CHAMBER);
        assert.strictEqual(createdSounds[1].config.loop, true);
        assert.strictEqual(createdSounds[1].isPlaying, true);
        assert.ok(createdSounds[1].volume < createdSounds[0].volume, 'La música de recámara debe tener volumen suave');

        // Detener música explícitamente
        RetroAudio.stopMusic();
        assert.strictEqual(RetroAudio.getCurrentMusicKey(), null);
        assert.strictEqual(createdSounds[1].stopped, true);
    });
});
