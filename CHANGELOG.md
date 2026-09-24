# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.1] - 2026-09-25

### Added

- **Selectable enemy difficulty**: six tiers — 😴 Trivial (×0.8), 🙂 Easy (×0.9), ⚖️ Normal (×1.0, default), 🔥 Hard (×1.1), 💀 Hell (×1.2), ☠️ Nightmare (×1.5) — scaling only enemy unit max HP (applies to both the starting roster and units built at enemy factories during the match). Fully independent of the AI style setting — difficulty scales numbers, AI style controls behavior, and either can be freely combined with the other

### Fixed

- Subtitle text on selected (highlighted) main-menu buttons was nearly unreadable — light gray text on a light blue selected background had almost no contrast. Subtitles on selected buttons now use a dark blue that's actually legible

## [1.0.0] - 2026-09-24

First stable release. Zero-dependency, single-file, turn-based strategy game inspired by GBA's *Advance Wars*.

### Added

- **Core gameplay**: PvE turn-based combat on a grid, move/attack ranges, hit/miss/critical hits, counterattacks, unit leveling (up to Lv.V) with XP from combat and support actions
- **9 unit types**: Infantry, Heavy Infantry, Recon, Artillery, Engineer, Medic, Tank, Rocket, and Transport, each with distinct stats, per-terrain movement costs, and a weapon/armor damage model (5 armor types × 5 weapon types, with dual-weapon units that switch weapons against vehicles vs. infantry-type targets)
- **Geographic map generation**: 8×8, 10×10, 12×12, 14×14, and 16×16 sizes, with procedurally generated mountain ridges, rivers with fords, and forest clusters, mirrored 180° for fairness and validated for connectivity
- **Building capture & ownership**: cities/factories/HQs start partially owned (each side's fixed rear buildings) and partially neutral (scattered map buildings); capture progress scales with unit HP, resets on leaving, and capturing the enemy HQ is an instant win
- **Economy & production**: no starting funds — income is settled from turn 1 based on owned buildings (+50/building/turn); production menu at owned factories with Advance Wars-proportioned unit costs
- **Configurable starting troops**: None / Few / Medium / Many tiers (0/3/6/9 units per side), each with a mandatory infantry unit plus a randomized pool that gates tanks and rockets to the "Many" tier only; spawn points cluster near each side's HQ
- **Transport unit**: unarmed carrier for foot units, with player-selectable disembark tiles (not a fixed default direction)
- **Selectable enemy AI styles**: Balanced, Aggressive, and Defensive, each with different risk tolerance, retreat behavior, and capture priorities
- **Bilingual UI** (中文/English) with instant runtime switching, in-game help covering unit stats, terrain effects, combat rules, and building capture
- **WebAudio SFX and dual-theme BGM** (upbeat for the player's turn, tense for the enemy's), move-path preview with directional arrows, and a live battle log color-coded by side
- **Responsive board**: cell size now fits the actual browser viewport instead of a fixed per-map-size lookup, recalculating on window resize
- **AGPL-3.0 licensing** with a commercial dual-licensing option (see `COMMERCIAL.md`) for uses outside AGPL's copyleft terms
- **CI workflow**: validates the embedded scripts execute correctly and runs a functional smoke test across all map sizes and troop tiers on every push/PR
- **GitHub Pages deployment workflow**: auto-publishes on every push to `main`

### Fixed (highlights from pre-1.0 development)

- HQ capture/ownership and win-condition logic (HQ now correctly starts owned by its side and can be captured to win)
- Capture progress no longer resets incorrectly for neutral buildings, and no longer marks a building as captured before progress is actually complete
- Indirect-fire units (artillery/rocket) no longer get an unintended range advantage by moving before firing, for either side
- Engineer/medic repair and heal now let the player pick a target instead of always acting on the first eligible unit found
- Tire vs. tread terrain movement costs rebalanced so lighter units are actually faster across relevant terrain
- Income log lines are now color-coded by side, matching every other combat log line
- Riders disembarking from a transport are no longer stuck permanently "acted" and unable to move afterward

[1.0.1]: https://github.com/yuyuanjingxuan/mini-advance-wars/releases/tag/v1.0.1
[1.0.0]: https://github.com/yuyuanjingxuan/mini-advance-wars/releases/tag/v1.0.0
