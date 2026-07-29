# HackRails — Product & MVP Specification

> **Product and implementation boundary document**
>
> This file preserves HackRails' product vision while distinguishing the implemented MVP from future design. When this document conflicts with the repository, the current implementation and the current limitations documented in `docs/SECURITY.md` and `docs/TESTING.md` are authoritative.

---

## Current implementation status

> **MVP status:** The core HackRails MVP is implemented and runnable. It includes one fixed event, one remote MCP, one free tool, two premium tools, participant tokens, policy enforcement, dashboards, lifecycle controls, demo controls, and x402/Hedera settlement plumbing.
>
> **Runtime modes:** `DEMO_MODE=false` is the default and performs real Hedera Testnet x402 settlement when the live account, provider, facilitator, and database configuration are present. `DEMO_MODE=true` fabricates premium receipts instead of creating blockchain transactions and enables the reset/seed demo controls.

| Area | Current implementation | Future or aspirational design |
| --- | --- | --- |
| Event | Fixed event ID `hedera-x402-demo`; display name `Hedera x402 Builder Sprint`; two seeded participants | Full event authoring and multiple independently configured events |
| Tools and policy | Fixed catalog, prices, and limits in the API/provider: one free tool, two premium tools | Organizer-configurable catalog, pricing, quotas, and provider marketplace |
| Organizer knowledge | Curated files under `organizer-knowledge/` loaded by the validators | Organizer source upload, approval, versioning, and per-event management |
| Audit | Public GitHub and submitted evidence checks, HashScan/Mirror Node checks, and curated organizer checks | Video/demo validation, broader repository analysis, and exact end-to-end evidence correlation |
| Operations | Organizer dashboard, participant dashboard, event and participant lifecycle controls, and demo reset/seed controls | Full registration, roles, audit log, rate limiting, and production hardening |

Later sections use **Current MVP** and **Future** callouts where the distinction matters. Examples and checklists marked **Future** are not claims that the current repository is incomplete.

## 1. Executive Summary

**HackRails** is infrastructure for hackathons that allows organizers to fund premium tools consumed directly through participants' coding agents, such as Codex or Claude Code.

Participants do not pay. The organizer creates a sponsored budget and defines:

- which tools are available;
- how much each tool costs;
- how many times each team can use it;
- the maximum budget each participant can consume;
- when access is active or paused.

Each premium call is processed through an x402 flow and settled on Hedera Testnet. The participant receives the result inside their agent, while the organizer sees usage, spending, impact, and transaction metrics.

### One-Line Pitch

> HackRails lets hackathon organizers sponsor premium MCP tools that participants access directly from their coding agents, with programmable usage limits and x402 payments settled on Hedera.

### Tagline

> **Sponsored tools for every builder.**

---

## 2. Problem

Hackathon organizers commonly face:

- repetitive questions about rules, tracks, deliverables, and dates;
- participants who misunderstand important requirements;
- projects disqualified because of incomplete documentation or evidence;
- low adoption of sponsor technologies;
- limited visibility into where participants get stuck;
- manual support that is difficult to scale;
- limited traceability into premium tool usage;
- difficulty funding agentic capabilities from different providers.

Participants already have powerful reasoning models. Therefore, HackRails **does not try to sell them generic reasoning**.

The differentiating value is providing access to information and capabilities that the local model does not have:

- official or curated organizer knowledge;
- winning-project patterns;
- common disqualification errors;
- official clarifications;
- sponsor objectives;
- technical validators;
- private or semi-private tests;
- standardized procedures;
- verifiable results;
- usage metrics and policies.

---

## 3. Product Thesis

### What HackRails Is NOT

HackRails is not:

- a generic chatbot for hackathons;
- a prompt generator;
- a store for `SKILL.md` files;
- an agent that simply reads a public URL;
- a pay-to-download-a-ZIP platform;
- a replacement for Codex or Claude Code;
- a DRM system for Agent Skills;
- a full marketplace in the MVP.

### What HackRails IS

HackRails is:

> An official layer of tools, knowledge, and services funded by the organizer and consumed by participants' agents.

The ideal architecture combines:

- **Free Agent Skill:** guides the agent, prepares context, and decides when to use tools.
- **Remote MCP:** exposes official and premium tools.
- **Sponsor Gateway:** enforces policies and pays for x402 calls.
- **Hedera:** settles payments and provides payment traceability.
- **Dashboard:** shows budget, spending, tools, teams, metrics, and transaction history.

---

## 4. Actors

### 4.1 Organizer

**Current MVP:** The organizer operates a preloaded event with a fixed budget, fixed tool catalog, fixed prices and limits, two seeded participants, a dashboard, and lifecycle controls. The organizer can enable, pause, and resume participant access; reveal participant access; copy MCP configuration; pause/resume a participant; reset that participant's demo usage; inspect metrics; and review transactions.

**Future:** Organizer authoring will support creating events, uploading or approving versioned sources, defining budgets, configuring prices and quotas, managing a catalog, and distributing access without code or fixture changes.

### 4.2 Participant or Team

The participant:

- installs or connects to the MCP;
- can use a free Agent Skill;
- makes queries from Codex, Claude Code, or another compatible client;
- consumes free and premium tools;
- does not manage wallets;
- does not sign payments;
- does not receive private keys;
- does not pay directly.

