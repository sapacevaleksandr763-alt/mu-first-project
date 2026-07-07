# Инструкция: установка и изоляция ботов/агентов на VPS

> Справочник для установки AI-агентов на сервер, где уже работают другие боты.
> Когда читать: при любой работе с VPS, деплое ботов, добавлении нового агента.

---

## Критические правила

1. **ОДИН ТОКЕН = ОДИН ПРОЦЕСС** (иначе бан Telegram 14+ часов)
2. Каждый бот/агент = отдельный Linux-юзер + отдельный systemd-сервис + отдельный .env
3. Перед остановкой старого — убедись что новый работает
4. Старые папки НЕ удаляй — переименовывай в `.OLD-<дата>`
5. Секреты ТОЛЬКО в .env, НИКОГДА в коде
6. Все бэкенды на `127.0.0.1`, НЕ на `0.0.0.0`
7. После каждого шага — проверяй и показывай результат
8. ЖЁСТКО ЖДИ подтверждения перед следующим шагом

---

## ШАГ 1 — ПОЛНЫЙ АУДИТ

Ничего не меняй, только собери информацию.

### 1.1 Система

```bash
uname -a && lsb_release -a 2>/dev/null
free -h && df -h / && nproc
uptime
```

### 1.2 Процессы и сервисы

```bash
ps aux --sort=-%mem | head -40

systemctl list-units --type=service --state=active | grep -v -E "systemd|snap|ssh|cron|ufw|fail2ban|nginx|postgres|redis|docker|containerd|polkit|dbus|user@|getty|serial|modprobe|keyboard|console|networkd|resolved|timesyncd|unattended|logrotate|fstrim|man-db|apt|dpkg|e2scrub|pam_namespace"

for f in /etc/systemd/system/*.service; do [ -f "$f" ] && echo "=== $f ===" && cat "$f" && echo; done

which pm2 2>/dev/null && pm2 list 2>/dev/null
docker ps -a 2>/dev/null
screen -ls 2>/dev/null
```

### 1.3 Пользователи и файлы

```bash
awk -F: '$3 >= 1000 {print $1, $3, $6}' /etc/passwd
ls -la /home/
for d in /home/*/; do echo "=== $d ===" && ls -la "$d" 2>/dev/null && echo; done
ls -la /root/
ls /home/*/.agent/bot/index.js 2>/dev/null || echo "Шаблон .agent не найден"
ls /home/*/bot/index.js 2>/dev/null || echo "Шаблон bot/ не найден"
```

### 1.4 Сеть и безопасность

```bash
ss -tlnp
ufw status verbose 2>/dev/null || iptables -L -n 2>/dev/null | head -20
systemctl is-active fail2ban 2>/dev/null
nginx -t 2>/dev/null && ls /etc/nginx/sites-enabled/ 2>/dev/null
certbot certificates 2>/dev/null
```

### 1.5 Инфраструктура

```bash
node --version 2>/dev/null
npm --version 2>/dev/null
python3 --version 2>/dev/null
git --version 2>/dev/null
docker --version 2>/dev/null
ps aux | grep telegram-bot-api | grep -v grep
warp-cli status 2>/dev/null || echo "WARP не установлен"
systemctl is-active postgresql 2>/dev/null
systemctl is-active redis 2>/dev/null
```

### 1.6 Cron-задачи

```bash
crontab -l 2>/dev/null
for user in $(awk -F: '$3 >= 1000 {print $1}' /etc/passwd); do echo "=== $user ===" && crontab -u "$user" -l 2>/dev/null; done
```

### 1.7 Проверка конфликтов

```bash
id {{AGENT_NAME}} 2>/dev/null && echo "КОНФЛИКТ: юзер существует!" || echo "Юзер свободен"
for port in 3001 3002 3003 3004 3005; do
  ss -tlnp | grep -q ":$port " && echo "Порт $port занят" || echo "Порт $port свободен"
done
```

### Формат отчёта аудита

```
СОСТОЯНИЕ СЕРВЕРА
  ОС / RAM / Диск / CPU: ...
  Юзеры: [список]
  Боты/агенты: [имя, где лежит, как запущен, под каким юзером]
  Занятые порты: [список]
  Firewall: [статус]
  WARP: [статус]
  Локальный TG API: [да/нет, порт]

ПРОБЛЕМЫ
  Боты под root: [список]
  Боты без systemd: [список]
  Боты без отдельного юзера: [список]
  Секреты в коде: [список]
  Дублирующиеся процессы: [список]
  Systemd без защиты: [список]
  Открытые порты наружу: [список]
  Ёмкость: ещё ~N агентов ((RAM - занято) / 1 GB)
```

**СТОП.** Жди подтверждения:
- "мигрируй" → Шаг 2A
- "ставь агента" → Шаг 2B
- "всё" → сначала миграция, потом агент

