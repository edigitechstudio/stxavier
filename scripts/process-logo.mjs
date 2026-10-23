// One-off: turns the supplied white-background JPG logo into transparent PNG/WebP assets.
// Usage: node scripts/process-logo.mjs <source.jpg>
import sharp from 'sharp';

const src = process.argv[2];
if (!src) throw new Error('Pass the source logo path');

async function keyOutWhite(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    // Fully transparent near-white, soft edge for anti-aliased pixels.
    data[i + 3] = min > 245 ? 0 : min > 200 ? Math.round(((245 - min) / 45) * 255) : 255;
  }
  return sharp(data, { raw: info }).png();
}

const full = await (await keyOutWhite(src)).toBuffer();
const trimmed = await sharp(full).trim().toBuffer({ resolveWithObject: true });
await sharp(trimmed.data).png().toFile('public/brand/logo-full.png');

// Globe mark only: top ~62% of the trimmed logo (above the wordmark).
const { width, height } = trimmed.info;
const mark = await sharp(trimmed.data)
  .extract({ left: 0, top: 0, width, height: Math.round(height * 0.62) })
  .trim()
  .toBuffer();
await sharp(mark).resize({ height: 256 }).png().toFile('public/brand/logo-mark.png');
await sharp(mark).resize({ height: 256 }).webp({ quality: 90 }).toFile('public/brand/logo-mark.webp');

// App icons on white (the mark needs a light background to stay legible).
const square = async (size) =>
  sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
    .composite([{ input: await sharp(mark).resize({ width: Math.round(size * 0.84), height: Math.round(size * 0.84), fit: 'inside' }).toBuffer(), gravity: 'center' }])
    .png();
await (await square(512)).toFile('app/icon.png');
await (await square(180)).toFile('app/apple-icon.png');
console.log('trimmed', width, height);
