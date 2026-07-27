import { z } from "zod";

export const toolCatalog = [
  {
    name: "get_event_guidance",
    description: "Read official event rules, dates, eligibility, prizes, x402/Hedera requirements, and submission requirements. Does not validate project strategy.",
  },
  {
    name: "validate_project_strategy",
    description: "Use premium organizer intelligence to validate a project strategy against official rules, judging criteria, sponsor objectives, previous projects, and rejection patterns.",
  },
  {
    name: "audit_submission",
    description: "Run a premium audit for submission readiness, checking repository, x402 flow evidence, on-chain proof, video requirements, and organizer checklist compliance.",
  },
] as const;

export const argumentsSchemas = {
  get_event_guidance: z.object({ question: z.string().min(1).max(2000) }).strict(),

  validate_project_strategy: z.object({
    event_id: z.string().min(1),
    project_name: z.string().min(1).max(200),
    project_summary: z.string().min(1).max(5000),
    problem: z.string().min(1).max(3000),
    target_users: z.string().min(1).max(500),
    selected_track: z.string().min(1).max(200),
    planned_integrations: z.array(z.string().min(1).max(200)).min(1).max(20),
    business_model: z.string().max(500).nullable().optional(),
    current_stage: z.enum(["IDEA", "PROTOTYPE", "MVP", "READY_TO_SUBMIT"]),
  }).strict(),

  audit_submission: z.object({
    event_id: z.string().min(1),
    project_name: z.string().min(1).max(200),
    repository_url: z.string().min(1).max(500),
    submission_url: z.string().max(500).nullable().optional(),
    selected_track: z.string().min(1).max(200),
    project_summary: z.string().min(1).max(5000),
    transaction_links: z.array(z.string().min(1).max(500)).max(20).default([]),
    deadline: z.string().datetime().nullable().optional(),
  }).strict(),
} as const;

export type ToolName = keyof typeof argumentsSchemas;
