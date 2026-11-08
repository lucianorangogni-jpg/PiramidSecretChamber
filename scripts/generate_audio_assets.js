import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'public', 'assets', 'audio');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const SAMPLE_RATE = 22050;

/**
 * Crea un buffer WAV PCM de 16 bits mono a partir de un array de muestras [-1.0, 1.0].
 */
function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
    const numSamples = samples.length;
    const subChunk2Size = numSamples * 2; // 16-bit = 2 bytes por muestra
    const chunkSize = 36 + subChunk2Size;

    const buffer = Buffer.alloc(44 + subChunk2Size);

    // RIFF identifier
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(chunkSize, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);          // Subchunk1Size (16 para PCM)
    buffer.writeUInt16LE(1, 20);           // AudioFormat (1 para PCM)
    buffer.writeUInt16LE(1, 22);           // NumChannels (1 = Mono)
    buffer.writeUInt32LE(sampleRate, 24);  // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate = SampleRate * NumChannels * 2
    buffer.writeUInt16LE(2, 32);           // BlockAlign = NumChannels * 2
    buffer.writeUInt16LE(16, 34);          // BitsPerSample (16 bits)

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(subChunk2Size, 40);

    // Escribir muestras en formato PCM signed 16-bit little endian
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const clamped = Math.max(-1.0, Math.min(1.0, samples[i]));
        const int16 = clamped < 0 ? Math.floor(clamped * 32768) : Math.floor(clamped * 32767);
        buffer.writeInt16LE(int16, offset);
        offset += 2;
    }

    return buffer;
}

/**
 * 1. SFX SALTO (sfx_jump)
 * Frecuencia ascendente rápida de 150 Hz a 520 Hz con onda cuadrada suave (retro arcade boing).
 */
function generateJumpSound() {
    const duration = 0.16; // 160 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    let phase = 0;
    const startFreq = 140;
    const endFreq = 540;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / totalSamples; // 0.0 a 1.0
        // Curva exponencial de frecuencia ascendente
        const freq = startFreq + (endFreq - startFreq) * Math.pow(t, 0.7);
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;

        // Onda cuadrada con armónicos suaves (retro 8-bit pulse)
        const square = Math.sin(phase) >= 0 ? 0.75 : -0.75;
        const tri = (2 / Math.PI) * Math.asin(Math.sin(phase));
        const wave = square * 0.7 + tri * 0.3;

        // Envoltura de volumen (Attack rápido, Decay suave)
        const envelope = (1.0 - t * 0.9) * Math.min(1.0, (i / (SAMPLE_RATE * 0.008)));
        samples[i] = wave * envelope * 0.65;
    }

    return samples;
}

/**
 * 2. SFX TESORO (sfx_treasure)
 * Arpegio brillante de 2 tonos ascendentes (587 Hz D5 -> 880 Hz A5) estilo cofre/moneda retro.
 */
function generateTreasureSound() {
    const duration = 0.28; // 280 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    const note1Duration = 0.09;
    const note1Samples = Math.floor(SAMPLE_RATE * note1Duration);

    let phase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const timeSec = i / SAMPLE_RATE;
        let freq;
        let env;

        if (i < note1Samples) {
            // Nota 1: D5 (587.3 Hz)
            freq = 587.33;
            const t1 = i / note1Samples;
            env = Math.min(1.0, i / (SAMPLE_RATE * 0.005)) * (1.0 - t1 * 0.3);
        } else {
            // Nota 2: A5 (880.0 Hz)
            freq = 880.0;
            const t2 = (i - note1Samples) / (totalSamples - note1Samples);
            env = Math.min(1.0, (i - note1Samples) / (SAMPLE_RATE * 0.005)) * Math.pow(1.0 - t2, 1.4);
        }

        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        // Onda cuadrada clásica retro 50% duty
        const wave = Math.sin(phase) >= 0 ? 0.7 : -0.7;
        samples[i] = wave * env * 0.6;
    }

    return samples;
}

