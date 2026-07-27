export const EVENT_ID = "hedera-x402-demo";
export { validateProjectStrategy, auditSubmission } from "./premium.js";
export type { StrategyInput, AuditInput } from "./premium.js";
export type EventStatus = "DRAFT" | "ACTIVE" | "PAUSED";
export type UsageStatus = "PENDING" | "SETTLED" | "FAILED" | "REJECTED";
export type ToolName = "get_event_guidance" | "validate_project_strategy" | "audit_submission";
export interface Dashboard {
  event: { id: string; name: string; status: EventStatus; totalBudget: number; spentBudget: number; reservedBudget: number; currency: string; demoSessionId: string; seeded: boolean };
  metrics: { participantsSupported: number; activeTeams: number; totalCalls: number; freeCalls: number; sponsoredCalls: number; budgetRemaining: number; requirementsMissing: number; submissionsAudited: number; submissionsReady: number; blockersFound: number; mostUsedTool: string | null; averageCostPerParticipant: number; callsPerTeam: number; failedPayments: number; policyRejections: number; usageByTool: Array<{ tool: ToolName; calls: number; rate: number }> };
  tools: Array<{ name: ToolName; description: string; type: "FREE" | "PREMIUM"; price: number; maxCalls: number; enabled: boolean }>;
  participants: Array<{ id: string; name: string; externalId: string; allocatedBudget: number; spentBudget: number; status: string; strategyCalls: number; auditCalls: number }>;
  transactions: Array<{ id: string; participant: string; tool: ToolName; amount: number; status: UsageStatus; transactionId: string | null; hashscanUrl: string | null; createdAt: string; latencyMs: number; seeded: boolean; settlementMode: string | null; x402State: string | null }>;
}
