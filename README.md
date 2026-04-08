# 霍尔木兹减肥日历

一个适配 GitHub Pages 的静态前端项目，用月历标记 2026 年以来的战争日与停火日。首页默认展示当月，只在日历里做状态标识。

页面支持手动切换中文 / English，默认中文。语言文案位于根目录 `i18n/zh-CN.json` 和 `i18n/en-US.json`。

## 本地开发

```bash
npm install
npm run dev
```

## 日期配置

日期数据单独放在 `public/data/war-days.json`。

当前格式：

```json
{
  "updatedAt": "2026-04-08",
  "events": [
    { "date": "2026-02-28", "status": "war" },
    { "date": "2026-04-08", "status": "ceasefire" }
  ]
}
```

`status` 可选值：

- `war`：战争日，默认文案为“恢复正常饮食”
- `ceasefire`：停火日，默认文案为“16+8 / 轻食”

只需要维护 `date` 和 `status`。为了兼容旧数据，页面仍能读取历史上的 `clash` 和 `talks`，并自动转换为新的两种状态。

## 构建

```bash
npm run build
```

产物位于 `dist/`。

## GitHub Pages 部署

这个项目已经包含工作流文件：`.github/workflows/deploy.yml`。

### 仓库设置

1. 把代码推到 GitHub 仓库。
2. 进入仓库 `Settings` -> `Pages`。
3. 在 `Build and deployment` 里选择 `Source: GitHub Actions`。
4. 确认默认分支是 `main`；如果不是，请同步修改 `.github/workflows/deploy.yml` 里的分支名。

### 触发部署

每次 push 到 `main`，GitHub Actions 会自动：

1. 安装依赖
2. 运行 `npm run build`
3. 把 `dist/` 部署到 GitHub Pages

### 为什么这样配置

- 使用 `Vite` 构建，输出纯静态文件
- `vite.config.js` 里配置了 `base: './'`，仓库名变化时也能稳定加载资源
- 日期配置走 `public/data/war-days.json`，以后只要改 JSON 并重新部署即可
