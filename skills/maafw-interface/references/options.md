# Option 接线规则

来源：MaaLLMWiki 路由的 3.3-ProjectInterfaceV2 协议（版本锁定原文）。配套 [SKILL.md](../SKILL.md) 工作流第 4 步。本页只承载**选型判据与静默坑**；控件字段清单、默认值语义路由 schema，合并细则路由协议原文。

## 控件选型（一个用户参数放哪种控件）

- 开/关 → `switch`：case 名用 `"Yes"` / `"No"`——协议只认这几组写法（Yes/yes/Y/y、No/no/N/n）。
- 互斥选一 → `select`（缺省类型）。
- 可叠加的功能开关 → `checkbox`（v2.3.0+）：多个勾选 case 的 override 按 `cases` **定义顺序**依次合并——两个 case 改同一节点的同一字段时，排后面的赢，与勾选先后无关；可选数量上下限（v2.10.1+，default_case 应满足，schema 不校验）。
- 用户填值 → `input`：override 字符串里 `{字段名}` 占位，按 `pipeline_type` 转型；`verify` 正则验证。
- 绑按键 → `hotkey`（v2.8.0+）：占位符替换出的是**单个整数键码**，不会展开成 key 数组——要组合键一次性按下，回 pipeline 拆节点或写死键码数组。
- 嵌套 `option`（case 内 `option[]`）：仅选中该 case 时激活；协议支持无限嵌套，深度按实际需求定（子项同样受适用性过滤连带，见下节）。

## 适用性过滤（v2.3.0 + v2.3.1）

option 自己可声明 `controller[]` / `resource[]` 适用列表（按 **name** 引用，非 type）。用户当前选的 controller / resource 不在列表里时，该 option **整体失效**（协议称"未激活"）：它自己与嵌套子 option 的所有 `pipeline_override` 一个都不注入，目标节点保持原值、任务照常跑，没有任何报错。例：`"controller": ["PC"]` 的选项撞上 Android 控制器，override 静默消失。

- 与从哪级引用无关——task / controller / resource / global_option 引入的，统一在进入覆盖顺序**之前**过滤。
- Client 可能同时把它隐藏或置灰：用户也许根本看不到它；看得到、选了值，同样不生效。
- 排查"选项没生效"**先查这里**，其次才是接线（引用键 / case / override 目标）。
- 适用列表只加给**真正平台 / 服务器专属**的选项（如后台截图只在 PC 控制器有意义）；哪都需要生效的选项加了列表，等于在不匹配的环境里亲手关掉它。

## 声明层级与覆盖顺序（v2.3.0+）

参数属于谁，就声明在哪级：

| 层级 | 声明位置 | 适合的参数 |
| ---- | -------- | -------- |
| task 级 | `task[].option[]` | 只影响该任务（打哪关、刷几次） |
| controller 级 | `controller[].option[]` | 跟控制器走（触控/截图相关） |
| resource 级 | `resource[].option[]` | 跟所选 resource 走（服务器差异） |
| 全局 | `global_option[]` | 所有任务都要的；仍受 option 自身适用列表限制 |

**覆盖顺序**：task 级 `pipeline_override` 先应用，随后 option 各级依次合并、**后合并的同名字段覆盖先合并的**：`task > controller > resource > global_option`——即 option 赢过 task 级 override（MaaPiCli / MFAA / MXU 三实现一致）；多级引用同一 option 又对同一节点写字段时，按此推演谁赢。进入合并前先按上节过滤未激活项。`pretask.option` 不参与覆盖，只做传参。

## 接线工作流

1. 枚举用户可调项：只暴露用户理解的业务差异（服务器、清晰度、语言）；实现细节（阈值、超时）留在 pipeline。
2. 选类型、给默认值：`default_case` / input `default` 必须是最保守可用行为——不配置也能跑。
3. 每个分支写 `pipeline_override`：与 pipeline 文件同构，按**节点名 + 字段**定向，**字段级覆盖**——写出的字段替换（数组直接换、不拼接），没写的字段**继承节点原值**；识别/动作换**类型**时不继承旧参数、按新类型默认值重建（引擎实现行为，协议只举了数组不拼接的例）；节点语义见 `maafw-pipeline`。
4. 在 task（或更高级）引用 option 键名，逐字符一致。
5. **逐分支验证 override 落点**：目标节点临时加可观察字段（改 action 或挂打日志的 Custom），确认覆盖真的生效——override 按节点名定向，节点改名 = 静默失联，改名前全库搜 option 引用。

## preset（v2.3.0+）

任务勾选 + 选项值的快照，一键切场景：

- `preset[].task[]`：name 对应顶层任务、`enabled` 是勾选态、`option` 给各配置项预设值——值类型随控件（select / switch → case 名，checkbox → case 名数组，input / hotkey → 字段映射，细节路由）。
- `password` 字段不入 preset（协议建议，schema 不校验）。
- 可经 import 拆独立文件。

## import 拆分的静默坑（v2.2.0+）

- 拆分文件里定义与主文件**同名的 option 键，以后导入文件为准**——主文件的定义被顶掉；拆分前先查已有键名。
- controller / resource 声明不能经 import 合并，资源根永远在主 interface（SKILL.md 硬护栏 2）。
- 合并细则（task / preset / setting 追加、global_option 去重保留先出现、pretask 有序合并）路由协议原文——**以官方 import schema 为准**：协议收录面更宽，如 `group` 协议说可导入、import schema 未收录且 `additionalProperties: false` 会拒，别用。
- 拆分范式（create-maa-project 的约定，协议只定义 import 机制本身、官方 sample 是单文件不用 import）：任务量大时 interface.json **不内联 `task[]`**——根目录 `tasks/` 按功能拆文件，预设独立在 `tasks/preset/*.json`，主 interface 数十个 import；一个功能域一个文件，文件名与功能对齐；import 片段放 `tasks/` 下才会被 `pnpm check` 校验。
