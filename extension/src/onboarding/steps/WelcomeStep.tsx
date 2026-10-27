import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
  onAlreadyHaveAccount: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onNext,
  onAlreadyHaveAccount,
}) => {
  return (
    <div className="w-full min-h-[580px] grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden shadow-sm">
      {/* Left Column: Content (Downsized by 20%) */}
      <div className="lg:col-span-5 bg-surface-container-lowest flex flex-col justify-between p-6 lg:p-8 xl:pl-12 xl:pr-8">
        <div className="max-w-[420px] w-full flex flex-col">
          {/* Brand Mark & Wordmark */}
          <div className="flex items-center gap-space-sm mb-4">
            <div className="relative w-9 h-9 bg-primary-container rounded-lg flex items-center justify-center text-on-primary shadow-xs overflow-hidden">
              <img
                src="/icons/icon-48.png"
                className="w-6 h-6 object-contain"
                alt="FormAssist"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="font-display text-title-1 text-primary-container tracking-tight">FormAssist</span>
          </div>

          {/* Progress Indicator */}
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-9 h-1.5 rounded-full bg-primary-container"></div>
              <div className="w-9 h-1.5 rounded-full bg-border-subtle"></div>
              <div className="w-9 h-1.5 rounded-full bg-border-subtle"></div>
              <div className="w-9 h-1.5 rounded-full bg-border-subtle"></div>
            </div>
            <span className="font-caption text-caption text-text-secondary text-[11px]">Step 1 of 4</span>
          </div>

          {/* Primary Value Proposition */}
          <div className="flex flex-col gap-2 mb-5">
            <h1 className="font-display text-display text-text-primary tracking-tight">
              Understand any form, in your language
            </h1>
            <p className="font-body-lg text-body-lg text-text-secondary leading-relaxed">
              FormAssist sits beside the form you're filling. It explains each question in simple words, tells you where the explanation came from, and warns you about anything unusual.
            </p>
          </div>

          {/* Language Pill Switcher Demo */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-muted rounded-full self-start mb-4 text-text-secondary font-caption text-caption text-xs">
            <span className="material-symbols-outlined text-[15px] text-primary-container">translate</span>
            <span>English · हिंदी · मराठी · தமிழ்</span>
          </div>

          {/* Action Target (Downsized button to h-[42px]) */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onNext}
              className="w-full h-[42px] bg-primary-container hover:bg-primary-pressed active:bg-primary-pressed text-text-on-primary font-label-default text-label-default rounded-lg transition-colors duration-150 flex items-center justify-center gap-space-xs shadow-xs cursor-pointer text-xs"
              type="button"
            >
              <span>Get started</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <div className="text-center">
              <button
                onClick={onAlreadyHaveAccount}
                className="inline-block py-1.5 font-body-strong text-body-strong text-text-secondary hover:text-primary-container transition-colors duration-150 cursor-pointer bg-transparent border-0 text-xs"
                type="button"
              >
                I already have an account
              </button>
            </div>
          </div>
        </div>

        {/* Trust Assurance Footer */}
        <div className="pt-4 mt-4 flex items-center gap-1.5 font-caption text-caption text-text-secondary text-[11px]">
          <span className="material-symbols-outlined text-source-official text-[16px]">verified_user</span>
          <span>Zero permanent form data retention · Private local session</span>
        </div>
      </div>

      {/* Right Canvas: Visual Paperwork & Marginal Note (Downsized by 20%) */}
      <div className="lg:col-span-7 bg-primary-tint relative p-5 lg:p-8 xl:p-10 flex items-center justify-center overflow-hidden">
        {/* Subtle tactile document backdrop element */}
        <div className="w-full max-w-[460px] flex flex-col gap-space-md relative">
          {/* Simulated Host Application Bar */}
          <div className="w-full bg-surface-card rounded-lg p-3 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-dim"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-surface-dim"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-surface-dim"></div>
              <span className="ml-1.5 font-caption text-caption text-text-secondary text-[11px]">
                National Scholarship Portal — Form 4B
              </span>
            </div>
            <span className="font-caption text-caption text-text-disabled text-[10px]">gov.in/portal/entry</span>
          </div>

          {/* Mock Form Canvas */}
          <div className="w-full bg-surface-card rounded-xl p-5 shadow-xs flex flex-col gap-4">
            {/* Input Row 1: Annual family income */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="relative inline-block">
                  <span className="font-body-strong text-body-strong text-text-primary text-xs">
                    Annual family income
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-1.5 bg-tertiary-fixed-dim rounded-full -z-0"></div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-tint text-tag-required font-caption text-caption font-body-strong text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-tag-required"></span>
                    Required
                  </span>
                </div>
              </div>
              <div className="h-9 w-full rounded-lg bg-surface-bright flex items-center justify-between px-3 text-text-secondary font-body-default text-body-default text-xs">
                <span>₹ 1,80,000</span>
                <span className="material-symbols-outlined text-text-disabled text-[18px]">calculate</span>
              </div>
            </div>

            {/* Input Row 2: Domicile certificate number */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-body-strong text-body-strong text-text-primary text-xs">
                  Domicile certificate number
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-muted text-tag-optional font-caption text-caption font-body-strong text-[11px]">
                  <span className="material-symbols-outlined text-[13px]">info</span>
                  See description
                </span>
              </div>
              <div className="h-9 w-full rounded-lg bg-surface-bright flex items-center justify-between px-3 text-text-disabled font-body-default text-body-default text-xs">
                <span>e.g., MH-DOM-2023-XXXX</span>
                <span className="material-symbols-outlined text-text-disabled text-[18px]">badge</span>
              </div>
            </div>
          </div>

          {/* Floating Explanation Marginal Note Card (Downsized: max-w-[370px]) */}
          <div className="w-full max-w-[370px] -mt-2 ml-auto bg-surface-card rounded-xl p-3.5 shadow-md flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1 text-primary-container">
                <span className="material-symbols-outlined text-[16px]">draw</span>
                <span className="font-caption text-caption font-semibold text-xs">FormAssist Companion Note</span>
              </div>
              <span className="font-caption text-caption text-text-secondary text-[11px]">Field #04</span>
            </div>
            <p className="font-body-default text-body-default text-text-primary font-medium leading-relaxed text-xs">
              Total yearly income of everyone in your family, in rupees.
            </p>
            {/* Provenance Badge: Official Data */}
            <div className="rounded-lg p-2.5 bg-source-official-bg flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-source-official text-[17px]">verified</span>
                <span className="font-caption text-caption font-semibold text-source-official text-xs">
                  From official source
                </span>
              </div>
              <span className="font-caption text-caption text-text-secondary text-[11px]">Ministry Guideline Sec 3(c)</span>
            </div>
          </div>

          {/* Micro indicator of marginal attachment */}
          <div className="flex items-center justify-between text-text-secondary font-caption text-caption px-1 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary-container">near_me</span>
              <span>Focus tracked: Hover or tap any field to inspect clarity breakdown</span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-text-disabled">ID: NSP-GUIDE-V2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
