# 命名规范

来源：协议硬规则（3.1-任务流水线协议 / 1.1-快速开始，经 MaaLLMWiki 路由的版本锁定原文）+ 社区实证约定。项目结构与目录组织见 [project-structure.md](project-structure.md)。

## pipeline 文件名

协议层：

- `pipeline/` 目录下所有 json/jsonc **递归读取**，文件名不参与任务解析——节点名才是全局键。
- 以 `.` 开头的文件/文件夹不读取；`$` 开头的 JSON root 字段不解析。
- `default_pipeline.json` 是保留名：置于资源包根（与 `pipeline/` 同级），为所有节点及特定算法/动作类型提供默认参数。细则：
    - **键名大小写敏感**（`TemplateMatch`、`OCR`、`Click`）；类型对象内 v1 / v2 写法均可；
    - **优先级**：节点自身字段（写在节点定义里，不在本文件） > 算法 / 动作类型默认 > `Default` > 框架内置；
    - **只认三类键**：`Default`、识别类型名、动作类型名——写节点名等其它键会被静默忽略（不报错、不生效）；
    - **文件名**：`default_pipeline.json` 或 `default_pipeline.jsonc`；
    - 实例（算法级示例为协议机制示意，旗舰项目现均只用 `Default` 层）：

```jsonc
{
    "Default": {
        "rate_limit": 1000,
        "pre_delay": 200,
        "post_delay": 200
    },
    "OCR": {
        "recognition": { "type": "OCR", "param": { "threshold": 0.5 } }   // 算法级：全项目 OCR 置信度阈值，默认 0.3 → 0.5
    }
}
```

约定层（两种实证风格，项目内统一）：

- **模块前缀 + PascalCase（新建默认）**（`AutoCollect/AutoCollectRoute1.json`——一功能域一目录，文件名带模块前缀保证排序与检索；活动期号件也走独立模块目录，随期整体归档）——与节点、模板图同用 PascalCase，目录 / 文件 / 节点首槽三层同词（`Awards/` ↔ `Awards*.json` ↔ `Awards_*`），跨工件一个搜索串通吃。
- **功能平铺**（`Awards.json`、`SwitchAccount.json`——布局与大小写正交，平铺不等于蛇形，项目自定）——功能数适中时更轻；活动文件收进 `activity/` 子目录，模块膨胀后新模块开目录、已发布文件不迁移。
- 不把全部节点堆进一个文件，也不依赖文件名表达结构（结构由 next 链表达）。

## 节点名

协议层：

- 节点名是 JSON root key，跨文件**全局解析**；定义与引用（next / on_error / target / anchor 引用 / pipeline_override）按**精确字符串匹配，大小写敏感**。
- `$` 开头的 root 字段不会被解析——只用于注释/停用节点。
- **方括号只属于引用位语法**：`next` / `on_error` 等引用列表中，`[` 开头的条目按节点属性前缀解析（`[JumpBack]节点名`、`[Anchor]锚点名`）。细则：
    - **节点名不使用方括号**：以 `[` 开头的名字无法被干净引用（引用会被重解析为属性）；`]` 协议虽不禁止，但与属性语法撞形、徒增 grep 与解析歧义；
    - `[Anchor]X` 中的 X 被当作**锚点名**而非节点名；
    - **属性可连用**：`[JumpBack][Anchor]X` 两者同时生效，解析对前缀顺序无要求；**惯例 `[JumpBack]` 在前**。
- **同名节点多处定义时，后加载的覆盖先加载的**。细则：
    - **同一资源包内重名即错误**，不要依赖覆盖顺序；
    - **跨资源包重名是渠道差异包的覆盖机制**（见 project-structure.md 多包组织），有意为之、不算错误——有疑义以校验工具的报告为准。

约定层（英文 PascalCase 为社区主流；语言不强制，项目内统一）：

- **内部工具节点**：`__` 前缀约定为纯内部动作节点（如 `__AutoAltClickAltKeyDownAction`）。
- **字符规则（针对整个节点名，到此为止）**。细则：
    - **协议只保留开头字符**：`$` 开头的 root 键不解析、`[` 开头的列表条目按节点属性前缀解析；其余字符协议无限制；
    - **约定避开方括号**：`[` `]` 属引用位属性语法（见协议层）；
    - **下划线与 `.` 在名内合法**：下划线的系统化用法为槽位分隔（见下文语义结构），零散分词（`Fight_V2`）亦可；`.` 不承担槽位语义，可作子序号等零散用途（`Action1.1`，存量实证）；
    - **跨平台分发建议 ASCII**；
    - **收口**：除上述外不再设其他字符级规则，复用边界等语义由文件归属表达（见 project-structure.md）。
