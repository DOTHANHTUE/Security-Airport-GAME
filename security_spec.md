# Security Specification — AeroGuard Global Leaderboard & Run Logs

## 1. Data Invariants
1. **Leaderboard Ownership & Identity**: A player may only create or update `/leaderboard/{uid}` when authenticated with a verified email (`request.auth.token.email_verified == true`), where the document ID `{uid}` and `data.uid` strictly equal `request.auth.uid`.
2. **Zero PII Exposure**: Public `/leaderboard/{uid}` documents contain only `officerName`, `officerRank`, numeric gameplay metrics, `isPublic: true`, and `updatedAt`. Email, phone, and address fields are strictly prohibited by `hasOnly(...)`.
3. **Immutable Historical Runs**: `/users/{uid}/runs/{runId}` documents are strictly private to `{uid}` and append-only (`allow update, delete: if false`).
4. **Server Timestamp Integrity**: `updatedAt` and `createdAt` must strictly equal `request.time`.
5. **Bounded Values & Arrays**: Scores, accuracies (`0..100`), string lengths (`<= 40`), IDs (`<= 128`, regex `^[a-zA-Z0-9_\\-]+$`), and `achievementsEarned` arrays (`<= 20`) are strictly bounded.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Create `/leaderboard/user1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Identity Spoofing**: User `userA` attempts to write `/leaderboard/userB` or set `uid: "userB"` -> `PERMISSION_DENIED`.
3. **Unverified Email Spoof**: User with `email_verified: false` attempts write -> `PERMISSION_DENIED`.
4. **Shadow/Ghost Field Injection**: Payload adds `isAdmin: true` or `email: "leak@test.com"` -> `PERMISSION_DENIED`.
5. **Missing Required Field**: Payload omits `bestAccuracy` -> `PERMISSION_DENIED`.
6. **Negative / Overflow Score**: `bestScore: -500` or `bestScore: 999999999` -> `PERMISSION_DENIED`.
7. **Accuracy Out of Bounds**: `bestAccuracy: 150` -> `PERMISSION_DENIED`.
8. **Client Timestamp Forgery**: `updatedAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
9. **Resource Exhaustion / Long Name**: `officerName` > 40 chars -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Document ID contains spaces or >128 characters -> `PERMISSION_DENIED`.
11. **Unbounded Array / Non-String Element**: `achievementsEarned` with 25 items or `[123]` -> `PERMISSION_DENIED`.
12. **Cross-User Private Run Read**: User `userA` attempts to `get` or `list` `/users/userB/runs` -> `PERMISSION_DENIED`.
