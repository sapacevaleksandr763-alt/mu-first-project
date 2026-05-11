'use client';

import Link from 'next/link';
import { LessonShell } from '@/components/LessonShell';

export default function TheoryTestPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Тест по теории</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Короткий тест с вопросами по правилам русского языка. Напиши свой ответ, а я объясню, почему он правильный или нет.
        </p>

        <LessonShell
          intro="Привет! Вот простой вопрос: как называется слово 'мама'? Напиши свой ответ, и я объясню."
          placeholder="Напиши ответ на вопрос"
          botReply="Правильно! 'Мама' — это имя существительное, потому что оно называет человека. Молодец, ты справился!"
          hint="Если хочешь, спроси ещё один вопрос из теста."
        />

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
