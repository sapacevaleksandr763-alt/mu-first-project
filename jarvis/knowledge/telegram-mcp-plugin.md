# Telegram MCP Plugin для Claude Code

> Источник: github.com/anthropics/claude-plugins-official/tree/main/external_plugins/telegram

## Что это

MCP-сервер, который подключает Telegram как канал связи к Claude Code. Claude получает сообщения из Telegram и может отвечать, реагировать, редактировать сообщения, отправлять файлы.

## Зачем

- Общаться с Claude через Telegram (DM боту)
- Получать уведомления и отвечать без открытия IDE
- Автоматизация ответов через Claude

## Требования

- **Bun** runtime (`curl -fsSL https://bun.sh/install | bash`)
- Telegram bot token от @BotFather

## Установка

```bash
# 1. Установить плагин
/plugin install telegram@claude-plugins-official
/reload-plugins

# 2. Настроить токен бота
/telegram:configure <BOT_TOKEN>

# 3. Перезапустить Claude Code с каналом
claude --channels plugin:telegram@claude-plugins-official

# 4. Привязать пользователя через Telegram
# Написать боту в DM, получить код, затем:
/telegram:access pair <code>

# 5. Ограничить доступ (опционально)
/telegram:access policy allowlist
```

## Доступные инструменты

| Инструмент | Назначение |
|-----------|-----------|
| `reply` | Отправка сообщений с тредами и вложениями |
| `react` | Реакции эмодзи на сообщения |
| `edit_message` | Редактирование отправленных сообщений |

## Особенности

- Фото скачиваются в `~/.claude/channels/telegram/inbox/`
- Контроль доступа: allowlist, pairing
- Длинные тексты автоматически разбиваются на части
- Вложения: изображения inline, остальные как документы
- Токен хранится в `~/.claude/channels/telegram/.env`

## Отличие от test_copi

Это НЕ замена Telegram-бота test_copi. Это канал связи Claude ↔ Telegram для управления Claude через мессенджер. test_copi — самостоятельный бот-копирайтер на Grammy.
