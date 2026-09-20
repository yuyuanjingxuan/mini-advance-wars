# ⚔️ Mini Advance Wars / 迷你高级战争

A single-file turn-based strategy game (SRPG) inspired by GBA's *Advance Wars*. Zero dependencies, zero installation — just open `index.html` and play!

单文件回合制战棋游戏，致敬 GBA 平台《高级战争》。零依赖、零安装——双击 `index.html` 即可开玩！

---

## ✨ Features / 游戏特性

| Feature / 特性 | Description / 说明 |
|---|---|
| 🗺️ **Adjustable map size / 可调地图规模** | 8×8 / 10×10 / 12×12, random 180°-symmetric maps with connectivity check / 随机 180° 对称地图 + 连通性校验 |
| 🪖 **4 unit types / 4 种兵种** | 🪖 Infantry / 步兵 · 🛡️ Heavy / 重装兵 · 🚙 Recon / 侦察车 · 🎯 Artillery / 火炮 (range 2-3, no counterattack / 射程 2-3，无法反击) |
| ⚔️ **Type matchups / 兵种克制** | Full damage multiplier table (heavy beats infantry, etc.) / 完整克制倍率表（重装克步兵等） |
| 🌲 **Terrain effects / 地形效果** | Forest +20% DEF · Mountain +40% DEF (slow) · River impassable · City +30% DEF & heals 2 HP per turn / 森林 +20%防 · 山地 +40%防（移动慢）· 河流不可通行 · 城镇 +30%防且回合回血 2 |
| 💥 **Combat system / 战斗系统** | 90% hit chance, 12% crit (×1.5), 0.7× counterattack, damage scales with remaining HP / 命中 90%、会心 12%（1.5 倍）、反击 0.7 倍、伤害随残血降低 |
| ⬆️ **Leveling / 升级系统** | Gain XP from combat; level up grants +1 ATK, +1 DEF, +2 HP — enemies level up too! / 战斗得经验，升级攻+1 防+1 HP+2（敌军同样会升级） |
| 🤖 **Enemy AI / 敌方 AI** | Heuristic AI evaluating damage, kills, terrain and danger; artillery keeps its distance / 评估伤害/击杀/地形/危险度的启发式 AI，火炮会保持距离 |
| 🔊 **Sound effects / 音效** | WebAudio chiptune SFX (mutable) / WebAudio 芯片音效（可静音） |
| 📜 **Battle log & unit cards / 战报与单位卡** | Real-time combat log and detailed unit info panel / 实时战报日志与单位详情面板 |

## 🎮 How to Play / 玩法

1. **Goal / 目标**: Destroy all enemy units / 消灭全部敌军
2. Click your unit → click a **blue tile** to move → click a **red tile** to attack
   点击己方单位 → 点**蓝格**移动 → 点**红格**攻击
3. Click **End Turn** when done; the enemy AI then acts
   行动完毕点**结束回合**，敌方 AI 随后行动

## 🚀 Getting Started / 开始游戏

**No build, no install / 无需构建、无需安装：**

```bash
# Option 1 / 方式一：just open the file / 直接双击打开
index.html

# Option 2 / 方式二：serve locally / 本地服务器
python -m http.server 8765
# then open / 然后访问 http://localhost:8765
```

## 📦 Tech / 技术

- Pure HTML + CSS + JavaScript in **one file** / 纯 HTML + CSS + JavaScript **单文件**
- No frameworks, no dependencies / 无框架、无依赖
- ~700 lines of code / 约 700 行代码

## 📄 License / 许可证

MIT
