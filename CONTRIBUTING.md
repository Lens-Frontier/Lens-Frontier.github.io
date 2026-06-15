# Lens Frontier Blog 投稿规范

Lens Frontier Blog 默认通过 fork + Pull Request 投稿。维护者可以为紧急修复直接提交，但论文阅读分享、benchmark 观察和观点文章都走 fork PR，这样方便讨论、预览和留下修改记录。

## 内容要求

Lens Frontier 希望长期沉淀高质量的论文阅读分享、benchmark 观察和观点文章。更新频率不是第一目标；我们更在意内容是否值得被后来的人重新打开，是否能帮助读者看清一个问题、一个评测、一篇论文或一个判断的边界。

投稿时请尽量满足这些要求：

- 有明确问题意识：文章最好围绕一个具体问题、现象、疑问或判断展开，而不是简单复述论文摘要、榜单结果或新闻。
- 有证据和上下文：重要判断需要说明来源、实验设置、数据口径、benchmark 版本、适用范围和可能的偏差。
- 有作者自己的思考：观点可以浅，但不要只搬运结论；请写出你认为值得关注、值得怀疑或值得继续讨论的地方。
- 有克制的表达：避免标题党、过度拔高、没有依据的断言，以及把单个 benchmark 结果直接扩展成宽泛结论。
- 有审美和可读性：结构清楚，段落有层次，图表和截图确实服务于论点；不为了堆材料而堆材料。
- 有长期价值：优先发布能沉淀方法、经验、争议、失败案例或判断框架的内容。暂时说不完整也可以，但要诚实标注不确定性。

这个 blog 的影响力应该来自持续稳定的内容水位和判断品味，而不是追热点的速度。维护者可以要求作者补充证据、收窄结论、重写标题或暂缓合入；这不是对作者的否定，而是为了保护整个站点的质量和可信度。

## 投稿流程

1. Fork `Lens-Frontier/blog` 到自己的 GitHub 账号下。
2. 在自己的 fork 里从 `main` 拉新分支，分支名建议使用 `post/<slug>`。
3. 在对应内容目录中新建 Markdown：
   - `src/content/papers/<slug>.md`
   - `src/content/benchmarks/<slug>.md`
   - `src/content/opinions/<slug>.md`
4. 在 frontmatter 里填写 `lang: "zh"` 或 `lang: "en"`。允许单语发布，不要求同一篇文章同时提供中英文。
5. 如需文章图片，在 `src/assets/posts/<collection>/<slug>/` 创建同名资源目录；只保留这一份，不要同时放到 `public/assets/posts/`。
6. 作者头像默认可由 GitHub ID 自动读取；如需自定义头像，再放到 `public/assets/authors/`。
7. 本地运行 `pnpm check`，确认语法、内容、资产、构建和产物检查通过。
8. 从 fork 分支向 `Lens-Frontier/blog` 提交 PR，填写 PR 模板。

如果使用 Codex、Claude Code 或其他 coding agent 辅助投稿，请先让 agent 读取本仓库的 `.agents/skills/lens-frontier-post/SKILL.md`，按统一的文章模板、作者信息、资产目录和检查流程操作。Agent 也默认走 fork PR：从个人 fork 新建分支，向 `Lens-Frontier/blog` 开新的 PR；即使维护者有写权限，也不要让 agent 直接把普通文章改动推到主仓库。

PR 标题建议使用能直接说明变更范围的格式：

- 文章：`post: <文章标题>`
- 文档：`docs: <修改内容>`
- 站点或样式：`site: <修改内容>`
- CI 或工具：`chore: <修改内容>`

每个 PR 都会自动触发 GitHub Actions CI。CI 分成 `syntax` 和 `check` 两个 job：`syntax` 负责 workflow / Astro / TypeScript / Worker 语法，`check` 负责 Markdown、内容规范、中文引号配对、资产硬限制、analytics smoke、生产构建和构建产物检查。中文引号开闭错误会阻塞 CI；图片推荐大小、宽度和格式会在 CI 日志里提示，它们用于提醒优化，不作为硬性阻断。两个 job 都通过后，PR 才适合进入 review/merge。

