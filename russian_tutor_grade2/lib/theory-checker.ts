type PartOfSpeech = 'noun' | 'verb' | 'adjective';

type QuestionType = 'identify' | 'write_word';

type TheoryStep = {
  type: QuestionType;
  topic: PartOfSpeech;
  question: string;
  word?: string;
  acceptAnswers?: string[];
};

const TOPIC_NAMES: Record<PartOfSpeech, string> = {
  noun: 'существительное',
  verb: 'глагол',
  adjective: 'прилагательное',
};

const TOPIC_EXPLANATION: Record<PartOfSpeech, string> = {
  noun: 'Имя существительное называет предмет, человека, животное или явление. Отвечает на вопросы «кто?» или «что?».',
  verb: 'Глагол обозначает действие. Отвечает на вопросы «что делать?» или «что сделать?».',
  adjective: 'Имя прилагательное обозначает признак предмета. Отвечает на вопросы «какой?», «какая?», «какое?».',
};

const KNOWN_NOUNS = new Set([
  'мама', 'папа', 'школа', 'кот', 'кошка', 'собака', 'дом', 'книга',
  'окно', 'дерево', 'солнце', 'река', 'птица', 'цветок', 'ручка',
  'тетрадь', 'стол', 'стул', 'мяч', 'лиса', 'заяц', 'медведь',
  'город', 'улица', 'машина', 'дорога', 'мальчик', 'девочка',
  'учитель', 'ученик', 'друг', 'сестра', 'брат', 'бабушка', 'дедушка',
  'молоко', 'хлеб', 'вода', 'каша', 'суп', 'яблоко', 'морковь',
  'небо', 'звезда', 'луна', 'земля', 'снег', 'дождь', 'ветер',
  'лес', 'поле', 'море', 'озеро', 'гора', 'трава', 'лист',
  'нос', 'рот', 'рука', 'нога', 'глаз', 'ухо', 'голова',
  'класс', 'урок', 'перемена', 'портфель', 'карандаш', 'ластик',
  'корова', 'лошадь', 'курица', 'петух', 'гусь', 'утка',
  'вася', 'петя', 'маша', 'коля', 'оля', 'саша', 'миша',
]);

const KNOWN_VERBS = new Set([
  'бежать', 'бежит', 'играть', 'играет', 'читать', 'читает',
  'прыгать', 'прыгает', 'рисовать', 'рисует', 'петь', 'поёт',
  'летать', 'летит', 'летает', 'спать', 'спит', 'идти', 'идёт',
  'писать', 'пишет', 'есть', 'ест', 'пить', 'пьёт',
  'говорить', 'говорит', 'смотреть', 'смотрит', 'слушать', 'слушает',
  'думать', 'думает', 'знать', 'знает', 'хотеть', 'хочет',
  'любить', 'любит', 'делать', 'делает', 'работать', 'работает',
  'учить', 'учит', 'учиться', 'учится', 'гулять', 'гуляет',
  'сидеть', 'сидит', 'стоять', 'стоит', 'лежать', 'лежит',
  'кушать', 'кушает', 'плавать', 'плавает', 'танцевать', 'танцует',
  'помогать', 'помогает', 'строить', 'строит', 'варить', 'варит',
  'мыть', 'моет', 'чистить', 'чистит', 'кормить', 'кормит',
]);

const KNOWN_ADJECTIVES = new Set([
  'красный', 'синий', 'зелёный', 'зеленый', 'жёлтый', 'желтый',
  'белый', 'чёрный', 'черный', 'большой', 'маленький', 'добрый',
  'злой', 'высокий', 'низкий', 'весёлый', 'веселый', 'грустный',
  'красивый', 'тёплый', 'теплый', 'холодный', 'новый', 'старый',
  'быстрый', 'медленный', 'сильный', 'слабый', 'умный', 'глупый',
  'длинный', 'короткий', 'широкий', 'узкий', 'толстый', 'тонкий',
  'светлый', 'тёмный', 'темный', 'громкий', 'тихий', 'мягкий',
  'твёрдый', 'твердый', 'сладкий', 'горький', 'кислый', 'солёный',
  'хороший', 'плохой', 'смелый', 'храбрый', 'ленивый', 'трудолюбивый',
]);

const PREVIEW_STEPS: TheoryStep[] = [
  {
    type: 'identify',
    topic: 'noun',
    question: 'Как называется слово «мама»? (существительное, глагол или прилагательное)',
    word: 'мама',
  },
  {
    type: 'identify',
    topic: 'verb',
    question: 'Какое из слов — глагол: «играть», «мама» или «синий»?',
    acceptAnswers: ['играть'],
  },
];

