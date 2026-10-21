# FormAssist 🛡️

> **Plain-language form explainer and safety assistant for web forms.**
> Chrome Manifest V3 Browser Extension with Firebase & Google Gemini backend.

---

## 🌟 Overview

FormAssist acts as a calm, helpful older sibling guiding users through complex and confusing paperwork (such as scholarship applications, government portals, and banking KYC). It floats alongside forms, explains fields in plain language (**English**, **हिन्दी**, and **मराठी**), indicates source provenance (Official Guidelines, Host Page Text, or AI Knowledge), and alerts users to unusual or risky requests—**without ever reading or harvesting typed values**.

### Core Architecture & Privacy Invariants

- **Zero-Knowledge Overlay**: Field `.value` is **never read** or sent across the network (`hasValue` boolean only for chat context).
- **Shadow DOM Isolation**: All injected UI (tooltips, tags, risk banners, chat drawer) is rendered inside an isolated `ShadowRoot` so extension styles never collide with host web pages.
- **Local Font Bundling**: Baloo 2 and Mukta fonts are bundled directly inside the extension with complete Latin and Devanagari subsets. Zero remote CDN calls.
- **Three Run Modes**:
  1. `mock`: Runs 100% locally with canned explanations and risk analysis. No Firebase or Gemini account needed.
  2. `emulator`: Runs against local Firebase Auth, Firestore, and Cloud Functions emulators.
  3. `live`: Deployed Cloud Functions (`asia-south1`) on Firebase Blaze plan with Gemini API keys in Google Cloud Secret Manager.

---

## 📁 Repository Structure

```
formassist/
├── extension/                          # Chrome Manifest V3 Extension (React + Vite + Tailwind)
│   ├── public/                         # manifest.json, icons (16, 32, 48, 128)
│   ├── src/
│   │   ├── popup/                      # Extension popup (SignedOut, Idle, Working, Ready, Error)
│   │   ├── onboarding/                 # 4-step onboarding (Welcome, Language, Privacy, Account)
│   │   ├── options/                    # Settings page (Account, Language, Voice Audio, Privacy)
│   │   ├── background/                 # Service Worker & Session Manager (State Machine)
│   │   ├── content/                    # Programmatic content script (DOM Extractor, Redactor, Risk Analyzer)
│   │   ├── overlay/                    # Isolated Shadow DOM React app (FieldTag, Tooltip, Banner, Chat)
│   │   ├── shared/                     # Types, constants, i18n (en, hi, mr), mock data & API
│   │   └── design/                     # DESIGN.md tokens, globals, shadow CSS
│   └── dist/                           # Production extension build (ready to load unpacked)
│
├── functions/                          # Cloud Functions 2nd gen (Firebase Admin + @google/genai)
├── fixtures/                           # Test HTML forms & local fixture server
│   ├── scholarship-form.html           # National Scholarship Income verification form
│   ├── risky-form.html                 # Untrusted form with OTP, cross-domain action, HTTP
│   ├── bank-kyc-form.html              # Bank KYC form with PAN & Aadhaar
│   └── serve.js                        # Static server on localhost:3000
│
├── firebase.json                       # Firebase emulators & functions config
├── firestore.rules                     # Firestore security rules (NFR-SEC.1-3)
├── firestore.indexes.json              # Vector index definition for Firestore
└── .env.example                        # Environment variables documentation
```

---

## 🚀 Phase 1: Quickstart & Manual Testing

You can load and test FormAssist right now in **Mock Mode** without any Firebase account!

### 1. Build the Extension
```bash
cd extension
npm run build
```
*(The production bundle is already compiled into `extension/dist`)*

### 2. Start the Local Fixtures Server
In a separate terminal at the project root:
```bash
node fixtures/serve.js
```
The test forms are now accessible at:
- `http://localhost:3000/scholarship-form.html`
- `http://localhost:3000/risky-form.html`
- `http://localhost:3000/bank-kyc-form.html`

### 3. Load FormAssist into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/dist` directory (`d:\formassist\extension\dist`).
5. FormAssist will appear in your extensions list with its teal logo.

---

## 🧪 Manual Test Scenarios

