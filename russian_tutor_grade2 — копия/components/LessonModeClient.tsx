'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LessonShell } from '@/components/LessonShell';

interface LessonModeClientProps {
  mode: string;
  config: {
    title: string;
    intro: string;
    placeholder: string;
    botReply: string;
    hint: string;
  };
}

type Task = {
  question: string;
  keywords: string[];
  success: string;
  failure: string;
  note?: string;
};

const modeTasks: Record<string, Task[]> = {
  'explain-topic': [
    {
      question: 'Напиши, что ты хочешь узнать: глагол, прилагательное или имя существительное.',
      keywords: ['глагол', 'прилагатель', 'существительное', 'существ'],
      success: 'Хорошо! Теперь расскажу подробнее. Отвечай на следующий вопрос: какое слово показывает действие — «бежать», «кошка» или «синий»?',
      failure: 'Попробуй написать одно из слов: глагол, прилагательное или существительное.',
      note: 'Напиши слово «глагол», если хочешь узнать про действие, «прилагательное» — про описание, «существительное» — про предмет или человека.',
    },
    {
      question: 'Какое слово показывает действие: «бежать», «кошка» или «синий»?',
      keywords: ['бежать'],
      success: 'Верно! «Бежать» — это глагол. Это слово показывает действие.',
      failure: 'Нужно выбрать слово, которое показывает действие. Подумай, что делает предмет.',
      note: 'Глагол отвечает на вопросы «что делать?» или «что сделал?».',
    },
  ],
  exercise: [
    {
      question: 'Найди имя существительное: «Пёструю птицу видно в саду». Напиши слово.',
      keywords: ['птица', 'птицу'],
      success: 'Отлично! Ты нашёл имя существительное. Это правильный ответ.',
      failure: 'Пока не совсем. Подумай, какое слово в предложении называет живое существо.',
      note: 'Имя существительное отвечает на вопрос «кто?» или «что?».',
    },
    {
      question: 'Теперь выбери имя существительное: «бежать», «улица» или «скоро».',
      keywords: ['улица'],
      success: 'Молодец! «Улица» — это имя существительное, потому что это место.',
      failure: 'Постарайся выбрать слово, которое называет предмет, место или человека.',
      note: 'Имя существительное — это слово, которое можно увидеть или назвать.',
    },
  ],
  'write-essay': [
    {
      question: 'Напиши тему для сочинения, например «Моё любимое животное».',
      keywords: ['животн', 'лето', 'день', 'семья', 'школа'],
      success: 'Хорошая тема! Теперь напиши одно предложение о ней.',
      failure: 'Попробуй назвать тему одним простым предложением.',
      note: 'Тема может быть про любимое животное, время года или игру.',
    },
    {
      question: 'Напиши одно предложение о своей теме.',
      keywords: ['я', 'мне', 'люблю', 'есть', 'играю'],
      success: 'Отлично! Теперь у тебя есть начало для сочинения.',
      failure: 'Попробуй написать короткое предложение про свою тему.',
      note: 'Например: «Я люблю лето, потому что оно тёплое и солнечное.»',
    },
  ],
  'vocab-dictation': [
    {
      question: 'Пиши слово «малыш».',
      keywords: ['малыш'],
      success: 'Правильно! Слово «малыш» написано верно.',
      failure: 'Почти получилось. Проверь, не нужно ли писать «ы» вместо «и».',
      note: 'Запомни: «малыш» пишется через букву «ы».',
    },
    {
      question: 'Теперь напиши слово «лес».',
      keywords: ['лес'],
      success: 'Отлично! Слово «лес» написано верно.',
      failure: 'Попробуй ещё раз: слово «лес» пишется коротко и без мягкого знака.',
      note: 'Запомни: «лес» состоит из трёх букв.',
    },
  ],
  'theory-test': [
    {
      question: 'Как называется слово «мама»? Напиши свой ответ.',
      keywords: ['имя существительное', 'существительное'],
      success: 'Верно! «Мама» — это имя существительное.',
      failure: 'Подумай о том, что слово «мама» называет: человека или действие?',
      note: 'Имя существительное отвечает на вопросы «кто?» или «что?».',
    },
    {
      question: 'Какой из этих слов — глагол: «играть», «мама», «синий»?',
      keywords: ['играть'],
      success: 'Хорошо! «Играть» — это глагол, потому что оно обозначает действие.',
      failure: 'Подумаем: какое слово обозначает действие?',
      note: 'Глагол показывает, что делает кто-то или что-то.',
    },
  ],
  'photo-check': [
    {
      question: 'Напиши, что ты хочешь проверить в своём сочинении по фото.',
      keywords: ['провер', 'ошиб', 'орфог', 'пункт'],
      success: 'Спасибо! В будущем я смогу проверить фото и найти ошибки.',
      failure: 'Расскажи, что именно ты хочешь проверить: правописание, заглавные буквы или пунктуацию.',
      note: 'Пока мы работаем с текстом, но скоро появится OCR.',
    },
  ],
};

