import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release-assets');
const stagingDir = path.join(releaseDir, 'source-package');

const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const fallbackTag = `v${pkg.version}`;
const tag = (process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || fallbackTag).trim();

const sourceZip = path.join(releaseDir, `theol-batch-downloader-source-${tag}.zip`);
const includePaths = [
  'src',
  'build',
  'docs/privacy.md',
  'docs/store-submission.md',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'package.json',
  'package-lock.json'
];

function zipDir(sourceDir, outputZipPath) {
  return execFileAsync('zip', ['-r', outputZipPath, '.'], { cwd: sourceDir });
}

await mkdir(releaseDir, { recursive: true });
await rm(stagingDir, { recursive: true, force: true });
await rm(sourceZip, { force: true });
await mkdir(stagingDir, { recursive: true });

for (const relativePath of includePaths) {
  const sourcePath = path.join(rootDir, relativePath);
  const targetPath = path.join(stagingDir, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
}

await zipDir(stagingDir, sourceZip);
await rm(stagingDir, { recursive: true, force: true });

console.log(`Packaged source archive into ${sourceZip}`);
