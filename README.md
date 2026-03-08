# College Resource Downloader
# THEOL 资源批量下载器

项目截图：


## 前言

## 支持的学校站点

- 中国农业大学在线教育综合平台（cau theol）: https://jx.cau.edu.cn/meol/

理论上支持所有使用与中国农业大学所使用的theol接近版本搭建的站点，欢迎添加更多站点支持（提issue/PR）

## 使用方式

- 油猴脚本（支持油猴Tampermonkey、脚本猫ScriptCat等脚本加载器）：在release中找到名字类似`theol-batch-downloader-${TAG_NAME}.user.js`的文件
- Chrome 插件（支持Chrome、Edge、夸克等基于Chroumin的浏览器）：在release中找到名字类似`theol-batch-downloader-chrome-${TAG_NAME}.zip`的文件并拖入浏览器安装
- Firefox 插件（支持Firefox、zen等基于Firefox的浏览器）：`theol-batch-downloader-firefox-vx.y.z.zip`

## 项目维护

如果你发现项目存在bug，或者有值得改进的地方，欢迎提issue或PR，建议使用简体中文

特别地，对于支持站点，请关注
`src/config/sites.json`。

如果在充分测试站点后认为你的站点可以使用本项目，请添加！

注意：由于学校资源平台往往需要学校内部网络环境和账号来访问，项目的其他维护者往往无法测试

因此请在充分测试后再提issue/PR

项目优先通过文件的图标来判别其类型，因此，如果您发现图标和映射关系存在问题并想做出改进，请关注：
`src/config/file-mappings.js`

## 项目结构

- `src/core/app.js`：应用编排入口（状态管理、初始化、流程串联）
- `src/core/context/resource-context.js`：页面上下文探测（主页面/iframe 资源列表定位）
- `src/core/tree/tree-model.js`：资源树扫描与树状态逻辑（递归构建、勾选联动、统计）
- `src/core/ui/style.js`：样式注入
- `src/core/ui/template.js`：面板模板
- `src/core/ui/panel.js`：面板渲染与交互
- `src/core/download/actions.js`：下载行为（ZIP/目录下载/大小预估）
- `src/core/shared/helpers.js`：通用工具函数（命名清洗、后缀推断、HTML 转义等）
- `src/core/shared/constants.js`：全局常量（按钮/弹层/样式 id）
- `src/config/file-mappings.js`：图标名与文件后缀、MIME 与后缀映射
- `src/config/sites.json`：启用站点列表（userscript 与 extension 复用）
- `src/config/sites.js`：站点匹配判断工具
- `src/entries/userscript.js`：油猴入口
- `src/entries/content-script.js`：浏览器插件 content script 入口
- `build/build.mjs`：统一打包脚本（自动生成 userscript header 与两个 manifest）

## 构建

在项目目录下执行
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



## 第三方依赖与合规

- 第三方许可证声明见 `THIRD_PARTY_NOTICES.md`。
