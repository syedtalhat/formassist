import React from 'react';

interface PrivacyStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const PrivacyStep: React.FC<PrivacyStepProps> = ({ onNext, onBack }) => {
  return (
    <div className="w-full min-h-[580px] bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
      {/* Left Column (Downsized by 20%) */}
      <div className="lg:col-span-5 p-6 lg:p-8 xl:pl-12 xl:pr-8 flex flex-col justify-between bg-surface-container-lowest">
        <div className="flex flex-col space-y-space-md">
          {/* Step Progress */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption text-text-secondary uppercase tracking-wider text-[11px]">Step 3 of 4</span>
              <span className="font-caption text-caption text-tag-required font-body-strong text-[11px]">Privacy Architecture</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 w-full pt-1">
              <div className="h-1.5 rounded-full bg-primary-container"></div>
              <div className="h-1.5 rounded-full bg-primary-container"></div>
              <div className="h-1.5 rounded-full bg-primary-container"></div>
              <div className="h-1.5 rounded-full bg-surface-container-highest"></div>
            </div>
          </div>

          {/* Main Title & Reassurance Hook */}
          <div className="flex flex-col space-y-1.5 pt-1">
            <div className="inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary-tint text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
              </span>
              <span className="font-caption text-caption text-source-official font-semibold px-2 py-0.5 bg-source-official-bg rounded-full text-[11px]">
                Client-Side Quarantine
              </span>
            </div>
            <h1 className="font-title-1 text-title-1 text-primary">
              Your answers stay with you
            </h1>
            <p className="font-body-default text-body-default text-text-secondary leading-relaxed">
              What you type stays on your computer. FormAssist only reads the questions on a form — never your answers.
            </p>
          </div>

          {/* Side-by-Side Comparison Lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Allowed / Transparent Read Scope */}
            <div className="flex flex-col space-y-2 min-w-0">
              <div className="flex items-center gap-1.5 pb-0.5">
                <span
                  className="material-symbols-outlined text-source-official text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <h2 className="font-title-2 text-title-2 text-text-primary text-base leading-tight">We read &amp; send</h2>
              </div>
              <ul className="flex flex-col space-y-1.5 text-xs">
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-source-official text-[16px] shrink-0 mt-0.5">check</span>
                  <span className="font-body-default text-body-default text-on-surface">The question text on the form</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-source-official text-[16px] shrink-0 mt-0.5">check</span>
                  <span className="font-body-default text-body-default text-on-surface">
                    The type of question (number, date, choice)
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-source-official text-[16px] shrink-0 mt-0.5">check</span>
                  <span className="font-body-default text-body-default text-on-surface">The website address of the page</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-source-official text-[16px] shrink-0 mt-0.5">check</span>
                  <span className="font-body-default text-body-default text-on-surface">
                    Messages you write in the FormAssist chat
                  </span>
                </li>
              </ul>
            </div>

            {/* Quarantine Scope */}
            <div className="flex flex-col space-y-2 min-w-0">
              <div className="flex items-center gap-1.5 pb-0.5">
                <span className="material-symbols-outlined text-text-secondary text-[18px]">block</span>
                <h2 className="font-title-2 text-title-2 text-text-primary text-base leading-tight">
                  We never read or send
                </h2>
              </div>
              <ul className="flex flex-col space-y-1.5 text-xs">
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-text-secondary text-[16px] shrink-0 mt-0.5">remove</span>
                  <span className="font-body-default text-body-default text-text-secondary">
                    Anything you type into the form
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-text-secondary text-[16px] shrink-0 mt-0.5">remove</span>
                  <span className="font-body-default text-body-default text-text-secondary">
                    Passwords, OTPs, card numbers, PINs
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-text-secondary text-[16px] shrink-0 mt-0.5">remove</span>
                  <span className="font-body-default text-body-default text-text-secondary">
                    Your name, number or documents
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-text-secondary text-[16px] shrink-0 mt-0.5">remove</span>
                  <span className="font-body-default text-body-default text-text-secondary">Anything from other tabs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer & Action Targets */}
        <div className="flex flex-col space-y-2.5 pt-4 mt-2">
          <p className="font-caption text-caption text-text-secondary flex items-center gap-1.5 text-xs">
            <span className="material-symbols-outlined text-[15px] text-primary">toggle_on</span>
            <span>FormAssist only works on a page after you turn it on.</span>
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onNext}
              className="h-[42px] px-6 rounded-lg bg-primary text-text-on-primary font-body-strong text-body-strong hover:bg-primary-pressed transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              type="button"
            >
              <span>Continue</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              onClick={onBack}
              className="h-[42px] px-5 rounded-lg bg-transparent text-text-secondary font-body-strong text-body-strong hover:text-text-primary hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer text-xs"
              type="button"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Right Canvas (Downsized by 20%) */}
      <div className="lg:col-span-7 bg-primary-tint relative p-5 lg:p-8 flex flex-col justify-center items-center overflow-hidden">
        {/* Main Visualized Document Schema */}
        <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-xl shadow-xs p-4 sm:p-5 relative">
          {/* Document Header Wireframe */}
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-surface-container-high">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[17px]">description</span>
              </div>
              <div>
                <div className="h-2.5 w-28 bg-surface-container-highest rounded-full"></div>
                <div className="h-2 w-16 bg-surface-container mt-1 rounded-full"></div>
              </div>
            </div>
            <span className="font-caption text-caption text-source-official bg-source-official-bg px-2 py-0.5 rounded font-semibold text-[11px]">
              Verified Safe
            </span>
          </div>

          {/* Field 1: FormAssist Analysis Active */}
          <div className="mb-3.5 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-wash text-on-surface font-body-strong text-xs">
                <span className="material-symbols-outlined text-[14px] text-tertiary-container">visibility</span>
                <span>Question 01: Reason for Consultation</span>
              </div>
              <span className="font-caption text-[11px] text-source-ai font-medium">Structure Analyzed</span>
            </div>
            {/* Answer Box */}
            <div className="relative h-10 w-full rounded-lg bg-surface-container-low overflow-hidden flex items-center px-3">
              <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="hatch-pattern-1"
                    width="8"
                    height="8"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#4A5B66" strokeWidth="1.2"></line>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hatch-pattern-1)"></rect>
              </svg>
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="font-caption text-caption text-text-secondary tracking-widest font-mono text-xs">
                  ••••••••••••••••••••
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest text-text-secondary font-caption text-[10px] shadow-xs">
                  <span className="material-symbols-outlined text-[12px] text-primary">lock</span>
                  <span>Private Local Buffer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Field 2: Sensitive Identification Box */}
          <div className="mb-4 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-wash text-on-surface font-body-strong text-xs">
                <span className="material-symbols-outlined text-[14px] text-tertiary-container">visibility</span>
                <span>Question 02: National ID / Insurance PIN</span>
              </div>
              <span className="font-caption text-[11px] text-tag-unusual font-medium">Input Isolated</span>
            </div>
            <div className="relative h-10 w-full rounded-lg bg-surface-container-low overflow-hidden flex items-center px-3">
              <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="hatch-pattern-2"
                    width="8"
                    height="8"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#4A5B66" strokeWidth="1.2"></line>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hatch-pattern-2)"></rect>
              </svg>
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="font-caption text-caption text-text-secondary tracking-widest font-mono text-xs">
                  •••• &nbsp; •••• &nbsp; ••••
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest text-text-secondary font-caption text-[10px] shadow-xs">
                  <span className="material-symbols-outlined text-[12px] text-primary">enhanced_encryption</span>
                  <span>Zero Cloud Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architectural Legend Callout */}
          <div className="p-3 rounded-lg bg-primary-tint/60 flex items-center justify-between text-caption font-caption text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-accent-wash"></span>
              <span className="text-on-surface font-medium text-[11px]">Read: Label Structure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-surface-container-highest"></span>
              <span className="text-text-secondary font-medium text-[11px]">Untouched: Your Answers</span>
            </div>
          </div>
        </div>

        {/* Supplemental Floating Anchor Badge */}
        <div className="mt-4 flex items-center gap-2 text-text-secondary font-caption text-caption text-xs">
          <span className="material-symbols-outlined text-[16px] text-primary">security</span>
          <span>Guaranteed no cloud logging of user keystrokes</span>
        </div>
      </div>
    </div>
  );
};
