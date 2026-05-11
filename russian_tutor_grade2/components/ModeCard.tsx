import Link from 'next/link';

interface ModeCardProps {
  title: string;
  description: string;
  href: string;
}

export function ModeCard({ title, description, href }: ModeCardProps) {
  return (
    <Link href={href} className="group block rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50">
      <h3 className="text-xl font-semibold text-slate-900 transition group-hover:text-brand-700">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}
