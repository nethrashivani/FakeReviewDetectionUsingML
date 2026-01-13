# 🛍️ Product Trust Analyzer (Chrome Extension)

A browser extension that analyzes **product reviews in real time** and helps users decide whether a product is **worth buying**, **risky**, or has **mixed reviews** — using **visible user reviews + platform-wide review summaries**.

> Built to work with modern, React-based e-commerce websites like **Meesho**.

---

##  Features

### Hybrid Review Analysis (Current)

The extension uses **two sources of truth**:

1. **Sampled Truth (Visible Reviews)**

   * Reads reviews currently rendered on the screen
   * Automatically adapts when users click **“View all reviews”** or scroll
   * Supports:

     * English
     * Hinglish (Hindi written in English)
     * Emoji-based reviews (👍 ❤️ 😡 etc.)

2. **Aggregate Truth (Platform Summary)**

   * Extracts:

     * Total number of reviews
     * Average rating
     * Rating distribution (Excellent / Good / Poor)
   * Represents the sentiment of **all users**, not just the visible ones

These two signals are combined to produce a **final trust decision**.

---

## Decision Output

The extension displays a clear and explainable verdict:

* ✅ **Worth Buying**
* ⚠️ **Mixed Reviews**
* ❌ **Risky Product**

Along with:

* Number of visible reviews analyzed
* Total reviews on the platform
* Average rating
* Sampled sentiment score
* Negative review ratio
* Confidence score (how reliable the decision is)

---

## 📊 Confidence Scoring (Rule-Based)

Confidence is calculated using:

* Total number of reviews (crowd size)
* Average rating stability
* Agreement between visible reviews and aggregate ratings
* Presence of negative sentiment

This ensures the extension is:

* Honest
* Transparent
* Explainable

---

## Machine Learning (Planned / In Progress)

Machine Learning is **intentionally not yet integrated**.

### Why?

At this stage:

* Rule-based logic provides **better explainability**
* Easier debugging and validation
* More control over edge cases
* Clear understanding of important features

### Planned ML Integration

A supervised ML model will be introduced to:

* Learn optimal weights for:

  * Sentiment
  * Rating
  * Review count
  * Negativity
* Generalize decisions across multiple platforms
* Output probability-based trust scores

The current system is already **ML-ready**, with structured features being collected.

---

##  How It Works (High-Level)

```
User opens product page
        ↓
User scrolls / opens reviews
        ↓
Extension reads:
  - Visible reviews (sample)
  - Platform summary (aggregate)
        ↓
Sentiment + confidence analysis
        ↓
Trust decision shown in popup
```

---

##  Tech Stack

* JavaScript (ES6)
* Chrome Extensions API (Manifest v3)
* DOM parsing & analysis
* Rule-based NLP (emoji + Hinglish support)

---

## Limitations (Known & Accepted)

* The extension reads **only reviews rendered in the DOM**
* Some platforms use **virtualized lists**, limiting simultaneous access to all reviews
* No backend scraping (to respect platform ToS)

These limitations are handled using **sampling + aggregate summaries**, similar to real-world trust systems.

---

## 🌱 Future Enhancements

* 🤖 ML-based trust prediction
* 📊 Visual confidence meter UI
* 🌍 Multi-platform support (Amazon, Flipkart)
* 🔄 Automatic re-analysis on scroll
* 📈 Dataset export for ML training

---

## 📌 Project Status

🟢 **Active Development**
🧠 **Machine Learning: In Progress**
🚀 **Core functionality complete and stable**

---

## 🙌 Motivation

Online reviews can be misleading, fake, or overwhelming.
This project aims to provide a **clear, explainable trust signal** to help users make smarter purchasing decisions — without reading hundreds of reviews.

---

