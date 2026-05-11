import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Русский Репетитор 2 класс',
  description: 'Дружелюбный помощник по русскому языку для второго класса',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
