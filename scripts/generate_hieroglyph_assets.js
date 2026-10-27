import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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

const imgPath = path.resolve('public/jeroglificosEgipcios_2.png');
const src = decodePNG(imgPath);

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

const assetsDir = path.resolve('public/assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// Glyphs extraídos
const glyphSingleChest = extractGlyph(1132, 294, 1184, 331, 14, 14, { r: 235, g: 185, b: 90, a: 245 });
const glyphAnkh = extractGlyph(79, 526, 166, 628, 12, 18, { r: 250, g: 210, b: 95, a: 250 });
const glyphMummy = extractGlyph(598, 428, 690, 575, 14, 20, { r: 185, g: 150, b: 100, a: 240 });
const glyphEyeGem = extractGlyph(774, 563, 870, 650, 18, 16, { r: 60, g: 235, b: 255, a: 255 });

function blitWithRelief(buf, W, H, glyphData, gw, gh, targetX, targetY) {
    // 1. Sombra cincelada
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const sIdx = (gy * gw + gx) * 4;
            const alpha = glyphData[sIdx + 3] / 255;
            if (alpha > 0.15) {
                const tx = targetX + gx + 1;
                const ty = targetY + gy + 1;
                if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
                    const dIdx = (ty * W + tx) * 4;
                    if (buf[dIdx + 3] === 0) {
                        buf[dIdx] = 30;
                        buf[dIdx + 1] = 16;
                        buf[dIdx + 2] = 6;
                        buf[dIdx + 3] = Math.round(140 * alpha);
                    }
                }
            }
        }
    }
    // 2. Trazo en relieve
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const sIdx = (gy * gw + gx) * 4;
            const alpha = glyphData[sIdx + 3] / 255;
            if (alpha > 0.08) {
                const tx = targetX + gx;
                const ty = targetY + gy;
                if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
                    const dIdx = (ty * W + tx) * 4;
                    buf[dIdx] = glyphData[sIdx];
                    buf[dIdx + 1] = glyphData[sIdx + 1];
                    buf[dIdx + 2] = glyphData[sIdx + 2];
                    buf[dIdx + 3] = glyphData[sIdx + 3];
                }
            }
        }
    }
}

function setPixel(buf, W, H, px, py, r, g, b, a = 255) {
    if (px >= 0 && px < W && py >= 0 && py < H) {
        const idx = (py * W + px) * 4;
        buf[idx] = r; buf[idx+1] = g; buf[idx+2] = b; buf[idx+3] = a;
    }
}

function drawSymbolRelief(buf, W, H, x, y, type) {
    const shadowColor = { r: 30, g: 16, b: 6, a: 150 };
    const fgColor = { r: 220, g: 175, b: 95, a: 240 };

    const setP = (px, py, col) => setPixel(buf, W, H, px, py, col.r, col.g, col.b, col.a);

    if (type === '+') {
        for (let dy = -3; dy <= 3; dy++) setP(x + 1, y + dy + 1, shadowColor);
        for (let dx = -3; dx <= 3; dx++) setP(x + dx + 1, y + 1, shadowColor);
        for (let dy = -3; dy <= 3; dy++) setP(x, y + dy, fgColor);
        for (let dx = -3; dx <= 3; dx++) setP(x + dx, y, fgColor);
    } else if (type === '->') {
        for (let dx = -3; dx <= 3; dx++) setP(x + dx + 1, y + 1, shadowColor);
        for (let dy = -2; dy <= 2; dy++) setP(x + 2 + 1, y + dy + 1, shadowColor);
        for (let dx = -3; dx <= 3; dx++) setP(x + dx, y, fgColor);
        for (let dy = -2; dy <= 2; dy++) setP(x + 2, y + dy, fgColor);
    }
}

function drawStrokes(buf, W, H, startX, y, count) {
    for (let i = 0; i < count; i++) {
        const sx = startX + i * 4;
        for (let dy = 0; dy < 13; dy++) {
            setPixel(buf, W, H, sx + 1, y + dy + 1, 30, 16, 6, 160);
            setPixel(buf, W, H, sx, y + dy, 255, 220, 100, 245);
            setPixel(buf, W, H, sx + 1, y + dy, 240, 190, 80, 230);
        }
    }
}

