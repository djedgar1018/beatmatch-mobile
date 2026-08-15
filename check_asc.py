#!/usr/bin/env python3
"""
Check MixMatch App Store Connect state
"""
import requests
import json
import jwt
import datetime
from pathlib import Path

# Load ASC credentials
key_path = Path('/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8')
issuer = '48e7c084-254c-49f5-8568-4607e99d4b6d'
key_id = 'VTRT89PDB7'
app_id = '6776072672'  # MixMatch App ID

# Read private key
key_content = key_path.read_text()

# Generate JWT token
token = jwt.encode({
    'iss': issuer,
    'iat': datetime.datetime.utcnow(),
    'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=3),
    'sub': key_id
}, key_content, algorithm='ES256')

print('🔍 Checking MixMatch App Store Connect state...')
print(f'App ID: {app_id}')

# Query App Store Connect
url = f'https://appstoreconnect.apple.com/ap/v1/apps/{app_id}/appStoreVersions'
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
}

try:
    response = requests.get(url, headers=headers, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        versions = data.get('data', [])
        print(f'✅ Found {len(versions)} versions')
        
        if versions:
            latest = versions[0]
            attrs = latest.get('attributes', {})
            print(f'Latest version: {attrs.get("displayVersion", "N/A")}')
            print(f'Build: {attrs.get("build", "N/A")}')
            
            # Check preReview state
            pre_review = attrs.get('preReviewBetaLocalizations', [{}])[0]
            print(f'Review state: {pre_review.get("state", "Unknown")}')
            
            # Check if there's a review submission
            submissions_url = f'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions?filter[app]={app_id}&limit=1'
            sub_response = requests.get(submissions_url, headers=headers, timeout=10)
            
            if sub_response.status_code == 200:
                sub_data = sub_response.json()
                print(f'Review submissions: {len(sub_data.get("data", []))}')
                if sub_data.get('data'):
                    print(f'Last submission: {sub_data["data"][0].get("attributes", {}).get("platform", "N/A")}')
    else:
        print(f'❌ API Error: {response.status_code}')
        print(f'Response: {response.text[:200]}')
        
except Exception as e:
    print(f'❌ Error: {e}')
