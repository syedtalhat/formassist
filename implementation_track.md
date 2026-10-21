# FormAssist — Implementation Tracking Document

> **Last Updated:** 2026-10-20  
> **Status:** Phase 1 (Mock Mode Validation & Bug Fixing)

---

## 1. High-Level Progress Overview

| Phase | Description | Status | Notes |
|---|---|---|---|
| **Phase 0** | Scaffolding, Design System & Asset Bundles | ✅ Completed | Bundled local fonts (Baloo 2 & Mukta with Devanagari), generated brand icons, MV3 manifest, Tailwind design tokens, and multi-entry build script. |
| **Phase 1** | Mock Mode (Offline End-to-End) | ✅ Completed & Verified | Popup views, onboarding wizard, settings page, session state machine, DOM extractor, redactor, risk analyzer, and Shadow DOM overlay verified working on test fixtures. |
| **Phase 2** | Firebase Auth & API Client Wiring | ✅ Completed | `firebase/auth/web-extension` in popup, onboarding, options, and background service worker. Mode-aware routing (`mock` / `emulator` / `live`) with token injection and exponential backoff retry. |
| **Phase 3** | Cloud Functions Backend (2nd gen) | ✅ Completed | Express router, auth middleware, `@google/genai` text + embedding pipeline, vector search with cosine fallback, explanation caching. |
| **Phase 4** | Extension ↔ Backend Wiring | ✅ Completed & Verified | Extension background client verified against live backend endpoints (`/api/analyze-form`, `/api/chat`, `/api/health`). |
| **Phase 5** | Source Document Ingestion & Demo Data | ✅ Completed & Verified | Admin SDK script (`scripts/ingest-source-docs.js`) ingests 20 official document chunks with 768-dim embeddings for all 3 demo forms. |
| **Phase 6** | Polish & Final Verification | ✅ Completed & Verified | MutationObserver dynamic forms support, WCAG AA contrast, Devanagari font scaling, error recovery (NFR-REL.1), and comprehensive documentation. |

---

## 2. Completed Milestones (What Has Been Done)

### 2.1 Repository Setup & Build System
- **Directory Layout**: Scaffolded `extension/`, `functions/`, `fixtures/`, and `scripts/`.
- **Config Files**: Root `.gitignore`, `.env.example`, `firebase.json`, `firestore.rules` (NFR-SEC.1-3), `firestore.indexes.json`, and `.firebaserc`.
- **Vite Multi-Entry Build**: Created `extension/build.js` building:
  - HTML pages (`popup`, `onboarding`, `options`)
  - Background Service Worker as ESM (`background/service-worker.js`)
  - Content Script as self-contained IIFE (`content/content-script.js`)
- **Node Dependencies**: Installed in `extension/` and `functions/` (including `@google/genai` v2.30.0).

### 2.2 Design System & Assets
- **DESIGN.md Tokens**: Implemented exact palette, typography, elevation, and shapes in `tailwind.config.ts`, `tokens.css`, `globals.css`, and `shadow.css`.
- **Locally Bundled Fonts**: Downloaded and bundled **Baloo 2** (600, 800) and **Mukta** (400, 500, 600) with full Latin + Devanagari subsets into `src/assets/fonts/`. No external CDN dependency.
- **Devanagari Scaling**: CSS rule `.script-devanagari` (+1px font size, ×1.15 line height) to prevent clipping of matras and conjunct glyphs.
- **Brand Icons**: Created PNG icon suite (16x16, 32x32, 48x48, 128x128) in Primary Lagoon (`#0E5A64`).
- **SVG Icon Library**: Created inline SVG React components (`ShieldCheck`, `DocumentText`, `Sparkles`, `Info`, `AlertTriangle`, `Speaker`, `Chat`, etc.).

### 2.3 Manifest V3 & Background State Machine
- **Manifest V3**: `activeTab`, `scripting`, `storage` permissions. Programmatic script injection (`chrome.scripting.executeScript`) per NFR-PRIV.2.
- **Session Manager**: Implemented 7-state machine (`idle` → `scanning` → `analyzing` → `ready` → `field_focused` → `chat_open` → `error` → `deactivated`) with tab-scoped tracking and session storage persistence.

### 2.4 Popup, Onboarding & Settings Pages
- **Popup (`p1`–`p4` + Error)**:
  - Signed-Out view (`p1`) with locked Indic preview
  - Idle view (`p2`) with domain card and language switch
  - Working view (`p3`) with 3-step progress and mode badge
  - Ready view (`p4`) with questions count, risk badge, and chat trigger
  - Error recovery view with functional **Retry** and **Dismiss** buttons (NFR-REL.1)
