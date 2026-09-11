<!--
Sync Impact Report
Version change: [none, template] → 1.0.0 (initial ratification)
Modified principles: none (first ratification)
Added sections:
  - Core Principles: I. Named Entitlements, Not "Any Active", II. Backend
    Webhook Is the Source of Truth for Subscription State, III. Tolerate API
    Shape Drift, Don't Assume It Away, IV. Verify Manually Until Real
    Tooling Exists, V. Expo Version Awareness
  - Engineering Conventions (SECTION_2)
  - Release Workflow (SECTION_3)
  - Governance
Removed sections: none
Deferred/TODO items:
  - RATIFICATION_DATE set to the date this document was first written
    (2026-09-10), not the app's true start date, which predates any written
    constitution and isn't precisely recorded here.
  - Principle IV documents a real current gap (no typecheck/export-check
    script configured, unlike the sibling aim-assist app) rather than
    inventing tooling that doesn't exist yet.
This report is scratch material for human review of this amendment and is
expected to be removed before/when this file is next amended.
-->

# MixMatch Mobile Constitution

## Core Principles

### I. Named Entitlements, Not "Any Active"
Subscription/paywall checks MUST verify the specific named RevenueCat
entitlement this app actually grants access on, never "does the user have
any active entitlement." This app previously had (and fixed) exactly this
bug: checking for any active entitlement let an unrelated RevenueCat
entitlement grant access it shouldn't have. `lib/iap.ts`'s entitlement
constants are the source of truth for which name to check.

### II. Backend Webhook Is the Source of Truth for Subscription State
A client-side purchase-success callback is not proof a subscription is
active — it MUST be confirmed via the backend's RevenueCat webhook
(`server/revenuecatWebhook.ts` in the BeatMatch/MixMatch backend repo, which
fails closed when no webhook secret is configured — see
`server/revenuecatWebhook.test.ts`). Local state (`SUBSCRIPTION_KEY`,
`SUBSCRIPTION_TIER_KEY` in AsyncStorage) is a cache for responsiveness, not
the authoritative record, and MUST be reconcilable against the backend at
any time.

### III. Tolerate API Shape Drift, Don't Assume It Away
This app and its backend (BeatMatch/MixMatch, a separate repo) deploy
independently. A response shape MUST be handled defensively when it can
legitimately differ across a deploy boundary (see
`lib/bookings-contract.ts`'s `normalizeBookingsResponse`, which handles both
a bare array and a `{ bookings: [...] }` wrapper from current vs. legacy
API versions) rather than assuming the backend's current shape will always
hold. New endpoints that might evolve their response shape should ship with
an equivalent normalizer from the start, not added reactively after a break.

### IV. Verify Manually Until Real Tooling Exists
Unlike the sibling `aim-assist` app, this repo has no `typecheck` or
export-check npm script configured as of this writing. Until one exists, a
change MUST be verified with `npx tsc --noEmit` run manually before being
reported complete, and that verification (or its absence) MUST be disclosed
honestly — never implied as automatically covered by tooling that isn't
actually there. Adding real `typecheck`/`ios:export-check` scripts to
`package.json`, matching aim-assist's, is a standing deferred task.

### V. Expo Version Awareness
`AGENTS.md` carries a standing instruction: check the versioned Expo docs
(currently v56) before writing code that touches Expo APIs, since behavior
has changed across versions in ways that aren't always obvious from general
Expo knowledge.

## Engineering Conventions

- Navigation/screens live under `app/` (file-based routing), with feature
  areas split into `booking/`, `dj/`, `messages/` subdirectories.
- Shared logic lives under `lib/` (`api.ts`, `auth.ts`,
  `bookings-contract.ts`, `iap.ts`, `notifications.ts`) — new cross-screen
  logic belongs there, not duplicated per-screen.
- In-app purchases: bundle-scoped product IDs
  (`com.ten18.mixnmatch.{starter,pro,elite}.v2`), managed via RevenueCat.
- Bundle identifier: `com.ten18.mixnmatch` — the codebase/repo name
  (BeatMatch) and the shipped product name (MixMatch) differ; both refer to
  the same app.

## Release Workflow

1. Make the change; verify per Principle IV (manual `tsc --noEmit` until
   real scripts exist).
2. Commit and push to `main` — source control only, no auto-deploy
   configured on this repo.
3. Trigger an EAS build for this project (see prior real builds:
   `mixmatch-build37`/`38`/`39`).
4. Submit to App Store Connect / TestFlight only with explicit human
   confirmation at the submit step — same non-negotiable as the sibling
   aim-assist app: a finished build is not a release.
5. A subscription/paywall change specifically MUST be checked against
   Principles I and II before being considered safe to ship — a bug here is
   a real-money bug, not a cosmetic one.

## Governance

This constitution supersedes ad hoc decisions made in its scope. Amendments
are made via this same `/speckit-constitution` command, require a stated
rationale tied to real evidence (an incident, a discovered bug, an explicit
product decision), and increment the version per semantic versioning (MAJOR:
principle removed/redefined incompatibly; MINOR: principle added or
materially expanded; PATCH: wording/clarity only). `AGENTS.md`/`CLAUDE.md`
remain the place for frequently-changing operational notes; this document
holds the smaller set of durable principles those notes should never
contradict.

**Version**: 1.0.0 | **Ratified**: 2026-09-10 | **Last Amended**: 2026-09-10
