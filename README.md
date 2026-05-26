# 每日热点日报

这是一个自动生成并自动部署的静态日报网站。

- 前端页面从 `public/data/latest.json` 读取最新日报
- GitHub Actions 每天北京时间 08:00 自动生成日报
- 生成完成后自动上传到 ECS 的 `/var/www/daily-news`
- `daily.2077.fun` 由 ECS 上的 Nginx 提供访问

## 当前架构

```text
GitHub Actions
  -> scripts/generate-report.mjs
  -> scripts/validate-report.mjs
  -> 提交 latest.json / archive/*.json
  -> 上传静态文件到 ECS
  -> ECS Nginx 提供网站
```

## 必填 GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions` 添加：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`
  默认可填 `deepseek-v4-pro`
- `ECS_HOST`
  例如 `101.201.246.225`
- `ECS_USER`
  例如 `root`
- `ECS_SSH_KEY`
  部署私钥全文
- `ECS_PORT`
  可选，默认 `22`

## ECS 目录

- 站点目录：`/var/www/daily-news`
- Nginx 示例配置：`ops/nginx/daily-news.conf`

## 本地检查

```bash
node --check app.js
node --check scripts/generate-report.mjs
node --check scripts/validate-report.mjs
node scripts/validate-report.mjs public/data/latest.json
```

没有 DeepSeek Key 时，可用 fixture 模式验证生成逻辑：

```bash
USE_FIXTURE=1 REPORT_OUTPUT_DIR=.cache/fixture-data node scripts/generate-report.mjs
node scripts/validate-report.mjs .cache/fixture-data/latest.json
```

## 数据规则

- 每天 15 条热点
- 国际内容目标 5 条
- 至少 3 条国际内容需要与 AI / 大模型 / 算力 / 芯片 / AI 监管相关
- 每条必须包含来源名称和可访问 URL
