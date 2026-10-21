/**
 * Canned mock explanations and risk flags for the 3 test fixtures
 * Covers English (en), Hindi (hi), and Marathi (mr)
 */

import { FieldExplanation, RiskFlag, Language } from '../types';

export interface CannedFormData {
  formId: string;
  domain: string;
  riskFlags: RiskFlag[];
  explanations: Record<Language, Record<string, FieldExplanation>>;
}

export const MOCK_FORMS: Record<string, CannedFormData> = {
  // 1. National Scholarship Income Form
  'scholarship-form': {
    formId: 'scholarship-form',
    domain: 'scholarships.gov.example',
    riskFlags: [],
    explanations: {
      en: {
        fullName: {
          summary: 'Your legal name as printed on school certificates.',
          explanation: 'Enter your full name exactly as it appears on your Class 10/Matriculation marksheet. Do not add titles like Mr., Ms., or Shri.',
          confidence: 0.98,
          sourceExcerpt: 'Rule 3.1: Candidate name must match the SSC/10th certificate verbatim.',
          sourceLabel: 'official',
        },
        dob: {
          summary: 'Your date of birth.',
          explanation: 'Enter your birth date in DD/MM/YYYY format. This must match the date recorded on your birth certificate or school records.',
          confidence: 0.95,
          sourceExcerpt: 'Eligible candidates must be between 17 and 25 years on 1st August.',
          sourceLabel: 'official',
        },
        income: {
          summary: 'Total annual earnings of all family members combined.',
          explanation: 'Enter the combined total income of your parents or legal guardians from all sources (salary, agriculture, business) for the financial year. Must match the income certificate issued by the Tehsildar or Sub-Divisional Magistrate.',
          confidence: 0.99,
          sourceExcerpt: 'Clause 4(b): Family income from all sources must not exceed Rs. 2,50,000 per annum.',
          sourceLabel: 'official',
        },
        domicile: {
          summary: 'Number on your state residence certificate.',
          explanation: 'Enter the certificate serial number from your Domicile or Permanent Resident Certificate issued by your state revenue authority.',
          confidence: 0.92,
          sourceExcerpt: 'Applicant must be a permanent resident of the awarding State/UT.',
          sourceLabel: 'page',
        },
        category: {
          summary: 'Your social reservation category.',
          explanation: 'Select your caste or reservation category. If selecting SC, ST, or OBC, you must possess a valid caste certificate issued by an authorized officer.',
          confidence: 0.96,
          sourceExcerpt: 'Valid community certificate required for reserved category claims.',
          sourceLabel: 'official',
        },
        bankAccount: {
          summary: 'Your own personal bank account number for direct scholarship deposit.',
          explanation: 'Enter an active savings bank account number in the student’s own name. Joint accounts with friends or parents are not accepted for direct benefit transfer.',
          confidence: 0.97,
          sourceExcerpt: 'DBT funds will only be disbursed to the scholar’s Aadhaar-seeded single account.',
          sourceLabel: 'official',
        },
        ifsc: {
          summary: '11-character bank branch code from your passbook or cheque.',
          explanation: 'The IFSC is an 11-digit alphanumeric code identifying your specific bank branch. You can find it printed on the first page of your passbook or on a cheque leaf.',
          confidence: 0.95,
          sourceExcerpt: 'Format: 4 letters, 0, followed by 6 alphanumeric characters.',
          sourceLabel: 'ai',
        },
      },
      hi: {
        fullName: {
          summary: 'स्कूल प्रमाण पत्र के अनुसार आपका पूरा कानूनी नाम।',
          explanation: 'अपना पूरा नाम ठीक वैसे ही लिखें जैसा आपकी 10वीं कक्षा की अंकतालिका में लिखा है। नाम के आगे श्री, कुमारी या मिस्टर न लगाएं।',
          confidence: 0.98,
          sourceExcerpt: 'नियम 3.1: उम्मीदवार का नाम 10वीं के प्रमाणपत्र से बिल्कुल मेल खाना चाहिए।',
          sourceLabel: 'official',
        },
        dob: {
          summary: 'आपकी जन्म तिथि।',
          explanation: 'अपनी जन्म तिथि दिन/माह/वर्ष (DD/MM/YYYY) प्रारूप में दर्ज करें। यह स्कूल या जन्म प्रमाण पत्र से मेल खानी चाहिए।',
          confidence: 0.95,
          sourceExcerpt: '1 अगस्त को उम्मीदवार की आयु 17 से 25 वर्ष के बीच होनी चाहिए।',
          sourceLabel: 'official',
        },
        income: {
          summary: 'सभी स्रोतों से परिवार के सभी सदस्यों की कुल वार्षिक आय।',
          explanation: 'अपने माता-पिता या अभिभावक की सभी स्रोतों (वेतन, कृषि, व्यापार) से कुल वार्षिक आय दर्ज करें। यह तहसीलदार या सक्षम अधिकारी द्वारा जारी आय प्रमाण पत्र के अनुसार होनी चाहिए।',
          confidence: 0.99,
          sourceExcerpt: 'खंड 4(ख): सभी स्रोतों से कुल पारिवारिक आय ₹2,50,000 प्रति वर्ष से अधिक नहीं होनी चाहिए।',
          sourceLabel: 'official',
        },
        domicile: {
          summary: 'राज्य निवास प्रमाण पत्र की क्रम संख्या।',
          explanation: 'अपने राज्य के राजस्व विभाग द्वारा जारी मूल निवास प्रमाण पत्र (Domicile) की संख्या यहां दर्ज करें।',
          confidence: 0.92,
          sourceExcerpt: 'आवेदक संबंधित राज्य/केंद्र शासित प्रदेश का स्थायी निवासी होना चाहिए।',
          sourceLabel: 'page',
        },
        category: {
          summary: 'आपकी सामाजिक आरक्षण श्रेणी।',
          explanation: 'अपनी जाति या आरक्षण श्रेणी चुनें। यदि आप SC, ST या OBC चुनते हैं, तो आपके पास वैध जाति प्रमाण पत्र होना आवश्यक है।',
          confidence: 0.96,
          sourceExcerpt: 'आरक्षित श्रेणी के लिए सक्षम प्राधिकारी द्वारा जारी प्रमाण पत्र अनिवार्य है।',
          sourceLabel: 'official',
        },
        bankAccount: {
          summary: 'छात्रवृत्ति सीधे पाने के लिए छात्र का अपना बैंक खाता नंबर।',
          explanation: 'छात्र के अपने नाम का सक्रिय बचत खाता नंबर भरें। प्रत्यक्ष लाभ अंतरण (DBT) के लिए संयुक्त (Joint) खाता स्वीकार नहीं किया जाता।',
          confidence: 0.97,
          sourceExcerpt: 'छात्रवृत्ति की राशि केवल छात्र के आधार से जुड़े एकल खाते में भेजी जाएगी।',
          sourceLabel: 'official',
        },
        ifsc: {
          summary: 'पासबुक या चेक पर लिखा 11 अंकों का बैंक शाखा कोड।',
          explanation: 'IFSC आपकी बैंक शाखा का 11 अक्षरों और संख्याओं का कोड होता है। यह आपकी पासबुक के पहले पन्ने पर छपा होता है।',
          confidence: 0.95,
          sourceExcerpt: 'प्रारूप: पहले 4 अक्षर बैंक के, 5वां शून्य, और अंतिम 6 शाखा कोड।',
          sourceLabel: 'ai',
        },
      },
      mr: {
        fullName: {
          summary: 'शाळेच्या गुणपत्रिकेनुसार तुमचे पूर्ण अधिकृत नाव.',
          explanation: 'तुमचे नाव दहावीच्या (SSC) गुणपत्रिकेवर जसे नोंदवले आहे तसेच लिहा. नावापूर्वी श्री किंवा कु. लावू नका.',
          confidence: 0.98,
          sourceExcerpt: 'नियम ३.१: विद्यार्थ्याचे नाव दहावीच्या प्रमाणपत्राशी तंतोतंत जुळले पाहिजे.',
          sourceLabel: 'official',
        },
        dob: {
          summary: 'तुमची जन्मतारीख.',
          explanation: 'जन्मतारीख दिवस/महिना/वर्ष या स्वरूपात भरा. ही जन्मतारीख तुमच्या शाळा सोडल्याच्या दाखल्याशी जुळली पाहिजे.',
          confidence: 0.95,
          sourceExcerpt: 'उमेदवाराचे वय १ ऑगस्ट रोजी १७ ते २५ वर्षांच्या दरम्यान असावे.',
          sourceLabel: 'official',
        },
        income: {
          summary: 'सर्व मार्गांनी मिळणारे कुटुंबाचे एकूण वार्षिक उत्पन्न.',
          explanation: 'कुटुंबातील सर्व सदस्यांचे नोकरी, शेती किंवा व्यवसायातील वार्षिक उत्पन्न एकत्रितपणे नोंदवा. हे तहसीलदारांच्या उत्पन्नाच्या दाखल्याशी जुळले पाहिजे.',
          confidence: 0.99,
          sourceExcerpt: 'कलम ४(ब): कुटुंबाचे एकूण वार्षिक उत्पन्न ₹२,५०,००० पेक्षा जास्त नसावे.',
          sourceLabel: 'official',
        },
        domicile: {
          summary: 'अधिवास (डोमिसाईल) प्रमाणपत्राचा अनुक्रमांक.',
          explanation: 'राज्य शासनाने दिलेल्या रहिवासी/डोमिसाईल प्रमाणपत्रावरील क्रमांक येथे अचूक प्रविष्ट करा.',
          confidence: 0.92,
          sourceExcerpt: 'अर्जदार संबंधित राज्याचा कायमस्वरूपी रहिवासी असणे अनिवार्य आहे.',
          sourceLabel: 'page',
        },
        category: {
          summary: 'तुमचा सामाजिक आरक्षणाचा प्रवर्ग.',
          explanation: 'तुमचा जात प्रवर्ग (SC/ST/OBC/General) निवडा. आरक्षित प्रवर्ग निवडल्यास अधिकृत जात प्रमाणपत्र जवळ असणे आवश्यक आहे.',
          confidence: 0.96,
          sourceExcerpt: 'आरक्षित प्रवर्गासाठी सक्षम अधिकाऱ्याने दिलेले जात प्रमाणपत्र आवश्यक आहे.',
          sourceLabel: 'official',
        },
        bankAccount: {
          summary: 'शिष्यवृत्ती जमा होण्यासाठी विद्यार्थ्याचा स्वतःचा बँक खाते क्रमांक.',
          explanation: 'विद्यार्थ्याच्या स्वतःच्या नावाचे बचत बँक खाते भरा. सरकारी शिष्यवृत्ती थेट खात्यात येण्यासाठी संयुक्त (Joint) खाते चालत नाही.',
          confidence: 0.97,
          sourceExcerpt: 'अनुदान थेट विद्यार्थ्याच्या आधार-जोडणी असलेल्या वैयक्तिक खात्यात वर्ग केले जाईल.',
          sourceLabel: 'official',
        },
        ifsc: {
          summary: 'पासबुकवर छापलेला ११ अक्षरी बँक शाखा कोड.',
          explanation: 'IFSC हा बँकेच्या शाखेचा ओळख क्रमांक असतो. हा तुमच्या पासबुकच्या पहिल्या पानावर किंवा धनादेशावर (चेकवर) सहज सापडतो.',
          confidence: 0.95,
          sourceExcerpt: 'स्वरुप: ४ अक्षरे, शून्य आणि शेवटी ६ अंक किंवा अक्षरे.',
          sourceLabel: 'ai',
        },
      },
    },
  },

  // 2. Deliberately Risky Form
  'risky-form': {
    formId: 'risky-form',
    domain: 'win-scholarship-now.untrusted-site.org',
    riskFlags: [
      {
        id: 'rf-cross-domain',
        type: 'cross_domain_action',
        severity: 'high',
        description: 'This form sends your information to a different website (secure-collector.ru). Check that this matches the official service.',
        technicalDetails: 'Form action domain "secure-collector.ru" differs from page domain "win-scholarship-now.untrusted-site.org".',
      },
      {
        id: 'rf-insecure-http',
        type: 'insecure_http',
        severity: 'medium',
        description: 'This page is not secure (HTTP instead of HTTPS). Information you type could be intercepted.',
        technicalDetails: 'Connection protocol is insecure http:.',
      },
      {
        id: 'rf-sensitive-otp',
        fieldId: 'otpField',
        type: 'sensitive_field_unusual',
        severity: 'high',
        description: 'This non-banking page asks for sensitive authentication codes (OTP/CVV). Official services rarely ask for this here.',
        technicalDetails: 'Field matches sensitive OTP pattern on non-banking domain.',
      },
    ],
    explanations: {
      en: {
        studentName: {
          summary: 'Name field on suspicious page.',
          explanation: 'Name requested by this portal. Be cautious before submitting, as this page shows security anomalies.',
          confidence: 0.75,
          sourceLabel: 'ai',
        },
        otpField: {
          summary: '⚠️ One-Time Password (OTP) - Review carefully before entering.',
          explanation: 'This field asks for an OTP. Never share an SMS or banking OTP on an untrusted page. Legitimate forms do not request banking OTPs for general registration.',
          confidence: 0.99,
          sourceExcerpt: 'Safety warning: OTP codes authorize immediate transactions or account logins.',
          sourceLabel: 'ai',
        },
        atmPin: {
          summary: '⚠️ Security PIN - Extremely high risk.',
          explanation: 'No legitimate scholarship or registration form will EVER ask for your ATM PIN or NetBanking password. Do not enter your PIN here.',
          confidence: 0.99,
          sourceLabel: 'ai',
        },
      },
      hi: {
        studentName: {
          summary: 'संदिग्ध पेज पर नाम का फ़ील्ड।',
          explanation: 'इस पोर्टल पर नाम मांगा गया है। विवरण दर्ज करने से पहले सतर्क रहें क्योंकि इस पेज में सुरक्षा चेतावनियां मिली हैं।',
          confidence: 0.75,
          sourceLabel: 'ai',
        },
        otpField: {
          summary: '⚠️ वन-टाइम पासवर्ड (OTP) - दर्ज करने से पहले बहुत सावधानी बरतें।',
          explanation: 'यह फ़ील्ड OTP मांग रहा है। किसी भी गैर-आधिकारिक पेज पर बैंकिंग या एसएमएस OTP कभी साझा न करें। कोई भी सामान्य फॉर्म पंजीकरण के लिए बैंक OTP नहीं मांगता।',
          confidence: 0.99,
          sourceExcerpt: 'सुरक्षा चेतावनी: OTP कोड का उपयोग लेन-देन को अधिकृत करने के लिए किया जाता है।',
          sourceLabel: 'ai',
        },
        atmPin: {
          summary: '⚠️ सुरक्षा पिन - अत्यधिक जोखिम।',
          explanation: 'कोई भी वास्तविक छात्रवृत्ति फॉर्म आपसे कभी भी ATM पिन या पासवर्ड नहीं मांगेगा। अपना पिन कभी यहां न भरें।',
          confidence: 0.99,
          sourceLabel: 'ai',
        },
      },
      mr: {
        studentName: {
          summary: 'संशयास्पद पानावरील नावाचे फील्ड.',
          explanation: 'या पृष्ठावर सुरक्षा त्रुटी आढळल्या आहेत, त्यामुळे माहिती भरण्यापूर्वी काळजी घ्या.',
          confidence: 0.75,
          sourceLabel: 'ai',
        },
        otpField: {
          summary: '⚠️ वन-टाइम पासवर्ड (OTP) - भरण्यापूर्वी काळजीपूर्वक विचार करा.',
          explanation: 'हे फील्ड OTP मागत आहे. कोणत्याही बिगर-अधिकृत पानावरील फॉर्ममध्ये बँक OTP किंवा पासवर्ड कधीही टाकू नका.',
          confidence: 0.99,
          sourceExcerpt: 'सुरक्षा सूचना: OTP कोड थेट आर्थिक व्यवहारांना परवानगी देतो.',
          sourceLabel: 'ai',
        },
        atmPin: {
          summary: '⚠️ सिक्युरिटी पिन - अत्यंत धोकादायक.',
          explanation: 'कोणतीही खरी संस्था तुमच्याकडे बँक किंवा एटीएमचा पिन कधीही मागत नाही. येथे तुमचा पिन टाकू नका.',
          confidence: 0.99,
          sourceLabel: 'ai',
        },
      },
    },
  },

  // 3. Bank KYC Form (Legitimate banking domain)
  'bank-kyc-form': {
    formId: 'bank-kyc-form',
    domain: 'portal.bank.example',
    riskFlags: [],
    explanations: {
      en: {
        panNumber: {
          summary: '10-character alphanumeric Permanent Account Number issued by Income Tax Department.',
          explanation: 'Enter your 10-digit PAN card number. It is mandatory for financial verification and KYC under banking regulations.',
          confidence: 0.98,
          sourceExcerpt: 'RBI Master Direction - KYC: PAN is officially valid document for customer identification.',
          sourceLabel: 'official',
        },
        aadhaarNumber: {
          summary: '12-digit Aadhaar number for identity and address verification.',
          explanation: 'Enter your 12-digit UIDAI Aadhaar number. You may use a masked Aadhaar if preferred.',
          confidence: 0.97,
          sourceExcerpt: 'Voluntary Aadhaar verification for electronic KYC verification.',
          sourceLabel: 'official',
        },
        annualIncomeBracket: {
          summary: 'Your approximate annual income range.',
          explanation: 'Select your gross annual income bracket for regulatory risk categorization under AML/KYC guidelines.',
          confidence: 0.91,
          sourceLabel: 'page',
        },
      },
      hi: {
        panNumber: {
          summary: 'आयकर विभाग द्वारा जारी किया गया 10 अक्षरों और संख्याओं वाला पैन कार्ड नंबर।',
          explanation: 'अपना 10 अंकों का पैन नंबर भरें। बैंक खातों के लिए वित्तीय सत्यापन हेतु यह अनिवार्य है।',
          confidence: 0.98,
          sourceExcerpt: 'RBI नियम: ग्राहक पहचान के लिए पैन एक अधिकृत दस्तावेज है।',
          sourceLabel: 'official',
        },
        aadhaarNumber: {
          summary: 'पहचान और पते के सत्यापन के लिए 12 अंकों का आधार नंबर।',
          explanation: 'अपना 12 अंकों का आधार नंबर भरें। यह ई-केवाईसी सत्यापन में सहायता करता है।',
          confidence: 0.97,
          sourceExcerpt: 'पहचान प्रमाणीकरण हेतु आधार का उपयोग।',
          sourceLabel: 'official',
        },
        annualIncomeBracket: {
          summary: 'आपकी अनुमानित वार्षिक आय का दायरा।',
          explanation: 'बैंक के जोखिम वर्गीकरण नियमों के अनुसार अपनी वार्षिक आय का उपयुक्त विकल्प चुनें।',
          confidence: 0.91,
          sourceLabel: 'page',
        },
      },
      mr: {
        panNumber: {
          summary: 'आयकर विभागाचा १० अक्षरी पॅन (PAN) क्रमांक.',
          explanation: 'तुमच्या पॅन कार्डवरील १० अंकी क्रमांक भरा. बँकिंग नियमानुसार ओळख पटवण्यासाठी हे आवश्यक आहे.',
          confidence: 0.98,
          sourceExcerpt: 'आरबीआय नियम: खाते उघडण्यासाठी पॅन अधिकृत दस्तऐवज आहे.',
          sourceLabel: 'official',
        },
        aadhaarNumber: {
          summary: '१२ अंकी आधार क्रमांक.',
          explanation: 'ओळख आणि पत्ता पडताळणीसाठी तुमचा १२ अंकी आधार क्रमांक नोंदवा.',
          confidence: 0.97,
          sourceExcerpt: 'ई-केवायसी पडताळणीसाठी आधार क्रमांक.',
          sourceLabel: 'official',
        },
        annualIncomeBracket: {
          summary: 'तुमचे अंदाजे वार्षिक उत्पन्न गट.',
          explanation: 'बँकेच्या नियमांनुसार तुमच्या उत्पन्नाचा योग्य पर्याय निवडा.',
          confidence: 0.91,
          sourceLabel: 'page',
        },
      },
    },
  },
};
