'use client';

import Link from 'next/link';
import { useState, type ChangeEvent } from 'react';
import { analyzeText, formatErrors, formatRecommendations } from '@/lib/text-analyzer';

function preprocessImage(file: File, binarize: boolean): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(1, 1500 / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }

      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < min) min = d[i];
        if (d[i] > max) max = d[i];
      }
      const range = max - min || 1;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.round(((d[i] - min) / range) * 255);
        d[i] = d[i + 1] = d[i + 2] = v;
      }

      if (binarize) {
        const hist = new Array(256).fill(0);
        const total = w * h;
        for (let i = 0; i < d.length; i += 4) hist[d[i]]++;

        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (wB === 0) continue;
          const wF = total - wB;
          if (wF === 0) break;
          sumB += t * hist[t];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const between = wB * wF * (mB - mF) * (mB - mF);
          if (between > maxVar) { maxVar = between; threshold = t; }
        }

        for (let i = 0; i < d.length; i += 4) {
          const v = d[i] > threshold ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = v;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    };
    img.src = URL.createObjectURL(file);
  });
}

function postprocessOCR(raw: string): string {
  let text = raw
    .replace(/[|\\/{}\[\]@#$%^&*<>~`_=+"'()]/g, '')
    .replace(/[ \t]{2,}/g, ' ');

  const lines = text.split(/\n/);
  const cleanLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length <= 2) return false;
    const nonSpace = trimmed.replace(/\s/g, '');
    if (nonSpace.length === 0) return false;
    const russianChars = (trimmed.match(/[а-яА-ЯёЁ]/g) || []).length;
    return russianChars / nonSpace.length >= 0.5;
  });

  return cleanLines
    .map(l => l.trim())
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function assessQuality(text: string): { ok: boolean; score: number } {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return { ok: false, score: 0 };

  const russianWord = /^[а-яА-ЯёЁ]{2,}$/;
  const validWords = words.filter(w => russianWord.test(w));
  const ratio = validWords.length / words.length;

  if (validWords.length < 5) return { ok: false, score: ratio };

  const avgLen = validWords.reduce((s, w) => s + w.length, 0) / validWords.length;
  if (avgLen < 3) return { ok: false, score: ratio };

  const singleChars = words.filter(w => w.length === 1).length;
  if (singleChars / words.length > 0.3) return { ok: false, score: ratio };

  return { ok: ratio >= 0.6, score: ratio };
}

export default function PhotoCheckPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState('Загрузи фото сочинения, и я распознаю текст и проверю ошибки.');
  const [errors, setErrors] = useState('После загрузки фото здесь появятся найденные ошибки.');
  const [recommendations, setRecommendations] = useState('После загрузки фото здесь появятся рекомендации.');
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState('');

  const handleManualCheck = () => {
    const text = manualText.trim();
    if (text.length < 10) return;

    const result = analyzeText(text);
    const errorsText = formatErrors(result);
    const recsText = formatRecommendations(result);

    setRecognizedText(text);
    setErrors(errorsText);
    setRecommendations(recsText);
    localStorage.setItem('photoCheckResult', JSON.stringify({
      text, errors: errorsText, recs: recsText,
    }));
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setRecognizedText('Распознаю текст с фото… Подожди немного.');
    setErrors('');
    setRecommendations('');

    try {
      const [binarized, grayscaled] = await Promise.all([
        preprocessImage(file, true),
        preprocessImage(file, false),
      ]);

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('rus');
      const { data: { text: text1 } } = await worker.recognize(binarized);
      const { data: { text: text2 } } = await worker.recognize(grayscaled);
      await worker.terminate();

      const cleaned1 = postprocessOCR(text1);
      const cleaned2 = postprocessOCR(text2);
      const q1 = assessQuality(cleaned1);
      const q2 = assessQuality(cleaned2);

      const cleaned = q1.score >= q2.score ? cleaned1 : cleaned2;
      const quality = q1.score >= q2.score ? q1 : q2;

      if (!cleaned || !quality.ok) {
        setRecognizedText(
          'Текст распознан слишком неточно. Попробуй сделать более ровное, чёткое и крупное фото при хорошем освещении.'
        );
        setErrors('');
        setRecommendations(
          'Попробуй:\n1. Сделать фото при ярком равномерном свете.\n2. Положить тетрадь ровно, без наклона.\n3. Убедиться, что текст написан чётко и крупно.\n4. Или вставь текст вручную на странице урока.'
        );
        localStorage.setItem('photoCheckResult', JSON.stringify({ failed: true }));
        return;
      }

      const result = analyzeText(cleaned);
      const errorsText = formatErrors(result);
      const recsText = formatRecommendations(result);

      setRecognizedText(cleaned);
      setErrors(errorsText);
      setRecommendations(recsText);
      localStorage.setItem('photoCheckResult', JSON.stringify({
        text: cleaned, errors: errorsText, recs: recsText,
      }));
    } catch {
      setRecognizedText('Ошибка при распознавании. Попробуй другое фото.');
      setErrors('');
      setRecommendations('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Проверить сочинение по фото</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Загрузи фото сочинения, и репетитор распознает текст, найдёт ошибки и даст рекомендации.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Загрузить фото</h2>
            <label className={`mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={loading} />
              {loading ? 'Распознаю текст…' : 'Выбери фото сочинения'}
            </label>
            {preview ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={preview} alt="Фото сочинения" className="h-56 w-full object-contain" />
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Или вставь текст вручную</h2>
            <textarea
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 leading-7 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
              rows={5}
              placeholder="Вставь или напиши текст сочинения сюда…"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={manualText.trim().length < 10}
              className="mt-3 inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Проверить текст
            </button>
          </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Распознанный текст</h2>
              <p className="mt-3 text-slate-700 leading-7 whitespace-pre-line">{recognizedText}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Найденные ошибки</h2>
              <p className="mt-3 text-slate-700 leading-7 whitespace-pre-line">{errors}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Рекомендации</h2>
              <p className="mt-3 text-slate-700 leading-7 whitespace-pre-line">{recommendations}</p>
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
