/**
 * scripts/ingest-source-docs.js
 * Ingestion pipeline for grounding demonstration forms with official source guidelines per FR-EXPLAIN.2.
 * Uses Firebase Admin SDK and 768-dim L2-normalized embeddings.
 */

const crypto = require('crypto');
const path = require('path');

let admin;
try {
  admin = require('firebase-admin');
} catch {
  admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));
}

// Initialize Firebase Admin (respects FIRESTORE_EMULATOR_HOST if set)
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'formassist-app',
  });
}

const db = admin.firestore();

// 768-dim L2 normalization
function l2Normalize(vector) {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-12;
  return vector.map((v) => v / norm);
}

// Generate embedding using @google/genai or deterministic fallback
async function getEmbedding(text, apiKey) {
  if (apiKey) {
    try {
      let GoogleGenAI;
      try {
        GoogleGenAI = require('@google/genai').GoogleGenAI;
      } catch {
        GoogleGenAI = require(path.join(__dirname, '../functions/node_modules/@google/genai')).GoogleGenAI;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
        contents: text,
        config: { outputDimensionality: 768 },
      });
      const values =
        response.embeddings?.[0]?.values ||
        response.embedding?.values;
      if (values && values.length > 0) {
        return l2Normalize(values);
      }
    } catch (e) {
      console.warn('Gemini embedding API call failed, generating deterministic fallback:', e.message);
    }
  }

  // Deterministic normalized 768-dim vector
  const vec = new Array(768).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 768; i++) {
    vec[i] = Math.sin((hash + i * 997) / 1000.0);
  }
  return l2Normalize(vec);
}

function computeFormId(pageUrl) {
  try {
    const parsed = new URL(pageUrl);
    const pattern = `${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}`;
    const hash = crypto.createHash('sha256').update(pattern.toLowerCase()).digest('hex');
    return `form_${hash.substring(0, 16)}`;
  } catch {
    const hash = crypto.createHash('sha256').update(pageUrl.toLowerCase()).digest('hex');
    return `form_${hash.substring(0, 16)}`;
  }
}

// Demo Corpus: Official source guidelines for the 3 fixture forms
const CORPUS = [
  {
    targetUrls: [
      'http://localhost:3000/scholarship-form.html',
      'http://127.0.0.1:3000/scholarship-form.html',
    ],
    title: 'National Scholarship Portal (NSP) — Post-Matric & Merit Scholarship Guidelines',
    sourceUrl: 'https://scholarships.gov.in/guidelines/post-matric-rules.pdf',
    chunks: [
      {
        chunkId: 'nsp-income-criteria',
        title: 'Annual Family Income Criteria & Income Certificate',
        text: 'Total annual family income from all sources must not exceed Rs 2,50,000 per annum for scholarship eligibility. Self-employed guardians or agricultural workers must submit an income certificate issued by a competent revenue authority (Tahsildar, Revenue Inspector or Executive Magistrate). Salary slips or Form 16 are required for salaried parents.',
      },
      {
        chunkId: 'nsp-aadhaar-dbt',
        title: 'Aadhaar Card Seeding & Bank Account Requirements',
        text: 'Scholarship disbursements are credited strictly via Direct Benefit Transfer (DBT). The applicant or guardian bank account must be an active savings account in a scheduled commercial bank seeded with the applicant Aadhaar number. Joint accounts with third parties or dormant accounts are rejected.',
      },
      {
        chunkId: 'nsp-category-caste',
        title: 'Social Category and Domicile Certificate',
        text: 'Applicants applying under SC, ST, OBC, or Minority categories must provide a valid digital caste certificate verifying their quota status. A valid State Domicile Certificate is mandatory to prove state residency for state-quota scholarship schemes.',
      },
      {
        chunkId: 'nsp-academic-records',
        title: 'Academic Records, Previous Marks & Roll Number',
        text: 'Applicants must have secured a minimum of 50% marks in the previous qualifying annual examination. The previous board roll number and institution code must match official education board registries.',
      },
    ],
  },
  {
    targetUrls: [
      'http://localhost:3000/bank-kyc-form.html',
      'http://127.0.0.1:3000/bank-kyc-form.html',
    ],
    title: 'Reserve Bank of India — Master Direction on Know Your Customer (KYC)',
    sourceUrl: 'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11566',
    chunks: [
      {
        chunkId: 'rbi-pan-requirement',
        title: 'Permanent Account Number (PAN) & Form 60 Guidelines',
        text: 'Under Rule 114B of Income Tax Rules 1962, quoting PAN is mandatory for opening bank accounts and conducting financial transactions exceeding specified limits. Individuals who do not possess a PAN must submit Form 60 along with valid declaration of agricultural or exempt income.',
      },
      {
        chunkId: 'rbi-aadhaar-verification',
        title: 'Aadhaar Card as Officially Valid Document (OVD)',
        text: 'Aadhaar is accepted as an Officially Valid Document (OVD) for proof of identity and proof of address. Customers submitting physical copies of Aadhaar are permitted to mask the first eight digits of their Aadhaar number to protect personal privacy, leaving only the last four digits visible.',
      },
      {
        chunkId: 'rbi-security-questions',
        title: 'Mother Maiden Name and Security Verification',
        text: 'Banks collect confidential non-public biographical data, such as Mother Maiden Name, solely as a secondary authentication factor and security question for resetting credentials, tele-banking verification, and fraud prevention. It is never shared with third parties.',
      },
      {
        chunkId: 'rbi-address-proof',
        title: 'Current and Permanent Address Proof Requirements',
        text: 'Where the permanent address differs from the current residential address, an Officially Valid Document or utility bill (electricity, water, telephone piped gas) not older than two months may be accepted as proof of current address.',
      },
    ],
  },
  {
    targetUrls: [
      'http://localhost:3000/risky-form.html',
      'http://127.0.0.1:3000/risky-form.html',
    ],
    title: 'CERT-In & RBI Advisory on Digital Payment Security & Phishing',
    sourceUrl: 'https://www.cert-in.org.in/advisories/consumer-digital-safety.html',
    chunks: [
      {
        chunkId: 'cert-otp-warning',
        title: 'One-Time Password (OTP) & PIN Confidentiality Notice',
        text: 'Never enter your One-Time Password (OTP), ATM PIN, UPI MPIN, or Card CVV on any website that is unencrypted (HTTP) or hosted on a third-party non-banking domain. Banks and government agencies will never ask for your card PIN or OTP during simple identity registrations.',
      },
      {
        chunkId: 'cert-cross-domain',
        title: 'Cross-Domain Form Submissions & Phishing Indicators',
        text: 'Be cautious of web forms that submit user data to a different external domain than the one shown in your browser address bar. Phishing sites frequently mimic legitimate government or banking portals while exfiltrating credentials to attacker-controlled server endpoints.',
      },
    ],
  },
];

