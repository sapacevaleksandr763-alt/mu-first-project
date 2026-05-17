import { misspellings, properNouns, levenshtein } from './spelling-dictionary';

export type AnalysisResult = {
  spelling: { word: string; correction: string; explanation: string }[];
  capitalization: string[];
  punctuation: string[];
  repetitions: string[];
  rules: string[];
};

export function analyzeText(text: string): AnalysisResult {
  const result: AnalysisResult = {
    spelling: [], capitalization: [], punctuation: [], repetitions: [], rules: [],
  };

  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0 && text.trim()) sentences.push(text.trim());

  for (const sent of sentences) {
    const t = sent.trim();
    if (t.length === 0) continue;
    if (t[0] !== t[0].toUpperCase()) {
      const firstWord = t.split(/\s+/)[0].replace(/[.,!?;:]+$/, '').toLowerCase();
      if (!properNouns.has(firstWord)) {
        result.capitalization.push(
          `«${t.slice(0, 30)}…» — предложение начинается с маленькой буквы.`
        );
      }
    }
    if (!/[.!?]$/.test(t)) {
      result.punctuation.push(
        `«${t.slice(0, 30)}…» — нет знака препинания в конце.`
      );
    }
  }

  const words = text.split(/\s+/);
  const seen = new Set<string>();

  for (let i = 0; i < words.length; i++) {
    const raw = words[i].replace(/[.,!?;:]+$/, '');
    const lower = raw.toLowerCase();
    if (lower.length < 2) continue;

    if (properNouns.has(lower) && raw[0] === raw[0].toLowerCase() && !seen.has(lower + ':cap')) {
      const cap = raw[0].toUpperCase() + raw.slice(1);
      result.capitalization.push(`«${raw}» — имя собственное, пишется с большой буквы: «${cap}».`);
      seen.add(lower + ':cap');
    }

    if (!seen.has(lower)) {
      const direct = misspellings[lower];
      if (direct) {
        result.spelling.push({ word: raw, correction: direct.correct, explanation: direct.explanation });
        seen.add(lower);
      } else if (lower.length >= 5) {
        let best: { correct: string; explanation: string; dist: number } | null = null;
        for (const [key, entry] of Object.entries(misspellings)) {
          if (Math.abs(key.length - lower.length) > 1) continue;
          const dist = levenshtein(lower, key);
          if (dist !== 1) continue;
          const corrDist = levenshtein(lower, entry.correct.toLowerCase());
          if (corrDist > 1) continue;
          if (!best) {
            best = { correct: entry.correct, explanation: entry.explanation, dist };
          }
        }
        if (best && best.correct.toLowerCase() !== lower) {
          result.spelling.push({ word: raw, correction: best.correct, explanation: best.explanation });
          seen.add(lower);
        }
      }
    }

    if (i > 0) {
      const prevLower = words[i - 1].replace(/[.,!?;:]+$/, '').toLowerCase();
      if (lower === prevLower && lower.length > 2 && !seen.has(lower + ':rep')) {
        result.repetitions.push(`Слово «${lower}» повторяется подряд.`);
        seen.add(lower + ':rep');
      }
    }
  }

  if (/жы|шы/i.test(text)) result.rules.push('Жи-ши пиши с буквой «и».');
  if (/чя|щя/i.test(text)) result.rules.push('Ча-ща пиши с буквой «а».');
  if (/чю|щю/i.test(text)) result.rules.push('Чу-щу пиши с буквой «у».');

  return result;
}

export function formatErrors(r: AnalysisResult): string {
  const sections: string[] = [];
  const total = r.spelling.length + r.capitalization.length + r.punctuation.length
    + r.repetitions.length + r.rules.length;

  if (total === 0) return 'Явных ошибок не найдено — молодец!';

  if (r.spelling.length > 0) {
    sections.push('Орфография:');
    r.spelling.forEach((e, i) =>
      sections.push(`${i + 1}. «${e.word}» → «${e.correction}» — ${e.explanation}`)
    );
  }
  if (r.capitalization.length > 0) {
    if (sections.length) sections.push('');
    sections.push('Заглавные буквы:');
    r.capitalization.forEach((e, i) => sections.push(`${i + 1}. ${e}`));
  }
  if (r.punctuation.length > 0) {
    if (sections.length) sections.push('');
    sections.push('Знаки препинания:');
    r.punctuation.forEach((e, i) => sections.push(`${i + 1}. ${e}`));
  }
  if (r.repetitions.length > 0) {
    if (sections.length) sections.push('');
    sections.push('Повторы:');
    r.repetitions.forEach((e, i) => sections.push(`${i + 1}. ${e}`));
  }
  if (r.rules.length > 0) {
    if (sections.length) sections.push('');
    sections.push('Правила:');
    r.rules.forEach((e, i) => sections.push(`${i + 1}. ${e}`));
  }

  return sections.join('\n');
}

export function formatRecommendations(r: AnalysisResult): string {
  const recs: string[] = [];
  const total = r.spelling.length + r.capitalization.length + r.punctuation.length
    + r.repetitions.length + r.rules.length;

  if (total === 0) {
    return '1. Явных ошибок не найдено — молодец!\n2. Перечитай текст вслух для финальной проверки.';
  }

  if (r.spelling.length > 0) {
    recs.push('Проверь выделенные слова — подбери проверочное слово или вспомни правило.');
    for (const e of r.spelling) {
      recs.push(`Запомни: «${e.correction}». ${e.explanation}`);
    }
  }
  if (r.capitalization.length > 0) {
    recs.push('Предложение начинается с большой буквы, имена пишутся с большой буквы.');
  }
  if (r.punctuation.length > 0) {
    recs.push('В конце каждого предложения ставь точку, вопросительный или восклицательный знак.');
  }
  if (r.repetitions.length > 0) {
    recs.push('Перечитай текст вслух — повторы легче заметить на слух.');
  }
  if (r.rules.length > 0) {
    recs.push('Повтори правила: жи-ши с «и», ча-ща с «а», чу-щу с «у».');
  }

  return recs.map((r, i) => `${i + 1}. ${r}`).join('\n');
}
