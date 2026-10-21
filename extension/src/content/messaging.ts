/**
 * Messaging Helper for Content Script
 */

import { MessagePayload } from '../shared/types';

export function sendRuntimeMessage(message: MessagePayload): Promise<any> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // Background SW might not be ready or responded
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}