async function runIngestion() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const fs = require('fs');
  console.log(`🚀 Starting Source Document Ingestion Pipeline...`);
  console.log(`ℹ️ Mode: ${apiKey ? 'Gemini API Embeddings' : 'Deterministic Vector Generation (Offline/Emulator Ready)'}`);

  const localDump = {};
  let totalChunksIngested = 0;
  const isEmulatorActive = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  for (const docGroup of CORPUS) {
    console.log(`\n📚 Ingesting: "${docGroup.title}"`);

    for (const targetUrl of docGroup.targetUrls) {
      const formId = computeFormId(targetUrl);
      console.log(`  🔗 Target URL: ${targetUrl} (Form ID: ${formId})`);

      localDump[formId] = {
        title: docGroup.title,
        sourceUrl: docGroup.sourceUrl,
        chunks: [],
      };

      let batch = null;
      if (isEmulatorActive) {
        try {
          const formRef = db.doc(`forms/${formId}`);
          await formRef.set(
            {
              domain: new URL(targetUrl).hostname,
              pageUrlPattern: targetUrl,
              title: docGroup.title,
              lastIndexedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          batch = db.batch();
        } catch (e) {
          console.warn('  ⚠️ Firestore write skipped:', e.message);
        }
      }

      for (const chunk of docGroup.chunks) {
        const embedding = await getEmbedding(`${chunk.title} ${chunk.text}`, apiKey);
        
        localDump[formId].chunks.push({
          id: chunk.chunkId,
          url: docGroup.sourceUrl,
          title: chunk.title,
          contentText: chunk.text,
          embedding,
        });

        if (batch) {
          const docRef = db.doc(`forms/${formId}/sourceDocuments/${chunk.chunkId}`);
          batch.set(
            docRef,
            {
              url: docGroup.sourceUrl,
              title: chunk.title,
              contentText: chunk.text,
              embedding,
              indexedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        totalChunksIngested++;
      }

      if (batch) {
        await batch.commit();
        console.log(`  ✅ Ingested ${docGroup.chunks.length} chunks into Firestore forms/${formId}/sourceDocuments`);
      }
    }
  }

  // Persist offline demo documents fixture
  const dumpPath = path.join(__dirname, '../fixtures/demo-documents.json');
  fs.writeFileSync(dumpPath, JSON.stringify(localDump, null, 2), 'utf8');
  console.log(`💾 Saved offline corpus index to: ${dumpPath}`);
  console.log(`\n🎉 Ingestion complete! Total chunks indexed across demo forms: ${totalChunksIngested}`);
}

runIngestion().catch((err) => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
