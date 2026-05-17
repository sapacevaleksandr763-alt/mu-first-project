import { levenshtein, misspellings } from './spelling-dictionary';

export type VocabWord = {
  word: string;
  success: string;
  failure: string;
  note: string;
};

export const VOCAB_WORDS: VocabWord[] = [
  {
    word: 'малыш',
    success: 'Правильно! Слово «малыш» написано верно.',
    failure: 'Попробуй ещё раз. Вспомни, как пишется это слово.',
    note: 'Запомни: «малыш» пишется через букву «ы».',
  },
  {
    word: 'лес',
    success: 'Отлично! Слово «лес» написано верно.',
    failure: 'Попробуй ещё раз: слово «лес» пишется коротко и без мягкого знака.',
    note: 'Запомни: «лес» состоит из трёх букв.',
  },
];

export type VocabResult = {
  status: 'correct' | 'near_miss' | 'incorrect';
  response: string;
  note?: string;
  nextWordIndex: number;
};

const knownCorrectWords: Set<string> = new Set(
  Object.values(misspellings).map(e => e.correct.toLowerCase())
);

function freeSpellCheck(input: string, wordIndex: number): VocabResult {
  const cleaned = input.toLowerCase().replace(/[«»""''.,!?;:]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);

  if (words.length > 1) {
    return {
      status: 'incorrect',
      response: 'Напиши одно слово для проверки, не предложение.',
      nextWordIndex: wordIndex,
    };
  }

  const word = words[0] || '';

  if (word.length < 2) {
    return {
      status: 'incorrect',
      response: 'Напиши слово целиком (минимум 2 буквы).',
      nextWordIndex: wordIndex,
    };
  }

  const direct = misspellings[word];
  if (direct) {
    return {
      status: 'incorrect',
      response: `В слове «${word}» ошибка: правильно — «${direct.correct}». ${direct.explanation}`,
      note: `Запомни: «${direct.correct}».`,
      nextWordIndex: wordIndex,
    };
  }

  if (knownCorrectWords.has(word)) {
    return {
      status: 'correct',
      response: `Слово «${word}» написано правильно! Можешь проверить ещё одно слово.`,
      nextWordIndex: wordIndex,
    };
  }

  let bestFromKeys: { correct: string; explanation: string; dist: number } | null = null;
  for (const [key, entry] of Object.entries(misspellings)) {
    if (Math.abs(key.length - word.length) > 2) continue;
    const dist = levenshtein(word, key);
    if (dist <= 2 && entry.correct.toLowerCase() !== word) {
      if (!bestFromKeys || dist < bestFromKeys.dist) {
        bestFromKeys = { correct: entry.correct, explanation: entry.explanation, dist };
      }
    }
  }
  if (bestFromKeys) {
    if (bestFromKeys.dist === 1) {
      return {
        status: 'near_miss',
        response: `Похоже на ошибку: «${word}» → правильно «${bestFromKeys.correct}». ${bestFromKeys.explanation}`,
        note: `Запомни: «${bestFromKeys.correct}».`,
        nextWordIndex: wordIndex,
      };
    }
    return {
      status: 'incorrect',
      response: `В слове «${word}» ошибки: правильно — «${bestFromKeys.correct}». ${bestFromKeys.explanation}`,
      note: `Запомни: «${bestFromKeys.correct}».`,
      nextWordIndex: wordIndex,
    };
  }

  let bestFromCorrect: { correct: string; dist: number } | null = null;
  for (const correct of knownCorrectWords) {
    if (correct === word) continue;
    if (Math.abs(correct.length - word.length) > 2) continue;
    const dist = levenshtein(word, correct);
    if (dist <= 2 && (!bestFromCorrect || dist < bestFromCorrect.dist)) {
      bestFromCorrect = { correct, dist };
    }
  }
  if (bestFromCorrect) {
    if (bestFromCorrect.dist === 1) {
      return {
        status: 'near_miss',
        response: `Почти правильно! Возможно, ты имел в виду «${bestFromCorrect.correct}». Проверь написание.`,
        note: `Запомни: «${bestFromCorrect.correct}».`,
        nextWordIndex: wordIndex,
      };
    }
    return {
      status: 'incorrect',
      response: `В слове «${word}» ошибки: правильно — «${bestFromCorrect.correct}». Проверь внимательно каждую букву.`,
      note: `Запомни: «${bestFromCorrect.correct}».`,
      nextWordIndex: wordIndex,
    };
  }

  return {
    status: 'correct',
    response: `Слово «${word}» написано правильно! Можешь проверить ещё одно слово.`,
    nextWordIndex: wordIndex,
  };
}

export function checkVocabAnswer(input: string, wordIndex: number): VocabResult {
  if (wordIndex >= VOCAB_WORDS.length) {
    return freeSpellCheck(input, wordIndex);
  }

  const current = VOCAB_WORDS[wordIndex];
  const cleaned = input.toLowerCase().replace(/[«»""''.,!?;:]/g, '').trim();
  const inputWords = cleaned.split(/\s+/);

  const exactMatch = inputWords.includes(current.word) || cleaned === current.word;

  if (exactMatch) {
    const nextIndex = wordIndex + 1;
    let response = current.success;
    if (nextIndex < VOCAB_WORDS.length) {
      response += ` Теперь напиши слово «${VOCAB_WORDS[nextIndex].word}».`;
    } else {
      response += ' Обязательные слова пройдены! Теперь можешь проверить любое слово — просто напиши его.';
    }
    return { status: 'correct', response, nextWordIndex: nextIndex };
  }

  const candidate = inputWords[inputWords.length - 1];
  const dist = levenshtein(candidate, current.word);

  if (dist <= 2) {
    return {
      status: 'near_miss',
      response: `Почти правильно! Ты написал «${candidate}», но верно — «${current.word}». Попробуй ещё раз.`,
      note: current.note,
      nextWordIndex: wordIndex,
    };
  }

  return {
    status: 'incorrect',
    response: current.failure,
    note: current.note,
    nextWordIndex: wordIndex,
  };
}