/**
 * 3. SFX LLAVE (sfx_key)
 * Campanilleo místico ascendente de 3 notas metálicas (A5 880Hz -> D6 1175Hz -> A6 1760Hz).
 */
function generateKeySound() {
    const duration = 0.38; // 380 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    const n1Samples = Math.floor(SAMPLE_RATE * 0.08);
    const n2Samples = Math.floor(SAMPLE_RATE * 0.16);

    let phase1 = 0;
    let phase2 = 0;

    for (let i = 0; i < totalSamples; i++) {
        let freq;
        let noteProgress;

        if (i < n1Samples) {
            freq = 880.0; // A5
            noteProgress = i / n1Samples;
        } else if (i < n2Samples) {
            freq = 1174.66; // D6
            noteProgress = (i - n1Samples) / (n2Samples - n1Samples);
        } else {
            freq = 1760.0; // A6
            noteProgress = (i - n2Samples) / (totalSamples - n2Samples);
        }

        phase1 += (2 * Math.PI * freq) / SAMPLE_RATE;
        phase2 += (2 * Math.PI * (freq * 2.01)) / SAMPLE_RATE; // Sobretono metálico

        // Onda cuadrada + sobretono triangular brillante
        const w1 = Math.sin(phase1) >= 0 ? 0.6 : -0.6;
        const w2 = Math.sin(phase2) * 0.3;
        const wave = w1 + w2;

        const attack = Math.min(1.0, (i % (SAMPLE_RATE * 0.08)) / (SAMPLE_RATE * 0.005));
        const decay = Math.pow(1.0 - noteProgress, 1.2);
        const env = attack * decay;

        samples[i] = wave * env * 0.55;
    }

    return samples;
}

/**
 * 4. SFX GEMA SAGRADA (sfx_gem)
 * Cristalización sagrada y destello divino (4 notas rápidas: E5 -> G#5 -> D6 -> G#6 con decaimiento brillante).
 */
function generateGemSound() {
    const duration = 0.44; // 440 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    const stepSamples = Math.floor(SAMPLE_RATE * 0.07);
    const freqs = [659.25, 830.61, 1174.66, 1661.22];

    let phase = 0;
    let subPhase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const stepIndex = Math.min(3, Math.floor(i / stepSamples));
        const freq = freqs[stepIndex];

        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        subPhase += (2 * Math.PI * freq * 1.5) / SAMPLE_RATE; // Quinta armónica brillante

        const w1 = Math.sin(phase);
        const w2 = Math.sin(subPhase) * 0.4;
        const wave = (w1 + w2) * 0.7;

        let env;
        if (stepIndex < 3) {
            const stepT = (i % stepSamples) / stepSamples;
            env = Math.min(1.0, (i % stepSamples) / (SAMPLE_RATE * 0.004)) * (1.0 - stepT * 0.2);
        } else {
            const lastT = (i - stepSamples * 3) / (totalSamples - stepSamples * 3);
            env = Math.min(1.0, (i - stepSamples * 3) / (SAMPLE_RATE * 0.004)) * Math.pow(1.0 - lastT, 1.5);
        }

        samples[i] = wave * env * 0.65;
    }

    return samples;
}

/**
 * 5. SFX SALIR / VICTORIA DE RECÁMARA (sfx_exit)
 * Fanfarria triunfal retro arcade (C4 -> E4 -> G4 -> acorde mayor triunfal C5/E5).
 */
