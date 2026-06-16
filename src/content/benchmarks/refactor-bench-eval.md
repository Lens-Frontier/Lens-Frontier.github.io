---
title: "一个客观的代码重构评估体系"
lang: "zh"
date: 2026-06-12
summary: "以双重 Gate（行为保持 + 结构静态检查）为核心，用真实开源 commit 做数据、Docker 跑单测 + tree-sitter 做 AST 匹配，彻底避开 LLM-as-Judge 的主观漂移问题，精准测量大模型的代码重构能力边界。"
authors:
  - name: "韩曙斌"
    github: "ShubinHan123"
area: "code refactoring"
metric: "Pass@1 = BP ∧ Checklist"
version: "v1 (80 records)"
risk: "medium"
status: "active"
tags: ["evaluation", "code-refactoring", "benchmark", "coding-agent"]
---

今天想讲讲我是如何设计这套评测系统的——**为什么选择完全不让 LLM 当裁判**，**怎样用真实 commit + 双重 gate 把"重构做没做对"变成一个确定性的 0/1 判定**，以及在这个过程中踩了哪些坑、做了哪些关键的技术取舍。

## 1. 什么是代码重构

不改变其行为，改善其代码结构。代码重构是软件工程中最日常的操作之一——提取函数、内联变量、简化条件、移动类型、合并重复逻辑。自从 coding agent 兴起以来，重构的需求也会越来越多,模型能不能把重构做对，已经不是学术问题而是生产力问题。

我对现有的代码重构 benchmark 做了系统梳理，发现它们各有侧重但均存在显著盲区：

| **评测维度** | **SWE-Refactor** | **RefactorBench** | **SWE-Compass** | **Refactor-Bench（本工作）** |
| --- | --- | --- | --- | --- |
| 多语言覆盖 | ✗（仅 Java） | ✗（仅 Python） | ✓（10 种） | ✓（9 种） |
| 重构类型细分 | ✓（6 种，原子+复合） | ✗（无显式分类） | ✗（粗粒度单类别） | ✓（10 种 L2 分类） |
| 数据来自真实 commit | ✓ | ✗（人工+LLM 构建） | ✓（真实 PR） | ✓ |
| 跨文件重构 | 部分 | ✓（强制，平均 4.3 文件） | ✓ | ✓（40%） |
| 行为等价性验证（跑测试） | ✓（完整测试套件） | ✗（仅 AST 结构测试） | ✓（可执行测试） | ✓（Docker 内完整单测） |
| 结构正确性验证 | ✓（RefactoringMiner） | ✓（Python ast） | ✗ | ✓（tree-sitter） |
| 不依赖 LLM 判分 | ✓ | ✓ | 部分（GPT-5 辅助分类） | ✓ |
| 评测 Agent 工作流 | ✗（模型直接生成） | ✓ | ✓ | ✓（Claude Code 脚手架） |

核心观察：**重构的定义是"改变结构但不改变行为"——这两件事缺一不可，但现有 benchmark 很少能同时验证。**

SWE-Refactor 在"严格验证"上做得最扎实（同时跑测试套件 + RefactoringMiner 做结构验证），但只有 Java；RefactorBench 最贴近真实 agent 场景（强制多文件、三级指令详细度），但本质上没有行为等价性验证——只看 AST 结构不跑测试，一个通过结构检查的 patch 仍可能改变了程序行为；SWE-Compass 语言覆盖最广，但重构只是 1/8 的任务类别，没有细粒度的重构类型分析。

我想补的是这个组合：**多语言 + 真实 commit + 行为等价性验证 + 结构正确性验证 + Agent 工作流评测**，且判分过程里没有任何 LLM 参与。

## 2. 数据集怎么建的

数据集是整套系统的地基。我选择从真实开源项目的 git 历史里挖 commit，而不是人工构造题目。原因很直接：人工构造的重构场景永远比不上真实项目的复杂度和多样性。

### 从真实 commit 抽取

每条记录对应一段历史上真发生的重构 commit。我抽出 commit 的**父提交**作为基线（模型看到的 before），commit 本身作为参考解（reference after），并保留原项目当时的单测套件。模型完全看不到 after——它只能根据 before + 一段重构描述去改。

最终的数据集覆盖：

