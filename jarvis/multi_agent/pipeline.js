import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePostText, generateImagePrompt, generateFunnelText } from './content-generator.js';
import { generateImage } from './generate-image.js';
import { publishPost, sendTextPost, sendVideoPost } from './publish.js';
import { logPublication, getPublishedIds, getPublicationLog } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAN_FILE = join(__dirname, 'data', 'content-plan.json');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID;

function getMoscowDate() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
}

async function loadPlan() {
  const raw = await readFile(PLAN_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function updatePostStatus(postId, status) {
  const plan = await loadPlan();
  const post = plan.posts.find(p => p.id === postId);
  if (post) {
    post.status = status;
    await writeFile(PLAN_FILE, JSON.stringify(plan, null, 2));
  }
}

function scheduleDelayed(fn, delayHours) {
  const ms = delayHours * 60 * 60 * 1000;
  const fireAt = new Date(Date.now() + ms).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' });
  console.log(`      Запланировано через ${delayHours}ч (${fireAt} МСК)`);
  setTimeout(async () => {
    try { await fn(); } catch (err) { console.error(`[DELAYED] Ошибка: ${err.message}`); }
  }, ms);
}

function delayMinutes(min) {
  return new Promise(r => setTimeout(r, min * 60 * 1000));
}

async function sendToOwner(text) {
  if (!OWNER_CHAT_ID || !BOT_TOKEN) {
    console.log('[OWNER] OWNER_CHAT_ID не задан');
    return;
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text, parse_mode: 'HTML' }),
  });
  console.log('[OWNER] Сообщение отправлено владельцу');
}

async function sendVideoFollow(post) {
  const vf = post.video_follow;
  const videoPath = join(__dirname, '..', vf.video_file);
  if (!existsSync(videoPath)) {
    console.error(`[VIDEO] Файл не найден: ${videoPath}`);
    return;
  }
  console.log(`[VIDEO] Отправка: ${vf.video_file}`);
  await sendVideoPost(videoPath, vf.caption);
  console.log(`[VIDEO] Видео отправлено`);
}

async function sendLeadMagnet(post) {
  console.log(`[LEAD-MAGNET] Отправка`);
  await sendTextPost(post.lead_magnet.text);
  console.log(`[LEAD-MAGNET] Отправлен`);
}

// ═══ Основной пайплайн одного поста ═══

export async function runPipeline(post, options = {}) {
  const { skipImage = false, dryRun = false } = options;

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`ПАЙПЛАЙН: ${post.id} | ${post.date} (${post.day})`);
  console.log(`Тема: ${post.topic.slice(0, 60)}...`);
  console.log(`${'═'.repeat(50)}\n`);

  console.log('[1/4] Генерация текста...');
  let text;
  try {
    text = await generatePostText(post);
    console.log(`      Текст: ${text.length} символов`);
  } catch (err) {
    console.error(`      ОШИБКА: ${err.message}`);
    await logPublication(post, { published: false, error: err.message });
    await updatePostStatus(post.id, 'error');
    return { published: false, error: err.message };
  }

  let imagePath = null;
  if (!skipImage) {
    console.log('[2/4] Генерация изображения...');
    try {
      const dallePrompt = await generateImagePrompt(post);
      imagePath = await generateImage(dallePrompt);
      if (imagePath) console.log(`      Картинка: ${imagePath}`);
      else console.log('      Без картинки.');
    } catch (err) {
      console.error(`      Ошибка картинки: ${err.message}`);
    }
  } else {
    console.log('[2/4] Изображение — пропущено');
  }

  console.log('\n[3/4] Превью:');
  console.log('─'.repeat(50));
  console.log(text);
  console.log('─'.repeat(50));

  if (dryRun) {
    console.log('[4/4] Dry run — пропущено');
    if (post.video_follow) console.log(`      [DRY] Видео через ${post.video_follow.delay_hours}ч`);
    if (post.lead_magnet) console.log(`      [DRY] Лид-магнит через ${post.lead_magnet.delay_hours}ч`);
    if (post.weekly_report) console.log(`      [DRY] Отчёт через 3ч`);
    if (post.type === 'funnel') console.log(`      [DRY] Автоворонка: ${post.funnel_parts} поста`);
    await logPublication(post, { text, published: false });
    return { published: false, text };
  }

  console.log('[4/4] Публикация...');
  try {
    const tgResult = await publishPost({ text, imagePath });
    console.log(`      Опубликовано! Message ID: ${tgResult.message_id}`);
    const result = { text, imagePath, published: true, messageId: tgResult.message_id };
    await logPublication(post, result);
    await updatePostStatus(post.id, 'published');

    // Отложенные задачи
    if (post.video_follow) {
      console.log(`\n[+] Видео: ${post.video_follow.video_file} через ${post.video_follow.delay_hours}ч`);
      scheduleDelayed(() => sendVideoFollow(post), post.video_follow.delay_hours);
    }
    if (post.lead_magnet) {
      console.log(`[+] Лид-магнит через ${post.lead_magnet.delay_hours}ч`);
      scheduleDelayed(() => sendLeadMagnet(post), post.lead_magnet.delay_hours);
    }

    await sendToOwner(`✅ Пост опубликован [${post.type}]:\n\n${text.slice(0, 300)}...`);
    return result;
  } catch (err) {
    console.error(`      Ошибка: ${err.message}`);
    const result = { text, imagePath, published: false, error: err.message };
    await logPublication(post, result);
    await updatePostStatus(post.id, 'error');
    await sendToOwner(`❌ Ошибка публикации [${post.id}]: ${err.message}`);
    return result;
  }
}

