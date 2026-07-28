import 'dotenv/config';
import cron from 'node-cron';
import { runTodaysPosts, runFunnel, runDigest, runWeeklyReport } from './pipeline.js';
import { runMonthEndAnalytics } from './analytics.js';

function getMoscowTime() {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}

function isLastSundayOfMonth() {
  const now = new Date();
  const moscowDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const day = moscowDate.getDay();
  const date = moscowDate.getDate();
  const lastDay = new Date(moscowDate.getFullYear(), moscowDate.getMonth() + 1, 0).getDate();
  return day === 0 && date > lastDay - 7;
}

console.log(`
╔══════════════════════════════════════════════════╗
║  НАСЛЕДИЕ АРИЕВ — Контент-автомат v3.0          ║
║  Канал: @nasledieariev | Бот: mil_bot           ║
║                                                  ║
║  Пн 10:00 — инфо-пост → 12:00 видео            ║
║  Ср 10:00 — визуал → 12:00 лид-магнит          ║
║  Чт 18:00 — автоворонка (3 поста)               ║
║  Пт 10:00 — практика → 12:00 видео             ║
║  Сб 12:00 — дайджест новинок                     ║
║  Вс 20:00 — отчёт владельцу в mil_bot           ║
╚══════════════════════════════════════════════════╝
`);
console.log(`Запуск: ${getMoscowTime()} МСК`);

// Пн/Ср/Пт 10:00 МСК (07:00 UTC) — основные посты + видео/лид-магнит
const PUBLISH_CRON = '0 7 * * 1,3,5';
cron.schedule(PUBLISH_CRON, async () => {
  console.log(`\n[CRON] ${getMoscowTime()} — публикация основного поста`);
  try {
    const results = await runTodaysPosts();
    const published = results.filter(r => r.published).length;
    console.log(`[CRON] Результат: ${published} опубликовано`);
  } catch (err) {
    console.error(`[CRON] Ошибка: ${err.message}`);
  }
}, { timezone: 'Europe/Moscow' });

// Чт 18:00 МСК (15:00 UTC) — автоворонка
const FUNNEL_CRON = '0 15 * * 4';
cron.schedule(FUNNEL_CRON, async () => {
  console.log(`\n[CRON] ${getMoscowTime()} — запуск автоворонки`);
  try {
    await runFunnel();
    console.log(`[CRON] Автоворонка завершена`);
  } catch (err) {
    console.error(`[CRON] Ошибка воронки: ${err.message}`);
  }
}, { timezone: 'Europe/Moscow' });

// Сб 12:00 МСК (09:00 UTC) — дайджест новинок за неделю
const DIGEST_CRON = '0 9 * * 6';
cron.schedule(DIGEST_CRON, async () => {
  console.log(`\n[CRON] ${getMoscowTime()} — субботний дайджест`);
  try {
    await runDigest();
    console.log(`[CRON] Дайджест опубликован`);
  } catch (err) {
    console.error(`[CRON] Ошибка дайджеста: ${err.message}`);
  }
}, { timezone: 'Europe/Moscow' });

// Вс 10:00 МСК — вовлечение (engagement пост в канал)
const ENGAGE_CRON = '0 7 * * 0';
cron.schedule(ENGAGE_CRON, async () => {
  console.log(`\n[CRON] ${getMoscowTime()} — вовлекающий пост`);
  try {
    const results = await runTodaysPosts();
    const published = results.filter(r => r.published).length;
    console.log(`[CRON] Вовлечение: ${published} опубликовано`);
  } catch (err) {
    console.error(`[CRON] Ошибка: ${err.message}`);
  }
}, { timezone: 'Europe/Moscow' });

// Вс 20:00 МСК (17:00 UTC) — отчёт владельцу в mil_bot
const REPORT_CRON = '0 17 * * 0';
cron.schedule(REPORT_CRON, async () => {
  console.log(`\n[CRON] ${getMoscowTime()} — еженедельный отчёт владельцу`);
  try {
    await runWeeklyReport();
    console.log(`[CRON] Отчёт отправлен`);
  } catch (err) {
    console.error(`[CRON] Ошибка отчёта: ${err.message}`);
  }
}, { timezone: 'Europe/Moscow' });

// Конец месяца — аналитика + новый план
const ANALYTICS_CRON = '0 8 28-31 * *';
cron.schedule(ANALYTICS_CRON, async () => {
  if (!isLastSundayOfMonth()) return;
  console.log(`\n[ANALYTICS] ${getMoscowTime()} — месячная аналитика`);
  try {
    await runMonthEndAnalytics();
    console.log('[ANALYTICS] Новый план сгенерирован');
  } catch (err) {
    console.error(`[ANALYTICS] Ошибка: ${err.message}`);
  }
}, { timezone: 'Europe/Moscow' });

// Heartbeat каждые 6 часов
cron.schedule('0 */6 * * *', () => {
  console.log(`[HEARTBEAT] ${getMoscowTime()} — система работает`);
});

console.log(`Cron: Пн/Ср/Пт=${PUBLISH_CRON} | Чт=${FUNNEL_CRON} | Сб=${DIGEST_CRON} | Вс=${ENGAGE_CRON}+${REPORT_CRON}`);
console.log(`Аналитика: ${ANALYTICS_CRON}`);
console.log('Scheduler запущен.\n');
