/**
 * Redaction Module
 * Cites SRS v1.2: FR-REDACT.1, FR-REDACT.2, FR-REDACT.3, FR-REDACT.4
 *
 * CRITICAL PRIVACY INVARIANT:
 * 1. .value is NEVER read or stored as text.
 * 2. Sensitive fields strip placeholders, options, and help text.
 * 3. hasValue is strictly a boolean check (el.value.length > 0).
 */

import { ExtractedField } from '../shared/types';
import { SENSITIVE_PATTERNS } from '../shared/constants';

export function isSensitiveField(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, labelText: string): boolean {
  if (element instanceof HTMLInputElement && element.type === 'password') {
    return true;
  }

  const checkStrings = [
    labelText,
    element.name,
    element.id,
    element.getAttribute('aria-label') || '',
    element.getAttribute('placeholder') || '',
  ].join(' ');

  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(checkStrings));
}

export function sanitizeField(
  rawField: Omit<ExtractedField, 'sensitive' | 'hasValue'>,
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
): ExtractedField {
  const sensitive = isSensitiveField(element, rawField.label);

  // FR-CHAT.2: fill state is purely a boolean indicating if user entered something
  // We NEVER read or copy the value string.
  const hasValue = Boolean(element.value && element.value.length > 0);

  if (sensitive) {
    // FR-REDACT.4: Only label and inputType are kept. Placeholder, options, helpText are stripped.
    return {
      id: rawField.id,
      name: rawField.name,
      inputType: rawField.inputType,
      label: rawField.label,
      required: rawField.required,
      sensitive: true,
      hasValue,
      rect: rawField.rect,
    };
  }

  return {
    ...rawField,
    sensitive: false,
    hasValue,
  };
}
