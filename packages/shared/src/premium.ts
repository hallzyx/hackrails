import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---- Knowledge file loading ----

function knowledgeDir(): string {
  const candidates = [
    join(process.cwd(), "organizer-knowledge"),
    join(process.cwd(), "../../organizer-knowledge"),
    join(process.cwd(), "../../../organizer-knowledge"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return join(process.cwd(), "organizer-knowledge");
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(knowledgeDir(), file), "utf-8")) as T;
}

function readMd(file: string): string {
  return readFileSync(join(knowledgeDir(), file), "utf-8");
}

// ---- Types ----

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Effort = "5-15_MIN" | "15-30_MIN" | "30-60_MIN" | "1-3_HOURS" | "MORE_THAN_1_DAY";
export type FeedbackSource = "organizer_documented" | "judge_public_statement" | "observed_evidence" | "model_inference" | "unknown";

interface PreviousProject {
  name: string; summary: string; year: number; result: string;
  technologies: string[]; strengths: string[]; weaknesses: string[];
  organizer_feedback: string[]; feedback_source: FeedbackSource;
}
interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  severity_if_missing: string;
  scope: "audit" | "submission";
}

export interface StrategyInput {
  event_id: string; project_name: string; project_summary: string;
  problem: string; target_users: string; selected_track: string;
  planned_integrations: string[]; business_model?: string | null; current_stage: string;
}
export interface AuditInput {
  event_id: string; project_name: string; repository_url: string;
  submission_url?: string | null;
  selected_track: string; project_summary: string; transaction_links: string[];
  deadline?: string | null;
}

const ORGANIZER_EVENT_ID = "hedera-x402-demo";
const ORGANIZER_TRACK_ID = "hedera-x402-bounty";

// ---- Knowledge loaders ----

function loadEventRules(): string { return readMd("event-rules.md"); }
function loadJudgingCriteria(): string { return readMd("judging-criteria.md"); }
function loadSponsorObjectives(): string { return readMd("sponsor-objectives.md"); }
function loadPreviousProjects(): PreviousProject[] { return readJson<PreviousProject[]>("previous-projects.json"); }
function loadSubmissionChecklist(): ChecklistItem[] { return readJson<ChecklistItem[]>("submission-checklist.json"); }

// ---- Text similarity ----

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}
function severityRank(s: string): number {
  return ({ AUTO_DISQUALIFICATION: 5, CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>)[s] ?? 0;
}

// ---- Real HTTP validators ----

async function safeFetch(url: string, init?: RequestInit, timeoutMs = 8000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    return resp;
  } catch {
    return null;
  }
}

/** Validate a GitHub repository via the public REST API (no auth needed for public repos). */
async function validateGitHubRepo(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return { accessible: false, public: false, hasReadme: false, hasLicense: false, description: null as string | null, topics: [] as string[] };

  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  const [repoResp, readmeResp, licenseResp] = await Promise.all([
    safeFetch(apiBase, { headers: { accept: "application/vnd.github+json" } }),
    safeFetch(`${apiBase}/readme`, { headers: { accept: "application/vnd.github.raw" } }),
    safeFetch(`${apiBase}/license`, { headers: { accept: "application/vnd.github+json" } }),
  ]);

  const accessible = repoResp?.ok ?? false;
  const repoData = accessible ? await repoResp!.json().catch(() => ({})) : {};
  const public_ = accessible && !repoData.private;
  const hasReadme = readmeResp?.ok ?? false;
  const readmeText = hasReadme ? await readmeResp!.text().catch(() => "") : "";
  const hasLicense = licenseResp?.ok ?? false;

  // Check for installation instructions in README
  const readmeLower = readmeText.toLowerCase();
  const hasInstallInstructions = /(npm install|pip install|docker|make|yarn|pnpm|cargo|go mod|gradle|mvn|setup|requirements)/.test(readmeLower);
  const hasProjectDescription = readmeText.length > 200;
  const hasHashscanInReadme = /hashscan\.io/.test(readmeLower);
  const has402Mention = /(402|x402|payment)/.test(readmeLower);

  return {
    accessible,
    public: public_,
    hasReadme,
    readmeText,
    hasLicense,
    hasInstallInstructions,
    hasProjectDescription,
    hasHashscanInReadme,
    has402Mention,
    description: (repoData as { description?: string }).description ?? null,
    topics: ((repoData as { topics?: string[] }).topics ?? []),
  };
}