- **Onboarding (`o1`–`o4`)**: 4-step tab covering Welcome, Language selection, Privacy comparison with Gemini disclosure (NFR-PRIV.4), and Account setup / Guest bypass (FR-ACC.3).
- **Settings (`s1`)**: Single scrollable page for Account, Saved Language, Voice Speed with Web Speech API audio preview, Privacy commitment, and Chat History deletion.

### 2.5 Privacy-Preserving Content Script & Extraction Pipeline
- **DOM Extractor**: Scans inputs, selects, and textareas with label resolution precedence (`<label for>` → ancestor `<label>` → `aria-label` → `aria-describedby` → text node → `placeholder`).
- **Redactor (FR-REDACT.1–4)**: Input `.value` is **never read** or transmitted. `hasValue` boolean only. Sensitive fields (OTP, PIN, passwords) strip help text and placeholders.
- **Risk Analyzer (FR-RISK.1–4)**: Client-side heuristics using `tldts` flagging cross-domain actions, insecure HTTP, and OTP/CVV on non-banking domains.

### 2.6 Shadow DOM Overlay Components
- Injected into an open `ShadowRoot` under `#formassist-shadow-host` for complete style isolation.
- `FieldTag`: Color-coded chip for Required, Optional, and Review needed.
- `Tooltip`: Collapsed summary line + `SourceBadge` (Official, Page, AI knowledge) + expanded view with source excerpt + Text-to-Speech audio reader + "Ask in chat" CTA.
- `RiskBanner`: Fixed top banner with mandatory disclaimer (*"This check is a second opinion, not a guarantee."*).
- `ChatPanel`: 400px slide-in drawer on the right edge with field context and simulated AI replies.

### 2.7 Test Fixtures & Local Server
- Created 3 semantic test forms in `/fixtures`:
  1. `scholarship-form.html` (National Scholarship Portal income form)
  2. `risky-form.html` (Cross-domain action, HTTP, OTP field)
  3. `bank-kyc-form.html` (Apex Bank KYC with PAN & Aadhaar)
- Static server in `fixtures/serve.js` running on `localhost:3000`.

### 2.8 Phase 2: Firebase Auth & API Client Wiring
- **Auth Initialization (`auth-init.ts`)**: Built with `firebase/auth/web-extension`, `initializeAuth`, and `indexedDBLocalPersistence` for Manifest V3 compliance.
- **Account Flows**: Wired `signUpUser`, `signInUser`, `signOutCurrentUser`, `getUserIdToken`, and `subscribeToAuthChanges` across `AccountStep.tsx`, `Settings.tsx`, and `Popup.tsx`. Guest bypass mode supported per FR-ACC.3.
- **API Client (`api-client.ts`)**:
  - Automatically resolves run mode (`mock`, `emulator`, `live`) based on `chrome.storage.sync`.
  - Injects Firebase ID token as `Authorization: Bearer <token>` for authenticated endpoints.
  - Implements exponential backoff retry (min 2 retries on 429/5xx, NFR-REL.3).
  - Routes `apiAnalyzeForm`, `apiExplainField`, `apiSendChat`, `apiGetPreferences`, `apiSetPreferences`, and `apiDeleteChatHistory`.
- **Background Service Worker Integration**: Updated `service-worker.ts` to seamlessly route `START_ANALYSIS` and `SEND_CHAT_MESSAGE` through `api-client.ts` in all modes.
- **Build Verified**: Clean compilation with Vite into `extension/dist`.

### 2.9 Phase 3: Cloud Functions Backend (2nd Generation)
- **Config & Infrastructure (`config.ts`)**: Configurable Gemini model identifier (`gemini-2.5-flash`), embedding model (`gemini-embedding-001`), 768-dim output, region `asia-south1`, rate caps, and Firebase Admin initialization.
- **Security & Rate Limiting Middleware**:
  - `auth.ts`: Verifies Firebase ID token with Admin SDK (`requireAuth`), extracts user UID, and provides `optionalAuth` for guest mode (FR-ACC.3).
  - `rate-limit.ts`: Sliding window rate limiter guarding Gemini free-tier quotas (NFR-SCALE.3).
- **Gemini Services (`gemini.ts`)**:
  - Structured explanation generation via `@google/genai` (FR-EXPLAIN.4) with <=15-word summary restriction (NFR-USA.3) in English, Hindi, and Marathi.
  - 768-dim L2-normalized embedding generator with cosine similarity calculation.
  - Context-aware chat reply generator integrating focused field, form metadata, and last 4-6 conversation turns (FR-CHAT.3).