### 4.3 Tool Provider

In the MVP, HackRails may operate the tools.

In the future, different providers could publish:

- validators;
- datasets;
- sandboxes;
- models;
- APIs;
- specialized analyses;
- testing services;
- architecture reviews.

### 4.4 Sponsor Gateway

The Sponsor Gateway:

- identifies the event and participant;
- verifies policies;
- reserves budget;
- handles the `402 Payment Required` response;
- signs and executes the payment;
- records the transaction;
- returns the result to the MCP.

---

## 5. B2B2C Model

- **Buyer and payer:** organizer.
- **End user:** participant.
- **Technical client:** agent or MCP client.
- **Economic unit:** premium call.
- **Organizer benefit:** scalable support, fewer errors, and metrics.
- **Participant benefit:** frictionless access to official tools.
- **Provider benefit:** micropayments for consumed capacity.

---

## 6. Main Flow

```mermaid
sequenceDiagram
    participant P as Participant
    participant A as Codex / Claude Code
    participant S as Agent Skill
    participant M as HackRails MCP
    participant G as Sponsor Gateway
    participant T as Premium Tool
    participant H as Hedera Testnet

    P->>A: "Audit my submission"
    A->>S: Reads the event workflow
    S->>A: Prepares context and recommends a tool
    A->>M: audit_submission(...)
    M->>G: Authorize participant and allowance
    G->>T: Request service
    T-->>G: HTTP 402 Payment Required
    G->>G: Validate policy and reserve budget
    G->>H: Execute x402 payment
    H-->>G: Transaction confirmed
    G->>T: Retry request with payment
    T-->>G: Premium result
    G-->>M: Result + transaction_id
    M-->>A: Audit
    A-->>P: Findings and actions
```

This sequence describes the live path. In `DEMO_MODE=true`, the policy and ledger flow still runs, but the premium provider result and receipt are fabricated and no Hedera settlement occurs.

---

## 7. Exact MVP Scope

> **Current MVP:** The following scope is implemented in the repository. It is a fixed/preloaded vertical slice, not a general-purpose event management product.

The MVP must demonstrate one thesis:

> An organizer can fund agentic tools consumed by participants, enforce programmable policies, and, in live mode, settle every premium use through x402 on Hedera.

### Required Components

1. Preloaded event.
2. Initial activation screen.
3. Organizer dashboard.
4. One remote MCP.
5. One free Agent Skill.
6. One free tool.
7. Two premium tools.
8. Sponsor Gateway.
9. Allowance controls.
10. Hedera Testnet.
11. Metrics.
12. Transaction history.
13. Event sessions and traceability.

---

## 8. Preloaded Event

The MVP does not implement full onboarding or event authoring.

The system starts with this already configured event:

```text
Hedera x402 Builder Sprint
```

The canonical runtime values are:

```text
event_id: hedera-x402-demo
display_name: Hedera x402 Builder Sprint
```

The official competition source is referred to as the Hedera x402 Bounty in organizer guidance, but the canonical local event record and dashboard display name are `hedera-x402-demo` / `Hedera x402 Builder Sprint`.

### Preloaded Data

Current runtime data includes:

- canonical event ID and display name;
- `DRAFT`, `ACTIVE`, or `PAUSED` status;
- `100 USDC` event budget and configured account identifiers;
- fixed three-tool catalog with prices and call limits;
- two initial participants with allowances and hashed token records;
- curated organizer knowledge files;
- x402 provider and facilitator configuration.

Dates, track details, and submission requirements are returned by the free guidance response from the curated event brief; they are not editable event columns in the current database.

### Visible Premium Sources

Example:

```text
Organizer Knowledge
✓ Previous winners dataset
✓ Official clarifications
✓ Rejection patterns
✓ Sponsor integration guidance
✓ Official submission validator
```

The current sources are curated files in `organizer-knowledge/` loaded into the shared validator runtime. Source upload, approval, and version management are future organizer capabilities.

### Demo data notice

> **Demo data notice**
>
> The organizer intelligence used by `validate_project_strategy` and
> `audit_submission` is a synthetic, curated dataset created for the HackRails
> MVP using the current competition as context.
>
> It demonstrates how official rules, historical projects, sponsor objectives,
> clarifications, rejection patterns, and submission criteria would be supplied
> or approved by a real hackathon organizer in production.
>
> The dataset must not be interpreted as official statements, historical results,
> or private judging information published by Hedera.

---

## 9. Event States

> **Current MVP:** `DRAFT`, `ACTIVE`, and `PAUSED` are implemented. A demo reset creates the event in `DRAFT`; when the API starts in live mode with no event, live bootstrap creates the event in `ACTIVE`.

Use only three states:

```text
DRAFT
ACTIVE
PAUSED
```

### DRAFT

- Event is ready to be activated.
- MCP unavailable to participants.
- Calls are not accepted.
- The main screen shows the activation button.

### ACTIVE

- MCP available.
- Free and premium tools enabled.
- Sponsor Gateway can pay for calls.
- Operational dashboard.

### PAUSED

- New calls blocked.
- No `402` is issued.
- No payment is executed.
- Metrics and history are preserved.
- The organizer can resume the event.

---

## 10. Organizer UX

> **Current MVP:** The dashboard and lifecycle controls below are implemented for the fixed event. Editable event configuration, catalog management, pricing, quotas, and source management remain future work.