---

## ШАГ 2A — ПЛАН МИГРАЦИИ СУЩЕСТВУЮЩИХ БОТОВ

Для каждого бота:

1. Создать юзера: `sudo useradd -m -s /bin/bash <botname>`
2. Скопировать: `sudo cp -r /путь/ /home/<botname>/<botname>/`
3. Права: `sudo chown -R <botname>:<botname> /home/<botname>/ && sudo chmod 750 /home/<botname>/`
4. Перенести/создать .env (секреты из кода → .env)
5. Установить зависимости от нового юзера
6. Создать systemd-сервис (с защитой и лимитами)
7. Проверить что порт свободен
8. Запустить, проверить логи
9. Убедиться что работает → остановить старый процесс
10. Переименовать старую папку в `.OLD-<дата>`

**СТОП.** Жди подтверждения.

---

## ШАГ 2B — ПЛАН УСТАНОВКИ НОВОГО AI-АГЕНТА

### Структура на сервере

```
/home/{{AGENT_NAME}}/
├── .agent/
│   ├── bot/          ← код бота
│   ├── .env          ← секреты (chmod 600)
│   ├── state.json    ← конфиг
│   ├── monitor/      ← мониторинг
│   └── sessions/     ← сессии Claude
├── workspace/
│   ├── memory/       ← дневники
│   ├── knowledge/    ← база знаний
│   ├── .claude/skills/ ← скиллы
│   ├── MEMORY.md
│   ├── SOUL.md
│   └── USER.md
└── projects/         ← рабочие проекты
```

**СТОП.** Жди подтверждения.

---

## ШАГ 3B — ВЫПОЛНЕНИЕ УСТАНОВКИ АГЕНТА

### 3B.1 Создание пользователя

```bash
sudo useradd -m -s /bin/bash {{AGENT_NAME}}
sudo chmod 750 /home/{{AGENT_NAME}}/
sudo passwd -l {{AGENT_NAME}}

sudo -u {{AGENT_NAME}} mkdir -p /home/{{AGENT_NAME}}/{workspace,projects,.agent,.ssh}
sudo -u {{AGENT_NAME}} mkdir -p /home/{{AGENT_NAME}}/workspace/{memory,knowledge,.claude/skills}
sudo -u {{AGENT_NAME}} mkdir -p /home/{{AGENT_NAME}}/.agent/{bot,monitor,sessions}

# Sudoers — только свой сервис
echo "{{AGENT_NAME}} ALL=(ALL) NOPASSWD: /bin/systemctl start {{AGENT_NAME}}-bot, /bin/systemctl stop {{AGENT_NAME}}-bot, /bin/systemctl restart {{AGENT_NAME}}-bot, /bin/systemctl status {{AGENT_NAME}}-bot" | sudo tee /etc/sudoers.d/{{AGENT_NAME}}
sudo chmod 440 /etc/sudoers.d/{{AGENT_NAME}}
```

### 3B.2 Установка кода бота

**Вариант A — донор на сервере:**
```bash
DONOR=$(ls -d /home/*/.agent/bot/ 2>/dev/null | head -1 | xargs dirname | xargs dirname)
if [ -n "$DONOR" ]; then
    sudo cp -r $DONOR/.agent/bot/ /home/{{AGENT_NAME}}/.agent/bot/
    sudo cp -r $DONOR/workspace/.claude/skills/ /home/{{AGENT_NAME}}/workspace/.claude/skills/ 2>/dev/null
    sudo chown -R {{AGENT_NAME}}:{{AGENT_NAME}} /home/{{AGENT_NAME}}/
fi
```

**Вариант B — с нуля:**
```bash
sudo -u {{AGENT_NAME}} git clone https://github.com/<REPO>/agent-bot.git /home/{{AGENT_NAME}}/.agent/bot/
cd /home/{{AGENT_NAME}}/.agent/bot && sudo -u {{AGENT_NAME}} npm install --production
```

### 3B.3 Конфигурация .env

```bash
sudo -u {{AGENT_NAME}} tee /home/{{AGENT_NAME}}/.agent/.env > /dev/null << 'ENVEOF'
TG_BOT_TOKEN=<ПЕРЕДАТЬ_БЕЗОПАСНО>
OWNER_TELEGRAM_ID={{OWNER_TG_ID}}
ANTHROPIC_API_KEY=<ПЕРЕДАТЬ_БЕЗОПАСНО>
WORKSPACE_DIR=/home/{{AGENT_NAME}}/workspace
PROJECTS_DIR=/home/{{AGENT_NAME}}/projects
ENVEOF

sudo chmod 600 /home/{{AGENT_NAME}}/.agent/.env
sudo chown {{AGENT_NAME}}:{{AGENT_NAME}} /home/{{AGENT_NAME}}/.agent/.env
```

