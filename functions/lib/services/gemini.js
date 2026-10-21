"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.l2Normalize = l2Normalize;
exports.cosineSimilarity = cosineSimilarity;
exports.generateEmbedding = generateEmbedding;
exports.generateExplanationWithGemini = generateExplanationWithGemini;
exports.generateChatReplyWithGemini = generateChatReplyWithGemini;
const genai_1 = require("@google/genai");
const config_1 = require("../config");
let genAIClient = null;
function getClient() {
    if (!config_1.config.geminiApiKey) {
        return null;
    }
    if (!genAIClient) {
        genAIClient = new genai_1.GoogleGenAI({ apiKey: config_1.config.geminiApiKey });
    }
    return genAIClient;
}
/**
 * Normalizes vector to unit length (L2 norm) per SRS §2.5
 */
function l2Normalize(vector) {
    let sumSq = 0;
    for (let i = 0; i < vector.length; i++) {
        sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1e-12;
    return vector.map((v) => v / norm);
}
/**
 * Computes cosine similarity between two normalized vectors
 */
function cosineSimilarity(a, b) {
    let dot = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
    }
    return dot;
}
/**
 * Generate 768-dim L2-normalized embedding for RAG retrieval
 */
async function generateEmbedding(text) {
    const client = getClient();
    if (!client) {
        // Deterministic fallback vector for offline / emulator test runs without API key
        return generateDeterministicVector(text, config_1.config.embeddingDimension);
    }
    try {
        const response = await client.models.embedContent({
            model: config_1.config.geminiEmbeddingModel,
            contents: text,
            config: {
                outputDimensionality: config_1.config.embeddingDimension,
            },
        });
        const values = response.embeddings?.[0]?.values ||
            response.embedding?.values;
        if (!values || values.length === 0) {
            throw new Error('Gemini API returned empty embedding values.');
        }
        return l2Normalize(values);
    }
    catch (err) {
        console.warn('Gemini embedding call failed, using deterministic fallback:', err.message);
        return generateDeterministicVector(text, config_1.config.embeddingDimension);
    }
}
/**
 * Offline / fallback embedding generator ensuring non-zero normalized 768-dim array
 */
function generateDeterministicVector(seedText, dim) {
    const vec = new Array(dim).fill(0);
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
        hash = (hash << 5) - hash + seedText.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 0; i < dim; i++) {
        const val = Math.sin((hash + i * 997) / 1000.0);
        vec[i] = val;
    }
    return l2Normalize(vec);
}
/**
 * FR-EXPLAIN.4: Structured explanation generation using Gemini Flash model.
 * Produces structured JSON output { summary, explanation, confidence, source_excerpt }.
 * Summary must not exceed ~15 words (NFR-USA.3).
 */