export default function LessonModeClient({ mode, config }: LessonModeClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [step, setStep] = useState(0);

  const handleLessonSend = (message: string) => {
    const lower = message.toLowerCase();
    let response = config.botReply;
    let correct: boolean | undefined;
    let note: string | undefined;
    const tasks = modeTasks[mode];

    if (tasks) {
      const task = tasks[step];
      if (task) {
        const matched = task.keywords.some((keyword) => lower.includes(keyword));
        if (matched) {
          correct = true;
          response = task.success;
          if (step + 1 < tasks.length) {
            response += ` ${tasks[step + 1].question}`;
            setStep(step + 1);
          } else {
            response += ' Отлично! Ты прошёл все вопросы этого режима.';
            setStep(step + 1);
          }
        } else {
          response = task.failure;
          note = task.note;
        }
      } else {
        response = 'Ты уже ответил на все вопросы этого режима. Нажми кнопку «Завершить урок», чтобы посмотреть результаты.';
      }
    } else {
      if (mode === 'explain-topic') {
        if (lower.includes('глагол')) {
          response = 'Глагол — это слово, которое показывает действие. Например, «бежать», «рисовать», «читать».';
        } else if (lower.includes('прилагатель')) {
          response = 'Прилагательное говорит, какой предмет, человек или животное. Например, «красный», «большой», «весёлый».';
        } else if (lower.includes('существ')) {
          response = 'Имя существительное называет предмет, животное или человека. Например, «мама», «мяч», «лес».';
        } else {
          response = 'Это простая тема. Напиши слово, и я помогу понять, к какому виду слов оно относится.';
        }
      }

      if (mode === 'exercise') {
        correct = lower.includes('птица') || lower.includes('птицу');
        if (correct) {
          response = 'Отлично! Ты нашёл имя существительное. Это правильный ответ.';
        } else {
          response = 'Хорошо. Попробуй найти слово, которое называет предмет или живое существо в предложении.';
          note = 'Подсказка: имя существительное — это слово, которое можно поставить в ответ на вопрос «кто?» или «что?». Например, «птица».';
        }
      }

      if (mode === 'write-essay') {
        if (message.length > 10) {
          correct = true;
          response = 'Отлично! Эта тема хорошая. Теперь напиши несколько предложений о ней, и я помогу сделать текст ещё лучше.';
        } else {
          response = 'Хорошая тема, но попробуй написать чуть больше слов, чтобы я мог помочь с планом.';
        }
      }

      if (mode === 'vocab-dictation') {
        correct = lower.includes('малыш');
        if (correct) {
          response = 'Правильно! Слово «малыш» написано верно. Молодец!';
        } else {
          response = 'Почти получилось. Слово нужно писать без буквы «и».';
          note = 'Запомни: «малыш» пишется через букву «ы».';
        }
      }

      if (mode === 'theory-test') {
        correct = lower.includes('имя существительное') || lower.includes('существительное');
        if (correct) {
          response = 'Верно! «Мама» — это имя существительное, потому что оно называет человека.';
        } else {
          response = 'Это не совсем верно. Подумай о том, какое слово называет человека или предмет.';
          note = 'Подсказка: имя существительное отвечает на вопросы «кто?» или «что?». Например, «мама», «солнце», «школа».';
        }
      }

      if (mode === 'photo-check') {
        response = 'Спасибо! Это хороший шаг. Когда появится OCR, мы сможем показать точные ошибки по фото и дать советы.';
      }
    }

    if (correct !== undefined) {
      setStats((current) => ({
        correct: current.correct + (correct ? 1 : 0),
        total: current.total + 1,
      }));
    }

    return { response, correct, note };
  };

  const handleFinish = () => {
    router.push(
      `/results?mode=${encodeURIComponent(mode)}&correct=${stats.correct}&total=${stats.total}`
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <Link href="/modes" className="text-sm font-semibold text-brand-700 hover:underline">← Назад к режимам</Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">{config.title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Это урок специально для режима «{config.title}». Напиши своё сообщение, и мы начнём обучение по этому формату.
        </p>

        <LessonShell
          intro={config.intro}
          placeholder={config.placeholder}
          botReply={config.botReply}
          hint={config.hint}
          sendLabel="Начать"
          onSend={handleLessonSend}
        />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-brand-50 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Статистика урока</p>
              <p className="mt-2 text-slate-700">Правильных ответов: {stats.correct} из {stats.total}</p>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              disabled={stats.total === 0}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Завершить урок
            </button>
          </div>
          {stats.total === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Отправь хоть один ответ, чтобы увидеть результаты.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
