# FairSight — AI Bias Detection Platform

> **"Catch the bias. Before it catches someone."**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fairsight--26f55.web.app-blue)](https://fairsight-26f55.web.app)
[![Solution Challenge 2026](https://img.shields.io/badge/Solution%20Challenge-2026%20India-green)](https://developers.google.com/community/gdsc-solution-challenge)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%2B%20Auth%20%2B%20Firestore-orange)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Pro-purple)](https://ai.google.dev)

FairSight detects hidden discrimination in AI decision systems — in seconds, for free, with zero technical knowledge required.

---

## The Problem

Every day, AI systems make life-changing decisions about who gets a loan, a job, or medical care. These systems learn from historical data — data that reflects decades of human bias. The AI learns the bias. The bias gets automated. Real people get hurt.

**Real documented cases:**
- **Amazon (2018)** — AI hiring tool penalized resumes containing the word "women's"
- **COMPAS (2016)** — Court sentencing algorithm rated Black defendants 2x as likely to reoffend
- **US Hospitals (2019)** — Healthcare AI gave less care priority to Black patients
- **Indian Banks (2023)** — Credit scoring AI systematically rejected rural applicants

---

## What FairSight Does

Upload any CSV dataset → get a fairness score in seconds → download a compliance PDF.

### Core Features
- **Fairness Score 0-100** — Overall bias rating with color-coded risk level
- **4 Fairness Metrics** — Demographic parity, statistical parity ratio, 4/5ths rule, high-risk groups
- **Explainable Drill-Down** — Click any demographic group, Gemini explains exactly why they face bias
- **6-Regulation Compliance Mapper** — EU AI Act 2024, India DPDP Act 2023, US EEOC, RBI Fair Practices
- **Score Improvement Simulator** — Toggle fixes on/off and watch the projected score update in real time
- **Multi-Dataset Comparison** — Upload before and after datasets, see side-by-side improvement
- **Google Sheets Integration** — Import data directly from Google Sheets, no CSV download needed
- **Professional PDF Report** — 4-page compliance document with unique audit ID, regulatory citations
- **Audit History** — All audits saved to Firebase Firestore, track improvement over time
- **Intersectional Bias Detection** — Detects bias across combined demographic groups

---

## Tech Stack

| Technology | Usage |
|---|---|
| **Google Gemini 2.0 Flash** | Explains bias in plain English, generates fix recommendations |
| **Firebase Auth** | Google Sign-In for user accounts |
| **Firebase Firestore** | Stores audit history per user |
| **Firebase Hosting** | Live deployment at fairsight-26f55.web.app |
| **React** | Frontend framework |
| **Recharts** | Bias visualization charts |
| **Papa Parse** | Client-side CSV parsing — data never leaves browser |
| **jsPDF** | Professional compliance report generation |

---

## How to Run Locally
```bash
git clone https://github.com/YOUR_USERNAME/fairsight.git
cd fairsight
npm install
```

Create a `.env` file:
REACT_APP_GEMINI_KEY=your_gemini_api_key
REACT_APP_FIREBASE_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH=your_auth_domain
REACT_APP_FIREBASE_PROJECT=your_project_id
```bash
npm start
```

---

## Demo Datasets

FairSight works with any CSV. Try these real-world bias datasets:

| Dataset | Bias Type | Source |
|---|---|---|
| COMPAS Recidivism | Racial bias in criminal justice | ProPublica |
| Adult Income | Gender pay gap | UCI ML Repository |
| German Credit | Age and gender bias in lending | UCI ML Repository |

---

## Privacy

**All CSV processing happens entirely in the browser.** Your data never reaches our servers. FairSight uses Papa Parse for client-side parsing and processes everything in JavaScript memory. Only anonymized audit scores are saved to Firebase (when signed in).

---

## Regulatory Coverage

FairSight checks compliance against:
- EU AI Act 2024 — Article 10 (Data governance) and Article 13 (Transparency)
- India DPDP Act 2023 — Section 4 (Lawful processing) and Section 6 (Consent)
- US EEOC Guidelines — 4/5ths rule for employment selection
- RBI Fair Practices Code — Section 3 (Non-discriminatory lending)

---

## Built For

**Solution Challenge 2026 India — Unbiased AI Decision Track**

*Powered by Google Gemini API and Firebase*