### 10.1 Initial Screen

```text
Hedera x402 Builder Sprint

Status: Ready to launch

Organizer knowledge
✓ Previous winners dataset
✓ Official clarifications
✓ Rejection patterns
✓ Submission validator

Sponsored budget:       100.00 USDC
Per-team allowance:       0.20 USDC
Daily team limit:         0.13 USDC (sum of all premium tool allowances)

[ Enable participant MCP ]
```

### 10.2 Activation

When `Enable participant MCP` is clicked:

1. Change `status` to `ACTIVE`.
2. Enable calls for `event_id`.
3. The dashboard exposes the participant MCP configuration and token workflow.
4. Keep the organizer on the dashboard.

Deploying a new MCP is not necessary. A multi-tenant MCP server is used.

### 10.3 Dashboard

The current dashboard shows:

- MCP status;
- allocated budget;
- spent budget;
- remaining budget;
- participants served;
- total calls;
- free calls;
- sponsored calls;
- average cost per participant;
- derived impact indicators;
- transaction history;
- participants and allowances;
- failure and policy-rejection counts;
- usage-by-tool call counts.

The impact indicators are demo metrics/proxies derived from settled tool-call counts. They are not direct audit findings or a substitute for reviewing individual tool results.

### 10.4 Pause

Recommended button:

```text
[ Pause participant access ]
```

Do not use “Shutdown server” or “Delete MCP”.

When paused:

- `status = PAUSED`;
- new calls rejected;
- data preserved;
- `Resume participant MCP` is shown.

---

## 11. Remote MCP

### Principle

The MCP is the product's technical core.

It must be:

- remote;
- multi-tenant;
- centrally controlled;
- authenticated;
- updatable without redistributing files;
- able to enforce allowances;
- able to return structured results.

### Do Not Do

Do not generate a downloadable local MCP for each participant in the MVP.

That would add:

- installation problems;
- operating-system differences;
- exposed credentials;
- outdated versions;
- more support burden;
- a more fragile demo.

---

## 12. MVP MCP Tools

The MCP will have exactly three tools.

### 12.1 `get_event_guidance`

**Type:** free.

**Objective:** answer basic questions using public and official information.

#### Input

```json
{
  "question": "What must I show in the demo?"
}
```

#### Output

- rules;
- dates;
- tracks;
- deliverables;
- resources;
- public criteria;
- official links.

#### Economic Behavior

- does not return `402`;
- does not consume budget;
- records a free call for metrics.

---

### 12.2 `validate_project_strategy`

**Type:** low-cost premium.

**Initial MVP price:** `0.01 USDC`.

**Objective:** evaluate an idea against exclusive or curated organizer knowledge.

#### Must Not Be

A simple LLM call that analyzes a description.

#### Must Combine

```text
Participant idea
+ official rules
+ winning projects
+ organizer comments
+ saturation patterns
+ sponsor objectives
+ common errors
= strategic evaluation
```

#### Input

```json
{
  "event_id": "hedera-x402-demo",
  "project_name": "HackRails",
  "project_summary": "Organizer-funded MCP tools for hackathon participants",
  "problem": "Teams need organizer-backed intelligence and paid tools.",
  "target_users": "Hackathon organizers and participants",
  "selected_track": "hedera-x402-bounty",
  "planned_integrations": ["x402", "Hedera"],
  "business_model": null,
  "current_stage": "MVP"
}
```

`business_model` is optional and nullable. All other fields shown above are required; `current_stage` must be `IDEA`, `PROTOTYPE`, `MVP`, or `READY_TO_SUBMIT`.

#### Expected Output

```text
Strategic fit: 82/100

Strengths
- Native x402 usage
- Clear organizer value
- Good agentic commerce narrative

Risks
- Marketplace scope may be too broad
- Organizer intelligence must be concrete
- Hedera usage must be visible in the demo

Organizer-backed insights
- Previous finalists showed settlement end-to-end
- Generic AI wrappers underperformed
- Judges prioritized working flows over feature count

Recommended next actions
1. Keep only three MCP tools
2. Show HashScan transaction
3. Quantify organizer impact
```

---

### 12.3 `audit_submission`

**Type:** primary premium.

**Initial MVP price:** `0.05 USDC`.

**Objective:** audit a submission using rules, organizer knowledge, and validators.

#### Must Combine

```text
Repository and submission
+ official checklist
+ clarifications
+ disqualification patterns
+ sponsor validators
+ evidence verification
= reproducible audit
```

#### Input

```json
{
  "event_id": "hedera-x402-demo",
  "project_name": "HackRails",
  "repository_url": "https://github.com/example/hackrails",
  "selected_track": "hedera-x402-bounty",
  "project_summary": "A sponsored agent toolkit using x402 and Hedera.",
  "transaction_links": [
    "https://hashscan.io/testnet/transaction/..."
  ],
  "submission_url": "https://example.com/submission",
  "deadline": "2026-07-31T23:59:00.000Z"
}
```

`submission_url` and `deadline` are optional and nullable. `transaction_links` is optional at the request boundary and defaults to `[]`. The other fields shown above are required. The schema rejects unknown fields, so use `submission_url` rather than `demo_url` and `selected_track` rather than `track`.

#### Current Checks

