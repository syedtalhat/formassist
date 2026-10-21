# Software Requirements Specification

## FormAssist — A Context-Aware Browser Extension for Form-Filling Accessibility

**Version:** 1.2 (Firebase + no-cost hosting revision)
**Prepared for:** HCI Course Project (CSE)
**Target stack:** Browser Extension (Manifest V3) · Google Gemini API (free tier) · Firebase on the no-cost Spark plan (Authentication + Cloud Firestore) · Backend API hosted on a free serverless host (Vercel Hobby), portable to Cloud Functions for Firebase

---

## Revision History

| Version | Change |
|---|---|
| 1.0 | Initial specification (Supabase: Postgres + pgvector + Auth). |
| 1.1 | **Backend pivot from Supabase to Firebase.** Postgres/RLS/pgvector replaced by Cloud Firestore, Firebase Security Rules and Firestore vector search; Supabase Auth replaced by Firebase Authentication; Edge Functions replaced by Cloud Functions for Firebase. Figure 3 is now a **Firestore Data Model** (was an ERD). Figures 1 and 2 are unchanged except the D2 label in Figure 1. |
| 1.1 | Clarifications folded in while editing (not caused by the pivot): FR-REDACT.4 (sensitive fields keep structure only), revised FR-CHAT.2 (fill-state is a boolean only), explanation records gain `summary` / `sourceExcerpt` / `confidence`, NFR-SEC.4 reworded (public Firebase web config is allowed; Gemini key and service credentials are not), model-ID guidance made configurable, FR-CHAT.5 added (delete chat history), NFR-PERF.1 qualified for cold starts. |

| 1.2 | **No-card / no-cost deployment.** Cloud Functions for Firebase (which needs the paid Blaze plan) is replaced by a stateless Node.js + TypeScript API hosted on Vercel's free Hobby plan. Firebase stays, but only Authentication and Firestore on the free Spark plan; the API reaches Firestore through the Admin SDK with a service-account key held in an environment variable. Added NFR-PRIV.4 (free-tier Gemini data-use disclosure) and NFR-REL.4 (free-tier rate limits). Handler code must stay host-agnostic. |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for **FormAssist**, a browser extension that explains web-form fields in plain, source-grounded language, flags unusual or risky field requests, and provides a context-aware chat assistant — targeted at low-literacy, first-generation, and non-native-language users filling out government, banking, and institutional forms. It is intended to be precise enough to drive implementation directly: every functional requirement below maps to a process in the Data Flow Diagram (Figure 1), every major UI state maps to the State Transition Diagram (Figure 2), and every data requirement maps to the Firestore Data Model (Figure 3).

### 1.2 Document Conventions
- Requirement IDs follow the pattern `FR-<feature>.<n>` for functional requirements and `NFR-<category>.<n>` for non-functional requirements.
- Priority levels: **Must** (MVP-blocking), **Should** (important, not blocking), **Could** (stretch goal).
- "The system" refers to the combination of the browser extension client and its backend API, unless a sub-component is named explicitly.

### 1.3 Intended Audience
The project developer (implementation reference), the course evaluator/faculty (requirements traceability and scope justification), and any future contributor onboarding onto the codebase.

### 1.4 Project Scope
FormAssist operates **on top of existing, unmodified third-party web forms** — it does not require form owners (government portals, banks, institutions) to make any change. It is scoped, for this course project, to a small set of pre-indexed real-world forms for grounded, high-confidence explanations (see §2.5), with graceful, clearly-labeled fallback behavior on any other form the user activates it on. The extension never transmits values the user has typed, only field *structure* (labels, types, placeholders).

Out of scope for v1.0: automated form-filling/autofill, support for non-Chromium browsers, support for canvas-rendered or Flash-style forms, and languages beyond English, Hindi, and Marathi.

### 1.5 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|---|---|
| RAG | Retrieval-Augmented Generation — grounding an LLM response in retrieved source documents rather than the model's memorized knowledge |
| DOM | Document Object Model — the browser's in-memory representation of a web page |
| MV3 | Chrome Extension Manifest Version 3, the current extension platform standard |
| Security Rules | Firebase Security Rules — declarative access control evaluated by Cloud Firestore for every client request. The Admin SDK used by Cloud Functions bypasses them |
| Firestore vector search | Firestore's native nearest-neighbour search over vector fields (`findNearest`), used here for RAG retrieval. Server-side client libraries only; maximum 2048 dimensions |
| Admin SDK | Privileged server-side Firebase/Google Cloud SDK used inside Cloud Functions; the only component allowed to write reference data |
| ID token | Short-lived JWT issued by Firebase Authentication; the extension presents it to the backend, which verifies it with the Admin SDK |
| Emulator Suite | Firebase local emulators (Auth, Firestore, Functions) used for development without a cloud project |
| TTS | Text-to-Speech |
| PK / FK | Primary Key / Foreign Key |

