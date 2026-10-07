# 排障树

配套 [SKILL.md](../SKILL.md) 工作流第 0 步分诊后的逐层展开。判定依据：MaaLLMWiki 路由的协议原文（2.4-控制方式说明 / 3.1-任务流水线协议 / 3.3-ProjectInterfaceV2，版本锁定）；经验数值显式标注。标注 TODO 的节为实践待补项（唯一清单见 SKILL.md）。

## 症状 → 层 → 首选检查

| 症状 | 层 | 首选检查 | 常见根因 |
| --- | --- | --- | --- |
| 设备连不上 / 无画面 | 配置层 | adb 连通、controller type、截图与输入方式 | 设备地址/驱动、USB 调试未开、截图方式探测失败 |
| 任务启动即失败 | 配置层 / 流程层 | entry 可解析、task 过滤、pretask 退出码 | entry 拼错、controller/resource 过滤不匹配、pretask 非零退出 |
| 选项没生效 | 配置层 | 适用性过滤 → 引用键 → override 目标 | option 适用性过滤静默失效（头号原因，经验值）、节点改名 |
| 某节点总不命中 | 识别层 | 当前帧有无目标、单节点验证 | 目标不在帧、ROI 过紧、阈值过高、模板像素空间不一致、模板缺图 / 路径断链 |
| 命中错目标 | 识别层 | 误配得分 vs 目标得分、ROI | ROI 过松、模板特征不唯一、遮蔽 |
| 命中但点击无效 | 动作层 | box vs 落点、target / target_offset | offset 漂移、inverse 点自身、目标被遮挡 |
| 点击后画面乱跳 | 动作层 | 再识别确认 | 画面已变点错 / 画面未变白点 |
| 流程卡死 | 流程层 | 当前节点、轮询列表、timeout 归属 | 遮蔽排反、DirectHit 入循环、max_hit 耗尽 |
| 任务提前失败 | 流程层 | on_error 链、异常态归属 | on_error 空/拼错、异常态再失败无二次兜底 |
| 走到不该走的节点 | 流程层 | next 顺序、anchor 设置 | 遮蔽、anchor 未设置被跳过 |
| 跑通但行为不对 | 验收层 | 四问、override 落点 | 不在目标场景行为未定义、override 静默失联 |

## 配置层细节

- **设备连通**：Android 先确认设备在 adb 列表、USB 调试开启；桌面窗口核对窗口句柄/标题。截图与输入方式框架自动探测选优，人工指定时逐项验证——字段语义按 2.4-控制方式说明原文核对。
- **任务入口**：`task.entry` 是 pipeline **节点名**（跨文件全局解析），不是文件名；合并后的 pipeline 里必须可解析。
- **task 级过滤**：controller / resource 按 **name** 引用（不是 type）。
- **option 适用性过滤**（`controller[]` / `resource[]` 字段 v2.3.0 引入；「不适用则不参与合并」规则 v2.3.1 明确）：option 声明的 `controller[]` / `resource[]` 适用列表不含当前选择时，整个 option（含嵌套子项）的 override 一个都不注入、无报错——「选项没生效」头号原因（经验值），先查这里，其次才是引用键 / case / override 目标（机制全文见 maafw-interface）。
- **agent / pretask**：子进程起没起先看它自己的 stderr / stdout（双日志纪律，见 maafw-custom 的 agent-mode.md）；`PI_*` 环境变量任何一项都可能缺省；pretask 跑完才连 Controller、非零退出即中止启动；两者 CWD 均为 interface.json 所在目录。
- **骨架校验**：有 dev-tools 的项目先 `pnpm check` 清结构错误（schema + pipeline 静态检查）——结构错不表现为运行时错。

## 识别层细节

- **先问目标在不在帧里**：取当前帧与模板来源帧比对——目标不在帧里，ROI / 阈值 / 模板的讨论没有意义。
- **单节点验证**：识别单测（必要时真机执行动作半）+ 截图 + hits/box 期望——`run` 从节点起跑会继续走 next / on_error，隔离要限制执行范围（见 tooling.md 默认执行路径）；节点字段语义查 3.1 协议原文，运行命令与输出字段查所选工具文档；对比「期望命中」与「实际命中/得分/box」。
- **当前帧取证**：观测底座（maafw-live）crop / color / annotate 命令，或自写脚本走框架截图链路；人工在场可用官方工具链（MSE 截图 / MFA 工具箱 / MPE）——不用外部截图工具（工具矩阵见 tooling.md）。
- **ROI**：起点识别 box 外扩约 20px（经验值）；过紧易失配、过松易误中，不稳时扫描几档。
- **阈值**：目标位实测得分 − 约 0.1 起步（经验值，仅 TemplateMatch 套用——OCR / ColorMatch 语义不同，FeatureMatch 无 threshold、严格度由 count / ratio 控制，见 maafw-pipeline 参数起点），且仍高于该屏误配最高分；两侧贴太近是模板 / ROI 问题，调阈值救不了。
- **模板**：跨设备捕获差异（模拟器 GPU 渲染、截图路径不同）导致本机命中他人不中；裁后自匹配复核——来源帧来源位置应命中（位置优先于得分，纯色模板得分是噪声）。
- **类型选错**：文本变化 → OCR expected 过期；缩放失配 → FeatureMatch；动态区 / 纯色 → 模板匹配不稳，换识别类型或特征区。
- TODO：识别慢（性能）排查分支；ColorMatch / And / Or / 自训模型节点的调试要点。

