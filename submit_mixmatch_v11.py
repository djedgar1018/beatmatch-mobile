#!/usr/bin/env python3
"""
Link EAS build to App Store Connect and submit for review
MixMatch v1.1.0 with video simulation changes
"""
import requests
import jwt
import datetime
from pathlib import Path

# ASC credentials
key_path = Path('/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8')
issuer = '48e7c084-254c-49f5-8568-4607e99d4b6d'
key_id = 'VTRT89PDB7'
app_id = '6776072672'  # MixMatch App ID

# Pre-created version in ASC
version_id = '498eed5d-8d90-4285-9a25-5beb13d26185'

# EAS build ID (from bbf6a1bf build)
# Need to get the actual Apple Build ID from EAS
# For now, we'll link the latest valid build

# Generate JWT token
key_content = Path(key_path).read_text()
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

print('🔍 Linking EAS build to App Store Connect...')
print(f'App ID: {app_id}')
print(f'Version ID: {version_id}')

# Step 1: Get the EAS build ID (need to fetch from Expo)
# For now, let's try to link the latest build

# First, get all builds for the app
apps_url = f'https://expo.dev/api/v2/builds?filter[processingState]=VALID&app[appName]=mix-match&app[userId]=djedgar00&sort=-createdAt'

response = requests.get(
    'https://expo.dev/api/v2/builds',
    params={
        'filter[processingState]': 'FINISHED',
        'app[appName]': 'mix-match',
        'app[userId]': 'djedgar00',
        'sort': '-createdAt',
        'limit': '1'
    },
    headers={'Accept': 'application/json'}
)

if response.status_code == 200:
    builds = response.json().get('data', [])
    if builds:
        eas_build = builds[0]
        eas_build_id = eas_build['id']
        
        # Get the Apple build ID from EAS
        build_details = requests.get(
            f'https://expo.dev/api/v2/builds/{eas_build_id}',
            headers={'Accept': 'application/json'}
        )
        
        if build_details.status_code == 200:
            build_info = build_details.json()
            apple_build_id = build_info.get('appleBuildId') or build_info.get('id')
            print(f'✅ EAS Build ID: {apple_build_id}')
            
            # Step 2: Link the build to the App Store version
            link_url = f'https://appstoreconnect.apple.com/ap/v1/appStoreVersions/{version_id}/relationships/build'
            link_data = {
                'data': {
                    'type': 'builds',
                    'id': apple_build_id
                }
            }
            
            link_response = requests.post(
                link_url,
                headers=headers,
                json=link_data
            )
            
            if link_response.status_code == 204:
                print('✅ Build linked successfully!')
                
                # Step 3: Create review submission
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
                
                sub_response = requests.post(
                    submission_url,
                    headers=headers,
                    json=submission_data
                )
                
                if sub_response.status_code == 201:
                    submission_result = sub_response.json()
                    submission_id = submission_result['data']['id']
                    print(f'✅ Review submission created: {submission_id}')
                    
                    # Step 4: Link build to submission
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
                    
                    item_response = requests.post(
                        item_url,
                        headers=headers,
                        json=item_data
                    )
                    
                    if item_response.status_code == 201:
                        print('✅ Build added to review submission!')
                        
                        # Step 5: Submit for review
                        submit_url = f'https://appstoreconnect.apple.com/ap/v1/reviewSubmissions/{submission_id}/actions/submit'
                        submit_response = requests.post(
                            submit_url,
                            headers=headers
                        )
                        
                        if submit_response.status_code == 200:
                            print('✅ MIXMATCH v1.1.0 SUBMITTED FOR REVIEW!')
                            print('📅 Expected approval: 24-48 hours')
                            print('🎥 Video simulation changes will be live once approved')
                        else:
                            print(f'⚠️ Submission response: {submit_response.status_code}')
                            print(f'Response: {submit_response.text[:200]}')
                    else:
                        print(f'❌ Item creation failed: {item_response.status_code}')
                else:
                    print(f'❌ Submission creation failed: {sub_response.status_code}')
                    print(f'Response: {sub_response.text[:200]}')
            else:
                print(f'❌ Link build failed: {link_response.status_code}')
                print(f'Response: {link_response.text[:200]}')
        else:
            print(f'❌ Could not get EAS build details: {build_details.status_code}')
    else:
        print('❌ No FINISHED EAS builds found')
else:
    print(f'❌ EAS API error: {response.status_code}')
    print(f'Response: {response.text[:200]}')
