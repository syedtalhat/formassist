/**
 * Backend API Client
 * Wraps communication with Cloud Functions HTTPS endpoints.
 * Automatically attaches Firebase ID Token and handles retries with backoff (NFR-REL.3).
 */

import {
  ExtractedField,
  FormAnalysisResult,
  Language,
  ChatMessage,
  UserPreferences,
} from '../shared/types';
import { isMockMode, apiBaseUrl, getApiMode, geminiApiKey } from '../shared/firebase-config';
import { getUserIdToken } from '../shared/auth-init';
import { mockAnalyzeForm, mockChatReply } from '../shared/mock/mock-api';

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

export async function apiAnalyzeForm(
  fields: ExtractedField[],
  pageUrl: string,
  domain: string,
  language: Language,
  onProgress?: (step: 1 | 2 | 3, message: string) => void
): Promise<FormAnalysisResult> {
  const mode = await getApiMode();
  if (mode === 'mock') {
    return mockAnalyzeForm(fields, pageUrl, domain, language, onProgress);
  }

  try {
    onProgress?.(1, 'Reading the form');
    const token = await getUserIdToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    onProgress?.(2, 'Checking for anything unusual');

    const response = await fetchWithRetry(`${apiBaseUrl}/analyze-form`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields,
        pageUrl,
        domain,
        language,
      }),
    });

    onProgress?.(3, 'Writing simple explanations');

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.result) {
      return data.result;
    }

    const fieldsMap: Record<string, import('../shared/types').FieldExplanation> = {};
    const tagsMap: Record<string, import('../shared/types').FieldTagType> = {};

    if (Array.isArray(data.fields)) {
      for (let i = 0; i < data.fields.length; i++) {
        const f = data.fields[i];
        const origField = fields[i];
        const explanation = {
          summary: f.explanation?.summary || `${f.label}: Field description.`,
          explanation: f.explanation?.text || f.explanation?.explanation || f.explanation?.summary || 'Explanation unavailable.',
          confidence: f.explanation?.confidence ?? 0.85,
          sourceExcerpt: f.explanation?.sourceExcerpt,
          sourceLabel: f.explanation?.sourceLabel || 'ai',
          status: 'available' as const,
        };
        const tag = f.riskTag || (f.required || f.isRequired ? 'required' : 'optional');

        const idsToIndex = [f.id, f.key, origField?.id, origField?.name].filter(Boolean) as string[];
        for (const id of idsToIndex) {
          fieldsMap[id] = explanation;
          tagsMap[id] = tag;
        }
      }
    }

    const riskFlags: import('../shared/types').RiskFlag[] = (data.risk_flags || []).map((r: any, idx: number) => ({
      id: r.id || `risk_${Date.now()}_${idx}`,
      fieldId: r.fieldKey,
      type: r.flagType || 'cross_domain_action',
      severity: r.severity || 'low',
      description: r.message || 'Potential form risk flagged.',
    }));

    const formResult: FormAnalysisResult = {
      formId: data.form_id || `form_${domain.replace(/[^a-zA-Z0-9]/g, '_')}`,
      domain,
      pageUrl,
      fields: fieldsMap,
      tags: tagsMap,
      riskFlags,
      language,
    };

    return formResult;
  } catch (err: any) {
    console.warn(`[API Client] Live backend analysis failed (${err?.message || err}). Falling back to local offline analysis mode per NFR-REL.2 / NFR-REL.4.`);
    return mockAnalyzeForm(fields, pageUrl, domain, language, onProgress);
  }
}

async function callDirectGeminiLLM(
  text: string,
  fieldId: string | undefined,
  language: Language
): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('No Gemini API key available.');
  }

  const langNames: Record<Language, string> = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    mr: 'Marathi (मराठी)',
  };

  const sysPrompt = `You are FormAssist, an empathetic, helpful assistant guiding a user who is filling out an online form.
Language requirement: Answer strictly in ${langNames[language] || 'English'}.
Rules:
1. Explain what documents they might need, how to format their answer, or what terms mean (such as IFSC code, caste certificate, domicile, income limit).
2. Be brief, warm, practical, and clear. Avoid unnecessary bureaucracy.
3. The user is asking about form field "${fieldId || 'the current form'}".
Respond to the user's inquiry clearly using Markdown.`;

  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${sysPrompt}\n\nUser: ${text}\n\nAssistant:`,
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        continue;
      }

      const json = await res.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content && content.trim()) {
        return content.trim();
      }
    } catch {
      // try next model candidate
    }
  }

  throw new Error('All direct Gemini models failed or timed out.');
}

export async function apiSendChat(
  text: string,
  fieldId: string | undefined,
  language: Language,
  formStructure?: ExtractedField[]
): Promise<ChatMessage> {
  const mode = await getApiMode();

  // 1. If in live/emulator mode, try backend /chat first
  if (mode !== 'mock') {
    try {
      const token = await getUserIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetchWithRetry(
        `${apiBaseUrl}/chat`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: text,
            focused_field_key: fieldId,
            form_id: 'form_active',
            language,
          }),
        },
        1,
        500
      );

      if (response.ok) {
        const data = await response.json();
        const replyContent =
          data.reply || data.message?.content || data.message;
        if (replyContent) {
          return {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            content: replyContent,
            timestamp: Date.now(),
            focusedFieldId: fieldId,
          };
        }
      }
    } catch (err: any) {
      console.warn(
        `[API Client] Live backend chat failed (${err?.message || err}). Trying direct Gemini LLM...`
      );
    }
  }

  // 2. Direct Gemini LLM fallback (generates real AI responses directly from browser)
  try {
    const directReply = await callDirectGeminiLLM(text, fieldId, language);
    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      content: directReply,
      timestamp: Date.now(),
      focusedFieldId: fieldId,
    };
  } catch (directErr: any) {
    console.warn(
      `[API Client] Direct Gemini LLM failed (${directErr?.message || directErr}). Using offline knowledge engine.`
    );
  }

  // 3. Deterministic offline knowledge fallback with verified regex
  return mockChatReply(text, fieldId, language);
}

export async function apiGetPreferences(): Promise<UserPreferences | null> {
  if (isMockMode) {
    return null;
  }

  const token = await getUserIdToken();
  if (!token) return null;

  const response = await fetchWithRetry(`${apiBaseUrl}/preferences`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return {
    defaultLanguage: data.default_language || data.preferences?.defaultLanguage || 'en',
    voiceSpeed: data.voice_speed || data.preferences?.voiceSpeed || 'normal',
  };
}

export async function apiUpdatePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
  if (isMockMode) {
    return true;
  }

  const token = await getUserIdToken();
  if (!token) return false;

  const response = await fetchWithRetry(`${apiBaseUrl}/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      default_language: preferences.defaultLanguage || 'en',
    }),
  });

  return response.ok;
}

export async function apiDeleteChatHistory(): Promise<boolean> {
  if (isMockMode) {
    return true;
  }

  const token = await getUserIdToken();
  if (!token) return false;

  const response = await fetchWithRetry(`${apiBaseUrl}/chat-history`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
}
