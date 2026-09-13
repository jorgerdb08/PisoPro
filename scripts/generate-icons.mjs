import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public/icons");
const PUBLIC_DIR = path.resolve("public");
const APP_DIR = path.resolve("src/app");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

/**
 * Modern minimalist house emblem for PisoPro:
 * - Background: PisoPro Navy (#31405F) gradient squircle
 * - Motif: Modern Scandinavian / Nordic minimalist house with clean pitched roofline,
 *   warm arched doorway, and circular loft window with subtle hearth glow.
 * - Colors: Navy (#31405F), Slate (#243048), Crisp White/Snow (#FFFFFF - #F1F5F9), Cyan accent (#38BDF8)
 */
function createSvg(isMaskable = false) {
  // Safe zone scaling: maskable needs to fit inside the Android circular cut
  const scale = isMaskable ? 0.74 : 0.88;
  const cx = 256;
  const cy = 256;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38496D" />
      <stop offset="50%" stop-color="#31405F" />
      <stop offset="100%" stop-color="#243048" />
    </linearGradient>
    <linearGradient id="houseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.32" />
    </filter>
  </defs>

  <!-- Clean Background Squircle (Full bleed for maskable) -->
  <rect width="512" height="512" rx="${isMaskable ? 0 : 112}" fill="url(#bgGrad)" />

  <!-- Unmistakable Minimalist House (Casa) -->
  <g transform="translate(${cx}, ${cy}) scale(${scale}) translate(-${cx}, -${cy})" filter="url(#softGlow)">
    <!-- Chimney on roof -->
    <path
      d="M 320,192 L 320,138 C 320,132 324,128 330,128 L 352,128 C 358,128 362,132 362,138 L 362,228 Z"
      fill="url(#houseGrad)"
    />

    <!-- Main House: Pitched Roof with Eaves and Solid Walls -->
    <path
      d="M 242,132
         C 250,124 262,124 270,132
         L 394,234
         C 402,241 400,250 390,250
         L 358,250
         L 358,374
         C 358,384 350,392 340,392
         L 172,392
         C 162,392 154,384 154,374
         L 154,250
         L 122,250
         C 112,250 110,241 118,234
         Z"
      fill="url(#houseGrad)"
    />

    <!-- 4-Pane Modern Loft Window -->
    <rect x="230" y="184" width="22" height="22" rx="4" fill="url(#bgGrad)" />
    <rect x="260" y="184" width="22" height="22" rx="4" fill="url(#bgGrad)" />
    <rect x="230" y="214" width="22" height="22" rx="4" fill="url(#bgGrad)" />
    <rect x="260" y="214" width="22" height="22" rx="4" fill="url(#bgGrad)" />

    <!-- Arched Doorway -->
    <path
      d="M 224,392
         L 224,320
         C 224,302 238,288 256,288
         C 274,288 288,302 288,320
         L 288,392
         Z"
      fill="url(#bgGrad)"
    />
  </g>
</svg>
  `.trim();
}

async function main() {
  console.log("Generating PisoPro modern icon assets...");

  const standardSvg = createSvg(false);
  const maskableSvg = createSvg(true);

  // Write SVG files for web and direct crisp usage
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.svg"), standardSvg, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "icon.svg"), standardSvg, "utf8");

  const sizes = [16, 32, 48, 96, 144, 192, 512];

  for (const size of sizes) {
    const outPng = path.join(OUT_DIR, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(standardSvg))
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPng);
    console.log(`Generated: ${outPng}`);
  }

  // Maskable 512x512
  const maskablePng = path.join(OUT_DIR, "icon-maskable-512x512.png");
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(maskablePng);
  console.log(`Generated: ${maskablePng}`);

  // Apple Touch Icon (180x180)
  const appleTouchIcon = path.join(PUBLIC_DIR, "apple-touch-icon.png");
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(appleTouchIcon);
  console.log(`Generated: ${appleTouchIcon}`);

  // Apple Touch Icon in icons folder too
  const appleTouchIconInIcons = path.join(OUT_DIR, "apple-touch-icon.png");
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(appleTouchIconInIcons);

  // Favicon 32x32 PNG as fallback / favicon.ico
  const fav32Png = await sharp(Buffer.from(standardSvg)).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), fav32Png);
  fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), fav32Png);
  console.log("Updated favicon.ico in /public and /src/app");

  console.log("All PisoPro icon assets generated successfully!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
