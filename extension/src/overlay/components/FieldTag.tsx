import React from 'react';
import { FieldTagType, Language } from '../../shared/types';
import { AlertTriangleIcon, InfoIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface FieldTagProps {
  fieldId: string;
  tagType: FieldTagType;
  language: Language;
  top: number;
  left: number;
  onClick: () => void;
  isActive?: boolean;
}

export const FieldTag: React.FC<FieldTagProps> = ({
  tagType,
  language,
  top,
  left,
  onClick,
  isActive = false,
}) => {
  const t = getTranslation(language);

  let tagClass = 'tag-required';
  let labelText = t.tags.seeDescription;

  if (tagType === 'unusual') {
    tagClass = 'tag-unusual';
    labelText = `${t.tags.unusual} • ${t.tags.seeDescription}`;
  } else if (tagType === 'optional') {
    tagClass = 'tag-optional';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-100%)',
        zIndex: 2147483630,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`tag-chip ${tagClass} ${isActive ? 'ring-2 ring-primary-container scale-105' : ''} ${
        language !== 'en' ? 'script-devanagari' : ''
      }`}
      role="button"
      tabIndex={0}
      title="Click to view explanation"
    >
      {tagType === 'unusual' ? (
        <AlertTriangleIcon size={14} className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <InfoIcon size={14} className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span>{labelText}</span>
    </div>
  );
};
