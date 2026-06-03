---
title: 代码高亮测试
order: 99
---

## 默认样式

```json
{
    "ClickStart": {
        "recognition": "OCR",
        "expected": "开始",
        "action": "Click",
        "next": ["Confirm"]
    },
    "Confirm": {
        "recognition": "OCR",
        "expected": "确认",
        "action": "Click"
    }
}
```

## 分区高亮

```json
{
    "ClickStart": {
        "recognition": "OCR",      // [!code warning]
        "expected": "开始",         // [!code warning]
        "action": "Click",         // [!code ++]
        "next": ["Confirm"]        // [!code highlight]
    },
    "Confirm": {
        "recognition": "OCR",      // [!code warning]
        "expected": "确认",         // [!code warning]
        "action": "Click"          // [!code ++]
    }
}
```

## 分区高亮（行号法）

```json {4-7,9-11}
{
    "ClickStart": {
        "recognition": "OCR",
        "expected": "开始",
        "action": "Click",
        "next": ["Confirm"]
    },
    "Confirm": {
        "recognition": "OCR",
        "expected": "确认",
        "action": "Click"
    }
}
```

## 聚焦效果

```json
{
    "ClickStart": {
        "recognition": "OCR",      // [!code focus]
        "expected": "开始",         // [!code focus]
        "action": "Click",         // [!code focus]
        "next": ["Confirm"]        // [!code focus]
    },
    "Confirm": {
        "recognition": "OCR",
        "expected": "确认",
        "action": "Click"
    }
}
```
