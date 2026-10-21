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

  const query = userText.toLowerCase();
  const fieldKey = (fieldId || '').toLowerCase();
  let replyText = '';

  // 1. Domicile / Residence Certificate
  if (
    /domicile|residence|resident|niwas|adhivas|state quota|who issues|issuing authority/i.test(query) ||
    /domicile|residence|resident/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**निवास प्रमाण पत्र (Domicile Certificate)** राज्य सरकार के राजस्व विभाग द्वारा जारी किया जाता है:\n\n* **जारीकर्ता प्राधिकारी:** तहसीलदार (Tehsildar), उप-विभागीय मजिस्ट्रेट (SDM), या जिला मजिस्ट्रेट (DM) कार्यालय।\n* **ऑनलाइन आवेदन:** आप इसे अपने राज्य के आधिकारिक **ई-डिस्ट्रिक्ट (e-District)** पोर्टल या नजदीकी जन सेवा केंद्र (CSC / Common Service Centre) से बनवा सकते हैं।\n* **उद्देश्य:** यह साबित करता है कि आप राज्य के स्थायी निवासी हैं, जो राज्य कोटे की छात्रवृत्ति के लिए आवश्यक है।`;
    } else if (language === 'mr') {
      replyText = `**अधिवास प्रमाणपत्र (Domicile Certificate)** राज्य शासनाच्या महसूल विभागाकडून जारी केले जाते:\n\n* **सक्षम अधिकारी:** **तहसीलदार** किंवा **उपविभागीय अधिकारी (SDM)** कार्यालय.\n* **ऑनलाइन अर्ज:** आपण हे **'आपले सरकार' (Aaple Sarkar)** किंवा राज्य ई-डिस्ट्रिक्ट पोर्टलवरून तसेच महा-ई-सेवा केंद्रातून काढू शकता.\n* **महत्त्व:** राज्य कोट्यातील शिष्यवृत्तीचा लाभ मिळवण्यासाठी आपण संबंधित राज्याचे रहिवासी असल्याचे सिद्ध करणे बंधनकारक असते.`;
    } else {
      replyText = `A **Domicile Certificate** (Proof of State Residence) is issued by the Revenue Department of your State Government:\n\n* **Issuing Authority:** Typically the **Tehsildar**, **Sub-Divisional Magistrate (SDM)**, or **District Magistrate (DM)**.\n* **Where to Apply:** You can apply online through your state's official **e-District portal** or visit an authorized Common Service Centre (CSC) / Citizen Service Kendra.\n* **Purpose:** It certifies that you are a permanent resident of the state, which is mandatory for claiming state-quota scholarships.`;
    }
  }
  // 2. Annual Family Income / Income Certificate
  else if (
    /income|salary|earning|annual|2\.5|lakh|aay|utpanna|limit|family income/i.test(query) ||
    /income/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**वार्षिक पारिवारिक आय (Annual Family Income) के नियम:**\n\n* **आय सीमा:** राष्ट्रीय छात्रवृत्ति (NSP) के तहत अधिकांश योजनाओं के लिए सभी स्रोतों से कुल पारिवारिक आय **₹2,50,000 प्रति वर्ष** से अधिक नहीं होनी चाहिए।\n* **किसकी आय जोड़ें:** माता और पिता/अभिभावक दोनों की कुल आय जोड़नी होगी।\n* **आवश्यक प्रमाण:** सक्षम राजस्व अधिकारी (तहसीलदार या राजस्व निरीक्षक) द्वारा जारी चालू वित्तीय वर्ष का वैध आय प्रमाण पत्र संलग्न करें। वेतनभोगी कर्मचारियों के लिए Form 16 या वेतन पर्ची मान्य होती है।`;
    } else if (language === 'mr') {
      replyText = `**वार्षिक कौटुंबिक उत्पन्न (Annual Family Income):**\n\n* **उत्पन्न मर्यादा:** शिष्यवृत्तीसाठी सर्व स्त्रोतांकडून मिळणारे एकूण वार्षिक कौटुंबिक उत्पन्न साधारणपणे **₹२,५०,०००** पेक्षा कमी असणे आवश्यक असते.\n* **आवश्यक कागदपत्र:** सक्षम महसूल अधिकाऱ्याने (तहसीलदार) दिलेले चालू आर्थिक वर्षाचे अधिकृत उत्पन्न प्रमाणपत्र लागते. नोकरदार पालकांसाठी Form 16 किंवा सॅलरी स्लिप आवश्यक असते.`;
    } else {
      replyText = `**Annual Family Income Guidelines:**\n\n* **Income Cap:** For most scholarship schemes (including NSP), the total family income from all combined sources must not exceed **₹2,50,000 per annum**.\n* **Calculation:** Combine the gross earnings of both parents/legal guardians for the current financial year.\n* **Supporting Document:** Submit an official Income Certificate issued by a competent revenue authority (such as a **Tahsildar** or Revenue Inspector). Salaried guardians can provide Form 16 or recent salary slips.`;
    }
  }
  // 3. Social Category / Caste Certificate
  else if (
    /category|caste|quota|sc|st|obc|ews|general|jaati|reservation/i.test(query) ||
    /category|caste/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**सामाजिक श्रेणी (Social Category) संबंधी दिशानिर्देश:**\n\n* अपने प्रमाण पत्र के अनुसार सही श्रेणी चुनें: **General, OBC, SC, ST, या EWS**।\n* यदि आप आरक्षित वर्ग या अल्पसंख्यक छात्रवृत्ति का चयन करते हैं, तो आपके पास सक्षम जिला प्राधिकारी द्वारा जारी डिजिटल जाति प्रमाण पत्र का क्रमांक (Certificate Number) होना आवश्यक है।`;
    } else if (language === 'mr') {
      replyText = `**सामाजिक प्रवर्ग (Social Category):**\n\n* आपल्या जात प्रमाणपत्रानुसार योग्य प्रवर्ग निवडा: **General, OBC, SC, ST, किंवा EWS**.\n* आरक्षणाचा अथवा शिष्यवृत्तीचा लाभ घेण्यासाठी सक्षम प्राधिकाऱ्याने दिलेला वैध डिजिटल जात प्रमाणपत्र क्रमांक फॉर्ममध्ये अचूक नोंदवा.`;
    } else {
      replyText = `**Social Category Guidelines:**\n\n* Select the category matching your official documents: **General, OBC, SC, ST, or EWS**.\n* If applying under a reserved quota or minority scheme, you must provide a digitally verifiable **Caste Certificate number** issued by the competent district authority (Sub-Divisional Officer / Tahsildar).`;
    }
  }
  // 4. Bank Account / Aadhaar Seeding / DBT
  else if (
    /bank|account|dbt|seed|npci|passbook|khata|direct benefit/i.test(query) ||
    /bank|account/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**बैंक खाता एवं आधार सीडिंग (Aadhaar Seeded Account):**\n\n* **व्यक्तिगत खाता:** बैंक खाता छात्र के अपने नाम पर एक सक्रिय बचत खाता (Savings Account) होना चाहिए। संयुक्त (Joint) या निष्क्रिय खाते स्वीकार्य नहीं हैं।\n* **डीबीटी एवं आधार:** छात्रवृत्ति राशि सीधे **Direct Benefit Transfer (DBT)** द्वारा भेजी जाती है, इसलिए आपका बैंक खाता बैंक शाखा में जाकर **आधार से सीड (Aadhaar Seeded / NPCI Mapped)** होना अनिवार्य है।`;
    } else if (language === 'mr') {
      replyText = `**बँक खाते व आधार सीडिंग:**\n\n* बँक खाते अर्जदाराच्या स्वतःच्या नावावर सक्रिय बचत खाते असणे आवश्यक आहे.\n* शिष्यवृत्ती थेट **DBT (Direct Benefit Transfer)** द्वारे जमा होते, त्यामुळे आपले खाते बँकेत जाऊन आधार क्रमांकाशी जोडलेले (**Aadhaar Seeded / NPCI Mapped**) असणे बंधनकारक आहे.`;
    } else {
      replyText = `**Bank Account & Aadhaar Seeding Requirements:**\n\n* **Account Holder:** The bank account must be an active individual savings account in the student's own name. Joint accounts or dormant accounts are rejected.\n* **Aadhaar Seeding (DBT):** Scholarship funds are disbursed exclusively via **Direct Benefit Transfer (DBT)**. Ensure your account is **Aadhaar-seeded** on the NPCI mapper by visiting your bank branch.`;
    }
  }
  // 5. IFSC Code
  else if (
    /ifsc|branch code|bank code/i.test(query) ||
    /ifsc/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**आईएफएससी कोड (IFSC Code):**\n\n* यह 11 अक्षरों का अल्फ़ान्यूमेरिक कोड होता है जो आपकी बैंक पासबुक के मुख्य पृष्ठ या चेकबुक पर मुद्रित होता है (उदा. \`SBIN0001234\`)।\n* पहले 4 अक्षर बैंक का नाम दर्शाते हैं, 5वां अक्षर हमेशा **'0' (शून्य)** होता है, और अंतिम 6 अक्षर शाखा कोड दर्शाते हैं।`;
    } else if (language === 'mr') {
      replyText = `**IFSC कोड माहिती:**\n\n* हा ११ अक्षरी कोड असतो जो आपल्या बँकेच्या पासबुकवर किंवा धनादेशावर (Cheque) छापलेला असतो (उदा. \`SBIN0001234\`).\n* पहिले ४ अक्षरे बँकेचे नाव, ५ वा आकडा नेहमी **'०' (शून्य)**, आणि शेवटचे ६ आकडे शाखेचा कोड दर्शवतात.`;
    } else {
      replyText = `**IFSC Code Details:**\n\n* The **IFSC** is an 11-character alphanumeric code printed on the front page of your bank passbook or cheque book (e.g., \`SBIN0001234\`).\n* The first 4 characters represent the bank, the 5th character is always **'0' (zero)**, and the last 6 characters identify your specific branch.`;
    }
  }
  // 6. Date of Birth / DOB
  else if (
    /dob|date of birth|birth|janam/i.test(query) ||
    /birth|dob/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**जन्म तिथि (Date of Birth):**\n\n* जन्म तिथि को \`DD-MM-YYYY\` प्रारूप में दर्ज करें।\n* ध्यान रहे कि यह आपकी **10वीं कक्षा की अंकतालिका (Class 10th Marks Sheet)** या जन्म प्रमाण पत्र के रिकॉर्ड से अक्षरशः मेल खानी चाहिए।`;
    } else if (language === 'mr') {
      replyText = `**जन्मतारीख (Date of Birth):**\n\n* जन्मतारीख \`DD-MM-YYYY\` स्वरूपात नोंदवा.\n* ही नोंद आपल्या **दहावीच्या गुणपत्रिकेवरील (Class 10th Marksheet)** किंवा जन्माच्या दाखल्यावरील तारखेशी तंतोतंत जुळली पाहिजे.`;
    } else {
      replyText = `**Date of Birth (DOB):**\n\n* Enter your Date of Birth in \`DD-MM-YYYY\` format.\n* Ensure it strictly matches your **Class 10th Marks Sheet** or official Birth Certificate to avoid document verification mismatches.`;
    }
  }
  // 7. Full Name / Candidate Name
  else if (
    /candidate name|full name|first name|last name|spelling|naam/i.test(query) ||
    /candidate.*name|full.*name/i.test(fieldKey)
  ) {
    if (language === 'hi') {
      replyText = `**उम्मीदवार का पूरा नाम:**\n\n* अपना नाम ठीक वैसे ही लिखें जैसा आपकी **10वीं कक्षा की अंकतालिका** पर लिखा है।\n* नाम के आगे श्री, श्रीमती, कुमारी, Mr., Ms. आदि उपसर्ग न जोड़ें।`;
    } else if (language === 'mr') {
      replyText = `**उमेदवाराचे पूर्ण नाव:**\n\n* आपले नाव दहावीच्या गुणपत्रिकेवर (Class 10th Marksheet) नमूद केल्याप्रमाणे अचूक भरा.\n* नावाच्या आधी श्री, कुमारी किंवा इतर पदव्या (Mr./Ms.) लावू नका.`;
    } else {
      replyText = `**Candidate Full Name:**\n\n* Enter your name exactly as spelled on your **Class 10th Certificate / Marks Sheet**.\n* Do not include titles or honorifics such as Mr., Ms., Shri, or Kumari.`;
    }
  }
  // 8. General / Contextual
  else {
    const fieldName = fieldId ? fieldId.replace(/[-_]/g, ' ') : 'this question';
    if (language === 'hi') {
      replyText = `**"${fieldName}" के संबंध में:**\n\n* कृपया यह विवरण अपने आधिकारिक सरकारी पहचान पत्र या शैक्षिक प्रमाण पत्र के अनुसार भरें।\n* यदि आपको किसी प्रमाण पत्र या प्रारूप से संबंधित कोई विशिष्ट सहायता चाहिए, तो कृपया पूछें!`;
    } else if (language === 'mr') {
      replyText = `**"${fieldName}" या प्रश्नाबाबत:**\n\n* कृपया ही माहिती आपल्या संबंधित अधिकृत कागदपत्रांनुसार अचूक भरा.\n* आपल्याला आवश्यक प्रमाणपत्र किंवा पद्धतीबाबत अधिक मदत हवी असल्यास नक्की विचारा!`;
    } else {
      replyText = `**Regarding "${fieldName}":**\n\n* Please enter the details as verified by your government-issued certificate or official ID.\n* Ensure the information strictly matches your original documents before final form submission. Let me know if you need specific guidance on required formats!`;
    }
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    content: replyText,
    timestamp: Date.now(),
    focusedFieldId: fieldId,
  };
}