- **接口与内部分离**：模块对外只经显式接口节点暴露能力，`__` 内部节点不直接被其他任务引用；共享入口的归置方式见 project-structure.md。
- **重命名前全库搜引用**：next / on_error、`[Anchor]`、option 的 pipeline_override、custom 的 run_task / override_next——改名后引用静默失联是高频事故。

### 语义结构（词位公式）

节点名从左到右**从大到小**排布，槽位按需取用、语义主体必填——任何节点至少能填出"对象 / 意图"，公式即覆盖全部情况。**槽位之间用下划线分隔，槽内单词 PascalCase 连写**；单一语义单元（`CloseButton`）内部不再切：

```
任务_界面_对象_角色_变体
```

槽位含义：

- **任务**：所属任务 / 模块名（共享件无此槽）；
- **界面**：所在屏的限定词，跨屏混淆时才加；
- **对象**：看到什么 / 做什么——语义主体，**必填**；
- **角色**：流程结构职责尾缀，**开放词族**（见下"槽位细则"）——`Start` / `End` / `Entry` / `Retry` / `Fallback` 之外按语义归族即合法，说明"它在流程里干嘛"；
- **变体**：同类兄弟节点的区分编号——`Type1`（同类不同皮肤）、`Route1`（同任务不同路线）、`V2`（改版），可多级与复合（见"槽位细则"），说明"它和同名兄弟差在哪"。

**槽位细则**：

- **角色词族**（开放，新词按语义归族，无需扩规则）：边界与编排——`Main`（主流程入口）、`Sub` / `Task`（子流程体 / 子任务入口）、`Loop` / `Dispatch`（循环体 / 分发器）、`Gate` / `Guard`（条件门 / 守卫）、`Node`（占位锚）、`Template`（参数覆写底版）、`Override` / `Disable`、`Pre` / `Post`（动作前后半步）、`NoNext`（去 next 克隆）、`Interrupt`（中断处理）；结果分支——`Success` / `Fail` / `Error` / `Done` / `Finish` / `Skip` / `Stop` / `Pass` / `Max`（买满上限）/ `NoMore` / `Met` / `Insufficient` / `Reached` / `Exhausted`…
- **角色 vs 对象判定线**：尾缀说"节点在流程里的职责 / 分支结果"→ 角色；说"画面上可观察的状态 / 结算屏"→ 对象。一词两读（`Failed`、`Max`、`Complete`）按实际职责裁决——next 里的 outcome 处理器是角色，识别某画面的节点是对象。
- **对象槽合法前缀**：否定 `No` / `Not` / `Cannot` / `Exclude`，或然 `Maybe`（不确定是否发生）；成对分支用同前缀配对（`SoldOut` / `NotSoldOut`），保证单侧 grep 找得到另一侧。
- **对象槽可承载复合动词短语**：单一节点的复合意图允许 And / Or 连接（`ScanAndScroll`、`TrackOrGoTo`）——是否拆成多节点是结构决策，不是命名违规。
- **通配限定词**：`Any` / `X`（任意屏 / 任意实例 / 任意章节）在界面位与对象位均合法。
- **变体槽可承载**：多级编号（`_1_1` 双轴，槽内允许下划线）、复合编码 / 区域代号 / 日期期号（不自明的代号在 desc 注明展开）、实现变体（`_OCR` / `_Rec` / `_HSV` / `_Template` 等按识别实现区分兄弟）、介词修饰（`WithX` / `ByX` / `AfterX`）。
- **单 `_` 前缀**：任务私有内部节点，与 `__`（全局内部工具）区分。
- **游戏内专名照抄**：关卡号（`2-1`）、含括号 / 连字符的物品名（`TinyGlobe(1)`）原样入对象槽，合法；数字代介词（`Back2`）、槽内小写蛇形段不推荐——风格告警级，不算违规。

| 节点类型 | 公式取槽 | 新式写法 | 存量对照 |
| --- | --- | --- | --- |
| 任务入口 / 收尾 | 任务 + `Start` / `End` | `AutoCollectDig_Start` | `AutoCollectDigStart` |
| 业务节点（每态一节点） | 任务 + [界面] + 对象 / 意图 | `DailyProtocolPass_InMenu`、`Awards_Claim` | `DailyProtocolPassInMenu` |
| 等待节点 | `Wait` + 对象 | `Wait_LoadingExit` | `WaitLoadingExit` |
| 验证节点 | `Verify` + 对象 | `Verify_NextScreen` | `VerifyNextScreen` |
| 弹窗 / 加载处理器 | 对象 + 动作 | `Dialog_Confirm`、`Popup_Close` | `DialogConfirm` |
| 重试 / 降级克隆 | 源名 + `Retry` / `Fallback` | `ClickConfirm_Retry` | — |
| 共享通用件 | **无任务前缀**，对象 / 能力本身，域前缀可选 | `CloseButton`、`Scene_AnyEnterWorld` | `SceneAnyEnterWorld` |
| 内部工具节点 | `__` + 动作 | `__AutoAltClickAltKeyDownAction` | 同 |
| 同类变体 | 名 + `Type1` / `Route1` / `V2` | `WhiteConfirmButton_Type1`、`Collect_Route1` | `ButtonType1` |

