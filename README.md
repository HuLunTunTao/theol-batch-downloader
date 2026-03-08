# College Resource Downloader

统一代码库，使用 esbuild 一次构建三种分发形态：

- 油猴脚本：`dist/userscript/cau-theol-batch-downloader.user.js`
- Chrome 插件：`dist/chrome`
- Firefox 插件：`dist/firefox`

## 项目结构

- `src/core/app.js`：主业务逻辑（扫描、树形勾选、ZIP/文件夹下载、UI）
- `src/config/file-mappings.js`：图标名与文件后缀、MIME 与后缀映射
- `src/config/sites.json`：启用站点列表（userscript 与 extension 复用）
- `src/config/sites.js`：站点匹配判断工具
- `src/entries/userscript.js`：油猴入口
- `src/entries/content-script.js`：浏览器插件 content script 入口
- `build/build.mjs`：统一打包脚本（自动生成 userscript header 与两个 manifest）

## 构建

```bash
npm install
npm run build
```

构建后目录：

- `dist/userscript/cau-theol-batch-downloader.user.js`
- `dist/chrome/manifest.json`
- `dist/chrome/content-script.js`
- `dist/firefox/manifest.json`
- `dist/firefox/content-script.js`

## 站点与映射维护

- 站点白名单只改 `src/config/sites.json`
- 图标/后缀映射只改 `src/config/file-mappings.js`

## 第三方依赖与合规

- 第三方许可证声明见 `THIRD_PARTY_NOTICES.md`。
