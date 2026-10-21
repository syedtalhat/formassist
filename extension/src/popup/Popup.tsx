import React, { useEffect, useState } from 'react';
import { Language, SessionState, FormAnalysisResult } from '../shared/types';
import { SignedOutView } from './components/SignedOutView';
import { IdleView } from './components/IdleView';
import { WorkingView } from './components/WorkingView';
import { ReadyView } from './components/ReadyView';
import { ErrorView } from './components/ErrorView';
import { subscribeToAuthChanges } from '../shared/auth-init';

export const Popup: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [language, setLanguage] = useState<Language>('en');
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch initial tab and session state
  useEffect(() => {
    // Subscribe to auth state
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      if (user) {
        setIsSignedIn(true);
        setUserEmail(user.email);
      } else {
        setIsSignedIn(false);
        setUserEmail(null);
      }
    });

    // Check auth status from storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['user_profile', 'default_language'], (res) => {
        if (res.user_profile) {
          setIsSignedIn(true);
          setUserEmail(res.user_profile.email);
        }
        if (res.default_language) {
          setLanguage(res.default_language);
        }
      });
    }

    // Get active tab URL, domain, and tabId
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          setActiveTabId(activeTab.id);
        }
        if (activeTab?.url) {
          try {
            const url = new URL(activeTab.url);
            setCurrentDomain(url.hostname);
          } catch {
            // invalid URL
          }
        }

        // Request session state from background SW for this tab
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(
            { type: 'GET_SESSION_STATE', tabId: activeTab?.id },
            (res) => {
              if (res?.session) {
                setSessionState(res.session.state);
                setLanguage(res.session.language);
                if (res.session.analysisResult) setAnalysisResult(res.session.analysisResult);
                if (res.session.error) setErrorMessage(res.session.error);
                if (res.session.progressStep) setCurrentStep(res.session.progressStep);
              }
            }
          );
        }
      });
    }

    // Listen for real-time state changes broadcast from Background SW
    const messageListener = (msg: any) => {
      if (msg.type === 'STATE_CHANGED' && msg.session) {
        setSessionState(msg.session.state);
        setLanguage(msg.session.language);
        if (msg.session.analysisResult) setAnalysisResult(msg.session.analysisResult);
        if (msg.session.error) setErrorMessage(msg.session.error);
        if (msg.session.progressStep) setCurrentStep(msg.session.progressStep);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleExplainClick = () => {
    setSessionState('scanning');
    setErrorMessage(null);
    setCurrentStep(1);
    chrome.runtime.sendMessage({
      type: 'START_ANALYSIS',
      language,
      tabId: activeTabId,
    });
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    chrome.runtime.sendMessage({
      type: 'SWITCH_LANGUAGE',
      language: newLang,
      tabId: activeTabId,
    });
  };

  const handleOpenChat = () => {
    chrome.runtime.sendMessage({
      type: 'TOGGLE_CHAT',
      open: true,
      tabId: activeTabId,
    });
    window.close(); // Close popup so user interacts with the page chat drawer
  };

  const handleDeactivate = () => {
    setSessionState('idle');
    setAnalysisResult(null);
    chrome.runtime.sendMessage({
      type: 'DEACTIVATE',
      tabId: activeTabId,
    });
  };

  const handleRetry = () => {
    setSessionState('scanning');
    setErrorMessage(null);
    setCurrentStep(1);
    chrome.runtime.sendMessage({
      type: 'RETRY',
      tabId: activeTabId,
    });
  };

  const handleDismiss = () => {
    setSessionState('idle');
    setErrorMessage(null);
    chrome.runtime.sendMessage({
      type: 'DEACTIVATE',
      tabId: activeTabId,
    });
  };

  const handleOpenOnboarding = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/index.html') });
  };

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  // State switcher
  if (sessionState === 'error') {
    return (
      <ErrorView
        language={language}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    );
  }

  if (sessionState === 'scanning' || sessionState === 'analyzing') {
    return (
      <WorkingView
        language={language}
        currentStep={currentStep}
        fieldCount={analysisResult ? Object.keys(analysisResult.fields).length : undefined}
        apiMode="mock"
      />
    );
  }

  if (sessionState === 'ready' || sessionState === 'field_focused' || sessionState === 'chat_open') {
    if (analysisResult) {
      return (
        <ReadyView
          language={language}
          analysisResult={analysisResult}
          onOpenChat={handleOpenChat}
          onLanguageChange={handleLanguageChange}
          onDeactivate={handleDeactivate}
        />
      );
    }
  }

  // Idle state
  if (isSignedIn) {
    return (
      <IdleView
        language={language}
        userName={userEmail?.split('@')[0] || 'Friend'}
        currentDomain={currentDomain}
        onExplainClick={handleExplainClick}
        onLanguageChange={handleLanguageChange}
        onOpenSettings={handleOpenSettings}
      />
    );
  }

  return (
    <SignedOutView
      language={language}
      onExplainClick={handleExplainClick}
      onLanguageChange={handleLanguageChange}
      onOpenOnboarding={handleOpenOnboarding}
    />
  );
};