- **11 个项目**：django、pytest、sqlalchemy、commons-lang、curl、fiber、fmt、jellyfin、laravel-framework、nest、fastify
- **9 种语言**：Python、Java、Go、TypeScript、JavaScript、C、C++、C#、PHP
- **80 条记录**：筛选出有模型差距和较难的任务
- **10 种 L2 重构类型**：Extract Function/Method、Remove Dead Code、Rename、Simplify Conditional、Consolidate、Composite Refactoring、Extract Type、Move、Inline 等

### 几个数据集设计上的关键决策

#### （a）跨文件比例刻意拉高

单文件重构对强模型基本没有区分度。经验数据表明：opus 和 sonnet 在单文件上 Pass@1 分别 77.5% / 75.0%，差距微乎其微；但在跨文件记录上分别 65.9% / 59.1%——**跨文件才能真正拉开差距**。所以最终数据集里 32 条是跨文件（40%），比自然比例高出不少。

#### （b）L2 类型配比要看区分度，不是均匀撒

早期版本有个严重问题：Extract Function (22 条) + Remove Dead Code (17 条) + Rename (16 条) 占了 65%，但这些对 top 模型几乎全过——53.6% 的记录是"天花板题"（所有模型都过），16.7% 是"地板题"（都挂），真正能区分模型的只有 29.8%。复盘后发现，Composite Refactoring 和 Consolidate 这种需要"全局视野"的类型区分度最高。

## 3. 评测方法：双重 Gate

这是整套系统最核心的设计。我把"重构是否完成"拆成两个独立的 gate：

```text
Pass@1 = BP（行为不变）∧ Checklist（结构改对）
```

两个 gate 都过才算 1，否则算 0。80 条记录直接平均得到模型 Pass@1。

### Gate 1：Behavior Preservation · 行为不变

模型改完后，在原项目的 Docker 环境里跑两遍单测：基线一遍、agent 编辑后一遍，然后逐项对比。

四个判分条件（全部满足才算 BP 过）：

```text
compile_passed == 1          # 编译/导入没坏
post_total     > 0           # 测试收集没出错
post_passed   >= pre_passed  # 没让原本过的测试变挂
tests_passed  == 1           # test.sh 综合判断行为未变
```

### Gate 2：Checklist · 结构改对了吗

BP 只能告诉你"行为没变"，但模型完全可以一行不改照样过 BP。Checklist gate 用 tree-sitter 做静态结构匹配：每条记录都有 3–6 个 `check_*(ctx)` 函数，遍历重构后的 AST 验证"该删的删了、该提取的提取了"。

每个 check 函数接收一个 `CheckContext`，里面有 `before_entities`（before 的所有函数/类/方法）、`after_entities`（after 的）、以及一系列基于 tree-sitter 的高层 AST 查询 helpers（`count_calls`、`ast_size`、`conditional_node_count` 等）。

## 4. 几个关键的技术设计决策

做这套系统的过程中踩了不少坑，也沉淀了一些我觉得比较有价值的设计。

### （1）Checklist 的 5 步生产流水线

写出"对所有合法实现都公平"的 checklist 远比想象中难。我设计了一条闭环迭代的流水线：

1. **规则生成 v0**：按 L2 类型套用模板 + audit + diff，吐出初版 check
2. **GT-pass 过滤**：拿参考解（ground truth）跑 checklist，连真人写的代码都过不了的 check 直接淘汰
3. **跑一轮模型**：用多个模型各跑一次，形成"模型 × check"的 pass/fail 矩阵
4. **opus-4.7 复审**：区分"模型确实做不到"和"check 写得太苛"——多数模型挂但 diff 看起来已经合法重构了 → 改 check
5. **输出 final**：应用修改后再过一遍 GT-pass 兜底，commit

整个迭代不开 Docker、不跑单测，纯 tree-sitter + LLM API，每轮 1-2 分钟。

### （2）Shape over Names——Checklist 的核心哲学

参考解是一个工程师写出来的"一种"正确实现。另一个工程师做同样的重构，大概率会给新提取的函数取一个不同但同样合理的名字、用不同的中间表示、把新符号放在稍微不同的位置。

所以 checklist **必须基于结构形状（shape），不能写死名字**。具体做法是用集合差来检测"出现了一个新东西"：

```python
# Bad: hardcode 新函数名
def check_helper_exists(ctx):
    return ctx.helpers.entity_exists('getPrimitiveClass', where='after'), ''

# Good: 检测"新出现的函数中有至少一个被调用了"
def check_new_helper_invoked(ctx):
    new_fns = ({e.name for e in ctx.after_entities.values() if e.kind == 'function'}
             - {e.name for e in ctx.before_entities.values() if e.kind == 'function'})
    for nm in new_fns:
        if ctx.helpers.count_calls(nm, where='after') >= 1:
            return True, f'new helper {nm} invoked'
    return False, 'no new function is called'
```

