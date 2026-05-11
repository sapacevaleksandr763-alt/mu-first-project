'use client';

import Link from 'next/link';
import { useState, type ChangeEvent } from 'react';

export default function PhotoCheckPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState('Здесь появится распознанный текст из фотографии.');
  const [errors, setErrors] = useState('Здесь будут показаны найденные ошибки.');
  const [recommendations, setRecommendations] = useState('Здесь появятся рекомендации для улучшения сочинения.');

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPreview(URL.createObjectURL(file));
    setRecognizedText('Пример распознанного текста: «Моё любимое лето. Я люблю играть на улице и собирать ягоды.»');
    setErrors('Пример ошибки: нужно писать с заглавной буквы только первое слово в предложении.');
    setRecommendations('Пример рекомендации: проверь заглавные буквы и пунктуацию.');
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Проверить сочинение по фото</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Это интерфейс-заглушка для будущей функции OCR. Пока можно загрузить картинку и увидеть, как будет работать проверка.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Загрузить фото</h2>
            <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-slate-500 transition hover:border-brand-300 hover:bg-brand-50">
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              Выбери фото сочинения
            </label>
            {preview ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={preview} alt="Фото сочинения" className="h-56 w-full object-contain" />
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Распознанный текст</h2>
              <p className="mt-3 text-slate-700 leading-7">{recognizedText}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Найденные ошибки</h2>
              <p className="mt-3 text-slate-700 leading-7">{errors}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Рекомендации</h2>
              <p className="mt-3 text-slate-700 leading-7">{recommendations}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/lesson/photo-check" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
            Перейти к уроку
          </Link>
          <Link href="/modes" className="text-sm text-slate-500 hover:text-slate-700">Выбрать другой режим</Link>
        </div>
      </div>
    </main>
  );
}