### Scenario 1: First-time Field Explanation (UC-1)
1. Open `http://localhost:3000/scholarship-form.html` in Chrome.
2. Click the **FormAssist** icon in the Chrome toolbar.
3. Observe the popup showing the **Signed Out** or **Idle** view.
4. Click **Explain this page's form**.
5. Observe the 3-step progress: *Reading the form* → *Checking for anything unusual* → *Writing simple explanations*.
6. FormAssist transitions to **Ready** ("7 questions explained").
7. Look at the webpage: **Field tags** (`ⓘ See description`) appear next to each field:
   - Click the tag next to **Annual Family Income (INR)**.
   - The floating tooltip appears showing the plain-language summary and provenance badge (**From official source**).
   - Click **More** to view the full explanation and official clause excerpt.
   - Click **Listen** to hear text-to-speech reading the explanation.

### Scenario 2: Context-Aware Chat Follow-up (UC-2)
1. From the open tooltip on the Income field, click **Ask in chat** (or click **Ask a question** in the popup).
2. The **Chat drawer** slides in from the right edge with context: `Asking about: Annual Family Income (INR)`.
3. Type `"What if my parents do not have an income certificate?"` and press **Send**.
4. FormAssist replies with specific guidance based on official regulations.

### Scenario 3: Safety Review & Risk Flags (UC-3)
1. Navigate to `http://localhost:3000/risky-form.html`.
2. Click the FormAssist icon and click **Explain this page's form**.
3. Observe the **Form Safety Review** banner pinned at the top:
   - Flags the cross-domain action destination (`secure-collector.ru`).
   - Flags the OTP and PIN fields on a non-banking page.
   - Prominently displays: *"This check is a second opinion, not a guarantee."*
4. The OTP input chip is highlighted in Amber (`Review needed • ⓘ See description`).

### Scenario 4: Language Switching (UC-4)
1. Open the FormAssist popup while on any explained form.
2. Click **हिन्दी** (Hindi) or **मराठी** (Marathi).
3. Field tags, tooltips, and explanations immediately update into Devanagari script.
4. Font size and line height automatically scale (`.script-devanagari`), preventing any clipping of matras and conjunct glyphs.
5. Click **Listen** to hear text-to-speech spoken in Hindi/Marathi.

### Scenario 5: Error Recovery (UC-5)
1. If an error occurs or connection is dropped:
2. The popup and overlay display the friendly Error view (*"Something went wrong"*).
3. Clicking **Retry** re-triggers scanning.
4. Clicking **Dismiss** gracefully closes the error and returns to Idle.

---

## 🛠️ Backend & Ingestion Commands

FormAssist supports three execution modes (`mock`, `emulator`, and `live`):

### 1. Standalone Backend API (Port 5001)
To run the Node.js / Express backend API locally without requiring a Firebase cloud project:
```bash
npm run build:functions
$env:STANDALONE="true"; $env:PORT="5001"; node functions/lib/index.js
```
The API is now listening at `http://localhost:5001/api`.

### 2. Run Source Document Ingestion
To chunk, embed (768-dim L2-normalized), and index official source guidelines for the 3 demo forms:
```bash
npm run ingest
```
This indexes official guidelines to Firestore (if configured/emulator active) and writes the offline corpus index to `fixtures/demo-documents.json`.

### 3. Firebase Emulator Suite
To run the full suite (Auth on port 9099, Firestore on port 8080, Functions on port 5001, UI on port 4000):
```bash
firebase emulators:start
```

---

## 📋 Status & Requirements Traceability

All phases from Phase 0 through Phase 6 are **100% complete**:
- **Design Tokens & Local Fonts**: Compliant with [reference/mockups/DESIGN.md](file:///d:/formassist/reference/mockups/DESIGN.md) (Baloo 2 & Mukta with Devanagari, zero external CDN).
- **Zero-Knowledge Overlay**: Tested and guaranteed (FR-REDACT.1–4).
- **RAG Grounding**: 768-dim embeddings with Firestore native `findNearest` and cosine fallback (FR-EXPLAIN.2, NFR-DATA.1).
- **Indicators & Labels**: Clear provenance badges (*"From official source"*, *"From this page"*, *"AI's general knowledge"*) and safety disclaimers (*"This check is a second opinion, not a guarantee."*).
- **Live Progress Tracking**: Documented simultaneously in [implementation_track.md](file:///d:/formassist/implementation_track.md).

