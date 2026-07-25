'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onVoiceResult: (text: string) => void;
}

type VoiceState = 'ready' | 'recording' | 'processing' | 'error' | 'unsupported';

export function VoiceInput({ onVoiceResult }: VoiceInputProps) {
  const [state, setStateLocal] = useState<VoiceState>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Инициализация Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStateLocal('unsupported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU'; // Русский язык
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStateLocal('recording');
      setErrorMessage('');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setStateLocal('processing');
        setTimeout(() => {
          onVoiceResult(finalTranscript.trim());
          setStateLocal('ready');
        }, 300);
      }
    };

    recognition.onerror = (event: any) => {
      setStateLocal('error');
      const errorMessages: Record<string, string> = {
        'no-speech': 'Я не услышал голос. Попробуй ещё раз.',
        'audio-capture': 'Микрофон не доступен. Проверь разрешения браузера.',
        'network': 'Ошибка сети. Попробуй ещё раз.',
        'not-allowed': 'Разрешение на микрофон отклонено. Проверь настройки браузера.',
      };
      setErrorMessage(errorMessages[event.error] || `Ошибка: ${event.error}`);
    };

    recognition.onend = () => {
      if (state === 'error') {
        // Оставляем ошибку видимой
      } else if (state !== 'processing') {
        setStateLocal('ready');
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (state === 'recording') {
      recognitionRef.current.stop();
      setStateLocal('ready');
    } else if (state === 'error') {
      setErrorMessage('');
      setStateLocal('ready');
    } else if (state === 'ready') {
      try {
        recognitionRef.current.start();
      } catch (err) {
        setStateLocal('error');
        setErrorMessage('Не удалось запустить микрофон.');
      }
    }
  };

  if (!isMounted) return null;

  if (state === 'unsupported') {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        <span>Твой браузер не поддерживает голосовой ввод. Используй текстовый ввод.</span>
      </div>
    );
  }

  const getButtonStyle = () => {
    switch (state) {
      case 'recording':
        return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'processing':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'error':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-brand-600 hover:bg-brand-700';
    }
  };

  const getButtonLabel = () => {
    switch (state) {
      case 'recording':
        return '🎙️ Слушаю...';
      case 'processing':
        return '⏳ Жди...';
      case 'error':
        return '❌ Ошибка';
      default:
        return '🎤';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleMicClick}
        disabled={state === 'processing'}
        className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold text-white transition ${getButtonStyle()} disabled:cursor-not-allowed disabled:opacity-50`}
        title={state === 'recording' ? 'Нажми, чтобы остановить' : 'Нажми, чтобы начать запись'}
      >
        {getButtonLabel()}
      </button>
      {errorMessage && (
        <p className="text-sm text-orange-600 rounded-2xl bg-orange-50 px-3 py-2">{errorMessage}</p>
      )}
    </div>
  );
}
