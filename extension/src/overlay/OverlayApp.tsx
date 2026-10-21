import React, { useState, useEffect } from 'react';
import {
  ExtractedField,
  FormAnalysisResult,
  Language,
  SessionState,
  ChatMessage as ChatMessageType,
} from '../shared/types';
import { extractPageFormFields } from '../content/extractor';
import { FieldTag } from './components/FieldTag';
import { Tooltip } from './components/Tooltip';
import { RiskBanner } from './components/RiskBanner';
import { ChatPanel } from './components/ChatPanel';
import { ProgressCard } from './components/ProgressCard';
import { ErrorCard } from './components/ErrorCard';

interface OverlayAppProps {
  initialState: SessionState;
  initialLanguage: Language;
  onSendMessage: (text: string, fieldId?: string) => void;
  onFocusField: (fieldId: string | null) => void;
  onToggleChat: (open: boolean, fieldId?: string) => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export const OverlayApp: React.FC<OverlayAppProps> = ({
  initialState,
  initialLanguage,
  onSendMessage,
  onFocusField,
  onToggleChat,
  onRetry,
  onDismiss,
}) => {
  const [sessionState, setSessionState] = useState<SessionState>(initialState);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>(() => {
    try {
      return extractPageFormFields().fields;
    } catch {
      return [];
    }
  });
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [riskBannerDismissed, setRiskBannerDismissed] = useState(false);
  const [progressStep, setProgressStep] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recalculate field rects on window scroll and resize so tags stay pinned to their inputs
  const updateFieldPositions = () => {
    setExtractedFields((prev) =>
      prev.map((field) => {
        const el = document.getElementById(field.id) || document.querySelector(`[name="${CSS.escape(field.name)}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          return {
            ...field,
            rect: {
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height,
            },
          };
        }
        return field;
      })
    );
  };

  useEffect(() => {
    window.addEventListener('scroll', updateFieldPositions, { passive: true });
    window.addEventListener('resize', updateFieldPositions, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateFieldPositions);
      window.removeEventListener('resize', updateFieldPositions);
    };
  }, []);

  // Ensure fields are extracted if initial was empty
  useEffect(() => {
    if (extractedFields.length === 0) {
      try {
        const { fields } = extractPageFormFields();
        if (fields.length > 0) setExtractedFields(fields);
      } catch {
        // ignore
      }
    }
  }, [analysisResult, sessionState]);

  // Expose bridge on window for content script messages
  useEffect(() => {
    (window as any).__FormAssistOverlay = {
      setState: (state: SessionState) => setSessionState(state),
      setLanguage: (lang: Language) => setLanguage(lang),
      setAnalysisResult: (result: FormAnalysisResult) => {
        setAnalysisResult(result);
        setLanguage(result.language);
      },
      setFields: (fields: ExtractedField[]) => {
        if (fields && fields.length > 0) {
          setExtractedFields(fields);
        }
      },
      setFocusedField: (fieldId: string | null) => setFocusedFieldId(fieldId),
      setChatOpen: (open: boolean, fieldId?: string) => {
        setIsChatOpen(open);
        if (fieldId) setFocusedFieldId(fieldId);
      },
      addChatMessage: (msg: ChatMessageType) => {
        setChatMessages((prev) => [...prev, msg]);
        setIsWaitingForReply(false);
      },
      setProgress: (step: 1 | 2 | 3) => setProgressStep(step),
      setError: (err: string) => {
        setErrorMessage(err);
        setSessionState('error');
      },
    };

    return () => {
      delete (window as any).__FormAssistOverlay;
    };
  }, []);

  if (sessionState === 'deactivated' || sessionState === 'idle') {
    return null;
  }

  const focusedField = extractedFields.find((f) => f.id === focusedFieldId);
  const focusedExplanation = focusedFieldId && analysisResult?.fields[focusedFieldId];

  // Tooltip position calculation
  let tooltipTop = 0;
  let tooltipLeft = 0;
  if (focusedField?.rect) {
    tooltipTop = focusedField.rect.top + focusedField.rect.height + 8;
    tooltipLeft = Math.max(16, focusedField.rect.left);
    // Keep inside viewport width
    if (tooltipLeft + 360 > window.innerWidth) {
      tooltipLeft = Math.max(16, window.innerWidth - 380);
    }
  }

  return (
    <>
      {/* 1. Risk Banner */}
      {!riskBannerDismissed && analysisResult && analysisResult.riskFlags.length > 0 && (
        <RiskBanner
          flags={analysisResult.riskFlags}
          language={language}
          onDismiss={() => setRiskBannerDismissed(true)}
        />
      )}

      {/* 2. Field Tags */}
      {analysisResult &&
        extractedFields.map((field) => {
          if (!field.rect) return null;
          const tagType = analysisResult.tags[field.id] || (field.required ? 'required' : 'optional');

          // Position chip at the top-right corner of the input
          const tagTop = Math.max(0, field.rect.top - 14);
          const tagLeft = field.rect.left + field.rect.width - 4;

          return (
            <FieldTag
              key={field.id}
              fieldId={field.id}
              tagType={tagType}
              language={language}
              top={tagTop}
              left={tagLeft}
              isActive={focusedFieldId === field.id}
              onClick={() => {
                const newFocus = focusedFieldId === field.id ? null : field.id;
                setFocusedFieldId(newFocus);
                onFocusField(newFocus);
              }}
            />
          );
        })}

      {/* 3. Floating Tooltip */}
      {focusedField && focusedExplanation && (
        <Tooltip
          fieldId={focusedField.id}
          fieldLabel={focusedField.label || focusedField.name}
          explanation={focusedExplanation}
          language={language}
          top={tooltipTop}
          left={tooltipLeft}
          onClose={() => {
            setFocusedFieldId(null);
            onFocusField(null);
          }}
          onOpenChat={(fieldId) => {
            setIsChatOpen(true);
            setFocusedFieldId(fieldId);
            onToggleChat(true, fieldId);
          }}
        />
      )}

      {/* 4. Chat Drawer */}
      {isChatOpen && (
        <ChatPanel
          language={language}
          focusedFieldId={focusedFieldId}
          focusedFieldLabel={focusedField?.label}
          messages={chatMessages}
          isWaitingForReply={isWaitingForReply}
          onClose={() => {
            setIsChatOpen(false);
            onToggleChat(false);
          }}
          onSendMessage={(text, fieldId) => {
            const userMsg: ChatMessageType = {
              id: `user-${Date.now()}`,
              sender: 'user',
              content: text,
              timestamp: Date.now(),
              focusedFieldId: fieldId,
            };
            setChatMessages((prev) => [...prev, userMsg]);
            setIsWaitingForReply(true);
            onSendMessage(text, fieldId);
          }}
        />
      )}

      {/* 5. Progress Card (Scanning / Analyzing) */}
      {(sessionState === 'scanning' || sessionState === 'analyzing') && (
        <ProgressCard language={language} step={progressStep} />
      )}

      {/* 6. Error Card */}
      {sessionState === 'error' && (
        <ErrorCard
          language={language}
          message={errorMessage}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      )}
    </>
  );
};
