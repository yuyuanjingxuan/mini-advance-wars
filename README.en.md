<div align="center">

# ⚔️ Mini Advance Wars

**Zero-dependency turn-based strategy game · Inspired by GBA's Advance Wars**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](#-tech)
[![Vanilla JS](https://img.shields.io/badge/code-vanilla%20JS-blue)](index.html)
[![Platform](https://img.shields.io/badge/platform-web%20%7C%20any%20browser-lightgrey)](#-getting-started)

[简体中文](README.md) | **English**

</div>

---

A zero-dependency turn-based strategy game inspired by GBA's *Advance Wars*. No frameworks, no build step — just open `index.html` and play!

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Adjustable map size** | 8×8 / 10×10 / 12×12, random 180°-symmetric maps with connectivity check |
| 🪖 **4+2 unit types** | 🪖 Infantry · 🛡️ Heavy · 🚙 Recon · 🎯 Artillery (range 2-3, no counterattack) · 🔧 Engineer (2× capture + vehicle repair) · ⚕️ Medic (heals infantry) |
| ⚔️ **Type matchups** | Full damage multiplier table (heavy beats infantry, recon beats infantry but loses to heavy, etc.) |
| 🌲 **Terrain effects** | 🌲 Forest +20% DEF · ⛰️ Mountain +40% DEF (slow) · 🌊 River impassable · 🏙️ City +30% DEF & heals 2 HP per turn |
| 🚩 **City capture** | Advance Wars-style capture: only infantry/engineers can capture (engineer 2×), stand on a city and wait to build progress (progress = current HP, 20 to capture); captured cities fly your flag and can be taken back; capturing all cities also wins |
| 🔧 **Support units** | Engineer auto-repairs adjacent vehicles +3 HP; medic auto-heals adjacent infantry/engineers +4 HP |
| 💥 **Combat system** | 90% hit chance, 12% crit (×1.5), 0.7× counterattack, damage scales with remaining HP |
| ⬆️ **Leveling** | Gain XP from combat; level up grants +1 ATK, +1 DEF, +2 HP (cap Lv.V, excess XP converts to healing) — enemies level up too! |
| 🤖 **Enemy AI** | Heuristic AI evaluating damage, kills, terrain and danger; artillery keeps its distance |
| �️ **Move path preview** | Hover to see the move path with direction arrows after selecting a unit |
| 🔊 **Sound effects** | WebAudio chiptune SFX: start fanfare, per-unit attack/move sounds, crit, destroy explosion, level-up, capture, repair, heal, turn change, win/lose (mutable) |
| 📜 **Battle log & unit cards** | Real-time combat log (player blue / enemy red) and detailed unit info panel |
| 📖 **In-game help** | Unit stats table, color legend, terrain effects and combat rules |

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

- Pure HTML + CSS + JavaScript (**zero dependencies**, no frameworks, no build step)
- Clean structure: `index.html` (page) + `css/style.css` (styles) + `js/config.js` (config) + `js/audio.js` (SFX) + `js/game.js` (logic)
- Runs in any modern browser — double-click `index.html` works too (no ES modules / fetch, file:// friendly)

## 📄 License

[MIT](LICENSE)