### 1.6 References
- Google Gemini API documentation — https://ai.google.dev/gemini-api/docs
- Firebase documentation — https://firebase.google.com/docs
- Authenticate with Firebase in a Chrome extension (Manifest V3) — https://firebase.google.com/docs/auth/web/chrome-extension
- Firestore vector search — https://firebase.google.com/docs/firestore/vector-search
- Vercel Functions — https://vercel.com/docs/functions (free Hobby plan hosts the backend API)
- Cloud Functions for Firebase — https://firebase.google.com/docs/functions (optional later hosting target)
- Chrome Extensions (Manifest V3) documentation — https://developer.chrome.com/docs/extensions/mv3/
- Nielsen, J. — *10 Usability Heuristics for User Interface Design*
- WCAG 2.2 — Web Content Accessibility Guidelines

---

## 2. Overall Description

### 2.1 Product Perspective
FormAssist is a new, standalone browser extension. It is not a replacement for any existing form platform; it is an assistive overlay that activates on top of whatever page the user is currently viewing. It communicates with a backend service (hosted independently of any target website) for explanation generation, risk analysis logging, and chat.

### 2.2 Product Functions (Summary)
1. Extract the structure of form fields on the active page.
2. Redact and exclude sensitive data locally before any network transmission.
3. Classify each field's risk level and requirement status.
4. Generate plain-language, source-labeled explanations for each field (grounded where possible, AI-labeled otherwise).
5. Present explanations in-context via a progressive-disclosure tooltip system.
6. Provide a context-aware chat for follow-up questions.
7. Support language switching (English / Hindi / Marathi) and text-to-speech playback.
8. Manage user accounts and persisted preferences.

### 2.3 User Classes and Characteristics

| User Class | Characteristics | Primary Needs |
|---|---|---|
| Primary: Low-literacy / first-generation form-filler | Limited familiarity with bureaucratic/English terminology; may rely on a family member normally | Plain-language, audio-supported, trustworthy field explanations |
| Secondary: General cautious user | Literate but unfamiliar with a specific form or wary of phishing-like requests | Risk flags, quick field clarification |
| Administrator (project author, for the MVP demo) | Technical | Curates pre-indexed source documents per demo form via the admin/indexing pipeline |

### 2.4 Operating Environment
- **Client:** Any Chromium-based browser supporting Manifest V3 (Chrome, Edge, Brave) on desktop. Minimum viewport width 1024px for the injected panels (mobile browser extensions are out of scope).
- **Backend:** A stateless Node.js + TypeScript HTTPS API (one handler with internal routes) deployed to Vercel (Hobby plan, no payment card). Handler code is host-agnostic (standard request/response), so it can later be redeployed to Cloud Functions for Firebase without changes to the extension. Secrets (Gemini API key, Firebase service-account JSON) live in the host's environment variables and are never committed or shipped in the extension.
- **Database:** Cloud Firestore (Native mode) with a vector index for RAG retrieval. Firestore location is chosen once at project creation and cannot be changed later; `asia-south1` (Mumbai) is recommended for India-based users, with Cloud Functions deployed to the same region.
- **Authentication:** Firebase Authentication (email/password) using the `firebase/auth/web-extension` entry point (Firebase Web SDK v10.8.0 or later).
- **Local development:** Firebase Emulator Suite (Auth, Firestore) plus the API run locally, plus a front-end mock mode, so the whole system can be developed and demonstrated without any cloud project.
- **External AI service:** Google Gemini API, reached only from the backend — never directly from the extension client.