/** Validate Hedera Testnet transactions via the Mirror Node API. */
async function validateHederaTransactions(transactionLinks: string[]) {
  const results: Array<{ url: string; valid: boolean; network: string | null; success: boolean | null; payer: string | null; receiver: string | null }> = [];

  for (const link of transactionLinks) {
    // Parse HashScan URL to extract transaction ID and network
    const hashscanMatch = link.match(/hashscan\.io\/(testnet|mainnet|previewnet)\/transaction\/([0-9.]+(?:[-@][0-9.]+)*)/);
    if (!hashscanMatch) {
      results.push({ url: link, valid: false, network: null, success: null, payer: null, receiver: null });
      continue;
    }

    const [, network, txIdRaw] = hashscanMatch;
    // Mirror node expects the transaction ID with the format: 0.0.x-1234567890-123456789
    const mirrorUrl = `https://${network}.mirrornode.hedera.com/api/v1/transactions/${encodeURIComponent(txIdRaw)}`;
    const resp = await safeFetch(mirrorUrl);

    if (!resp?.ok) {
      results.push({ url: link, valid: false, network, success: null, payer: null, receiver: null });
      continue;
    }

    const txData = await resp.json().catch(() => ({})) as { transactions?: Array<{ result: string; transaction_id?: string; transfers?: Array<{ account: string; amount: number }> }>, transfers?: Array<{ account: string; amount: number }> };

    const txs = txData.transactions ?? [];
    const success = txs.length > 0 ? txs[0]?.result === "SUCCESS" : null;
    const transfers = txs[0]?.transfers ?? txData.transfers ?? [];
    const positiveTransfer = transfers.find((t) => t.amount > 0);
    const negativeTransfer = transfers.find((t) => t.amount < 0);
    const receiver = positiveTransfer?.account ?? null;
    const payer = negativeTransfer?.account ?? null;
    const payerReceiverDifferent = payer && receiver ? payer !== receiver : null;

    results.push({ url: link, valid: true, network, success, payer, receiver });
  }

  return results;
}

// ---- validate_project_strategy ----