CI 成功后，机器人会在 PR comment 中写入预览链接。预览页和正式站点使用同一套 Astro 构建，只是 URL base 不同，会展示 PR 当前 commit 的完整站点，包括首页、文章页、Timeline、Tags、About 和 RSS。预览地址格式为：

```txt
https://lens-frontier.github.io/blog/pr-preview/pr-<PR 编号>/<commit short hash>/
```

PR 更新时会生成新的 commit 快照链接，并更新同一条 bot comment。

更新已有 PR 或继续使用旧分支前，请先确认 PR 仍然处于 open 状态，并且 PR head 仍指向当前分支。可以用：

```sh
gh pr view <PR 编号> --json state,headRefName,baseRefName,headRefOid
```

如果 PR 已经 merged 或 closed，不要继续向原分支追加提交；从最新 `main` 新建分支并提交新的 PR。已关闭 PR 的预览会被回收，继续推原分支也不会更新那个 PR 的 CI、预览和 review 状态。

## 预览与回收

- 每次 PR 更新都会重新跑 CI。
- CI 成功后会上传构建产物，并由 `PR Preview` workflow 发布到 `gh-pages/pr-preview/pr-<PR 编号>/<commit short hash>/`。
- Bot comment 只保留一条，会更新到最新 commit 的预览链接。
- 旧 commit 的预览快照会保留在同一个 PR 目录下，方便需要时回看。
- PR 关闭后，`PR Preview Cleanup` workflow 会删除整个 `pr-preview/pr-<PR 编号>` 目录，并更新 bot comment 说明预览已回收。

## 统计和隐私

站点统计包含 GA4 默认 pageview、少量 `lf_` 自定义事件，以及 first-party 文章阅读量。公开展示的阅读量按 pageview 计数，刷新会增加一次；后台会另存按天去重的匿名访客事件，用于趋势分析。

统计事件只包含语言、页面类型、文章 collection/id、滚动百分比、链接类型、站内 path 或外链域名等低风险字段。不要把统计埋点扩展到正文内容、完整外链 URL、读者账号标识或其他个人资料字段。

公开阅读量不是严肃审计数据，可能被异常刷新或机器人流量影响。需要更强防刷时，优先在 Cloudflare Worker 前配置 WAF / rate limiting。

## 文件命名

文章文件名就是 URL slug。统一使用小写 kebab-case：

```txt
good: swe-bench-verified.md
bad: SWE_bench Verified.md
```

如果文章文件是：

```txt
src/content/papers/swe-bench-verified.md
```

文章图片目录就是：

```txt
src/assets/posts/papers/swe-bench-verified/
```

## Markdown Frontmatter

所有文章都需要包含 `title`、`date`、`summary`、`authors`、`tags`。`authors` 是本站作者，不是论文原作者；每个作者至少填写 `id`、`name` 或 `github` 之一。

`updated` 是可选字段。小的错别字、排版和链接修复不一定需要写；如果修订影响事实口径、判断边界或结论，请加上：

```yaml
updated: 2026-05-23
```

同时建议在正文末尾增加简短的“修订说明”，让读者知道这次更新改变了什么。

`lang` 用来决定文章进入哪个语言路由：

- `lang: "zh"`：文章生成在 `/zh/<collection>/<slug>/`
- `lang: "en"`：文章生成在 `/en/<collection>/<slug>/`
- 不强制同步翻译。中文文章可以只发中文，英文文章也可以只发英文。
- 如果之后补翻译，建议两篇文章使用相同的 `translationKey`。站点的中英切换会优先跳到同一篇文章的译文；如果目标语言没有译文，则回到目标语言的对应栏目页。

论文阅读分享示例：

