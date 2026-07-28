import 'dotenv/config';
import { readFile, writeFile, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPublicationLog } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAN_FILE = join(__dirname, 'data', 'content-plan.json');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || null;

const SITE_PAGES = [
  'pages/gods.html', 'pages/runes.html', 'pages/traditions.html',
  'pages/calendar.html', 'pages/quiz-chertog.html', 'pages/god-patron.html',
  'pages/obereg.html', 'pages/rune-reading.html', 'pages/bukvica.html',
  'pages/prazdniki.html', 'pages/obryady.html', 'pages/history.html',
  'pages/vedas.html', 'pages/oberegi-catalog.html', 'pages/creatures.html',
  'pages/gallery.html', 'index.html',
];

async function getMessageViews(messageId) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHANNEL_ID }),
    });
    const data = await res.json();
    return data.ok ? data.result.active_usernames?.length || 0 : 0;
  } catch {
    return 0;
  }
}

async function getChannelMemberCount() {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHANNEL_ID }),
    });
    const data = await res.json();
    return data.ok ? data.result : 0;
  } catch {
    return 0;
  }
}

async function generateMonthReport(log, memberCount) {
  const monthPubs = log.publications.filter(p => p.success);
  const totalPosts = monthPubs.length;
  const avgLength = totalPosts > 0
    ? Math.round(monthPubs.reduce((s, p) => s + p.text_length, 0) / totalPosts)
    : 0;
  const withImages = monthPubs.filter(p => p.has_image).length;
  const errors = log.publications.filter(p => !p.success).length;

  const byType = {};
  for (const p of monthPubs) {
    byType[p.type] = (byType[p.type] || 0) + 1;
  }

  return `📊 <b>Отчёт за месяц — @nasledieariev</b>

Подписчиков: <b>${memberCount}</b>
Постов опубликовано: <b>${totalPosts}</b>
С картинками: <b>${withImages}</b>
Средняя длина: <b>${avgLength}</b> символов
Ошибок: <b>${errors}</b>

По типам:
${Object.entries(byType).map(([t, c]) => `• ${t}: ${c}`).join('\n')}

Новый контент-план сгенерирован автоматически.`;
}

async function generateNewPlan(log) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const startStr = nextMonth.toISOString().split('T')[0];
  const endStr = endMonth.toISOString().split('T')[0];

  const prevPlan = JSON.parse(await readFile(PLAN_FILE, 'utf-8'));
  const prevTopics = prevPlan.posts.map(p => p.topic).join('\n');

  const prompt = `Ты составляешь контент-план для Telegram-канала о славянской ведической культуре (@nasledieariev).

Период: ${startStr} — ${endStr}
Расписание: Пн, Ср, Пт, Вс — по 1 посту в 10:00 МСК

Типы постов:
- Пн: info (информационный пост-статья)
- Ср: visual (визуальная карточка/инфографика)
- Пт: practice (обряд, практика, руна дня)
- Вс: engagement (опрос, обсуждение, CTA)

Темы канала: славянские боги, руны, обереги, обряды, праздники, Буквица, славянский календарь, Веды, мифология, практики.

Предыдущие темы (НЕ повторяй):
${prevTopics}

Страницы сайта для CTA (выбирай релевантные):
${SITE_PAGES.join('\n')}

Базовый URL сайта: http://155.212.208.32

Тон: мудрый наставник — глубокий, спокойный, с отсылками к традиции.

Сгенерируй JSON-массив постов. Каждый пост:
{
  "id": "w1-mon" (wN-day формат),
  "date": "YYYY-MM-DD",
  "day": "Пн/Ср/Пт/Вс",
  "time": "10:00",
  "type": "info/visual/practice/engagement",
  "topic": "Подробная тема поста (2-3 предложения)",
  "cta_page": "pages/xxx.html",
  "cta_text": "Текст CTA",
  "hashtags": ["#тег1", "#тег2", "#наследиеариев"],
  "image_style": "Описание изображения для DALL-E (1 предложение)",
  "status": "pending"
}

Верни ТОЛЬКО JSON-массив, без обёрток и пояснений.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: 'Ты генератор контент-планов. Отвечай ТОЛЬКО валидным JSON-массивом.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Claude API error: ${data.error.message}`);

  let postsJson = data.content[0].text.trim();
  if (postsJson.startsWith('```')) {
    postsJson = postsJson.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  const posts = JSON.parse(postsJson);

  const newPlan = {
    period: `${startStr} — ${endStr}`,
    generated_at: new Date().toISOString(),
    channel: '@nasledieariev',
    site_base_url: 'http://155.212.208.32',
    tone: 'Мудрый наставник — глубокий, спокойный, с отсылками к первоисточникам',
    posts,
  };

  return newPlan;
}

async function sendReportToOwner(reportText) {
  if (!OWNER_CHAT_ID) {
    console.log('[ANALYTICS] OWNER_CHAT_ID не задан, отчёт не отправлен в личку');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      text: reportText,
      parse_mode: 'HTML',
    }),
  });
  console.log('[ANALYTICS] Отчёт отправлен владельцу');
}

export async function runMonthEndAnalytics() {
  console.log('[ANALYTICS] Начинаю месячную аналитику...');

  // 1. Собираем метрики
  const log = await getPublicationLog();
  const memberCount = await getChannelMemberCount();
  console.log(`[ANALYTICS] Подписчиков: ${memberCount}`);
  console.log(`[ANALYTICS] Публикаций в логе: ${log.publications.length}`);

  // 2. Генерируем отчёт
  const report = await generateMonthReport(log, memberCount);
  console.log('[ANALYTICS] Отчёт сгенерирован');

  // 3. Архивируем текущий план
  const archiveName = `content-plan-${new Date().toISOString().split('T')[0]}.json`;
  await copyFile(PLAN_FILE, join(__dirname, 'data', archiveName));
  console.log(`[ANALYTICS] Текущий план архивирован: ${archiveName}`);

  // 4. Генерируем новый план
  const newPlan = await generateNewPlan(log);
  await writeFile(PLAN_FILE, JSON.stringify(newPlan, null, 2));
  console.log(`[ANALYTICS] Новый план: ${newPlan.period} (${newPlan.posts.length} постов)`);

  // 5. Отправляем отчёт владельцу
  await sendReportToOwner(report);

  return { report, newPlan };
}

const isMain = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  runMonthEndAnalytics().catch(console.error);
}