- public GitHub repository accessibility and visibility;
- GitHub repository metadata and topics;
- README presence, length, installation keywords, HashScan links, and x402/payment keywords;
- license presence;
- submitted public evidence links when supplied; HashScan links are actively fetched and checked, while arbitrary `submission_url` availability is not independently fetched;
- HashScan URL parsing and Hedera Mirror Node transaction status, network, payer, and receiver checks;
- event rules, judging criteria, sponsor objectives, previous projects, rejection patterns, and submission checklist knowledge;
- project evidence in `project_summary` and the submitted transaction links.

The audit does **not** validate a video, whether a demo is available, the initial visible HTTP `402` challenge, exact payment-to-submission correlation, or private repositories. It does not execute arbitrary repository code. An optional `submission_url` is accepted as input but is not a video or browser-availability validator.

#### Expected Output

```text
Submission readiness: 76%

Passed: 16
Warnings: 3
Blocking issues: 2

Blocking issues
1. No public HashScan evidence found
2. Repository README does not mention x402 or payment evidence

Organizer intelligence
- Missing on-chain evidence is a recurring rejection reason
- The organizer expects sponsored-payment policies to be visible

Recommended actions
1. Add HashScan transaction link
2. Describe the x402 lifecycle and settlement evidence in the README
3. Add installation instructions
```

---

## 13. Agent Skill

The Agent Skill is free and complementary.

### Responsibilities

- explain the workflow;
- know the MCP tools;
- prepare context;
- avoid unnecessary premium calls;
- indicate when to use each tool;
- check locally first;
- explain to the user that the call is sponsored;
- interpret the result.

### Example Behavior

Before calling `audit_submission`:

1. check the README locally;
2. check the structure;
3. look for links;
4. detect obvious problems;
5. request missing data;
6. call the premium tool only if it adds value.

### Suggested Structure

```text
hackrails-participant-skill/
├── SKILL.md
├── references/
│   └── event-overview.md
└── workflows/
    ├── understand-event.md
    ├── validate-strategy.md
    └── audit-submission.md
```

### Product Rule

The Skill does not contain the complete premium knowledge. Premium knowledge lives in HackRails and is accessed through MCP tools.

---

## 14. Sponsor Gateway

The Sponsor Gateway is the economic core.

> **Current implementation:** In live mode, the API is the x402 buyer/sponsor: it reserves capacity, calls the provider, validates the payment requirement, submits settlement through the facilitator, retries the provider request, and records the result. In `DEMO_MODE=true`, the same policy and ledger path runs, but premium receipts are fabricated and no Hedera transaction is created.

### Minimum Responsibilities

1. authenticate the participant;
2. identify the event;
3. check the status;
4. check that the tool is enabled;
5. check the event budget;
6. check the participant allowance;
7. check the per-tool limit;
8. temporarily reserve the amount;
9. execute the x402 flow;
10. record the transaction;
11. update metrics;
12. return the result.

### Flow

```text
MCP request
    ↓
Authenticate token
    ↓
Check event ACTIVE
    ↓
Check participant allowance
    ↓
Check tool call limit
    ↓
Reserve amount
    ↓
Call premium service
    ↓
Receive HTTP 402
    ↓
Sign and settle on Hedera
    ↓
Retry paid request
    ↓
Persist result and transaction
    ↓
Return response
```

The visible participant result includes the final tool output and transaction metadata. The raw provider challenge is an internal step in the API/provider flow, not a required browser-facing screen.

### Rejections

If the policy check fails:

```text
Sponsored allowance exceeded.
No payment was executed.
```

No payment should occur if:

- event paused;
- invalid token;
- tool disabled;
- allowance exhausted;
- insufficient budget;
- call limit reached;
- price above the allowed amount.

---

## 15. Participant Identification

### Decision

Control primarily by team, not necessarily by individual.

### Without Full Registration

Do not implement:

- email/password;
- email verification;
- password recovery;
- team roles;
- invitations;
- complex onboarding.

### Minimum Credential

**Current MVP:** Two preloaded teams receive fixed demo access tokens. The API stores SHA-256 token hashes; the organizer-only token route reveals a token for the demo workflow. Participants do not receive wallet credentials.

Example participant record:

```text
Team Agentard
Participant ID: team_001
Access token: hxp_participant_xxxxx
Sponsored allowance: 0.20 USDC
```

MCP configuration:

```json
{
  "mcpServers": {
    "hackrails": {
      "url": "https://api.hackrails.example/mcp",
      "headers": {
        "Authorization": "Bearer hxp_participant_xxxxx"
      }
    }
  }
}
```

### Future Token Design

For a production registration system, the token may be:

- signed JWT;
- random API key;
- token stored as a hash.

Never include:

- private key;
- seed phrase;
- wallet credential;
- unlimited-spend token.

---

## 16. Usage Policies

Current fixed catalog and limits:

```text
Event budget:              100.00 USDC
Per-team allowance:          0.20 USDC
Daily team limit:            0.13 USDC (3 × 0.01 + 2 × 0.05)

validate_project_strategy
Price:                       0.01 USDC
Max calls per team:          3

audit_submission
Price:                       0.05 USDC
Max calls per team:          2
```

### Control Levels

```text
Global budget
     ↓
Per-team allowance
     ↓
    Aggregate daily premium-call limit
     ↓
Per-tool limit
```

