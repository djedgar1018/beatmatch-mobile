# MixMatch Final Submission Package — 2026-07-07

## App
- Name: Mix-Match
- Bundle ID: com.ten18.mixnmatch
- ASC app ID: 6776072672
- Target App Store version: 1.0

## Build
- EAS build ID: aa979355-e3ca-4dc6-8b10-f295d21291c5
- Version/build: 1.0 (32)
- ASC build ID / delivery UUID: 4908047a-ce7c-4adf-8123-8ab8316cb35e
- ASC build processing: VALID
- Commit containing release: 9245aac3f0814df2b98e01da5d52fa3ed5d85891

## Commands run
- EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 EXPO_ASC_KEY_ID=VTRT89PDB7 EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d node runlogs/asc_mixmatch_submit_existing_review_submission.mjs
- Earlier gates: npx tsc --noEmit; npx expo-doctor; npx expo export --platform ios; eas build -p ios --profile production --non-interactive --no-wait; eas submit -p ios --profile production --id aa979355-e3ca-4dc6-8b10-f295d21291c5 --non-interactive --wait; direct altool upload as fallback.

## ASC/API result
- Version before submit attempt: {"id":"6ee9e137-1aef-4927-bf7a-74c0b1627530","state":"PREPARE_FOR_SUBMISSION","buildRel":{"type":"builds","id":"4908047a-ce7c-4adf-8123-8ab8316cb35e"}}
- Build 32: {"id":"4908047a-ce7c-4adf-8123-8ab8316cb35e","version":"32","processingState":"VALID","uploadedDate":"2026-07-07T15:05:59-07:00","expired":false}
- Target review submission: {"id":"386173d5-185a-4e65-afc6-8c7fda3ed7dd","state":"READY_FOR_REVIEW","submittedDate":null,"items":[]}
- Submit response: null
- Blocker: POST /v1/reviewSubmissions/386173d5-185a-4e65-afc6-8c7fda3ed7dd/submit failed 404: 404 PATH_ERROR: The relationship 'submit' does not exist
- Review submissions after: [{"id":"386173d5-185a-4e65-afc6-8c7fda3ed7dd","state":"READY_FOR_REVIEW","submittedDate":null,"items":[]},{"id":"4b63ce5d-0c84-4d92-9f3d-127c449be635","state":"UNRESOLVED_ISSUES","submittedDate":"2026-07-07T06:40:14.26Z","items":[{"type":"reviewSubmissionItems","id":"NGI2M2NlNWQtMGM4NC00ZDkyLTlmM2QtMTI3YzQ0OWJlNjM1fDZ8ODg2NDU3MDM5"}]},{"id":"4530170b-d575-4d17-9e3e-18fb37affc65","state":"COMPLETE","submittedDate":"2026-07-05T18:23:17.852Z","items":[{"type":"reviewSubmissionItems","id":"NDUzMDE3MGItZDU3NS00ZDE3LTllM2UtMThmYjM3YWZmYzY1fDZ8ODg2NDU3MDM5"}]}]
- Version after: {"id":"6ee9e137-1aef-4927-bf7a-74c0b1627530","state":"PREPARE_FOR_SUBMISSION","buildRel":{"type":"builds","id":"4908047a-ce7c-4adf-8123-8ab8316cb35e"}}

## Logs
- JSON: runlogs/asc_mixmatch_submit_existing_review_submission_20260707.json
- Summary: runlogs/asc_mixmatch_submit_existing_review_submission_20260707.summary.txt