- **下划线是槽位分隔符，不是单词分隔符**——边界可 grep（`_InMenu` 一搜即整屏节点）、校验工具可按 `_` 机械切槽（例外：变体槽内的多级编号与复合编码自带下划线，从右侧识别变体段）、缩写边界无歧义（`OCR_Title`）。社区存量以纯 PascalCase 连写居多（右列），合法、不必改造，项目内统一即可。
- **语义主体必填**：名字必须能回答"看到什么 / 做什么"；界面、角色、变体槽位按需，不硬凑。`Wait` / `Verify` 等动词做主体时领先、对象随后（`Wait_LoadingExit`），限定槽仍从大到小在前。
- **界面限定**用于同任务跨屏且易混淆时（`InMenu`、`InWorld`）；单屏任务省略。
- **任务前缀与共享件互斥**：进 `general.json` 的节点不带任务前缀——它不属于任何任务，以对象本身或域前缀（`Scene_`）命名。
- **desc 承载名字装不下的展开与"为什么"，名字只承载"是什么 / 在哪 / 什么角色"**——desc 写预期界面、匹配特征、ROI 依据等名字挤不下的细节，及全部缘由与注意事项；名字不是句子，长而清晰好过短而含糊。

## image 文件名

协议层：

- **模板引用 = 相对 `image/` 目录的路径**（含目录）。细则：
    - **目录递归加载**：支持填写文件夹路径——递归加载其中所有图片，**多图任一命中**：同类元素的多皮肤 / 多形态收一个目录，任一匹配即命中，新增形态只补图不改 JSON；
    - **引用键纪律**：文件与目录名就是引用键，改名必须同步改 pipeline 引用**与 custom 代码内的读图调用**（自定义识别 / 动作可自行加载 `image/` 下的图，路径常经 PI_* 环境变量或项目约定取得，见 project-structure.md 非标目录）。
- 模板必须基于**无损原图缩放到基准分辨率（缺省 720p 短边，以项目 controller 配置为准）后裁剪**。
- 固定文件名不可改：`model/ocr/` 下 `rec.onnx`、`det.onnx`、`keys.txt`；`default_pipeline.json` / `default_pipeline.jsonc`（资源包根）。

约定层：

- 按功能模块分目录；文件名用元素 + 状态的语义命名，PascalCase 为主（`CharacterBar.png`、`EndSkill.png`、`CollectDailyAwards.png`）。
- 常见惯例：每个 pipeline JSON 对应一个 image 子目录；周期性活动图统一归入专门目录，随期归档。
- 跨平台项目建议 ASCII 文件名，避免大小写敏感文件系统上的引用错配；资源目录下文件夹禁 `_` 开头（Android 打包限制，见 project-structure.md）。
- **截取工具**。细则：
    - **agent 工作流**：优先观测底座（如 maafw-live）的 `crop`（从留存的原始分辨率帧裁，识别空间一致，裁后自匹配复核），或自写脚本走框架截图链路后程序化裁剪；
    - **人工截取**：官方工具（VSCode maa-support 插件、MFA 工具箱、MPE 等）；
    - **外部图片 / 游戏内截屏按像素空间一致判定**：模拟器自带截图在分辨率与控制器基准一致、无遮挡污染（通知栏 / 水印 / 有损压缩）时可直用；相机翻拍与比例不符的不可用；一律过裁后自匹配复核。

## OCR expected 与多语言

- `expected` 按当前语言直接书写；多语言 OCR 文案不手工维护——有 i18n 工具链的项目（如 `tools/i18n`）会自动生成各语言预期文本。
- `expected` 首选**完整文本**，截断/正则是兜底不是默认——仅当引擎对完整文本识别不稳（百分号、特殊符号、易混字符）才用片段，并在注释保留完整原文（`@i18n-skip` 注记）。
- 易混字、繁简差、全半角差写进 OCR 替换规则（`model/ocr/` 替换表），不靠放宽 `expected` 兜底。
