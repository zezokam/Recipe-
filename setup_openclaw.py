#!/usr/bin/env python3
"""
Set OPENCLAW_GATEWAY_TOKEN secret and redeploy Worker
"""
import os
import subprocess
import requests
import json

API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN')
ACCOUNT_ID = '5442b9c0126cf8a946b5ce7962a03e7c'
WORKER_NAME = 'recipe-hub-api'
OPENCLAW_TOKEN = '3c2ddda40ea6ee22b7959f3823fdef15a96443a1abec4d0a'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json',
}

print('=== Setting OPENCLAW_GATEWAY_TOKEN secret ===')
r = requests.put(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}/secrets',
    headers=headers,
    json={'name': 'OPENCLAW_GATEWAY_TOKEN', 'text': OPENCLAW_TOKEN, 'type': 'secret_text'}
)
print(f'Status: {r.status_code}')
data = r.json()
if data.get('success'):
    print('✅ OPENCLAW_GATEWAY_TOKEN set successfully')
else:
    print(f'❌ Failed: {data}')
    exit(1)

print('\n=== Deploying Worker ===')
result = subprocess.run(
    ['wrangler', 'deploy', '--config', 'wrangler.toml'],
    cwd='/home/ubuntu/recipe-hub/api',
    env={**os.environ, 'CLOUDFLARE_API_TOKEN': API_TOKEN},
    capture_output=True,
    text=True,
    timeout=120
)
print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
if result.returncode == 0:
    print('✅ Worker deployed successfully')
else:
    print(f'❌ Deploy failed:\n{result.stderr[-1000:]}')
    exit(1)
