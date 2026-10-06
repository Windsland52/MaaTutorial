# 项目结构法则

实证来源：活跃社区项目的实际布局（仓库内 `AGENTS.md` / 编码规范）。结构性事实以 MaaLLMWiki 路由的协议原文为准。

## 仓库根布局（两种流派，选一即固定）

| 流派 | 布局 |
| ---- | ---- |
| 资产集中式 | `assets/interface.json` + `assets/resource/`，与工程文件（构建脚本、agent）分离 |
| 根目录式 | `interface.json` 与 `resource/`、`agent/`、`tasks/` 都在仓库根 |

- 法则：interface.json 与 resource 的相对关系**一经确定不要迁移**——`import[]`、`resource[].path`、agent 的 `child_args` 全部相对 interface.json 所在目录解析，迁移 = 全路径重审。
- **新建默认根目录式**（create-maa-project 脚手架生成的布局）。

## 资源包组织

- **单包**：`<resource>/{image, model, pipeline}` + `default_pipeline.json` 置于资源包根（与 `pipeline/` 同级）。
- **多包（服务器/渠道差异）**：`base` 全量 + 每渠道只放**差异文件**。例如：`resource/base`（全量）+ 每渠道一个差异目录，渠道包内只有 `startup.json` / `shutdown.json` 等少数覆盖文件。叠加发生在**同一 resource 条目的 `path[]` 内**：`path: ["resource/base", "resource/channel"]` 按顺序加载、后覆盖先；`resource[]` 多条目是用户**选择**项——选中哪个加载哪个，条目间不叠加。
- 法则：差异包**只放覆盖文件，不放全量拷贝**；`default_pipeline.json` 每个资源包根各一份（可做渠道级默认差异）。

## 任务入口的存放（摸底导航）

- 任务入口声明可能在 interface.json 内联，也可能经其 `import[]` 机制拆在 `tasks/*.json` 等独立文件——摸底找任务入口时两处都要看。`import` 是 interface.json 的机制，语义与拆分方法归 `maafw-interface` skill，本文不展开。

## pipeline 文件组织

- 按功能模块分文件或分子目录，一个文件承载一条业务线。
- **模块目录 + 模块名前缀文件名**（`pipeline/AutoCollect/AutoCollectRoute1.json`…）——同模块多文件时前缀保证目录内排序与检索。
- **平铺功能文件**（`Awards.json`、`Combat.json`）——功能数适中时更轻。
- **共享节点归置**：跨任务复用的节点收进资源包 `pipeline/` 顶层（多包项目即 base 包）的 `general.json`（亦有项目以 `Interface/` 等共享目录名承载同一思想）。细则：
    - **上移门槛**：被 ≥2 任务引用才上移，单一消费者留在业务文件，不提前上移；首次上移才建文件；
    - **依赖单向**：general 不引用具体业务节点；
    - **任务内跨文件复用不设专门文件**：节点留在任一业务文件，复用关系在项目文档或进度档案记索引——文档只是索引，真相在引用图，改动前的全库搜引用才是硬保护。
- 法则：布局（前缀式 / 平铺式）与文件名大小写均为项目级选择。细则：
    - **项目内统一**（过渡期允许存量平铺 + 增量目录）——文件名不参与任务解析，无协议约束；
    - **新建默认模块前缀式 + PascalCase 文件名**：目录从第一天起（无增长天花板，覆盖更新冻结下起点即终点形态），与节点 / 模板图大小写一套（存量项目的蛇形文件名 + Pascal 节点混搭是历史形态，新项目不复制）；
    - **存量平铺项目照旧**：增量新模块开目录、已发布文件不迁移（见下"硬限制"）。

## image 组织

- 按功能模块分目录（`image/AutoFight/`、`image/Awards/`）。
- 周期性素材（版本活动）可用**版本/期号子目录**归档（如 `image/Awards/3.7/`），过期活动整体可清理。

## agent 与自定义代码

- `agent/` 与 resource 平级；单语言直接放（如 Python agent 的 `main.py` / `bootstrap.py` / `custom/` / `utils/`）；多语言分子目录（如 `agent/cpp-algo`、`agent/go-service`）。
- **注册点集中**：新增/重命名/删除 custom 时同步所有注册机制——改 Go service 子包要同步 `register.go` 与 `registerAll()`，改 cpp-algo 要同步 `main.cpp` 注册，Custom Schema 的 `enum` 也要跟着改；重命名/删除前先更新 pipeline 中的用法。

## 非标目录（custom 私有数据）

- MaaFW 资源加载只认 `image/`、`model/`、`pipeline/`（及资源包根的 `default_pipeline.json`）；其余目录（如 `assets/data/<模块>/` 存放 custom 读取的 JSON 数据）由 **custom 自行读取**，不经框架加载。
- 法则：非标数据按模块分子目录与 image 对齐；路径来源用 PI_* 环境变量或项目约定，不写死绝对路径。

## 硬限制（来自真实事故）

- **资源目录下的文件夹名禁止 `_` 开头**（如 `__Private`）：Android 打包逻辑无法处理下划线开头目录，资源会进不了包。
- **覆盖更新兼容**：以"解压覆盖"方式更新的项目，`pipeline/` 内文件与目录名一经发布即冻结。细则：
    - **只增、不改名、不删除**（含共享文件 / 目录的形态转换）；
    - **危害机制**：残留旧文件与新文件在**同一资源目录内**撞出同名节点，或残留文件仍引用新版已删 / 改名的节点——都是**资源加载失败**（同目录重名与悬空 next / on_error 均被加载期校验直接拒绝；同名覆盖只在跨资源目录间成立）；引用已删素材则是**运行期识别失败**（模板懒加载，缺图不拦加载）；
    - **文件间移动节点是安全的**：源文件同名覆盖 + 新增文件，引用不动；
    - 要求全新解压更新的项目亦建议遵守，降低用户误操作代价。
- 文件夹统一无下划线普通命名（`Private`、`Button`）；`__` 前缀仅允许用于 pipeline JSON 键名（内部节点约定），两者互不影响。
