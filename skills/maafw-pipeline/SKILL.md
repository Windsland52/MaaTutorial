---
name: maafw-pipeline
description: 编写、修改与审查 MaaFramework（MaaFW）Pipeline——从零新建任务与子流程（大任务逐级拆分为嵌套复用的子流程、需求翻译成状态、资源文件与节点命名、识别/动作节点编写与 ROI 圈定、next 链分支/循环/[JumpBack]/[Anchor] 中断与失败路径设计、可达性自查）与存量重构（摸底可复用节点、改名前全库搜引用、坐标卫生与反模式审查）。Use when authoring, editing, or reviewing any pipeline JSON in a MaaFW project — adding tasks, sub-flows, or nodes, breaking large tasks into nested reusable sub-flows, choosing TemplateMatch/OCR/ColorMatch or action types, sizing ROIs, designing next chains with branches, loops, interrupts, and timeout fallbacks, naming or renaming pipeline files, folders, nodes, or template images, or refactoring existing pipelines for coordinate hygiene and anti-patterns.
---

# MaaFW Pipeline 开发

编写全流程分两条动线，动手前先分轨：

- **新建轨**：从零新建流程（任务或子流程）——需求 → 拆分与状态清单（含探索取证）→ 文件结构与命名 → 素材准备 → 节点编写 → 流程组合 → 自查与交接。大任务逐级拆成子流程嵌套组合，每一层走同样步骤。
- **修改轨**：在既有项目上改动、重构、审查——摸底 → 搜引用 → 修改 → 自查（见下文），不按新建顺序硬套。

