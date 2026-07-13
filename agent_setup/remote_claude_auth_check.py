import os
from pathlib import Path
import paramiko
import sys

for line in Path(__file__).with_name('.env').read_text(encoding='utf-8').splitlines():
    if line.strip() and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

HOST = os.environ['VPS_IP']
USER = 'root'
PASSWORD = os.environ['VPS_PASSWORD']
cmd = 'sudo -u agent claude auth login'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False, timeout=10)
except Exception as e:
    print('SSH connection failed:', e)
    sys.exit(1)

stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('STDOUT:')
print(out)
print('STDERR:')
print(err)
client.close()
