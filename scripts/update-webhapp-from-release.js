/* eslint-disable @typescript-eslint/no-var-requires */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/update-webhapp-from-release.js <version>');
  console.error('Example: node scripts/update-webhapp-from-release.js 0.14.0');
  process.exit(1);
}

const url = `https://github.com/GeekGene/mewsfeed/releases/download/v${version}/mewsfeed.webhapp`;
const tmpPath = path.join(__dirname, '..', 'pouch', 'mewsfeed.webhapp');

console.log(`Downloading webhapp from ${url}...`);

childProcess.execSync(`curl -f -L --output "${tmpPath}" "${url}"`, { stdio: 'inherit' });

const fileBytes = fs.readFileSync(tmpPath);
const hasher = crypto.createHash('sha256');
hasher.update(fileBytes);
const sha256 = hasher.digest('hex');

console.log(`SHA256: ${sha256}`);
console.log(`File size: ${(fileBytes.length / 1024 / 1024).toFixed(2)} MB`);

// Update kangaroo.config.ts
const configPath = path.join(__dirname, '..', 'kangaroo.config.ts');
let config = fs.readFileSync(configPath, 'utf-8');

// Update webhapp url
config = config.replace(
  /url: '.*mewsfeed\.webhapp'/,
  `url: '${url}'`
);

// Update webhapp sha256
config = config.replace(
  /sha256: '[a-fA-F0-9]+'/,
  `sha256: '${sha256}'`
);

// Update version
config = config.replace(
  /version: '[^']+'/,
  `version: '${version}'`
);

fs.writeFileSync(configPath, config);

// Clean up downloaded file (fetch-webhapp.js will re-download during setup)
fs.unlinkSync(tmpPath);

console.log(`\nUpdated kangaroo.config.ts:`);
console.log(`  version: '${version}'`);
console.log(`  webhapp.url: '${url}'`);
console.log(`  webhapp.sha256: '${sha256}'`);
console.log(`\nNext steps:`);
console.log(`  1. Commit the config change`);
console.log(`  2. Push to release branch to trigger desktop builds`);
