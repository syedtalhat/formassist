import React from 'react';
import { ArrowRightIcon, SparklesIcon, ShieldCheckIcon } from '../../../src/shared/icons';

interface WelcomeStepProps {
  onNext: () => void;
  onAlreadyHaveAccount: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onNext,
  onAlreadyHaveAccount,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto py-8">
      {/* Left Column: Copy & Actions */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-primary-tint text-primary-container text-sm font-semibold w-fit">
          <SparklesIcon className="w-4 h-4" />
          <span>FormAssist Browser Assistant</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-primary-container leading-[1.15]">
          Understand any form, in your language.
        </h1>

        <p className="font-body text-lg text-text-secondary leading-relaxed max-w-xl">
          Government paperwork, admissions, and bank forms can be confusing. FormAssist floats right beside any web form, explaining every question simply without collecting or storing your private answers.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onNext}
            className="flex items-center justify-center gap-2.5 h-[52px] px-8 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-lg transition-all shadow-sm focus-ring"
          >
            <span>Get started</span>
            <ArrowRightIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onAlreadyHaveAccount}
            className="flex items-center justify-center h-[52px] px-6 text-text-primary hover:text-primary-container font-semibold text-base transition-colors"
          >
            I already have an account
          </button>
        </div>
      </div>

      {/* Right Column: Visual Preview Card */}
      <div className="lg:col-span-5">
        <div className="bg-surface-card p-6 rounded-card border border-border-subtle shadow-float flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Example on a scholarship form
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-source-official bg-source-official-bg px-2 py-0.5 rounded-pill">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              Official guidance
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-primary flex items-center justify-between">
              <span>Annual Family Income (INR)</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-tag-required-bg text-tag-required">
                Required
              </span>
            </label>
            <input
              type="text"
              readOnly
              placeholder="e.g. 150000"
              className="h-11 px-3.5 rounded-control border border-border-strong bg-surface-page text-text-disabled text-sm cursor-not-allowed"
            />
          </div>

          {/* Floating Tag Simulation */}
          <div className="p-3.5 bg-source-official-bg border border-source-official/30 rounded-control flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-source-official">
                FormAssist explanation
              </span>
              <span className="text-[11px] text-text-secondary">Hindi & Marathi available</span>
            </div>
            <p className="text-sm text-text-primary leading-snug">
              Total earnings of both parents for the financial year. Must match the number on your official revenue certificate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
