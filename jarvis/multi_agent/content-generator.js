import 'dotenv/config';

const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
const OPENAI_API_KEY = process.env.IMAGE_API_KEY;
const SITE_BASE_URL = 'http://155.212.208.32';

const SYSTEM_PROMPT = `Ты — автор Telegram-канала «Наследие Ариев» о славянской ведической культуре.

Твой тон: мудрый наставник. Глубокий, спокойный, с отсылками к первоисточникам. Как волхв, делящийся знаниями. Без пафоса, без кликбейта. Уважительный к традиции, но доступный современному читателю.

Правила:
- Пиши на русском языке
- Длина поста: 800-1500 символов (не больше)
- Используй абзацы для читаемости
- НЕ используй markdown-разметку (**, ##, []() и т.д.)
- Используй HTML-форматирование для Telegram: <b>жирный</b>, <i>курсив</i>
- В конце поста ВСЕГДА добавляй ссылку на сайт в формате: \\n\\n🔗 CTA_TEXT:\\nCTA_URL
- После ссылки добавляй хэштеги через пробел
- НЕ используй эмодзи в каждом предложении — максимум 2-3 на весь пост
- Пиши так, чтобы человек получил ценность даже без перехода по ссылке`;

const POST_TYPE_PROMPTS = {
  info: 'Напиши информационный пост-статью. Дай глубокий разбор темы с историческим контекстом, интересными фактами и практической ценностью.',
  visual: 'Напиши текст для визуальной карточки/инфографики. Структурированный, с пунктами. Пост должен быть ёмким, запоминающимся, с чёткой структурой.',
  practice: 'Напиши практический пост с конкретным обрядом или практикой. Пошагово, понятно, с уважением к традиции. Человек должен смочь применить это в жизни.',
  engagement: 'Напиши вовлекающий пост — опрос, вопрос аудитории или CTA. Задача — вызвать комментарии и обсуждение. Пост должен заканчиваться вопросом или призывом поделиться мнением.',
};

async function generateViaClaude(userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Claude API error: ${data.error.message}`);
  }

  return data.content[0].text.trim();
}

async function generateViaOpenAI(userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }

  return data.choices[0].message.content.trim();
}

export async function generatePostText(post) {
  const { topic, type, cta_page, cta_text, hashtags } = post;
  const ctaUrl = `${SITE_BASE_URL}/${cta_page}`;
  const hashtagsStr = hashtags.join(' ');

  const userPrompt = `Тема: ${topic}

CTA ссылка: ${ctaUrl}
CTA текст: ${cta_text}
Хэштеги: ${hashtagsStr}

${POST_TYPE_PROMPTS[type] || POST_TYPE_PROMPTS.info}`;

  // Приоритет: Claude (Anthropic) → OpenAI (fallback)
  try {
    console.log('      Генерация через Claude API...');
    return await generateViaClaude(userPrompt);
  } catch (err) {
    console.warn(`      Claude API ошибка: ${err.message}`);
    console.log('      Fallback на OpenAI...');
    return await generateViaOpenAI(userPrompt);
  }
}

export async function generateFunnelText(prompt, post) {
  const hashtagsStr = post.hashtags?.join(' ') || '#наследиеариев';
  const fullPrompt = `${prompt}\n\nХэштеги: ${hashtagsStr}`;

  try {
    console.log('      Генерация воронки через Claude API...');
    return await generateViaClaude(fullPrompt);
  } catch (err) {
    console.warn(`      Claude ошибка: ${err.message}`);
    console.log('      Fallback на OpenAI...');
    return await generateViaOpenAI(fullPrompt);
  }
}

export async function generateImagePrompt(post) {
  const { image_style, topic } = post;
  return `${image_style} Style: dark background (#0d0804), golden accents (#c9a84c), Slavic ornamental patterns. No text, no letters, no words on the image. High quality digital art, mystical atmosphere. Context: ${topic}`;
}

const isMain = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const testPost = {
    topic: 'Перун — громовержец и защитник Яви',
    type: 'info',
    cta_page: 'pages/gods.html',
    cta_text: 'Узнай больше о славянских богах',
    hashtags: ['#славянскиебоги', '#перун', '#наследиеариев'],
    image_style: 'Величественный образ Перуна — молнии, дуб, золотые тона на тёмном фоне.',
  };
  console.log('Генерация текста...');
  const text = await generatePostText(testPost);
  console.log('--- ТЕКСТ ПОСТА ---');
  console.log(text);
  console.log('--- КОНЕЦ ---');
  console.log(`\nДлина: ${text.length} символов`);
}
