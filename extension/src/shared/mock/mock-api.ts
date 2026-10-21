/**
 * Mock API Handler
 * Mirrors the real Cloud Functions API behavior with realistic delays
 * Supports switching language, risk evaluation, and chat responses.
 */

import {
  ExtractedField,
  FormAnalysisResult,
  FieldExplanation,
  Language,
  ChatMessage,
} from '../types';
import { MOCK_FORMS } from './mock-data';
import { isFailureInjected } from './failure-toggle';

export async function mockAnalyzeForm(
  fields: ExtractedField[],
  pageUrl: string,
  domain: string,
  language: Language = 'en',
  onProgress?: (step: 1 | 2 | 3, message: string) => void
): Promise<FormAnalysisResult> {
  // Check failure injection for error handling test
  if (await isFailureInjected()) {
    throw new Error('Injected network failure: FormAssist backend unreachable.');
  }

  // Step 1: Reading the form
  onProgress?.(1, 'Reading the form');
  await new Promise((r) => setTimeout(r, 400));

  // Step 2: Checking for anything unusual (Risk analysis)
  onProgress?.(2, 'Checking for anything unusual');
  await new Promise((r) => setTimeout(r, 450));

  // Determine which canned mock form matches the page
  let formKey = 'scholarship-form';
  if (pageUrl.includes('risky') || domain.includes('untrusted')) {
    formKey = 'risky-form';
  } else if (pageUrl.includes('bank') || pageUrl.includes('kyc')) {
    formKey = 'bank-kyc-form';
  }

  const canned = MOCK_FORMS[formKey] || MOCK_FORMS['scholarship-form'];

  // Step 3: Writing simple explanations
  onProgress?.(3, 'Writing simple explanations');
  await new Promise((r) => setTimeout(r, 500));

  const explanations: Record<string, FieldExplanation> = {};
  const tags: Record<string, 'required' | 'optional' | 'unusual'> = {};

  const cannedLangExps = canned.explanations[language] || canned.explanations.en;

  for (const field of fields) {
    // Check if field matches any risk flag
    const hasRisk = canned.riskFlags.some((rf) => rf.fieldId === field.id || rf.fieldId === field.name);

    if (hasRisk) {
      tags[field.id] = 'unusual';
    } else if (field.required) {
      tags[field.id] = 'required';
    } else {
      tags[field.id] = 'optional';
    }

    // Assign explanation
    if (cannedLangExps[field.id]) {
      explanations[field.id] = cannedLangExps[field.id];
    } else if (cannedLangExps[field.name]) {
      explanations[field.id] = cannedLangExps[field.name];
    } else {
      // Dynamic fallback mock explanation based on field.label
      const fieldName = field.label || field.name || 'this field';
      if (language === 'hi') {
        explanations[field.id] = {
          summary: `${fieldName} से संबंधित जानकारी।`,
          explanation: `कृपया ${fieldName} के लिए आधिकारिक दस्तावेजों के अनुसार सही विवरण दर्ज करें।`,
          confidence: 0.88,
          sourceLabel: 'ai',
        };
      } else if (language === 'mr') {
        explanations[field.id] = {
          summary: `${fieldName} बाबत तपशील.`,
          explanation: `कृपया ${fieldName} साठी अधिकृत कागदपत्रांनुसार माहिती भरा.`,
          confidence: 0.88,
          sourceLabel: 'ai',
        };
      } else {
        explanations[field.id] = {
          summary: `Details regarding ${fieldName}.`,
          explanation: `Enter the appropriate information for ${fieldName} as per your supporting official documentation.`,
          confidence: 0.88,
          sourceLabel: 'ai',
        };
      }
    }
  }

  return {
    formId: formKey,
    domain,
    pageUrl,
    fields: explanations,
    riskFlags: canned.riskFlags,
    tags,
    language,
  };
}

export async function mockChatReply(
  userText: string,
  fieldId: string | undefined,
  language: Language = 'en'
): Promise<ChatMessage> {
  await new Promise((r) => setTimeout(r, 600));

  let replyText = '';
  if (language === 'hi') {
    replyText = `इस फ़ील्ड के बारे में: अपने आधिकारिक दस्तावेज़ पर उल्लिखित जानकारी के अनुसार ही विवरण भरें। यदि आपके पास तत्काल प्रमाण पत्र नहीं है, तो आवेदन जमा करने से पहले सक्षम अधिकारी से इसे प्राप्त कर लें।`;
  } else if (language === 'mr') {
    replyText = `या प्रश्नाबाबत: अधिकृत प्रमाणपत्रावर नोंदवल्यानुसार अचूक माहिती भरा. कागदपत्र उपलब्ध नसल्यास प्रथम ते संबंधित कार्यालयातून काढून घ्यावे.`;
  } else {
    replyText = `Regarding this question: Enter the details as verified by your government-issued certificate or official ID. If you do not have the document ready, ensure you apply for the valid certificate before final form submission.`;
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    content: replyText,
    timestamp: Date.now(),
    focusedFieldId: fieldId,
  };
}
