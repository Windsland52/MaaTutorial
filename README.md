# Maa 教程

MaaFramework（MaaFW）应用开发入门教程站，同时提供一套面向 AI 编程助手的开发态 Agent Skills。

教程站使用 [VuePress](https://v2.vuepress.vuejs.org/) 与 [vuepress-theme-plume](https://theme-plume.vuejs.press/) 构建，内容在 `docs/`，在线地址：<https://windsland52.github.io/MaaTutorial/>。Skills 在 `skills/`，供 Claude Code、Codex 等按需装载。

## Agent Skills

覆盖 MaaFW 应用开发的主要工作阶段，按意图分诊装载即可：

| Skill | 覆盖范围 |
| :--- | :--- |
| [`maafw-pipeline`](./skills/maafw-pipeline/SKILL.md) | 编写、修改与审查 Pipeline：任务与子流程拆分、节点编写与 ROI 圈定、next 链分支/循环/中断 |
| [`maafw-interface`](./skills/maafw-interface/SKILL.md) | 编写与审查 `interface.json`（Project Interface V2）：任务入口、GUI 选项接线、preset、import 拆分 |
| [`maafw-custom`](./skills/maafw-custom/SKILL.md) | 纯 JSON 表达不了的逻辑：Custom 识别/动作的判据、实现、注册与调试 |
| [`maafw-debug`](./skills/maafw-debug/SKILL.md) | 开发态调试与验收：识别失败、点击不落点、ROI 与阈值调参、流程卡死排查 |

```bash
# 列出仓库中可安装的 Skill
npx skills add https://github.com/Windsland52/MaaTutorial --list

# 全局安装全部 Skill
npx skills add https://github.com/Windsland52/MaaTutorial --global
```

分诊路由、能力边界与贡献者规范见 [`skills/README.md`](./skills/README.md)。

## 本地开发

```bash
pnpm install
pnpm docs:dev
```

## 构建站点

```bash
pnpm docs:build
```
