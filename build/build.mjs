import { build } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const userscriptDir = path.join(distDir, 'userscript');
const chromeDir = path.join(distDir, 'chrome');
const firefoxDir = path.join(distDir, 'firefox');
const iconDir = path.join(rootDir, 'src/assets/icons');
const iconSizes = [16, 32, 48, 128];

const siteConfigPath = path.join(rootDir, 'src/config/sites.json');
const siteConfig = JSON.parse(await readFile(siteConfigPath, 'utf8'));
const matches = siteConfig.matches || [];

function makeUserscriptHeader() {
  const matchLines = matches.map(match => `// @match        ${match}`).join('\n');
  return `// ==UserScript==\n// @name         THEOL 课程资源批量下载\n// @namespace    theol-batch-downloader\n// @version      3.0.0\n// @description  递归扫描 THEOL 课程资源，树状勾选，支持下载 ZIP 或按原目录结构下载到本地文件夹\n${matchLines}\n// @grant        none\n// @run-at       document-end\n// ==/UserScript==\n\n`;
}

function makeChromeManifest() {
  const icons = Object.fromEntries(iconSizes.map(size => [size, `icons/icon-${size}.png`]));

  return {
    manifest_version: 3,
    name: 'THEOL 课程资源批量下载',
    version: '3.0.0',
    description: '递归扫描 THEOL 课程资源，树状勾选，支持下载 ZIP 或按原目录结构下载到本地文件夹',
    icons,
    action: {
      default_icon: icons
    },
    content_scripts: [
      {
        matches,
        js: ['content-script.js'],
        run_at: 'document_end'
      }
    ],
    background: {
      service_worker: 'background.js'
    },
    permissions: ['downloads'],
    host_permissions: matches
  };
}

function makeFirefoxManifest() {
  const chromeLikeManifest = makeChromeManifest();
  const { background, ...rest } = chromeLikeManifest;

  return {
    ...rest,
    background: {
      scripts: ['background.js']
    },
    browser_specific_settings: {
      gecko: {
        id: 'theol-batch-downloader@local',
        data_collection_permissions: {
          required: ['none']
        }
      }
    }
  };
}

const commonBuildOptions = {
  bundle: true,
  format: 'iife',
  target: ['chrome109', 'firefox115'],
  logLevel: 'silent',
  alias: {
    setimmediate: path.join(rootDir, 'src/vendor/setimmediate-safe.js'),
    stream: path.join(rootDir, 'src/vendor/stream-empty.cjs')
  }
};

await rm(distDir, { recursive: true, force: true });
await mkdir(userscriptDir, { recursive: true });
await mkdir(chromeDir, { recursive: true });
await mkdir(firefoxDir, { recursive: true });

await build({
  ...commonBuildOptions,
  entryPoints: [path.join(rootDir, 'src/entries/content-script.js')],
  outfile: path.join(chromeDir, 'content-script.js'),
  logLevel: 'info'
});

await build({
  ...commonBuildOptions,
  entryPoints: [path.join(rootDir, 'src/entries/background.js')],
  outfile: path.join(chromeDir, 'background.js'),
  logLevel: 'silent'
});

const chromeBundle = await readFile(path.join(chromeDir, 'content-script.js'), 'utf8');
await writeFile(path.join(firefoxDir, 'content-script.js'), chromeBundle, 'utf8');
const backgroundBundle = await readFile(path.join(chromeDir, 'background.js'), 'utf8');
await writeFile(path.join(firefoxDir, 'background.js'), backgroundBundle, 'utf8');


await writeFile(
  path.join(chromeDir, 'manifest.json'),
  `${JSON.stringify(makeChromeManifest(), null, 2)}\n`,
  'utf8'
);

await writeFile(
  path.join(firefoxDir, 'manifest.json'),
  `${JSON.stringify(makeFirefoxManifest(), null, 2)}\n`,
  'utf8'
);

await mkdir(path.join(chromeDir, 'icons'), { recursive: true });
await mkdir(path.join(firefoxDir, 'icons'), { recursive: true });
for (const size of iconSizes) {
  const fileName = `icon-${size}.png`;
  await copyFile(path.join(iconDir, fileName), path.join(chromeDir, 'icons', fileName));
  await copyFile(path.join(iconDir, fileName), path.join(firefoxDir, 'icons', fileName));
}

const userscriptResult = await build({
  ...commonBuildOptions,
  entryPoints: [path.join(rootDir, 'src/entries/userscript.js')],
  write: false,
  logLevel: 'silent',
  platform: 'browser'
});
const userscriptBody = userscriptResult.outputFiles[0].text;
await writeFile(
  path.join(userscriptDir, 'theol-batch-downloader.user.js'),
  `${makeUserscriptHeader()}${userscriptBody}\n`,
  'utf8'
);

console.log('Build done: dist/userscript, dist/chrome, dist/firefox');
