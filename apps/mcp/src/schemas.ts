import { z } from "zod";

export const toolCatalog = [
  {
    name: "get_event_guidance",
    description: "Read official event rules, dates, eligibility, prizes, x402/Hedera requirements, and submission requirements. Does not validate project strategy.",
  },
  {
    name: "validate_project_strategy",
    description: "Use premium organizer intelligence to validate a project strategy.",
  },
  {
    name: "audit_submission",
    description: "Run a premium audit for requirements, evidence and blockers.",
  },
] as const;

export const argumentsSchemas = {
  get_event_guidance: z.object({ question: z.string().min(1).max(2000) }).strict(),
  validate_project_strategy: z.object({ idea: z.string().min(1).max(5000), track: z.string().min(1).max(200).optional() }).strict(),
  audit_submission: z.object({ repositoryUrl: z.string().url().optional(), summary: z.string().min(1).max(5000) }).strict(),
} as const;

export type ToolName = keyof typeof argumentsSchemas;