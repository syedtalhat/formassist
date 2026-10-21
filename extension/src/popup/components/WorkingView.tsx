import React from 'react';
import { Language } from '../../shared/types';
import { CheckCircleIcon, SparklesIcon, LockIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface WorkingViewProps {
  language: Language;
  currentStep: 1 | 2 | 3;
  fieldCount?: number;
  apiMode?: string;
}

export const WorkingView: React.FC<WorkingViewProps> = ({
  language,
  currentStep = 1,
  fieldCount,
  apiMode = 'mock',
}) => {
  const t = getTranslation(language);

  const steps = [
    { num: 1, label: t.working.step1 },
    { num: 2, label: t.working.step2 },
    { num: 3, label: t.working.step3 },
  ];

  let modeBadge = t.working.modeMock;
  if (apiMode === 'emulator') modeBadge = t.working.modeEmulator;
  if (apiMode === 'live') modeBadge = t.working.modeLive;

  return (
    <div className="flex flex-col min-h-[380px] p-4 justify-between bg-surface-page text-text-primary">
      <div>
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-control bg-primary-container flex items-center justify-center text-white shadow-xs">
              <SparklesIcon className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-primary-container">
                FormAssist
              </h1>
              <span className="inline-block px-1.5 py-0.2 mt-0.5 rounded-full text-[10px] font-bold bg-primary-tint text-primary-container">
                {t.working.activeHelper}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-muted text-text-secondary border border-border-subtle">
            {modeBadge}
          </span>
        </div>

        {/* 3-Step Progress Card */}
        <div className="bg-surface-card p-3.5 rounded-card border border-border-subtle shadow-xs mb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-text-primary">
              Step {currentStep} of 3
            </h2>
            {fieldCount !== undefined && fieldCount > 0 && (
              <span className="text-xs text-text-secondary font-medium">
                {fieldCount} fields found
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            {steps.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div key={step.num} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-source-official text-white'
                        : isCurrent
                        ? 'bg-primary-container text-white animate-pulse ring-4 ring-primary-tint'
                        : 'bg-surface-muted text-text-disabled'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'font-bold text-text-primary'
                        : isDone
                        ? 'font-semibold text-text-secondary line-through'
                        : 'text-text-disabled'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy Card */}
        <div className="bg-primary-tint/50 p-3.5 rounded-control border border-primary-container/20 flex items-start gap-2.5">
          <LockIcon className="w-4 h-4 text-primary-container flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary-container font-medium leading-relaxed">
            {t.working.privacyNote}
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-text-secondary pt-3 border-t border-border-subtle">
        Working on this tab...
      </div>
    </div>
  );
};
