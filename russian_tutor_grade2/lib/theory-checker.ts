export type TheoryQuestion = {
  question: string;
  keywords: string[];
  success: string;
  failure: string;
  note: string;
};

export const THEORY_QUESTIONS: TheoryQuestion[] = [
  {
    question: 'Как называется слово «мама»? Напиши свой ответ.',
    keywords: ['имя существительное', 'существительное'],
    success: 'Верно! «Мама» — это имя существительное, потому что оно называет человека.',
    failure: 'Это не совсем верно. Подумай: слово «мама» называет человека или действие?',
    note: 'Имя существительное отвечает на вопросы «кто?» или «что?». Например, «мама», «солнце», «школа».',
  },
  {
    question: 'Какое из этих слов — глагол: «играть», «мама», «синий»?',
    keywords: ['играть'],
    success: 'Молодец! «Играть» — это глагол, потому что оно обозначает действие.',
    failure: 'Подумай: какое из этих слов обозначает действие — то, что можно делать?',
    note: 'Глагол отвечает на вопросы «что делать?» или «что сделать?». Например, «бежать», «читать», «играть».',
  },
];

export type TheoryResult = {
  status: 'correct' | 'incorrect' | 'finished';
  response: string;
  note?: string;
  nextStep: number;
};

export function checkTheoryAnswer(input: string, step: number): TheoryResult {
  if (step >= THEORY_QUESTIONS.length) {
    return {
      status: 'finished',
      response: 'Ты ответил на все вопросы! Нажми «Завершить урок», чтобы посмотреть результаты.',
      nextStep: step,
    };
  }

  const current = THEORY_QUESTIONS[step];
  const lower = input.toLowerCase().trim();

  const matched = current.keywords.some((keyword) => lower.includes(keyword));

  if (matched) {
    const nextStep = step + 1;
    let response = current.success;
    if (nextStep < THEORY_QUESTIONS.length) {
      response += ` ${THEORY_QUESTIONS[nextStep].question}`;
    } else {
      response += ' Отлично! Ты ответил на все вопросы. Нажми «Завершить урок».';
    }
    return { status: 'correct', response, nextStep };
  }

  return {
    status: 'incorrect',
    response: current.failure,
    note: current.note,
    nextStep: step,
  };
}