function generateExitSound() {
    const duration = 0.72; // 720 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    const step1 = Math.floor(SAMPLE_RATE * 0.12);
    const step2 = Math.floor(SAMPLE_RATE * 0.24);
    const step3 = Math.floor(SAMPLE_RATE * 0.36);

    let phase1 = 0;
    let phase2 = 0;

    for (let i = 0; i < totalSamples; i++) {
        let f1, f2, env;

        if (i < step1) {
            f1 = 261.63; // C4
            f2 = f1 * 2;
            const t = i / step1;
            env = Math.min(1.0, i / (SAMPLE_RATE * 0.008)) * (1.0 - t * 0.2);
        } else if (i < step2) {
            f1 = 329.63; // E4
            f2 = f1 * 2;
            const t = (i - step1) / (step2 - step1);
            env = Math.min(1.0, (i - step1) / (SAMPLE_RATE * 0.008)) * (1.0 - t * 0.2);
        } else if (i < step3) {
            f1 = 392.00; // G4
            f2 = f1 * 2;
            const t = (i - step2) / (step3 - step2);
            env = Math.min(1.0, (i - step2) / (SAMPLE_RATE * 0.008)) * (1.0 - t * 0.2);
        } else {
            // Acorde triunfal: C5 (523.25) + E5 (659.25)
            f1 = 523.25;
            f2 = 659.25;
            const t = (i - step3) / (totalSamples - step3);
            env = Math.min(1.0, (i - step3) / (SAMPLE_RATE * 0.01)) * Math.pow(1.0 - t, 1.3);
        }

        phase1 += (2 * Math.PI * f1) / SAMPLE_RATE;
        phase2 += (2 * Math.PI * f2) / SAMPLE_RATE;

        // Onda cuadrada / pulse con cuerpo rico arcade
        const w1 = Math.sin(phase1) >= 0 ? 0.5 : -0.5;
        const w2 = Math.sin(phase2) >= 0 ? 0.35 : -0.35;
        const wave = w1 + w2;

        samples[i] = wave * env * 0.55;
    }

    return samples;
}

/**
 * 6. SFX ABRIR PUERTA (sfx_door_open)
 * Mecanismo de piedra ancestral y pestillo de cerrojo (clic metálico inicial seguido de fricción y deslizamiento de piedra).
 */
function generateDoorOpenSound() {
    const duration = 0.45; // 450 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    let phase = 0;
    let clickPhase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / totalSamples;
        let wave = 0;

        // 1. Clic / Cerrojo metálico inicial (primeros 50 ms)
        if (i < SAMPLE_RATE * 0.05) {
            const clickT = i / (SAMPLE_RATE * 0.05);
            clickPhase += (2 * Math.PI * (700 - clickT * 400)) / SAMPLE_RATE;
            const clickSquare = Math.sin(clickPhase) >= 0 ? 0.6 : -0.6;
            const clickEnv = 1.0 - clickT;
            wave += clickSquare * clickEnv * 0.5;
        }

        // 2. Fricción y rozamiento de losas de piedra (rumble bajo 85 Hz -> 60 Hz modulado)
        const rumbleFreq = 85 - t * 25;
        phase += (2 * Math.PI * rumbleFreq) / SAMPLE_RATE;
        const stoneRumble = (Math.sin(phase) + 0.5 * Math.sin(phase * 1.5)) * 0.6;

        // Modulación de rugosidad de piedra arenisca (pseudo-ruido determinista)
        const noise = (Math.sin(i * 12.9898) * 43758.5453 % 1.0) * 0.25;

        const rumbleWave = stoneRumble + noise;
        const rumbleEnv = Math.min(1.0, i / (SAMPLE_RATE * 0.02)) * Math.pow(1.0 - t, 0.8);

        wave += rumbleWave * rumbleEnv * 0.7;
        samples[i] = wave * 0.65;
    }

    return samples;
}

/**
 * 7. SFX RESOLVER PUZLE (sfx_puzzle_solved)
 * Fanfarria mística de descubrimiento y revelación divina egipcia (5 notas mágicas ascendentes: G4 -> B4 -> D5 -> F#5 -> B5).
 */
