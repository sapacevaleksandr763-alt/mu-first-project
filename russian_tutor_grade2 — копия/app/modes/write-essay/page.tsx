'use client';

import Link from 'next/link';
import { LessonShell } from '@/components/LessonShell';

export default function WriteEssayPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Помочь с сочинением</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Поможем выбрать простую тему, составить план и написать начало, середину и конец. Всё в лёгком и тёплом стиле для второго класса.
        </p>

        <LessonShell
          intro="Привет! Давай сочинение вместе. Напиши тему, например: 'Моё любимое животное' или 'Мой лучший день'."
          placeholder="Напиши тему сочинения"
          botReply="Отличная тема! Теперь расскажи в следующем сообщении, что ты чувствуешь по этой теме."
          hint="Я помогу сделать план и напишем начало, середину и конец."
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/lesson/write-essay" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
            Перейти к уроку
          </Link>
          <Link href="/modes" className="text-sm text-slate-500 hover:text-slate-700">Выбрать другой режим</Link>
        </div>
      </div>
    </main>
  );
}