function drawRadiantChest(buf, W, H, x, y) {
    const radiantChest = Buffer.from(glyphSingleChest);
    for (let i = 0; i < radiantChest.length; i += 4) {
        if (radiantChest[i+3] > 0) {
            radiantChest[i] = 255;
            radiantChest[i+1] = 230;
            radiantChest[i+2] = 120;
        }
    }
    blitWithRelief(buf, W, H, radiantChest, 14, 14, x, y);
    // Destello
    setPixel(buf, W, H, x + 7, y - 2, 255, 255, 220, 255);
    setPixel(buf, W, H, x + 6, y - 1, 255, 255, 220, 255);
    setPixel(buf, W, H, x + 8, y - 1, 255, 255, 220, 255);
    setPixel(buf, W, H, x + 7, y, 255, 255, 220, 255);
}

function drawPetrifiedMummySection(buf, W, H, x, y) {
    // Pedestal
    for (let bx = x; bx <= x + 16; bx++) {
        setPixel(buf, W, H, bx + 1, y + 21, 30, 16, 6, 140);
        setPixel(buf, W, H, bx, y + 20, 180, 150, 90, 240);
    }
    const petrifiedMummy = Buffer.from(glyphMummy);
    for (let i = 0; i < petrifiedMummy.length; i += 4) {
        if (petrifiedMummy[i+3] > 0) {
            petrifiedMummy[i] = 250;
            petrifiedMummy[i+1] = 215;
            petrifiedMummy[i+2] = 100;
        }
    }
    blitWithRelief(buf, W, H, petrifiedMummy, 14, 20, x + 1, y);
    // Destello tiempo congelado
    setPixel(buf, W, H, x + 8, y - 3, 255, 255, 220, 255);
    setPixel(buf, W, H, x + 7, y - 2, 255, 230, 130, 255);
    setPixel(buf, W, H, x + 9, y - 2, 255, 230, 130, 255);
    setPixel(buf, W, H, x + 8, y - 1, 255, 230, 130, 255);
}

function drawSacredGemSection(buf, W, H, x, y) {
    blitWithRelief(buf, W, H, glyphEyeGem, 18, 16, x, y);
    setPixel(buf, W, H, x + 18, y - 2, 200, 250, 255, 255);
    setPixel(buf, W, H, x + 20, y - 1, 200, 250, 255, 255);
    setPixel(buf, W, H, x + 17, y + 10, 200, 250, 255, 255);
}

function drawJumpOverMummy(buf, W, H, x, countStr) {
    // Momia en x, y: 10
    blitWithRelief(buf, W, H, glyphMummy, 14, 20, x + 8, 10);

    // Arco de x a x + 30
    for (let px = x; px <= x + 30; px++) {
        const t = (px - x) / 30;
        const py = Math.round(26 - 21 * 4 * t * (1 - t));
        setPixel(buf, W, H, px + 1, py + 1, 35, 20, 8, 170);
        setPixel(buf, W, H, px, py, 255, 225, 105, 255);
    }
    // Cabeza del arqueólogo en el ápice
    setPixel(buf, W, H, x + 15, 3, 255, 240, 180, 255);
    setPixel(buf, W, H, x + 15, 4, 240, 200, 100, 255);

    // Rótulo
    drawText(buf, W, H, x + 22, 2, countStr);
}

