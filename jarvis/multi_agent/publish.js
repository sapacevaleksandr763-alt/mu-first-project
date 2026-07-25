import 'dotenv/config';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tgRequest(method, body, isMultipart = false) {
  const url = `${TG_API}/${method}`;
  const options = { method: 'POST' };

  if (isMultipart) {
    options.body = body;
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description} (${data.error_code})`);
  }
  return data.result;
}

export async function sendTextPost(text, channelId = CHANNEL_ID) {
  console.log(`Отправка текста в ${channelId}...`);

  const result = await tgRequest('sendMessage', {
    chat_id: channelId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  console.log(`Пост отправлен. Message ID: ${result.message_id}`);
  return result;
}

export async function sendPhotoPost(imagePath, caption, channelId = CHANNEL_ID) {
  console.log(`Отправка фото + текст в ${channelId}...`);

  const formData = new FormData();
  formData.append('chat_id', channelId);

  if (caption) {
    const trimmed = caption.length > 1024 ? caption.slice(0, 1021) + '...' : caption;
    formData.append('caption', trimmed);
    formData.append('parse_mode', 'HTML');
  }

  const imageBuffer = await readFile(imagePath);
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('photo', blob, 'post-image.png');

  const result = await tgRequest('sendPhoto', formData, true);
  console.log(`Фото-пост отправлен. Message ID: ${result.message_id}`);
  return result;
}

export async function publishPost({ text, imagePath, channelId = CHANNEL_ID }) {
  if (imagePath && existsSync(imagePath)) {
    const captionLimit = 1024;
    if (text.length <= captionLimit) {
      return sendPhotoPost(imagePath, text, channelId);
    }
    await sendPhotoPost(imagePath, null, channelId);
    return sendTextPost(text, channelId);
  }
  return sendTextPost(text, channelId);
}

// Запуск напрямую: node publish.js <text-file> [image-file]
const isMain = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const textFile = process.argv[2];
  const imageFile = process.argv[3];

  if (!textFile) {
    console.error('Использование: node publish.js <text-file> [image-file]');
    process.exit(1);
  }

  const text = await readFile(textFile, 'utf-8');
  publishPost({ text, imagePath: imageFile }).catch(console.error);
}
