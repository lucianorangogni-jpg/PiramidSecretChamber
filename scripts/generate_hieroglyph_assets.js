import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// 1. Helper functions for PNG decoding and encoding
function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let j = 0; j < 8; j++) {
            c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
        }
    }
    return ~c >>> 0;
}

function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePNG(w, h, rgba) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = 6; // RGBA
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const ihdrChunk = makeChunk('IHDR', ihdr);

    const stride = 1 + w * 4;
    const filtered = Buffer.alloc(stride * h);
    for (let y = 0; y < h; y++) {
        filtered[y * stride] = 0;
        rgba.copy(filtered, y * stride + 1, y * w * 4, (y + 1) * w * 4);
    }
    const idatData = zlib.deflateSync(filtered);
    const idatChunk = makeChunk('IDAT', idatData);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function decodePNG(filePath) {
    const buf = fs.readFileSync(filePath);
    let offset = 8;
    const idatChunks = [];
    let width = 0, height = 0;
    while (offset < buf.length) {
        const len = buf.readUInt32BE(offset);
        const type = buf.toString('ascii', offset + 4, offset + 8);
        if (type === 'IHDR') {
            width = buf.readUInt32BE(offset + 8);
            height = buf.readUInt32BE(offset + 12);
        } else if (type === 'IDAT') {
            idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
        }
        offset += 12 + len;
    }
    const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
    const raw = Buffer.alloc(width * height * 4);
    const bpp = 4;
    const stride = 1 + width * bpp;
    for (let y = 0; y < height; y++) {
        const filter = decompressed[y * stride];
        const srcRow = y * stride + 1;
        const dstRow = y * width * bpp;
        for (let x = 0; x < width * bpp; x++) {
            const val = decompressed[srcRow + x];
            const a = x >= bpp ? raw[dstRow + x - bpp] : 0;
            const b = y > 0 ? raw[(y - 1) * width * bpp + x] : 0;
            const c = (y > 0 && x >= bpp) ? raw[(y - 1) * width * bpp + x - bpp] : 0;
            let filtered = 0;
            if (filter === 0) filtered = val;
            else if (filter === 1) filtered = (val + a) & 0xff;
            else if (filter === 2) filtered = (val + b) & 0xff;
            else if (filter === 3) filtered = (val + Math.floor((a + b) / 2)) & 0xff;
            else if (filter === 4) {
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                let pr = c;
                if (pa <= pb && pa <= pc) pr = a;
                else if (pb <= pc) pr = b;
                filtered = (val + pr) & 0xff;
            }
            raw[dstRow + x] = filtered;
        }
    }
    return { width, height, data: raw };
}

// 2. Load the Egyptian Hieroglyphs image
const imgPath = path.resolve('public/jeroglificosEgipcios_2.png');
console.log('Loading hieroglyphs image from:', imgPath);
const src = decodePNG(imgPath);
console.log(`Decoded source image: ${src.width}x${src.height}`);

// Helper to extract a bounding box, turning the dark ink into gold or stone relief
function extractGlyph(x1, y1, x2, y2, targetW, targetH, inkColor = { r: 217, g: 171, b: 91, a: 255 }) {
    const srcW = x2 - x1 + 1;
    const srcH = y2 - y1 + 1;
    const out = Buffer.alloc(targetW * targetH * 4);

    for (let dy = 0; dy < targetH; dy++) {
        for (let dx = 0; dx < targetW; dx++) {
            const sx = Math.floor(x1 + (dx / targetW) * srcW);
            const sy = Math.floor(y1 + (dy / targetH) * srcH);

            const sIdx = (sy * src.width + sx) * 4;
            const r = src.data[sIdx];
            const g = src.data[sIdx + 1];
            const b = src.data[sIdx + 2];
            const brightness = (r + g + b) / 3;

            // In jeroglificosEgipcios_2.png, glyphs are dark ink (brightness < 80..110)
            const dIdx = (dy * targetW + dx) * 4;
            if (brightness < 110) {
                const factor = Math.max(0, Math.min(1, (110 - brightness) / 70));
                out[dIdx] = Math.round(inkColor.r * factor);
                out[dIdx + 1] = Math.round(inkColor.g * factor);
                out[dIdx + 2] = Math.round(inkColor.b * factor);
                out[dIdx + 3] = Math.round(inkColor.a * factor);
            } else {
                out[dIdx] = 0;
                out[dIdx + 1] = 0;
                out[dIdx + 2] = 0;
                out[dIdx + 3] = 0;
            }
        }
    }
    return out;
}

