import Link from 'next/link';
import { ModeCard } from '@/components/ModeCard';

const modes = [
  { title: 'Объяснить тему', description: 'Простое объяснение темы для 2 класса.', href: '/modes/explain-topic' },
  { title: 'Сделать упражнение', description: 'Решаем задание шаг за шагом.', href: '/modes/exercise' },
  { title: 'Помочь с сочинением', description: 'Помощь в выборе темы и написании.', href: '/modes/write-essay' },
  { title: 'Проверить по фото', description: 'Проверка сочинения по фото или вручную с разбором ошибок.', href: '/modes/photo-check' },
  { title: 'Словарный диктант', description: 'Тренировка слов и правописания.', href: '/modes/vocab-dictation' },
  { title: 'Тест по теории', description: 'Короткий тест по правилам языка.', href: '/modes/theory-test' },
];

export default function ModesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
          <Link href="/" className="text-sm font-semibold text-brand-700 hover:underline">← Назад на главную</Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Режимы занятий</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Выбирай, что хочешь делать сегодня: объяснение темы, упражнение или творческое задание.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/lesson" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
              Перейти к уроку
            </Link>
            <p className="text-sm text-slate-500">Если хочешь, можно сразу перейти на страницу урока и задать вопрос репетитору.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode) => (
            <ModeCard key={mode.title} title={mode.title} description={mode.description} href={mode.href} />
          ))}
        </div>
      </div>
    </main>
  );
}
