import React from 'react';
import { Language } from '../../shared/types';
import { AlertCircleIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface ErrorCardProps {
  language: Language;
  message?: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  language,
  message,
  onRetry,
  onDismiss,
}) => {
  const t = getTranslation(language);
  const isNetworkErr =
    message === 'Failed to fetch' ||
    message?.includes('Failed to fetch') ||
    message?.includes('NetworkError');

  const displayMessage = isNetworkErr ? t.error.networkError : message || t.error.unknownError;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483645,
      }}
      className={`bg-surface-card p-5 rounded-card border border-danger shadow-alert max-w-sm animate-fadeIn ${
        language !== 'en' ? 'script-devanagari' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2 text-danger">
        <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
        <span className="font-display font-bold text-sm">
          {t.error.title}
        </span>
      </div>

      <p className="text-xs text-text-primary mb-4 leading-relaxed font-medium">
        {displayMessage}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 h-9 bg-primary-container hover:bg-primary-pressed text-white rounded-control text-xs font-semibold transition-all shadow-sm"
        >
          {t.retry}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 h-9 bg-surface-muted hover:bg-surface-dim text-text-primary rounded-control text-xs font-semibold border border-border-subtle transition-all"
        >
          {t.dismiss}
        </button>
      </div>
    </div>
  );
};
