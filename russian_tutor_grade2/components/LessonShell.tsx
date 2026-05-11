'use client';

import { useState } from 'react';
import { VoiceInput } from '@/components/VoiceInput';

interface LessonShellProps {
  intro: string;
  placeholder: string;
  botReply: string;
  hint: string;
  sendLabel?: string;
  onSend?: (message: string) => LessonShellResponse;
  onResult?: (feedback: LessonResultFeedback) => void;
}

type LessonShellResponse = {
  response: string;
  correct?: boolean;
  note?: string;
};

type LessonResultFeedback = {
  correct?: boolean;
};

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

export function LessonShell({
  intro,
  placeholder,
  botReply,
  hint,
  sendLabel = 'Отправить',
  onSend,
  onResult,
}: LessonShellProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: intro }]);

  const handleVoiceResult = (voiceText: string) => {
    // Подставляем распознанный текст в поле ввода
    setInput(voiceText);
  };

  const handleSend = () => {
    const value = input.trim();
    if (!value) {
      return;
    }

    const result = onSend ? onSend(value) : { response: botReply };
    setMessages((current) => {
      const nextMessages: Message[] = [
        ...current,
        { role: 'user', text: value },
        { role: 'assistant', text: result.response },
      ];
      if (result.note) {
        nextMessages.push({ role: 'assistant', text: result.note });
      }
      return nextMessages;
    });

    if (result.correct !== undefined) {
      onResult?.({ correct: result.correct });
    }

    setInput('');
  };

  return (
    <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-3xl p-4 ${message.role === 'assistant' ? 'bg-slate-100 text-slate-800' : 'bg-brand-50 text-slate-900'} ${message.role === 'assistant' ? 'self-start' : 'self-end'}`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{message.role === 'assistant' ? 'Репетитор' : 'Ты'}</p>
            <p className="mt-2 text-base leading-7">{message.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <VoiceInput onVoiceResult={handleVoiceResult} />
        <button
          type="button"
          onClick={handleSend}
          className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          {sendLabel}
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-500">{hint}</p>
    </section>
  );
}