---

## 17. Idempotency and Concurrency

### Idempotency key

Each premium call must include a unique key.

Example:

```text
team001-audit-submission-request007
```

If the request is repeated:

- return the previous result;
- do not execute a new payment;
- do not duplicate metrics.

### Budget Reservation

Before paying:

1. create a `PENDING` record;
2. reserve the amount;
3. execute the payment;
4. change to `SETTLED`;
5. confirm usage.

If it fails:

- change to `FAILED`;
- release the reservation;
- do not deduct the budget.

This prevents concurrent calls from spending the same balance.

---

## 18. Metrics

Metrics are mandatory.

> **Current MVP:** The organizer dashboard exposes aggregate budget and consumption, call totals, participants, usage-by-tool call counts, failed payments, policy rejections, transaction rows, and derived impact indicators. The participant dashboard exposes only that participant's event, budget, tool availability, and usage counters.

### 18.1 Financial Metrics

- allocated budget;
- spent budget;
- remaining budget;
- average cost per participant;
- settled sponsored-call count;
- failed payments;
- policy-rejected payments.

### 18.2 Usage Metrics

- participants served;
- active teams;
- total calls;
- free calls;
- sponsored calls;
- most-used tool;
- calls per team;
- usage rate by tool.

### 18.3 Impact Metrics

The current dashboard displays these derived demo indicators:

- missing requirements detected;
- submissions audited;
- ready submissions;
- blocking issues detected.

These are proxies, not direct audit findings. The current implementation derives them from settled strategy-validation and audit call counts (`requirementsMissing` is two per settled strategy call, `submissionsReady` is a bounded count, and `blockersFound` follows audit count). Individual validator results remain the evidence for an actual finding.

### Example

```text
Participants supported:       42
Sponsored calls:             137
Free calls:                  204
Requirements missing found:   89
Submissions ready:            14
Budget spent:               3.42 USDC
```

---

## 19. Transaction History

Each premium use must record:

- event;
- participant/team;
- tool;
- price;
- status;
- transaction ID;
- HashScan link;
- timestamp;
- idempotency key;
- latency;
- associated result.

Example:

```text
Team Agentard
Tool: audit_submission
Amount: 0.05 USDC
Status: Settled
Transaction: 0.0.xxxxx@...
[ View on HashScan ]
```

---

## 20. Event Session Lifecycle

Hedera transactions cannot be deleted, but the current local demo reset is destructive. It deletes local usage records, participants, demo sessions, tools, and events in `DEMO_MODE=true`, then creates a new DRAFT event and open live demo session. Any Hedera transactions already created remain immutable on-chain, but their local ledger rows are not preserved through reset. The seed action can then add fabricated historical activity to a separate closed local session.

### Conceptual Entity

```json
{
  "event_id": "hedera-x402-demo",
  "demo_session_id": "hedera-x402-2026-07-23-001",
  "initial_budget": 100,
  "spent_in_session": 0,
  "status": "DRAFT"
}
```

### Session Transition

1. Demo reset deletes the current local event/session data and creates a new event in `DRAFT`.
2. The organizer activates participant access.
3. The API reserves and settles premium calls through x402, or fabricates receipts in demo mode.
4. Demo seed may add a closed, fabricated historical session for dashboard presentation.
5. In live mode, startup bootstraps the canonical event directly in `ACTIVE` when no event exists.

The UI identifies the current or seeded session. On-chain transaction history remains on Hedera; local history is preserved only until a demo reset deletes it.

---

## 21. Participant Dashboard

> **Current MVP:** The participant-facing `/team` dashboard is read-only. It supports authentication, refresh, `Import MCP`, and `Download Skill`; it does not expose participant pause or usage-reset controls. The organizer dashboard, not the participant dashboard, exposes `Copy MCP`, participant pause/resume, and `Reset usage` actions.

Minimum section:

```text
Team Agentard
Spent: 0.06 / 0.20 USDC
Strategy validations: 1 / 3
Submission audits: 1 / 2
Status: Active

Team Builder Two
Spent: 0.02 / 0.20 USDC
Strategy validations: 2 / 3
Submission audits: 0 / 2
Status: Active
```

Current participant actions:

```text
[ Refresh ]
[ Import MCP / Copy config ]
[ Download Skill ]
```

Organizer-only participant controls:

```text
[ Reveal access ]
[ Copy MCP ]
[ Pause / Resume ]
[ Reset usage ]
```

Do not implement complex organizational management.

---

## 22. Minimum Data Model

> **Current schema:** PostgreSQL currently defines five tables. The schema is a compact operational ledger for one canonical event; it does not yet implement the full conceptual model below.

### Current `events`

```text
id
name
status
total_budget
spent_budget
reserved_budget
currency
organizer_account_id
recipient_account_id
created_at
```

### Current `demo_sessions`

```text
id
event_id
status
seeded
created_at
closed_at
```

### Current `participants`

```text
id
event_id
demo_session_id
name
external_id
token_hash
allocated_budget
spent_budget
reserved_budget
daily_limit
status
created_at
```

### Current `tools`

```text
name
description
type
price
max_calls
enabled
```

Prices and per-tool limits are currently columns on `tools`, not a separate event-specific policy table. The catalog is fixed in the API/provider code and is not editable from the organizer dashboard.

