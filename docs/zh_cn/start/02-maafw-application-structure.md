---
title: MaaFW 应用常规结构
order: 2
---

这章带你认识一个 MaaFW 应用项目长什么样、每个部分负责什么。

后面的内容都以 [`create-maa-project`](https://github.com/Windsland52/create-maa-project) 生成的新项目结构为准。

## 项目结构一览

用脚手架创建的新项目，大致长这样：

```txt
my-project/
├── .github/workflows/                        # GitHub Actions 工作流
├── .vscode/                                  # VSCode 配置
├── resource/
│   └── base/                                 # 默认资源包（Bundle），写自动化逻辑的主要地方
│       ├── image/                            # 模板/特征匹配用的图片素材
│       ├── model/
│       │   └── ocr/                          # OCR 模型文件
│       ├── pipeline/
│       │   └── tutorial.json                 # Pipeline 节点定义文件（自动化流程的核心逻辑）
│       └── default_pipeline.json             # 通用默认配置
├── tasks/
│   └── tutorial.json                         # 任务配置：用户能选什么任务、选项
├── tools/                                    # 检查、格式化、发布脚本
├── interface.json                            # 项目接口：通用 GUI 读它来加载项目
├── package.json                              # dev-tools 依赖和脚本
├── README.md                                 # 项目说明文档
└── LICENSE
```

如果创建的是 Agent 项目（需要 Custom），在 pipeline 项目基础上多出这些：

```txt
my-project/
├── ...                                      # 其余文件、文件夹同 pipeline 项目
├── agent/
│   ├── custom/
│   │   ├── action/                          # 自定义动作
│   │   └── reco/                            # 自定义识别
│   ├── utils/                               # 辅助模块
│   ├── bootstrap.py                         # Agent 启动脚本（环境与依赖准备）
│   └── main.py                              # Agent 主入口
├── pyproject.toml                           # Python 项目配置
└── requirements.txt                         # Python 依赖
```

文件不少，但新手先重点关注三部分：

- `interface.json` — 项目接口
- `tasks/` + `resource/` — 任务的入口和执行的逻辑、资源
- `agent/` — 只有需要 Custom 时才会出现

## interface.json：项目接口

`interface.json` 是 MaaFW 项目的接口声明。通用 GUI 和工具通过它知道：项目叫什么、支持哪些控制器、加载哪些资源包、提供哪些任务入口等信息。

```jsonc
{
    "interface_version": 2,
    "name": "my-project",
    "controller": [
        {
            "name": "adb",
            "type": "Adb"
        }
    ],
    "resource": [
        {
            "name": "default",
            "path": [
                "./resource/base"
            ]
        }
    ],
    "import": [
        "./tasks/tutorial.json"
    ]
}
```

任务少可以直接写在 `interface.json` 里的 `task` 字段  
任务多，就拆到外部文件、用 `import` 导入，保持 `interface.json` 的简洁。这里用的是拆分写法。

`import` 进来的 `tasks/tutorial.json` 大致长这样：

```jsonc
{
    "task": [
        {
            "name": "Tutorial",
            "entry": "Tutorial.Start"
        }
    ]
}
```

两个新手常踩的坑：

- `resource[].path` 指向资源包**目录**，不是某个 Pipeline 文件。
- `task.entry` 指向 Pipeline **节点名**，不是 Pipeline 文件名。

## 一个任务实际怎么跑起来

运行前，通用 GUI 连接目标设备、加载资源。

运行时就是第一章说的"截图→识别→动作→下一节点"循环——具体每步做什么，全在 `resource/base/` 的 Pipeline 里。

下一章会介绍本地开发环境和常用工具，为动手编写第一个任务做好准备。
