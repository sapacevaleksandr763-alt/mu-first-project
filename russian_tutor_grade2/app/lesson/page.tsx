'use client';

import Link from 'next/link';
import { LessonShell } from '@/components/LessonShell';

export default function LessonPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Страница урока</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Здесь начинается урок. Пиши, что хочешь узнать, и я объясню просто, приведу пример и предложу небольшое задание.
        </p>

        <LessonShell
          intro="Привет! Я твой добрый репетитор по русскому языку. Напиши, с чем хочешь помочь: объяснить тему, сделать упражнение или написать сочинение."
          placeholder="Напиши свой вопрос или тему урока"
          botReply="Отлично! Я объясню это просто и понятно для второго класса. Сначала расскажу, потом покажу пример, а потом предложу задание."
          hint="Можешь написать 'Объясни имя существительное' или 'Помоги сделать упражнение'."
          sendLabel="Начать"
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/results"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
          >
            Посмотреть результаты
          </Link>
          <p className="text-sm text-slate-500">После урока можно перейти на страницу результатов и получить похвалу.</p>
        </div>
      </div>
    </main>
  );
}