export async function validateProjectStrategy(input: StrategyInput) {
  loadEventRules();
  loadJudgingCriteria();
  loadSponsorObjectives();
  const previousProjects = loadPreviousProjects();

  const trackLower = input.selected_track.toLowerCase().trim();
  const eventValid = input.event_id === ORGANIZER_EVENT_ID;
  const trackValid = trackLower === ORGANIZER_TRACK_ID || trackLower === "hedera x402 bounty";
  const trackFitScore = eventValid && trackValid ? 91 : trackValid ? 55 : 20;

  const allText = `${input.project_summary} ${input.planned_integrations.join(" ")} ${input.problem} ${input.target_users}`.toLowerCase();
  const sponsorPoints = [
    { match: "x402", points: 20 }, { match: "hedera", points: 20 }, { match: "usdc", points: 10 },
    { match: "payment", points: 10 }, { match: "agent", points: 8 }, { match: "budget", points: 8 },
    { match: "policy", points: 8 }, { match: "quota", points: 6 }, { match: "micropay", points: 5 },
  ];
  let sponsorScore = 10;
  for (const p of sponsorPoints) if (allText.includes(p.match)) sponsorScore += p.points;
  sponsorScore = Math.min(100, sponsorScore);

  const stageBonus = input.current_stage === "MVP" || input.current_stage === "READY_TO_SUBMIT" ? 10 : input.current_stage === "PROTOTYPE" ? 5 : 0;
  const strategicFitScore = Math.min(100, Math.round((trackFitScore * 0.3 + sponsorScore * 0.4 + Math.min(60, input.project_summary.length / 10) * 0.3) + stageBonus));

  const inputTokens = tokenize(`${input.project_summary} ${input.planned_integrations.join(" ")} ${input.problem} ${input.target_users}`);
  const historicalOverlaps = previousProjects.map((proj) => {
    const projTokens = tokenize(`${proj.summary} ${proj.technologies.join(" ")}`);
    const similarity = jaccard(inputTokens, projTokens);
    const sharedElements: string[] = [];
    const techLower = proj.technologies.map((t) => t.toLowerCase());
    const sharedTech = input.planned_integrations.filter((i) => techLower.some((t) => i.toLowerCase().includes(t) || t.includes(i.toLowerCase())));
    if (sharedTech.length) sharedElements.push(`Shared technologies: ${sharedTech.join(", ")}`);
    if (similarity > 25) sharedElements.push("Similar problem/use case framing");
    const differences: string[] = [];
    for (const w of proj.weaknesses) if (!allText.includes(w.toLowerCase().split(" ")[0])) differences.push(`Differentiator: avoids "${w.toLowerCase()}"`);

    return {
      project_name: proj.name,
      similarity_score: similarity,
      shared_elements: sharedElements,
      important_differences: differences.length ? differences : ["No significant differences identified"],
      documented_outcome: proj.result,
      documented_feedback: proj.organizer_feedback,
      feedback_source: proj.feedback_source,
      differentiation_recommendation: similarity > 50 ? `Differentiate clearly from ${proj.name} — emphasize unique value beyond shared elements.` : `Low overlap with ${proj.name}; your positioning appears distinct.`,
    };
  });

  const differentiationScore = historicalOverlaps.length > 0 ? Math.max(30, 100 - Math.max(...historicalOverlaps.map((h) => h.similarity_score))) : 80;

  const strengths: Array<{ title: string; explanation: string; evidence_source: string }> = [];
  if (allText.includes("x402")) strengths.push({ title: "x402 integration is planned", explanation: "The project uses the x402 protocol as a core component, aligning with sponsor objectives.", evidence_source: "sponsor-objectives.md" });
  if (allText.includes("hedera")) strengths.push({ title: "Hedera settlement", explanation: "The project plans Hedera integration for on-chain settlement.", evidence_source: "sponsor-objectives.md" });
  if (allText.includes("budget") || allText.includes("quota") || allText.includes("policy")) strengths.push({ title: "Policy and budget controls", explanation: "Budget management or quota mechanics add real-world applicability.", evidence_source: "judging-criteria.md" });
  if (input.current_stage === "MVP" || input.current_stage === "READY_TO_SUBMIT") strengths.push({ title: "Advanced development stage", explanation: `Project is at ${input.current_stage} stage, reducing delivery risk.`, evidence_source: "model_inference" });
  if (strengths.length === 0) strengths.push({ title: "Clear problem statement", explanation: "The problem is defined, providing a starting point for alignment.", evidence_source: "submission-checklist.json" });

  const risks: Array<{ title: string; description: string; severity: Severity; estimated_effort: Effort; recommended_action: string }> = [];
  if (!eventValid) {
    risks.push({ title: "Unknown event_id", description: `The supplied event_id '${input.event_id}' does not match the active organizer event.`, severity: "CRITICAL", estimated_effort: "5-15_MIN", recommended_action: `Use the event_id returned by get_event_guidance: '${ORGANIZER_EVENT_ID}'.` });
  }
  if (!trackValid) {
    risks.push({ title: "Unknown selected track", description: `The supplied track '${input.selected_track}' is not listed in the organizer knowledge base.`, severity: "HIGH", estimated_effort: "5-15_MIN", recommended_action: `Use the track returned by get_event_guidance: '${ORGANIZER_TRACK_ID}'.` });
  }
  if (!allText.includes("402") && !allText.includes("payment")) {
    risks.push({ title: "No x402 payment flow visible", description: "The strategy does not mention the x402 protocol or payment flow.", severity: "CRITICAL", estimated_effort: "1-3_HOURS", recommended_action: "Integrate the x402 protocol as a core feature, not a bolt-on." });
  }
  if (historicalOverlaps.some((h) => h.similarity_score > 50)) {
    const highOverlap = historicalOverlaps.find((h) => h.similarity_score > 50)!;
    risks.push({ title: `High overlap with ${highOverlap.project_name}`, description: `Similarity score ${highOverlap.similarity_score}/100. Risks being seen as a repeat.`, severity: "HIGH", estimated_effort: "15-30_MIN", recommended_action: highOverlap.differentiation_recommendation });
  }
  if (allText.includes("marketplace") && !allText.includes("budget") && !allText.includes("policy") && !allText.includes("quota")) {
    risks.push({ title: "Generic marketplace risk", description: "The proposal seems like a marketplace wrapper without differentiated value.", severity: "MEDIUM", estimated_effort: "15-30_MIN", recommended_action: "Add budget controls, participant quotas, or sponsored access to differentiate." });
  }

  const organizerInsights: Array<{ insight: string; source: string; confidence: "HIGH" | "MEDIUM" | "LOW" }> = [];
  organizerInsights.push({ insight: "Previous finalists prioritized working payment flows over breadth.", source: "previous-projects.json", confidence: "HIGH" });
  organizerInsights.push({ insight: "Generic AI wrappers and marketplace wrappers performed poorly in judging.", source: "judging-criteria.md", confidence: "HIGH" });
  if (input.planned_integrations.some((i) => i.toLowerCase().includes("hedera"))) organizerInsights.push({ insight: "Sponsor incentivizes Hedera-specific capabilities beyond basic transfers.", source: "sponsor-objectives.md", confidence: "HIGH" });

  const prioritizedActions: Array<{ priority: number; action: string; reason: string; severity: Severity; estimated_effort: Effort; expected_impact: "HIGH" | "MEDIUM" | "LOW" }> = [];
  let priority = 1;
  for (const risk of [...risks].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))) {
    prioritizedActions.push({ priority: priority++, action: risk.recommended_action, reason: risk.description, severity: risk.severity, estimated_effort: risk.estimated_effort, expected_impact: risk.severity === "CRITICAL" || risk.severity === "HIGH" ? "HIGH" : "MEDIUM" });
  }

  const finalRecommendation = strategicFitScore >= 75 && risks.filter((r) => r.severity === "CRITICAL").length === 0 ? "PROCEED" : strategicFitScore >= 60 ? "PROCEED_WITH_CHANGES" : trackFitScore < 50 ? "RECONSIDER_TRACK" : "PIVOT";

  return {
    strategic_fit_score: strategicFitScore,
    track_fit_score: trackFitScore,
    differentiation_score: differentiationScore,
    sponsor_alignment_score: sponsorScore,
    summary: `The proposal scores ${strategicFitScore}/100 in strategic fit. ${risks.length > 0 ? "Key risks identified." : "No significant risks."}`,
    strengths,
    risks,
    historical_overlap: historicalOverlaps,
    organizer_backed_insights: organizerInsights,
    prioritized_actions: prioritizedActions,
    final_recommendation: finalRecommendation,
  };
}