const LESSON_STEPS: TheoryStep[] = [
  // Блок 1: Существительное
  {
    type: 'identify',
    topic: 'noun',
    question: 'Как называется слово «мама»? (существительное, глагол или прилагательное)',
    word: 'мама',
  },
  {
    type: 'identify',
    topic: 'noun',
    question: 'А слово «школа»? Какая это часть речи?',
    word: 'школа',
  },
  {
    type: 'identify',
    topic: 'noun',
    question: 'Слово «окно» — это существительное, глагол или прилагательное?',
    word: 'окно',
  },
  {
    type: 'write_word',
    topic: 'noun',
    question: 'Напиши одно существительное — слово, которое называет предмет, человека или животное.',
  },
  // Блок 2: Глагол
  {
    type: 'identify',
    topic: 'verb',
    question: 'Как называется слово «бежит»? (существительное, глагол или прилагательное)',
    word: 'бежит',
  },
  {
    type: 'identify',
    topic: 'verb',
    question: 'А слово «читать»? Какая это часть речи?',
    word: 'читать',
  },
  {
    type: 'identify',
    topic: 'verb',
    question: 'Слово «рисует» — это существительное, глагол или прилагательное?',
    word: 'рисует',
  },
  {
    type: 'write_word',
    topic: 'verb',
    question: 'Напиши один глагол — слово, которое обозначает действие.',
  },
  // Блок 3: Прилагательное
  {
    type: 'identify',
    topic: 'adjective',
    question: 'Как называется слово «красный»? (существительное, глагол или прилагательное)',
    word: 'красный',
  },
  {
    type: 'identify',
    topic: 'adjective',
    question: 'А слово «весёлый»? Какая это часть речи?',
    word: 'весёлый',
  },
  {
    type: 'identify',
    topic: 'adjective',
    question: 'Слово «большой» — это существительное, глагол или прилагательное?',
    word: 'большой',
  },
  {
    type: 'write_word',
    topic: 'adjective',
    question: 'Напиши одно прилагательное — слово, которое описывает предмет (какой он).',
  },
];

export type TheoryState = {
  step: number;
  awaitingRetry: PartOfSpeech | null;
};

export type TheoryResult = {
  status: 'correct' | 'incorrect' | 'finished';
  response: string;
  note?: string;
  nextState: TheoryState;
};

export const THEORY_PREVIEW = PREVIEW_STEPS;
export const THEORY_LESSON = LESSON_STEPS;

function detectPartOfSpeech(word: string): PartOfSpeech | null {
  const lower = word.toLowerCase().trim();
  if (KNOWN_NOUNS.has(lower)) return 'noun';
  if (KNOWN_VERBS.has(lower)) return 'verb';
  if (KNOWN_ADJECTIVES.has(lower)) return 'adjective';
  if (/(?:ть|ться|ет|ёт|ит|ат|ят|ут|ют|ает|яет|ует|ёшь|ишь|ешь)$/.test(lower)) return 'verb';
  if (/(?:ый|ий|ой|ая|яя|ое|ее|ые|ие)$/.test(lower) && lower.length >= 4) return 'adjective';
  return null;
}

function matchesTopicAnswer(input: string, topic: PartOfSpeech): boolean {
  const lower = input.toLowerCase().trim();
  switch (topic) {
    case 'noun':
      return lower.includes('существительное');
    case 'verb':
      return lower.includes('глагол');
    case 'adjective':
      return lower.includes('прилагательное');
  }
}

function getTopicLabel(topic: PartOfSpeech): string {
  switch (topic) {
    case 'noun': return 'существительное';
    case 'verb': return 'глагол';
    case 'adjective': return 'прилагательное';
  }
}

function getRetryPrompt(topic: PartOfSpeech): string {
  switch (topic) {
    case 'noun': return 'Напиши ещё одно существительное — любое слово, которое называет предмет, человека или животное.';
    case 'verb': return 'Напиши ещё один глагол — любое слово, которое обозначает действие.';
    case 'adjective': return 'Напиши ещё одно прилагательное — любое слово, которое описывает предмет.';
  }
}

function explainWrongWord(word: string, expectedTopic: PartOfSpeech): string {
  const detected = detectPartOfSpeech(word);
  const expectedLabel = getTopicLabel(expectedTopic);

  if (detected && detected !== expectedTopic) {
    const detectedLabel = getTopicLabel(detected);
    return `«${word}» — это ${detectedLabel}, а не ${expectedLabel}. ${TOPIC_EXPLANATION[expectedTopic]}`;
  }

  return `«${word}» — это не ${expectedLabel}. ${TOPIC_EXPLANATION[expectedTopic]}`;
}

