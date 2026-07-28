import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, 'data', 'publish-log.json');

async function ensureLogFile() {
  await mkdir(join(__dirname, 'data'), { recursive: true });
  if (!existsSync(LOG_FILE)) {
    await writeFile(LOG_FILE, JSON.stringify({ publications: [] }, null, 2));
  }
}

export async function logPublication(post, result) {
  await ensureLogFile();
  const log = JSON.parse(await readFile(LOG_FILE, 'utf-8'));

  log.publications.push({
    post_id: post.id,
    date: post.date,
    type: post.type,
    topic: post.topic,
    published_at: new Date().toISOString(),
    message_id: result.messageId || null,
    success: result.published,
    error: result.error || null,
    text_length: result.text?.length || 0,
    has_image: !!result.imagePath,
  });

  await writeFile(LOG_FILE, JSON.stringify(log, null, 2));
  console.log(`[LOG] Запись: ${post.id} — ${result.published ? 'опубликован' : 'ошибка'}`);
}

export async function getPublicationLog() {
  await ensureLogFile();
  return JSON.parse(await readFile(LOG_FILE, 'utf-8'));
}

export async function getPublishedIds() {
  const log = await getPublicationLog();
  return new Set(log.publications.filter(p => p.success).map(p => p.post_id));
}
