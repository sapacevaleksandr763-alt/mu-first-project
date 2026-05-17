'use client';

import Link from 'next/link';
import { LessonShell } from '@/components/LessonShell';

const topics = [
  {
    keyword: 'существительное',
    reply: "Хорошо! Это очень простая тема. Имя существительное — это слово, которое называет предмет, человека, животное или место. Например, 'мама', 'кот', 'школа'.",
  },
  {
    keyword: 'прилагательное',
    reply: "Отлично! Имя прилагательное — это слово, которое описывает предмет и отвечает на вопросы «какой?», «какая?», «какое?», «какие?». Например, 'красивый', 'большая', 'вкусное'.",
  },
  {
    keyword: 'глагол',
    reply: "Супер! Глагол — это слово, которое обозначает действие и отвечает на вопросы «что делать?», «что сделать?». Например, 'бежать', 'читать', 'играть'.",
  },
];

const defaultReply = "Я пока знаю три темы: имя существительное, прилагательное и глагол. Напиши одну из них, и я объясню!";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findTopic(message: string) {
  const cleaned = message.toLowerCase().replace(/[?!.,;:]/g, '').trim();

  for (const topic of topics) {
    if (cleaned.includes(topic.keyword)) {
      return topic;
    }
  }

  const words = cleaned.split(/\s+/);
  for (const topic of topics) {
    for (const word of words) {
      const maxDist = topic.keyword.length <= 6 ? 1 : 2;
      if (levenshtein(word, topic.keyword) <= maxDist) {
        return topic;
      }
    }
  }
  return null;
}

function handleTopicQuestion(message: string) {
  const topic = findTopic(message);
  if (topic) {
    return { response: topic.reply };
  }
  return { response: defaultReply };
}

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
          botReply=""
          hint="Если хочешь, попроси ещё пример или задай другой вопрос."
          onSend={handleTopicQuestion}
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
