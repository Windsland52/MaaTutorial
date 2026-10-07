# MaaTutorial Agent Skills

MaaFramework（MaaFW）自动化开发的 Agent Skills 集合，供 Claude Code、Codex 等 AI 编程助手在辅助项目开发时按需装载与闭环执行。

---

# 第一部分：Skill 路由（面向 Agent）

## 意图 → Skill 分诊

按任务意图选择 Skill；**优先单 Skill 闭环，跨阶段时明确交接并说明原因**（如 Pipeline 写到“JSON 表达不了”转 Custom，Debug 定位到配置问题转人工修复）。

| Skill | 状态 | 触发意图 |
| :--- | :--- | :--- |
| **`maafw-pipeline`** | ✅ 可用 | 编写新 Pipeline；生成识别/动作节点（OCR / TemplateMatch / ColorMatch 选型）；设计状态机流程（next 链、分支、循环、`[Anchor]` / `[JumpBack]` 中断）；Pipeline 文件与节点命名；重构与审查 Pipeline JSON |
| **`maafw-interface`** | ✅ 可用 | 编写、修改或审查 `interface.json`（V2）；任务入口、controller / resource 与 Bundle 差异组织；GUI 选项（Option）与 `pipeline_override` 接线；preset 预设、pretask 与 agent 子进程；import 拆分与结构排错 |
| **`maafw-custom`**（进阶） | ✅ 可用 | 纯 JSON 表达不了的业务逻辑（动态计数、跨节点数据传递、复杂判定）；Custom 识别/动作实现与注册；AgentServer 子进程模式 |
| **`maafw-debug`** | ✅ 可用 | 节点识别失败；点击不落点（识别成功 ≠ 点击生效）；ROI 校准与阈值调参；单节点运行验证；端到端验收；流程卡死排查（含 controller 连接配置检查） |

> 非可用状态的 Skill 暂不可装载：相关意图按下方负空间出口处理（MaaLLMWiki 路由 + 教程），勿凭记忆硬写。

## 知识路由（硬规则）

