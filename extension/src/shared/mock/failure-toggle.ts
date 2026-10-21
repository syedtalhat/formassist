/**
 * Injectable failure state for Error view demonstration (UC-5)
 */

let failureInjected = false;

export function setFailureInjection(fail: boolean) {
  failureInjected = fail;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ mockFailureInjection: fail });
  }
}

export async function isFailureInjected(): Promise<boolean> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get('mockFailureInjection');
    return !!data.mockFailureInjection;
  }
  return failureInjected;
}