```md
---
title: "SWE-bench Verified"
lang: "zh"
date: 2026-05-19
summary: "一句话说明这篇分享的重点。"
authors:
  - name: "Your Name"
    github: "your-github-id"
paperAuthors: ["Author A", "Author B"]
venue: "ICLR 2026"
paperUrl: "https://arxiv.org/abs/xxxx.xxxxx"
codeUrl: "https://github.com/example/repo"
benchmarks: ["SWE-bench"]
tasks: ["coding-agent"]
tags: ["evaluation", "coding-agent"]
status: "read"
---
```

Benchmark 观察示例：

```md
---
title: "Benchmark Name"
lang: "zh"
date: 2026-05-19
summary: "说明这个 benchmark 测什么，以及主要风险。"
authors:
  - name: "Your Name"
    github: "your-github-id"
area: "software engineering"
metric: "% resolved"
version: "v1"
risk: "medium"
status: "active"
tags: ["benchmark", "evaluation"]
---
```

观点文章示例：

```md
---
title: "Benchmark 会变老，但不是突然失效"
lang: "zh"
date: 2026-05-19
summary: "一句话概括观点。"
authors:
  - name: "Your Name"
    github: "your-github-id"
stance: "benchmarks need versioned trust"
tags: ["benchmark-design", "evaluation"]
---
```

## 文章展示

列表页和文章页都会展示本站作者信息：

- 如果作者已经在 `src/data/authors.ts` 里登记，可以只写 `id`。
- `id` 必须使用小写 kebab-case；写错或未登记会导致 CI 构建失败。
- `id` 引用的作者资料可以被当前文章里的 `name`、`github`、`avatar`、`url` 覆盖。
- `name` 会作为作者显示名。
- 如果只填写 `github`，站点会用 `@github-id` 作为显示名，并链接到 GitHub profile。
- 如果同时填写 `name` 和 `github`，站点会显示 `name`，并在下方显示 `@github-id`。
- `avatar` 可选。填写后优先使用上传头像；不填写但有 `github` 时，站点会自动使用 GitHub 头像：`https://github.com/<github>.png?size=96`。
- 多作者文章按 frontmatter 中的 `authors` 顺序展示。

头像不是强制项。只写名字可以，只写 GitHub ID 也可以；需要统一风格、不想使用 GitHub 头像，或者作者没有 GitHub ID 时，再上传自定义头像。

常写作者可以先加入作者 registry：

```ts
// src/data/authors.ts
export const authorRegistry = {
  alice: {
    name: "Alice",
    github: "alice",
  },
};
```

之后文章里只需要引用：

```md
authors:
  - id: "alice"
```

一次性投稿或临时共同作者不必加入 registry，直接在文章 frontmatter 里写 `name` / `github` 更轻。

## 头像规范

头像用于作者署名展示。默认不需要上传头像，填写 `github` 即可自动读取 GitHub 头像。

- 目录：`public/assets/authors/`
- 命名：`<github-id>.webp`，如 `alice.webp`
- 推荐尺寸：`256x256` 或 `512x512`
- 推荐格式：WebP，其次 PNG/JPG
- 单个头像大小：不超过 `512 KB`
- 如果不提供 `avatar`，但填写了 `github`，站点会自动使用 GitHub 头像

## 文章图片规范

文章内图片放在 `src/assets/posts/<collection>/<slug>/`，不要放在 Markdown 文件旁边，也不要直接放仓库根目录。每张文章图片只保留一份，不要同时复制到 `public/assets/posts/`。

示例：

```txt
src/content/papers/eval-is-not-a-number.md
src/assets/posts/papers/eval-is-not-a-number/figure-1.webp
```

在 Markdown 中使用相对路径引用：

```md
![不同评测协议下的结果差异](../../assets/posts/papers/eval-is-not-a-number/figure-1.webp)
```

不要使用 `/assets/posts/...` 这种绝对路径引用文章图片；它会指向 `public/`，容易造成同一张图在 `public` 和 `src` 下各放一份。