export function checkTheoryAnswer(
  input: string,
  state: TheoryState,
  questions: TheoryStep[] = LESSON_STEPS,
): TheoryResult {
  const lower = input.toLowerCase().trim();

  // Retry mode: child must write a word of the requested part of speech
  if (state.awaitingRetry) {
    const topic = state.awaitingRetry;
    const word = lower.replace(/[«»""''.,!?;:]/g, '').trim();
    const detected = detectPartOfSpeech(word);

    if (detected === topic) {
      const label = getTopicLabel(topic);
      let response = `Правильно! «${word}» — это ${label}. Молодец!`;
      if (state.step < questions.length) {
        response += ` ${questions[state.step].question}`;
      } else {
        response += ' Ты ответил на все вопросы. Нажми «Завершить урок».';
      }
      return {
        status: 'correct',
        response,
        nextState: { step: state.step, awaitingRetry: null },
      };
    }

    const explanation = explainWrongWord(word, topic);
    return {
      status: 'incorrect',
      response: `${explanation} Попробуй ещё раз.`,
      note: TOPIC_EXPLANATION[topic],
      nextState: state,
    };
  }

  // Finished
  if (state.step >= questions.length) {
    return {
      status: 'finished',
      response: 'Ты ответил на все вопросы! Нажми «Завершить урок», чтобы посмотреть результаты.',
      nextState: state,
    };
  }

  const current = questions[state.step];

  // Question type: identify part of speech
  if (current.type === 'identify') {
    if (current.acceptAnswers) {
      const matched = current.acceptAnswers.some((a) => lower.includes(a));
      if (matched) {
        const nextStep = state.step + 1;
        let response = `Молодец! «${current.acceptAnswers[0]}» — это ${getTopicLabel(current.topic)}, потому что это слово обозначает действие.`;
        if (nextStep < questions.length) {
          response += ` ${questions[nextStep].question}`;
        } else {
          response += ' Отлично! Ты ответил на все вопросы. Нажми «Завершить урок».';
        }
        return { status: 'correct', response, nextState: { step: nextStep, awaitingRetry: null } };
      }
    }

    const matched = matchesTopicAnswer(lower, current.topic);

    if (matched) {
      const nextStep = state.step + 1;
      const label = getTopicLabel(current.topic);
      let response = `Верно! «${current.word}» — это ${label}. ${TOPIC_EXPLANATION[current.topic]}`;
      if (nextStep < questions.length) {
        response += ` ${questions[nextStep].question}`;
      } else {
        response += ' Отлично! Ты ответил на все вопросы. Нажми «Завершить урок».';
      }
      return { status: 'correct', response, nextState: { step: nextStep, awaitingRetry: null } };
    }

    const label = getTopicLabel(current.topic);
    const wrongTopic = (['noun', 'verb', 'adjective'] as PartOfSpeech[]).find(
      (t) => t !== current.topic && matchesTopicAnswer(lower, t)
    );

    let response: string;
    if (wrongTopic) {
      const wrongLabel = getTopicLabel(wrongTopic);
      response = `Нет, «${current.word}» — это не ${wrongLabel}. Правильный ответ: ${label}. ${TOPIC_EXPLANATION[current.topic]} ${getRetryPrompt(current.topic)}`;
    } else {
      response = `Не совсем. «${current.word}» — это ${label}. ${TOPIC_EXPLANATION[current.topic]} ${getRetryPrompt(current.topic)}`;
    }

    return {
      status: 'incorrect',
      response,
      note: TOPIC_EXPLANATION[current.topic],
      nextState: { step: state.step + 1, awaitingRetry: current.topic },
    };
  }

  // Question type: write a word of given part of speech
  if (current.type === 'write_word') {
    const word = lower.replace(/[«»""''.,!?;:]/g, '').trim();
    const detected = detectPartOfSpeech(word);

    if (detected === current.topic) {
      const label = getTopicLabel(current.topic);
      const nextStep = state.step + 1;
      let response = `Правильно! «${word}» — это ${label}. Молодец!`;
      if (nextStep < questions.length) {
        response += ` ${questions[nextStep].question}`;
      } else {
        response += ' Отлично! Ты ответил на все вопросы. Нажми «Завершить урок».';
      }
      return { status: 'correct', response, nextState: { step: nextStep, awaitingRetry: null } };
    }

    const explanation = explainWrongWord(word, current.topic);
    return {
      status: 'incorrect',
      response: `${explanation} Попробуй ещё раз.`,
      note: TOPIC_EXPLANATION[current.topic],
      nextState: { step: state.step, awaitingRetry: null },
    };
  }

  return {
    status: 'finished',
    response: 'Ты ответил на все вопросы! Нажми «Завершить урок».',
    nextState: state,
  };
}
