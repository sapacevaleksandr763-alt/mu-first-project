# PROJECT-STATUS — Память проекта «Контент-автомат @nasledieariev»

> Этот файл — главная точка входа для Claude. Читай его первым при любой работе с этим проектом.
> Последнее обновление: 2026-07-27

---

## Что это

Автоматическая система генерации и публикации постов в Telegram-канал [@nasledieariev](https://t.me/nasledieariev) — канал о славянской ведической культуре Александра Сапачёва.

## Текущий статус

**ЗАПУЩЕН НА VPS — РАБОТАЕТ**

Сервис `nasledie-content.service` активен на 155.212.208.32 с 2026-07-27.
Первая публикация: 2026-07-28 (Пн) в 10:00 МСК — пост про Перуна.

### Что сделано (2026-07-27):
- [x] Контент-план на месяц: 27.07 — 30.08.2026 (20 постов, 4/неделю)
- [x] content-generator.js — генерация текста через OpenAI API (gpt-4o-mini)
- [x] generate-image.js — генерация картинок через DALL-E (gpt-image-1)
- [x] pipeline.js — оркестрация: текст → картинка → публикация
- [x] publish.js — публикация в Telegram (текст + фото)
- [x] logger.js — логирование публикаций в data/publish-log.json
- [x] scheduler.js — cron-расписание (Пн/Ср/Пт/Вс 10:00 МСК)
- [x] analytics.js — месячная аналитика + автогенерация нового плана
- [x] package.json обновлён, зависимости установлены

### Что нужно сделать:
- [ ] Задеплоить на VPS (155.212.208.32) как systemd-сервис
- [ ] Добавить OWNER_CHAT_ID в .env (Telegram ID Алекса для получения отчётов)
- [ ] Протестировать первый пост (node pipeline.js w1-mon --dry-run)
- [ ] Запустить scheduler.js на VPS

## Архитектура

```
content-plan.json → scheduler.js (node-cron, Пн/Ср/Пт/Вс 10:00 МСК)
                        ↓
                  content-generator.js (OpenAI gpt-4o-mini → текст поста)
                        ↓
                  generate-image.js (DALL-E gpt-image-1 → картинка)
                        ↓
                  publish.js (Telegram Bot API → @nasledieariev)
                        ↓
                  logger.js (→ data/publish-log.json)

Конец месяца:
  analytics.js → метрики + автогенерация нового content-plan.json
```

## Файлы

```
jarvis/multi_agent/
├── scheduler.js          — ГЛАВНЫЙ ПРОЦЕСС (node scheduler.js)
├── content-generator.js  — генерация текста
├── generate-image.js     — генерация картинок
├── pipeline.js           — оркестрация одного поста
├── publish.js            — публикация в Telegram
├── analytics.js          — аналитика + новый план
├── logger.js             — логирование
├── package.json          — зависимости: dotenv, node-cron
├── .env                  — API ключи (НЕ коммитить!)
├── data/
│   ├── content-plan.json — контент-план на текущий месяц
│   └── publish-log.json  — лог публикаций
├── output/               — сгенерированные картинки
├── logs/                 — логи
└── docs/
    ├── PROJECT-STATUS.md — ЭТО ФАЙЛ (память проекта)
    └── 2026-07-27-content-automation-design.md — спецификация
```

## API-ключи (в .env)

| Переменная | Для чего | Статус |
|-----------|---------|--------|
| TELEGRAM_BOT_TOKEN | Публикация в канал | есть |
| TELEGRAM_CHANNEL_ID | @nasledieariev | есть |
| IMAGE_API_KEY | OpenAI для текстов (gpt-4o-mini) и картинок (DALL-E) | есть |
| ANTHROPIC_API_KEY | Не используется в автомате | есть |
| OWNER_CHAT_ID | Telegram ID Алекса для отчётов | НЕ ЗАДАН |

## Расписание

| День | Время | Тип | Описание |
|------|-------|-----|----------|
| Пн   | 10:00 МСК | info | Статья/разбор по теме |
| Ср   | 10:00 МСК | visual | Карточка/инфографика |
| Пт   | 10:00 МСК | practice | Обряд, практика |
| Вс   | 10:00 МСК | engagement | Опрос, CTA |

## Тон канала

Мудрый наставник. Глубокий, спокойный, с отсылками к первоисточникам. Как волхв.

## Команды

```bash
# Запуск scheduler (основной процесс)
node scheduler.js

# Публикация постов на сегодня
node pipeline.js

# Публикация конкретного поста
node pipeline.js w1-mon

# Dry run (без реальной публикации)
node pipeline.js --dry-run

# Без генерации картинки
node pipeline.js --skip-image

# Тест генерации текста
node content-generator.js

# Запуск аналитики вручную
node analytics.js
```

## Деплой на VPS

```bash
# 1. Скопировать на сервер
scp -r jarvis/multi_agent root@155.212.208.32:/home/jarvis/projects/aleksandr-sapachev-setup/multi_agent/

# 2. Установить зависимости
ssh root@155.212.208.32
cd /home/jarvis/projects/aleksandr-sapachev-setup/multi_agent
npm install --production

# 3. Создать systemd-сервис
# /etc/systemd/system/nasledie-content.service

# 4. Запустить
systemctl enable nasledie-content
systemctl start nasledie-content
journalctl -u nasledie-content -f
```

## Контент-план

Текущий план: `data/content-plan.json`
Период: 27.07 — 30.08.2026
Постов: 20 (5 недель × 4 поста)
Темы: Перун, символы, обряды, Календарь, руны, обереги, Велес, Буквица, Три мира, Макошь, праздники, CTA на сайт

## История решений

- **2026-07-27:** Выбран Подход A — полная автономность на VPS. Node.js + node-cron. Генерация текста через Claude Haiku 4.5 (Anthropic API), картинок через DALL-E (OpenAI API). Публикация через Telegram Bot API. Без утверждения — полный автомат.
- **2026-07-27:** Тест пройден — dry run поста w1-mon успешен. Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) работает. OpenAI ключ — квота исчерпана, нужно пополнить для генерации картинок.
- **2026-07-27:** Задеплоено на VPS. systemd-сервис `nasledie-content` запущен, `active (running)`. Cron: Пн/Ср/Пт/Вс 07:00 UTC (10:00 МСК). Ожидание: OpenAI пополнение для картинок, OWNER_CHAT_ID для отчётов.
