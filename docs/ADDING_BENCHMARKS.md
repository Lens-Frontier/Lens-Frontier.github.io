# Adding Benchmarks

The homepage workbench, Benchmark index, and Data Card routes all read from the same catalog in `src/lib/benchmarkData.ts`. A new Benchmark should be added there once and then gains visibility across the site automatically.

This is the public maintainer guide for mapping reviewed, publicly accessible material into the site data structures. Read [BENCHMARK_PAGE_STANDARD.md](./BENCHMARK_PAGE_STANDARD.md) before adding a new page.

## Public release baseline

A Benchmark may enter the public catalog only when its identity, capability claim, source, license, version, protocol, and limitations can be checked from public material. A leaderboard additionally needs machine-readable results, an exact model identifier, score definition, sample size or run count, and an evidence status.

## Choose the release stage

Do not require a project to pretend it has a complete leaderboard before the data exists.

| Stage | Site surface | Minimum input |
| --- | --- | --- |
| Public catalog | Benchmark Library and filters | Public identity, status, summary, capability, source, license, judge mode |
| Data Card preview | Bench detail route | Catalog fields, task families, one specimen, protocol and limits |
| Public leaderboard | Homepage chart and ranking | Versioned CSV results, score definition, run count and evidence state |
| Formal release | Analysis and evidence views | Failure analysis, findings, version history and reviewable records |

Incomplete work should remain on a development branch. The public UI must not display invented values or reserve entries without adequate public material.

## Add a catalog entry

After publication review, add one localized object to each applicable array in `publishedBenchmarkCatalog`. Do not add names merely to reserve a place in the UI:

```ts
export const publishedBenchmarkCatalog = {
  zh: [{
    id: 'code-qa-bench',
    name: 'Code-QA-Bench',
    category: 'code',
    status: 'released',
    summary: '评测模型在没有文档说明时阅读、定位并解释真实代码库的能力。',
    capability: '代码理解、定位与解释',
    source: '公开 GitHub 仓库',
    judgeMode: 'LLM judge',
    tags: ['code', 'repository', 'question-answering'],
  }],
  en: [], // 没有审核后的英文材料时可以暂时留空
};
```

Use an existing `CategoryId` and one of the four statuses: `released`, `preview`, `building`, or `planned`. The `id` becomes the route slug, such as `/zh/bench/code-qa-bench/`.

## Publish leaderboard results

When results are ready, add the model rows to the `publishedLeaderboards` map in `src/lib/benchmarkResults.ts`. Catalog entries already read from this map, so a reviewed submission appears automatically:

```ts
export const publishedLeaderboards = {
  'code-qa-bench': [
    {
      model: 'DeepSeek-V4-Pro',
      modelId: 'deepseek-v4-0324',
      score: 89.2,
      ciLow: 88.4,
      ciHigh: 89.9,
      benchmarkVersion: 'paper-v1',
      protocolVersion: 'paper-v1',
      publishedAt: '2026-05-29',
      sampleSize: 528,
      evidence: 'reviewed',
      evidenceDepth: 'partial',
      evidenceRef: 'https://arxiv.org/abs/2605.29277',
    },
  ],
};
```

Sort the rows by score from highest to lowest. The site assigns ranks from this order.

The current site contract requires normalized scores between 0 and 100. Keep the original metric in the submission CSV so readers can recover the meaning of the normalized value. Use exact model/version identifiers, publication date, sample size, and confidence interval when reported. Do not merge results produced under different protocol versions into one ranking without documenting the compatibility decision.

Every row mapped into `Leader[]` must be complete because site validation requires a finite 0-100 score.

Evidence values mean:

- `verified`: result and supporting records passed the project verification policy.
- `reviewed`: a maintainer or domain reviewer checked the result, but the full evidence pack is not available.
- `pending`: result is provisional and still needs review.

`evidenceDepth: 'full'` means the expected run artifacts are retained; `partial` means only part of the record is available. Neither label is a substitute for documenting the actual evidence policy.

Once `leaders` exists, the Benchmark automatically enters the public leaderboard. Before that, a reviewed catalog entry can appear in the Library, but unpublished drafts remain absent from every public surface.

## Add Task and Data Card detail

Visual and interaction choices may vary by project, but every public route should preserve the Overview, Leaderboard, Tasks, Method, Evidence, Analysis, and Limits/Versions meanings defined in `docs/BENCHMARK_PAGE_STANDARD.md`.

Add project-specific task families and public specimens to `src/lib/benchmarkDetailData.ts`:

```ts
{
  families: [
    { title: 'Task family', description: 'What this family isolates.', count: 40 },
  ],
  specimens: [
    {
      title: 'Public task example',
      capability: 'Capability being measured',
      context: [{ label: 'Environment', value: 'Pinned container' }],
      input: 'The exact task or a faithful redacted equivalent.',
      assertions: ['A check used to decide whether the task passed.'],
    },
  ],
}
```

The generic fallback keeps unfinished pages renderable, but it is not a sufficient final Data Card. A public release should replace it with project-specific task families, at least one specimen, the real evaluation protocol, and known limitations.

Full analysis data currently follows `BenchmarkEvidenceContent`: task totals, per-model outcomes, family scores, failure modes, findings, versions, and a technical record. Only add these arrays when they come from measured data and their denominators are known.

## Decide whether a Blog post is needed

Do not duplicate the full Data Card in `src/content/benchmarks/`.

- Update the structured Bench data for factual fields, scores, versions, tasks, and evidence.
- Add a Blog post for a release narrative, a new method, result analysis, failure-mode study, or a substantive version change.
- Use `src/content/papers/` for formal Lens Frontier papers and preprints.
- Use `src/content/opinions/` for analysis or judgment that is not the canonical benchmark specification.

## Keep the public data path mock-free

The site supports a completely empty Benchmark state and does not need synthetic projects or scores. Keep `publishedBenchmarkCatalog`, `publishedLeaderboards`, `publishedDetails`, and `publishedEvidence` empty until the source material passes publication review.

1. Add only results that can be traced to a submitted CSV or equivalent machine-readable artifact.
2. Confirm the score scale, model version, protocol version, sample size, publication date, confidence interval, and evidence status.
3. Review the homepage, Bench page, CSV source, and version record together.
4. Do not use `verified` merely because a value is present in code.
5. Never commit UI-only model rankings, fabricated task specimens, invented version records, placeholder hashes, repository URLs, or DOI values.

## Verify the change

Run:

```bash
pnpm check
```

Then verify both language routes and the homepage filters in the browser.

Also confirm:

- all fields and task examples are covered by the stated public scope;
- the leaderboard order matches the submitted CSV;
- model names and versions are not silently merged;
- the Bench page does not expose credentials, personal data, restricted material, or unpublished evidence;
- any Blog claims are supported by the same versioned results shown in the Data Card.
