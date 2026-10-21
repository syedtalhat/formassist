import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, Language } from '../../shared/types';
import { ChatMessage } from './ChatMessage';
import { CloseIcon, SendIcon, SparklesIcon, LockIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface ChatPanelProps {
  language: Language;
  focusedFieldId: string | null;
  focusedFieldLabel?: string;
  onClose: () => void;
  onSendMessage: (text: string, fieldId?: string) => void;
  messages: ChatMessageType[];
  isWaitingForReply?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  language,
  focusedFieldId,
  focusedFieldLabel,
  onClose,
  onSendMessage,
  messages,
  isWaitingForReply = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWaitingForReply]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isWaitingForReply) return;

    onSendMessage(inputText.trim(), focusedFieldId || undefined);
    setInputText('');
  };

  return (
    <div className={`overlay-chat-drawer ${language !== 'en' ? 'script-devanagari' : ''}`}>
      {/* Drawer Header */}
      <div className="px-3.5 py-2.5 border-b border-border-subtle bg-surface-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-control bg-primary-container text-white flex items-center justify-center shadow-xs">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-primary-container leading-none">
              {t.chat.drawerTitle}
            </h2>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-text-secondary">
              <span className="font-medium">{t.chat.contextPrefix}</span>
              <span className="font-semibold text-text-primary px-1.5 py-0.2 rounded bg-surface-muted max-w-[150px] truncate inline-block">
                {focusedFieldLabel || t.chat.contextAll}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary p-1 rounded-control hover:bg-surface-muted transition-colors"
          title="Close chat"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-surface-page">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-text-secondary">
            <div className="w-10 h-10 rounded-full bg-primary-tint text-primary-container flex items-center justify-center mb-2.5">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <p className="font-body text-xs leading-relaxed max-w-xs">
              {t.chat.emptyState}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} language={language} />
          ))
        )}

        {/* Animated Thinking / Blinking Indicator */}
        {isWaitingForReply && (
          <div className="flex gap-2 mr-auto max-w-[88%] items-start animate-fadeIn">
            <div className="w-6 h-6 rounded-md bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
              <SparklesIcon className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="py-2 px-3 rounded-xl text-xs bg-surface-card text-text-primary border border-border-subtle rounded-bl-xs shadow-xs flex items-center gap-2">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce [animation-delay:0.3s]"></span>
              </span>
              <span className="text-xs font-semibold text-primary-container animate-pulse">
                FormAssist is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Privacy Footer */}
      <div className="p-2.5 border-t border-border-subtle bg-surface-card flex flex-col gap-1.5">
        <form onSubmit={handleSend} className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.chat.inputPlaceholder}
            className="flex-1 h-9 px-3 rounded-control border border-border-strong bg-white text-text-primary text-xs focus-ring"
            disabled={isWaitingForReply}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isWaitingForReply}
            className="h-9 px-3 bg-primary-container hover:bg-primary-pressed disabled:opacity-40 text-white rounded-control font-semibold text-xs transition-all shadow-xs flex items-center justify-center shrink-0"
            title="Send question"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center gap-1 text-[10px] text-text-secondary px-0.5">
          <LockIcon className="w-3 h-3 text-source-official flex-shrink-0" />
          <span className="truncate">{t.chat.privacyReminder}</span>
        </div>
      </div>
    </div>
  );
};
