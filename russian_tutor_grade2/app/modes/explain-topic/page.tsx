'use client';

import Link from 'next/link';
import { LessonShell } from '@/components/LessonShell';

export default function ExplainTopicPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Объяснить тему</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Здесь ИИ-репетитор рассказывает простыми словами про тему русского языка. Напиши, какую тему хочешь изучить, и мы начнём.
        </p>

        <LessonShell
          intro="Привет! Я помогу тебе понять тему русского языка простыми словами. Напиши, что хочешь узнать: имя существительное, глагол или прилагательное."
          placeholder="Например: имя существительное"
          botReply="Хорошо! Это очень простая тема. Имя существительное — это слово, которое называет предмет, человека, животное или место. Например, 'мама', 'кот', 'школа'."
          hint="Если хочешь, попроси ещё пример или задай другой вопрос."
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/lesson/explain-topic" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
            Перейти к уроку
          </Link>
          <Link href="/modes" className="text-sm text-slate-500 hover:text-slate-700">Выбрать другой режим</Link>
        </div>
      </div>
    </main>
  );
}
