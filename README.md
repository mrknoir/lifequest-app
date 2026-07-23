# ⚡ LifeQuest Master Protocol

> Turn your daily routines into a high-stakes cyberpunk RPG. Level up your stats, stay accountable with dynamic streak mechanics, and track your personal growth—100% offline, privacy-first, and built with pure Vanilla JS.

> [!NOTE]
> **Educational & Vibecoded Project 🧪**  
> This is my first **vibecoded** application, created for educational purposes as a sandbox to explore client-side Web APIs (Web Audio API, LocalStorage, DOM state sync) and dynamic RPG math mechanics in active collaboration with AI tools.

---

## 🌟 Overview

**LifeQuest Master Protocol** gamifies productivity without the clutter of heavy web frameworks. It treats everyday habits, routines, and task lists like system protocols: earn XP, equip cyberware stat buffs, navigate **Chrono Decay**, and manage system threat levels when slacking off.

Built completely on client-side web standards, LifeQuest requires zero backend infrastructure, zero external sound asset files (`.mp3` or `.wav`), and zero build steps—delivering maximum performance with instant load times.

---

## ✨ Key Features

* **🔊 Procedural Web Audio Engine:**
  * Uses the browser's native `AudioContext` and dynamic oscillators (`square`, `sawtooth`, `sine`) to procedurally synthesize sound effects (level ups, item shatters, ambient throbs) on the fly without downloading external audio assets.

* **⚔️ RPG Leveling & Cyberware Buffs:**
  * Uses a dynamic mathematical scaling curve to calculate progression across primary attributes (Strength, Intelligence, Discipline, Charisma) with unlockable passive yields.

* **⚠️ Threat Level & Chrono Decay:**
  * High-stakes accountability mechanics featuring real-time streak multipliers, time-of-day penalty decay, and emergency system lockdowns.

* **📜 SOP Codex & Black Ice Operations:**
  * Structured operational manuals for habit loops, actionable task queues, and routine overclocking.

* **📊 Visual Telemetry Analytics:**
  * Interactive skill distribution radar charts and completion history rendering directly on HTML5 `<canvas>` elements powered by **Chart.js**.

* **🛡️ Local-First & Privacy Preserving:**
  * All state transitions and inventory items persist securely in the browser's `localStorage`—no user data ever leaves your device.

---

## 🛠️ Tech Stack

| Category | Technology | Usage in App |
| :--- | :--- | :--- |
| **Core Logic** | **Vanilla JavaScript (ES6+)** | State management, RPG math formulas, timer loops, and dynamic DOM manipulation. |
| **UI & Styling** | **Bootstrap 5 & Icons** | Responsive layout grid, cyberpunk dark styling, and modal components. |
| **Audio Engine** | **Native Web Audio API** | Real-time synthesized sound effects using dynamic oscillators and LFO modulation. |
| **Data Visualization** | **Chart.js** | Interactive radar skill maps and telemetry charts via HTML5 `<canvas>`. |
| **Data Storage** | **HTML5 LocalStorage** | 100% client-side data persistence for tasks, stats, and inventory. |

---

## 📐 Leveling Mechanics

XP scaling follows a quadratic progression curve to ensure smooth early progression while keeping late-game levels challenging:

$$LVL = \left\lfloor \sqrt{\frac{XP}{500}} \right\rfloor + 1$$

---

## 🚀 Quick Start

Because **LifeQuest** is 100% client-side, there are **no dependencies, build steps, or `npm install` required**.

### 🌐 Option 1: Try the Live Demo (Instant)
Experience the app directly in your browser without cloning:  
👉 **[Launch LifeQuest Protocol](https://my-lifequest.netlify.app/)**

---

### 💻 Option 2: Run Locally (2 Steps)

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git](https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git)
   cd YOUR-REPO-NAME
   
