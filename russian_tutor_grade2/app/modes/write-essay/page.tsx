'use client';

import Link from 'next/link';
import { LessonShell } from '@/components/LessonShell';

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

const topicPatterns: { pattern: RegExp; key: string }[] = [
  { pattern: /осен/, key: 'осень' },
  { pattern: /мам/, key: 'мама' },
  { pattern: /школ/, key: 'школа' },
  { pattern: /день|дне|дня/, key: 'день' },
  { pattern: /животн/, key: 'животное' },
  { pattern: /лето|летн|летом/, key: 'лето' },
  { pattern: /зим/, key: 'зима' },
];

function findEssayTopic(text: string) {
  for (const { pattern, key } of topicPatterns) {
    if (pattern.test(text)) return key;
  }
  return null;
}

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+/g) ?? [])
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

function parseSentenceCount(text: string): number | null {
  const wordNums: Record<string, number> = { два: 2, две: 2, три: 3, четыре: 4 };
  const digitMatch = text.match(/(\d)\s*(?:предложени|фраз)/);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  const wordMatch = text.match(/(два|две|три|четыре)\s*(?:предложени|фраз)/);
  if (wordMatch) return wordNums[wordMatch[1]];
  return null;
}

function extractFreeTopic(text: string): string | null {
  const m = text.match(/(?:про|на тему|о)\s+(.+?)$/);
  if (m) return m[1].replace(/[.?!,;:]+$/, '').trim() || null;
  return null;
}

function generateGenericEssay(name: string) {
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
}

function handleEssayQuestion(message: string) {
  const lower = message.toLowerCase();
  const topicKey = findEssayTopic(lower);

  const wantsPlan = /план/.test(lower);
  const wantsStart = /начало|начни|начать/.test(lower);
  const wantsFull = /полное|целое|целиком|всё сочинение|напиши сочинение|написать сочинение|помоги написать|составь сочинение/.test(lower);
  const sentenceCount = parseSentenceCount(lower);

  if (topicKey) {
    const topic = essayTopics[topicKey];
    if (wantsPlan) return { response: topic.plan };
    if (wantsStart) return { response: `Вот начало сочинения:\n\n${topic.start}` };
    if (sentenceCount) {
      const sentences = splitSentences(topic.full).slice(0, sentenceCount).join(' ');
      return { response: sentences };
    }
    if (wantsFull) return { response: `Вот короткое сочинение для 2 класса:\n\n${topic.full}` };
    return { response: `Хорошая тема! Вот план:\n\n${topic.plan}\n\nНапиши «начало», «полное сочинение» или «3 предложения», и я помогу дальше.` };
  }

  const freeTopic = extractFreeTopic(lower);
  if (freeTopic) {
    const gen = generateGenericEssay(freeTopic);
    if (wantsPlan) return { response: gen.plan };
    if (wantsStart) return { response: `Вот начало сочинения:\n\n${gen.start}` };
    if (sentenceCount) return { response: gen.sentences.slice(0, sentenceCount).join(' ') };
    if (wantsFull) return { response: `Вот короткое сочинение для 2 класса:\n\n${gen.full}` };
    return { response: `Хорошая тема! Вот план:\n\n${gen.plan}\n\nНапиши «начало», «полное сочинение» или «3 предложения», и я помогу дальше.` };
  }

  if (wantsPlan || wantsStart || wantsFull || sentenceCount) {
    return { response: 'Напиши тему, и я помогу! Например: «план сочинения про осень» или «напиши сочинение про маму».' };
  }

  return { response: 'Я могу помочь с сочинением на любую тему! Напиши, например: «план про осень», «3 предложения про маму» или «напиши сочинение про школу».' };
}

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
          intro="Привет! Давай напишем сочинение вместе. Напиши тему, например: «про осень», «про маму» или «мой день». Я составлю план или напишу текст."
          placeholder="Напиши тему сочинения"
          botReply=""
          hint="Я помогу сделать план и напишем начало, середину и конец."
          onSend={handleEssayQuestion}
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
