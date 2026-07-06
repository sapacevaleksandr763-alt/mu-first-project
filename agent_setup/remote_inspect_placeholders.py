import paramiko

HOST = '155.212.208.32'
USER = 'root'
PASSWORD = 'HFTTFbf6!8%V'
files = ['CLAUDE.md', 'SOUL.md', 'MEMORY.md', 'GOALS.md', 'USER.md', 'MISSION.md', 'PROJECTS.md', 'PREFERENCES.md', 'LEARNED.md']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False, timeout=10)
for fname in files:
    path = f'/home/agent/workspace/{fname}'
    cmd = f"python3 - <<'PY'\nimport re, pathlib\npath = pathlib.Path('{path}')\ntext = path.read_text(encoding='utf-8', errors='ignore')\nplaceholders = set(re.findall(r'{{\\s*([^}}]+?)\\s*}}', text))\nif placeholders:\n    print('{fname}')\n    for p in sorted(placeholders):\n        print('  -', p)\nPY"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace'))
client.close()