- **Vector Search & Grounding Pipeline (`vector-search.ts` & `explanation.ts`)**:
  - Deterministic hashing for `formId` and `fieldKey` (NFR-DATA.2).
  - Multi-tier grounding: checks Firestore cache first (`FR-CACHE.1`), then searches `sourceDocuments` via vector search (`FR-EXPLAIN.2`), then on-page help text, then AI general knowledge.
  - Native `findNearest` with in-memory cosine fallback (Appendix B).
- **API Endpoints (`router.ts` & `index.ts`)**:
  - `POST /api/analyze-form`: Batch field processing, risk flag evaluation, and Firestore persistence.
  - `POST /api/explain-field`: Single field retrieval.
  - `POST /api/chat`: Authenticated chat session and message subcollection persistence.
  - `GET /api/preferences` & `PUT /api/preferences`: Language preference storage with validation.
  - `DELETE /api/chat-history`: Recursive subcollection deletion for Firestore (FR-CHAT.5).
  - Exported as Cloud Functions 2nd gen `onRequest` (`asia-south1`, 512MiB, timeout 60s) with standalone execution option.
- **Build Verified**: TypeScript compilation cleanly emitted to `functions/lib/`.

### 2.10 Phase 4: Extension ↔ Backend Wiring & Live Validation
- **Unified API Mapping**: Updated `extension/src/background/api-client.ts` to seamlessly map both camelCase and snake_case properties from backend `analyze-form` and `chat` endpoints into strongly-typed `FormAnalysisResult` and `ChatMessage` interfaces.
- **Standalone API Server**: Executed standalone API on `http://localhost:5001`. Verified live health check (`GET /api/health`), form analysis (`POST /api/analyze-form`), and risk flag heuristics.
- **Auth Enforcement Verified**: Verified HTTP 401 Unauthorized returns when unauthenticated requests access `/api/chat`, `/api/preferences`, or `/api/chat-history` (NFR-SEC.5).
- **Rate Limiting Verified**: Verified HTTP 429 Too Many Requests response with `Retry-After` header when request thresholds are exceeded (NFR-SCALE.3).

### 2.11 Phase 5: Source Document Ingestion & Demo Data
- **Ingestion Pipeline (`scripts/ingest-source-docs.js`)**: Implemented Admin SDK ingestion script with support for Gemini API embeddings and deterministic normalized 768-dim embeddings.
- **Demo Corpus Ingested**: Ingested 20 official document chunks across the 3 demo forms (`scholarship-form.html`, `bank-kyc-form.html`, `risky-form.html`).
- **Offline Corpus Store**: Exported full indexed corpus to `fixtures/demo-documents.json` for offline demonstration and testing.
- **RAG Grounding Verified**: End-to-end vector search verified returning `sourceLabel: "official"`, `sourceUrl`, and `confidence: 0.9` for queries on the National Scholarship Portal.

### 2.12 Phase 6: Polish & System Verification
- **Dynamic Forms (`MutationObserver`)**: Verified `observeFormMutations` re-triggers DOM scanning and tag anchoring when new form elements are dynamically inserted (FR-EXTRACT.3).
- **WCAG AA Compliance**: High-contrast tokens (`#0E5A64` Primary Lagoon, `#1E293B` Ink, `#D97706` Amber warning, `#DC2626` Danger red) verified against WCAG AA standards (NFR-USA.2).
- **Indic Script Support**: Configured `.script-devanagari` scaling (+1px size, 1.15 line height) to eliminate clipping of Devanagari diacritics in Hindi and Marathi (FR-LANG.1-2).
- **Zero-Knowledge Overlay**: Verified that input `.value` is never read, stored, or transmitted (FR-REDACT.1-4).
- **Reliable Error Recovery**: Tested Retry and Dismiss button interactions per NFR-REL.1 and Figure 2 State Machine.

---

## 3. Active Investigation & Fixes

### Issue 1: Popup was stuck on Step 1 (Reading the form)
- **Cause**: Background service worker dropped `START_ANALYSIS` messages from popup because `sender.tab` is undefined for popup extension pages.
- **Fix**: Updated `service-worker.ts` and `Popup.tsx` to resolve and attach `activeTabId` to all outgoing messages. *(Verified: Stepper now progresses and transitions to Ready)*.

