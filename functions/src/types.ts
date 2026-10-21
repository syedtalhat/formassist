// Data models and API types per Form_Assist_SRS.md v1.2 and Firestore Data Model

export type SupportedLanguage = 'en' | 'hi' | 'mr';
export type RiskTag = 'required' | 'optional' | 'unusual';
export type SourceLabel = 'page' | 'official' | 'ai';
export type RiskSeverity = 'low' | 'medium' | 'high';

export interface ExtractedFieldInput {
  id?: string;
  key: string;
  name: string;
  label: string;
  inputType: string;
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  rect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  hasValue?: boolean;
}

export interface FieldExplanation {
  summary: string;
  text: string;
  sourceLabel: SourceLabel;
  sourceUrl?: string;
  sourceExcerpt?: string;
  confidence?: number;
}

export interface RiskFlag {
  id?: string;
  fieldKey?: string;
  flagType: string;
  severity: RiskSeverity;
  descriptionKey: string;
  message: string;
}

export interface AnalyzedField extends ExtractedFieldInput {
  riskTag: RiskTag;
  explanation: FieldExplanation;
}

export interface AnalyzeFormRequest {
  page_url: string;
  form_action: string;
  form_title?: string;
  language: SupportedLanguage;
  fields: ExtractedFieldInput[];
}

export interface AnalyzeFormResponse {
  form_id: string;
  fields: AnalyzedField[];
  risk_flags: RiskFlag[];
}

export interface ExplainFieldRequest {
  form_id: string;
  field_key: string;
  language: SupportedLanguage;
}

export interface ChatRequest {
  session_id?: string;
  form_id: string;
  focused_field_key?: string;
  completed_field_keys?: string[];
  language: SupportedLanguage;
  message: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
}

export interface PreferencesResponse {
  default_language: SupportedLanguage;
}

export interface SourceDocument {
  id: string;
  url: string;
  title: string;
  contentText: string;
  embedding: number[];
  indexedAt?: any;
}
