import React from 'react';
import { ChatMessage as ChatMessageType, Language } from '../../shared/types';
import { SparklesIcon } from '../../shared/icons';
import { FormattedMarkdown } from './FormattedMarkdown';

interface ChatMessageProps {
  message: ChatMessageType;
  language: Language;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, language }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex gap-2 max-w-[88%] ${
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      } ${language !== 'en' ? 'script-devanagari' : ''}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-md bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
          <SparklesIcon className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={`py-2 px-3 rounded-xl text-xs leading-relaxed shadow-xs ${
          isUser
            ? 'bg-primary-container text-white rounded-br-xs'
            : 'bg-surface-card text-text-primary border border-border-subtle rounded-bl-xs'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <FormattedMarkdown content={message.content} />
        )}
      </div>
    </div>
  );
};
