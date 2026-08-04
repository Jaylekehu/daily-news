# 每日热点日报

这是一个自动生成并自动部署的静态日报网站。

- 前端页面从 `public/data/latest.json` 读取最新日报
- GitHub Actions 每天北京时间 08:10 自动生成日报
- 日报标题、条目日期和归档文件名默认使用生成当天的北京时间日期
- 微博、知乎、百度和今日头条热榜作为可选候选源，不要求每天必须入选
- 生成完成后自动上传到 ECS 的 `/var/www/daily-news`
- `daily.2077.fun` 由 ECS 上的 Nginx 提供访问

## 当前架构

```text
GitHub Actions
  -> 采集新闻站候选 + 60s API 热榜候选
  -> 按核心主题过滤、跨平台去重
  -> scripts/generate-report.mjs
  -> scripts/validate-report.mjs
  -> 提交 latest.json / archive/*.json
  -> 上传静态文件到 ECS
  -> ECS Nginx 提供网站
```

## 必填 GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions` 添加：

- `DEEPSEEK_API_KEY`
- `ECS_HOST`
  例如 `101.201.246.225`
- `ECS_USER`
  例如 `root`
- `ECS_SSH_KEY`
  部署私钥全文
- `ECS_PORT`
  可选，默认 `22`

日报默认使用 `config/report-policy.json` 中的 `deepseek-v4-flash`。本地运行时仍可通过
`DEEPSEEK_MODEL` 环境变量临时覆盖。

## ECS 目录

- 站点目录：`/var/www/daily-news`
- Nginx 示例配置：`ops/nginx/daily-news.conf`

## 本地检查

```bash
npm install
npm run preview
```

预览服务默认运行在 `http://127.0.0.1:4173`。

提交前运行：

```bash
node --check app.js
node --check scripts/generate-report.mjs
node --check scripts/validate-report.mjs
node scripts/validate-report.mjs public/data/latest.json
```

单独检查当天是否有相关热榜候选：

```bash
npm run trends:check
```

热榜接口不可用或当天没有与核心主题相关的话题时，日报会自动回退为 0 条热榜新闻，不影响常规新闻生成。可通过 `DISABLE_HOT_TRENDS=1` 临时关闭热榜采集。

没有 DeepSeek Key 时，可用 fixture 模式验证生成逻辑：

```bash
USE_FIXTURE=1 REPORT_OUTPUT_DIR=.cache/fixture-data node scripts/generate-report.mjs
node scripts/validate-report.mjs .cache/fixture-data/latest.json
```

## 数据规则

- 每天 15 条热点
- 国际内容目标 5 条
- 至少 3 条国际内容需要与 AI / 大模型 / 算力 / 芯片 / AI 监管相关
- 热榜新闻最多 3 条，可以为 0 条；只选择与民生、互联网、大模型、数码、汽车、交通或财经直接相关的内容
- 明星、影视、综艺等泛娱乐热搜默认排除
- 每条必须包含来源名称和可访问 URL

热榜数据使用开源的 [60s API](https://github.com/vikiboss/60s)，当前启用微博、知乎、百度和今日头条四个平台。