这样不管模型取什么名字，只要结构上"确实多了一个函数并被调用了"，就算通过。

### （3）Auto-SKIP：锚点找不到时，宁可跳过也不误判

很多 check 在写的时候需要一个"锚点"——先按名字定位到某个实体，再验证它的变化。比如一条 Extract 重构的 check 可能这么写：

```python
def check_caller_grew(ctx):
    # 先按名字定位调用方，再看它的体积有没有变大
    caller = _find_by_name(ctx.after_entities, 'create_contenttypes')
    if caller is None:
        return False, 'caller not found'
    ...
```

问题在于：如果模型在重构的同时合法地把 `create_contenttypes` 改了名或挪了位置，这个锚点在 after 里就找不到了，check 会返回 `caller not found` → 判 False。但这并不是模型重构做错了，而是 checklist 写死的名字跟不上模型的合法改动——属于**误伤**。

Auto-SKIP 就是为这种情况兜底：当一个 check 失败的原因是"它依赖的锚点在 after 里根本不存在"时，运行器不把它算作失败，而是降级为**跳过（SKIP）**。它等于承认"这条 check 在这次改动下失去了判断依据"，既不冤枉模型，也不会把本该验证的点偷偷放过。

它和前面的 Shape over Names 是一对互补的防护网：Shape over Names 从**写法上**尽量不 hardcode 名字，Auto-SKIP 在**运行时**为不可避免的锚点失配兜底。

### （4）防作弊：模型"偷偷修 bug"的反制

这是一个意料之外的问题。早期测试中发现某些模型会在重构的同时顺手修复一个 bug——表面上 post_passed 比 pre_passed 多了一个，看起来"更好了"。但这不是重构，这是 bugfix 搭便车。

严格 count-equality 就是为此设计的：不仅不允许测试变少（新 break），也不允许测试变多（偷修 bug）。一个原本挂的测试突然过了 → 判定行为发生了变化 → BP 失败。

### （5）该给模型什么样的 prompt 才合理

给模型的 instruction 怎么写，直接决定了你到底在测什么能力。这里有一个微妙的平衡：

- **太具体**——比如"把 foo 函数里的重复逻辑提取为 `getPrimitiveClass(className)` 这个包级私有方法"——就等于把参考解的函数名和签名直接喂给了模型。它根本不需要理解代码在做什么，照抄就能过。这时候测的不是重构能力，是抄写能力。
- **太模糊**——比如"优化一下这个文件"——则任务无法判定，模型往哪个方向改都说得通，checklist 也没法对齐一个明确的目标。

合理的做法是**只交代重构的目标、范围和动机，把"具体怎么实现"留给模型**。比如："`ColPairs.__init__` 里有一段复合的元组解包条件可以拆分简化，请在保持行为不变的前提下重构它"——它点明了改哪里、改什么类型、为什么改，但不泄漏新名字、新中间变量、具体写法。

在 Refactor-Bench 里我们为每条记录都校准了这个颗粒度：描述清楚 where / what / why，但刻意不出现参考解里的新符号名和字面量。这样模型必须真正读懂 before 的代码、自己决定实现路径，测出来的才是它对重构语义的理解，而不是对答案的复述。

### （6）指令固定（PINNING）：同一条记录永远拿到同一个 prompt

prompt 写得合理还不够，它还必须**稳定**。早期我们每次 build eval tasks 都现场决定用哪版 instruction 模板，结果同一条记录在不同 sweep 里拿到了措辞不同的 prompt——这意味着跨 sweep 的排行榜根本不可比，模型分数的波动里混进了"它这次拿到的题面更友好"这种噪声。

解决办法是把每条记录的指令模板**固定（pin）下来**：用 opus-4.8 为每条记录一次性选定最合适的模板，写进 `instruction_manifest.json`。之后无论谁、在什么机器、什么时候重新构建，同一条记录生成的 `instruction.md` 都逐字节一致。

这听起来是个工程细节，但它是评测可信度的地基：只有输入完全固定，不同模型之间、不同时间点之间的分数才真正可比。

### （7）退役的 Gate 们：不是不好用，是被更优的方案替代了