function drawText(buf, W, H, x, y, str) {
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const cx = x + i * 5;
        if (ch === '1') {
            setPixel(buf, W, H, cx + 1, y, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 1, y + 1, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 1, y + 2, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 1, y + 3, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 1, y + 4, 255, 235, 110, 255);
        } else if (ch === '2') {
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 1, 255, 235, 110, 255);
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y + 2, 255, 235, 110, 255);
            setPixel(buf, W, H, cx, y + 3, 255, 235, 110, 255);
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y + 4, 255, 235, 110, 255);
        } else if (ch === '3') {
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 1, 255, 235, 110, 255);
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y + 2, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 3, 255, 235, 110, 255);
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y + 4, 255, 235, 110, 255);
        } else if (ch === '4') {
            setPixel(buf, W, H, cx, y, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y, 255, 235, 110, 255);
            setPixel(buf, W, H, cx, y + 1, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 1, 255, 235, 110, 255);
            for (let dx = 0; dx < 3; dx++) setPixel(buf, W, H, cx + dx, y + 2, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 3, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 4, 255, 235, 110, 255);
        } else if (ch === 'x') {
            setPixel(buf, W, H, cx, y + 2, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 2, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 1, y + 3, 255, 235, 110, 255);
            setPixel(buf, W, H, cx, y + 4, 255, 235, 110, 255);
            setPixel(buf, W, H, cx + 2, y + 4, 255, 235, 110, 255);
        }
    }
}

// -------------------------------------------------------------
// RECÁMARA 1
// -------------------------------------------------------------
function createMuralCh1P1() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    blitWithRelief(buf, W, H, glyphSingleChest, 14, 14, 6, 9);
    drawSymbolRelief(buf, W, H, 26, 16, '+');
    blitWithRelief(buf, W, H, glyphSingleChest, 14, 14, 33, 9);
    drawSymbolRelief(buf, W, H, 53, 16, '+');
    blitWithRelief(buf, W, H, glyphAnkh, 12, 18, 60, 7);
    drawSymbolRelief(buf, W, H, 78, 16, '->');
    drawStrokes(buf, W, H, 86, 9, 3);
    drawSymbolRelief(buf, W, H, 102, 16, '->');
    drawRadiantChest(buf, W, H, 110, 9);
    return buf;
}

function createMuralCh1P2() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    drawJumpOverMummy(buf, W, H, 6, '4x');
    drawStrokes(buf, W, H, 42, 18, 4);
    drawSymbolRelief(buf, W, H, 58, 16, '->');
    drawPetrifiedMummySection(buf, W, H, 68, 6);
    drawSymbolRelief(buf, W, H, 92, 16, '->');
    drawSacredGemSection(buf, W, H, 102, 8);
    return buf;
}

// -------------------------------------------------------------
// RECÁMARA 2
// -------------------------------------------------------------
// Puzle 1: [Cofre N0] -> [Llave] -> [Salto Momia] -> [II] -> [Cofre Radiante]
function createMuralCh2P1() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    blitWithRelief(buf, W, H, glyphSingleChest, 14, 14, 4, 9);
    drawSymbolRelief(buf, W, H, 23, 16, '->');
    blitWithRelief(buf, W, H, glyphAnkh, 12, 18, 30, 7);
    drawSymbolRelief(buf, W, H, 48, 16, '->');
    drawJumpOverMummy(buf, W, H, 54, '1x');
    drawSymbolRelief(buf, W, H, 88, 16, '->');
    drawStrokes(buf, W, H, 94, 9, 2);
    drawSymbolRelief(buf, W, H, 106, 16, '->');
    drawRadiantChest(buf, W, H, 112, 9);
    return buf;
}

// Puzle 2: [Salto 2x N1] + [Salto 2x N2] -> [Momia Petrificada] -> [Gema Sagrada]
function createMuralCh2P2() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    drawJumpOverMummy(buf, W, H, 2, '2x');
    drawSymbolRelief(buf, W, H, 36, 16, '+');
    drawJumpOverMummy(buf, W, H, 42, '2x');
    drawSymbolRelief(buf, W, H, 76, 16, '->');
    drawPetrifiedMummySection(buf, W, H, 84, 6);
    drawSymbolRelief(buf, W, H, 104, 16, '->');
    drawSacredGemSection(buf, W, H, 110, 8);
    return buf;
}

