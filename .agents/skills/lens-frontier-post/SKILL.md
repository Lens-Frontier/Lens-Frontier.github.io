---
name: lens-frontier-post
description: Draft, validate, and prepare Lens Frontier blog article pull requests. Use when Codex or Claude Code is asked to add, edit, submit, or review a Lens Frontier Markdown post, choose between papers/benchmarks/opinions, handle author avatars or post images, run checks, create branches, or open PRs for this blog.
---

# Lens Frontier Post

Use this skill inside the `Lens-Frontier/blog` repository when helping someone create or edit an article PR.

## Workflow

1. Inspect `git status --short` first. Do not overwrite unrelated user changes.
2. Fetch the latest upstream state before starting new work: `git fetch origin main`. For new PRs, branch from `origin/main`.
3. Use fork-based PRs for normal article and site changes, even when the user has write access to `Lens-Frontier/blog`. Confirm the contributor fork remote before pushing, push topic branches to that fork, then open a PR back to `Lens-Frontier/blog`.
4. Before pushing to an existing branch or updating an existing PR, check the PR state with `gh pr view <number> --json state,headRefName,baseRefName,headRefOid`. If the PR is `MERGED` or `CLOSED`, do not keep pushing to that old branch as if the PR were still active. Create a fresh branch from the latest `origin/main`, carry the intended changes there, and open a new PR from the fork.
5. Do not edit article body content when the task is about site styling, CI, performance, analytics, docs, or tooling unless the user explicitly asks for article-content changes. Keep content edits scoped to the requested article or review target.
6. Read the relevant local docs before editing:
   - `README.md`
   - `CONTRIBUTING.md`
   - `src/content.config.ts`
   - the matching file in `templates/`
7. Choose the collection:
   - `src/content/papers/<slug>.md` for reading-share notes about papers.
   - `src/content/benchmarks/<slug>.md` for benchmark observations.
   - `src/content/opinions/<slug>.md` for benchmark-facing opinions.
8. Use lowercase kebab-case slugs. Prefer `post/<slug>` for the branch name.
9. Copy the relevant template structure manually into the new Markdown file and complete frontmatter.
10. Set `lang: "zh"` or `lang: "en"` in frontmatter. Single-language publication is allowed; do not invent a translation just to fill both routes. If a translated counterpart exists later, give both posts the same `translationKey` so the language switch can stay on the matching article.
11. Keep `authors` as site authors, not paper authors. For recurring authors, prefer `id` from `src/data/authors.ts`. If the author is not in the registry, either add them there or include at least `name` or `github` inline. Do not add `avatar` by default because the site automatically uses `https://github.com/<github>.png?size=96` when `github` exists. Add `avatar` only when a custom image is needed.
12. Put post images under `src/assets/posts/<collection>/<slug>/` only; do not duplicate them under `public/assets/posts/`. Put author avatars under `public/assets/authors/`.
13. Run `pnpm check` before proposing or opening a PR. It includes syntax checks, Markdown lint, content rules, blocking Chinese quote-pair checks, sensitive-content checks, asset hard-limit checks, image recommendation warnings, analytics smoke checks, production build, and built-page metadata/link/i18n/RSS/GA/pageview checks. It also writes non-blocking warnings for likely unrendered Markdown markers. When it fails, read the final `Failed checks` summary first.
14. If the user asks to open the PR and credentials are available, push the branch to the fork and use `gh pr create --repo Lens-Frontier/blog`. Use a clear title prefix: `post: <article title>` for articles, `docs:`, `site:`, or `chore:` for non-article changes.
15. After opening or updating a PR, check required CI status and the PR preview comment. Do not report that the PR is fully ready until `syntax` and `check` pass and the preview bot comment exists, or explicitly say what is still pending or missing.

## Required Article Standards

- Prefer quality over cadence. The blog should build long-term influence through stable content quality, careful judgment, and taste.
- The article should not be a copied abstract. It needs a question, observation, judgment, doubt, or replay of discussion.
- Explain evidence and limits. Views can be modest; claims should still be traceable.
- Avoid overclaiming from a single paper, benchmark, leaderboard, or anecdote. Narrow the conclusion when evidence is narrow.
- Keep the writing readable and restrained: clear structure, useful figures, no title bait, no material dumping.
- Do not commit secrets, tokens, private keys, unpublished materials, or third-party confidential information.
- For paper posts, distinguish paper authors from site authors.
- For benchmark posts, include task, metric, version or status, risks, and known misreadings when available.
- For opinion posts, separate facts, inferences, uncertainty, and personal judgment.
- For substantive revisions, set `updated: YYYY-MM-DD` and add a short revision note in the article body.

## Author Registry

- Recurring authors live in `src/data/authors.ts`.
- A post can use `authors: [{ id: "author-id" }]` when the author is registered.
- Inline author fields can still be used for one-off contributors or temporary overrides.
- Unknown author ids fail CI; add the author to the registry or use inline `name` / `github`.

## Assets

- Post image recommended target: `1 MB` each.
- Post image hard max: `2 MB` each.
- Total post asset folder hard max: `10 MB`.
- Author avatar max: `512 KB`.
- Prefer WebP or AVIF for post images; WebP for avatars.
- Reference post images with relative Markdown paths. Do not use `/assets/posts/...` absolute paths, which point at `public/` and can lead to duplicate assets.
- Keep screenshots at or below `1600 px` wide when possible.
- Run `pnpm images:check` to surface image recommendations. Recommendation warnings do not block CI; hard limits from `check:assets` do. Run `pnpm images:optimize` before PR when images are large or wider than `1600 px`.
- Every Markdown image needs meaningful alt text.
- Avoid committing large videos, animated images, or datasets. Mention the need in the PR instead.

## Markdown And Preview QA

- CI checks core Markdown rendering with a smoke article, but real article layout still needs a human preview pass.
- Before marking an article PR ready, inspect the local page or PR preview for tables, code fences, blockquotes, lists, horizontal rules, images, captions, HTML image sizing, Chinese quote direction, and bold / italic markers.
- Treat rendered-Markdown warnings in the GitHub Actions summary as review items. They do not always block CI, but they should be explained or fixed before merge.
- For posts with images, verify that images render from `src/assets/posts/<collection>/<slug>/`, can be opened in the article lightbox, and are not duplicated under `public/assets/posts/`.

## PR Behavior

Every PR runs CI with two required jobs:

- `syntax`: workflow lint plus Astro / TypeScript checks and Pageview Worker syntax / behavior checks.
- `check`: Markdown lint, content rules, sensitive-content scan, blocking Chinese quote pairs, asset hard limits, image recommendation warnings, analytics smoke build, production build, and dist checks for metadata, links, i18n, RSS, GA/pageview toggles, and possible unrendered Markdown.

After CI succeeds, the PR Preview workflow publishes a commit-scoped preview at:

```txt
https://lens-frontier.github.io/blog/pr-preview/pr-<PR number>/<commit short hash>/
```

The bot keeps one preview comment updated to the latest commit. Closing the PR triggers cleanup for the whole `pr-preview/pr-<PR number>` directory.

## Final Response

When finished, summarize:

- article path and collection
- author display choice, including GitHub avatar or custom avatar
- image/asset paths, if any
- `pnpm check` result
- required CI status, if a PR was opened or updated
- preview URL and whether the preview bot comment exists, if a PR was opened or updated
- PR URL or the exact command the user should run next
