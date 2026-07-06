import paramiko

HOST = '155.212.208.32'
USER = 'root'
PASSWORD = 'HFTTFbf6!8%V'
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False, timeout=10)
stdin, stdout, stderr = client.exec_command('sudo -u agent which claude')
print('OUT:')
print(stdout.read().decode('utf-8', errors='replace'))
print('ERR:')
print(stderr.read().decode('utf-8', errors='replace'))
client.close()