字段精确语义（字段名、参数、默认值、版本支持）**不在本文复制**，一律路由 [MaaLLMWiki](https://github.com/Windsland52/MaaLLMWiki) 的 `3.1-任务流水线协议`：版本锁定、引用回源、不可达时标记"未验证"（已安装 `maallmwiki` skill 时由其承载完整路由流程）。执行模型是下文一切推理的基础，在此给出最小版：

## 执行模型（最小心智模型）

节点是三段式：**识别 → 动作 → next**。引擎在节点间如此运转：

1. **启动**：任务由入口节点名启动（`post_task`），引擎初始化为"当前节点 = 入口节点、轮询列表 = [入口节点]"——入口作为唯一候选被识别（通常 DirectHit 恒命中）；若识别超时，用**它自己的** `timeout`，未命中也走**它自己的** on_error。
2. **轮询**：当前节点动作完成后，对它的 **next 列表按顺序轮询识别**：每轮依次尝试各候选；本轮全未命中，等 `rate_limit` 后再截图重试（本轮候选全为 DirectHit 时跳过截图，零画面开销）。
3. **转移**：**第一个命中的候选立即胜出**（后续候选不再检测），**进入该节点**、执行其动作——动作成功则轮询它的 next 列表（回到第 2 步）；动作失败走它的 on_error。
4. **超时归属**：轮询超过**当前节点**的 `timeout`（缺省 20s）仍无命中 → 走**当前节点**的 on_error——想调整某节点**被识别**的等待时长或超时去向，改的是**它上一节点**的 `timeout` / `on_error`，不是它自己的。
5. **异常状态**：
    - **进入（三种）**：动作失败；轮询超时；被轮询列表中没有任何存在且启用的节点（不等 `timeout` 立即未命中——不存在的引用过不了加载校验，走到这一步的多为 `enabled:false` 节点或未设置的锚点）。
    - **进入后**：on_error 列表接替 next 列表被同样轮询——on_error 为空时 next 立即为空、循环直接终止，任务以失败收场。
    - **解除**：只由识别命中解除；命中后若动作失败，立即重新进入——因此结果上走出异常 = 命中且动作成功。
    - **异常期间收紧**：再次未命中（on_error 轮询超时，或列表无任何存在且启用的节点——如恢复节点名拼错，不等超时立即失败）**不进 on_error**、任务直接失败；执行链走空时若仍处于异常状态，已登记的 `[JumpBack]` 回跳不生效，任务以失败终止。
6. **终止与成败**：
    - 循环在 next 为空或外部 stop / StopTask 时终止；**任务成败 = 终止时是否处于异常状态**（正常态走空即成功）。
    - **唯一例外 `[JumpBack]`**（仅正常态）：子链走空不终止，**重新轮询父节点的 next 列表**（从头按序识别；父节点不经识别恢复为当前节点，超时与 on_error 归属回到父节点，动作不重跑）。例如 `A.next=["B","[JumpBack]C"]`、`C.next=["D"]`、`D.next=[]`，C 命中走完 D 后重新轮询 `A.next`。

**on_error 归属**：候选被识别不算进入节点，**命中后才算进入**；进入后的执行动作与轮询 next 列表都发生在本节点内——动作失败走动作所在节点的 on_error，轮询 next 超时走 next 列表所属节点的 on_error。

## 硬护栏（全程生效）

1. **探索优先**：要写的每个状态必须有真实观测证据（截图、OCR 文本、色值、box 等）；凭文档、节点名或记忆推断的状态一律视为 guessed，**guessed 状态不得落笔**。
    - **按转移推进**：探索到哪个界面（以当前设备画面为准），就观测该界面的识别标志与点击目标；点击后实际观测到下一界面标志出现（即 next 出口候选），这条转移即可落笔。弹窗节点同样只在见过该弹窗后写；写到哪、观测到哪，不必全流程探索完再动笔；整段贯通与可重入不在**落笔**门槛内，但属于**完成**门槛（见第 6 步完成判据），轮到自查与端到端验收去跑。
    - **点击最小化副作用**：非必要的提交/领取类按钮不点；能靠关键帧确认的状态不主动触发。
    - **不可复现状态**（一次性奖励、首通引导、不可逆操作后界面）：用**留存的关键帧**代替——工具暂存的重要变化帧同样算观测证据，写前逐帧核对；连关键帧都没有的仍按缺口处理。
    - **复用与边界**：复用已有节点时，其入口前提同样须观测确认；无法探索（无设备/无授权/禁副作用）就停下报告缺口；抢购、QTE 等毫秒级反应超出轮询模型，直接说明做不到。
2. **坐标卫生**：点击目标由识别结果推导（细则见 [references/anti-patterns.md](references/anti-patterns.md)）：
    - `target` 缺省 `true`（继承本节点识别 box），绝大多数节点不需要写；偏移用 `target_offset` 并注明依据；
    - 另指目标优先 string 引用（前置节点名 / `[Anchor]锚点名`，引用结果为空即动作失败）；固定坐标数组视同硬编码，仅特殊场景（如负坐标从边缘计算）使用并注明理由——**严禁 `DirectHit` + 硬编码 target 坐标**。
3. **不编造字段**：字段名、参数、版本支持拿不准就路由，宁可少写用默认值；`$` 开头 root 字段不解析、`.` 开头文件/文件夹不读取。
    - **注释约定**：pipeline 按 **jsonc** 解析，纯说明优先 `//` 注释；结构化注释用 `desc` / `_desc`，占位提示用 `code` / `_code`（如 `template_code`），`doc` / `_doc` 尽量不用——均为非协议约定字段（引擎对未知键静默忽略）。
4. **基准分辨率中立**：运行基准从项目 controller 配置动态获取（缺省 720 短边，兼容横竖屏）；量 ROI 的截图必须走框架截图链路，不用外部图片。
5. **循环必须有终止论证**：凡执行会回到已执行节点候选列表的写法（`[JumpBack]` 回跳、next 成环），终止论证三选一并在注释说明：
    - **限次**：`max_hit` / `timeout` + `on_error` 上报；
    - **识别门控**：候选带真实识别、动作以消除该识别为目标，动作可能失效时仍配兜底限次；
    - **挂机意图**：显式声明的无限产出循环，退出靠外部停止或条件节点，环内每轮有真实进展，重置计数须显式；
    - **超时与 DirectHit 铁律**：`timeout` 只管"目标界面一直没出现"，管不了"一直命中停不下来"；**DirectHit 禁入循环**（恒命中无门控，且全 DirectHit 列表跳过截图、无法观测画面变化）。

## 新建轨

步骤 1–5 按**段**滚动推进：拆出的每个子流程各自走 1→5，探索一段、写一段，不必整个任务探索完再动笔；全部段落完成并自查后进第 6 步。

滚动推进必须伴随**进度档案**（跨会话的 working memory，外置成文件，放资源包外不被框架加载的位置）：记录需求与拆分结论（子流程清单）、每段实现状态（**计划中 / 已编写 / 已测试**）、每个已观测状态的证据帧编号、当前断点（设备停在哪个界面）。**关键帧与状态绑定归档**——它同时是 observed 证据、复测识别的素材（节点测试模式：截图 + hits/box 期望）、模板裁剪的来源。

### 1. 需求 → 拆分与状态清单（含探索取证）

- **先拆再翻（滚动拆分）**：大任务先拆成入口/出口明确（约定 `Start`/`End` 后缀）的子流程，可跨任务复用的收进资源包内 `pipeline/general.json`（文件归属表达复用边界，不靠节点名前缀，见 [references/project-structure.md](references/project-structure.md)）；拆分边界是**一段可独立观测与独立验证的界面段/业务段**。先定子流程大框架，屏内状态与弹窗随推进滚动补入。
- **屏内动线（先同屏、后出口）**：进入界面后先写并即测同屏异常处理节点（不离开当前画面，写完即测）；出口节点最后写，写完测完顺接进入下一界面。
- **状态翻译**：把流程翻译成状态（起始态、中间态/弹窗、成功态、失败态），每个状态明确两项（选型细则见 [references/flow-patterns.md](references/flow-patterns.md) 第一步）：
    - **识别选型**：固定图 `TemplateMatch`、文本 `OCR`、色块 `ColorMatch`、无视觉变化 `DirectHit`、缩放目标 `FeatureMatch`、复杂目标 `NeuralNetworkClassify`/`NeuralNetworkDetect`、多条件组合 `And`/`Or`、复杂逻辑转 `maafw-custom`；
    - **证据状态**：标注 `observed` 或 `guessed`（`observed` 才落笔，`guessed` 先探索）。

### 2. 文件结构与命名

- **文件组织**：新建默认**模块前缀式 + PascalCase 文件名**（`AutoCollect/AutoCollectRoute1.json`），存量平铺项目照旧（增量新模块可开目录）；跨任务共享文件固定用 `general.json`（小写惯例）。细则见 [references/naming.md](references/naming.md) 与 [references/project-structure.md](references/project-structure.md)。
- **JSON 版本**：新建默认 **Pipeline v2 嵌套写法**（`recognition` / `action` 收敛为 `{type, param}`，`MaaFW v4.4.0+`，隔离命名空间防错位字段静默失效）；存量跟随既有主流风格，项目内统一（见 [references/flow-patterns.md](references/flow-patterns.md) 示例注）。
- **节点与素材命名**：节点名跨文件全局解析、大小写敏感，同包重名即错误；不以 `$` 开头、不使用 `[` `]`；按词位公式 `任务_界面_对象_角色_变体` 组织（细则见 [references/naming.md](references/naming.md)）。`image/` 按模块分目录，资源目录下文件夹名禁 `_` 开头（Android 打包限制）。

### 3. 素材准备

- **像素空间一致**：模板从基准分辨率的框架截图（无损缩放后）裁剪；模拟器自带截图仅在分辨率与基准一致、无通知栏/水印/有损压缩污染时可用，相机翻拍或比例不符不可用。裁剪避开动态数字/动效。
- **工具选型**：Agent 自主工作流优先实时观测底座（如 [maafw-live](https://github.com/Windsland52/maafw-live) 的 `crop` / `color` / `annotate` / `crop --from-kf`，动线读其自带的 `maafw-live` skill），或自写脚本走框架截图链路；人工在场可用官方工具链（VSCode Maa Pipeline Support（`maa-support` / MSE）/ MFA 工具箱 / MPE）。
- **裁后自匹配复核**：新模板在来源帧的来源位置必须命中（位置正确优先于得分），裁完即验。

### 4. 节点编写

- **识别与动作**：每态一节点，先识别后动作；`roi` 收紧到目标出现区域（起点取识别 box 外扩约 20px（经验值），不稳时扫几档）；动作选型与参数路由《任务流水线协议》核对，点击落点遵守坐标卫生（硬护栏 2）。
- **节点通知（`focus`）**：需展示运行日志/提示/弹窗时配 `focus`（支持 `{name}` 占位与 `$` i18n，`display` 选渠道，`trace` 需 `interface.json` 配 `telemetry` 才生效；路由《任务流水线协议》与《ProjectInterface V2》）。
- **参数起点**：TemplateMatch 的 `threshold` 取目标位实测得分减约 0.1 起步（经验值）且高于同屏最高误配分——两侧贴得太近是模板 / roi 问题，调阈值救不了（OCR / ColorMatch 语义不同，FeatureMatch 靠 `count` / `ratio` 控制）；优先用 `*_wait_freezes` 而非硬 delay。
- **写入纪律**：采用**增量插入**保留 JSONC `//` 注释，缩进与字段顺序对齐项目既有约定；坐标一律用框架缩放后坐标系的实测值。

### 5. 流程组合

完整五步展开、代码示例与稳定性法则见 [references/flow-patterns.md](references/flow-patterns.md)，核心准则如下：

- **主干**：最短可成功路径排成线性 next 链；界面切换用"等待目标出现"节点表达，延时与节点 `timeout` 保持缺省；用 `*_wait_freezes` 时其内部 `timeout` 默认 20s，等待区域有持续动画时常配 1~2s 小值兜底（经验值）。
- **分支**：next 顺序即优先级；**遮蔽约束优先**（同时命中的特例候选必须排在通配候选前，防排反死循环），其余按**命中频次降序**排列；互斥分支靠顺序、排序靠 `order_by`、同屏组合靠 `And`/`Or`。
- **循环与中断**：循环体与出口放同一列表并配 `max_hit`（硬护栏 5）；随机弹窗/加载做成独立节点以 `[JumpBack]` 挂在关键等待点（仅正常态兑现）；跨分支动态汇合用 `anchor`（未设置即静默跳过，前置路径须全覆盖，细则见 [references/flow-patterns.md](references/flow-patterns.md)）。
- **等待与重试分层**：等待用参数表达、不写自指结构；重试仅在实测有失效率后添加，优先单节点自指 + `max_hit`，确需独立预算或策略升级才建 `Retry` / `Fallback` 克隆节点并注明差异面（细则见 [references/flow-patterns.md](references/flow-patterns.md)）。
- **失败路径**：每个 next 列表配 `timeout` + 稳定可命中的 `on_error` 兜底（异常态再失败无二次兜底）；`on_error` 只做异常恢复、不做正常分支；禁无识别门控的盲目连点；动作报错走收敛而非自指死磕。

### 6. 自查与交接

- **完成判据（硬门）**："写完"只到"可跑"为止——**未以项目入口真机跑到任务级成功、且未记录失败节点与前置条件的 pipeline，不得声明完成，也不得写进交付说明或 PR 的验证项**。判定只看任务级结果、不看调用层信号：跑满预算被截断（`status=0` + `stopped=true`）既非成功也非失败，不算通过；任务级失败必须落到具体节点名。达不到终态就如实写"未跑到终态"并给出停住的节点，**不得用"跑满 N 秒无异常"代替通过**。声明完成前加载 `maafw-debug` 走验收层。
- **完备性四问与可达性**：无孤立节点、无 anchor 断链、无未解析引用；确认主线能跑、弹窗能处理、加载能等过去、**不在目标场景时的行为已显式定义**（跳过或报错）。有 `tests/` 基建的项目补识别回归用例。
- **跨阶段交接**：端到端验收**必须由 `maafw-debug` 承担**（本 skill 不判验收），单节点验证同样归它；task 入口与选项接线 → `maafw-interface`；JSON 表达不了的逻辑 → `maafw-custom`。无设备或不允许跑真机时如实标注"未验收"并留下缺口，**不得把静态自查通过降级表述成验收通过**。

## 修改轨（存量项目入口）

1. **摸底**（按改动规模伸缩，走索引不通读）：小修直接定位目标节点与上下游；结构性改动先看目录树与 `interface.json` 任务清单 → 脚本提取节点名索引（列 root key）→ 按词位关键词检索，共享件先查 `general.json`；动手前明确改动边界。
2. **搜引用**：改节点名或素材路径前全库搜索——漏改后果按引用位置分四档（**加载期报错 / 运行期失败 / 调用即失败且不回滚 / 静默失联或漂移**），各档覆盖的引用面与跨语言 `get_anchor` 细则见 [references/naming.md](references/naming.md) 的引用核对表。
3. **修改**：按新建轨 2–5 的同等标准增量修改。
4. **自查**：可达性检查 + 反模式清单逐项核对（见 [references/anti-patterns.md](references/anti-patterns.md)）。

## 深入阅读（按需）

- [references/naming.md](references/naming.md) — 文件/目录/节点/图片命名规范与改名全库搜引用核对表
- [references/project-structure.md](references/project-structure.md) — 仓库布局、多资源包、共享节点归置与覆盖更新硬限制
- [references/flow-patterns.md](references/flow-patterns.md) — 流程设计五步法、等待重试分层、模式示例与稳定性法则
- [references/anti-patterns.md](references/anti-patterns.md) — 坐标卫生细则、反模式对照表与审查清单
