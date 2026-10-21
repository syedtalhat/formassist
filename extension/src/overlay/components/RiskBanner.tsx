import React from 'react';
import { RiskFlag, Language } from '../../shared/types';
import { AlertTriangleIcon, CloseIcon } from '../../shared/icons';
import { RISK_DISCLAIMER } from '../../shared/constants';

interface RiskBannerProps {
  flags: RiskFlag[];
  language: Language;
  onDismiss: () => void;
}

export const RiskBanner: React.FC<RiskBannerProps> = ({ flags, language, onDismiss }) => {
  if (flags.length === 0) return null;

  return (
    <div
      className={`overlay-risk-banner ${language !== 'en' ? 'script-devanagari' : ''}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded bg-danger text-white flex-shrink-0 mt-0.5">
            <AlertTriangleIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-display font-bold text-sm text-danger uppercase tracking-wider">
              Form Safety Review ({flags.length} issue{flags.length > 1 ? 's' : ''} detected)
            </span>

            {flags.map((flag) => (
              <p key={flag.id} className="text-sm font-semibold text-text-primary leading-snug">
                • {flag.description}
              </p>
            ))}

            <p className="text-xs font-semibold text-danger mt-1 italic">
              {RISK_DISCLAIMER}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-black/5 transition-colors flex-shrink-0"
          title="Dismiss warning"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