async function generateExplanationWithGemini(field, language, groundingDoc) {
    const client = getClient();
    const langNames = {
        en: 'English',
        hi: 'Hindi (हिंदी)',
        mr: 'Marathi (मराठी)',
    };
    const hasOfficialGrounding = groundingDoc && groundingDoc.score >= config_1.config.similarityThreshold;
    if (!client) {
        // Offline / mock fallback when running without GEMINI_API_KEY
        return buildFallbackExplanation(field, language, hasOfficialGrounding ? groundingDoc : undefined);
    }
    const prompt = `You are FormAssist, an accessibility assistant explaining web form fields in plain, simple, reassuring language for first-generation and non-native language form fillers.
Language requirement: Generate your response strictly in ${langNames[language]}.

Target Field:
- Label: "${field.label}"
- Input Type: "${field.inputType}"
- Required: ${field.isRequired ? 'Yes' : 'No'}
${field.placeholder ? `- Placeholder text: "${field.placeholder}"` : ''}
${field.helpText ? `- On-page help text: "${field.helpText}"` : ''}
${field.options && field.options.length > 0 ? `- Options: ${field.options.join(', ')}` : ''}

${hasOfficialGrounding && groundingDoc
        ? `Grounding Source Document ("${groundingDoc.title}" - ${groundingDoc.url}):\n"""\n${groundingDoc.contentText}\n"""\nBase the explanation strictly on this official document if relevant.`
        : field.helpText
            ? `Base the explanation on the on-page help text: "${field.helpText}".`
            : `Explain this field clearly using general knowledge of common forms and applications.`}

Requirements:
1. "summary": A single concise sentence explaining what this field is asking for, strictly 15 words or fewer.
2. "explanation": A clear, 2-3 sentence explanation explaining why this information is needed, where to find it on personal documents (e.g. Aadhaar, ration card, mark sheet), and any common mistakes to avoid.
3. "confidence": A float from 0.0 to 1.0 representing how confident and grounded this explanation is.
4. "source_excerpt": A brief 1-2 sentence verbatim or closely paraphrased excerpt from the grounding text (leave empty string if no grounding text).

Return ONLY a valid JSON object matching this schema:
{
  "summary": "...",
  "explanation": "...",
  "confidence": 0.95,
  "source_excerpt": "..."
}`;
    try {
        const response = await client.models.generateContent({
            model: config_1.config.geminiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        const responseText = response.text || '';
        const parsed = JSON.parse(responseText);
        const sourceLabel = hasOfficialGrounding
            ? 'official'
            : field.helpText
                ? 'page'
                : 'ai';
        return {
            summary: parsed.summary || `${field.label}: Please fill this required information.`,
            text: parsed.explanation || parsed.summary || 'Clear explanation unavailable.',
            sourceLabel,
            sourceUrl: hasOfficialGrounding ? groundingDoc?.url : undefined,
            sourceExcerpt: parsed.source_excerpt || (hasOfficialGrounding ? groundingDoc?.title : undefined),
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        };
    }
    catch (err) {
        console.error(`Gemini explanation generation failed for ${field.label}:`, err.message);
        // NFR-REL.2: Gracefully degrade rather than failing the whole form
        return buildFallbackExplanation(field, language, hasOfficialGrounding ? groundingDoc : undefined);
    }
}
/**
 * Fallback explanation generator for offline/unconfigured environments or network degradation
 */
function buildFallbackExplanation(field, language, groundingDoc) {
    const lbl = field.label.trim();
    const isReq = field.isRequired;
    if (groundingDoc) {
        return {
            summary: `${lbl}: Information required per official guidelines.`,
            text: `According to ${groundingDoc.title}, enter your valid ${lbl}. Ensure this matches your official records.`,
            sourceLabel: 'official',
            sourceUrl: groundingDoc.url,
            sourceExcerpt: groundingDoc.contentText.slice(0, 150) + '...',
            confidence: 0.9,
        };
    }
    if (field.helpText) {
        return {
            summary: `${lbl}: Follow on-page instructions.`,
            text: `${field.helpText}. Please check the requirements indicated on the form page.`,
            sourceLabel: 'page',
            confidence: 0.8,
        };
    }
    if (language === 'hi') {
        return {
            summary: `${lbl}: यह जानकारी फॉर्म में भरना ${isReq ? 'अनिवार्य' : 'वैकल्पिक'} है।`,
            text: `कृपया अपने आधिकारिक दस्तावेजों (जैसे आधार कार्ड, प्रमाणपत्र) के अनुसार ${lbl} दर्ज करें।`,
            sourceLabel: 'ai',
            confidence: 0.75,
        };
    }
    if (language === 'mr') {
        return {
            summary: `${lbl}: ही माहिती फॉर्ममध्ये भरणे ${isReq ? 'आवश्यक' : 'ऐच्छिक'} आहे.`,
            text: `कृपया आपल्या अधिकृत कागदपत्रांनुसार ${lbl} अचूक नोंदवा.`,
            sourceLabel: 'ai',
            confidence: 0.75,
        };
    }
    return {
        summary: `${lbl}: Enter this ${isReq ? 'required' : 'optional'} information accurately.`,
        text: `Provide your ${lbl} as stated on your government or institutional identity documents.`,
        sourceLabel: 'ai',
        confidence: 0.75,
    };
}
/**
 * FR-CHAT.2 & FR-CHAT.3: Context-aware chat reply generation using Gemini.
 * Prompt incorporates form title, focused field, boolean fill-states, and last 4-6 conversation turns.
 */
async function generateChatReplyWithGemini(params) {
    const client = getClient();
    const langNames = {
        en: 'English',
        hi: 'Hindi (हिंदी)',
        mr: 'Marathi (मराठी)',
    };
    const sysPrompt = `You are FormAssist, an empathetic, helpful assistant guiding a user who is filling out an online form.
Language: Answer strictly in ${langNames[params.language]}.
Rules:
1. Explain what documents they might need, how to format their answer, or what terms mean.
2. Be brief, warm, practical, and clear. Avoid bureaucratic jargon.
3. PRIVACY: You do NOT have access to what they typed into fields (zero-knowledge policy), only whether fields are completed or blank. Never pretend you can see their private numbers.
${params.formTitle ? `Form: "${params.formTitle}"` : ''}
${params.focusedField ? `The user is currently focused on field: "${params.focusedField.label}".` : 'No specific field is currently selected.'}
${params.focusedField?.explanation ? `Context for this field: ${params.focusedField.explanation}` : ''}
${params.completedFieldKeys && params.completedFieldKeys.length > 0 ? `Completed fields on page: ${params.completedFieldKeys.length} fields filled.` : ''}
`;
    if (!client) {
        if (params.language === 'hi') {
            return `मैं आपकी सहायता के लिए तैयार हूँ। "${params.focusedField?.label || 'इस फील्ड'}" के लिए अपने संबंधित सरकारी दस्तावेज की जांच करें।`;
        }
        if (params.language === 'mr') {
            return `मी मदतीसाठी तयार आहे. "${params.focusedField?.label || 'या फील्ड'}" साठी आपली अधिकृत कागदपत्रे तपासा.`;
        }
        return `I am here to help you. For "${params.focusedField?.label || 'this field'}", please ensure the details match your official documents. Let me know if you need specific document guidance!`;
    }
    // Construct conversation contents for Gemini
    const promptContents = [
        sysPrompt,
        ...params.recentMessages.slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
        `User: ${params.userMessage}`,
        'Assistant:',
    ].join('\n\n');
    try {
        const response = await client.models.generateContent({
            model: config_1.config.geminiModel,
            contents: promptContents,
        });
        return response.text?.trim() || 'I am sorry, I could not generate a reply. Please try again.';
    }
    catch (err) {
        console.error('Gemini chat generation failed:', err.message);
        return 'I apologize, the assistant service is temporarily experiencing high load. Please try asking again in a moment.';
    }
}
//# sourceMappingURL=gemini.js.map