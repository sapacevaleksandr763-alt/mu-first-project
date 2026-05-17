import { describe, it, expect } from 'vitest';
import { checkTheoryAnswer, THEORY_PREVIEW, THEORY_LESSON, type TheoryState } from './theory-checker';

const initial: TheoryState = { step: 0, awaitingRetry: null };

describe('превью: вопрос 1 — как называется слово «мама»', () => {
  it('«существительное» — правильно', () => {
    const r = checkTheoryAnswer('существительное', initial, THEORY_PREVIEW);
    expect(r.status).toBe('correct');
    expect(r.nextState.step).toBe(1);
    expect(r.response).toContain('Верно');
  });

  it('«имя существительное» — правильно', () => {
    const r = checkTheoryAnswer('имя существительное', initial, THEORY_PREVIEW);
    expect(r.status).toBe('correct');
  });

  it('«глагол» — неправильно, показывает объяснение', () => {
    const r = checkTheoryAnswer('глагол', initial, THEORY_PREVIEW);
    expect(r.status).toBe('incorrect');
    expect(r.response).toContain('существительное');
    expect(r.nextState.awaitingRetry).toBe('noun');
  });

  it('«красный» — неправильно', () => {
    const r = checkTheoryAnswer('красный', initial, THEORY_PREVIEW);
    expect(r.status).toBe('incorrect');
    expect(r.nextState.awaitingRetry).toBe('noun');
  });

  it('«Вася» — неправильно', () => {
    const r = checkTheoryAnswer('Вася', initial, THEORY_PREVIEW);
    expect(r.status).toBe('incorrect');
  });
});

describe('превью: вопрос 2 — какое слово глагол', () => {
  const step1: TheoryState = { step: 1, awaitingRetry: null };

  it('«играть» — правильно', () => {
    const r = checkTheoryAnswer('играть', step1, THEORY_PREVIEW);
    expect(r.status).toBe('correct');
    expect(r.response).toContain('глагол');
  });

  it('«синий» — неправильно', () => {
    const r = checkTheoryAnswer('синий', step1, THEORY_PREVIEW);
    expect(r.status).toBe('incorrect');
  });

  it('«мама» — неправильно', () => {
    const r = checkTheoryAnswer('мама', step1, THEORY_PREVIEW);
    expect(r.status).toBe('incorrect');
  });
});

