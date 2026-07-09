# Инструкция: перенос agent-bot на новый сервер

> Когда читать: при переносе второго бота на отдельный VPS.
> Текущее состояние: agent-bot починен, отключён (`disabled`) на 155.212.208.32.

---

## Важно перед началом

**agent-bot и jarvis-bot сейчас используют ОДИН токен** (@jarvis_1266_bot).
Два бота с одним токеном = бан Telegram на 14+ часов.

Перед переносом нужен **новый токен** от @BotFather для agent-bot.

---

## Подготовка (на компьютере)

### 1. Создай нового бота в Telegram

1. Открой @BotFather в Telegram
2. Напиши `/newbot`
3. Дай имя (например: `Alex Agent`)
4. Дай username (например: `alex_agent_bot`)
5. Скопируй токен — он понадобится на шаге 5

### 2. Купи/арендуй новый VPS

- Минимум: 2 GB RAM, 1 CPU, 20 GB SSD, Ubuntu 22/24
- Запиши IP-адрес и пароль root

---

## Установка (на новом сервере)

### 3. Подключись и установи окружение

```bash
# Подключись к новому серверу
ssh root@НОВЫЙ_IP

# Обнови систему
apt-get update -qq && apt-get install -y -qq curl git jq unzip expect

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

# Claude Code CLI
npm install -g @anthropic-ai/claude-code

# VS Code CLI
curl -fL 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64' -o /tmp/vscode.tar.gz
tar -xzf /tmp/vscode.tar.gz -C /usr/local/bin/
rm -f /tmp/vscode.tar.gz

# Отключи IPv6 (фикс зависаний Node.js)
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1
```

### 4. Создай пользователя и структуру

```bash
useradd -m -s /bin/bash agent
chmod 750 /home/agent/
passwd -l agent

# Папки
sudo -u agent mkdir -p /home/agent/{workspace,projects,.agent,.ssh}
sudo -u agent mkdir -p /home/agent/workspace/{memory,knowledge,.claude/skills}
sudo -u agent mkdir -p /home/agent/.agent/{bot,monitor,sessions}
sudo -u agent mkdir -p /home/agent/.claude

# Sudoers — только свой сервис
echo "agent ALL=(ALL) NOPASSWD: /bin/systemctl start agent-bot, /bin/systemctl stop agent-bot, /bin/systemctl restart agent-bot, /bin/systemctl status agent-bot" | tee /etc/sudoers.d/agent
chmod 440 /etc/sudoers.d/agent
```

### 5. Перенеси файлы со старого сервера

С компьютера (или со старого сервера через scp):

```bash
# Со старого сервера (155.212.208.32) на новый:
# Код бота
scp -r root@155.212.208.32:/home/agent/.agent/bot/ root@НОВЫЙ_IP:/home/agent/.agent/bot/

# Workspace (DNA-файлы, memory, knowledge)
scp -r root@155.212.208.32:/home/agent/workspace/ root@НОВЫЙ_IP:/home/agent/workspace/

# Настройки Claude (.claude/settings.json, skills/)
scp -r root@155.212.208.32:/home/agent/.claude/ root@НОВЫЙ_IP:/home/agent/.claude/

# Права
chown -R agent:agent /home/agent/
```

### 6. Настрой .env с НОВЫМ токеном

```bash
cat > /home/agent/.agent/.env << 'EOF'
BOT_TOKEN=ВСТАВЬ_НОВЫЙ_ТОКЕН_ОТ_BOTFATHER
AGENT_HOME=/home/agent
EOF

chmod 600 /home/agent/.agent/.env
chown agent:agent /home/agent/.agent/.env
```

### 7. Создай systemd-сервис

```bash
cat > /etc/systemd/system/agent-bot.service << 'EOF'
[Unit]
Description=Agent Bot - Personal AI Telegram Bot
After=network.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
Type=simple
User=agent
Group=agent
WorkingDirectory=/home/agent/.agent/bot
EnvironmentFile=/home/agent/.agent/.env
ExecStart=/usr/bin/node index.js

Restart=on-failure
RestartSec=10

NoNewPrivileges=yes
ProtectSystem=strict
PrivateTmp=yes
ReadWritePaths=/home/agent
ProtectKernelTunables=yes
ProtectControlGroups=yes

MemoryMax=1G
CPUQuota=80%
TasksMax=100

StandardOutput=journal
StandardError=journal
SyslogIdentifier=agent-bot

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable agent-bot
```

### 8. Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
```

### 9. Авторизуй Claude

```bash
# Запусти авторизацию
claude auth login --claudeai

# Появится ссылка — открой в браузере, нажми Authorize, скопируй код
# Вставь код в терминал → Login successful

# Скопируй credentials для юзера agent
cp /root/.claude/.credentials.json /home/agent/.claude/.credentials.json
chown agent:agent /home/agent/.claude/.credentials.json
chmod 600 /home/agent/.claude/.credentials.json
```

### 10. Настрой VS Code Tunnel

```bash
# В консоли сервера (VNC или SSH):
code tunnel --accept-server-license-terms

# Появится ссылка github.com/login/device и код
# Открой ссылку в браузере, введи код
# После авторизации нажми Ctrl+C

# Установи как сервис (работает 24/7)
code tunnel service install --accept-server-license-terms
```

Потом в VS Code на компьютере:
- Remote Explorer → Tunnels → выбери новый сервер
- Открой папку `/home/agent/workspace/`

### 11. Запусти бота

```bash
systemctl start agent-bot
sleep 5
systemctl status agent-bot

# Проверь логи
journalctl -u agent-bot -n 20 --no-pager
```

Напиши боту в Telegram `/start` — он привяжется к тебе.

### 12. Удали agent-bot со старого сервера

После проверки что новый бот работает:

```bash
# На старом сервере (155.212.208.32):
systemctl disable agent-bot
rm /etc/systemd/system/agent-bot.service
systemctl daemon-reload

# Переименуй (не удаляй!) старые файлы
mv /home/agent /home/agent.OLD-$(date +%Y%m%d)
```

---

## Проверочный чеклист

- [ ] Новый токен от @BotFather (НЕ тот же что у jarvis!)
- [ ] Node.js 20 установлен
- [ ] Claude Code CLI установлен
- [ ] Файлы бота перенесены
- [ ] .env с НОВЫМ токеном
- [ ] systemd-сервис создан и включён
- [ ] Firewall настроен (22/80/443)
- [ ] Claude авторизован (OAuth)
- [ ] VS Code Tunnel настроен
- [ ] Бот запущен и отвечает
- [ ] Старый agent-bot на 155.212.208.32 отключён