// Ensure target directories exist
const assetsDir = path.resolve('public/assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// 3. Extract key authentic hieroglyphs
// A. Single Chest from Col 7 (Box 1: x: 1132..1184, y: 294..331)
const glyphSingleChest = extractGlyph(1132, 294, 1184, 331, 14, 14, { r: 245, g: 195, b: 85, a: 255 });
fs.writeFileSync(path.join(assetsDir, 'glyph_chest.png'), writePNG(14, 14, glyphSingleChest));

// B. Authentic Ankh (Key of Life) from Col 1 (x: 79..166, y: 526..628)
const glyphAnkh = extractGlyph(79, 526, 166, 628, 12, 18, { r: 255, g: 220, b: 90, a: 255 });
fs.writeFileSync(path.join(assetsDir, 'glyph_ankh.png'), writePNG(12, 18, glyphAnkh));

// C. Authentic III Strokes from Col 7 (x: 1143..1207, y: 905..929)
const glyphStrokesIII = extractGlyph(1143, 905, 1207, 929, 14, 16, { r: 255, g: 225, b: 100, a: 255 });
fs.writeFileSync(path.join(assetsDir, 'glyph_strokes_iii.png'), writePNG(14, 16, glyphStrokesIII));

// D. Authentic Mummy / Osiris from Col 4 (x: 598..690, y: 428..575)
const glyphMummy = extractGlyph(598, 428, 690, 575, 14, 20, { r: 190, g: 160, b: 110, a: 255 });
fs.writeFileSync(path.join(assetsDir, 'glyph_mummy.png'), writePNG(14, 20, glyphMummy));

// E. Jumping / Walking legs from Col 6 (x: 946..1063, y: 1050..1142)
const glyphJump = extractGlyph(946, 1050, 1063, 1142, 14, 16, { r: 245, g: 195, b: 95, a: 255 });
fs.writeFileSync(path.join(assetsDir, 'glyph_jump.png'), writePNG(14, 16, glyphJump));

// F. Eye of Horus / Sacred Gem of Ra from Col 5 (x: 774..870, y: 563..650)
const glyphEyeGem = extractGlyph(774, 563, 870, 650, 18, 16, { r: 60, g: 235, b: 255, a: 255 });
fs.writeFileSync(path.join(assetsDir, 'glyph_eye_gem.png'), writePNG(18, 16, glyphEyeGem));

console.log('Individual glyphs extracted to public/assets/');

// 4. Compose High-Quality Diegetic Murals
// Mural 1: [Cofre] + [Cofre] + [Llave] -> [III] -> [Cofre Sagrado ☥]
// Dimensions: 128 x 32 px
function createMuralPuzzle1() {
    const W = 128;
    const H = 32;
    const buf = Buffer.alloc(W * H * 4);

    // Stone tablet background and low-relief border
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const idx = (y * W + x) * 4;
            const isBorder = (x <= 1 || x >= W - 2 || y <= 1 || y >= H - 2);
            if (isBorder) {
                buf[idx] = 68; buf[idx + 1] = 42; buf[idx + 2] = 20; buf[idx + 3] = 255;
            } else {
                buf[idx] = 34; buf[idx + 1] = 20; buf[idx + 2] = 8; buf[idx + 3] = 230;
            }
        }
    }

    function blit(glyphData, gw, gh, targetX, targetY) {
        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                const sIdx = (gy * gw + gx) * 4;
                const alpha = glyphData[sIdx + 3] / 255;
                if (alpha > 0.05) {
                    const tx = targetX + gx;
                    const ty = targetY + gy;
                    if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
                        const dIdx = (ty * W + tx) * 4;
                        buf[dIdx] = Math.round(glyphData[sIdx] * alpha + buf[dIdx] * (1 - alpha));
                        buf[dIdx + 1] = Math.round(glyphData[sIdx + 1] * alpha + buf[dIdx + 1] * (1 - alpha));
                        buf[dIdx + 2] = Math.round(glyphData[sIdx + 2] * alpha + buf[dIdx + 2] * (1 - alpha));
                        buf[dIdx + 3] = 255;
                    }
                }
            }
        }
    }

    function drawSymbol(x, y, type) {
        if (type === '+') {
            for (let dy = -3; dy <= 3; dy++) {
                const idx = ((y + dy) * W + x) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
            for (let dx = -3; dx <= 3; dx++) {
                const idx = (y * W + (x + dx)) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
        } else if (type === '->') {
            for (let dx = -3; dx <= 3; dx++) {
                const idx = (y * W + (x + dx)) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
            for (let dy = -2; dy <= 2; dy++) {
                const idx = ((y + dy) * W + (x + 2)) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
        }
    }

    // 1. Cofre 1 en x: 6, y: 9
    blit(glyphSingleChest, 14, 14, 6, 9);
    // + en x: 26, y: 16
    drawSymbol(26, 16, '+');
    // 2. Cofre 2 en x: 33, y: 9
    blit(glyphSingleChest, 14, 14, 33, 9);
    // + en x: 53, y: 16
    drawSymbol(53, 16, '+');
    // 3. Llave Ankh en x: 60, y: 7
    blit(glyphAnkh, 12, 18, 60, 7);
    // -> en x: 78, y: 16
    drawSymbol(78, 16, '->');
    // 4. III en x: 86, y: 8
    blit(glyphStrokesIII, 14, 16, 86, 8);
    // -> en x: 104, y: 16
    drawSymbol(104, 16, '->');
    // 5. Cofre Radiante Dorado del Faraón en x: 110, y: 9
    const radiantChest = Buffer.from(glyphSingleChest);
    for (let i = 0; i < radiantChest.length; i += 4) {
        if (radiantChest[i+3] > 0) {
            radiantChest[i] = 255;
            radiantChest[i+1] = 230;
            radiantChest[i+2] = 120;
        }
    }
    blit(radiantChest, 14, 14, 110, 9);
    // Destello de corona / sol sobre cofre radiante
    const sparkIdx = (6 * W + 116) * 4;
    buf[sparkIdx] = 255; buf[sparkIdx+1] = 255; buf[sparkIdx+2] = 200; buf[sparkIdx+3] = 255;

    return buf;
}

// Mural 2: [Momia] + [Salto IIII] -> [Momia Petrificada] -> [Gema de Ra ☥]
// Dimensions: 128 x 32 px
function createMuralPuzzle2() {
    const W = 128;
    const H = 32;
    const buf = Buffer.alloc(W * H * 4);

    // Stone tablet background and low-relief border
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const idx = (y * W + x) * 4;
            const isBorder = (x <= 1 || x >= W - 2 || y <= 1 || y >= H - 2);
            if (isBorder) {
                buf[idx] = 68; buf[idx + 1] = 42; buf[idx + 2] = 20; buf[idx + 3] = 255;
            } else {
                buf[idx] = 34; buf[idx + 1] = 20; buf[idx + 2] = 8; buf[idx + 3] = 230;
            }
        }
    }

    function blit(glyphData, gw, gh, targetX, targetY) {
        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                const sIdx = (gy * gw + gx) * 4;
                const alpha = glyphData[sIdx + 3] / 255;
                if (alpha > 0.05) {
                    const tx = targetX + gx;
                    const ty = targetY + gy;
                    if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
                        const dIdx = (ty * W + tx) * 4;
                        buf[dIdx] = Math.round(glyphData[sIdx] * alpha + buf[dIdx] * (1 - alpha));
                        buf[dIdx + 1] = Math.round(glyphData[sIdx + 1] * alpha + buf[dIdx + 1] * (1 - alpha));
                        buf[dIdx + 2] = Math.round(glyphData[sIdx + 2] * alpha + buf[dIdx + 2] * (1 - alpha));
                        buf[dIdx + 3] = 255;
                    }
                }
            }
        }
    }

    function drawSymbol(x, y, type) {
        if (type === '+') {
            for (let dy = -3; dy <= 3; dy++) {
                const idx = ((y + dy) * W + x) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
            for (let dx = -3; dx <= 3; dx++) {
                const idx = (y * W + (x + dx)) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
        } else if (type === '->') {
            for (let dx = -3; dx <= 3; dx++) {
                const idx = (y * W + (x + dx)) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
            for (let dy = -2; dy <= 2; dy++) {
                const idx = ((y + dy) * W + (x + 2)) * 4;
                buf[idx] = 220; buf[idx+1] = 175; buf[idx+2] = 95; buf[idx+3] = 255;
            }
        }
    }

    // 1. Momia patrullera en x: 6, y: 6
    blit(glyphMummy, 14, 20, 6, 6);
    // + en x: 26, y: 16
    drawSymbol(26, 16, '+');
    // 2. Salto y 4 marcas IIII en x: 33, y: 8
    blit(glyphJump, 14, 16, 33, 8);
    // 4 marcas "IIII"
    for (let i = 0; i < 4; i++) {
        const mx = 51 + i * 3;
        for (let my = 12; my <= 19; my++) {
            const idx = (my * W + mx) * 4;
            buf[idx] = 255; buf[idx+1] = 220; buf[idx+2] = 100; buf[idx+3] = 255;
        }
    }
    // -> en x: 68, y: 16
    drawSymbol(68, 16, '->');
    // 3. Momia estatua dorada (petrificada) en x: 74, y: 6
    const petrifiedMummy = Buffer.from(glyphMummy);
    for (let i = 0; i < petrifiedMummy.length; i += 4) {
        if (petrifiedMummy[i+3] > 0) {
            petrifiedMummy[i] = 255;
            petrifiedMummy[i+1] = 215;
            petrifiedMummy[i+2] = 90;
        }
    }
    blit(petrifiedMummy, 14, 20, 74, 6);
    // -> en x: 94, y: 16
    drawSymbol(94, 16, '->');
    // 4. Gema Sagrada / Ojo de Ra en x: 102, y: 8
    blit(glyphEyeGem, 18, 16, 102, 8);

    return buf;
}

const mural1Data = createMuralPuzzle1();
fs.writeFileSync(path.join(assetsDir, 'mural_puzzle_1.png'), writePNG(128, 32, mural1Data));

const mural2Data = createMuralPuzzle2();
fs.writeFileSync(path.join(assetsDir, 'mural_puzzle_2.png'), writePNG(128, 32, mural2Data));

console.log('Generated authentic murals: mural_puzzle_1.png and mural_puzzle_2.png');

// 5. Generate Seamless Background Texture for the Tomb Wall
// Crop columns 38..1262 (w: 1224) and 35..1265 (h: 1230)
const cropX1 = 38, cropX2 = 1262;
const cropY1 = 35, cropY2 = 1265;
const cropW = cropX2 - cropX1 + 1;
const cropH = cropY2 - cropY1 + 1;

const bgData = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
        const sIdx = ((cropY1 + y) * src.width + (cropX1 + x)) * 4;
        const dIdx = (y * cropW + x) * 4;
        bgData[dIdx] = src.data[sIdx];
        bgData[dIdx + 1] = src.data[sIdx + 1];
        bgData[dIdx + 2] = src.data[sIdx + 2];
        bgData[dIdx + 3] = src.data[sIdx + 3];
    }
}
fs.writeFileSync(path.join(assetsDir, 'hieroglyphs_wall_seamless.png'), writePNG(cropW, cropH, bgData));
console.log(`Generated seamless background wall: ${cropW}x${cropH} at public/assets/hieroglyphs_wall_seamless.png`);
