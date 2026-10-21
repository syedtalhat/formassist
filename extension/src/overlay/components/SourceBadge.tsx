import React from 'react';
import { SourceLabel } from '../../shared/types';
import { ShieldCheckIcon, DocumentTextIcon, SparklesIcon } from '../../shared/icons';

interface SourceBadgeProps {
  source: SourceLabel;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  if (source === 'official') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-bold bg-[#E4F4EC] text-[#17724A] border border-[#17724A]">
        <ShieldCheckIcon className="w-3.5 h-3.5" />
        <span>From official source</span>
      </span>
    );
  }

  if (source === 'page') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-bold bg-[#E6EEFA] text-[#2A5DA8] border border-[#2A5DA8]">
        <DocumentTextIcon className="w-3.5 h-3.5" />
        <span>From this page</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-bold bg-[#EFEBFA] text-[#5E479B] border border-dashed border-[#5E479B]">
      <SparklesIcon className="w-3.5 h-3.5" />
      <span>AI's general knowledge</span>
    </span>
  );
};