早期版本跑过很多额外的 gate：ASTMod（AST 修改检测）、NotDeg（不退化）、TypeGate（类型检查）、ASTP、TGT、HARD-path，以及 5 维 LLM-as-judge 的 quality score。最终全部撤掉。但撤掉的原因各不相同，值得分开说：

- **ASTMod / NotDeg / ASTP / TGT —— 被 Checklist 替代。** 它们本质上都在判断"结构有没有按预期变化"，但用的是粗粒度的全局信号（比如整体 AST 节点数有没有变）。Checklist 出现后，用 per-record 手写的精确检查替代了这些笼统判断——信息量更大、误判更少。它们不是不好用，而是**有了更精确的替代品**，留着只是冗余。
- **TypeGate —— 被 BP 覆盖。** 单独做一遍类型检查没毛病，但对静态类型语言来说，BP 阶段的编译 + 单测本来就会暴露类型错误。单独再跑一遍既慢又重复。
- **HARD-path / 5 维 LLM-as-judge —— 主动放弃。** 这两个依赖大模型来判定任务完成度或打质量分，恰恰是我们最想避开的：分数膨胀、跨次运行漂移、且每条记录都要额外调用一次大模型，慢且不可复现。

砍掉这些之后还有一个直接收益：**verifier 更快了。** 判分链路只剩 BP（容器内跑测试）+ Checklist（纯 tree-sitter，不开 Docker、不调大模型），单条记录的验证从"跑多个 gate + 多次 LLM 调用"压缩成两步确定性检查。做评测系统的原则始终是：**宁可少判，不要误判**，而且越快越好。

## 5. 踩坑与心得

做了几轮迭代之后，总结几条比较深刻的：

1. **项目自带的单测和编译，是最硬的评判标准。** 折腾了这么多 gate 之后回头看，最不会骗人的信号其实是最朴素的那个——代码能不能编译、原项目的单测过不过。它是项目维护者亲手写的、长期演进沉淀下来的行为契约，比任何我们后加的结构检查都更权威、更难被钻空子。Checklist 解决的是"结构改对没"，但"行为有没有变"这个重构的根本前提，最终还是要靠项目原生的编译 + 单测来守。任何评测如果绕开了这一关、只在静态层面比对结构，得到的结论都是不牢靠的。
2. **Checklist 比 BP 难做一个数量级。** BP 是确定性的——跑测试、比数字，逻辑清晰。但 Checklist 要在"不冤枉合法实现"和"不放过没做到的模型"之间走钢丝。Shape over Names 原则听起来简单，在实际 80 条记录里落地时发现反模式层出不穷。
3. **GT-pass 是不可省略的兜底。** 每一版 checklist 都必须让参考解自己过——如果真人写的最优实现都过不了你的 check，那 check 一定写得太苛。这条规则帮我们在早期就干掉了大量"看起来合理但实际偏颇"的检查项。
4. **不要用 LLM 做最终判分。** 我们早期试过 5 维 LLM-as-judge 的 quality score，发现两个致命问题：分数膨胀（大多数都给 8-9 分）和跨 run 漂移（同一个输出不同时间得分不同）。LLM 可以用在 checklist 生产流水线里做"辅助审核"，但最终 gate 必须是确定性的。
5. **数据集区分度要刻意设计。** 自然分布的 commit 大部分太简单或太难，真正能区分模型的"中间地带"需要精心挑选。53.6% 全过 + 16.7% 全挂 = 70% 的数据没有区分度，这个教训让我们在下一批数据抽取中彻底改了配比策略。
6. **可复现性是评测系统的命门。** Instruction 不 pin、Docker 环境有波动、checklist 迭代后没同步重跑——任何一个环节的非确定性都会让跨 sweep 对比变得无意义。做评测不是做一次性实验，是做一个**可持续运行的基础设施**。

## 写在最后

代码重构是 coding agent 日常使用中最高频的场景之一，但它的评测一直是空白地带——因为"行为不变 + 结构改对"这个双重约束太难自动化验证了。

Refactor-Bench 的核心价值在于：**用确定性手段（Docker 单测 + tree-sitter AST）替代主观判断（LLM-as-Judge），把重构评测变成一个可复现、可持续、可信赖的 0/1 判定。** 它帮助我们精确定位不同模型在不同语言、不同重构类型上的能力边界，也在持续驱动我们的 agent 策略迭代。

希望这些思路对做类似评测工作的同学有参考价值。

---

韩曙斌

写于 2026.6.12
