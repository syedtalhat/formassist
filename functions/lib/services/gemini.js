"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.l2Normalize = l2Normalize;
exports.cosineSimilarity = cosineSimilarity;
exports.generateEmbedding = generateEmbedding;
exports.generateExplanationWithGemini = generateExplanationWithGemini;
exports.generateIntelligentContextualReply = generateIntelligentContextualReply;
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
 * Intelligent contextual fallback reply generator for Indian e-governance, banking, and scholarship forms.
 * Used when Gemini API is under heavy demand (503/429) or offline to ensure users always receive accurate, direct answers.
 */
function generateIntelligentContextualReply(params) {
    const query = params.userMessage.toLowerCase();
    const fieldLabel = params.focusedField?.label || '';
    const fieldLabelLower = fieldLabel.toLowerCase();
    const lang = params.language;
    // 1. Domicile / Residence Certificate
    if (/domicile|residence|resident|niwas|adhivas|state quota|who issues|issuing authority/i.test(query) ||
        /domicile|residence|resident/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**निवास प्रमाण पत्र (Domicile Certificate)** राज्य सरकार के राजस्व विभाग द्वारा जारी किया जाता है:\n\n* **जारीकर्ता प्राधिकारी:** तहसीलदार (Tehsildar), उप-विभागीय मजिस्ट्रेट (SDM), या जिला मजिस्ट्रेट (DM) कार्यालय।\n* **ऑनलाइन आवेदन:** आप इसे अपने राज्य के आधिकारिक **ई-डिस्ट्रिक्ट (e-District)** पोर्टल या नजदीकी जन सेवा केंद्र (CSC / Common Service Centre) से बनवा सकते हैं।\n* **उद्देश्य:** यह साबित करता है कि आप राज्य के स्थायी निवासी हैं, जो राज्य कोटे की छात्रवृत्ति के लिए आवश्यक है।`;
        }
        if (lang === 'mr') {
            return `**अधिवास प्रमाणपत्र (Domicile Certificate)** राज्य शासनाच्या महसूल विभागाकडून जारी केले जाते:\n\n* **सक्षम अधिकारी:** **तहसीलदार** किंवा **उपविभागीय अधिकारी (SDM)** कार्यालय.\n* **ऑनलाइन अर्ज:** आपण हे **'आपले सरकार' (Aaple Sarkar)** किंवा राज्य ई-डिस्ट्रिक्ट पोर्टलवरून तसेच महा-ई-सेवा केंद्रातून काढू शकता.\n* **महत्त्व:** राज्य कोट्यातील शिष्यवृत्तीचा लाभ मिळवण्यासाठी आपण संबंधित राज्याचे रहिवासी असल्याचे सिद्ध करणे बंधनकारक असते.`;
        }
        return `A **Domicile Certificate** (Proof of State Residence) is issued by the Revenue Department of your State Government:\n\n* **Issuing Authority:** Typically the **Tehsildar**, **Sub-Divisional Magistrate (SDM)**, or **District Magistrate (DM)**.\n* **Where to Apply:** You can apply online through your state's official **e-District portal** or visit an authorized Common Service Centre (CSC) / Citizen Service Kendra.\n* **Purpose:** It certifies that you are a permanent resident of the state, which is mandatory for claiming state-quota scholarships.`;
    }
    // 2. Annual Family Income / Income Certificate
    if (/income|salary|earning|annual|2\.5|lakh|aay|utpanna|limit|family income/i.test(query) ||
        /income/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**वार्षिक पारिवारिक आय (Annual Family Income) के नियम:**\n\n* **आय सीमा:** राष्ट्रीय छात्रवृत्ति (NSP) के तहत अधिकांश योजनाओं के लिए सभी स्रोतों से कुल पारिवारिक आय **₹2,50,000 प्रति वर्ष** से अधिक नहीं होनी चाहिए।\n* **किसकी आय जोड़ें:** माता और पिता/अभिभावक दोनों की कुल आय जोड़नी होगी।\n* **आवश्यक प्रमाण:** सक्षम राजस्व अधिकारी (तहसीलदार या राजस्व निरीक्षक) द्वारा जारी चालू वित्तीय वर्ष का वैध आय प्रमाण पत्र संलग्न करें। वेतनभोगी कर्मचारियों के लिए Form 16 या वेतन पर्ची मान्य होती है।`;
        }
        if (lang === 'mr') {
            return `**वार्षिक कौटुंबिक उत्पन्न (Annual Family Income):**\n\n* **उत्पन्न मर्यादा:** शिष्यवृत्तीसाठी सर्व स्त्रोतांकडून मिळणारे एकूण वार्षिक कौटुंबिक उत्पन्न साधारणपणे **₹२,५०,०००** पेक्षा कमी असणे आवश्यक असते.\n* **आवश्यक कागदपत्र:** सक्षम महसूल अधिकाऱ्याने (तहसीलदार) दिलेले चालू आर्थिक वर्षाचे अधिकृत उत्पन्न प्रमाणपत्र लागते. नोकरदार पालकांसाठी Form 16 किंवा सॅलरी स्लिप आवश्यक असते.`;
        }
        return `**Annual Family Income Guidelines:**\n\n* **Income Cap:** For most scholarship schemes (including NSP), the total family income from all combined sources must not exceed **₹2,50,000 per annum**.\n* **Calculation:** Combine the gross earnings of both parents/legal guardians for the current financial year.\n* **Supporting Document:** Submit an official Income Certificate issued by a competent revenue authority (such as a **Tahsildar** or Revenue Inspector). Salaried guardians can provide Form 16 or recent salary slips.`;
    }
    // 3. Social Category / Caste Certificate
    if (/category|caste|quota|sc|st|obc|ews|general|jaati|reservation/i.test(query) ||
        /category|caste/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**सामाजिक श्रेणी (Social Category) संबंधी दिशानिर्देश:**\n\n* अपने प्रमाण पत्र के अनुसार सही श्रेणी चुनें: **General, OBC, SC, ST, या EWS**।\n* यदि आप आरक्षित वर्ग या अल्पसंख्यक छात्रवृत्ति का चयन करते हैं, तो आपके पास सक्षम जिला प्राधिकारी द्वारा जारी डिजिटल जाति प्रमाण पत्र का क्रमांक (Certificate Number) होना आवश्यक है।`;
        }
        if (lang === 'mr') {
            return `**सामाजिक प्रवर्ग (Social Category):**\n\n* आपल्या जात प्रमाणपत्रानुसार योग्य प्रवर्ग निवडा: **General, OBC, SC, ST, किंवा EWS**.\n* आरक्षणाचा अथवा शिष्यवृत्तीचा लाभ घेण्यासाठी सक्षम प्राधिकाऱ्याने दिलेला वैध डिजिटल जात प्रमाणपत्र क्रमांक फॉर्ममध्ये अचूक नोंदवा.`;
        }
        return `**Social Category Guidelines:**\n\n* Select the category matching your official documents: **General, OBC, SC, ST, or EWS**.\n* If applying under a reserved quota or minority scheme, you must provide a digitally verifiable **Caste Certificate number** issued by the competent district authority (Sub-Divisional Officer / Tahsildar).`;
    }
    // 4. Bank Account / Aadhaar Seeding / DBT
    if (/bank|account|dbt|seed|npci|passbook|khata|direct benefit/i.test(query) ||
        /bank|account/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**बैंक खाता एवं आधार सीडिंग (Aadhaar Seeded Account):**\n\n* **व्यक्तिगत खाता:** बैंक खाता छात्र के अपने नाम पर एक सक्रिय बचत खाता (Savings Account) होना चाहिए। संयुक्त (Joint) या निष्क्रिय खाते स्वीकार्य नहीं हैं।\n* **डीबीटी एवं आधार:** छात्रवृत्ति राशि सीधे **Direct Benefit Transfer (DBT)** द्वारा भेजी जाती है, इसलिए आपका बैंक खाता बैंक शाखा में जाकर **आधार से सीड (Aadhaar Seeded / NPCI Mapped)** होना अनिवार्य है।`;
        }
        if (lang === 'mr') {
            return `**बँक खाते व आधार सीडिंग:**\n\n* बँक खाते अर्जदाराच्या स्वतःच्या नावावर सक्रिय बचत खाते असणे आवश्यक आहे.\n* शिष्यवृत्ती थेट **DBT (Direct Benefit Transfer)** द्वारे जमा होते, त्यामुळे आपले खाते बँकेत जाऊन आधार क्रमांकाशी जोडलेले (**Aadhaar Seeded / NPCI Mapped**) असणे बंधनकारक आहे.`;
        }
        return `**Bank Account & Aadhaar Seeding Requirements:**\n\n* **Account Holder:** The bank account must be an active individual savings account in the student's own name. Joint accounts or dormant accounts are rejected.\n* **Aadhaar Seeding (DBT):** Scholarship funds are disbursed exclusively via **Direct Benefit Transfer (DBT)**. Ensure your account is **Aadhaar-seeded** on the NPCI mapper by visiting your bank branch.`;
    }
    // 5. IFSC Code
    if (/ifsc|branch code|bank code/i.test(query) ||
        /ifsc/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**आईएफएससी कोड (IFSC Code):**\n\n* यह 11 अक्षरों का अल्फ़ान्यूमेरिक कोड होता है जो आपकी बैंक पासबुक के मुख्य पृष्ठ या चेकबुक पर मुद्रित होता है (उदा. \`SBIN0001234\`)।\n* पहले 4 अक्षर बैंक का नाम दर्शाते हैं, 5वां अक्षर हमेशा **'0' (शून्य)** होता है, और अंतिम 6 अक्षर शाखा कोड दर्शाते हैं।`;
        }
        if (lang === 'mr') {
            return `**IFSC कोड माहिती:**\n\n* हा ११ अक्षरी कोड असतो जो आपल्या बँकेच्या पासबुकवर किंवा धनादेशावर (Cheque) छापलेला असतो (उदा. \`SBIN0001234\`).\n* पहिले ४ अक्षरे बँकेचे नाव, ५ वा आकडा नेहमी **'०' (शून्य)**, आणि शेवटचे ६ आकडे शाखेचा कोड दर्शवतात.`;
        }
        return `**IFSC Code Details:**\n\n* The **IFSC** is an 11-character alphanumeric code printed on the front page of your bank passbook or cheque book (e.g., \`SBIN0001234\`).\n* The first 4 characters represent the bank, the 5th character is always **'0' (zero)**, and the last 6 characters identify your specific branch.`;
    }
    // 6. Date of Birth / DOB
    if (/dob|date of birth|birth|janam/i.test(query) ||
        /birth|dob/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**जन्म तिथि (Date of Birth):**\n\n* जन्म तिथि को \`DD-MM-YYYY\` प्रारूप में दर्ज करें।\n* ध्यान रहे कि यह आपकी **10वीं कक्षा की अंकतालिका (Class 10th Marks Sheet)** या जन्म प्रमाण पत्र के रिकॉर्ड से अक्षरशः मेल खानी चाहिए।`;
        }
        if (lang === 'mr') {
            return `**जन्मतारीख (Date of Birth):**\n\n* जन्मतारीख \`DD-MM-YYYY\` स्वरूपात नोंदवा.\n* ही नोंद आपल्या **दहावीच्या गुणपत्रिकेवरील (Class 10th Marksheet)** किंवा जन्माच्या दाखल्यावरील तारखेशी तंतोतंत जुळली पाहिजे.`;
        }
        return `**Date of Birth (DOB):**\n\n* Enter your Date of Birth in \`DD-MM-YYYY\` format.\n* Ensure it strictly matches your **Class 10th Marks Sheet** or official Birth Certificate to avoid document verification mismatches.`;
    }
    // 7. Candidate Full Name
    if (/candidate name|full name|first name|last name|spelling|naam/i.test(query) ||
        /candidate.*name|full.*name/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**उम्मीदवार का पूरा नाम:**\n\n* अपना नाम ठीक वैसे ही लिखें जैसा आपकी **10वीं कक्षा की अंकतालिका** पर लिखा है।\n* नाम के आगे श्री, श्रीमती, कुमारी, Mr., Ms. आदि उपसर्ग न जोड़ें।`;
        }
        if (lang === 'mr') {
            return `**उमेदवाराचे पूर्ण नाव:**\n\n* आपले नाव दहावीच्या गुणपत्रिकेवर (Class 10th Marksheet) नमूद केल्याप्रमाणे अचूक भरा.\n* नावाच्या आधी श्री, कुमारी किंवा इतर पदव्या (Mr./Ms.) लावू नका.`;
        }
        return `**Candidate Full Name:**\n\n* Enter your name exactly as spelled on your **Class 10th Certificate / Marks Sheet**.\n* Do not include titles or honorifics such as Mr., Ms., Shri, or Kumari.`;
    }
    // 8. PAN / Form 60
    if (/pan|pan card|form 60|tax/i.test(query) ||
        /pan/i.test(fieldLabelLower)) {
        if (lang === 'hi') {
            return `**पैन (Permanent Account Number) कार्ड:**\n\n* पैन आयकर विभाग द्वारा जारी 10 अक्षरों का अल्फ़ान्यूमेरिक पहचान पत्र होता है (उदा. \`ABCDE1234F\`)।\n* बैंकिंग एवं वित्तीय लेनदेन के लिए यह आवश्यक है। यदि आपके पास पैन नहीं है, तो आप Form 60 घोषणा पत्र भर सकते हैं।`;
        }
        if (lang === 'mr') {
            return `**पॅन (PAN) क्रमांक माहिती:**\n\n* पॅन हा आयकर विभागाने दिलेला १० अक्षरी अल्फान्युमेरिक ओळख क्रमांक आहे (उदा. \`ABCDE1234F\`).\n* बँक केवायसीसाठी हा आवश्यक असतो. पॅन नसल्यास फॉर्म ६० भरता येतो.`;
        }
        return `**PAN (Permanent Account Number) Guidelines:**\n\n* PAN is a 10-character alphanumeric identity issued by the Income Tax Department (e.g., \`ABCDE1234F\`).\n* It is mandatory for financial and banking transactions. Individuals without a PAN may declare exempt income using Form 60.`;
    }
    // 9. Generic / Focused Field Contextual Answer
    if (fieldLabel) {
        if (lang === 'hi') {
            return `**"${fieldLabel}" के संबंध में:**\n\n* कृपया इस फ़ील्ड में जानकारी अपने संबंधित आधिकारिक सरकारी या शैक्षिक दस्तावेजों के अनुसार भरें।\n${params.focusedField?.explanation ? `* **विवरण:** ${params.focusedField.explanation}\n` : ''}* यदि आपको किसी प्रमाण पत्र या प्रारूप से संबंधित कोई विशिष्ट सहायता चाहिए, तो कृपया पूछें!`;
        }
        if (lang === 'mr') {
            return `**"${fieldLabel}" या प्रश्नाबाबत:**\n\n* कृपया ही माहिती आपल्या संबंधित अधिकृत कागदपत्रांनुसार अचूक भरा.\n${params.focusedField?.explanation ? `* **माहिती:** ${params.focusedField.explanation}\n` : ''}* आपल्याला आवश्यक प्रमाणपत्र किंवा पद्धतीबाबत अधिक मदत हवी असल्यास नक्की विचारा!`;
        }
        return `**Regarding "${fieldLabel}":**\n\n* Please enter the details exactly as verified on your supporting institutional or government documents.\n${params.focusedField?.explanation ? `* **Guidance:** ${params.focusedField.explanation}\n` : ''}* Feel free to ask if you need details on specific document formats or issuing authorities!`;
    }
    // 10. General Help
    if (lang === 'hi') {
        return `मैं फॉर्म भरने में आपकी सहायता के लिए उपस्थित हूँ। आप फ़ील्ड पर क्लिक करके उसका विवरण देख सकते हैं, या मुझसे किसी भी दस्तावेज़, आय सीमा, या प्रमाण पत्र के बारे में पूछ सकते हैं!`;
    }
    if (lang === 'mr') {
        return `मी फॉर्म भरताना मार्गदर्शन करण्यासाठी उपलब्ध आहे. आपण कोणत्याही प्रश्नावर क्लिक करून त्याची माहिती पाहू शकता, किंवा आवश्यक कागदपत्रांविषयी विचारू शकता!`;
    }
    return `I am here to help you navigate this form. Click on any field to view its guidance, or ask me about required documents, income eligibility limits, or issuing authorities!`;
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
    if (!client) {
        return generateIntelligentContextualReply({
            userMessage: params.userMessage,
            focusedField: params.focusedField,
            language: params.language,
            formTitle: params.formTitle,
        });
    }
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
    // Construct conversation contents for Gemini
    const promptContents = [
        sysPrompt,
        ...params.recentMessages.slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
        `User: ${params.userMessage}`,
        'Assistant:',
    ].join('\n\n');
    // Try primary model (gemini-3.8-flash)
    try {
        const response = await client.models.generateContent({
            model: config_1.config.geminiModel,
            contents: promptContents,
        });
        if (response.text && response.text.trim()) {
            return response.text.trim();
        }
    }
    catch (err) {
        console.warn(`Primary Gemini model (${config_1.config.geminiModel}) failed:`, err?.message || err);
        // Try fallback model if configured and different
        if (config_1.config.geminiFallbackModel && config_1.config.geminiFallbackModel !== config_1.config.geminiModel) {
            try {
                const fallbackRes = await client.models.generateContent({
                    model: config_1.config.geminiFallbackModel,
                    contents: promptContents,
                });
                if (fallbackRes.text && fallbackRes.text.trim()) {
                    return fallbackRes.text.trim();
                }
            }
            catch (fbErr) {
                console.warn(`Fallback Gemini model (${config_1.config.geminiFallbackModel}) failed:`, fbErr?.message || fbErr);
            }
        }
    }
    // Graceful intelligent contextual fallback when Gemini API is busy/503/offline
    return generateIntelligentContextualReply({
        userMessage: params.userMessage,
        focusedField: params.focusedField,
        language: params.language,
        formTitle: params.formTitle,
    });
}
//# sourceMappingURL=gemini.js.map