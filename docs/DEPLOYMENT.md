# Deployment

站点把检查、PR 预览和正式发布分成三条独立路径：

- `CI`：每个 PR 和 `main` commit 都执行内容、类型、数据和静态构建检查。
- `PR Preview`：CI 通过后，把该 PR 的当前 commit 发布到隔离路径；不会覆盖正式站点，也不接入正式统计。
- `Deploy to GitHub Pages`：只允许手动运行，需要明确填写 ref 并确认生产发布。

## 本地预览

环境要求：Node.js 22.12 或更高版本、pnpm 10.12.3。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm dev --host 0.0.0.0 --port 4321
```

浏览器访问 `http://127.0.0.1:4321/zh/`。如果端口已被占用，可以把 `4321` 换成其他端口。

## 静态生产预览

根路径部署：

```sh
SITE_URL=http://127.0.0.1:4321 SITE_BASE=/ pnpm build
pnpm preview --host 0.0.0.0 --port 4321
```

部署到子路径时，同时设置 `SITE_BASE`，并保留开头和结尾的斜杠。例如：

```sh
SITE_URL=https://example.com SITE_BASE=/lens-frontier/ pnpm build
```

构建产物位于 `dist/`。Nginx、对象存储或其他静态服务器应把该目录发布到与 `SITE_BASE` 一致的路径。

## 生产统计

只有需要正式阅读量和 GA4 时才配置以下变量；开发预览可全部省略。

```txt
PUBLIC_GA_MEASUREMENT_ID=
PUBLIC_PAGEVIEW_ENDPOINT=
PUBLIC_PAGEVIEW_COUNT_ENDPOINT=
PUBLIC_PAGEVIEW_SITE_ID=lens-frontier
```

GitHub Pages 的生产与 PR 预览流程已经分别定义在 `.github/workflows/deploy.yml` 和 `.github/workflows/pr-preview.yml`。

## 全面升级但暂不上线

不要直接在 `main` 上开发。建议按以下顺序提交：

```sh
git fetch origin
git switch main
git pull --ff-only
git switch -c site/full-upgrade

# 完成改造并分阶段提交
pnpm check
git push -u <your-fork> site/full-upgrade
```

然后从个人 fork 的 `site/full-upgrade` 向上游 `main` 创建 PR。该 PR 会执行：

1. Astro / TypeScript / workflow 语法检查。
2. 内容、Bench 数据、敏感信息、资产和图片检查。
3. 静态构建、所有站内链接、文章路由、旧链接、RSS 和阅读量 ID 回归检查。
4. 生成 `pr-<编号>/<commit short hash>/` 隔离预览并更新 PR comment。

PR 可以持续更新和 review；只要不手动运行正式部署 workflow，正式站点不会被替换。预览本身是公开的 commit 隔离 URL，因此只能提交已获授权公开的内容和链接。

## 正式发布

1. 在 GitHub Actions 打开 `Deploy to GitHub Pages`。
2. 点击 `Run workflow`。
3. 在 `ref` 填入通过 review 的 branch、tag 或 commit SHA。重要发布建议使用精确 commit SHA。
4. 勾选 `confirm_production`。
5. 等待同一套完整检查通过后，workflow 才会写入 `gh-pages` 根目录。

推荐在 GitHub 仓库 Settings → Environments 中为 `production` 增加 required reviewers。这样即使有人误触 workflow，也需要第二位维护者批准。

如果完全不希望生成公开预览 URL，请不要启用 `PR Preview` workflow；reviewer 在 PR branch 本地运行 `SITE_BASE=/ pnpm build && pnpm preview` 即可。`CI` 中的 `preview-dist` artifact 仍用于 commit 隔离预览发布和构建审计。

## PR 预览边界

- PR 预览地址由 CI 根据仓库名生成；项目仓库位于 `/<repo>/pr-preview/.../`，组织主页仓库位于 `/pr-preview/.../`。以 PR bot comment 为准。
- 每个 commit 都有独立快照，旧快照保留到 PR 关闭。
- PR 关闭后 cleanup workflow 删除整个 PR 预览目录。
- 预览不配置 GA4 和 first-party pageview，避免污染正式阅读量。
- 预览部署只写 `gh-pages/pr-preview/`；正式发布只在手动确认后写站点根目录。

## 公开仓库内容检查

`pnpm check:sensitive` 只包含适合公开的结构化通用规则，例如常见凭证格式、私钥、本机用户路径和疑似非公开站点的通用地址结构。不要把真实非公开域名、项目代号、表单名称、工作流程或消息原句加入仓库内的扫描脚本；否则规则本身也会成为公开信息。

需要精确匹配的组织专有内容，应配置在 GitHub Secret Scanning 的组织或仓库自定义规则中，或者在仓库之外的发布前检查中维护。公开 CI 是最后一道通用防线，不能代替提交者和 reviewer 对内容公开范围的确认。

## 仓库改名或迁移

现有仓库适合继续承载升级 PR，因为这样能够保留文章、PR 历史和贡献流程。大型数据集、运行日志、模型输出和评测环境应放在独立的公开数据仓库或对象存储中，本站只保留结构化摘要、公开小型结果和稳定引用。

升级 PR 通过并合入后，再执行仓库改名。workflow 会根据 `GITHUB_REPOSITORY` 自动计算 Pages base 和预览 URL，改名后仍需检查：

- CI、正式部署和 PR Preview 计算出的根路径。
- `src/lib/site.ts`、README、贡献指南和外部仓库链接。
- GitHub Pages 设置、自定义域名、旧 `/blog/` 路径兼容和阅读量 API 的允许来源。

当仓库名变为 `<owner>.github.io` 时，构建流程会自动把站点切到根路径，并在 `dist/blog/` 下为原项目站页面生成兼容跳转。已经存在的 `/blog/` 内容入口不会被覆盖，旧文章地址则会跳转到新的规范地址。建议至少保留这一兼容层一个完整发布周期，再根据访问日志决定是否移除。

仓库改名会改变 GitHub Pages 项目路径。不要在升级 PR 尚未通过预览时提前改名。