### 2.5 Design and Implementation Constraints
- The extension must use **Manifest V3** (Manifest V2 is deprecated/unsupported in current Chrome).
- The Gemini API key and any service-account credentials must never be embedded in client-side/extension code. The Firebase **web app configuration** (`apiKey`, `projectId`, `authDomain`, etc.) is a public identifier by design and may be embedded; data access is protected by token verification in the backend and by Firestore Security Rules, not by hiding that configuration.
- The project shall run entirely on **no-cost plans** and assume **no payment card**: Firebase Spark (Authentication, Firestore, Security Rules), Vercel Hobby (API hosting) and the Gemini API free tier. Cloud Functions for Firebase is not used because it requires the paid Blaze plan. Free-tier quotas change; check current limits at build time and keep them in configuration.
- **Gemini free-tier data use:** content sent to the Gemini API on the free tier may be used by Google to improve its products and may be read by human reviewers. This is acceptable only because the system sends form *structure* and chat messages, never typed form values; the product must not claim otherwise (NFR-PRIV.4).
- For the MVP, grounded (non-AI-labeled) explanations are only guaranteed for a small set of pre-indexed demonstration forms (recommended: 2–3 real forms, e.g., one scholarship application, one bank KYC form). Any other form falls back to page-text grounding where available and AI-general-knowledge otherwise — this fallback must be visibly labeled to the user, never silently presented as verified.
- Gemini model identifiers change over time; at implementation time, confirm the current stable model ID against `https://ai.google.dev/gemini-api/docs/models` rather than hard-coding any ID. Both IDs below must live in configuration (NFR-MAIN.1). As of this document's writing (October 2026):
  - **Text generation (explanations + chat):** default `gemini-3.5-flash` (stable, Flash-tier, suited to a high call-volume, non-safety-critical assistive task). `gemini-3.6-flash` is a newer option that was reported without a retirement date; verify its availability tier before preferring it. Do not use `gemini-2.5-*` (scheduled for retirement on 16 Oct 2026).
  - **Embeddings (RAG retrieval):** `gemini-embedding-001`, requested with `outputDimensionality = 768` and L2-normalised. Firestore vector fields support at most 2048 dimensions, so the model's larger default output **must** be truncated. Documents and queries must use the same model, dimension and normalisation. Confirm the current stable embedding model at build time. (`text-embedding-004` is deprecated — do not use it.)

### 2.6 Assumptions and Dependencies
- The target form's fields are standard HTML form elements (`<input>`, `<select>`, `<textarea>`) with resolvable labels; fully custom canvas/WebGL-rendered forms are not supported.
- The user has a Google Gemini API-reachable network path from the backend's hosting environment.
- Pre-indexed source documents (for grounded explanations) are prepared and embedded ahead of the demo/evaluation session; this is a manual or semi-automated curation step, not a runtime capability in v1.0.

---

## 3. System Features (Functional Requirements)

Each feature below corresponds to a numbered process in the Level-1 Data Flow Diagram (**Figure 1**).

### 3.1 Extract Form Structure — *(DFD Process 1.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-EXTRACT.1 | On user activation (toolbar icon click), the content script shall scan the active tab's DOM and identify all `<input>`, `<select>`, and `<textarea>` elements within `<form>` boundaries. | Must |
| FR-EXTRACT.2 | For each field, the system shall resolve a human-readable label using this precedence: associated `<label for>` → `aria-label` → `aria-describedby` text → nearest preceding text node → `placeholder`. | Must |
| FR-EXTRACT.3 | The system shall re-run extraction when new form elements are added to the DOM after initial load (detected via `MutationObserver`), to support multi-step/dynamic forms. | Should |
| FR-EXTRACT.4 | The system shall capture the form's `action` attribute and the page's full URL for use by the Risk Analyzer (§3.3). | Must |

### 3.2 Redact Sensitive Data (Local) — *(DFD Process 2.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-REDACT.1 | The system shall never read or transmit the `.value` of any field whose `type` is `password`, or whose `name`/`id`/`label` matches a case-insensitive pattern for OTP, CVV, PIN, or similar sensitive-value fields. | Must |
| FR-REDACT.2 | The system shall never transmit any value the user has typed into any field, for any field type, at any stage of the pipeline — only field structure (label, type, placeholder, options) is ever sent to the backend. | Must |
| FR-REDACT.3 | Redaction shall be enforced at the point of DOM extraction (i.e., the extraction function never populates a `value` property for excluded fields), not as a later filtering step, to eliminate the risk of a downstream bug leaking data. | Must |
| FR-REDACT.4 | Fields detected as sensitive (FR-REDACT.1) shall keep their **structure only** (label and input type, flagged `sensitive`) so the Risk Analyzer can still flag them (UC-3). They shall carry no placeholder, options or help text and shall never be sent for value reading. | Must |

### 3.3 Classify Risk & Field Tags — *(DFD Process 3.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-RISK.1 | The system shall flag a form where the `action` attribute's domain differs from the current page's domain. | Must |
| FR-RISK.2 | The system shall flag a form served over a non-HTTPS connection. | Must |
| FR-RISK.3 | The system shall flag fields requesting OTP/CVV on a domain not recognized as a banking institution, and fields requesting a national ID number (e.g., Aadhaar, PAN) on a domain outside a maintained allowlist. | Should |
| FR-RISK.4 | Every field shall be tagged exactly one of: **Required**, **Optional**, or **Unusual**, based on the HTML `required` attribute and the rules above. | Must |
| FR-RISK.5 | Every triggered risk flag shall be logged to the `riskFlags` subcollection of the form document (Figure 3) with its severity and a plain-language description (stored as a translatable message key) of why it was raised. | Should |

