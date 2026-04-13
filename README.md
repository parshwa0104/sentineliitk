# SENTINEL: Behavioral Finance Terminal 🛡️

**Sentinel** is an institutional-grade, real-time behavioral finance dashboard designed to detect emotional trading patterns and intercept poor financial decisions before they are executed. Built as a proof-of-concept for the IITK Case Study, it bridges the gap between traditional brokerage platforms and behavioral psychology.

## 🎯 The Problem
Retail and institutional investors alike suffer from cognitive biases—most notably **Loss Aversion**, **Panic Selling**, and **FOMO** (Fear of Missing Out). During extreme market volatility, human psychology often overrides rational strategy, leading to wealth destruction. Traditional trading platforms execute orders instantly, enabling these highly emotional errors rather than preventing them.

## 💡 The Solution
Sentinel operates as a proactive "cognitive firewall" between the trader and the market. By continuously analyzing an operator's real-time actions against their historical baseline and current market conditions, Sentinel calculates a live **EVI (Emotional Volatility Index)**. When a trader attempts to execute a high-risk action (like panic-liquidating an entire portfolio during a tiny dip) while in a highly emotional state, Sentinel intervenes.

## ✨ Core Features

### 1. Emotional Volatility Index (EVI) Engine
At the heart of the system is the EVI, a proprietary metric scored from 0 to 100. It is calculated in real-time by ingesting:
- **Market Conditions:** Rapid portfolio drawdowns or intraday index dips.
- **Trader Actions:** Frequency of portfolio checks, rapid cancellation/modification of orders, and erratic navigation patterns.
- **Micro-behaviors:** Derived from direct operator inputs and historical baseline deviation. 
When the EVI crosses the **Critical Threshold (60+)**, the system switches from passive monitoring to active intervention.

### 2. Friction-Based Intervention Mechanics
If an operator attempts to sell an asset while their EVI is elevated, Sentinel deploys a friction-based intervention modal. 
- **Cognitive Reset:** Forces a mandatory 5-second countdown before the "Confirm Sell" button unlocks.
- **Rational Injection:** Displays immediate, objective counter-evidence (e.g., "This asset recovered 80% of the time during similar historical dips").
- **Cost Analysis:** Shows the exact quantified cost of the behavioral bias (e.g., "Panic selling now realizes a ₹2,500 loss against your core thesis").

### 3. AI Behavioral Coach (Sentinel.AI)
An integrated LLM-powered assistant configured specifically for behavioral finance. It acts as an on-demand trading psychologist. 
- **Context-Aware:** The AI knows the trader's current portfolio state, their live EVI score, and recent trading actions.
- **De-escalation:** If asked "Should I sell everything?", the AI responds not with financial advice, but with psychological grounding, challenging the trader to articulate their fundamental thesis.
- **Offline Resiliency:** Features built-in cached recovery narratives so the behavioral coaching functions even in demo/offline modes.

### 4. Advanced Behavioral Analytics
A dedicated intelligence command center displaying the trader's psychological profile over time.
- **Cognitive Bias Radar:** Visualizes dominant biases (Loss Aversion, Recency Bias, Anchoring).
- **Intervention Tracking:** Tracks how many panic trades were attempted, how many were successfully blocked by the system, and the hypothetical capital saved by those interventions.

## 🚀 Technical Architecture
Sentinel is built for speed, security, and resilience. 

**Frontend (Client):**
- Built with **React** and **Vite** for lightning-fast HMR and optimized builds.
- Styled with modern, raw CSS to achieve a highly responsive, zero-distraction "Terminal" aesthetic.
- Employs `recharts` for dynamic data visualization and `axios` through a centralized API interceptor for robust error handling.
- **Offline-First Demo Architecture:** The frontend can run 100% autonomously without a backend, gracefully degrading into a highly functional demo mode featuring simulated market ticks and mocked REST payloads—perfect for hackathon presentations.

**Backend (Server):**
- **Node.js / Express** server optimized for high-throughput behavioral event logging.
- **MongoDB** integration for persistent storage of user profiles and granular behavior events.
- Hardened with **Helmet** (anti-clickjacking, strict referrer policies) to ensure platform security.
- Prevents mass-assignment vulnerabilities via strict schema destructuring.

## 🏁 Goal
Sentinel doesn't just show you how much money you have. It actively stops you from losing it to your own psychology.