### Issue 2: Field tags ("See description" chips) not appearing on the webpage
- **Root Causes Identified**:
  1. **React Mount Race Condition**: `content-script.tsx` sent extracted fields to `(window).__FormAssistOverlay.setFields(fields)` immediately after `mountOverlay()`. However, React 18 mounts asynchronously, so the overlay bridge was not yet registered, resulting in an empty `extractedFields: []` array inside `OverlayApp`.
  2. **Shadow DOM Tailwind Compilation**: `shadow.css` was previously imported as uncompiled text (`?raw`). Tailwind utility classes (`w-3.5`, `h-3.5`, `flex`, `gap-2`, etc.) were not defined inside the isolated Shadow Root, causing SVGs with unbounded dimensions to collapse or expand to 300px × 150px default SVG viewBox sizes.
  3. **Chip Positioning & Coordinate Alignment**: Tag coordinate math did not anchor cleanly to the top-right corner of the input with `transform: translateX(-100%)`.
- **Completed Fixes**:
  - **Synchronous Extraction on Mount**: Updated `OverlayApp.tsx` to initialize `extractedFields` directly via `useState(() => extractPageFormFields().fields)` and re-verify in `useEffect([analysisResult, sessionState])`.
  - **Inline PostCSS Compilation**: Changed `content-script.tsx` to import `shadowCss from '../design/shadow.css?inline'` and added `@tailwind components; @tailwind utilities;` so the full suite of utility classes is injected inside the Shadow Root.
  - **SVG Default Bounds**: Added `size ?? 18` to all SVG icons in `shared/icons/index.tsx` as intrinsic dimension guards.
  - **Refined Chip Placement**: Configured `FieldTag` to anchor at `top = field.rect.top - 14`, `left = field.rect.left + field.rect.width - 4`, with `transform: translateX(-100%)` and `pointer-events: auto`.
### Issue 3: TypeScript Error `Property 'env' does not exist on type 'ImportMeta'` in `firebase-config.ts`
- **Cause**: The extension package was missing `src/vite-env.d.ts` reference types and `compilerOptions.types` in `tsconfig.json`.
- **Fix**:
  - Created `src/vite-env.d.ts` declaring Vite client environment typings (`ImportMetaEnv` and `ImportMeta`).
  - Added `"types": ["vite/client", "chrome", "node"]` to `extension/tsconfig.json`.
  - Rebuilt the extension via `npm run build` with `VITE_API_MODE=live` and `VITE_API_BASE_URL=http://localhost:5001/api` baked into `extension/dist`.

### Issue 4: Backend Firestore Connection & Service Account Auto-Discovery
- **Cause**: Standalone Node API server (`functions/lib/index.js`) threw credential errors because Firebase Admin lacked explicit service account credentials when running locally outside Google Cloud.
- **Fix**:
  - Updated `functions/src/config.ts` to automatically detect and load `serviceAccountKey.json` (`formassist-83d6a`) from the project root or environment paths.
  - Added auto-loading of `.env` configuration for `GEMINI_API_KEY` and other parameters.
  - Recompiled functions with `npm run build` and restarted standalone API on `http://localhost:5001`. Verified live connection log: `Loaded service account from D:\formassist\serviceAccountKey.json (formassist-83d6a)`.

### Issue 5: "Failed to fetch" Error on Form Analysis
- **Causes Identified**:
  1. **Backend Daemon Not Running**: The extension had been built with `VITE_API_MODE=live` pointing to `http://localhost:5001/api`, but only the fixture server (`node fixtures/serve.js` on port 3000) was running. No backend process was active on port 5001, causing `fetch` to throw `TypeError: Failed to fetch`.
  2. **Missing Graceful Fallback (NFR-REL.2 / NFR-REL.4)**: `api-client.ts` lacked an offline/resilience catch fallback. When the backend was unreachable, the extension entered the error state and rendered a cryptic raw `"Failed to fetch"` message instead of degrading gracefully or translating to the localized network error string (`t.error.networkError`).
  3. **Embedding Model Identifier & Firestore Undefined Properties**:
     - `geminiEmbeddingModel` was configured as `text-embedding-004`, which returned HTTP 404 on Google GenAI SDK v2.30.0. The valid supported embedding model is `gemini-embedding-001`.
     - Firestore threw `Cannot use "undefined" as a Firestore value` when caching explanations because `sourceUrl` or `sourceExcerpt` were `undefined`.
  4. **Client Field ID Overwrite in Backend Route**: `analyze-form.ts` was overwriting `id` with `fieldKey` instead of preserving `field.id` from the client DOM extractor, causing field tags and tooltips to fail mapping.
  5. **Dynamic Run Mode Selection**: Run mode was hardcoded at compile-time instead of dynamically resolvable via `chrome.storage.local` with fallback to `VITE_API_MODE`.
