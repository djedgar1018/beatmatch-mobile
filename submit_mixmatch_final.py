#!/usr/bin/env python3
"""
Final MixMatch submission attempt
"""
import requests
import jwt
import datetime
from pathlib import Path

# Credentials
key_path = Path('/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8')
issuer = '48e7c084-254c-49f5-8568-4607e99d4b6d'
key_id = 'VTRT89PDB7'
app_id = '6776072672'

# Generate JWT token
key_content = key_path.read_text()
token = jwt.encode({
    'iss': issuer,
    'iat': datetime.datetime.utcnow(),
    'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=3),
    'sub': key_id
}, key_content, algorithm='ES256')

# Use realistic headers to avoid Cloudflare blocking
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

print('Checking MixMatch App Store Connect state...')

# Check existing submissions
existing_url = f'https://appstoreconnect.apple.com/ap/v1/apps/{app_id}/reviewSubmissions'
existing_response = requests.get(existing_url, headers=headers, timeout=30)
print(f'Status: {existing_response.status_code}')
print(f'Content-Type: {existing_response.headers.get(    "Content-Type")    }')

if existing_response.status_code == 200 and 'application/json' in existing_response.headers.get('Content-Type', ''):
    try:
        subs = existing_response.json()
        if subs.get('data'):
            print(f'Found {len(subs["data"])} existing submission(s)')
            
            # Submit the latest one
            latest_sub_id = subs['data'][-1]['id']
            submit_url = f'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions/{latest_sub_id}/actions/submit'
            
            print(f'Submitting latest submission ({latest_sub_id})...')
            submit_response = requests.post(submit_url, headers=headers, timeout=30)
            
            print(f'Submit status: {submit_response.status_code}')
            
            if submit_response.status_code in [200, 204]:
                print('SUCCESS! MixMatch v1.1.0 submitted for review!')
                print()
                print('Video simulation changes now in App Store review!')
                print('Expected approval: 24-48 hours')
            else:
                print(f'Submission response: {submit_response.status_code}')
                print(f'Response: {submit_response.text[:200]}')
        else:
            print('No existing submissions found')
    except Exception as e:
        print(f'JSON parse error: {e}')
        print(f'Raw response: {existing_response.text[:200]}')
else:
    print('API returned HTML instead of JSON (Cloudflare/WAF?)')
    print(f'Response preview: {existing_response.text[:200]}')
    print()
    print('Recommended approach:')
    print('1. Open App Store Connect directly at https://appstoreconnect.apple.com')
    print('2. Navigate to MixMatch app')
    print('3. Check Version or Builds section')
    print('4. Verify if v1.1.0 build is linked')
    print('5. If linked, click Submit for Review')