图片限制：

- 单张文章图片推荐不超过 `1 MB`，CI 硬限制为 `2 MB`
- 单篇文章图片总量不超过 `10 MB`
- 推荐格式：WebP 或 AVIF
- 截图宽度建议不超过 `1600 px`
- 必须写有意义的 alt text，不使用 `![](...)`
- 大型视频、动图、数据文件不要直接提交，先在 PR 中说明需求

硬限制会被 `pnpm check:assets` 自动检查；`pnpm images:check` 会提示超过推荐大小、宽度或格式的图片。

可以在提交前运行图片优化：

```sh
pnpm images:optimize
```

这个命令会把 `src/assets/posts/` 下的 PNG/JPG/WebP 转成 WebP，并把宽度超过 `1600 px` 的图片缩小。PNG/JPG 会生成同名 `.webp` 文件，记得同步更新 Markdown 里的图片路径。

## 本地开发

```sh
pnpm install
pnpm dev
```

提交 PR 前运行：

```sh
pnpm check
```

如果只想先看语法类问题，可以运行：

```sh
pnpm check:syntax
```

`pnpm check` 会执行：

- Markdown 格式检查
- 内容规范检查
- 敏感信息检查：常见 token、私钥和敏感文件
- 中英文语言路由构建检查
- 资产大小检查
- 图片推荐大小、宽度和格式提示，不作为硬性阻断
- 语法检查：Astro / TypeScript 模板、阅读量 Worker
- Analytics smoke build：临时文章验证 GA4、阅读量脚本和关键 Markdown 元素会在文章页正确渲染，随后正式构建不会保留临时文章
- 文章文件名 kebab-case 检查
- Markdown 图片 alt text 检查
- 中文正文引号开闭配对检查，发现错向或未闭合会阻塞 CI
- Astro 生产构建
- 构建产物页面标题、描述、站内链接、i18n、GA/pageview 开关和 RSS 检查
- 构建后文章正文中疑似未渲染 Markdown 标记的 warning，并写入 GitHub Actions summary；不作为硬性阻断

同一组内可独立执行的检查会尽量跑完，并在日志末尾汇总失败项。构建失败时，依赖构建产物的 dist 检查会跳过，避免读取旧产物。

GitHub Actions 还会额外运行 workflow lint，用来检查 `.github/workflows/` 里的语法和表达式问题。

外部链接是否可打开、图片来源是否合规、事实引用是否可靠，目前仍由作者和 reviewer 在 PR 中人工确认。

## 内容质量检查

发 PR 前请确认：

- 标题清楚，不只是论文名或营销式标题。
- `summary` 能独立说明文章价值。
- 外部链接可以打开。
- 论文类文章区分了论文作者和本站作者。
- benchmark 文章说明了 task、metric、version、known issues。
- 图片有来源或是自己绘制/截图，且没有版权风险。
- 文章不是简单搬运摘要，包含个人判断、疑问或复盘。

## Review 规则

PR 至少需要一位维护者 review 后合并。维护者主要看：

- 内容是否符合 Lens Frontier 的主题：论文阅读分享、benchmark 相关观察，以及围绕这些问题的一些浅薄观点。
- 事实、引用和链接是否可靠。
- 图片和资产是否合规。
- Markdown frontmatter 是否能通过构建。
- 观点是否清楚地区分事实、推断和个人判断。

main 分支应保持保护：需要至少一位 review、需要所有 conversation resolved，并且 required status checks 通过后才能合并。CI 拆分生效后，required status checks 应更新为 `syntax` 和 `check`。

仓库使用 `.github/CODEOWNERS` 自动请求 `@Lens-Frontier/blog-maintainers` review。这个 team 负责文章、站点、CI 和发布流程改动。

如果文章或站点改动会明显影响首页、列表页、频道计数或 tag 展示，请在 PR 说明中提醒 reviewer 重点查看对应页面。
