'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LessonShell } from '@/components/LessonShell';
import { analyzeText, formatErrors, formatRecommendations } from '@/lib/text-analyzer';
import { checkVocabAnswer } from '@/lib/vocab-checker';
import { checkTheoryAnswer, THEORY_LESSON, type TheoryState } from '@/lib/theory-checker';

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
};

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

export default function LessonModeClient({ mode, config }: LessonModeClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [step, setStep] = useState(0);
  const [theoryState, setTheoryState] = useState<TheoryState>({ step: 0, awaitingRetry: null });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleLessonSend = (message: string) => {
    const lower = message.toLowerCase();
    let response = config.botReply;
    let correct: boolean | undefined;
    let note: string | undefined;
    let sections: { title: string; content: string }[] | undefined;

    if (mode === 'vocab-dictation') {
      const result = checkVocabAnswer(message, step);
      if (result.status === 'correct') {
        correct = true;
        setStep(result.nextWordIndex);
      } else {
        correct = false;
      }
      setStats((current) => ({
        correct: current.correct + (correct ? 1 : 0),
        total: current.total + 1,
      }));
      setHasInteracted(true);
      return { response: result.response, correct, note: result.note, sections };
    }

    if (mode === 'theory-test') {
      const result = checkTheoryAnswer(message, theoryState, THEORY_LESSON);
      setTheoryState(result.nextState);
      if (result.status === 'correct') {
        correct = true;
        if (result.nextState.step >= THEORY_LESSON.length && !result.nextState.awaitingRetry) {
          setFinished(true);
        }
      } else if (result.status === 'finished') {
        setFinished(true);
        setHasInteracted(true);
        return { response: result.response, correct: undefined, note: undefined, sections };
      } else {
        correct = false;
      }
      setStats((current) => ({
        correct: current.correct + (correct ? 1 : 0),
        total: current.total + 1,
      }));
      setHasInteracted(true);
      return { response: result.response, correct, note: result.note, sections };
    }

    const tasks = modeTasks[mode];

    if (tasks) {
      const task = tasks[step];
      if (task) {
        const matched = task.keywords.some((keyword) => lower.includes(keyword));
        if (!matched) {
          response = task.failure;
          note = task.note;
        }

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
        }
      } else {
        response = 'Ты уже ответил на все вопросы этого режима. Нажми кнопку «Завершить урок», чтобы посмотреть результаты.';
      }
    } else {
      if (mode === 'explain-topic') {
        const cleaned = lower.replace(/[?!.,;:]/g, '').trim();
        const topicEntries = [
          { keyword: 'существительное', reply: 'Имя существительное — это слово, которое называет предмет, человека, животное или место. Например, «мама», «кот», «школа». Отвечает на вопросы «кто?» или «что?».' },
          { keyword: 'прилагательное', reply: 'Имя прилагательное — это слово, которое описывает предмет и отвечает на вопросы «какой?», «какая?», «какое?», «какие?». Например, «красивый», «большая», «вкусное».' },
          { keyword: 'глагол', reply: 'Глагол — это слово, которое обозначает действие и отвечает на вопросы «что делать?», «что сделать?». Например, «бежать», «читать», «играть».' },
        ];
        let found = false;
        for (const entry of topicEntries) {
          if (cleaned.includes(entry.keyword)) {
            response = entry.reply;
            found = true;
            break;
          }
        }

        if (!found) {
          const words = cleaned.split(/\s+/);
          for (const entry of topicEntries) {
            for (const word of words) {
              const maxDist = entry.keyword.length <= 6 ? 1 : 2;
              if (levenshtein(word, entry.keyword) <= maxDist) {
                response = entry.reply;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
        if (!found) {
          response = 'Я знаю три темы: имя существительное, прилагательное и глагол. Напиши одну из них, и я объясню!';
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
        const essayTopics: Record<string, { plan: string; start: string; full: string }> = {
          осень: {
            plan: 'План сочинения «Осень»:\n1. Какая бывает осень.\n2. Что происходит в природе.\n3. Что я люблю делать осенью.\n4. Почему осень — особенное время года.',
            start: 'Наступила осень. Листья на деревьях стали жёлтыми и красными. Воздух стал прохладным, а дни — короче.',
            full: 'Наступила осень. Листья на деревьях стали жёлтыми и красными. Часто идёт дождь, и на улице прохладно. Птицы улетают на юг. Я люблю гулять по парку и собирать красивые листья. Осень — красивое время года!',
          },
          мама: {
            plan: 'План сочинения «Моя мама»:\n1. Как зовут маму.\n2. Какая она.\n3. Что мы любим делать вместе.\n4. Почему я люблю маму.',
            start: 'Мою маму зовут ... . Она самая добрая и красивая. У неё тёплые руки и ласковый голос.',
            full: 'Мою маму зовут ... . Она самая добрая и красивая. Мама вкусно готовит и помогает мне с уроками. Мы любим вместе гулять в парке и читать книжки. Я очень люблю свою маму!',
          },
          школа: {
            plan: 'План сочинения «Моя школа»:\n1. Как выглядит школа.\n2. Мой класс и учитель.\n3. Что мне нравится в школе.\n4. Почему школа — важное место.',
            start: 'Моя школа большая и красивая. В ней много классов и длинные коридоры. Мой класс на втором этаже.',
            full: 'Моя школа большая и красивая. Мой класс на втором этаже. Наша учительница добрая, она объясняет понятно. Мне нравится читать и рисовать на уроках. В школе у меня много друзей. Я люблю ходить в школу!',
          },
          день: {
            plan: 'План сочинения «Мой день»:\n1. Как начинается мой день.\n2. Что я делаю днём.\n3. Чем занимаюсь вечером.\n4. Что мне нравится больше всего.',
            start: 'Мой день начинается рано утром. Я просыпаюсь, умываюсь и завтракаю. Потом иду в школу.',
            full: 'Мой день начинается рано утром. Я просыпаюсь, умываюсь и завтракаю. Потом иду в школу. После уроков я обедаю и делаю домашнее задание. Вечером я гуляю и играю. Перед сном мама читает мне книжку. Мне нравится каждый мой день!',
          },
          животное: {
            plan: 'План сочинения «Моё любимое животное»:\n1. Какое у меня животное.\n2. Как оно выглядит.\n3. Что оно любит делать.\n4. Почему я его люблю.',
            start: 'У меня есть любимое животное — ... . Оно очень красивое и доброе.',
            full: 'У меня есть кот. Его зовут Мурзик. Он серый и пушистый. Мурзик любит играть с мячиком и спать на диване. Я кормлю его и глажу. Мурзик — мой лучший друг!',
          },
          лето: {
            plan: 'План сочинения «Лето»:\n1. Какое бывает лето.\n2. Что я делаю летом.\n3. Что мне нравится больше всего.\n4. Почему лето — моё любимое время года.',
            start: 'Лето — самое тёплое время года. Светит яркое солнце, и дни длинные. Можно гулять, купаться и есть мороженое.',
            full: 'Лето — самое тёплое время года. Светит яркое солнце, и можно гулять допоздна. Я люблю купаться в речке и играть с друзьями. Летом мы ездим к бабушке в деревню. Там я помогаю в саду и собираю ягоды. Лето — моё любимое время года!',
          },
          зима: {
            plan: 'План сочинения «Зима»:\n1. Какая бывает зима.\n2. Что происходит зимой в природе.\n3. Что я люблю делать зимой.\n4. Почему зима — особенное время года.',
            start: 'Наступила зима. На улице стало холодно, а деревья покрылись снегом.',
            full: 'Наступила зима. На улице стало холодно, а деревья покрылись снегом. Часто идёт снег, и всё вокруг белое. Я люблю кататься на санках и лепить снеговика. Зимой мы празднуем Новый год. Зима — волшебное время года!',
          },
        };

        const essayPatterns: { pattern: RegExp; key: string }[] = [
          { pattern: /осен/, key: 'осень' },
          { pattern: /мам/, key: 'мама' },
          { pattern: /школ/, key: 'школа' },
          { pattern: /день|дне|дня/, key: 'день' },
          { pattern: /животн/, key: 'животное' },
          { pattern: /лето|летн|летом/, key: 'лето' },
          { pattern: /зим/, key: 'зима' },
        ];
        let topicKey: string | null = null;
        for (const { pattern, key } of essayPatterns) {
          if (pattern.test(lower)) { topicKey = key; break; }
        }

        const splitSent = (text: string) =>
          (text.match(/[^.!?]+[.!?]+/g) ?? []).map(s => s.trim()).filter(s => s.length > 3);

        const wordNums: Record<string, number> = { два: 2, две: 2, три: 3, четыре: 4 };
        let sentenceCount: number | null = null;
        const dMatch = lower.match(/(\d)\s*(?:предложени|фраз)/);
        if (dMatch) { sentenceCount = parseInt(dMatch[1], 10); }
        else {
          const wMatch = lower.match(/(два|две|три|четыре)\s*(?:предложени|фраз)/);
          if (wMatch) sentenceCount = wordNums[wMatch[1]];
        }

        const wantsPlan = /план/.test(lower);
        const wantsStart = /начало|начни|начать/.test(lower);
        const wantsFull = /полное|целое|целиком|всё сочинение|напиши сочинение|написать сочинение|помоги написать|составь сочинение/.test(lower);

        const extractFree = (text: string) => {
          const m = text.match(/(?:про|на тему|о)\s+(.+?)$/);
          if (m) return m[1].replace(/[.?!,;:]+$/, '').trim() || null;
          return null;
        };
        const genEssay = (name: string) => {
          const cap = name.charAt(0).toUpperCase() + name.slice(1);
          const title = `«${cap}»`;
          return {
            plan: `План сочинения ${title}:\n1. Что я знаю об этом.\n2. Почему это интересно.\n3. Что мне нравится.\n4. Что я хочу рассказать.`,
            start: `Я хочу рассказать об одной теме — ${title}. Об этом мне нравится думать.`,
            sentences: [
              `Тема ${title} — очень интересная.`,
              `Об этом я могу рассказать много.`,
              `Мне нравится думать об этом.`,
              `Я хочу узнать об этом ещё больше.`,
            ],
            full: `Тема ${title} — очень интересная. Об этом я могу рассказать много. Мне нравится думать об этом. Каждый день я узнаю что-то новое. Я хочу рассказать об этом своим друзьям!`,
          };
        };

        if (topicKey) {
          const topic = essayTopics[topicKey];
          if (wantsPlan) { response = topic.plan; }
          else if (wantsStart) { response = `Вот начало сочинения:\n\n${topic.start}`; }
          else if (sentenceCount) {
            response = splitSent(topic.full).slice(0, sentenceCount).join(' ');
          }
          else if (wantsFull) { response = `Вот короткое сочинение для 2 класса:\n\n${topic.full}`; }
          else { response = `Хорошая тема! Вот план:\n\n${topic.plan}\n\nНапиши «начало», «полное сочинение» или «3 предложения», и я помогу дальше.`; }
        } else {
          const freeTopic = extractFree(lower);
          if (freeTopic) {
            const gen = genEssay(freeTopic);
            if (wantsPlan) { response = gen.plan; }
            else if (wantsStart) { response = `Вот начало сочинения:\n\n${gen.start}`; }
            else if (sentenceCount) { response = gen.sentences.slice(0, sentenceCount).join(' '); }
            else if (wantsFull) { response = `Вот короткое сочинение для 2 класса:\n\n${gen.full}`; }
            else { response = `Хорошая тема! Вот план:\n\n${gen.plan}\n\nНапиши «начало», «полное сочинение» или «3 предложения», и я помогу дальше.`; }
          } else if (wantsPlan || wantsStart || wantsFull || sentenceCount) {
            response = 'Напиши тему, и я помогу! Например: «план сочинения про осень» или «напиши сочинение про маму».';
          } else {
            response = 'Я могу помочь с сочинением на любую тему! Напиши, например: «план про осень», «3 предложения про маму» или «напиши сочинение про школу».';
          }
        }
      }


      if (mode === 'photo-check') {
        const isPhotoCommand = message.trim().length < 50 &&
          /фото|загруж|провер.*сочинени|ошиб.*сочинени|что не так|исправ/.test(lower);

        let saved: { text?: string; errors?: string; recs?: string; failed?: boolean } | null = null;
        try {
          const raw = localStorage.getItem('photoCheckResult');
          if (raw) saved = JSON.parse(raw);
        } catch {}

        if (isPhotoCommand) {
          if (saved?.failed) {
            response = 'Последнее фото не удалось распознать — текст получился нечитаемым. Попробуй загрузить более чёткое фото на странице режима «Проверить по фото», или вставь текст сочинения прямо сюда.';
          } else if (saved?.text) {
            response = 'Результат проверки сочинения по фото';
            sections = [
              { title: 'Распознанный текст', content: saved.text },
              { title: 'Найденные ошибки', content: saved.errors || 'Ошибок не найдено' },
              { title: 'Рекомендации', content: saved.recs || 'Отличная работа!' },
            ];
          } else {
            response = 'Сначала загрузи фото сочинения на странице режима «Проверить по фото», а потом возвращайся — я покажу результат проверки.';
          }
        } else if (message.trim().length >= 10) {
          const result = analyzeText(message.trim());
          const errText = formatErrors(result);
          const recText = formatRecommendations(result);
          response = 'Результат проверки сочинения';
          sections = [
            { title: 'Найденные ошибки', content: errText },
            { title: 'Рекомендации', content: recText },
          ];
        } else {
          response = 'Напиши текст сочинения (минимум 10 символов), и я проверю. Или напиши «проверь по фото», если ты загрузил фото.';
        }
      }
    }

    if (correct !== undefined) {
      setStats((current) => ({
        correct: current.correct + (correct ? 1 : 0),
        total: current.total + 1,
      }));
    }

    setHasInteracted(true);
    return { response, correct, note, sections };
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

        {!finished ? (
          <LessonShell
            intro={config.intro}
            placeholder={config.placeholder}
            botReply={config.botReply}
            hint={config.hint}
            sendLabel="Отправить"
            onSend={handleLessonSend}
          />
        ) : (
          <div className="mt-8 rounded-[32px] border border-slate-200 bg-brand-50 p-6 text-center">
            <p className="text-lg font-semibold text-slate-800">Все вопросы пройдены!</p>
            <p className="mt-2 text-sm text-slate-600">Нажми «Завершить урок», чтобы посмотреть результаты.</p>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-brand-50 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Статистика урока</p>
              <p className="mt-2 text-slate-700">Правильных ответов: {stats.correct} из {stats.total}</p>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              disabled={!hasInteracted}
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
