import React from 'react';
import { Language } from '../../shared/types';
import { AlertCircleIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface ErrorViewProps {
  language: Language;
  errorMessage?: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  language,
  errorMessage,
  onRetry,
  onDismiss,
}) => {
  const isNetworkErr =
    errorMessage === 'Failed to fetch' ||
    errorMessage?.includes('Failed to fetch') ||
    errorMessage?.includes('NetworkError');

  const displayMessage = isNetworkErr ? t.error.networkError : errorMessage || t.error.unknownError;

  return (
    <div className="flex flex-col min-h-[380px] p-4 justify-between bg-surface-page text-text-primary">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-control bg-danger flex items-center justify-center text-white shadow-xs">
            <AlertCircleIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-text-primary">
              FormAssist
            </h1>
            <p className="text-[11px] text-danger font-semibold mt-0.5">
              {t.error.title}
            </p>
          </div>
        </div>

        {/* Error Details Card */}
        <div className="bg-surface-card p-4 rounded-card border border-border-subtle shadow-xs mb-3">
          <div className="w-10 h-10 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto mb-2.5">
            <AlertCircleIcon className="w-6 h-6" />
          </div>

          <p className="text-xs text-text-primary text-center font-medium leading-relaxed mb-4">
            {displayMessage}
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="w-full h-10 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-xs transition-all shadow-xs focus-ring"
            >
              {t.retry}
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full h-10 bg-transparent hover:bg-surface-muted text-text-primary rounded-control font-semibold text-xs border border-border-strong transition-all"
            >
              {t.dismiss}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-text-secondary pt-3 border-t border-border-subtle">
        FormAssist Error Recovery
      </div>
    </div>
  );
};
