import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk("IHDR", ihdrData);
  const idatChunk = makeChunk("IDAT", deflated);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawPisoProIcon(x, y, w, h, isMaskable = false) {
  // Center coordinates normalized to [-1, 1]
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  // Background: Rich Emerald Gradient (#059669 to #047857)
  const bgGrad = Math.max(0, Math.min(1, (ny + 1) / 2));
  let r = Math.round(5 + bgGrad * (4 - 5));
  let g = Math.round(150 + bgGrad * (120 - 150));
  let b = Math.round(105 + bgGrad * (87 - 105));
  let a = 255;

  if (!isMaskable) {
    // Rounded squircle mask
    const cornerD = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
    if (cornerD > 0.95) {
      return [0, 0, 0, 0];
    }
  }

  // Draw modern house + checkmark motif in center (white)
  // Scale down for safe area if maskable
  const scale = isMaskable ? 0.7 : 0.85;
  const sx = nx / scale;
  const sy = ny / scale;

  // Roof triangle: sy from -0.55 to -0.1, |sx| <= (sy + 0.55) * 1.5
  const isRoof = sy >= -0.55 && sy <= -0.1 && Math.abs(sx) <= (sy + 0.55) * 1.4;
  // House body: sx in [-0.45, 0.45], sy in [-0.1, 0.5]
  const isBody = sy >= -0.1 && sy <= 0.48 && Math.abs(sx) <= 0.44;

  if (isRoof || isBody) {
    // White house base
    r = 255;
    g = 255;
    b = 255;

    // Cutout door: sx in [-0.14, 0.14], sy in [0.15, 0.48]
    if (Math.abs(sx) <= 0.14 && sy >= 0.15 && sy <= 0.48) {
      r = 5;
      g = 150;
      b = 105;
    }
    // Cutout left window: sx in [-0.35, -0.2], sy in [0.05, 0.22]
    if (sx >= -0.36 && sx <= -0.2 && sy >= 0.05 && sy <= 0.22) {
      r = 5;
      g = 150;
      b = 105;
    }
    // Cutout right window: sx in [0.2, 0.35], sy in [0.05, 0.22]
    if (sx >= 0.2 && sx <= 0.36 && sy >= 0.05 && sy <= 0.22) {
      r = 5;
      g = 150;
      b = 105;
    }
  }

  return [r, g, b, a];
}

const iconsDir = path.resolve("public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log("Generating 192x192 icon...");
const icon192 = createPng(192, 192, (x, y, w, h) => drawPisoProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), icon192);

console.log("Generating 512x512 icon...");
const icon512 = createPng(512, 512, (x, y, w, h) => drawPisoProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), icon512);

console.log("Generating maskable 512x512 icon...");
const iconMaskable = createPng(512, 512, (x, y, w, h) =>
  drawPisoProIcon(x, y, w, h, true)
);
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512x512.png"), iconMaskable);

console.log("All icons generated successfully!");
