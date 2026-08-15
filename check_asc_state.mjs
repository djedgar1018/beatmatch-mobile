#!/usr/bin/env node
/**
 * Check MixMatch App Store Connect state
 * Uses the ASC API key to query current version status
 */

const fs = require('fs');
const keyPath = fs.readFileSync('/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8', 'utf8');
const issuer = '48e7c084-254c-49f5-8568-4607e99d4b6d';
const keyId = 'VTRT89PDB7';
const appId = '6776072672'; // MixMatch App ID

const https = require('https');

// Generate JWT token
const jwt = require('jsonwebtoken');
const token = jwt.sign({}, keyPath, {
  algorithm: 'ES256',
  issuer: issuer,
  subject: keyId,
  key: keyPath,
  expiresIn: '3m'
});

console.log('🔍 Checking MixMatch App Store Connect state...');
console.log('App ID:', appId);

https.get(`https://appstoreconnect.apple.com/ap/v1/apps/${appId}/appStoreVersions?filter[processingState]=VALID&sort=-uploadedDate&limit=1`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const versions = JSON.parse(data);
      console.log('✅ Found versions:', versions.data?.length || 0);
      
      if (versions.data && versions.data.length > 0) {
        const latest = versions.data[0];
        console.log('Latest version:', latest.attributes?.displayVersion || 'N/A');
        console.log('State:', latest.attributes?.preReviewBetaLocalizations?.[0]?.state || 'Unknown');
      }
    } catch (e) {
      console.error('❌ Parse error:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('❌ API error:', e.message);
});