// ═══ Запуск постов на сегодня (Пн/Ср/Пт/Вс) ═══

export async function runTodaysPosts(options = {}) {
  const plan = await loadPlan();
  const today = getMoscowDate();
  const publishedIds = await getPublishedIds();

  const todayPosts = plan.posts.filter(p =>
    p.date === today && !publishedIds.has(p.id) && p.type !== 'funnel'
  );

  if (todayPosts.length === 0) {
    console.log(`[${today}] Нет постов на сегодня.`);
    return [];
  }

  console.log(`[${today}] Постов: ${todayPosts.length}`);
  const results = [];
  for (const post of todayPosts) {
    const result = await runPipeline(post, options);
    results.push(result);
  }
  return results;
}

// ═══ Автоворонка (Чт 18:00) — 3 поста с интервалом 30 мин ═══

export async function runFunnel(options = {}) {
  const plan = await loadPlan();
  const today = getMoscowDate();
  const publishedIds = await getPublishedIds();

  const funnelPost = plan.posts.find(p =>
    p.date === today && p.type === 'funnel' && !publishedIds.has(p.id)
  );

  if (!funnelPost) {
    console.log(`[${today}] Нет автоворонки на сегодня.`);
    return;
  }

  const parts = funnelPost.funnel_parts || 3;
  const delayMin = funnelPost.funnel_delay_min || 30;

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`АВТОВОРОНКА: ${funnelPost.topic}`);
  console.log(`${parts} поста, интервал ${delayMin} мин`);
  console.log(`${'═'.repeat(50)}\n`);

  const FUNNEL_PROMPTS = [
    `Напиши ПЕРВЫЙ пост автоворонки (серия из ${parts}). Тема: ${funnelPost.topic}.\n\nЭто пост-ИНТРИГА: хук, вопрос, проблема. Длина 200-400 символов. Заканчивай словами "Продолжение следует..." или "Подробности — в следующем посте".`,
    `Напиши ВТОРОЙ пост автоворонки (серия из ${parts}). Тема: ${funnelPost.topic}.\n\nЭто пост-ЦЕННОСТЬ: факты, знания, раскрытие темы. Длина 400-700 символов. Интересные детали и исторические факты.`,
    `Напиши ТРЕТИЙ пост автоворонки (серия из ${parts}). Тема: ${funnelPost.topic}.\n\nЭто пост-CTA: итог серии + призыв к действию. Длина 300-500 символов. CTA: перейти на сайт http://155.212.208.32/${funnelPost.cta_page} или подписаться на @nasledieariev`,
  ];

  if (options.dryRun) {
    console.log(`[DRY] Автоворонка: ${parts} поста, темы генерировались бы через Claude`);
    await updatePostStatus(funnelPost.id, 'pending');
    return;
  }

  for (let i = 0; i < parts; i++) {
    console.log(`\n[ВОРОНКА ${i + 1}/${parts}] Генерация...`);
    try {
      const text = await generateFunnelText(FUNNEL_PROMPTS[i], funnelPost);
      console.log(`      Текст: ${text.length} символов`);
      console.log('─'.repeat(40));
      console.log(text);
      console.log('─'.repeat(40));

      await sendTextPost(text);
      console.log(`      ✅ Пост ${i + 1}/${parts} опубликован`);
    } catch (err) {
      console.error(`      ❌ Ошибка: ${err.message}`);
    }

    if (i < parts - 1) {
      console.log(`      Пауза ${delayMin} мин...`);
      await delayMinutes(delayMin);
    }
  }

  await updatePostStatus(funnelPost.id, 'published');
  await logPublication(funnelPost, { published: true, text: `Автоворонка: ${parts} поста` });
  await sendToOwner(`✅ Автоворонка опубликована: "${funnelPost.topic}" (${parts} поста)`);
  console.log(`\n✅ Автоворонка завершена`);
}

