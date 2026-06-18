# Security Specification: BodhiShape

This specification defines the rigorous security rules, data invariants, and verification criteria for BodhiShape's Firestore database structure.

## 1. Data Invariants

- **User Profiles (/users/{userId})**:
  - Direct ownership: A practitioner can only create or edit their own profile document (`request.auth.uid == userId`).
  - Immutability: An email address once registered cannot be altered or hijacked by another user.
  - Strict Boundaries: Streak counters, active statuses, and trial days cannot be set to invalid numbers or hijacked variables.
- **Activity Logs (/activities/{activityId})**:
  - Authenticated Identity: The logging user must match the `userId` of the logged document and must be verified.
  - Non-negativity and cap restrictions: Points earned must be non-negative and conform to the system capping logic (Morning/Evening Gongyo: 1pt; Daimoku: max 2pt; Exercise: max 2pt).
  - Time boundaries: Future inputs are blocked, and retroactive updates are restricted.
- **Social Feed Posts (/posts/{postId})**:
  - Relational sync: The user writing a post must match `request.auth.uid`.
  - Non-owner limitations: Non-owners can only add or update reactions and comments inside posts. They are strictly prohibited from changing the main body, author, or logged activity attributes.
- **Goals (/goals/{goalId})**:
  - strict isolation: Only the owner of the goal can read, write, or delete it.
- **Communities and Challenges (/communities/{communityId})**:
  - Admin/Owner boundaries: Only the creator of the community can update parameters like cover, rules, description, and prizes.
  - Membership participation: Regular users can only append themselves to the `participants` or `invitedUsers` lists.
- **Kofu and BS Subscriptions**:
  - Direct private verification: Users can only see and update their own status.

---

## 2. The "Dirty Dozen" Attack Payloads

The following 12 malicious payload operations are designed to test the system integrity. Each must fail with `PERMISSION_DENIED`.

1. **Self-Elevated Streak Hijack**
   - *Target*: `update` on `/users/user-somebody` by `user-malicious`
   - *Payload*: `{ streak: 9999, name: "Leaked" }`
   - *Vulnerability*: Identity Spoofing / Self-Elevated State modification.

2. **Shadow Field Injection**
   - *Target*: `create` on `/activities/act-new`
   - *Payload*: `{ id: "act-new", userId: "victim-uid", points: 2, timestamp: "2026-06-11", isVerifiedAdmin: true }`
   - *Vulnerability*: Schema bypass.

3. **Retroactive Points Inflation**
   - *Target*: `create` on `/activities/act-hack` by `attacker-uid`
   - *Payload*: `{ id: "act-hack", userId: "attacker-uid", type: "daimoku", points: 500, minutes: 10000, timestamp: "2026-06-11" }`
   - *Vulnerability*: Value Poisoning / Business Logic Violations.

4. **Post Body Hijacking**
   - *Target*: `update` on `/posts/post-victim` by `attacker-uid` (where post belongs to `victim-uid`)
   - *Payload*: Change `content` or hijack `userName`.
   - *Vulnerability*: Identity Spoofing / Impersonation.

5. **Goal Progress Forge**
   - *Target*: `update` on `/goals/goal-victim` by `attacker-uid`
   - *Payload*: `{ progress: 100 }`
   - *Vulnerability*: Unrestricted multi-tenant access.

6. **Community Rule Tampering**
   - *Target*: `update` on `/communities/comm-gold` by non-creator
   - *Payload*: `{ description: "Hacked Rules Text" }`
   - *Vulnerability*: Authorization escalation.

7. **Impersonated Chat Emission**
   - *Target*: `create` on `/communities/comm-gold/chat_messages/msg-hack` by `attacker-uid`
   - *Payload*: `{ userId: "victim-uid", userName: "Antônio Souza", content: "Offensive message" }`
   - *Vulnerability*: Spoofed Chat Authoring.

8. **Blanket Collection Scraping (List Attack)**
   - *Target*: `list` on `/goals` or `/users`
   - *Payload*: No query filters (read entire collection)
   - *Vulnerability*: Insecure List query delegation and PII Leak.

9. **Terminal Challenge Lockout Bypass**
   - *Target*: `update` on finished community/challenge
   - *Payload*: Change prize or description after community is archived or end date is elapsed.
   - *Vulnerability*: Terminal State violation.

10. **Denial of Wallet Long ID Attack**
    - *Target*: `create` on `/activities/{extremely-large-id-payload}`
    - *Payload*: Doc ID with 10KB of junk characters.
    - *Vulnerability*: ID Poisoning / Wallet Exhaustion.

11. **Self-Appointed Brasil Seikyo Renewal**
    - *Target*: `update` on `/bs_subscription/victim-uid` by `attacker-uid`
    - *Payload*: Change status to `ativo`.
    - *Vulnerability*: Financial privilege escalation.

12. **Future activity dates injection**
    - *Target*: `create` on `/activities/future-act`
    - *Payload*: Activity dated year 2100.
    - *Vulnerability*: Temporal temporal integrity failure.

---

## 3. Security Assertions

Every database transaction is evaluated inside the security engine against three pillars:
- **Authentication**: `request.auth != null && request.auth.token.email_verified == true`
- **Typing & Validation**: Every write is parsed through `isValid[Entity]` with size checks on every string.
- **Relational Integrity**: Ownership matches.
