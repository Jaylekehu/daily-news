# 每日热点日报

这是一个可部署到 GitHub Pages 的每日热点看板。网站读取 `public/data/latest.json` 展示最新日报，GitHub Actions 会在每天北京时间 08:00 自动生成新数据并提交到仓库。

## 部署

1. 在 GitHub 创建个人仓库，建议命名为 `daily-news`。
2. 推送本目录所有文件到仓库默认分支。
3. 在仓库 `Settings -> Secrets and variables -> Actions` 添加：
   - `DEEPSEEK_API_KEY`：DeepSeek API Key。
   - `DEEPSEEK_MODEL`：可选，默认 `deepseek-v4-pro`。
4. 在 `Settings -> Pages` 中启用 GitHub Pages，来源选择默认分支根目录。
5. 自定义域名填写 `daily.2077.fun` 并开启 HTTPS。
6. 在 `2077.fun` 的 DNS 控制台添加：
   - 类型：`CNAME`
   - 主机记录：`daily`
   - 记录值：`<你的GitHub用户名>.github.io`

## 自动生成

GitHub Actions 工作流位于 `.github/workflows/daily-report.yml`：

- 每天 UTC 00:00 运行，也就是北京时间 08:00。
- 支持手动触发，并可传入 `report_date`。
- 生成脚本会写入：
  - `public/data/latest.json`
  - `public/data/archive/YYYY-MM-DD.json`

## 本地检查

```bash
node --check app.js
node --check scripts/generate-report.mjs
node --check scripts/validate-report.mjs
node scripts/validate-report.mjs public/data/latest.json
```

没有 DeepSeek Key 时，可以用 fixture 模式验证生成流程：

```bash
USE_FIXTURE=1 REPORT_OUTPUT_DIR=.cache/fixture-data node scripts/generate-report.mjs
node scripts/validate-report.mjs .cache/fixture-data/latest.json
```

## 数据规则

- 每天 15 条热点。
- 国际内容目标 5 条，且至少 3 条与 AI / 大模型 / 算力 / 芯片 / AI 监管相关。
- 每条必须包含来源名称和可访问 URL。
- 前端只展示标题、副标题、领域标签和弱化来源链接。