### 3B.4 Systemd-сервис

```ini
[Unit]
Description={{AGENT_NAME}} AI Agent Bot
After=network.target

[Service]
Type=simple
User={{AGENT_NAME}}
Group={{AGENT_NAME}}
WorkingDirectory=/home/{{AGENT_NAME}}/.agent/bot
EnvironmentFile=/home/{{AGENT_NAME}}/.agent/.env
ExecStart=/usr/bin/node index.js

Restart=on-failure
RestartSec=10
StartLimitBurst=5
StartLimitIntervalSec=60

NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=tmpfs
BindPaths=/home/{{AGENT_NAME}}
BindReadOnlyPaths=/usr /lib /etc/ssl /etc/resolv.conf /etc/nsswitch.conf /etc/hosts
PrivateTmp=yes
ReadWritePaths=/home/{{AGENT_NAME}}
InaccessiblePaths=/root

MemoryMax=1G
CPUQuota=80%
TasksMax=100

StandardOutput=journal
StandardError=journal
SyslogIdentifier={{AGENT_NAME}}-bot

[Install]
WantedBy=multi-user.target
```

### 3B.5 Запуск и проверка

```bash
sudo systemctl daemon-reload
sudo systemctl enable {{AGENT_NAME}}-bot
sudo systemctl start {{AGENT_NAME}}-bot
sleep 5
sudo systemctl status {{AGENT_NAME}}-bot
journalctl -u {{AGENT_NAME}}-bot -n 50 --no-pager

# Проверка изоляции
sudo -u {{AGENT_NAME}} ls /home/ 2>&1        # Permission denied
sudo -u {{AGENT_NAME}} cat /root/.bashrc 2>&1 # Permission denied

# Все сервисы живы?
systemctl list-units --type=service --state=running | grep -E 'agent|bot'
```

---

## ШАГ 4 — ОБЩАЯ ИНФРАСТРУКТУРА (один раз на сервер)

### 4.1 Локальный Telegram Bot API

Один на весь сервер. Все боты используют `http://localhost:8081`.

```bash
docker run -d \
  --name telegram-bot-api \
  --restart always \
  -p 8081:8081 \
  -v /var/lib/telegram-bot-api:/var/lib/telegram-bot-api \
  aiogram/telegram-bot-api:latest \
  --api-id=<TG_API_ID> \
  --api-hash=<TG_API_HASH> \
  --local
```

### 4.2 Cloudflare WARP

```bash
warp-cli status 2>/dev/null || echo "Установить WARP"
# Режим proxy, порт 40000
# Связка через proxychains4 с TG Bot API
```

### 4.3 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 4.4 Fail2ban

```bash
sudo apt install -y fail2ban
# jail.local: sshd, maxretry=3, bantime=86400
```

### 4.5 Nginx

Все бэкенды на `127.0.0.1:<port>`, Nginx проксирует наружу.

---

## ШАГ 5 — ФИНАЛЬНАЯ ПРОВЕРКА

```bash
# Все сервисы активны
systemctl list-units --type=service --state=active | grep -E 'bot|agent|telegram'

# Ничего под root
ps aux | grep -E "node|python" | grep "^root" | grep -v telegram-bot-api

# Каждый бот под своим юзером
ps aux | grep -E "node|python" | grep -v grep | awk '{print $1, $11, $12}' | sort

# Порты
ss -tlnp | grep -v 127.0.0.1

# Firewall
sudo ufw status

# Дублирующихся токенов нет
for env in /home/*/.agent/.env /home/*/.env /home/*/*/.env; do
    [ -f "$env" ] && grep "BOT_TOKEN" "$env" | cut -d: -f1 | md5sum | awk '{print "'$env'", $1}'
done | sort -k2 | uniq -D -f1
```

---

## Справочник

### Лимиты сервера

| RAM | Макс. ботов/агентов | MemoryMax |
|-----|---------------------|-----------|
| 2 GB | 2-4 | 384M-512M |
| 4 GB | 4-8 | 512M-768M |
| 8 GB | 8-15 | 512M-1G |
| 16 GB | 15-25 | 512M-1.5G |

### Порты

| Диапазон | Назначение |
|----------|-----------|
| 8081 | Локальный Telegram Bot API |
| 3001-3010 | HTTP-порты агентов |
| 40000 | Cloudflare WARP (SOCKS5) |
| 22/80/443 | SSH, HTTP, HTTPS |

### Именование

- Юзер: `<name>`
- Home: `/home/<name>/`
- Сервис: `<name>.service` (бот) или `<name>-bot.service` (агент)
- Логи: `journalctl -u <name>`
- Sudoers: `/etc/sudoers.d/<name>`
