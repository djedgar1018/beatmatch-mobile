#!/usr/bin/env python3
"""
Submit MixMatch v1.1.0 to App Store Connect
Direct implementation using ASC API
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
app_id = '6776072672'  # MixMatch App ID
version_id = '498eed5d-8d90-4285-9a25-5beb13d26185'  # Pre-created v1.1 version
apple_build_id = 'bbf6a1bf-db3d-4775-a2de-422ca0e8c41d'  # EAS build ID

# Generate JWT token (expires in 3 minutes)
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

print('🚀 Submitting MixMatch v1.1.0 to App Store Connect...')
print(f'App ID: {app_id}')
print(f'Version ID: {version_id}')
print(f'Apple Build ID: {apple_build_id}')

# Step 1: Link build to version
print('\n🔗 Step 1: Linking EAS build to App Store Connect version...')
link_url = f'https://appstoreconnect.apple.com/ap/v1/appStoreVersions/{version_id}/relationships/build'
link_data = {
    'data': {
        'type': 'builds',
        'id': apple_build_id
    }
}

link_response = requests.post(link_url, headers=headers, json=link_data, timeout=30)
print(f'  Status: {link_response.status_code}')

if link_response.status_code == 204:
    print('  ✅ Build linked successfully!')
elif link_response.status_code == 200:
    print('  ✅ Build already linked!')
else:
    print(f'  ⚠️ Response: {link_response.text[:200]}')
    
# Step 2: Create review submission
print('\n📝 Step 2: Creating review submission...')
submission_url = 'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions'
submission_data = {
    'data': {
        'type': 'reviewSubmissions',
        'attributes': {'platform': 'IOS'},
        'relationships': {
            'app': {'data': {'type': 'apps', 'id': app_id}}
        }
    }
}

submission_response = requests.post(submission_url, headers=headers, json=submission_data, timeout=30)
print(f'  Status: {submission_response.status_code}')

if submission_response.status_code == 201:
    sub_result = submission_response.json()
    submission_id = sub_result['data']['id']
    print(f'  ✅ Submission created: {submission_id}')
    
    # Step 3: Add build to submission
    print('\n📎 Step 3: Adding build to submission...')
    item_url = 'https://appstoreconnect.apple.com/ap/v1/reviewSubmissionItems'
    item_data = {
        'data': {
            'type': 'reviewSubmissionItems',
            'relationships': {
                'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': submission_id}},
                'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': version_id}}
            }
        }
    }
    
    item_response = requests.post(item_url, headers=headers, json=item_data, timeout=30)
    print(f'  Status: {item_response.status_code}')
    
    if item_response.status_code == 201:
        print('  ✅ Build added to submission!')
        
        # Step 4: Submit for review
        print('\n🚀 Step 4: Submitting for App Store review...')
        submit_url = f'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions/{submission_id}/actions/submit'
        submit_response = requests.post(submit_url, headers=headers, timeout=30)
        print(f'  Status: {submit_response.status_code}')
        
        if submit_response.status_code == 200 or submit_response.status_code == 204:
            print('  ✅ SUBMITTED SUCCESSFULLY!')
            print()
            print('🎉 MIXMATCH v1.1.0 WITH VIDEO SIMULATION CHANGES HAS BEEN SUBMITTED!')
            print()
            print('📅 Expected Timeline:')
            print('   - 24-48 hours for App Store review approval')
            print('   - DJ will receive Telegram notification when approved')
            print('   - Users will see new version with video simulation')
            print()
            print('🎥 What\'s New in v1.1.0:')
            print('   - Enhanced video simulation features')
            print('   - Payment integrity improvements')
            print('   - Auth hardening')
            print('   - Better user experience')
            print()
            print('✅ Next steps:')
            print('   - App Store Connect will review the submission')
            print('   - Once approved, DJ should download the new version from App Store')
            print('   - Users will automatically receive update notification')
            
        else:
            print(f'  ❌ Submission failed: {submit_response.text[:200]}')
            
    else:
        print(f'  ❌ Item creation failed: {item_response.text[:200]}')
        
else:
    print(f'  ❌ Submission creation failed: {submission_response.text[:200]}')