### 3.4 Generate / Retrieve Explanations (RAG + Gemini) — *(DFD Process 4.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-EXPLAIN.1 | For each field, the system shall first check the `explanations` cache (document `forms/{formId}/fields/{fieldKey}/explanations/{language}`) before generating anything new. | Must |
| FR-EXPLAIN.2 | On a cache miss, the system shall attempt to ground the explanation in, in order of preference: (a) the form's own on-page help text (label `"From this page"`), (b) a pre-indexed official source document retrieved via **Firestore vector search** (`findNearest`, cosine distance) against the Gemini embedding of the field's label, accepted only when the match passes a configurable similarity threshold (label `"From official source"`, with a link), and (c) Gemini's general knowledge as a last resort (label `"AI's general knowledge"`). | Must |
| FR-EXPLAIN.3 | Every explanation returned to the client shall carry exactly one source label from §FR-EXPLAIN.2, visible to the user. | Must |
| FR-EXPLAIN.4 | Gemini API calls for explanation generation shall request structured JSON output (matching a fixed schema: `{summary, explanation, confidence, source_excerpt}`) rather than free-form text, to simplify parsing and reduce hallucinated formatting. `summary` is the one-line tooltip text (≈15 words or fewer). Tool use (e.g. search grounding) shall not be combined with forced-JSON output in the same call. | Should |
| FR-EXPLAIN.5 | Generated explanations shall be produced in the user's currently selected language (§3.7) and cached per-language so repeat views do not re-invoke the model. | Must |
| FR-EXPLAIN.6 | If the Gemini API call fails (timeout, quota, network error), the system shall fall back to any available page-text-grounded explanation, or display a clear "explanation unavailable" state rather than hanging indefinitely — corresponding to the **Error** state in Figure 2. | Must |

### 3.5 Present In-Page UI — *(DFD Process 5.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-UI.1 | The system shall render a small "ⓘ See Description" label beside every detected field, anchored to that field's bounding box. | Must |
| FR-UI.2 | On field focus or label click, the system shall show a tooltip with: a one-line summary (always visible), a "More" control that expands to the full explanation and source label, and an "Ask in chat" control. | Must |
| FR-UI.3 | All injected UI (tags, tooltips, chat panel, risk banner) shall render inside a **Shadow DOM** to prevent CSS collision with the host page. | Must |
| FR-UI.4 | If any high-severity risk flag is raised for the current form, a dismissible banner shall appear once at the top of the page. | Must |
| FR-UI.5 | Every explanation shall display a speaker icon that triggers text-to-speech playback of that explanation (§3.7). | Should |

### 3.6 Handle Context-Aware Chat — *(DFD Process 6.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-CHAT.1 | The chat panel shall persistently display which field is currently focused (e.g., "Field Selected: Annual Family Income") for the duration of the session. | Must |
| FR-CHAT.2 | Every chat request sent to the backend shall include: the current form ID, the currently focused field key (if any), and the keys of fields already completed — as **yes/no fill-state only, never the content** and never for sensitive fields — so the user never has to restate context. | Must |
| FR-CHAT.3 | Chat conversation history shall be persisted per session (`chatSessions` / `messages`, Figure 3) and the last 4–6 turns included in each new prompt to Gemini, to bound token cost while preserving recent context. | Should |
| FR-CHAT.4 | The chat shall remain usable (with reduced context) if no field is currently focused. | Could |
| FR-CHAT.5 | A signed-in user shall be able to delete their chat history; the backend shall delete the user's `chatSessions` and nested `messages` recursively (Firestore does not cascade deletes). | Should |

### 3.7 Language Switching & Text-to-Speech — *(supports DFD Processes 4.0, 5.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-LANG.1 | On account creation, the user shall select a default language from {English, Hindi, Marathi}. | Must |
| FR-LANG.2 | The user shall be able to toggle the active language at any time during a session without changing their saved default. | Must |
| FR-LANG.3 | Text-to-speech playback shall use the browser's native Web Speech API (`speechSynthesis`); no backend audio generation or storage is required. | Must |

### 3.8 Manage Account & Preferences — *(DFD Process 7.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-ACC.1 | The system shall support account creation and login via Firebase Authentication (email/password at minimum). | Must |
| FR-ACC.2 | The system shall persist and allow retrieval/update of the user's default language preference (`users/{uid}.defaultLanguage`). | Must |
| FR-ACC.3 | The system shall function in a limited, non-personalized mode for an unauthenticated user (English only, no chat history persistence), so account creation is not a hard blocker to first use. | Could |

