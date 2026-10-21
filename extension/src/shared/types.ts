/**
 * Shared Type Definitions for FormAssist
 * Cites SRS v1.2: FR-EXTRACT.1-4, FR-REDACT.1-4, FR-RISK.1-4, FR-EXPLAIN.1-6, FR-CHAT.1-5
 */

export type Language = 'en' | 'hi' | 'mr';

export type SessionState =
  | 'idle'
  | 'scanning'
  | 'analyzing'
  | 'ready'
  | 'field_focused'
  | 'chat_open'
  | 'error'
  | 'deactivated';

export type SourceLabel = 'official' | 'page' | 'ai';

export type FieldTagType = 'required' | 'optional' | 'unusual';

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface FieldOption {
  value: string;
  label: string;
}

export interface ExtractedField {
  id: string; // DOM id or generated unique selector
  name: string;
  inputType: string; // text, select, textarea, number, password, etc.
  label: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: FieldOption[];
  sensitive: boolean; // FR-REDACT.4
  hasValue?: boolean; // FR-CHAT.2: fill state boolean ONLY, never the value
  rect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface RiskFlag {
  id: string;
  fieldId?: string;
  type: 'cross_domain_action' | 'insecure_http' | 'sensitive_field_unusual' | 'suspicious_credential';
  severity: RiskSeverity;
  description: string;
  technicalDetails?: string;
}

export interface FieldExplanation {
  summary: string;
  explanation: string;
  confidence: number;
  sourceExcerpt?: string;
  sourceLabel: SourceLabel; // FR-EXPLAIN.5
  status?: 'available' | 'unavailable';
}

export interface FormAnalysisResult {
  formId: string;
  domain: string;
  pageUrl: string;
  fields: Record<string, FieldExplanation>; // keyed by field id
  riskFlags: RiskFlag[];
  tags: Record<string, FieldTagType>; // keyed by field id
  language: Language;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
  focusedFieldId?: string;
}

export interface ChatFieldContext {
  label: string;
  inputType?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

export interface UserPreferences {
  defaultLanguage: Language;
  voiceSpeed: 'slow' | 'normal' | 'fast';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  preferences: UserPreferences;
}

// Runtime message types between Content Script, Background SW, and Popup
export type MessagePayload =
  | { type: 'GET_SESSION_STATE' }
  | { type: 'STATE_CHANGED'; state: SessionState; tabId?: number }
  | { type: 'START_ANALYSIS'; language?: Language }
  | { type: 'FIELDS_EXTRACTED'; fields: ExtractedField[]; domain: string; pageUrl: string; formAction?: string }
  | { type: 'ANALYSIS_PROGRESS'; step: 1 | 2 | 3; message: string; fieldCount?: number }
  | { type: 'ANALYSIS_COMPLETE'; result: FormAnalysisResult }
  | { type: 'ANALYSIS_FAILED'; error: string }
  | { type: 'SWITCH_LANGUAGE'; language: Language }
  | { type: 'FOCUS_FIELD'; fieldId: string | null }
  | { type: 'TOGGLE_CHAT'; open: boolean; fieldId?: string }
  | { type: 'SEND_CHAT_MESSAGE'; text: string; fieldId?: string; fieldContext?: ChatFieldContext }
  | { type: 'CHAT_REPLY'; message: ChatMessage }
  | { type: 'DEACTIVATE' }
  | { type: 'RETRY' };
