/**
 * DOM Extractor Module
 * Cites SRS v1.2: FR-EXTRACT.1, FR-EXTRACT.2, FR-EXTRACT.3, FR-EXTRACT.4
 */

import { ExtractedField } from '../shared/types';
import { sanitizeField } from './redactor';

export function resolveFieldLabel(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
): string {
  // 1. label[for="element.id"]
  if (element.id) {
    const labelFor = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (labelFor && labelFor.textContent?.trim()) {
      return labelFor.textContent.trim().replace(/\s+/g, ' ');
    }
  }

  // 2. Ancestor <label>
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    return parentLabel.textContent.trim().replace(/\s+/g, ' ');
  }

  // 3. aria-label attribute
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return ariaLabel.trim();
  }

  // 4. aria-labelledby text
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const targetEl = document.getElementById(ariaLabelledBy);
    if (targetEl && targetEl.textContent?.trim()) {
      return targetEl.textContent.trim().replace(/\s+/g, ' ');
    }
  }

  // 5. Nearest preceding heading or label text in previous siblings
  let prev = element.previousElementSibling;
  while (prev) {
    if (prev.tagName.toLowerCase() === 'label' || /^h[1-6]$/i.test(prev.tagName)) {
      if (prev.textContent?.trim()) {
        return prev.textContent.trim().replace(/\s+/g, ' ');
      }
    }
    prev = prev.previousElementSibling;
  }

  // 6. Placeholder
  const placeholder = element.getAttribute('placeholder');
  if (placeholder && placeholder.trim()) {
    return placeholder.trim();
  }

  // 7. Fallback to name or title
  return element.getAttribute('title') || element.name || 'Untitled field';
}

export function resolveFieldHelpText(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
): string | undefined {
  // Check aria-describedby
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const descEl = document.getElementById(describedBy);
    if (descEl && descEl.textContent?.trim()) {
      return descEl.textContent.trim().replace(/\s+/g, ' ');
    }
  }

  // Check common sibling help classes
  const container = element.parentElement;
  if (container) {
    const helpEl = container.querySelector('.help-text, .form-text, .field-hint, small, .form-hint');
    if (helpEl && helpEl !== element && helpEl.textContent?.trim()) {
      return helpEl.textContent.trim().replace(/\s+/g, ' ');
    }
  }

  return undefined;
}

export function extractPageFormFields(): {
  fields: ExtractedField[];
  formAction?: string;
} {
  const formElements = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), select, textarea'
    )
  );

  const mainForm = document.querySelector('form');
  const formAction = mainForm?.getAttribute('action') || undefined;

  const fields: ExtractedField[] = [];

  formElements.forEach((el, index) => {
    // Generate deterministic id if missing
    const id = el.id || el.name || `field-${index}`;
    const name = el.name || id;
    const inputType = el instanceof HTMLSelectElement ? 'select' : el instanceof HTMLTextAreaElement ? 'textarea' : el.type || 'text';
    const label = resolveFieldLabel(el);
    const placeholder = el.getAttribute('placeholder') || undefined;
    const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';
    const helpText = resolveFieldHelpText(el);

    let options: { value: string; label: string }[] | undefined;
    if (el instanceof HTMLSelectElement) {
      options = Array.from(el.options)
        .filter((opt) => opt.value !== '')
        .map((opt) => ({ value: opt.value, label: opt.text }));
    }

    const rect = el.getBoundingClientRect();

    const rawField = {
      id,
      name,
      inputType,
      label,
      placeholder,
      required,
      helpText,
      options,
      rect: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      },
    };

    // Sanitize through privacy redactor (FR-REDACT.1-4)
    const sanitized = sanitizeField(rawField, el);
    fields.push(sanitized);
  });

  return { fields, formAction };
}

export function observeFormMutations(onMutation: () => void): () => void {
  const observer = new MutationObserver((mutations) => {
    let hasFormChanges = false;
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          if (
            node.matches('input, select, textarea, form') ||
            node.querySelector('input, select, textarea')
          ) {
            hasFormChanges = true;
            break;
          }
        }
      }
      if (hasFormChanges) break;
    }

    if (hasFormChanges) {
      onMutation();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
