import React from 'react';
import { ArrowRightIcon, ArrowLeftIcon, LockIcon, CheckCircleIcon, CloseIcon, InfoIcon } from '../../shared/icons';

interface PrivacyStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const PrivacyStep: React.FC<PrivacyStepProps> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">
      <div className="text-center flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-source-official-bg text-source-official text-xs font-bold w-fit mx-auto">
          <LockIcon className="w-3.5 h-3.5" />
          <span>Strict Privacy Commitment</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary-container">
          Your answers stay with you.
        </h1>
        <p className="font-body text-base text-text-secondary max-w-xl mx-auto">
          FormAssist is built to explain questions, not harvest answers. Here is our architectural guarantee:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What We Read & Send */}
        <div className="bg-surface-card p-5 rounded-card border border-border-subtle shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-primary-container pb-2 border-b border-border-subtle">
            <CheckCircleIcon className="w-5 h-5 text-source-official" />
            <h2 className="font-display font-bold text-base text-text-primary">
              What we read & send
            </h2>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-source-official mt-2 flex-shrink-0" />
              <span>Public field names and instructions printed on the form.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-source-official mt-2 flex-shrink-0" />
              <span>The website web address to check against official government portals.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-source-official mt-2 flex-shrink-0" />
              <span>Whether a field is currently filled (true/false) to provide relevant chat context.</span>
            </li>
          </ul>
        </div>

        {/* What We NEVER Read or Send */}
        <div className="bg-surface-card p-5 rounded-card border border-border-subtle shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-danger pb-2 border-b border-border-subtle">
            <CloseIcon className="w-5 h-5 text-danger" />
            <h2 className="font-display font-bold text-base text-text-primary">
              What we NEVER read or send
            </h2>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger mt-2 flex-shrink-0" />
              <span>What you type in any input box (names, income, passwords, OTPs).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger mt-2 flex-shrink-0" />
              <span>Your personal documents or uploaded files.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger mt-2 flex-shrink-0" />
              <span>Your browsing history, bookmarks, or other open tabs.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Gemini AI Disclosure Note (NFR-PRIV.4) */}
      <div className="p-4 bg-surface-card rounded-card border border-border-strong/40 flex items-start gap-3">
        <InfoIcon className="w-5 h-5 text-primary-container flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary font-semibold">How AI works here: </strong>
          To generate helpful plain-language explanations, public form field titles are processed through Google Gemini on our secure backend. Your actual answers are never read from the browser or transmitted to Gemini.
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 h-[48px] text-text-primary hover:text-primary-container font-semibold transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-8 h-[52px] bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-base transition-all shadow-sm focus-ring"
        >
          <span>I understand</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
