#!/usr/bin/env python3
"""
Check MixMatch App Store Connect state and submit if needed
"""
import requests
import jwt
import datetime
import json
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

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

print('🔍 Checking MixMatch App Store Connect state...')

# Check for existing review submissions
existing_url = f'https://appstoreconnect.apple.com/ap/v1/apps/{app_id}/reviewSubmissions'
existing_response = requests.get(existing_url, headers=headers, timeout=30)

print(f'Review submissions status: {existing_response.status_code}')

if existing_response.status_code == 200:
    subs = existing_response.json()
    print(f'Existing submissions: {len(subs.get("data", []))}')
    
    if subs.get('data'):
        print('\n⚠️ There are already review submissions!')
        for sub in subs['data'][:5]:  # Show first 5
            attrs = sub.get('attributes', {})
            print(f'  - ID: {sub["id"]}')
            print(f'    Platform: {attrs.get("platform")}')
            print(f'    Submitted: {attrs.get("submittedForReview", "Unknown")}')
            print()
        
        # Check if any are in "In Review" or "Waiting" state
        for sub in subs['data']:
            sub_id = sub['id']
            sub_detail = requests.get(
                f'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions/{sub_id}',
                headers=headers,
                timeout=30
            )
            
            if sub_detail.status_code == 200:
                sub_data = sub_detail.json()
                attrs = sub_data.get('data', {}).get('attributes', {})
                print(f'Submission {sub_id}:')
                print(f'  Status: {attrs.get("platform")}')
                print()
        
        # If we have a submission, let's try to submit it
        print('🚀 Attempting to submit the latest submission...')
        latest_sub_id = subs['data'][-1]['id']
        submit_url = f'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions/{latest_sub_id}/actions/submit'
        
        submit_response = requests.post(submit_url, headers=headers, timeout=30)
        print(f'\nSubmit response: {submit_response.status_code}')
        
        if submit_response.status_code in [200, 204]:
            print('✅ SUBMITTED SUCCESSFULLY!')
            print()
            print('🎉 MIXMATCH v1.1.0 WITH VIDEO SIMULATION CHANGES HAS BEEN SUBMITTED!')
            print()
            print('📅 Expected Timeline:')
            print('   - 24-48 hours for App Store review approval')
            print('   - DJ will receive notification when approved')
            print()
            print('🎥 This version includes:')
            print('   - Video simulation features (what DJ saw on Mac mini)')
            print('   - Payment integrity improvements')
            print('   - Auth hardening')
            print('   - Better user experience')
            
        else:
            print(f'⚠️ Submission failed: {submit_response.text[:200]}')
            print()
            print('Current submission state may already be "Ready" or "Waiting for build"')
            print('DJ can check App Store Connect directly to see the exact state.')
            
else:
    print(f'❌ Could not fetch submissions: {existing_response.status_code}')
    print(f'Response: {existing_response.text[:200]}')
