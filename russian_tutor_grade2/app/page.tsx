import Link from 'next/link';
import { ModeCard } from '@/components/ModeCard';

const modes = [
  { title: 'Объяснить тему', description: 'Коротко и просто о правилах русского языка.', href: '/modes/explain-topic' },
  { title: 'Сделать упражнение', description: 'Решим задание вместе шаг за шагом.', href: '/modes/exercise' },
  { title: 'Помочь с сочинением', description: 'Подберём тему и напишем текст вместе.', href: '/modes/write-essay' },
  { title: 'Проверить по фото', description: 'Проверка сочинения по фото или вручную с разбором ошибок.', href: '/modes/photo-check' },
  { title: 'Словарный диктант', description: 'Тренируем слова и написание по одному слову.', href: '/modes/vocab-dictation' },
  { title: 'Тест по теории', description: 'Короткие вопросы с ответами и объяснением.', href: '/modes/theory-test' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-soft backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-800">Русский Репетитор 2 класс</span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Учимся весело, просто и понятно</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Добрый помощник для ребёнка и родителя. Здесь объясняем правила, решаем задания и поддерживаем на каждом шаге.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/modes" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700">
                Перейти к уроку
              </Link>
              <p className="text-sm text-slate-500">Выберите режим и начнем вместе.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modes.map((mode) => (
              <ModeCard key={mode.title} title={mode.title} description={mode.description} href={mode.href} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
