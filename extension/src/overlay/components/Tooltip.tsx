import React, { useState } from 'react';
import { FieldExplanation, Language } from '../../shared/types';
import { SourceBadge } from './SourceBadge';
import { SpeakerIcon, ChatIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface TooltipProps {
  fieldId: string;
  fieldLabel: string;
  explanation: FieldExplanation;
  language: Language;
  top: number;
  left: number;
  onClose: () => void;
  onOpenChat: (fieldId: string) => void;
}

export const Tooltip: React.FC<TooltipProps> = ({
  fieldId,
  fieldLabel,
  explanation,
  language,
  top,
  left,
  onClose,
  onOpenChat,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const t = getTranslation(language);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isPlayingTTS) {
        setIsPlayingTTS(false);
        return;
      }

      const textToSpeak = isExpanded
        ? `${fieldLabel}. ${explanation.explanation}`
        : `${fieldLabel}. ${explanation.summary}`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      setIsPlayingTTS(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
      }}
      className={`overlay-tooltip ${language !== 'en' ? 'script-devanagari' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-border-subtle">
        <h3 className="font-display font-bold text-sm text-text-primary leading-tight">
          {fieldLabel}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary p-0.5 rounded hover:bg-surface-muted transition-colors flex-shrink-0"
          title="Close explanation"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Content */}
      <div className="mb-2">
        <p className="font-body text-xs text-text-primary leading-relaxed font-medium">
          {explanation.summary}
        </p>
      </div>

      {/* Provenance Badge */}
      <div className="mb-2">
        <SourceBadge source={explanation.sourceLabel} />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mb-2 pt-1.5 border-t border-border-subtle flex flex-col gap-1.5 animate-fadeIn">
          <p className="font-body text-xs text-text-secondary leading-relaxed">
            {explanation.explanation}
          </p>

          {explanation.sourceExcerpt && (
            <div className="p-2 rounded bg-surface-page border border-border-subtle text-[11px] text-text-secondary italic">
              "{explanation.sourceExcerpt}"
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-1 rounded hover:bg-surface-muted transition-colors text-xs font-semibold flex items-center gap-1 ${
              isPlayingTTS ? 'text-source-official font-bold' : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Read aloud"
          >
            <SpeakerIcon className="w-3.5 h-3.5" />
            <span>{isPlayingTTS ? 'Playing' : t.listen}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-primary-container hover:underline flex items-center gap-0.5"
          >
            <span>{isExpanded ? t.less : t.more}</span>
            {isExpanded ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onOpenChat(fieldId)}
          className="flex items-center gap-1 text-xs font-semibold text-primary-container hover:bg-primary-tint/60 px-2 py-0.5 rounded transition-colors"
        >
          <ChatIcon className="w-3 h-3" />
          <span>{t.askInChat}</span>
        </button>
      </div>
    </div>
  );
};