function generatePuzzleSolvedSound() {
    const duration = 0.56; // 560 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    const stepDuration = 0.08;
    const stepSamples = Math.floor(SAMPLE_RATE * stepDuration);
    const freqs = [392.00, 493.88, 587.33, 739.99, 987.77]; // G4, B4, D5, F#5, B5

    let phase = 0;
    let subPhase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const noteIdx = Math.min(4, Math.floor(i / stepSamples));
        let freq = freqs[noteIdx];

        // Vibrato celestial en la nota final
        if (noteIdx === 4) {
            const finalT = (i - stepSamples * 4) / (totalSamples - stepSamples * 4);
            const vibrato = Math.sin(finalT * Math.PI * 14) * 8.0;
            freq += vibrato;
        }

        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        subPhase += (2 * Math.PI * freq * 2.0) / SAMPLE_RATE;

        // Onda cuadrada rica con armónico triangular
        const wSquare = Math.sin(phase) >= 0 ? 0.5 : -0.5;
        const wTri = (2 / Math.PI) * Math.asin(Math.sin(subPhase)) * 0.35;
        const wave = wSquare + wTri;

        let env;
        if (noteIdx < 4) {
            const noteT = (i % stepSamples) / stepSamples;
            env = Math.min(1.0, (i % stepSamples) / (SAMPLE_RATE * 0.005)) * (1.0 - noteT * 0.15);
        } else {
            const finalT = (i - stepSamples * 4) / (totalSamples - stepSamples * 4);
            env = Math.min(1.0, (i - stepSamples * 4) / (SAMPLE_RATE * 0.005)) * Math.pow(1.0 - finalT, 1.3);
        }

        samples[i] = wave * env * 0.65;
    }

    return samples;
}

/**
 * 8. SFX MORIR (sfx_death)
 * Secuencia retro arcade de derrota / eliminación (golpe sordo seguido de barrido descendente cromático y disonancia).
 */
function generateDeathSound() {
    const duration = 0.68; // 680 ms
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    let phase1 = 0;
    let phase2 = 0;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / totalSamples;
        let wave = 0;

        // 1. Golpe de impacto inicial (primeros 60 ms)
        if (i < SAMPLE_RATE * 0.06) {
            const impactNoise = (Math.sin(i * 37.123) * 23421.43 % 1.0) * 0.5;
            const impactEnv = 1.0 - (i / (SAMPLE_RATE * 0.06));
            wave += impactNoise * impactEnv;
        }

        // 2. Caída tonal retro disonante (frecuencia decreciente de 340 Hz a 65 Hz)
        const freq1 = Math.max(50, 340 * Math.pow(1.0 - t, 1.8));
        const freq2 = freq1 * 0.89; // Intervalo disonante para sensación de fatalidad arcade

        phase1 += (2 * Math.PI * freq1) / SAMPLE_RATE;
        phase2 += (2 * Math.PI * freq2) / SAMPLE_RATE;

        // Onda cuadrada rugosa arcade
        const w1 = Math.sin(phase1) >= 0 ? 0.5 : -0.5;
        const w2 = Math.sin(phase2) >= 0 ? 0.35 : -0.35;

        // Envoltura con vibrato / trémolo
        const tremolo = 0.8 + 0.2 * Math.sin(t * Math.PI * 25);
        const env = Math.min(1.0, i / (SAMPLE_RATE * 0.005)) * Math.pow(1.0 - t, 1.1) * tremolo;

        wave += (w1 + w2) * env * 0.65;
        samples[i] = wave * 0.65;
    }

    return samples;
}

/**
 * 9. MÚSICA MENÚ PRINCIPAL (music_menu)
 * Tema retro arcade de misterio y aventura egipcia en Mi frigio / armónico (120 BPM, bucle continuo de 16 segundos).
 */