## 动作层细节

- **落点比对**：识别 box 与点击实际落点逐像素核对（观测底座框选 / 官方工具链交互截取）。
- **target 语义**：缺省 `true` 继承本节点识别 box；`target_offset` 要有依据；string 引用（前置节点 / `[Anchor]锚点名`）引用结果为空即动作失败（不是点屏幕中心）。
- **inverse 陷阱**：`inverse: true` 反转识别后，Click 等点击自身的动作失效——必须显式设置 `target`。
- **两坑治法**：画面已变点错 → 中间加「跳转完成」确认节点；画面未变白点 → 加「提交成功」确认节点（会更改账号数据的按钮必须确认，见 maafw-pipeline flow-patterns 稳定性法则）。
- **重试门控**：重新识别到按钮仍在才再点；`wait_freezes` 等画面静止。

## 流程层细节

- **执行模型归因**（模型全文见 maafw-pipeline SKILL.md）：候选被识别不算进入节点，命中后才算；进入后的动作与 next 轮询都发生在本节点内，失败走本节点的 on_error。
- **timeout 归属**：想调整某节点被识别的等待时长或超时去向，改的是它上一节点的 `timeout` / `on_error`——改错对象是「调了没用」的高频原因。
- **死循环三查**：遮蔽约束排反（被遮蔽的是出口且遮蔽者动作消不掉触发条件 = 一直命中死循环，timeout 救不了）；DirectHit 入循环（恒命中无识别门控）；`max_hit` 耗尽静默退场（识别时跳过不报错，列表空转至超时）。
- **提前终止**：异常态里 on_error 再失败（超时或列表无有效节点）没有二次兜底、任务直接失败；`[JumpBack]` 只在正常态兑现——恢复节点拼错的 on_error 链会立即失败。
- **改名失联面清单（后果分档）**：next / on_error 三种写法漏改**加载期报错**（非锚点引用被校验拒绝——症状是资源加载失败，不是静默；interface 的 pipeline_override 注入的悬空引用同样被拦）；roi / target string 引用、custom 的 run_task、template 素材路径漏改（懒加载缺图）**运行期失败**；custom 的 override_next 悬空**调用即失败**（返回值要判——check_pipeline 与加载期同一套校验、返回 false——但**不回滚**，坏补丁已生效：漏判返回值，悬空候选在识别时被跳过，**列表内再无其他存在且启用的候选**才不等 timeout 立即转 on_error，还有有效项则照常轮询命中）；`[Anchor]`（校验跳过锚点名）与 option 的 pipeline_override（override 落空）才是**静默失联**。另有：anchor 未设置/已清除被跳过；option 适用性过滤；import 同名 option 键以后导入为准。
- TODO：卡死时的「最小取证序列」（当前节点、轮询列表逐项识别结果、timeout 计时）落地模板。

## 验收层细节

- **完备性四问**：主线能跑？弹窗能处理？加载能等过去？不在目标场景时的行为已显式定义（自动跳过还是失败上报是产品决策）？
- **判定输入**：任务级结果 + 实际识别结果，按判定分级（SKILL 硬护栏 5；字段与退出码随工具以其文档为准，maafw-live 见 tooling.md 判定要点）；一次跑通 ≠ 稳定——重复跑（含冷启动 / 重连 / 断线恢复）。
- **验收分档**：Pipeline 业务流程验收——运行工具重复跑可承担，结论须记录前置条件与 Agent 状态（maafw-live 不执行 pretask、Agent 连接失败不阻断非 Custom 节点，`record.ok=true` 不含这两项）；目标 Client 集成验收——实际经 Client 的 pretask、资源 / 选项装配、Agent 启动与任务入口，工具跑通不能替代（边界见 tooling.md）。
- **override 生效验证**：逐分支核对落点——目标节点加临时可观察字段（改 action 或挂日志 Custom）确认覆盖真的生效。
- **测试沉淀**：有 tests/ 基建的项目补用例（截图 + hits 期望，属静态识别回归，不证明动作/转移/端到端）。
- TODO：验收记录模板（验证对象、范围、实际结果、证据、实现指纹）——对齐 state-plan 的 tested 语义，待其 schema 冻结。
