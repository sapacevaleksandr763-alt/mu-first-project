import Link from 'next/link';

const modeLabels: Record<string, string> = {
  'explain-topic': 'объяснение темы',
  exercise: 'упражнение',
  'write-essay': 'сочинение',
  'vocab-dictation': 'словесный диктант',
  'theory-test': 'тест по теории',
  'photo-check': 'проверка по фото',
};

const modeAdvice: Record<string, string> = {
  'explain-topic': 'Поработай ещё с примерами и расскажи тему своими словами.',
  exercise: 'Повторим упражнение ещё раз, чтобы слова запомнились лучше.',
  'write-essay': 'Напиши несколько предложений, а я помогу сделать текст ещё лучше.',
  'vocab-dictation': 'Потренируй ещё одно слово, чтобы правописание запомнилось надолго.',
  'theory-test': 'Почитай правило ещё раз и попробуй ответить на другой вопрос.',
  'photo-check': 'Когда будет OCR, мы быстро найдём и исправим ошибки по фото.',
};

export default function ResultsPage(props: any) {
  const searchParams = props.searchParams ?? {};
  const mode = searchParams.mode ?? 'урока';
  const modeName = modeLabels[mode] ?? 'урока';
  const correct = Number(searchParams.correct ?? 0);
  const total = Number(searchParams.total ?? 0);
  const success = total > 0 && correct >= total;

  const scoreText = total > 0
    ? `Ты правильно ответил ${correct} из ${total} вопросов.`
    : 'Ты отлично начал урок. Давай продолжим учиться вместе!';

  const goodText = success
    ? 'У тебя всё получилось здорово. Ты молодец!' 
    : 'Ты уже хорошо постарался. Главное — учиться и не бояться пробовать ещё раз.';

  const advice = modeAdvice[mode] ?? 'Продолжи изучать правила и повторять упражнения, и всё обязательно получится.';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Вернуться к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Результаты урока</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {total > 0 ? `Твой урок по ${modeName} завершён.` : 'Здесь появятся результаты после первого ответа.'}
        </p>

        <div className="mt-8 space-y-6 rounded-[32px] bg-brand-50 p-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Что получилось хорошо</h2>
            <p className="mt-3 text-slate-700 leading-7">{goodText}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Результат</h2>
            <p className="mt-3 text-slate-700 leading-7">{scoreText}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Что стоит повторить</h2>
            <p className="mt-3 text-slate-700 leading-7">{advice}</p>
          </div>
          <Link href="/modes" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
            Продолжить обучение
          </Link>
        </div>
      </div>
    </main>
  );
}