// ═══ Субботний дайджест (Сб 12:00) ═══

export async function runDigest(options = {}) {
  const { dryRun = false } = options;
  const plan = await loadPlan();
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const weekPosts = plan.posts.filter(p =>
    p.status === 'published' && new Date(p.date) >= weekAgo && new Date(p.date) <= now
  );

  if (weekPosts.length === 0) {
    console.log('[DIGEST] Нет опубликованных постов за неделю');
    return;
  }

  const topicsList = weekPosts.map(p => `• ${p.topic.slice(0, 60)}`).join('\n');
  const text = `📋 <b>Дайджест недели — @nasledieariev</b>

На этой неделе мы разобрали:

${topicsList}

Если пропустили что-то — самое время прочитать. Все темы доступны в канале.

🔗 Заходите на сайт:
http://155.212.208.32

#дайджест #наследиеариев`;

  console.log(`[DIGEST] Дайджест: ${weekPosts.length} постов за неделю`);

  if (dryRun) {
    console.log('[DIGEST] Dry run:');
    console.log(text);
    return;
  }

  await sendTextPost(text);
  await sendToOwner(`📋 Дайджест опубликован (${weekPosts.length} постов за неделю)`);
  console.log('[DIGEST] Дайджест опубликован');
}

// ═══ Еженедельный отчёт владельцу (Вс 20:00) ═══

export async function runWeeklyReport() {
  console.log(`\n[REPORT] Генерация еженедельного отчёта...`);
  const log = await getPublicationLog();

  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekPubs = log.publications.filter(p => new Date(p.published_at) >= weekAgo);
  const success = weekPubs.filter(p => p.success);
  const errors = weekPubs.filter(p => !p.success);

  const byType = {};
  for (const p of success) {
    byType[p.type] = (byType[p.type] || 0) + 1;
  }

  const report = `📊 <b>Еженедельный отчёт — @nasledieariev</b>
<i>${weekAgo.toLocaleDateString('ru-RU')} — ${now.toLocaleDateString('ru-RU')}</i>

Опубликовано: <b>${success.length}</b> постов
Ошибок: <b>${errors.length}</b>

<b>По типам:</b>
${Object.entries(byType).map(([t, c]) => `• ${t}: ${c}`).join('\n') || '• нет данных'}

${errors.length > 0 ? `\n<b>Ошибки:</b>\n${errors.map(e => `• ${e.post_id}: ${e.error}`).join('\n')}` : ''}

<b>Темы недели:</b>
${success.map(p => `• ${p.topic?.slice(0, 50) || p.post_id}`).join('\n') || '• нет данных'}

Следующая неделя — новые темы. Система работает в автоматическом режиме. ✨`;

  await sendToOwner(report);
  console.log(`[REPORT] Отчёт отправлен владельцу`);
}

// ═══ CLI ═══

const isMain = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipImage = args.includes('--skip-image');
  const postId = args.find(a => !a.startsWith('--'));

  if (postId === 'funnel') {
    await runFunnel({ dryRun });
  } else if (postId === 'digest') {
    await runDigest({ dryRun });
  } else if (postId === 'report') {
    await runWeeklyReport();
  } else if (postId) {
    const plan = await loadPlan();
    const post = plan.posts.find(p => p.id === postId);
    if (!post) { console.error(`Пост ${postId} не найден.`); process.exit(1); }
    await runPipeline(post, { dryRun, skipImage });
  } else {
    await runTodaysPosts({ dryRun, skipImage });
  }
}