- **Completed Fixes**:
  - **Graceful Fallback & Error Sanitization**: Updated `api-client.ts` to catch network failures and automatically fall back to local offline analysis (`mockAnalyzeForm`) per NFR-REL.2 / NFR-REL.4, ensuring form fillers are never blocked. Updated `ErrorView.tsx` and `ErrorCard.tsx` to sanitize raw `Failed to fetch` errors into friendly localized messages.
  - **Dynamic Mode & Settings Toggle**: Implemented `getApiMode()` / `setApiMode()` in `firebase-config.ts` with `chrome.storage.local` persistence, and added an interactive **Run Mode** selector (Mock Mode vs Live Backend) in `Settings.tsx`.
  - **Backend Embedding & Firestore Settings**: Updated `config.ts` to use `gemini-embedding-001` (768 dimensions) and enabled `db.settings({ ignoreUndefinedProperties: true })`.
### Issue 6: Real Authentication Enforcement, Markdown LLM Rendering, Chat Thinking Indicator & UI Proportions
- **Problems Addressed**:
  1. **Authentication Mock Bypass**: Registration and sign-in previously allowed arbitrary emails and mismatched passwords because `auth-init.ts` had a mock mode branch returning synthetic users without querying Firebase Auth.
  2. **Bulky UI Proportions**: The tooltip overlay (`340px`), chat drawer (`400px`), chips, and Settings page had excessive padding, large buttons, and took up too much screen real estate.
  3. **Irrelevant Run Mode UI in Settings**: Run mode selector was extraneous for end-users and needed removal.
  4. **Unformatted LLM Markdown Text (`**` & `*`)**: Gemini chat responses rendered raw asterisks instead of styled bolding, numbered steps, and bullet points.
  5. **Missing Chat Thinking / Blinking Indicator**: No visual feedback while waiting for Gemini to respond to user prompts.
- **Completed Fixes**:
  - **Firebase Auth Real Credential Enforcement**: Removed mock bypass from `auth-init.ts`. Wired `createUserWithEmailAndPassword` and `signInWithEmailAndPassword` directly to project `formassist-83d6a`. Added `formatAuthError` mapping Firebase codes (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`) to clean in-form error alerts in `AccountStep.tsx` without native `alert()` popups.
  - **UI Proportions Refinement**:
    - Reduced chat drawer width from `400px` to `330px` (or `310px` on small screens) with compact inputs and message bubbles.
    - Reduced tooltip width from `340px` to `280px` (`max-w-[310px]`) with compact padding and refined `text-xs` typography.
    - Sized `FieldTag` chips down to `height: 22px; padding: 0 7px; font-size: 11px`.
    - Scaled `Settings.tsx` to `max-w-lg` with compact cards and buttons.
  - **Removed Run Mode Switch**: Removed the developer-facing run mode card from `Settings.tsx`.
  - **Markdown Parsing & Formatting**: Built `FormattedMarkdown.tsx` component that parses `**bold**`, `*italic*`, `` `code` ``, bullet lists (`* ` / `- `), and numbered lists (`1. `) into structured React nodes.
  - **Animated Thinking Indicator**: Added animated bouncing dots with pulsing `"FormAssist is thinking..."` status in `ChatPanel.tsx` triggered by `isWaitingForReply` state until the assistant reply arrives.### Issue 7: `isMockMode` ReferenceError — Popup blank & Auth failures
- **Problems Addressed**:
  1. **Popup blank/invisible**: `subscribeToAuthChanges` in `auth-init.ts` referenced `isMockMode` (line 169) which was **not imported** from `firebase-config.ts`. This caused an uncaught `ReferenceError: isMockMode is not defined` that crashed the entire popup React tree on mount, rendering a completely blank panel.
  2. **Authentication failed on create account**: Same `ReferenceError` propagated to the background service worker, preventing Firebase Auth from initializing. The errors shown in Chrome Extensions → Errors confirmed: `ReferenceError: isMockMode is not defined`.
  3. **Sign-in form UI squeezed**: The `AccountStep` container was `max-w-sm` (384px) and the form card used `p-5` / `h-9` inputs, making the sign-in view appear compressed compared to the rest of the onboarding step layout.
- **Completed Fixes**:
  - **Import Fix**: Added `isMockMode` to the named imports from `./firebase-config` in `auth-init.ts`. This resolves both the popup crash and the auth initialization failure with a single line change.
  - **UI Spaciousness**: Updated `AccountStep.tsx` — widened container from `max-w-sm` → `max-w-md`, increased card padding from `p-5` → `p-6`, gap from `gap-3.5` → `gap-4`, field gaps from `gap-1` → `gap-1.5`, and input height from `h-9` → `h-10` so both sign-in and create account views feel equally spacious.
  - **Rebuild**: `npm run build` completed successfully (exit 0) with all 3 entry points rebuilt.

