<div align="center">

# ⚔️ Mini Advance Wars

**Single-file turn-based strategy game · Inspired by GBA's Advance Wars**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](#-tech)
[![Single File](https://img.shields.io/badge/code-single%20file-blue)](index.html)
[![Platform](https://img.shields.io/badge/platform-web%20%7C%20any%20browser-lightgrey)](#-getting-started)

[简体中文](README.md) | **English**

</div>

---

A single-file turn-based strategy game inspired by GBA's *Advance Wars*. Zero dependencies, zero installation — just open `index.html` and play!

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Adjustable map size** | 8×8 / 10×10 / 12×12, random 180°-symmetric maps with connectivity check |
| 🪖 **4 unit types** | 🪖 Infantry · 🛡️ Heavy · 🚙 Recon · 🎯 Artillery (range 2-3, no counterattack) |
| ⚔️ **Type matchups** | Full damage multiplier table (heavy beats infantry, recon beats infantry but loses to heavy, etc.) |
| 🌲 **Terrain effects** | 🌲 Forest +20% DEF · ⛰️ Mountain +40% DEF (slow) · 🌊 River impassable · 🏙️ City +30% DEF & heals 2 HP per turn |
| 💥 **Combat system** | 90% hit chance, 12% crit (×1.5), 0.7× counterattack, damage scales with remaining HP |
| ⬆️ **Leveling** | Gain XP from combat; level up grants +1 ATK, +1 DEF, +2 HP — enemies level up too! |
| 🤖 **Enemy AI** | Heuristic AI evaluating damage, kills, terrain and danger; artillery keeps its distance |
| 🔊 **Sound effects** | WebAudio chiptune SFX (mutable) |
| 📜 **Battle log & unit cards** | Real-time combat log and detailed unit info panel |

## 🎮 How to Play

1. **Goal**: Destroy all enemy units
2. Click your unit → click a **blue tile** to move → click a **red tile** to attack
3. Click **End Turn** when done; the enemy AI then acts

> 💡 Forest/mountains grant defense bonuses but slow movement; cities heal 2 HP per turn; artillery has range 2-3 but cannot counterattack up close.

## 🚀 Getting Started

**No build, no install:**

```bash
# Option 1: just open the file
index.html

# Option 2: serve locally
python -m http.server 8765
# then open http://localhost:8765
```

## 📦 Tech

- Pure HTML + CSS + JavaScript in **one file** (~700 lines)
- No frameworks, no dependencies, no build step
- Runs in any modern browser

## 📄 License

[MIT](LICENSE)