### 3.9 Explanation Caching — *(cross-cutting, supports Process 4.0)*
| ID | Requirement | Priority |
|---|---|---|
| FR-CACHE.1 | Explanations shall be cached and keyed uniquely by `(field_id, language)`, so the cost of generation is paid once per field per language, not once per user. | Must |
| FR-CACHE.2 | The system shall serve cached explanations with no perceptible generation delay (target: under 300ms backend response time for a cache hit). | Should |

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Toolbar popup:** login/account state, default language setting, "Enable on this page" toggle.
- **Inline field tags:** "ⓘ See Description" label beside each detected field.
- **Field tooltip:** one-line summary → "More" → "Ask in chat", speaker icon.
- **Chat panel:** slide-in panel; shows "Field Selected: ___"; message history; input box.
- **Risk banner:** dismissible, shown once per form if any high-severity flag is raised.
- **Onboarding (first run):** language selection and a brief explainer of what the extension does and does not send.

### 4.2 Hardware Interfaces
None beyond a standard keyboard/mouse/touchscreen input device and audio output for TTS playback.

### 4.3 Software Interfaces
| Interface | Purpose | Notes |
|---|---|---|
| Google Gemini API (`generateContent`) | Explanation generation, chat replies | Called only from the backend. Request structured JSON output where applicable (FR-EXPLAIN.4). Safety settings left at default; this is a non-adversarial, assistive-text use case. |
| Google Gemini Embeddings API (`gemini-embedding-001`, configurable) | Embedding field labels and source documents for RAG retrieval | Output truncated to 768 dimensions and L2-normalised; stored as Firestore vector fields. |
| Cloud Firestore (via the Firebase Admin SDK, **backend only**) | All persistent storage (Figure 3) | Admin SDK authenticates with a service-account key stored as a server environment variable. The extension never reads or writes Firestore directly in v1.2. Security Rules (§7.1) are still deployed as defence in depth. |
| Backend API (HTTPS, Vercel) | The only network endpoint the extension talks to | Requests carry `Authorization: Bearer <Firebase ID token>` when signed in; calls are made from the background service worker. |
| Firebase Authentication (`firebase/auth/web-extension`) | User accounts | Email/password for MVP. Sign-in runs on extension pages (popup, onboarding, options). The background service worker obtains ID tokens from the same Auth instance. |
| Chrome Extension APIs (`chrome.runtime`, `chrome.storage`, `chrome.tabs`) | Content script ↔ background service worker messaging, local settings cache | Manifest V3. |
| Web Speech API (`speechSynthesis`) | Client-side TTS | No backend dependency. |

### 4.4 Communication Interfaces
All extension-to-backend traffic uses HTTPS with JSON payloads. The base URL is the deployed API (a single `/api` handler with internal routes). Indicative endpoints:

```
POST   /api/analyze-form    { page_url, form_action, form_title?, language, fields[] } → { fields: [...with explanations + risk tags], risk_flags: [...] }
POST   /api/explain-field   { form_id, field_key, language }                           → { summary, text, source_label, source_url?, source_excerpt? }
POST   /api/chat            { session_id?, form_id, focused_field_key?, completed_field_keys[], language, message } → { reply, session_id }
GET    /api/preferences                                                               → { default_language }
PUT    /api/preferences     { default_language }
DELETE /api/chat-history                                                              → { deleted: true }
```

`analyze-form` and `explain-field` may be called without a token (limited mode, FR-ACC.3) and are rate-limited; `chat`, `preferences` and `chat-history` require a verified Firebase ID token (NFR-SEC.5); the user ID is taken from the verified token, never from the request body.

---

## 5. System Architecture Overview

See **Figure 1 (`Form_Assist_DFD.svg`)** for the full Level-1 Data Flow Diagram. In summary: the content script (Processes 1.0–2.0) runs entirely client-side and never transmits typed values; the backend (Processes 3.0–4.0, 6.0–7.0) mediates all Gemini API and Firestore access so no API key is ever exposed to the browser; and the overlay (Process 5.0) is the only process that writes back into the host page's DOM, isolated via Shadow DOM.

---

## 6. Behavioral Requirements

See **Figure 2 (`Form_Assist_STD.svg`)** for the full State Transition Diagram governing the extension's session lifecycle on a given tab. The states are:

