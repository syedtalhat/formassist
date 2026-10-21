/**
 * Client-Side Risk Analysis Module
 * Cites SRS v1.2: FR-RISK.1, FR-RISK.2, FR-RISK.3, FR-RISK.4
 * Uses tldts for registrable domain extraction and comparison.
 */

import { getDomain } from 'tldts';
import { ExtractedField, RiskFlag } from '../shared/types';
import { BANKING_DOMAINS_ALLOWLIST } from '../shared/constants';

export function analyzeFormRisks(
  fields: ExtractedField[],
  pageUrl: string,
  formAction?: string
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const currentUrl = new URL(pageUrl);
  const currentRegistrableDomain = getDomain(currentUrl.hostname) || currentUrl.hostname;

  // FR-RISK.2: Insecure HTTP protocol check
  if (currentUrl.protocol === 'http:' && !currentUrl.hostname.includes('localhost') && !currentUrl.hostname.includes('127.0.0.1')) {
    flags.push({
      id: 'risk-insecure-http',
      type: 'insecure_http',
      severity: 'medium',
      description: 'This page is not secure (HTTP instead of HTTPS). Information you type could be intercepted.',
      technicalDetails: `Page served over insecure protocol: ${currentUrl.protocol}`,
    });
  }

  // FR-RISK.1: Cross-domain form submission action check
  if (formAction && formAction.trim() !== '' && !formAction.startsWith('#') && !formAction.startsWith('javascript:')) {
    try {
      const actionUrl = new URL(formAction, pageUrl);
      const actionRegistrableDomain = getDomain(actionUrl.hostname) || actionUrl.hostname;

      if (actionRegistrableDomain && actionRegistrableDomain !== currentRegistrableDomain) {
        flags.push({
          id: 'risk-cross-domain',
          type: 'cross_domain_action',
          severity: 'high',
          description: `This form sends your information to a different website (${actionRegistrableDomain}). Check that this matches the official service.`,
          technicalDetails: `Form action domain "${actionRegistrableDomain}" does not match host domain "${currentRegistrableDomain}".`,
        });
      }
    } catch {
      // Invalid URL in form action
    }
  }

  // FR-RISK.3: Sensitive credentials or OTP on non-banking domain
  const isBankingDomain = BANKING_DOMAINS_ALLOWLIST.some(
    (allowed) => currentRegistrableDomain === allowed || currentRegistrableDomain.endsWith(`.${allowed}`)
  );

  for (const field of fields) {
    if (field.sensitive && !isBankingDomain) {
      const isOtp = /otp|cvv|pin|mpin|security.?code/i.test(`${field.label} ${field.name} ${field.id}`);
      if (isOtp) {
        flags.push({
          id: `risk-sensitive-${field.id}`,
          fieldId: field.id,
          type: 'sensitive_field_unusual',
          severity: 'high',
          description: `This non-banking page asks for sensitive authentication codes (OTP/CVV). Official services rarely ask for this here.`,
          technicalDetails: `Field "${field.label || field.id}" matched sensitive authentication patterns on non-banking domain "${currentRegistrableDomain}".`,
        });
      }
    }
  }

  return flags;
}
