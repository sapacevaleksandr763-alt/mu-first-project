import os
from pathlib import Path
import paramiko

for line in Path(__file__).with_name('.env').read_text(encoding='utf-8').splitlines():
    if line.strip() and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

HOST = os.environ['VPS_IP']
USER = 'root'
PASSWORD = os.environ['VPS_PASSWORD']
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False, timeout=10)
stdin, stdout, stderr = client.exec_command('sudo -u agent which claude')
print('OUT:')
print(stdout.read().decode('utf-8', errors='replace'))
print('ERR:')
print(stderr.read().decode('utf-8', errors='replace'))
client.close()