function generateMenuMusic() {
    const duration = 16.0; // 16 segundos exactos (32 tiempos a 120 BPM)
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    const beatDuration = 0.5; // 120 BPM = 0.5s por tiempo
    const eighthDuration = 0.25;

    // Progresión de acordes por compás (cada compás = 4 tiempos = 2.0s):
    // Compás 1: Em | Compás 2: F | Compás 3: Em | Compás 4: Dm
    // Compás 5: Em | Compás 6: F | Compás 7: G  | Compás 8: E/B7 (cierre egipcio con Sol#)
    const bassFreqs = [82.41, 87.31, 82.41, 73.42, 82.41, 87.31, 98.00, 82.41]; // E2, F2, E2, D2, E2, F2, G2, E2

    // Melodía principal egipcia (notas y duraciones en tiempos de 0.5s)
    const melodyNotes = [
        // Compás 1 (Em)
        { t: 0.0, d: 0.5, f: 329.63 }, // E4
        { t: 0.5, d: 0.5, f: 392.00 }, // G4
        { t: 1.0, d: 0.5, f: 349.23 }, // F4
        { t: 1.5, d: 0.5, f: 329.63 }, // E4
        // Compás 2 (F)
        { t: 2.0, d: 0.75, f: 349.23 }, // F4
        { t: 2.75, d: 0.25, f: 392.00 }, // G4
        { t: 3.0, d: 0.5, f: 440.00 }, // A4
        { t: 3.5, d: 0.5, f: 349.23 }, // F4
        // Compás 3 (Em)
        { t: 4.0, d: 0.5, f: 392.00 }, // G4
        { t: 4.5, d: 0.5, f: 440.00 }, // A4
        { t: 5.0, d: 0.75, f: 493.88 }, // B4
        { t: 5.75, d: 0.25, f: 440.00 }, // A4
        // Compás 4 (Dm)
        { t: 6.0, d: 0.5, f: 392.00 }, // G4
        { t: 6.5, d: 0.5, f: 349.23 }, // F4
        { t: 7.0, d: 0.5, f: 293.66 }, // D4
        { t: 7.5, d: 0.5, f: 349.23 }, // F4
        // Compás 5 (Em)
        { t: 8.0, d: 1.0, f: 493.88 }, // B4
        { t: 9.0, d: 0.5, f: 440.00 }, // A4
        { t: 9.5, d: 0.5, f: 392.00 }, // G4
        // Compás 6 (F)
        { t: 10.0, d: 1.0, f: 440.00 }, // A4
        { t: 11.0, d: 0.5, f: 392.00 }, // G4
        { t: 11.5, d: 0.5, f: 349.23 }, // F4
        // Compás 7 (G)
        { t: 12.0, d: 0.5, f: 493.88 }, // B4
        { t: 12.5, d: 0.5, f: 523.25 }, // C5
        { t: 13.0, d: 0.5, f: 493.88 }, // B4
        { t: 13.5, d: 0.5, f: 440.00 }, // A4
        // Compás 8 (E cadencia egipcia)
        { t: 14.0, d: 0.5, f: 415.30 }, // G#4 (tercera mayor egipcia)
        { t: 14.5, d: 0.5, f: 493.88 }, // B4
        { t: 15.0, d: 0.5, f: 415.30 }, // G#4
        { t: 15.5, d: 0.5, f: 329.63 }  // E4 (conecta con el inicio)
    ];

    // Fases de osciladores
    let bassPhase = 0;
    let arpHarmPhase = 0;
    let melodyPhase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const timeSec = i / SAMPLE_RATE;
        const currentBar = Math.min(7, Math.floor(timeSec / 2.0));
        const beatInSong = timeSec / beatDuration;
        const eighthInSong = timeSec / eighthDuration;

        let mixedSample = 0;

        // 1. LÍNEA DE BAJO (Onda triangular con peso retro)
        const bassFreq = bassFreqs[currentBar];
        bassPhase += (2 * Math.PI * bassFreq) / SAMPLE_RATE;
        const bassWave = (2 / Math.PI) * Math.asin(Math.sin(bassPhase));
        const bassEnv = 0.75 + 0.25 * Math.sin(timeSec * Math.PI * 4); // Pulsación rítmica
        mixedSample += bassWave * bassEnv * 0.35;

        // 2. ARPEGIOS DE ARMONÍA (Onda cuadrada suave en corcheas)
        const arpHarmonicOffsets = [1.0, 1.25, 1.5, 2.0];
        const arpStep = Math.floor(eighthInSong) % 4;
        const arpFreq = bassFreq * 2.0 * arpHarmonicOffsets[arpStep];
        arpHarmPhase += (2 * Math.PI * arpFreq) / SAMPLE_RATE;
        const arpWave = Math.sin(arpHarmPhase) >= 0 ? 0.3 : -0.3;
        const arpEnv = Math.pow(1.0 - (eighthInSong % 1.0), 1.5);
        mixedSample += arpWave * arpEnv * 0.18;

        // 3. MELODÍA PRINCIPAL RETRO (Onda cuadrada con vibrato)
        for (let m = 0; m < melodyNotes.length; m++) {
            const note = melodyNotes[m];
            const noteStartSec = note.t * beatDuration;
            const noteDurationSec = note.d * beatDuration;
            if (timeSec >= noteStartSec && timeSec < noteStartSec + noteDurationSec) {
                const noteTime = timeSec - noteStartSec;
                const noteProgress = noteTime / noteDurationSec;

                // Vibrato suave al final de la nota
                const vibrato = noteProgress > 0.4 ? Math.sin(noteTime * Math.PI * 10) * 4.0 : 0;
                melodyPhase += (2 * Math.PI * (note.f + vibrato)) / SAMPLE_RATE;

                // Onda cuadrada con armónico suave
                const w1 = Math.sin(melodyPhase) >= 0 ? 0.45 : -0.45;
                const w2 = Math.sin(melodyPhase * 2.0) * 0.15;

                const attack = Math.min(1.0, noteTime / 0.015);
                const decay = Math.pow(1.0 - noteProgress, 0.9);
                const env = attack * decay;

                mixedSample += (w1 + w2) * env * 0.42;
                break;
            }
        }

        // 4. PERCUSIÓN RETRO (Bombo en tiempos 1 y 3, Charles en corcheas)
        const beatFrac = beatInSong % 1.0;
        const beatNum = Math.floor(beatInSong) % 4;
        // Bombo suave en tiempo 1 y 3
        if ((beatNum === 0 || beatNum === 2) && beatFrac < 0.25) {
            const kickT = beatFrac / 0.25;
            const kickFreq = Math.max(40, 120 * (1.0 - kickT));
            const kickWave = Math.sin(2 * Math.PI * kickFreq * kickT);
            mixedSample += kickWave * (1.0 - kickT) * 0.35;
        }
        // Charles / Shaker cerrado en cada corchea
        const eighthFrac = eighthInSong % 1.0;
        if (eighthFrac < 0.12) {
            const hatT = eighthFrac / 0.12;
            const noise = ((Math.sin(i * 45.132) * 12345.67) % 1.0);
            mixedSample += noise * (1.0 - hatT) * 0.12;
        }

        samples[i] = Math.max(-1.0, Math.min(1.0, mixedSample * 0.7));
    }

    return samples;
}

