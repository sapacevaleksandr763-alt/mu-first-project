import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from './generate-image.js';
import { publishPost } from './publish.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadPost(postPath) {
  const content = await readFile(postPath, 'utf-8');

  const textMatch = content.match(/## Текст поста \(скопируй и отправь\)\s*\n([\s\S]*?)\n---\s*\n## DALL-E/);
  const promptMatch = content.match(/## DALL-E промпт[\s\S]*?```\n([\s\S]*?)\n```/);

  let text = textMatch ? textMatch[1].trim() : null;

  if (!text) {
    const lines = content.split('\n');
    const start = lines.findIndex(l => l.includes('95%'));
    const end = lines.findIndex((l, i) => i > start && l.startsWith('## DALL-E'));
    if (start !== -1 && end !== -1) {
      text = lines.slice(start, end).join('\n').replace(/\n---\s*$/, '').trim();
    } else {
      text = content.trim();
    }
  }

  const dallePrompt = promptMatch ? promptMatch[1].trim() : null;

  return { text, dallePrompt };
}

async function pipeline(postPath, options = {}) {
  const { skipImage = false, skipPublish = false, dryRun = false } = options;

  console.log('=== МУЛЬТИАГЕНТНЫЙ ПАЙПЛАЙН ===\n');

  // 1. Загрузка поста
  console.log('[1/4] Загрузка финального поста...');
  const { text, dallePrompt } = await loadPost(postPath);
  console.log(`     Текст: ${text.length} символов`);
  console.log(`     DALL-E промпт: ${dallePrompt ? 'найден' : 'не найден'}`);

  // 2. Генерация картинки
  let imagePath = null;

  if (!skipImage && dallePrompt) {
    console.log('\n[2/4] Генерация изображения...');
    try {
      imagePath = await generateImage(dallePrompt);
      if (imagePath) {
        console.log(`     Картинка: ${imagePath}`);
      } else {
        console.log('     Картинка не сгенерирована (проблема с API). Промпт выведен выше для ручной генерации.');
      }
    } catch (err) {
      console.error(`     Ошибка генерации: ${err.message}`);
      console.log('     Продолжаю без картинки.');
    }
  } else {
    console.log('\n[2/4] Генерация изображения — пропущена');
    if (dallePrompt) {
      console.log('     Промпт для ручной генерации:');
      console.log(`     ${dallePrompt.slice(0, 100)}...`);
    }
  }

  // 3. Превью
  console.log('\n[3/4] Превью поста:');
  console.log('─'.repeat(50));
  console.log(text);
  console.log('─'.repeat(50));
  if (imagePath) console.log(`📷 Картинка: ${imagePath}`);
  console.log();

  // 4. Публикация
  if (dryRun) {
    console.log('[4/4] Dry run — публикация пропущена');
    console.log('\n=== ПАЙПЛАЙН ЗАВЕРШЁН (dry run) ===');
    return { text, imagePath, published: false };
  }

  if (skipPublish) {
    console.log('[4/4] Публикация — пропущена');
    console.log('\n=== ПАЙПЛАЙН ЗАВЕРШЁН (без публикации) ===');
    return { text, imagePath, published: false };
  }

  console.log('[4/4] Публикация в Telegram...');
  try {
    const result = await publishPost({ text, imagePath });
    console.log(`     Опубликовано! Message ID: ${result.message_id}`);
    console.log('\n=== ПАЙПЛАЙН ЗАВЕРШЁН ===');
    return { text, imagePath, published: true, messageId: result.message_id };
  } catch (err) {
    console.error(`     Ошибка публикации: ${err.message}`);
    console.log('\n=== ПАЙПЛАЙН ЗАВЕРШЁН С ОШИБКОЙ ===');
    return { text, imagePath, published: false, error: err.message };
  }
}

// Запуск: node pipeline.js <post-file> [--skip-image] [--skip-publish] [--dry-run]
const isMain = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const args = process.argv.slice(2);
  const postFile = args.find(a => !a.startsWith('--')) || join(__dirname, '..', 'content', 'reports', '05-final-post.md');

  const options = {
    skipImage: args.includes('--skip-image'),
    skipPublish: args.includes('--skip-publish'),
    dryRun: args.includes('--dry-run'),
  };

  pipeline(postFile, options).catch(console.error);
}

export { pipeline };