| State | Entry condition | Exit condition(s) |
|---|---|---|
| Idle | Default state; extension installed but not activated on this page | User clicks toolbar icon → Scanning |
| Scanning | User activates extension | Extraction complete → Analyzing; no form found → Error |
| Analyzing | DOM extraction complete | Explanations received → Ready; API/network failure → Error |
| Ready | Explanations & risk tags received | User focuses a field → Field Focused; user opens chat → Chat Open; new dynamic fields appear → Scanning; tab closed → Deactivated |
| Field Focused | User focuses a field | Field blurred → Ready; "Ask in chat" tapped → Chat Open |
| Chat Open | User opens chat (from Ready or Field Focused) | User closes panel → Ready; tab closed → Deactivated |
| Error | Extraction or Gemini/network failure | User retries → Scanning; user dismisses → Idle |
| Deactivated (final) | Tab closed or user explicitly deactivates | — |

### 6.1 Non-Functional Requirement Linked to this Diagram
**NFR-REL.1 (Must):** From the Error state, the system shall never leave the user without a path forward — both "retry" and "dismiss" shall always be available and functional, per Figure 2.

---

## 7. Data Requirements

See **Figure 3 (`Form_Assist_Firestore_Model.png`)** for the Firestore data model. Firestore is a document database: relationships are expressed by **collection nesting** (subcollections) and by **ID references**, not by joins or foreign keys. Summary of collections:

| Collection path | Purpose | Notes |
|---|---|---|
| `users/{uid}` | Account + language preference | Document ID = Firebase Auth `uid`. Fields: `email`, `defaultLanguage` (`en`/`hi`/`mr`), `createdAt`. |
| `users/{uid}/chatSessions/{sessionId}` | One per user + form chat session | Fields: `formId`, `startedAt`. Nested under the user so ownership is enforced by path. |
| `users/{uid}/chatSessions/{sessionId}/messages/{messageId}` | Individual chat turns | Fields: `role` (`user`/`assistant`), `content`, `focusedFieldKey?`, `createdAt`. |
| `forms/{formId}` | One document per distinct form/domain indexed or encountered | `formId` = hash of (`domain` + `pageUrlPattern`). Fields: `domain`, `pageUrlPattern`, `title`, `lastIndexedAt`. |
| `forms/{formId}/fields/{fieldKey}` | Detected fields per form | `fieldKey` = stable hash of (normalised label + input type + name). Fields: `label`, `inputType`, `isRequired`, `riskTag` (`required`/`optional`/`unusual`), `createdAt`. |
| `forms/{formId}/fields/{fieldKey}/explanations/{language}` | Cached, per-language explanation for a field | Document ID = language, so (field, language) uniqueness (FR-CACHE.1) is structural. Fields: `summary`, `text`, `sourceLabel` (`page`/`official`/`ai`), `sourceUrl?`, `sourceExcerpt?`, `confidence?`, `generatedAt`. |
| `forms/{formId}/sourceDocuments/{docId}` | Pre-indexed official document chunks for RAG | Fields: `url`, `title`, `contentText`, `embedding` (**vector, 768 dimensions**), `indexedAt`. |
| `forms/{formId}/riskFlags/{flagId}` | Logged risk-analyzer triggers | Fields: `fieldKey?`, `flagType`, `severity` (`low`/`medium`/`high`), `descriptionKey`, `createdAt`. |

References by ID (no joins): `chatSessions.formId → forms`, `messages.focusedFieldKey → fields`, `riskFlags.fieldKey → fields`.

### 7.1 Firestore Security Rules Requirements
| ID | Requirement | Priority |
|---|---|---|
| NFR-SEC.1 | Everything under `users/{uid}/chatSessions/**` shall be readable and writable only when `request.auth.uid == uid`. | Must |
| NFR-SEC.2 | `forms/**` (forms, fields, explanations, sourceDocuments, riskFlags) shall be publicly readable (shared reference data) but **not writable by any client**; writes happen only through the Admin SDK in Cloud Functions. | Must |
| NFR-SEC.3 | `users/{uid}` shall be readable and writable only by that user, and `defaultLanguage` shall be validated to one of `en`, `hi`, `mr`. | Must |

### 7.2 Indexing, Identity and Lifecycle Requirements
| ID | Requirement | Priority |
|---|---|---|
| NFR-DATA.1 | A Firestore **vector index** (type `flat`, dimension 768) shall exist on `sourceDocuments.embedding`, and queries shall use cosine distance. The index is created via the `gcloud firestore indexes composite create` command or `firestore.indexes.json` and must be documented in the README. | Must |
| NFR-DATA.2 | `formId`, `fieldKey` and the explanation document ID shall be deterministic so that repeat analyses upsert the same documents instead of creating duplicates. | Must |
| NFR-DATA.3 | Deleting a user's chat history shall remove nested `messages` documents (recursive delete). Deleting a parent document alone does not delete its subcollections. | Should |
| NFR-DATA.4 | Because the extension does not read Firestore directly in v1.1, no client-side Firestore SDK shall be bundled in the extension. | Should |