// -------------------------------------------------------------
// RECÁMARA 3
// -------------------------------------------------------------
// Puzle 1: [Llave 1.º] -> [Cofre + Cofre] -> [IIII] -> [Cofre Radiante]
function createMuralCh3P1() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    blitWithRelief(buf, W, H, glyphAnkh, 12, 18, 6, 7);
    drawText(buf, W, H, 18, 16, '1');
    drawSymbolRelief(buf, W, H, 28, 16, '->');
    blitWithRelief(buf, W, H, glyphSingleChest, 14, 14, 34, 9);
    drawSymbolRelief(buf, W, H, 52, 16, '+');
    blitWithRelief(buf, W, H, glyphSingleChest, 14, 14, 58, 9);
    drawSymbolRelief(buf, W, H, 76, 16, '->');
    drawStrokes(buf, W, H, 84, 9, 4);
    drawSymbolRelief(buf, W, H, 104, 16, '->');
    drawRadiantChest(buf, W, H, 112, 9);
    return buf;
}

// Puzle 2: [Salto 1x N1] + [Salto 3x N2] -> [Momia Petrificada] -> [Gema Sagrada]
function createMuralCh3P2() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    drawJumpOverMummy(buf, W, H, 2, '1x');
    drawSymbolRelief(buf, W, H, 36, 16, '+');
    drawJumpOverMummy(buf, W, H, 42, '3x');
    drawSymbolRelief(buf, W, H, 76, 16, '->');
    drawPetrifiedMummySection(buf, W, H, 84, 6);
    drawSymbolRelief(buf, W, H, 104, 16, '->');
    drawSacredGemSection(buf, W, H, 110, 8);
    return buf;
}

// -------------------------------------------------------------
// RECÁMARA 4
// -------------------------------------------------------------
// Puzle 1: [2 Cofres + Llave + 2x Salto] -> [I] -> [Cofre Radiante]
function createMuralCh4P1() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    blitWithRelief(buf, W, H, glyphSingleChest, 14, 14, 4, 9);
    drawSymbolRelief(buf, W, H, 22, 16, '+');
    blitWithRelief(buf, W, H, glyphAnkh, 12, 18, 28, 7);
    drawSymbolRelief(buf, W, H, 44, 16, '+');
    drawJumpOverMummy(buf, W, H, 49, '2x');
    drawSymbolRelief(buf, W, H, 84, 16, '->');
    drawStrokes(buf, W, H, 94, 9, 1);
    drawSymbolRelief(buf, W, H, 104, 16, '->');
    drawRadiantChest(buf, W, H, 112, 9);
    return buf;
}

// Puzle 2: [Salto 3x N1] + [Salto 1x N2] -> [Momia Petrificada] -> [Gema Sagrada]
function createMuralCh4P2() {
    const W = 128, H = 32;
    const buf = Buffer.alloc(W * H * 4);
    drawJumpOverMummy(buf, W, H, 2, '3x');
    drawSymbolRelief(buf, W, H, 36, 16, '+');
    drawJumpOverMummy(buf, W, H, 42, '1x');
    drawSymbolRelief(buf, W, H, 76, 16, '->');
    drawPetrifiedMummySection(buf, W, H, 84, 6);
    drawSymbolRelief(buf, W, H, 104, 16, '->');
    drawSacredGemSection(buf, W, H, 110, 8);
    return buf;
}

// Generar todos los archivos PNG
const murals = [
    { name: 'mural_puzzle_1.png', data: createMuralCh1P1() },
    { name: 'mural_ch1_p1.png', data: createMuralCh1P1() },
    { name: 'mural_puzzle_2.png', data: createMuralCh1P2() },
    { name: 'mural_ch1_p2.png', data: createMuralCh1P2() },
    { name: 'mural_ch2_p1.png', data: createMuralCh2P1() },
    { name: 'mural_ch2_p2.png', data: createMuralCh2P2() },
    { name: 'mural_ch3_p1.png', data: createMuralCh3P1() },
    { name: 'mural_ch3_p2.png', data: createMuralCh3P2() },
    { name: 'mural_ch4_p1.png', data: createMuralCh4P1() },
    { name: 'mural_ch4_p2.png', data: createMuralCh4P2() }
];

for (const m of murals) {
    fs.writeFileSync(path.join(assetsDir, m.name), writePNG(128, 32, m.data));
    console.log(`Generated: public/assets/${m.name}`);
}

console.log('Successfully generated all diegetic murals for Chambers 1, 2, 3, and 4!');
