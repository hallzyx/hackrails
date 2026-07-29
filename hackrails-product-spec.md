# HackRails — Product & MVP Specification

> **Source-of-truth document for implementation**
>
> This file summarizes HackRails' product, UX, architecture, payment, metrics, and MVP scope decisions. Any significant implementation change must be explicitly recorded in a decisions section or ADR.

---

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

The organizer:

- configures the event;
- uploads or approves official sources;
- defines the budget;
- enables or pauses access;
- configures prices and limits;
- distributes MCP access;
- monitors metrics;
- reviews transactions;
- funds usage.

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

---

## 7. Exact MVP Scope

The MVP must demonstrate one thesis:

> An organizer can fund agentic tools consumed by participants, enforce programmable policies, and settle every premium use through x402 on Hedera.

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

The MVP will not implement full onboarding.

The system starts with an already configured event, for example:

```text
Hedera x402 Bounty
```

### Preloaded Data

- name;
- description;
- closing date;
- tracks or category;
- budget;
- per-team limits;
- enabled tools;
- organizer sources;
- initial participants;
- payer wallet;
- recipient wallet;
- x402 configuration.

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

These sources are stored as versioned organizer files and loaded into the API runtime.

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

Use only three states:

```text
DRAFT
ACTIVE
PAUSED
```

### DRAFT

- Event ready to be configured.
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

### 10.1 Initial Screen

```text
Hedera x402 Bounty

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
3. Show the MCP endpoint/configuration.
4. Redirect to the dashboard.

Deploying a new MCP is not necessary. A multi-tenant MCP server is used.

### 10.3 Dashboard

It must show:

- MCP status;
- allocated budget;
- spent budget;
- remaining budget;
- participants served;
- total calls;
- free calls;
- sponsored calls;
- spending by tool;
- average cost per participant;
- missing requirements detected;
- ready/not-ready projects;
- transaction history;
- participants and allowances.

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
  "event_id": "hedera-x402-2026",
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
  "event_id": "hedera-x402-2026",
  "project_summary": "Organizer-funded MCP tools for hackathon participants",
  "selected_track": "x402",
  "planned_integrations": ["x402", "Hedera"],
  "target_users": "Hackathon organizers and participants"
}
```

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
  "event_id": "hedera-x402-2026",
  "repository_url": "https://github.com/example/hackrails",
  "project_summary": "...",
  "demo_url": "...",
  "track": "x402",
  "transaction_links": [
    "https://hashscan.io/testnet/transaction/..."
  ]
}
```

#### Possible Checks

- public repository;
- README;
- license;
- installation instructions;
- demo available;
- valid links;
- evidence of the `402 -> payment -> response` flow;
- Hedera Testnet transaction;
- distinct payer and recipient wallets;
- visible x402 integration;
- event-specific requirements;
- common disqualification errors;
- official checklist.

#### Expected Output

```text
Submission readiness: 76%

Passed: 16
Warnings: 3
Blocking issues: 2

Blocking issues
1. No public HashScan evidence found
2. Demo does not show the initial HTTP 402 response

Organizer intelligence
- Missing on-chain evidence is a recurring rejection reason
- The organizer expects sponsored-payment policies to be visible

Recommended actions
1. Add HashScan transaction link
2. Record the full x402 lifecycle
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

Each team receives:

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

### Token

It may be:

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

Recommended initial configuration:

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

### 18.1 Financial Metrics

- allocated budget;
- spent budget;
- remaining budget;
- average cost per participant;
- spending by tool;
- number of payments;
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

Minimum:

- missing requirements detected;
- submissions audited;
- ready submissions;
- not-ready submissions;
- blocking issues detected.

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

Hedera transactions cannot be deleted. Therefore, each event maintains operational sessions that separate activity periods without altering the settlement history.

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

1. Create the event session with its budget and enabled tools.
2. Activate participant access.
3. Reserve and settle premium calls through x402.
4. Close the session without deleting its ledger records.
5. Start a new session when the organizer needs a clean operational period.

The UI identifies session boundaries and preserves transaction history for auditability.

---

## 21. Participant Dashboard

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

Minimum actions:

```text
[ Copy MCP access ]
[ Pause access ]
[ Reset participant usage ]
```