/**
 * 10. MÚSICA RECÁMARAS EGIPCIAS (music_chamber)
 * Ambiente misterioso, suave y sagrado de la tumba egipcia en escala D Hijaz / Frigia Dominante
 * (D - Eb - F# - G - A - Bb - C). Diseñado para sonar suave y ambiental sin saturar el juego.
 */
function generateChamberMusic() {
    const duration = 18.0; // 18 segundos exactos (bucle armónico perfecto)
    const totalSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(totalSamples);

    // Escala D Hijaz:
    // D3: 146.83, Eb3: 155.56, F#3: 185.00, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63
    // D4: 293.66, Eb4: 311.13, F#4: 369.99, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25
    const melodyPhrases = [
        // Frase 1 (0.0s - 4.5s): Apertura mística del santuario
        { start: 0.2, dur: 0.9, f: 293.66 }, // D4
        { start: 1.1, dur: 0.5, f: 311.13 }, // Eb4
        { start: 1.6, dur: 0.9, f: 369.99 }, // F#4
        { start: 2.5, dur: 0.6, f: 392.00 }, // G4
        { start: 3.1, dur: 0.5, f: 369.99 }, // F#4
        { start: 3.6, dur: 0.4, f: 311.13 }, // Eb4
        { start: 4.0, dur: 0.5, f: 293.66 }, // D4

        // Frase 2 (4.5s - 9.0s): Ascenso a las alturas sagradas
        { start: 4.7, dur: 0.6, f: 293.66 }, // D4
        { start: 5.3, dur: 0.7, f: 369.99 }, // F#4
        { start: 6.0, dur: 1.1, f: 440.00 }, // A4
        { start: 7.1, dur: 0.6, f: 466.16 }, // Bb4
        { start: 7.7, dur: 0.5, f: 440.00 }, // A4
        { start: 8.2, dur: 0.4, f: 392.00 }, // G4
        { start: 8.6, dur: 0.4, f: 369.99 }, // F#4

        // Frase 3 (9.0s - 13.5s): Lamento ancestral del faraón
        { start: 9.2, dur: 0.8, f: 440.00 }, // A4
        { start: 10.0, dur: 0.7, f: 523.25 }, // C5
        { start: 10.7, dur: 0.6, f: 466.16 }, // Bb4
        { start: 11.3, dur: 0.9, f: 440.00 }, // A4
        { start: 12.2, dur: 0.4, f: 392.00 }, // G4
        { start: 12.6, dur: 0.4, f: 369.99 }, // F#4
        { start: 13.0, dur: 0.5, f: 311.13 }, // Eb4

        // Frase 4 (13.5s - 18.0s): Retorno sereno al reposo eterno
        { start: 13.7, dur: 0.6, f: 369.99 }, // F#4
        { start: 14.3, dur: 0.5, f: 392.00 }, // G4
        { start: 14.8, dur: 0.6, f: 369.99 }, // F#4
        { start: 15.4, dur: 0.6, f: 311.13 }, // Eb4
        { start: 16.0, dur: 1.8, f: 293.66 }  // D4 (sostenida suave hacia el bucle)
    ];

    // Fases de osciladores
    let dronePhaseD = 0;
    let dronePhaseA = 0;
    let flutePhase = 0;
    let fluteSubPhase = 0;

    for (let i = 0; i < totalSamples; i++) {
        const timeSec = i / SAMPLE_RATE;
        let mixed = 0;

        // 1. DRONE SUBTERRÁNEO SUAVE (D2 73.42 Hz + A2 110 Hz con modulación lenta)
        const breatheLFO = 0.85 + 0.15 * Math.sin(timeSec * (2 * Math.PI / 6.0)); // Respiración cada 6s
        dronePhaseD += (2 * Math.PI * 73.42) / SAMPLE_RATE;
        dronePhaseA += (2 * Math.PI * 110.00) / SAMPLE_RATE;

        // Ondas sinusoidales / triangulares cálidas de baja frecuencia
        const droneD = Math.sin(dronePhaseD);
        const droneA = Math.sin(dronePhaseA) * 0.5;
        mixed += (droneD + droneA) * breatheLFO * 0.22;

        // 2. PERCUSIÓN EGIPCIA SUAVE (Ritmo Maqsum / Darbuka de tumba)
        // Patrón cada 2.25s (8 pulsos de 0.281s)
        const drumCycleSec = 2.25;
        const drumTime = timeSec % drumCycleSec;
        const drumStep = Math.floor(drumTime / (drumCycleSec / 8));
        const stepFrac = (drumTime % (drumCycleSec / 8)) / (drumCycleSec / 8);

        // 'Dum' (golpe grave y profundo en pasos 0 y 4)
        if ((drumStep === 0 || drumStep === 4) && stepFrac < 0.4) {
            const dumT = stepFrac / 0.4;
            const dumFreq = 62 * Math.pow(1.0 - dumT * 0.6, 2.0);
            const dumWave = Math.sin(2 * Math.PI * dumFreq * dumT);
            const dumEnv = Math.pow(1.0 - dumT, 1.8);
            mixed += dumWave * dumEnv * 0.25;
        }

        // 'Tek' (toque ligero de borde de cerámica en pasos 2, 6, 7)
        if ((drumStep === 2 || drumStep === 6 || drumStep === 7) && stepFrac < 0.2) {
            const tekT = stepFrac / 0.2;
            const tekNoise = ((Math.sin(i * 77.21) * 32412.3) % 1.0);
            const tekTone = Math.sin(2 * Math.PI * 480 * tekT);
            const tekEnv = Math.pow(1.0 - tekT, 2.0);
            mixed += (tekNoise * 0.6 + tekTone * 0.4) * tekEnv * 0.12;
        }

        // 3. FLAUTA SAGRADA NAY / ARGHUL EGIPCIA (Melodía suave en escala D Hijaz)
        for (let p = 0; p < melodyPhrases.length; p++) {
            const note = melodyPhrases[p];
            if (timeSec >= note.start && timeSec < note.start + note.dur) {
                const noteTime = timeSec - note.start;
                const noteProgress = noteTime / note.dur;

                // Vibrato expresivo egipcio (ondulación lenta y profunda)
                const vibrato = noteProgress > 0.25 ? Math.sin(noteTime * Math.PI * 9) * 4.5 : 0;
                flutePhase += (2 * Math.PI * (note.f + vibrato)) / SAMPLE_RATE;
                fluteSubPhase += (2 * Math.PI * (note.f * 2.0 + vibrato * 2.0)) / SAMPLE_RATE;

                // Sonido de caña: triángulo puro + octava suave + soplido de aire
                const reedTri = (2 / Math.PI) * Math.asin(Math.sin(flutePhase));
                const reedOct = Math.sin(fluteSubPhase) * 0.25;
                const breathNoise = ((Math.sin(i * 19.87) * 9876.5) % 1.0) * 0.08;

                // Envoltura suave de viento (ataque sedoso, liberación gradual)
                const attack = Math.min(1.0, noteTime / 0.08);
                const release = Math.min(1.0, (note.dur - noteTime) / 0.08);
                const env = attack * release;

                mixed += (reedTri + reedOct + breathNoise) * env * 0.32;
                break;
            }
        }

        // 4. SHIMMER DE ARPA / SISTRO EN EL FONDO (Armónicos de campanilla mística en el compás)
        const shimmerBarT = (timeSec % 4.5) / 4.5;
        if (shimmerBarT < 0.15) {
            const shT = shimmerBarT / 0.15;
            const shFreq = 880.0;
            const shWave = Math.sin(2 * Math.PI * shFreq * shT);
            mixed += shWave * Math.pow(1.0 - shT, 2.0) * 0.08;
        }

        // Mezcla suave, envolvente y sin distorsión
        samples[i] = Math.max(-1.0, Math.min(1.0, mixed * 0.55));
    }

    return samples;
}

// Generar y guardar los 8 efectos de sonido + 2 pistas musicales retro
const sfxList = [
    { name: 'sfx_jump.wav', gen: generateJumpSound },
    { name: 'sfx_treasure.wav', gen: generateTreasureSound },
    { name: 'sfx_key.wav', gen: generateKeySound },
    { name: 'sfx_gem.wav', gen: generateGemSound },
    { name: 'sfx_exit.wav', gen: generateExitSound },
    { name: 'sfx_door_open.wav', gen: generateDoorOpenSound },
    { name: 'sfx_puzzle_solved.wav', gen: generatePuzzleSolvedSound },
    { name: 'sfx_death.wav', gen: generateDeathSound },
    { name: 'music_menu.wav', gen: generateMenuMusic },
    { name: 'music_chamber.wav', gen: generateChamberMusic }
];

for (const sfx of sfxList) {
    const samples = sfx.gen();
    const wavBuffer = createWavBuffer(samples);
    const filePath = path.join(outputDir, sfx.name);
    fs.writeFileSync(filePath, wavBuffer);
    console.log(`Generado audio: ${sfx.name} (${wavBuffer.length} bytes)`);
}

console.log('Todos los efectos de sonido retro han sido generados exitosamente.');
