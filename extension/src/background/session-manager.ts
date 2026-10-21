/**
 * Background Session Manager
 * Implements the 7-state Session State Machine per std_preview.png
 * Tracks tab-scoped session state and broadcasts updates to content scripts and popup.
 */

import { SessionState, FormAnalysisResult, Language } from '../shared/types';

export interface TabSession {
  tabId: number;
  state: SessionState;
  language: Language;
  analysisResult?: FormAnalysisResult;
  focusedFieldId?: string | null;
  error?: string | null;
  progressStep?: 1 | 2 | 3;
  progressMessage?: string;
}

class SessionManager {
  private sessions = new Map<number, TabSession>();

  constructor() {
    this.restoreFromStorage();
  }

  private async restoreFromStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      try {
        const stored = await chrome.storage.session.get('tab_sessions');
        if (stored.tab_sessions) {
          for (const [key, val] of Object.entries(stored.tab_sessions)) {
            this.sessions.set(Number(key), val as TabSession);
          }
        }
      } catch {
        // Storage session not supported or empty
      }
    }
  }

  private async saveToStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      try {
        const obj: Record<string, TabSession> = {};
        for (const [tabId, sess] of this.sessions.entries()) {
          obj[String(tabId)] = sess;
        }
        await chrome.storage.session.set({ tab_sessions: obj });
      } catch {
        // Storage save error
      }
    }
  }

  public getSession(tabId: number): TabSession {
    let sess = this.sessions.get(tabId);
    if (!sess) {
      sess = {
        tabId,
        state: 'idle',
        language: 'en',
      };
      this.sessions.set(tabId, sess);
    }
    return sess;
  }

  public updateSession(tabId: number, updates: Partial<TabSession>): TabSession {
    const current = this.getSession(tabId);
    const updated = { ...current, ...updates };
    this.sessions.set(tabId, updated);
    this.saveToStorage();
    this.broadcastState(updated);
    return updated;
  }

  public removeSession(tabId: number) {
    this.sessions.delete(tabId);
    this.saveToStorage();
  }

  private broadcastState(session: TabSession) {
    try {
      // Broadcast to runtime (popup listens)
      chrome.runtime.sendMessage({
        type: 'STATE_CHANGED',
        state: session.state,
        tabId: session.tabId,
        session,
      }).catch(() => {
        // Popup might not be open, which is completely normal
      });

      // Send to content script in the specific tab
      chrome.tabs.sendMessage(session.tabId, {
        type: 'STATE_CHANGED',
        state: session.state,
        session,
      }).catch(() => {
        // Content script might not be injected yet
      });
    } catch {
      // Ignore broadcast errors
    }
  }
}

export const sessionManager = new SessionManager();
