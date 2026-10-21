import { db, config } from '../config';
import { generateEmbedding, cosineSimilarity } from './gemini';

export interface RetrievedSourceDoc {
  id: string;
  url: string;
  title: string;
  contentText: string;
  score: number;
}

/**
 * FR-EXPLAIN.2: Retrieve relevant official source document chunk using vector search.
 * Tries Firestore native `findNearest` (NFR-DATA.1) and falls back to in-memory cosine
 * similarity calculation over the form's indexed chunks (Appendix B fallback).
 */
export async function searchSourceDocuments(
  formId: string,
  queryText: string
): Promise<RetrievedSourceDoc | null> {
  if (!queryText.trim()) return null;

  let queryVector: number[] = [];
  try {
    queryVector = await generateEmbedding(queryText);
    const colRef = db.collection(`forms/${formId}/sourceDocuments`);

    // 1. Attempt Firestore native findNearest if supported by SDK and index
    if (typeof (colRef as any).findNearest === 'function') {
      try {
        const snapshot = await (colRef as any)
          .findNearest('embedding', queryVector, {
            limit: 1,
            distanceMeasure: 'COSINE',
            distanceThreshold: 1 - config.similarityThreshold, // Cosine distance = 1 - similarity
          })
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          const docVector = data.embedding || [];
          const simScore = docVector.length > 0 ? cosineSimilarity(queryVector, docVector) : 0.8;

          if (simScore >= config.similarityThreshold) {
            return {
              id: doc.id,
              url: data.url || '',
              title: data.title || 'Official Guidelines',
              contentText: data.contentText || '',
              score: simScore,
            };
          }
        }
      } catch (nativeErr: any) {
        // Fall back to in-memory if vector index not provisioned in emulator/Spark plan
        console.warn('Native findNearest unavailable or index pending, using in-memory cosine fallback:', nativeErr.message);
      }
    }

    // 2. Fallback: In-memory vector comparison over pre-indexed chunks (Appendix B)
    const snapshot = await colRef.limit(50).get();
    if (snapshot.empty) {
      return null;
    }

    let bestMatch: RetrievedSourceDoc | null = null;
    let highestScore = -1;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docEmbedding = data.embedding;
      if (!Array.isArray(docEmbedding) || docEmbedding.length === 0) continue;

      const score = cosineSimilarity(queryVector, docEmbedding);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          id: doc.id,
          url: data.url || '',
          title: data.title || 'Official Guidelines',
          contentText: data.contentText || '',
          score,
        };
      }
    }

    // 3. Fallback: Check local fixtures/demo-documents.json if Firestore returned no matches
    const localMatch = searchLocalCorpus(formId, queryVector);
    if (localMatch) {
      return localMatch;
    }

    return null;
  } catch (err: any) {
    // If Firestore fails (e.g. offline/no credentials in standalone mode), fall back to local demo corpus
    const localMatch = searchLocalCorpus(formId, queryVector);
    if (localMatch) {
      return localMatch;
    }
    console.warn(`Source document search failed for "${queryText}":`, err.message);
    return null;
  }
}

function searchLocalCorpus(formId: string, queryVector: number[]): RetrievedSourceDoc | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const fixturePath = path.join(__dirname, '../../../fixtures/demo-documents.json');
    if (!fs.existsSync(fixturePath)) return null;

    const raw = fs.readFileSync(fixturePath, 'utf8');
    const dump = JSON.parse(raw);
    const formCorpus = dump[formId];
    if (!formCorpus || !Array.isArray(formCorpus.chunks)) return null;

    let bestMatch: RetrievedSourceDoc | null = null;
    let highestScore = -1;

    for (const chunk of formCorpus.chunks) {
      const score = cosineSimilarity(queryVector, chunk.embedding);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          id: chunk.id,
          url: chunk.url,
          title: chunk.title,
          contentText: chunk.contentText,
          score,
        };
      }
    }

    if (bestMatch && bestMatch.score >= config.similarityThreshold) {
      return bestMatch;
    }
  } catch {}
  return null;
}
