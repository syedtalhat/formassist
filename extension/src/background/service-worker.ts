/**
 * Background Service Worker (Manifest V3)
 * Cites SRS v1.2: NFR-PRIV.2 (programmatic injection), std_preview.png (session state)
 */

import { sessionManager } from './session-manager';
import { apiAnalyzeForm, apiSendChat } from './api-client';
import { Language, MessagePayload } from '../shared/types';

// On installation, open Onboarding page in a new tab
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding/index.html'),
    });
  }
});

// Clean up tab state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  sessionManager.removeSession(tabId);
});

async function getActiveTabId(): Promise<number | null> {
  try {
    const lastFocused = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (lastFocused[0]?.id) return lastFocused[0].id;
    const currentWin = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentWin[0]?.id) return currentWin[0].id;
    const allActive = await chrome.tabs.query({ active: true });
    return allActive[0]?.id || null;
  } catch (err) {
    console.error('Failed to get active tab ID:', err);
    return null;
  }
}

// Helper to inject content script programmatically on demand (NFR-PRIV.2)
async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    // Ping content script to see if already present
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => null);
    if (response && response.status === 'PONG') {
      return true;
    }

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content-script.js'],
    });

    // Wait briefly for content script to initialize its message listener
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 60));
      const pong = await chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => null);
      if (pong && pong.status === 'PONG') return true;
    }
    return true;
  } catch (err) {
    console.error('Failed to inject content script:', err);
    return false;
  }
}

// Runtime message dispatcher
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  // Ignore state broadcast notifications reflected into service worker
  if (message.type === 'STATE_CHANGED' || message.type === 'PING') {
    return false;
  }

  // Handle messages asynchronously
  (async () => {
    const tabId = sender.tab?.id || message.tabId || (await getActiveTabId());

    switch (message.type) {
      case 'GET_SESSION_STATE': {
        if (tabId) {
          const session = sessionManager.getSession(tabId);
          sendResponse({ session });
        } else {
          sendResponse({ session: null });
        }
        break;
      }

      case 'START_ANALYSIS': {
        if (!tabId) {
          console.error('FormAssist: No active tab found for START_ANALYSIS');
          return;
        }

        sessionManager.updateSession(tabId, {
          state: 'scanning',
          error: null,
          progressStep: 1,
          progressMessage: 'Reading the form',
        });

        const injected = await ensureContentScriptInjected(tabId);
        if (!injected) {
          sessionManager.updateSession(tabId, {
            state: 'error',
            error: 'Could not inject FormAssist into this page.',
          });
          return;
        }

        // Send message to content script to scan DOM
        chrome.tabs.sendMessage(tabId, {
          type: 'SCAN_DOM',
          language: message.language || sessionManager.getSession(tabId).language,
        });
        break;
      }

      case 'FIELDS_EXTRACTED': {
        const activeTabId = sender.tab?.id || tabId;
        if (!activeTabId) return;

        if (!message.fields || message.fields.length === 0) {
          sessionManager.updateSession(activeTabId, {
            state: 'error',
            error: 'No form fields detected on this page.',
          });
          return;
        }

        const session = sessionManager.getSession(activeTabId);
        sessionManager.updateSession(activeTabId, {
          state: 'analyzing',
          progressStep: 2,
          progressMessage: 'Checking for anything unusual',
        });

        try {
          const result = await apiAnalyzeForm(
            message.fields,
            message.pageUrl,
            message.domain,
            session.language,
            (step, msg) => {
              sessionManager.updateSession(activeTabId, {
                progressStep: step,
                progressMessage: msg,
              });
            }
          );

          sessionManager.updateSession(activeTabId, {
            state: 'ready',
            analysisResult: result,
            error: null,
          });

          // Forward result to content script overlay
          chrome.tabs.sendMessage(activeTabId, {
            type: 'ANALYSIS_COMPLETE',
            result,
          });
        } catch (err: any) {
          sessionManager.updateSession(activeTabId, {
            state: 'error',
            error: err?.message || 'Could not connect to FormAssist service.',
          });
        }
        break;
      }

      case 'SWITCH_LANGUAGE': {
        if (!tabId) return;

        const session = sessionManager.getSession(tabId);
        const newLang = message.language as Language;
        sessionManager.updateSession(tabId, { language: newLang });

        if (session.analysisResult) {
          sessionManager.updateSession(tabId, {
            state: 'analyzing',
            progressStep: 3,
            progressMessage: 'Writing simple explanations',
          });

          try {
            const reResult = await apiAnalyzeForm(
              [],
              session.analysisResult.pageUrl,
              session.analysisResult.domain,
              newLang
            );
            sessionManager.updateSession(tabId, {
              state: 'ready',
              analysisResult: reResult,
            });
            chrome.tabs.sendMessage(tabId, {
              type: 'ANALYSIS_COMPLETE',
              result: reResult,
            });
          } catch (err: any) {
            sessionManager.updateSession(tabId, {
              state: 'error',
              error: err?.message || 'Failed to switch language.',
            });
          }
        }
        break;
      }

      case 'FOCUS_FIELD': {
        if (tabId) {
          const sess = sessionManager.getSession(tabId);
          if (sess.state === 'ready' || sess.state === 'field_focused') {
            sessionManager.updateSession(tabId, {
              state: message.fieldId ? 'field_focused' : 'ready',
              focusedFieldId: message.fieldId,
            });
          }
        }
        break;
      }

      case 'TOGGLE_CHAT': {
        if (tabId) {
          sessionManager.updateSession(tabId, {
            state: message.open ? 'chat_open' : 'ready',
            focusedFieldId: message.fieldId || null,
          });
          chrome.tabs.sendMessage(tabId, {
            type: 'TOGGLE_CHAT',
            open: message.open,
            fieldId: message.fieldId,
          });
        }
        break;
      }

      case 'SEND_CHAT_MESSAGE': {
        if (!tabId) return;

        const session = sessionManager.getSession(tabId);
        try {
          const reply = await apiSendChat(message.text, message.fieldId, session.language);
          chrome.tabs.sendMessage(tabId, {
            type: 'CHAT_REPLY',
            message: reply,
          });
        } catch (err: any) {
          console.error('SEND_CHAT_MESSAGE error:', err);
          chrome.tabs.sendMessage(tabId, {
            type: 'CHAT_REPLY',
            message: {
              id: `msg_err_${Date.now()}`,
              sender: 'assistant',
              content: 'I apologize, the assistant service is temporarily busy. Please try asking again in a moment.',
              timestamp: Date.now(),
              focusedFieldId: message.fieldId,
            },
          });
        }
        break;
      }

      case 'RETRY': {
        if (!tabId) return;

        sessionManager.updateSession(tabId, {
          state: 'scanning',
          error: null,
          progressStep: 1,
          progressMessage: 'Reading the form',
        });

        chrome.tabs.sendMessage(tabId, {
          type: 'SCAN_DOM',
          language: sessionManager.getSession(tabId).language,
        });
        break;
      }

      case 'DEACTIVATE': {
        if (!tabId) return;

        sessionManager.updateSession(tabId, {
          state: 'idle',
          analysisResult: undefined,
          error: null,
        });

        chrome.tabs.sendMessage(tabId, { type: 'DEACTIVATE' });
        break;
      }
    }
  })();

  return true; // Keep message port open for async response
});