### Current `usage_records`

```text
id
event_id
demo_session_id
participant_id
tool_name
idempotency_key
price
status
transaction_id
hashscan_url
request_payload
result_payload
error_code
seeded
latency_ms
created_at
settled_at
settlement_mode
x402_state
payment_required
payment_response
payment_payload_hash
facilitator_receipt
```

The current database has no `daily_usage` table; daily spend is calculated from usage records. Organizer knowledge is loaded from files under `organizer-knowledge/`, not from an `organizer_sources` table.

### Future extensions

The following conceptual entities remain useful for a configurable platform but are not current tables:

```text
EVENT extensions: slug, description, starts_at, ends_at, updated_at
DEMO_SESSION extensions: initial_budget, spent_budget, reserved_budget
TOOL_POLICY: event_id, tool_id, price, currency, max_calls_per_participant, daily_call_limit, enabled
ORGANIZER_SOURCE: event_id, name, type, visibility, content_location, version, enabled, created_at
DAILY_USAGE: participant_id, date, spent, call_count
```

If future organizer source management is implemented, its conceptual record may include:

```text
id
event_id
name
type
visibility
content_location
version
enabled
created_at
```

---

## 23. API Surface

> **Current API:** The routes below are implemented in `apps/api/src/index.ts`. The canonical event parameter is restricted to `hedera-x402-demo`. Routes marked with `X-Admin-Key` require the shared local/demo admin key.

### Current routes

```http
GET  /health
GET  /api/hackrails-skill/download
GET  /api/participant/dashboard                 # Bearer participant token
GET  /api/events/:eventId/dashboard
GET  /api/events/:eventId
POST /api/events/:eventId/activate              # X-Admin-Key
POST /api/events/:eventId/pause                 # X-Admin-Key
POST /api/events/:eventId/resume                # X-Admin-Key
POST /api/participants/:id/:action              # X-Admin-Key; pause, resume, reset-demo-usage
GET  /api/events/:eventId/participants/:id/token # X-Admin-Key
POST /api/admin/demo/reset                      # X-Admin-Key; DEMO_MODE only
POST /api/admin/demo/seed                       # X-Admin-Key; DEMO_MODE only
POST /internal/mcp/call                         # Bearer participant token
```

The participant action route accepts the optional `eventId` query parameter and defaults to `hedera-x402-demo`.

`POST /internal/mcp/call` accepts one of the three MCP tools and validates its payload with the exact schemas in `apps/api/src/input.ts`. The public MCP transport is served separately by `apps/mcp` at `/mcp` and forwards to this internal API route.

At startup, the API runs database migrations and synchronizes the participant daily limit. If no event exists, demo mode calls `resetDemo()` and creates the canonical event in `DRAFT`; the organizer can invoke the separate seed action afterward. Live mode calls `bootstrapLive()` and creates the canonical event in `ACTIVE` state. Live startup requires `HEDERA_RECIPIENT_ACCOUNT_ID`.

### Future API extensions

The following routes describe the intended configurable platform and are **not implemented** today:

```http
POST /api/events
POST /api/events/:eventId/sources
PUT  /api/events/:eventId/tools
GET  /api/events/:eventId/metrics
GET  /api/events/:eventId/transactions
POST /api/events/:eventId/participants
```

Internal sponsor subroutes such as `/internal/sponsor/authorize`, `/reserve`, `/settle`, and `/release` are also future abstractions, not current public API routes. The current API performs those responsibilities inside the MCP call flow.

---

## 24. Logical Architecture

```mermaid
flowchart LR
    O[Organizer Dashboard]
    P[Participant Agent]
    S[Agent Skill]
    M[Remote MCP Server]
    A[Auth & Policy Layer]
    G[Sponsor Gateway]
    F[x402 Facilitator]
    H[Hedera Testnet]
    K[Organizer Knowledge]
    T[Premium Tools]
    D[(Database)]

    O --> D
    O --> K
    P --> S
    S --> M
    M --> A
    A --> D
    A --> G
    G --> T
    T --> K
    T --> G
    G --> F
    F --> H
    G --> D
    M --> P
```

---

## 25. Economic Separation

The event must represent distinct economic actors:

- organizer wallet: payer;
- provider wallet: recipient;
- participant: service beneficiary.

Even if the team controls both wallets on Testnet, the UI and architecture must make the separation clear.

### Avoid

```text
Our wallet pays our endpoint and returns to our wallet
```

without explanation.

### Show

```text
Organizer Budget Wallet
    → x402 payment
    → Premium Tool Provider Wallet
    → Result delivered to participant
```

---

## 26. Security and Privacy

> **Current MVP limitations:** The local/demo deployment uses one shared admin key, has no rate limiting, has no admin audit log, and stores the participant token in browser `sessionStorage`. These are known limitations, not production claims. The HTTPS, secret-management, credential rotation, rate-limiting, and structured audit-logging items in the deployment checklist are future hardening work.

### Security

- private keys only in a secure backend;
- limited participant tokens;
- per-tool limits;
- price validation;
- idempotency;
- never return secrets;
- separate admin routes;
- protect administrative session and fixture endpoints with authorization.

Per-tool limits, price validation, idempotency, secret boundaries, and protected admin routes are current. Rate limiting and administrative audit logs are future hardening.

### Privacy

By default:

- aggregated metrics for the organizer;
- do not expose private code;
- do not store complete repositories unnecessarily;
- explicit consent for analysis;
- minimal retention;
- personal results visible to the participant;
- avoid presenting the product as surveillance.

The current participant browser flow uses `sessionStorage` for the team token. This is acceptable for the MVP demo but requires stronger browser/session controls before a high-value production event.

### Judge Information

Allowed:

- public biographies;
- areas of expertise;
- stated criteria;
- publications;
- official comments.

Do not promise:

- private preferences;
- secret criteria;
- privileged information;
- judge manipulation.

Use the term:

```text
Organizer-backed intelligence
```

---

## 27. Recommended Demo Script

Target duration: approximately 4 minutes.

### 0:00–0:25 — Problem

Explain:

- organizers receive repeated questions;
- participants fail to meet requirements;
- agentic tools have a cost;
- HackRails allows them to be funded per use.

### 0:25–0:50 — Preloaded Event

Show:

- name;
- official knowledge;
- budget;
- limits;
- tools.

Click:

```text
Enable participant MCP
```

### 0:50–1:15 — Free Query

From Codex:

```text
What must I show in the demo?
```

Call `get_event_guidance`.

Show:

- response;
- no payment occurred;
- budget unchanged.

### 1:15–2:00 — Premium Validation

From Codex:

```text
Evaluate whether our idea is competitive using the organizer's official intelligence.
```

Call `validate_project_strategy`.

Show:

```text
Strategy result
Settlement mode: HEDERA_X402_FACILITATOR (live) or DEMO_MODE (demo)
Amount: 0.01 USDC
Transaction ID and HashScan link when live
```

The `402 Payment Required` challenge and payment submission occur inside the API/provider flow. Do not imply that the browser visibly presents the raw challenge. Show the final result, amount, settlement mode, and public HashScan evidence when running live.

### 2:00–2:50 — Premium Audit

From Codex:

```text
Audit the submission and tell me whether we are ready.
```

Call `audit_submission`.

Show:

- structured result;
- blocking issues;
- cost `0.05 USDC`;
- settlement mode and transaction ID;
- public HashScan evidence when running live.

### 2:50–3:30 — Updated Dashboard

Show:

- new calls;
- reduced budget;
- team allowance;
- usage by tool;
- metrics;
- transactions.

Open HashScan.

### 3:30–4:00 — Vision

Explain:

> Today HackRails offers official intelligence and validation. Tomorrow, any sponsor can publish datasets, sandboxes, models, or tools and charge directly for each use.

---

## 28. What Is NOT in the MVP

Exclude:

- full organizer registration;
- traditional login;
- email verification;
- password recovery;
- organization creation;
- invitations;
- multiple roles;
- dynamic creation of any hackathon from a URL;
- Agent Skill generator;
- provider marketplace;
- multiple events in production;
- mainnet;
- local MCP;
- mobile app;
- Devpost integration;
- video analysis;
- arbitrary repository execution;
- predictive win scoring;
- NFT;
- proprietary token;
- Stripe;
- traditional billing;
- advanced fraud prevention;
- white-labeling;
- perfect simultaneous support for all MCP clients;
- internal chat;
- full teams and collaboration;
- DRM.

---

## 29. Optional Features if Time Allows

> **Future:** These are backlog ideas, not current MVP commitments.

Priority after the main flow:

1. `review_architecture`;
2. low-budget alert;
3. visual allowance editing;
4. CSV export;
5. tool comparison;
6. “coming soon” listing;
7. visible rejection when a limit is exhausted;
8. versioned organizer sources;
9. activity view by team;
10. safe payment retries.

---

## 30. MVP Acceptance Criteria

The criteria below separate repository implementation from evidence that requires a configured live environment. Future product aspirations are listed separately and are not current MVP failures.

### Implemented / verified in the repository

- [x] A fixed event uses ID `hedera-x402-demo` and display name `Hedera x402 Builder Sprint`.
- [x] Demo reset creates the event in `DRAFT`; activation, pause, and resume change whether calls are accepted; live bootstrap creates the event in `ACTIVE`.
- [x] A remote MCP exposes `get_event_guidance`, `validate_project_strategy`, and `audit_submission` with strict schemas.
- [x] The free tool runs without payment; premium calls use the live x402 provider path when `DEMO_MODE=false` and fabricated receipts when `DEMO_MODE=true`.
- [x] Participant bearer tokens are hashed for lookup, and fixed participant allowances plus per-tool limits are enforced.
- [x] Usage records track `PENDING`, `SETTLED`, `FAILED`, and `REJECTED` outcomes; rejected calls do not execute payment.
- [x] Idempotency keys prevent duplicate settlement and stale reservations are recoverable.
- [x] The organizer dashboard updates aggregate budget, consumption, calls, participants, tools, transactions, failures, rejections, and derived impact proxies.
- [x] The participant dashboard is read-only apart from refresh and resource-copy/download actions.
- [x] Demo-only reset and seed controls exist; reset deletes local demo ledger data and seed creates fabricated historical activity.

### Live evidence / manual verification

