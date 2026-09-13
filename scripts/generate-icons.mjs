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
 * Modern geometric emblem for PisoPro:
 * - Background: PisoPro Navy (#31405F)
 * - Motif: Triad of 3 harmonious rounded living units / flatmates (Jorge, Samuel, David)
 *   interconnected into a unified modern geometric home/community symbol.
 * - Colors: Navy (#31405F), Ocean (#194F6B), Petrol (#094152), Crisp White (#FFFFFF)
 */
function createSvg(isMaskable = false) {
  // For maskable icon, Android applies a circular or squircle mask that crops outer ~20%.
  // So the content scale is reduced to 75% to stay safely within the safe zone.
  const scale = isMaskable ? 0.75 : 0.88;
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
    <linearGradient id="accentGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <linearGradient id="accentGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.28" />
    </filter>
  </defs>

  <!-- Solid Clean Background -->
  <rect width="512" height="512" rx="${isMaskable ? 0 : 112}" fill="url(#bgGrad)" />

  <!-- Geometric PisoPro Living Triad Emblem -->
  <g transform="translate(${cx}, ${cy}) scale(${scale}) translate(-${cx}, -${cy})" filter="url(#softGlow)">
    <!-- Base Outer Interlocking Living Ring -->
    <path
      d="M 256,120
         C 285,120 310,135 328,158
         C 370,165 402,200 402,244
         C 402,274 388,301 366,318
         C 366,356 338,388 300,396
         C 287,399 272,400 256,400
         C 240,400 225,399 212,396
         C 174,388 146,356 146,318
         C 124,301 110,274 110,244
         C 110,200 142,165 184,158
         C 202,135 227,120 256,120 Z"
      fill="none"
      stroke="#194F6B"
      stroke-width="12"
      opacity="0.35"
    />

    <!-- Interconnected Flatmates Geometry: 3 harmonious rounded nodes + central shared hearth -->
    <!-- Top Roommate / Admin Node (Jorge) -->
    <circle cx="256" cy="180" r="44" fill="url(#accentGrad1)" />
    
    <!-- Left Roommate Node (Samuel) -->
    <circle cx="188" cy="298" r="44" fill="url(#accentGrad1)" />
    
    <!-- Right Roommate Node (David) -->
    <circle cx="324" cy="298" r="44" fill="url(#accentGrad1)" />

    <!-- Connecting Fluid Rounded Living Links -->
    <path
      d="M 256,180 L 188,298
         M 188,298 L 324,298
         M 324,298 L 256,180"
      stroke="url(#accentGrad1)"
      stroke-width="32"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Central Living Space Portal / Shared Core -->
    <circle cx="256" cy="260" r="28" fill="#31405F" />
    <circle cx="256" cy="260" r="16" fill="#FFFFFF" />

    <!-- Top Crown Arc / Roofline Harmony Accent -->
    <path
      d="M 206,124 C 238,106 274,106 306,124"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="10"
      stroke-linecap="round"
      opacity="0.8"
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
