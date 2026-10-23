// Copies the MIT-licensed country-flag-icons SVGs into public/flags so any destination
// added in the CMS has a flag that renders on every OS (Windows has no flag emoji).
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';

const src = 'node_modules/country-flag-icons/3x2';
const dest = 'public/flags';
if (!existsSync(src)) process.exit(0);
mkdirSync(dest, { recursive: true });
if (readdirSync(dest).length >= readdirSync(src).length) process.exit(0);
cpSync(src, dest, { recursive: true });
console.log('flags copied');
