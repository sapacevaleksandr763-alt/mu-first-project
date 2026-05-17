'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LessonShell } from '@/components/LessonShell';
import { checkTheoryAnswer, THEORY_QUESTIONS } from '@/lib/theory-checker';

export default function TheoryTestPage() {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleSend = (message: string) => {
    const result = checkTheoryAnswer(message, step);
    if (result.status === 'correct') {
      setStep(result.nextStep);
    }
    if (result.status === 'finished' || (result.status === 'correct' && result.nextStep >= THEORY_QUESTIONS.length)) {
      setFinished(true);
    }
    return {
      response: result.response,
      correct: result.status === 'correct',
      note: result.note,
    };
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Тест по теории</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Короткий тест с вопросами по правилам русского языка. Напиши свой ответ, а я объясню, почему он правильный или нет.
        </p>

        {!finished && (
          <LessonShell
            intro={`Привет! ${THEORY_QUESTIONS[0].question}`}
            placeholder="Напиши ответ на вопрос"
            botReply=""
            hint="Подумай, на какой вопрос отвечает это слово: «кто?», «что?», «что делать?» или «какой?»."
            onSend={handleSend}
          />
        )}

        {finished && (
          <div className="mt-8 rounded-[32px] border border-slate-200 bg-brand-50 p-6 text-center">
            <p className="text-lg font-semibold text-slate-800">Тест завершён! Ты ответил на все вопросы.</p>
            <p className="mt-2 text-sm text-slate-600">Перейди к уроку, чтобы пройти тест с подсчётом результатов.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/lesson/theory-test" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
            Перейти к уроку
          </Link>
          <Link href="/modes" className="text-sm text-slate-500 hover:text-slate-700">Выбрать другой режим</Link>
        </div>
      </div>
    </main>
  );
}
