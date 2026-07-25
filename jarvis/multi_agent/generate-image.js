import 'dotenv/config';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_PROMPT = `Flat isometric illustration on a deep dark navy background (#0D1B2A). Several interlocking gears that don't mesh properly — their teeth are misaligned, creating visible friction sparks in warm orange and red. The central largest gear contains a glowing AI brain circuit symbol in electric teal (#1B9AAA). Surrounding gears are steel gray, one is rusty, one has a crack, one is missing teeth. Blueprint-style grid lines on the background. Clean vector style, no text, no letters, no words. Color palette: navy, teal, orange, steel gray, soft red accents. Professional tech illustration style suitable for a business blog.`;

export async function generateImage(prompt = DEFAULT_PROMPT, outputPath) {
  const outDir = join(__dirname, 'output');
  await mkdir(outDir, { recursive: true });

  const filename = outputPath || join(outDir, `image-${Date.now()}.png`);

  console.log('Генерация изображения через gpt-image-1...');
  console.log(`Промпт: ${prompt.slice(0, 80)}...`);

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.IMAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1536x1024',
        quality: 'high',
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw { status: res.status, message: data.error.message, code: data.error.code };
    }

    const b64 = data.data[0].b64_json;
    if (b64) {
      const buffer = Buffer.from(b64, 'base64');
      await writeFile(filename, buffer);
    } else if (data.data[0].url) {
      const imgRes = await fetch(data.data[0].url);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      await writeFile(filename, buffer);
    }

    console.log(`Картинка сохранена: ${filename}`);
    return filename;
  } catch (err) {
    const status = err.status || 0;
    const message = err.message || String(err);

    if (status === 401 || status === 429 || err.code === 'insufficient_quota' || err.code === 'billing_hard_limit_reached') {
      console.error(`Ошибка API: ${message}`);
      console.error('Используй промпт вручную на chatgpt.com');
      console.log('\n--- Промпт для ручной генерации ---');
      console.log(prompt);
      console.log('--- Параметры: 1536x1024, high quality ---\n');
      return null;
    }
    console.error(`Ошибка генерации: ${message}`);
    throw err;
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const prompt = process.argv[2] || DEFAULT_PROMPT;
  generateImage(prompt).catch(console.error);
}
