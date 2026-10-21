import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.resolve(__dirname, '../extension/src/assets/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  // Baloo 2 600
  { name: 'baloo2-600-devanagari.woff2', url: 'https://fonts.gstatic.com/s/baloo2/v23/wXKrE3kTposypRyd51ncANwr.woff2' },
  { name: 'baloo2-600-latin.woff2', url: 'https://fonts.gstatic.com/s/baloo2/v23/wXKrE3kTposypRyd51jcAA.woff2' },
  // Baloo 2 800
  { name: 'baloo2-800-devanagari.woff2', url: 'https://fonts.gstatic.com/s/baloo2/v23/wXKrE3kTposypRyd51ncANwr.woff2' },
  { name: 'baloo2-800-latin.woff2', url: 'https://fonts.gstatic.com/s/baloo2/v23/wXKrE3kTposypRyd51jcAA.woff2' },
  // Mukta 400
  { name: 'mukta-400-devanagari.woff2', url: 'https://fonts.gstatic.com/s/mukta/v17/iJWKBXyXfDDVXbnArXyi0A.woff2' },
  { name: 'mukta-400-latin.woff2', url: 'https://fonts.gstatic.com/s/mukta/v17/iJWKBXyXfDDVXbnBrXw.woff2' },
  // Mukta 500
  { name: 'mukta-500-devanagari.woff2', url: 'https://fonts.gstatic.com/s/mukta/v17/iJWHBXyXfDDVXbEyjmmc8WDm7Q.woff2' },
  { name: 'mukta-500-latin.woff2', url: 'https://fonts.gstatic.com/s/mukta/v17/iJWHBXyXfDDVXbEyjmmd8WA.woff2' },
  // Mukta 600
  { name: 'mukta-600-devanagari.woff2', url: 'https://fonts.gstatic.com/s/mukta/v17/iJWHBXyXfDDVXbEeiWmc8WDm7Q.woff2' },
  { name: 'mukta-600-latin.woff2', url: 'https://fonts.gstatic.com/s/mukta/v17/iJWHBXyXfDDVXbEeiWmd8WA.woff2' },
];

async function downloadAll() {
  for (const font of fonts) {
    const dest = path.join(fontsDir, font.name);
    console.log(`Downloading ${font.name}...`);
    const res = await fetch(font.url);
    if (!res.ok) throw new Error(`Failed to fetch ${font.url}: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    console.log(`Saved ${font.name} (${buffer.length} bytes)`);
  }
  console.log('All fonts downloaded successfully!');
}

downloadAll().catch(err => {
  console.error(err);
  process.exit(1);
});
