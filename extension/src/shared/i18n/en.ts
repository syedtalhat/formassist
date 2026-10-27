/**
 * English i18n Dictionary
 */

export const en = {
  // Brand & Common
  appName: 'FormAssist',
  tagline: 'Understand any form, in your language',
  loading: 'Loading...',
  retry: 'Retry',
  dismiss: 'Dismiss',
  close: 'Close',
  listen: 'Listen',
  more: 'More',
  less: 'Less',
  askInChat: 'Ask in chat',
  send: 'Send',
  cancel: 'Cancel',
  save: 'Save',

  // Popup Views
  signedOut: {
    title: 'Understand any form',
    description: 'Get plain-language explanations for confusing form fields right on the page.',
    explainCta: "Explain this page's form",
    signIn: 'Sign in',
    createAccount: 'Create account',
    quickLanguage: 'Quick language preview',
    lockedNote: 'Sign in to save Hindi and Marathi preferences across visits.',
  },
  idle: {
    greeting: 'Hello,',
    helperActive: 'FormAssist is ready',
    explainCta: "Explain this page's form",
    changeLanguage: 'Change my saved language',
    visitNote: 'Quick language switch applies just for this visit.',
  },
  working: {
    activeHelper: 'Active Helper',
    step1: 'Reading the form',
    step2: 'Checking for anything unusual',
    step3: 'Writing simple explanations',
    fieldsFound: '{count} fields found on this page',
    privacyNote: 'What you type stays on your computer.',
    modeMock: '',
    modeEmulator: 'Connected to emulator',
    modeLive: 'Connected to backend',
  },
  ready: {
    badge: 'On for this page',
    summary: '{count} questions explained',
    unusualWarning: '{count} question needs a closer look',
    unusualWarningPlural: '{count} questions need a closer look',
    askQuestion: 'Ask a question',
    switchNotice: 'Language changed just for this visit',
  },
  error: {
    title: 'Something went wrong',
    noFields: 'No form fields were detected on this page.',
    networkError: 'Could not connect to FormAssist service. Please check your connection.',
    unknownError: 'An unexpected issue occurred while analyzing this form.',
  },

  // Overlay & Field Tags
  tags: {
    seeDescription: 'See description',
    required: 'Required',
    optional: 'Optional',
    unusual: 'Review needed',
  },
  provenance: {
    official: 'From official source',
    page: 'From this page',
    ai: "AI's general knowledge",
  },
  risk: {
    bannerTitle: 'Form safety review',
    disclaimer: 'This check is a second opinion, not a guarantee.',
    crossDomain: 'This form sends your information to a different website ({domain}). Check that this matches the official service.',
    insecureHttp: 'This page is not secure (HTTP instead of HTTPS). Information you type could be intercepted.',
    sensitiveOtp: 'This non-banking page asks for sensitive authentication codes (OTP/CVV). Official services rarely ask for this here.',
  },

  // Chat
  chat: {
    drawerTitle: 'Ask FormAssist',
    contextPrefix: 'Asking about:',
    contextAll: 'Whole form',
    inputPlaceholder: 'Ask anything about this field...',
    emptyState: 'Have a question about what this question means or what document to prepare? Ask below.',
    privacyReminder: 'We do not read your typed answers. Questions are answered based on the form structure and public guidance.',
    mockReply: 'In this field, enter the total annual family income as stated on your official income certificate. If you do not have the exact number yet, obtain the latest certificate issued by your local revenue authority.',
  },

  // Onboarding
  onboarding: {
    getStarted: 'Get started',
    alreadyAccount: 'I already have an account',
    continueWithout: 'Continue without an account',
    next: 'Next',
    back: 'Back',
    finish: 'Finish setup',
    step1Title: 'Understand any form, in your language',
    step1Subtitle: 'FormAssist sits beside confusing web forms, explaining every question simply without collecting your private answers.',
    step2Title: 'Which language do you read best?',
    step2Subtitle: 'We will show explanations in this language first. You can always switch anytime.',
    step3Title: 'Your answers stay with you',
    step3WeRead: 'What we read & send',
    step3WeReadList: [
      'Field labels and instructions on the form',
      'The website address to check official guidelines',
    ],
    step3WeNever: 'What we NEVER read or send',
    step3WeNeverList: [
      'What you type in any field (passwords, numbers, text)',
      'Your browsing history or other open tabs',
    ],
    step3GeminiNote: 'To generate explanations, public form text is processed using Google Gemini. Your filled values are never seen by Gemini or saved in our database.',
    step4Title: 'Create an account to save preferences',
    step4Subtitle: 'Keep your language and voice settings across all your devices.',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    signUpButton: 'Create account',
    signInButton: 'Sign in',
    haveAccountToggle: 'Already have an account? Sign in',
    noAccountToggle: "Don't have an account? Create one",
  },

  // Settings
  settings: {
    pageTitle: 'Settings & Preferences',
    accountSection: 'Account',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
    guestUser: 'Guest (Not signed in)',
    signInToSync: 'Sign in to save your settings across devices.',
    languageSection: 'Saved language',
    languageHint: 'Default language for all form explanations and audio voiceovers.',
    voiceSection: 'Voice audio',
    voiceSpeed: 'Reading speed',
    speedSlow: 'Slow',
    speedNormal: 'Normal',
    speedFast: 'Fast',
    listenPreview: 'Listen to preview',
    privacySection: 'Privacy & Data',
    privacyCommitment: 'What you type stays on your computer. FormAssist only processes public field labels to assist you.',
    clearChatHistory: 'Clear my chat history',
    clearChatConfirm: 'Are you sure you want to permanently delete all your chat messages? This cannot be undone.',
    chatHistoryCleared: 'Chat history deleted successfully.',
  },
};
