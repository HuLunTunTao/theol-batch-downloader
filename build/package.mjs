import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(rootDir, 'release-assets');

const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const fallbackTag = `v${pkg.version}`;
const tag = (process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || fallbackTag).trim();

function zipDir(sourceDir, outputZipPath) {
  // Zip from the source directory to avoid wrapping files under dist/chrome or dist/firefox.
  return execFileAsync('zip', ['-r', outputZipPath, '.'], { cwd: sourceDir });
}

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

const chromeZip = path.join(releaseDir, `theol-batch-downloader-chrome-${tag}.zip`);
const firefoxZip = path.join(releaseDir, `theol-batch-downloader-firefox-${tag}.zip`);
const firefoxXpi = path.join(releaseDir, `theol-batch-downloader-firefox-${tag}.xpi`);
const userscriptOut = path.join(releaseDir, `theol-batch-downloader-${tag}.user.js`);

await zipDir(path.join(distDir, 'chrome'), chromeZip);
await zipDir(path.join(distDir, 'firefox'), firefoxZip);
await cp(firefoxZip, firefoxXpi);
await cp(path.join(distDir, 'userscript', 'theol-batch-downloader.user.js'), userscriptOut);

console.log(`Packaged release assets into ${releaseDir}`);
