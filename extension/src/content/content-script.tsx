/**
 * Content Script (Injected on demand via chrome.scripting.executeScript)
 * Cites SRS v1.2: FR-EXTRACT.1-4, FR-REDACT.1-4, FR-RISK.1-4, FR-UI.3 (Shadow DOM)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { extractPageFormFields, observeFormMutations } from './extractor';
import { analyzeFormRisks } from './risk-analyzer';
import { OverlayApp } from '../overlay/OverlayApp';
import shadowCss from '../design/shadow.css?inline';
import { ExtractedField } from '../shared/types';

let reactRoot: ReactDOM.Root | null = null;
let shadowHost: HTMLElement | null = null;
let disconnectObserver: (() => void) | null = null;
let cachedFields: ExtractedField[] = [];

function initShadowRoot(): ShadowRoot {
  let existingHost = document.getElementById('formassist-shadow-host');
  if (existingHost && existingHost.shadowRoot) {
    shadowHost = existingHost;
    return existingHost.shadowRoot;
  }

  shadowHost = document.createElement('div');
  shadowHost.id = 'formassist-shadow-host';
  // Keep host container neutral and floating on top
  shadowHost.style.position = 'absolute';
  shadowHost.style.top = '0';
  shadowHost.style.left = '0';
  shadowHost.style.width = '100%';
  shadowHost.style.height = '0';
  shadowHost.style.overflow = 'visible';
  shadowHost.style.zIndex = '2147483630';
  shadowHost.style.pointerEvents = 'none';

  (document.body || document.documentElement).appendChild(shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // Inject font and shadow styles
  const styleEl = document.createElement('style');
  styleEl.textContent = shadowCss;
  shadowRoot.appendChild(styleEl);

  return shadowRoot;
}

// Safe wrapper for chrome.runtime.sendMessage that gracefully handles context invalidation
function safeSendMessage(message: any, callback?: (response: any) => void) {
  try {
    if (!chrome?.runtime?.id) {
      return;
    }
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        return;
      }
      callback?.(response);
    });
  } catch {
    // Extension context invalidated when extension is reloaded; ignore safely
  }
}

function mountOverlay(shadowRoot: ShadowRoot) {
  let mountPoint = shadowRoot.getElementById('formassist-mount-point');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'formassist-mount-point';
    shadowRoot.appendChild(mountPoint);
  }

  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(mountPoint);
    reactRoot.render(
      <React.StrictMode>
        <OverlayApp
          initialState="idle"
          initialLanguage="en"
          onSendMessage={(text, fieldId) => {
            safeSendMessage({
              type: 'SEND_CHAT_MESSAGE',
              text,
              fieldId,
            });
          }}
          onFocusField={(fieldId) => {
            safeSendMessage({
              type: 'FOCUS_FIELD',
              fieldId,
            });
          }}
          onToggleChat={(open, fieldId) => {
            safeSendMessage({
              type: 'TOGGLE_CHAT',
              open,
              fieldId,
            });
          }}
          onRetry={() => {
            safeSendMessage({ type: 'RETRY' });
          }}
          onDismiss={() => {
            safeSendMessage({ type: 'DEACTIVATE' });
          }}
        />
      </React.StrictMode>
    );
  }
}

function scanAndReport() {
  const { fields, formAction } = extractPageFormFields();
  cachedFields = fields;
  const currentUrl = window.location.href;
  const domain = window.location.hostname;

  // Run client-side risk analysis (FR-RISK.1-4)
  const clientRisks = analyzeFormRisks(fields, currentUrl, formAction);

  // Inform overlay of extracted fields
  (window as any).__FormAssistOverlay?.setFields(fields);

  // Send to background SW safely
  safeSendMessage({
    type: 'FIELDS_EXTRACTED',
    fields,
    domain,
    pageUrl: currentUrl,
    formAction,
    clientRisks,
  });
}

function setupFieldFocusListeners() {
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      const fieldId = target.id || target.name;
      if (fieldId) {
        (window as any).__FormAssistOverlay?.setFocusedField(fieldId);
        safeSendMessage({
          type: 'FOCUS_FIELD',
          fieldId,
        });
      }
    }
  });

  document.addEventListener('focusout', () => {
    // Only unfocus if not clicking inside shadow root
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (!activeEl || activeEl === document.body) {
        (window as any).__FormAssistOverlay?.setFocusedField(null);
        safeSendMessage({
          type: 'FOCUS_FIELD',
          fieldId: null,
        });
      }
    }, 150);
  });
}

// Runtime message listener for background commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG' });
    return true;
  }

  const shadowRoot = initShadowRoot();
  mountOverlay(shadowRoot);

  switch (message.type) {
    case 'SCAN_DOM': {
      (window as any).__FormAssistOverlay?.setState('scanning');
      scanAndReport();

      // Setup mutation observer for dynamically added form fields (FR-EXTRACT.3)
      if (!disconnectObserver) {
        disconnectObserver = observeFormMutations(() => {
          scanAndReport();
        });
      }

      setupFieldFocusListeners();
      break;
    }

    case 'ANALYSIS_COMPLETE': {
      if (message.result) {
        if (cachedFields.length === 0) {
          cachedFields = extractPageFormFields().fields;
        }
        (window as any).__FormAssistOverlay?.setFields(cachedFields);
        (window as any).__FormAssistOverlay?.setAnalysisResult(message.result);
        (window as any).__FormAssistOverlay?.setState('ready');
      }
      break;
    }

    case 'STATE_CHANGED': {
      if (message.session) {
        if (cachedFields.length === 0) {
          cachedFields = extractPageFormFields().fields;
        }
        (window as any).__FormAssistOverlay?.setFields(cachedFields);
        (window as any).__FormAssistOverlay?.setState(message.session.state);
        if (message.session.language) {
          (window as any).__FormAssistOverlay?.setLanguage(message.session.language);
        }
        if (message.session.analysisResult) {
          (window as any).__FormAssistOverlay?.setAnalysisResult(message.session.analysisResult);
        }
        if (message.session.progressStep) {
          (window as any).__FormAssistOverlay?.setProgress(message.session.progressStep);
        }
        if (message.session.error) {
          (window as any).__FormAssistOverlay?.setError(message.session.error);
        }
      }
      break;
    }

    case 'TOGGLE_CHAT': {
      (window as any).__FormAssistOverlay?.setChatOpen(message.open, message.fieldId);
      break;
    }

    case 'CHAT_REPLY': {
      if (message.message) {
        (window as any).__FormAssistOverlay?.addChatMessage(message.message);
      }
      break;
    }

    case 'DEACTIVATE': {
      (window as any).__FormAssistOverlay?.setState('deactivated');
      if (disconnectObserver) {
        disconnectObserver();
        disconnectObserver = null;
      }
      break;
    }
  }

  sendResponse({ status: 'OK' });
  return true;
});