---

## 8. Non-Functional Requirements

### 8.1 Performance
| ID | Requirement |
|---|---|
| NFR-PERF.1 | A cached explanation shall be returned to the client within 300ms (p95) on a warm backend instance, excluding client-side render time and serverless cold starts. |
| NFR-PERF.2 | An uncached explanation (requiring a Gemini call) shall be returned within 4 seconds (p95) using the Flash-tier model. |
| NFR-PERF.3 | Field detection and overlay injection on page load shall complete within 1 second for a form with up to 50 fields. |

### 8.2 Security
| ID | Requirement |
|---|---|
| NFR-SEC.4 | No Gemini API key, service-account credential or other server secret shall ever be present in extension/client-side code. The public Firebase web app configuration is permitted. |
| NFR-SEC.5 | All backend endpoints that are user-scoped (chat, preferences, chat history) shall require a valid Firebase ID token, verified server-side with the Admin SDK (`verifyIdToken`); the user identity shall come from the verified token only. |

### 8.3 Privacy
| ID | Requirement |
|---|---|
| NFR-PRIV.1 | The extension shall request only the minimum Chrome extension permissions necessary (`activeTab`, not broad `<all_urls>` host permissions at install time); the only host permission requested shall be the backend (Cloud Functions) origin. |
| NFR-PRIV.2 | The extension shall not run content scripts automatically on every page visited — only on explicit user activation per page, per session. |
| NFR-PRIV.3 | The onboarding flow shall clearly state, in plain language, what is and is not sent off the user's device (per FR-REDACT.1–3). |
| NFR-PRIV.4 | Onboarding (step 3) and Settings shall disclose that field labels, the page address and chat messages are sent to Google's Gemini API, and shall not claim that this content is never used to improve Google products while the free tier is in use. |

### 8.4 Usability / Accessibility
| ID | Requirement |
|---|---|
| NFR-USA.1 | All injected interactive elements shall be reachable and operable via keyboard alone (tab order, enter/space activation). |
| NFR-USA.2 | Text contrast in all injected UI shall meet WCAG 2.2 AA minimum contrast ratios. |
| NFR-USA.3 | The one-line summary in any tooltip shall not exceed approximately 15 words, consistent with the progressive-disclosure design intent (§FR-UI.2). |

### 8.5 Reliability & Error Handling
| ID | Requirement |
|---|---|
| NFR-REL.2 | A Gemini API failure for one field's explanation shall not block explanation delivery for any other field on the same form. |
| NFR-REL.3 | The system shall apply exponential backoff (minimum 2 retries) on transient Gemini API errors (HTTP 429/5xx) before surfacing the Error state to the user. |
| NFR-REL.4 | The system shall respect free-tier Gemini rate limits: batch fields per call, limit concurrency, honour `429`/`Retry-After`, and degrade to page-text or "explanation unavailable" states rather than failing the whole form (extends NFR-REL.2). |

### 8.6 Scalability & Cost Management
| ID | Requirement |
|---|---|
| NFR-SCALE.1 | Per-field, per-language caching (§FR-CACHE.1) shall ensure Gemini generation cost scales with the number of *unique* fields indexed, not the number of users. |
| NFR-SCALE.2 | Chat prompt construction shall cap conversation history at 4–6 turns (§FR-CHAT.3) to bound per-request token cost. |
| NFR-SCALE.3 | Cost and quota usage shall be bounded by: batching several fields into one Gemini call (chunks of a configurable size), a cap on concurrent Gemini calls, a maximum number of fields accepted per `analyze-form` request (default 60), and rate limiting of unauthenticated calls. |

### 8.7 Maintainability
| ID | Requirement |
|---|---|
| NFR-MAIN.1 | The Gemini text and embedding model identifiers, the embedding dimension, the similarity threshold and the Firebase region shall be stored in configuration (environment variables / a single config module), not hard-coded at each call site, given Google's model deprecation cadence (§2.5). |

### 8.8 Portability
| ID | Requirement |
|---|---|
| NFR-PORT.1 | The extension shall run unmodified on any current Chromium-based desktop browser supporting Manifest V3 (Chrome, Edge, Brave). |

---

## 9. Use Cases

### UC-1: First-time field explanation
**Actor:** Low-literacy form-filler
**Precondition:** Extension installed; user on a target form page.
**Main flow:**
1. User clicks the toolbar icon → extension enters Scanning, then Analyzing, then Ready.
2. User clicks into the "Annual Family Income" field.
3. System shows a one-line summary tooltip, source-labeled.
4. User taps "More" → full explanation shown, plus a speaker icon.
5. User taps the speaker icon → explanation read aloud in their selected language.