describe('урок: блок существительных', () => {
  it('«мама» → существительное — правильно', () => {
    const r = checkTheoryAnswer('существительное', initial, THEORY_LESSON);
    expect(r.status).toBe('correct');
    expect(r.response).toContain('существительное');
  });

  it('«школа» → существительное — правильно', () => {
    const state: TheoryState = { step: 1, awaitingRetry: null };
    const r = checkTheoryAnswer('существительное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('«окно» → существительное — правильно', () => {
    const state: TheoryState = { step: 2, awaitingRetry: null };
    const r = checkTheoryAnswer('существительное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('напиши существительное → «кот» — правильно', () => {
    const state: TheoryState = { step: 3, awaitingRetry: null };
    const r = checkTheoryAnswer('кот', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    expect(r.response).toContain('кот');
  });

  it('напиши существительное → «бежит» — неправильно', () => {
    const state: TheoryState = { step: 3, awaitingRetry: null };
    const r = checkTheoryAnswer('бежит', state, THEORY_LESSON);
    expect(r.status).toBe('incorrect');
    expect(r.response).toContain('глагол');
  });
});

describe('урок: блок глаголов', () => {
  it('«бежит» → глагол — правильно', () => {
    const state: TheoryState = { step: 4, awaitingRetry: null };
    const r = checkTheoryAnswer('глагол', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('«читать» → глагол — правильно', () => {
    const state: TheoryState = { step: 5, awaitingRetry: null };
    const r = checkTheoryAnswer('глагол', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('напиши глагол → «играть» — правильно', () => {
    const state: TheoryState = { step: 7, awaitingRetry: null };
    const r = checkTheoryAnswer('играть', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('напиши глагол → «Вася» — неправильно', () => {
    const state: TheoryState = { step: 7, awaitingRetry: null };
    const r = checkTheoryAnswer('Вася', state, THEORY_LESSON);
    expect(r.status).toBe('incorrect');
    expect(r.response).toContain('существительное');
  });
});

describe('урок: блок прилагательных', () => {
  it('«красный» → прилагательное — правильно', () => {
    const state: TheoryState = { step: 8, awaitingRetry: null };
    const r = checkTheoryAnswer('прилагательное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('«весёлый» → прилагательное — правильно', () => {
    const state: TheoryState = { step: 9, awaitingRetry: null };
    const r = checkTheoryAnswer('прилагательное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
  });

  it('напиши прилагательное → «красный» — правильно', () => {
    const state: TheoryState = { step: 11, awaitingRetry: null };
    const r = checkTheoryAnswer('красный', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    expect(r.response).toContain('красный');
  });

  it('напиши прилагательное → «мама» — неправильно', () => {
    const state: TheoryState = { step: 11, awaitingRetry: null };
    const r = checkTheoryAnswer('мама', state, THEORY_LESSON);
    expect(r.status).toBe('incorrect');
    expect(r.response).toContain('существительное');
  });
});

describe('повторение после ошибки (retry)', () => {
  it('после ошибки на identify просит написать слово', () => {
    const r = checkTheoryAnswer('глагол', initial, THEORY_LESSON);
    expect(r.status).toBe('incorrect');
    expect(r.nextState.awaitingRetry).toBe('noun');
    expect(r.response).toContain('Напиши');
  });

  it('в режиме retry правильное слово принимается', () => {
    const retryState: TheoryState = { step: 1, awaitingRetry: 'noun' };
    const r = checkTheoryAnswer('собака', retryState, THEORY_LESSON);
    expect(r.status).toBe('correct');
    expect(r.nextState.awaitingRetry).toBeNull();
    expect(r.response).toContain('собака');
  });

  it('в режиме retry неправильное слово отклоняется', () => {
    const retryState: TheoryState = { step: 1, awaitingRetry: 'noun' };
    const r = checkTheoryAnswer('бежит', retryState, THEORY_LESSON);
    expect(r.status).toBe('incorrect');
    expect(r.nextState.awaitingRetry).toBe('noun');
    expect(r.response).toContain('глагол');
  });

  it('после retry продолжается следующий вопрос', () => {
    const retryState: TheoryState = { step: 1, awaitingRetry: 'noun' };
    const r = checkTheoryAnswer('дом', retryState, THEORY_LESSON);
    expect(r.status).toBe('correct');
    expect(r.nextState.step).toBe(1);
    expect(r.response).toContain(THEORY_LESSON[1].question);
  });
});

describe('завершение урока', () => {
  it('после последнего вопроса статус finished', () => {
    const state: TheoryState = { step: THEORY_LESSON.length, awaitingRetry: null };
    const r = checkTheoryAnswer('что-нибудь', state, THEORY_LESSON);
    expect(r.status).toBe('finished');
    expect(r.response).toContain('Завершить урок');
  });

  it('последний правильный ответ сообщает о завершении', () => {
    const state: TheoryState = { step: 11, awaitingRetry: null };
    const r = checkTheoryAnswer('добрый', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    expect(r.response).toContain('Завершить урок');
  });
});

describe('полный сценарий: существительное → глагол → прилагательное', () => {
  it('проходит весь урок последовательно', () => {
    let state: TheoryState = { step: 0, awaitingRetry: null };

    // Блок существительных
    let r = checkTheoryAnswer('существительное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('существительное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('существительное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('мама', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    // Блок глаголов
    r = checkTheoryAnswer('глагол', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('глагол', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('глагол', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('играть', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    // Блок прилагательных
    r = checkTheoryAnswer('прилагательное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('прилагательное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('прилагательное', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    r = checkTheoryAnswer('красный', state, THEORY_LESSON);
    expect(r.status).toBe('correct');
    state = r.nextState;

    expect(state.step).toBe(THEORY_LESSON.length);

    // После завершения
    r = checkTheoryAnswer('ещё', state, THEORY_LESSON);
    expect(r.status).toBe('finished');
  });
});

describe('единый результат для обеих страниц', () => {
  it('одинаковый ответ на «существительное» при step=0', () => {
    const r1 = checkTheoryAnswer('существительное', initial, THEORY_PREVIEW);
    const r2 = checkTheoryAnswer('существительное', initial, THEORY_LESSON);
    expect(r1.status).toBe(r2.status);
    expect(r1.nextState.awaitingRetry).toBe(r2.nextState.awaitingRetry);
  });

  it('одинаковая ошибка на «глагол» при step=0', () => {
    const r1 = checkTheoryAnswer('глагол', initial, THEORY_PREVIEW);
    const r2 = checkTheoryAnswer('глагол', initial, THEORY_LESSON);
    expect(r1.status).toBe(r2.status);
    expect(r1.nextState.awaitingRetry).toBe(r2.nextState.awaitingRetry);
  });
});
