<div align="center">

# ⚔️ 迷你高级战争

**单文件回合制战棋游戏 · 致敬 GBA《高级战争》**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](#-技术)
[![Single File](https://img.shields.io/badge/code-single%20file-blue)](index.html)
[![Platform](https://img.shields.io/badge/platform-web%20%7C%20any%20browser-lightgrey)](#-开始游戏)

**简体中文** | [English](README.en.md)

</div>

---

单文件回合制战棋游戏，致敬 GBA 平台《高级战争》。零依赖、零安装——双击 `index.html` 即可开玩！

## ✨ 游戏特性

| 特性 | 说明 |
|---|---|
| 🗺️ **可调地图规模** | 8×8 / 10×10 / 12×12，随机 180° 对称地图 + 连通性校验 |
| 🪖 **4 种兵种** | 🪖 步兵 · 🛡️ 重装兵 · 🚙 侦察车 · 🎯 火炮（射程 2-3，无法反击） |
| ⚔️ **兵种克制** | 完整克制倍率表（重装克步兵、侦察克步兵但被重装克等） |
| 🌲 **地形效果** | 🌲森林 +20%防 · ⛰️山地 +40%防（移动慢）· 🌊河流不可通行 · 🏙️城镇 +30%防且回合回血 2 |
| 💥 **战斗系统** | 命中 90%、会心 12%（×1.5）、反击 0.7 倍、伤害随残血降低 |
| ⬆️ **升级系统** | 战斗得经验，升级攻+1 防+1 HP+2——敌军同样会升级，速战速决！ |
| 🤖 **敌方 AI** | 评估伤害/击杀/地形/危险度的启发式 AI，火炮会自动保持距离 |
| 🔊 **音效** | WebAudio 芯片音效（可静音） |
| 📜 **战报与单位卡** | 实时战报日志与单位详情面板 |

## 🎮 玩法

1. **目标**：消灭全部敌军
2. 点击己方单位 → 点**蓝格**移动 → 点**红格**攻击
3. 行动完毕点**结束回合**，敌方 AI 随后行动

> 💡 森林/山地提供防御加成但移动缓慢；城镇每回合回复 2 HP；火炮射程 2-3 但无法贴脸反击。

## 🚀 开始游戏

**无需构建、无需安装：**

```bash
# 方式一：直接双击打开
index.html

# 方式二：本地服务器
python -m http.server 8765
# 然后访问 http://localhost:8765
```

## 📦 技术

- 纯 HTML + CSS + JavaScript **单文件**（约 700 行）
- 无框架、无依赖、无构建
- 任意现代浏览器直接运行

## 📄 许可证

[MIT](LICENSE)