// ---- audit_submission (with REAL HTTP validation) ----

export async function auditSubmission(input: AuditInput) {
  const checklist = loadSubmissionChecklist();

  const findings: Array<{
    id: string; title: string; description: string;
    severity: string; requirement_type: string; evidence: string[];
    source: string; confidence: "HIGH" | "MEDIUM" | "LOW";
    estimated_effort: Effort; recommended_action: string;
  }> = [];

  let passed = 0, warnings = 0, blocking = 0;

  if (input.event_id !== ORGANIZER_EVENT_ID) {
    findings.push({ id: "unknown-event-id", title: "Unknown event_id", description: `The supplied event_id '${input.event_id}' does not match the active organizer event.`, severity: "CRITICAL", requirement_type: "MANDATORY", evidence: [`Expected: ${ORGANIZER_EVENT_ID}`, `Received: ${input.event_id}`], source: "event-rules.md", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: `Use the event_id returned by get_event_guidance: '${ORGANIZER_EVENT_ID}'.` });
    blocking++;
  } else passed++;

  const selectedTrack = input.selected_track.toLowerCase().trim();
  if (selectedTrack !== ORGANIZER_TRACK_ID && selectedTrack !== "hedera x402 bounty") {
    findings.push({ id: "unknown-selected-track", title: "Unknown selected track", description: `The supplied track '${input.selected_track}' is not listed in the organizer knowledge base.`, severity: "HIGH", requirement_type: "MANDATORY", evidence: [`Expected: ${ORGANIZER_TRACK_ID}`, `Received: ${input.selected_track}`], source: "event-rules.md", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: `Use the track returned by get_event_guidance: '${ORGANIZER_TRACK_ID}'.` });
    warnings++;
  } else passed++;

  // ---- REAL Repository validation via GitHub API ----
  const repoUrl = input.repository_url?.trim() ?? "";
  const repoValidation = repoUrl ? await validateGitHubRepo(repoUrl) : null;

  if (!repoUrl) {
    findings.push({ id: "missing-repository-url", title: "Repository URL not provided", description: "No repository URL was supplied.", severity: "AUTO_DISQUALIFICATION", requirement_type: "MANDATORY", evidence: ["repository_url field is empty"], source: "submission-checklist.json", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: "Provide the public GitHub repository URL." });
    blocking++;
  } else if (!repoValidation?.accessible) {
    findings.push({ id: "repo-not-accessible", title: "Repository is not accessible", description: `The URL ${repoUrl} did not return a successful response.`, severity: "AUTO_DISQUALIFICATION", requirement_type: "MANDATORY", evidence: [`HTTP request to ${repoUrl} failed`], source: "technical-validator-rules.json", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: "Make the repository public and verify the URL." });
    blocking++;
  } else if (!repoValidation?.public) {
    findings.push({ id: "repo-not-public", title: "Repository is not public", description: "The GitHub repository exists but is private.", severity: "AUTO_DISQUALIFICATION", requirement_type: "MANDATORY", evidence: ["GitHub API reports repository as private"], source: "technical-validator-rules.json", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: "Change the repository visibility to public." });
    blocking++;
  } else {
    passed++;
    // README check
    if (!repoValidation.hasReadme) {
      findings.push({ id: "missing-readme", title: "README missing", description: "No README file found in the repository root.", severity: "HIGH", requirement_type: "MANDATORY", evidence: ["GitHub API /readme returned 404"], source: "submission-checklist.json", confidence: "HIGH", estimated_effort: "15-30_MIN", recommended_action: "Add a README.md with project description and installation instructions." });
      warnings++;
    } else {
      passed++;
      if (!repoValidation.hasInstallInstructions) {
        findings.push({ id: "missing-install-instructions", title: "No installation instructions in README", description: "The README does not contain recognizable installation keywords.", severity: "MEDIUM", requirement_type: "BEST_PRACTICE", evidence: ["README scanned for: npm install, pip install, docker, make, etc."], source: "technical-validator-rules.json", confidence: "HIGH", estimated_effort: "15-30_MIN", recommended_action: "Add installation steps to the README." });
        warnings++;
      } else passed++;

      if (!repoValidation.hasProjectDescription) {
        findings.push({ id: "readme-too-short", title: "README is too short", description: "The README is under 200 characters, suggesting insufficient detail.", severity: "MEDIUM", requirement_type: "BEST_PRACTICE", evidence: [`README length: ${repoValidation.readmeText?.length ?? 0} chars`], source: "judging-criteria.md", confidence: "MEDIUM", estimated_effort: "15-30_MIN", recommended_action: "Expand the README to describe the problem, solution, and x402 integration." });
        warnings++;
      } else passed++;

      // Check for HashScan evidence in README
      if (!repoValidation.hasHashscanInReadme) {
        findings.push({ id: "no-hashscan-in-readme", title: "No HashScan link in README", description: "The README does not contain any hashscan.io links.", severity: "CRITICAL", requirement_type: "MANDATORY", evidence: ["README content does not match /hashscan\\.io/"], source: "submission-checklist.json", confidence: "HIGH", estimated_effort: "15-30_MIN", recommended_action: "Add HashScan transaction links to the README." });
        blocking++;
      } else passed++;

      // Check for x402 mention in README
      if (!repoValidation.has402Mention) {
        findings.push({ id: "no-402-in-readme", title: "x402 not mentioned in README", description: "The README does not reference x402 or payment flows.", severity: "MEDIUM", requirement_type: "JUDGING_IMPACT", evidence: ["README does not mention '402', 'x402', or 'payment'"], source: "sponsor-objectives.md", confidence: "MEDIUM", estimated_effort: "5-15_MIN", recommended_action: "Describe how the x402 protocol is used in the project." });
        warnings++;
      } else passed++;
    }

    // License check
    if (!repoValidation.hasLicense) {
      findings.push({ id: "no-license", title: "No open-source license", description: "No LICENSE file found in the repository.", severity: "LOW", requirement_type: "BEST_PRACTICE", evidence: ["GitHub API /license returned 404"], source: "rejection-patterns.json", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: "Add a LICENSE file (MIT, Apache 2.0, or GPL)." });
      warnings++;
    } else passed++;
  }

  // ---- REAL On-chain validation via Hedera Mirror Node API ----
  const hashscanLinks = input.transaction_links.filter((l) => l.includes("hashscan.io"));
  const txValidation = await validateHederaTransactions(input.transaction_links);

  const validTxs = txValidation.filter((t) => t.valid);
  const successfulTxs = txValidation.filter((t) => t.success === true);
  const testnetTxs = txValidation.filter((t) => t.network === "testnet");

  if (input.transaction_links.length === 0 || hashscanLinks.length === 0) {
    findings.push({ id: "missing-hashscan-link", title: "No HashScan evidence found", description: "No HashScan transaction links were provided.", severity: "CRITICAL", requirement_type: "MANDATORY", evidence: ["transaction_links array has no hashscan.io URLs"], source: "submission-checklist.json", confidence: "HIGH", estimated_effort: "15-30_MIN", recommended_action: "Execute an x402 payment on Testnet and add the HashScan link." });
    blocking++;
  } else {
    passed++;
    if (testnetTxs.length !== txValidation.length) {
      findings.push({ id: "mainnet-used", title: "Transaction is not on Testnet", description: "Some HashScan links do not indicate testnet.", severity: "CRITICAL", requirement_type: "MANDATORY", evidence: txValidation.map((t) => `URL: ${t.url}, network: ${t.network}`), source: "technical-validator-rules.json", confidence: "HIGH", estimated_effort: "15-30_MIN", recommended_action: "Repeat the payment on Hedera Testnet and update the link." });
      blocking++;
    } else passed++;

    if (successfulTxs.length === 0) {
      findings.push({ id: "transaction-failed", title: "Transaction was not successful", description: "The Hedera Mirror Node reports the transaction did not succeed.", severity: "CRITICAL", requirement_type: "MANDATORY", evidence: txValidation.map((t) => `URL: ${t.url}, success: ${t.success}`), source: "technical-validator-rules.json", confidence: "HIGH", estimated_effort: "15-30_MIN", recommended_action: "Retry the x402 payment and verify it succeeded on HashScan." });
      blocking++;
    } else passed++;

    // Check payer != receiver
    const payerReceiverSame = txValidation.find((t) => t.payer && t.receiver && t.payer === t.receiver);
    if (payerReceiverSame) {
      findings.push({ id: "same-payer-receiver", title: "Payer and receiver are the same account", description: `Both accounts are ${payerReceiverSame.payer}.`, severity: "HIGH", requirement_type: "MANDATORY", evidence: [`payer: ${payerReceiverSame.payer}, receiver: ${payerReceiverSame.receiver}`], source: "technical-validator-rules.json", confidence: "HIGH", estimated_effort: "5-15_MIN", recommended_action: "Use a different receiving account than the payer." });
      warnings++;
    } else passed++;
  }

  // ---- x402 mention in summary ----
  const summaryLower = input.project_summary.toLowerCase();
  if (!summaryLower.includes("402") && !summaryLower.includes("payment") && !summaryLower.includes("x402")) {
    findings.push({ id: "no-402-mention", title: "x402 not mentioned in summary", description: "The project summary does not reference the x402 protocol.", severity: "MEDIUM", requirement_type: "JUDGING_IMPACT", evidence: ["No '402' or 'payment' keyword in summary"], source: "sponsor-objectives.md", confidence: "MEDIUM", estimated_effort: "5-15_MIN", recommended_action: "Add a clear description of how x402 is used in the project." });
    warnings++;
  } else passed++;

  // ---- Deadline context ----
  let deadlineContext: Record<string, unknown> = { deadline: input.deadline ?? null, time_remaining_minutes: null, estimated_total_fix_effort: "UNKNOWN", delivery_risk: "MEDIUM" };
  if (input.deadline) {
    const deadlineMs = new Date(input.deadline).getTime();
    const remainingMin = Math.max(0, Math.round((deadlineMs - Date.now()) / 60000));
    const blockingCount = findings.filter((f) => f.severity === "CRITICAL" || f.severity === "AUTO_DISQUALIFICATION").length;
    deadlineContext = { deadline: input.deadline, time_remaining_minutes: remainingMin, estimated_total_fix_effort: blockingCount > 0 ? "45-90_MIN" : "0", delivery_risk: blockingCount >= 2 ? "CRITICAL" : blockingCount >= 1 ? "HIGH" : "LOW" };
  }

  // ---- Readiness score ----
  const totalChecks = checklist.filter(
    (c) => c.required && c.scope === "audit",
  ).length + 2;
  const readinessScore = Math.max(0, Math.round((passed / totalChecks) * 100));

  // ---- Status ----
  const autoDisq = findings.filter((f) => f.severity === "AUTO_DISQUALIFICATION").length;
  const critical = findings.filter((f) => f.severity === "CRITICAL").length;
  const status = autoDisq > 0 ? "DISQUALIFICATION_RISK" : critical > 0 ? "NOT_READY" : warnings > 0 ? "READY_WITH_WARNINGS" : "READY";

  // ---- Fix-first ----
  const fixFirst = findings
    .filter((f) => f.severity === "AUTO_DISQUALIFICATION" || f.severity === "CRITICAL" || f.severity === "HIGH")
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .map((f, i) => ({ priority: i + 1, finding_id: f.id, action: f.recommended_action, reason: f.description, estimated_effort: f.estimated_effort }));

  // ---- Defer ----
  const defer = [
    { action: "Add new MCP tools or features", reason: "Does not improve submission compliance and consumes time." },
    { action: "Polish non-critical documentation", reason: "Focus on blocking issues first." },
  ];

  // ---- Organizer insights ----
  const organizerInsights: Array<{ insight: string; source: string; confidence: "HIGH" | "MEDIUM" | "LOW" }> = [];
  organizerInsights.push({ insight: "Previous finalists prioritized working payment flows over breadth.", source: "previous-projects.json", confidence: "HIGH" });
  if (hashscanLinks.length === 0) organizerInsights.push({ insight: "Missing HashScan evidence is the most common critical finding.", source: "rejection-patterns.json", confidence: "HIGH" });

  return {
    readiness_score: readinessScore,
    status,
    deadline_context: deadlineContext,
    summary: blocking > 0 ? `${blocking} blocking issue(s) found. ${warnings} warning(s).` : `${passed}/${totalChecks} checks passed. ${warnings} warning(s).`,
    checks: { passed, warnings, blocking },
    findings,
    onchain_validation: {
      links_provided: input.transaction_links.length,
      valid_transactions: validTxs.length,
      successful_transactions: successfulTxs.length,
      network: testnetTxs.length > 0 ? "HEDERA_TESTNET" : null,
      transactions: txValidation,
      issues: validTxs.length === 0 ? ["No valid transactions found"] : [],
    },
    repository_validation: repoValidation ? {
      accessible: repoValidation.accessible,
      public: repoValidation.public,
      has_readme: repoValidation.hasReadme,
      has_license: repoValidation.hasLicense,
      has_install_instructions: repoValidation.hasInstallInstructions,
      has_hashscan_link: repoValidation.hasHashscanInReadme,
      has_402_mention: repoValidation.has402Mention,
      description: repoValidation.description,
      topics: repoValidation.topics,
    } : null,
    organizer_backed_insights: organizerInsights,
    fix_first: fixFirst,
    defer,
    final_recommendation: blocking > 0 ? "Fix all blocking issues before submitting. Do not add new features." : warnings > 0 ? "Address warnings to improve readiness, then submit." : "Submission appears ready. Verify all details before final submission.",
  };
}