字段语义、Schema、API 签名、版本变更一律经 [MaaLLMWiki](https://github.com/Windsland52/MaaLLMWiki) 路由到**版本锁定的原始出处**再作答：引用回源（不引目录本身）；目录不可达时明确标记“未验证”，不得以记忆替代。

完整路由流程（版本选择、目录导航、回源、含 jsDelivr 在内的镜像通道）由专用 skill [`maallmwiki`](https://github.com/Windsland52/MaaLLMWiki/blob/main/skills/maallmwiki/SKILL.md) 承载，建议与本集合一同安装；未安装时按上述规则手工执行：

```bash
npx skills add https://github.com/Windsland52/MaaLLMWiki --skill maallmwiki --global
```

## 负空间（无 Skill 匹配时的出口）

- **素材制作**（截模板图、OCR 词表）：硬要求是**像素空间一致 + 裁后自匹配复核**（判定标准见 `maafw-pipeline` 素材准备节）；agent 自主工作流可用实时观测底座（如 [maafw-live](https://github.com/Windsland52/maafw-live)）或自写脚本走框架截图链路，人工在场截取用官方工具链（maa-support 插件 / MFA 工具箱 / MPE 等）。用该底座时，**观测/实测/裁剪/留存的动作与判据读它自带的 skill**（随包发布，本集合不复制）：
  `npx skills add https://github.com/Windsland52/maafw-live --skill maafw-live --global`。方法见 [MaaTutorial 教程](../docs/zh_cn/start/README.md)。
- **设备连接配置**：`maafw-debug` 排障树配置层承载；未覆盖处经 MaaLLMWiki 路由 2.4-控制方式说明原文、结合教程排查。
- **项目脚手架 / 事后诊断 / 自研集成**：转向下方能力边界所列渠道；事实问题一律回落 MaaLLMWiki 与 MaaTutorial 教程。

## 能力边界

* **项目初始化与脚手架**：由 [`create-maa-project`](https://github.com/Windsland52/create-maa-project)（作者维护）负责，不在本集合中重复制造脚手架。
* **事后运行日志与证据诊断**：由证据套件 [`MaaEvidenceKit`](https://github.com/Windsland52/MaaEvidenceKit)（`maa-evidence` Skill）负责，本集合严格专注于**开发态、编写态与调试态**。
* **设备交互与实时观测**：由运行工具 [`maafw-live`](https://github.com/Windsland52/maafw-live)负责，其**自带 `maafw-live` skill 随包发布**，承载观测/识别实测/模板资产/关键帧留存的动线、判据与反模式；本集合的 `maafw-debug` 只保留"诊断时怎么选工具、怎么判结果"的部分，命令与动线不在此重复。

## 安装与使用

使用标准 [skills CLI](https://github.com/vercel-labs/skills) 将所需的 Skill 安装至全局或当前工作区：

### 从远端仓库安装

```bash
# 仓库中所有可用的 Skill
npx skills add https://github.com/Windsland52/MaaTutorial --list

# 全局安装核心流水线开发 Skill
npx skills add https://github.com/Windsland52/MaaTutorial --skill maafw-pipeline --global

# 全局安装全部技能（交互式选择目标 Agent，推荐使用默认 symlink 模式）
npx skills add https://github.com/Windsland52/MaaTutorial --global
```

### 从本地仓库检出安装（开发调试模式）

```bash
# 在 MaaTutorial 根目录下，安装本地正在修改的 Skill
npx skills add . --skill maafw-pipeline
```

---

# 第二部分：贡献者规范（对使用 Skill 的 Agent 无约束）

以下内容约束本仓库 Skill 的**作者与维护者**，不是对使用 Skill 的 Agent 的运行时指令。

## Skill 目录规范

标准 Agent Skill 结构；skill 目录内不放过程性文件（设计草案、评审记录、简报），此类内容不入库、不随 skill 分发：

```text
skills/
├── README.md           # 本文件
└── <skill-name>/
    ├── SKILL.md        # Agent 核心指令（YAML Frontmatter: name, description + 核心工作流 + 硬护栏）
    └── references/     # （可选）运行时按需查阅的参考资料（命名规范、经典模式、反模式清单）
```

### `SKILL.md` 规范要求

1. **Frontmatter**：必须包含 `name`（与目录名一致）和 `description`。`description` 应使用中英双语准确描述触发时机与任务语境，确保 Agent 在匹配意图时准确命中。
2. **长度控制**：主文档原则上控制在 150 行以内，聚焦在“步骤顺序、关键决策树、核心禁忌”。
3. **渐进式披露**：长篇字段表、详尽反模式用例下沉到 `references/` 目录，由主文档提供相对路径引导 Agent 按需读取。
4. **精确性纪律**：协议机制与社区约定分层表述（协议的归协议、约定的标“约定”）；引擎机制断言须以协议原文或引擎源码核验，不得以记忆替代；经验数值显式标注“经验值”；字段的版本前提显式标注并路由核对；本文件的分诊状态必须反映真实可用状态。

## 核心设计准则

1. **单任务闭环（Zero Ping-Pong）**：一个任务在一个 Skill 内部走完全部标准流程，不把同一阶段拆为互相抢触发的“规范”与“生成”两个微型文件；跨阶段能力以清晰的交接说明衔接，而非互相禁止。
2. **环境与分辨率中立**：拒绝硬编码分辨率或绑定特定第三方 MCP。运行基准分辨率从项目已有配置（如 `interface.json` 的 controller 声明）动态获取（缺省 720 短边），素材按项目实际基准制作，逻辑需兼顾横屏与竖屏。
3. **坐标卫生与可维护性**：坚决贯彻“点击由识别推导”的原则，严禁 DirectHit 盲点或跨控件漂移偏移。

## 格式约定

- 遵循仓库 `.editorconfig`（space 缩进 4、LF、末尾换行、UTF-8）。
- 仓库不使用 prettier：md 表格保持紧凑手写（prettier 的表格 pad 对 CJK 是假对齐），嵌入 jsonc 示例不加尾逗号、保持与 pipeline JSON 的 4 空格惯例一致。
