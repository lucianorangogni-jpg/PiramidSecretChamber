import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('public/jeroglificosEgipcios_2.png');

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

const cols = [
    { name: 'Col 1', x1: 44, x2: 207 },
    { name: 'Col 2', x1: 219, x2: 381 },
    { name: 'Col 3', x1: 393, x2: 556 },
    { name: 'Col 4', x1: 568, x2: 731 },
    { name: 'Col 5', x1: 743, x2: 906 },
    { name: 'Col 6', x1: 918, x2: 1081 },
    { name: 'Col 7', x1: 1093, x2: 1256 }
];

for (const col of cols) {
    const glyphs = [];
    let inGlyph = false;
    let startY = 0;
    
    for (let y = 35; y < 1265; y++) {
        let darkPixels = 0;
        for (let x = col.x1; x <= col.x2; x++) {
            const idx = (y * width + x) * 4;
            const b = (raw[idx] + raw[idx+1] + raw[idx+2]) / 3;
            if (b < 80) darkPixels++;
        }
        
        if (darkPixels >= 5) {
            if (!inGlyph) {
                inGlyph = true;
                startY = y;
            }
        } else {
            if (inGlyph) {
                inGlyph = false;
                if (y - startY >= 10) {
                    glyphs.push({ y1: startY, y2: y, h: y - startY });
                }
            }
        }
    }
    console.log(col.name, 'found', glyphs.length, 'glyphs:');
    for (const g of glyphs) {
        // Also find minX and maxX
        let minX = col.x2, maxX = col.x1;
        for (let gy = g.y1; gy <= g.y2; gy++) {
            for (let gx = col.x1; gx <= col.x2; gx++) {
                const idx = (gy * width + gx) * 4;
                const b = (raw[idx] + raw[idx+1] + raw[idx+2]) / 3;
                if (b < 80) {
                    if (gx < minX) minX = gx;
                    if (gx > maxX) maxX = gx;
                }
            }
        }
        console.log(`  y: ${g.y1}..${g.y2} (h: ${g.h}), x: ${minX}..${maxX} (w: ${maxX - minX + 1})`);
    }
}