Do not implement complex organizational management.

---

## 22. Minimum Data Model

### EVENT

```text
id
name
slug
description
status
total_budget
spent_budget
reserved_budget
currency
wallet_account_id
recipient_account_id
starts_at
ends_at
created_at
updated_at
```

### DEMO_SESSION

```text
id
event_id
status
initial_budget
spent_budget
reserved_budget
seeded
created_at
closed_at
```

### PARTICIPANT_ACCESS

```text
id
event_id
demo_session_id
participant_name
participant_external_id
token_hash
allocated_budget
spent_budget
reserved_budget
daily_limit
status
created_at
updated_at
```

### TOOL

```text
id
name
description
type
handler
enabled
```

### TOOL_POLICY

```text
id
event_id
tool_id
price
currency
max_calls_per_participant
daily_call_limit
enabled
```

### ORGANIZER_SOURCE

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

### USAGE_RECORD

```text
id
event_id
demo_session_id
participant_id
tool_id
idempotency_key
price
status
transaction_id
hashscan_url
request_payload
result_payload
error_code
created_at
settled_at
```

### DAILY_USAGE

Optional to simplify queries:

```text
participant_id
date
spent
call_count
```

---

## 23. Suggested API

### Event

```http
GET  /api/events/:eventId
POST /api/events/:eventId/activate
POST /api/events/:eventId/pause
POST /api/events/:eventId/resume
```

### Dashboard

```http
GET /api/events/:eventId/dashboard
GET /api/events/:eventId/metrics
GET /api/events/:eventId/transactions
GET /api/events/:eventId/participants
```

### Participants

```http
POST /api/events/:eventId/participants
POST /api/participants/:participantId/pause
POST /api/participants/:participantId/resume
POST /api/participants/:participantId/reset-demo-usage
```

### Administrative Controls

```http
POST /api/admin/demo/reset
POST /api/admin/demo/seed
```

### MCP / Tools

```text
get_event_guidance
validate_project_strategy
audit_submission
```

### Internal Payments

```http
POST /internal/sponsor/authorize
POST /internal/sponsor/reserve
POST /internal/sponsor/settle
POST /internal/sponsor/release
```

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

### Security

- private keys only in a secure backend;
- limited participant tokens;
- rate limiting;
- per-tool limits;
- price validation;
- idempotency;
- audit logs;
- never return secrets;
- separate admin routes;
- protect administrative session and fixture endpoints with authorization.

### Privacy

By default:

- aggregated metrics for the organizer;
- do not expose private code;
- do not store complete repositories unnecessarily;
- explicit consent for analysis;
- minimal retention;
- personal results visible to the participant;
- avoid presenting the product as surveillance.

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
402 Payment Required
Sponsor policy approved
0.01 USDC settled on Hedera
```

Then show the result.

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
- transaction ID.

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

### Event

- [ ] A preloaded event exists.
- [ ] It can be activated.
- [ ] It can be paused.
- [ ] It can be resumed.
- [ ] The status actually affects calls.

### MCP

- [ ] A remote MCP server exists.
- [ ] It exposes three tools.
- [ ] The free tool works without payment.
- [ ] Both premium tools go through x402.
- [ ] Responses are structured.

### Participants

- [ ] Each team has a token.
- [ ] Each team has an allowance.
- [ ] Usage is limited by tool.
- [ ] Usage is recorded.
- [ ] A rejected call does not pay.

### Payments

- [ ] Payer and recipient wallets are separate.
- [ ] Real payment on Hedera Testnet.
- [ ] Transaction ID persisted.
- [ ] HashScan link visible.
- [ ] Idempotency prevents duplicate payments.

### Dashboard

- [ ] Shows budget.
- [ ] Shows usage.
- [ ] Shows participants.
- [ ] Shows metrics.
- [ ] Shows transactions.
- [ ] Updates after calls.

### Demo

- [ ] It can be reset.
- [ ] Activity can be seeded.
- [ ] The complete flow fits in under 5 minutes.
- [ ] At least two real payments remain visible.
- [ ] The narrative explains why x402 is necessary.

---

## 31. Recommended Implementation Order

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

## 34. Post-MVP Roadmap

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