- [ ] Run a controlled premium call with `DEMO_MODE=false` and a funded Hedera Testnet account.
- [ ] Confirm the live response contains a transaction ID, settlement metadata, and a public HashScan link.
- [ ] Confirm payer and provider recipient are distinct accounts in the live transaction.
- [ ] Show at least two real Testnet settlements in the dashboard or HashScan; seeded demo rows are not real payments.
- [ ] Run the manual smoke test and demonstrate the final result, amount, settlement mode, and public evidence without presenting the raw internal `402` challenge as a browser UI.

### Future

- [ ] Full organizer registration, event authoring, source upload/versioning, and multiple independently configured events.
- [ ] Editable tools, prices, quotas, provider catalog, and track budgets.
- [ ] Video/demo availability validation, broader repository analysis, and exact payment-to-submission correlation.
- [ ] Production authentication, rate limiting, admin audit logs, stronger browser session controls, and deployment hardening.
- [ ] Marketplace, external providers, and revenue sharing.

---

## 31. Future Implementation Order

> **Future / historical plan:** The vertical-slice sequence below describes how the product could be extended or reconstructed. The current repository already contains the core phases; it is not a checklist of missing MVP work.

### Phase 1 — Minimum Vertical Slice

1. Preloaded event.
2. Preloaded participant.
3. MCP with a temporary premium tool.
4. Basic Sponsor Gateway.
5. Hedera Testnet payment.
6. Transaction record.
7. Response to the agent.

### Phase 2 — Tools

1. `get_event_guidance`.
2. `validate_project_strategy`.
3. `audit_submission`.
4. Preloaded premium sources.

### Phase 3 — Policies

1. per-team allowance;
2. per-tool limit;
3. active/paused status;
4. idempotency;
5. budget reservation.

### Phase 4 — Dashboard

1. budget;
2. metrics;
3. participants;
4. tools;
5. transaction history.

### Phase 5 — Demo

1. reset;
2. seed;
3. Agent Skill;
4. script;
5. HashScan;
6. video.

---

## 32. Prioritization Rule

Before implementing a feature, ask:

> Does this feature help demonstrate that an organizer can fund agentic tools consumed by participants through x402?

If the answer is no, it is not part of the MVP.

---

## 33. Main Risks

### Risk 1: Looking Like an AI Wrapper

Mitigation:

- visible exclusive sources;
- validators;
- organizer-backed insights;
- reproducible results;
- metrics.

### Risk 2: Artificial x402

Mitigation:

- payment per call;
- tools with different prices;
- separate payer and recipient wallets;
- dashboard;
- HashScan;
- programmable policies.

### Risk 3: Too Many Features

Mitigation:

- three tools;
- one event;
- two initial participants;
- one story.

### Risk 4: Empty Dashboard

Mitigation:

- session-identified activity;
- real calls that update metrics.

### Risk 5: Duplicate Payments

Mitigation:

- idempotency key;
- budget reservation;
- statuses `PENDING`, `SETTLED`, `FAILED`.

### Risk 6: Budget Abuse

Mitigation:

- token per team;
- allowance;
- daily limit;
- per-tool limit;
- pause.

---

## 34. Post-MVP Roadmap (Future)

> The roadmap preserves the long-term HackRails thesis. None of the following capabilities should be read as implemented in the current fixed-event MVP.

### Short Term

- multiple hackathons;
- guided event creation;
- source uploads;
- configurable tools;
- more MCP clients;
- deeper audits.

### Medium Term

- tool marketplace;
- external providers;
- revenue sharing;
- premium datasets;
- sandboxes;
- sponsor validators;
- budgets by track.

### Long Term

- standard infrastructure for developer programs;
- accelerators;
- bootcamps;
- communities;
- grant programs;
- technical events;
- autonomous tool consumption by agents.

---

## 35. Core Message for Judges

> HackRails does not replace the participant’s coding agent. It gives that agent access to organizer-backed knowledge, validators and premium services that it cannot produce locally. Organizers sponsor every call through programmable x402 budgets, while Hedera provides transparent settlement and auditability.

---

## 36. Product Messaging

### Short Description

> HackRails enables organizers to sponsor premium MCP tools that participants consume directly from their coding agents.

### Extended Description

> HackRails turns organizer knowledge, validators and premium resources into official agent tools. Participants use them from Codex or Claude Code without handling wallets, while organizers define quotas, fund usage and track every x402 payment settled on Hedera.

### Demo Line

> Organizers provide the intelligence. HackRails provides the payment and access infrastructure. Participants focus on shipping.

---

## 37. Final Decisions

- Name: **HackRails**.
- Initial market: hackathons.
- Buyer: organizer.
- End user: participant.
- Technical core: remote MCP.
- Complement: free Agent Skill.
- Payment: organizer-sponsored.
- Economic unit: premium call.
- Settlement: x402 on Hedera Testnet.
- Scope: one preloaded event.
- Tools: one free and two premium.
- Control: token, allowance, and per-tool limit.
- Demo: resettable.
- Metrics: mandatory.
- Full registration: outside the MVP.
- Local MCP: outside the MVP.
- Marketplace: roadmap.

---

## 38. Source of Truth

This document must be used to:

- define the backlog;
- create the PRD;
- design the architecture;
- generate tasks for Codex;
- validate decisions;
- control scope creep;
- prepare the README and demo.

When facing an implementation question, prioritize:

1. real x402 flow;
2. organizer value;
3. frictionless participant experience;
4. metrics;
5. demo clarity;
6. future extensibility.
