import { describe, it, expect } from 'vitest';
import { checkTheoryAnswer, THEORY_QUESTIONS } from './theory-checker';

describe('вопрос 1: как называется слово «мама»', () => {
  it('«существительное» — правильно', () => {
    const r = checkTheoryAnswer('существительное', 0);
    expect(r.status).toBe('correct');
    expect(r.nextStep).toBe(1);
    expect(r.response).toContain('Верно');
  });

  it('«имя существительное» — правильно', () => {
    const r = checkTheoryAnswer('имя существительное', 0);
    expect(r.status).toBe('correct');
    expect(r.nextStep).toBe(1);
  });

  it('«глагол» — неправильно', () => {
    const r = checkTheoryAnswer('глагол', 0);
    expect(r.status).toBe('incorrect');
    expect(r.nextStep).toBe(0);
    expect(r.note).toBeDefined();
  });

  it('«красный» — неправильно', () => {
    const r = checkTheoryAnswer('красный', 0);
    expect(r.status).toBe('incorrect');
    expect(r.nextStep).toBe(0);
  });

  it('«Вася» — неправильно', () => {
    const r = checkTheoryAnswer('Вася', 0);
    expect(r.status).toBe('incorrect');
    expect(r.nextStep).toBe(0);
  });

  it('после правильного ответа показывает следующий вопрос', () => {
    const r = checkTheoryAnswer('существительное', 0);
    expect(r.response).toContain('глагол');
  });
});

describe('вопрос 2: какое слово — глагол', () => {
  it('«играть» — правильно', () => {
    const r = checkTheoryAnswer('играть', 1);
    expect(r.status).toBe('correct');
    expect(r.nextStep).toBe(2);
    expect(r.response).toContain('Молодец');
  });

  it('«синий» — неправильно', () => {
    const r = checkTheoryAnswer('синий', 1);
    expect(r.status).toBe('incorrect');
    expect(r.nextStep).toBe(1);
    expect(r.note).toBeDefined();
  });

  it('«мама» — неправильно', () => {
    const r = checkTheoryAnswer('мама', 1);
    expect(r.status).toBe('incorrect');
    expect(r.nextStep).toBe(1);
  });

  it('после правильного ответа сообщает о завершении', () => {
    const r = checkTheoryAnswer('играть', 1);
    expect(r.response).toContain('Завершить урок');
  });
});

describe('после завершения всех вопросов', () => {
  it('ввод после завершения возвращает status=finished', () => {
    const r = checkTheoryAnswer('что-нибудь', 2);
    expect(r.status).toBe('finished');
    expect(r.nextStep).toBe(2);
    expect(r.response).toContain('Завершить урок');
  });

  it('step не увеличивается после завершения', () => {
    const r = checkTheoryAnswer('существительное', THEORY_QUESTIONS.length);
    expect(r.nextStep).toBe(THEORY_QUESTIONS.length);
  });
});

describe('полный сценарий', () => {
  it('последовательная проверка: существительное → играть → завершение', () => {
    let step = 0;

    const r1 = checkTheoryAnswer('существительное', step);
    expect(r1.status).toBe('correct');
    step = r1.nextStep;

    const r2 = checkTheoryAnswer('играть', step);
    expect(r2.status).toBe('correct');
    step = r2.nextStep;

    const r3 = checkTheoryAnswer('ещё вопрос', step);
    expect(r3.status).toBe('finished');
  });
});

describe('единый результат для обеих страниц', () => {
  it('одинаковый ответ на «существительное» при step=0', () => {
    const r1 = checkTheoryAnswer('существительное', 0);
    const r2 = checkTheoryAnswer('существительное', 0);
    expect(r1.status).toBe(r2.status);
    expect(r1.response).toBe(r2.response);
    expect(r1.note).toBe(r2.note);
  });

  it('одинаковый ответ на «синий» при step=1', () => {
    const r1 = checkTheoryAnswer('синий', 1);
    const r2 = checkTheoryAnswer('синий', 1);
    expect(r1.status).toBe(r2.status);
    expect(r1.response).toBe(r2.response);
    expect(r1.note).toBe(r2.note);
  });
});