### UC-2: Asking a follow-up question in chat
**Precondition:** Extension in Field Focused state on a specific field.
**Main flow:**
1. User taps "Ask in chat" → Chat Open state entered; header shows "Field Selected: Annual Family Income".
2. User types "what if I don't know this exact number?"
3. System sends the message with form/field context to the backend; backend calls Gemini with that context plus recent history.
4. Reply is rendered in the panel, inheriting the user's current language setting.

### UC-3: Risk flag on an unusual field
**Precondition:** User activates the extension on a form requesting an OTP on a non-banking domain.
**Main flow:**
1. During Analyzing, the Risk Analyzer (Process 3.0) flags the OTP field as "Unusual" and logs a `riskFlags` document.
2. On entering Ready, a dismissible banner appears: "This site is asking for an OTP — that's unusual outside of banking sites."
3. The OTP field itself carries an "Unusual" tag with a one-line "why are they asking?" note.

### UC-4: Language switch mid-session
**Precondition:** User is in Ready state, default language English.
**Main flow:**
1. User toggles language to Hindi via the toolbar popup.
2. All currently visible explanations are re-fetched (cache-checked first) and re-rendered in Hindi.
3. The session default is unchanged unless the user explicitly updates it in account settings.

### UC-5: Gemini API failure and recovery
**Precondition:** User activates extension; backend's Gemini call fails (timeout).
**Main flow:**
1. System retries per NFR-REL.3; retries also fail → Error state entered.
2. User is shown a plain message and two options: "Retry" and "Dismiss."
3. User taps "Retry" → system re-enters Scanning and re-attempts the full pipeline.

---

## 10. Traceability Summary

| Feature Area | Functional Reqs | DFD Process | STD State(s) | Firestore Collections |
|---|---|---|---|---|
| Field extraction | FR-EXTRACT.1–4 | 1.0 | Scanning | `forms`, `fields` |
| Redaction | FR-REDACT.1–3 | 2.0 | Scanning | — (never persisted) |
| Risk analysis | FR-RISK.1–5 | 3.0 | Analyzing | `riskFlags` |
| Explanation generation | FR-EXPLAIN.1–6 | 4.0 | Analyzing, Error | `explanations`, `sourceDocuments` |
| Overlay UI | FR-UI.1–5 | 5.0 | Ready, Field Focused | — |
| Chat | FR-CHAT.1–4 | 6.0 | Chat Open | `chatSessions`, `messages` |
| Language/TTS | FR-LANG.1–3 | 4.0, 5.0 | (cross-cutting) | `users` |
| Account/preferences | FR-ACC.1–3 | 7.0 | (cross-cutting) | `users` |
| Caching | FR-CACHE.1–2 | 4.0 | Analyzing | `explanations` |

---

## 11. Appendix A — Glossary
See §1.5 for core acronyms. Additional terms:
- **Grounded explanation:** An explanation whose content is traceable to a specific source document or the form's own on-page text, as opposed to an unsourced model-generated claim.
- **Progressive disclosure:** Presenting the minimum necessary information by default, with deliberate, user-initiated steps to reveal more detail.

## 12. Appendix B — Known Risks and Future Work
- Full general-purpose grounding across arbitrary live government/bank sites is not delivered in v1.0; scope is limited to pre-indexed demonstration forms with honest, visible fallback elsewhere (§2.5).
- The risk analyzer is a heuristic second-opinion layer, not a security/phishing-detection guarantee, and should not be represented as one.
- Translation quality for Hindi/Marathi explanations has not been independently validated against native-speaker review within this project's timeline; flagged as a validation step for future work.
- Firestore vector search is available only through server-side libraries (Node.js, Python, Go, Java) and has a 2048-dimension limit; this is why all retrieval happens in Cloud Functions and why embeddings are truncated to 768 dimensions.
- Serverless cold starts can exceed the p95 targets on the first request after idle time. The Gemini free tier has low per-minute limits and different data-use terms from the paid tier; the Vercel Hobby plan is intended for non-commercial use. Firestore vector search availability and quotas on the Spark plan must be confirmed at build time; an in-API cosine-similarity fallback over a form's few chunks is acceptable for the demo.
- Firestore has no cascading deletes and no joins; deletion of chat history and any cross-collection reads are handled explicitly in backend code.
- Firebase App Check is not used in v1.1 (its attestation providers depend on remotely loaded scripts that Manifest V3 forbids); abuse control relies on rate limits and caps (NFR-SCALE.3).
- Gemini model identifiers are expected to change again before this project's evaluation date; §2.5's recommendation should be re-checked against official documentation at build time, not treated as permanently fixed.
