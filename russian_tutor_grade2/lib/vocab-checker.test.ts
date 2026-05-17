import { describe, it, expect } from 'vitest';
import { checkVocabAnswer } from './vocab-checker';

describe('обязательные слова: малыш → лес', () => {
  it('«малыш» — correct, переход к следующему', () => {
    const r = checkVocabAnswer('малыш', 0);
    expect(r.status).toBe('correct');
    expect(r.nextWordIndex).toBe(1);
    expect(r.response).toContain('лес');
  });

  it('«лес» — correct, переход в свободный режим', () => {
    const r = checkVocabAnswer('лес', 1);
    expect(r.status).toBe('correct');
    expect(r.nextWordIndex).toBe(2);
    expect(r.response).toContain('можешь проверить любое слово');
    expect(r.response).not.toContain('Завершить');
  });
});

describe('свободная проверка: правильные слова', () => {
  const correctWords = ['корова', 'машина', 'молоко', 'тетрадь', 'собака', 'учитель', 'карандаш'];
  for (const word of correctWords) {
    it(`«${word}» — правильно`, () => {
      const r = checkVocabAnswer(word, 2);
      expect(r.status).toBe('correct');
      expect(r.response).toContain('правильно');
    });
  }
});

describe('свободная проверка: одна ошибка', () => {
  const cases = [
    { input: 'карова', expected: 'корова' },
    { input: 'мошина', expected: 'машина' },
    { input: 'биреза', expected: 'берёза' },
    { input: 'малако', expected: 'молоко' },
    { input: 'тетрать', expected: 'тетрадь' },
    { input: 'сабака', expected: 'собака' },
    { input: 'учитиль', expected: 'учитель' },
    { input: 'карандош', expected: 'карандаш' },
  ];
  for (const { input, expected } of cases) {
    it(`«${input}» — ошибка, показывается «${expected}»`, () => {
      const r = checkVocabAnswer(input, 2);
      expect(r.status).not.toBe('correct');
      expect(r.response).toContain(expected);
    });
  }
});

describe('свободная проверка: несколько ошибок', () => {
  const cases = [
    { input: 'кароваа', expected: 'корова' },
    { input: 'машына', expected: 'машина' },
    { input: 'бераза', expected: 'берёза' },
    { input: 'малкао', expected: 'молоко' },
    { input: 'сбака', expected: 'собака' },
    { input: 'учетел', expected: 'учитель' },
  ];
  for (const { input, expected } of cases) {
    it(`«${input}» — несколько ошибок, показывается «${expected}»`, () => {
      const r = checkVocabAnswer(input, 2);
      expect(r.status).not.toBe('correct');
      expect(r.response).toContain(expected);
    });
  }
});

describe('предложения не принимаются как слово', () => {
  const sentences = ['малыш играет', 'у меня лес', 'это корова'];
  for (const sent of sentences) {
    it(`«${sent}» — отклоняется (несколько слов)`, () => {
      const r = checkVocabAnswer(sent, 2);
      expect(r.status).toBe('incorrect');
      expect(r.response).toContain('одно слово');
    });
  }
});

describe('полный сценарий: малыш → лес → корова → карова → машина → мошина', () => {
  it('последовательная проверка', () => {
    let idx = 0;

    const r1 = checkVocabAnswer('малыш', idx);
    expect(r1.status).toBe('correct');
    idx = r1.nextWordIndex;

    const r2 = checkVocabAnswer('лес', idx);
    expect(r2.status).toBe('correct');
    idx = r2.nextWordIndex;

    const r3 = checkVocabAnswer('корова', idx);
    expect(r3.status).toBe('correct');
    expect(r3.response).toContain('правильно');

    const r4 = checkVocabAnswer('карова', idx);
    expect(r4.status).not.toBe('correct');
    expect(r4.response).toContain('корова');

    const r5 = checkVocabAnswer('машина', idx);
    expect(r5.status).toBe('correct');

    const r6 = checkVocabAnswer('мошина', idx);
    expect(r6.status).not.toBe('correct');
    expect(r6.response).toContain('машина');

    expect(idx).toBe(2);
  });
});

describe('near_miss в обязательной части', () => {
  it('«молыш» — near_miss', () => {
    const r = checkVocabAnswer('молыш', 0);
    expect(r.status).toBe('near_miss');
    expect(r.nextWordIndex).toBe(0);
  });

  it('«лесь» — near_miss для лес', () => {
    const r = checkVocabAnswer('лесь', 1);
    expect(r.status).toBe('near_miss');
    expect(r.nextWordIndex).toBe(1);
    expect(r.response).toContain('лес');
  });

  it('«лос» — near_miss для лес', () => {
    const r = checkVocabAnswer('лос', 1);
    expect(r.status).toBe('near_miss');
    expect(r.nextWordIndex).toBe(1);
    expect(r.response).toContain('лес');
  });

  it('«лез» — near_miss', () => {
    const r = checkVocabAnswer('лез', 1);
    expect(r.status).toBe('near_miss');
    expect(r.nextWordIndex).toBe(1);
  });
});

describe('гиппопотам: нормативное написание', () => {
  it('«гиппопотам» — правильно', () => {
    const r = checkVocabAnswer('гиппопотам', 2);
    expect(r.status).toBe('correct');
    expect(r.response).toContain('правильно');
  });

  it('«гипопотам» — ошибка, исправление на гиппопотам', () => {
    const r = checkVocabAnswer('гипопотам', 2);
    expect(r.status).not.toBe('correct');
    expect(r.response).toContain('гиппопотам');
  });
});

describe('единый результат для обеих страниц', () => {
  it('одинаковый ответ на «малыш» при step=0', () => {
    const r1 = checkVocabAnswer('малыш', 0);
    const r2 = checkVocabAnswer('малыш', 0);
    expect(r1.status).toBe(r2.status);
    expect(r1.response).toBe(r2.response);
  });

  it('одинаковый ответ на «мошина» при step=2', () => {
    const r1 = checkVocabAnswer('мошина', 2);
    const r2 = checkVocabAnswer('мошина', 2);
    expect(r1.status).toBe(r2.status);
    expect(r1.response).toBe(r2.response);
    expect(r1.note).toBe(r2.note);
  });

  it('одинаковый ответ на «бирезка» при step=2', () => {
    const r1 = checkVocabAnswer('бирезка', 2);
    const r2 = checkVocabAnswer('бирезка', 2);
    expect(r1.status).toBe(r2.status);
    expect(r1.response).toBe(r2.response);
    expect(r1.response).toContain('берёзка');
  });
});
