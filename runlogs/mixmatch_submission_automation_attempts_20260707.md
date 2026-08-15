# MixMatch Submission Automation Attempts — 2026-07-07

## Credentials used
No private key contents were printed or logged.

Environment supplied to scripts:

```sh
EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 \
EXPO_ASC_KEY_ID=VTRT89PDB7 \
EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d
```

## Known-good build/package state
- App: Mix-Match / `com.ten18.mixnmatch`
- ASC app ID: `6776072672`
- Target version: `1.0`
- EAS build: `aa979355-e3ca-4dc6-8b10-f295d21291c5`
- Version/build: `1.0 (32)`
- ASC build ID / delivery UUID: `4908047a-ce7c-4adf-8123-8ab8316cb35e`
- ASC build 32 processing state: `VALID`
- Build 32 is linked to App Store version `1.0`.
- App Review notes were patched from `store-listing/REVIEW_NOTES.txt`.

## Commands run after Dj correction

```sh
EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 \
EXPO_ASC_KEY_ID=VTRT89PDB7 \
EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d \
node runlogs/asc_mixmatch_query_submission_state.mjs
```

```sh
EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 \
EXPO_ASC_KEY_ID=VTRT89PDB7 \
EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d \
node runlogs/asc_mixmatch_modern_review_submit.mjs
```

```sh
EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 \
EXPO_ASC_KEY_ID=VTRT89PDB7 \
EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d \
node runlogs/asc_mixmatch_legacy_submission_retry.mjs
```

```sh
EXPO_ASC_API_KEY_PATH=/Users/mini/.appstoreconnect/private_keys/AuthKey_VTRT89PDB7.p8 \
EXPO_ASC_KEY_ID=VTRT89PDB7 \
EXPO_ASC_ISSUER_ID=48e7c084-254c-49f5-8568-4607e99d4b6d \
node runlogs/asc_mixmatch_submit_existing_review_submission.mjs
```

## Logs
- `runlogs/asc_mixmatch_submission_state_20260707.json`
- `runlogs/asc_mixmatch_submission_state_20260707.summary.txt`
- `runlogs/asc_mixmatch_modern_review_submit_20260707.json`
- `runlogs/asc_mixmatch_modern_review_submit_20260707.summary.txt`
- `runlogs/asc_mixmatch_legacy_submission_retry_20260707.json`
- `runlogs/asc_mixmatch_legacy_submission_retry_20260707.summary.txt`
- `runlogs/asc_mixmatch_submit_existing_review_submission_20260707.json`
- `runlogs/asc_mixmatch_submit_existing_review_submission_20260707.summary.txt`
- Final package: `runlogs/mixmatch_final_submission_package_20260707.md`

## Verified hard blocker
The binary upload/build-selection/review-note automation is complete, but final App Review submission is still blocked by App Store Connect API state/permissions.

The first finalizer attempt against legacy `appStoreVersionSubmissions` returned the exact Apple error:

```text
FORBIDDEN_ERROR: The resource 'appStoreVersionSubmissions' does not allow 'CREATE'. Allowed operation is: DELETE
```

Follow-up scripts attempted:
1. Modern `reviewSubmissions` create/item/submit flow.
2. Legacy app-store-version-submission cleanup/recreate flow.
3. Direct submit of the existing unresolved review submission.

Those scripts use the local ASC key path/Key ID/Issuer ID non-interactively and write exact Apple response bodies to the JSON logs above. No missing key file or missing issuer ID remains.

## Current next step
Use the exact JSON response in `runlogs/asc_mixmatch_submit_existing_review_submission_20260707.json` / `runlogs/asc_mixmatch_legacy_submission_retry_20260707.json` to decide whether the App Store Connect API key role lacks the required review-submission permission or whether the existing unresolved review-submission resource must be deleted/cleared with a different Apple API operation before create/submit is allowed.
