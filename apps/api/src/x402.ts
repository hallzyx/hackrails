import { createHash } from "node:crypto";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { auditSubmission, validateProjectStrategy } from "@hackrails/shared";

export const PAYMENT_REQUIRED = "PAYMENT-REQUIRED",
  PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE",
  PAYMENT_RESPONSE = "PAYMENT-RESPONSE";
const network = () => process.env.HEDERA_NETWORK ?? "hedera:testnet";
const asset = () => process.env.HEDERA_USDC_TOKEN_ID ?? "0.0.429274";
const recipient = () => {
  const value = process.env.HEDERA_RECIPIENT_ACCOUNT_ID;
  if (!value)
    throw new Error(
      "HEDERA_RECIPIENT_ACCOUNT_ID is required for canonical Hedera x402 payment.",
    );
  return value;
};
const amountFor = (tool: string) =>
  (
    ({
      validate_project_strategy: "10000",
      audit_submission: "50000",
    }) as Record<string, string>
  )[tool];
const sha256 = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export type CanonicalPaymentFlow = {
  result: Record<string, unknown>;
  paymentRequired: unknown;
  paymentResponse: unknown;
  paymentPayloadHash: string;
  settlementReceipt: unknown;
  transactionId: string | null;
  x402State: "PAYMENT_RESPONSE_RECORDED";
};

type PaymentRequirement = {
  scheme?: unknown;
  network?: unknown;
  asset?: unknown;
  payTo?: unknown;
  amount?: unknown;
  maxAmountRequired?: unknown;
};
type PaymentRequired = { accepts?: PaymentRequirement[] };

export function validatePaymentRequirements(
  paymentRequired: unknown,
  tool: string,
) {
  const expectedAmount = amountFor(tool);
  if (!expectedAmount) throw new Error("Unknown premium tool.");
  const accepts = (paymentRequired as PaymentRequired)?.accepts;
  if (!Array.isArray(accepts))
    throw new Error("Premium provider omitted x402 payment requirements.");
  const requirement = accepts.find(
    (candidate) =>
      candidate?.scheme === "exact" && candidate.network === network(),
  );
  if (!requirement)
    throw new Error(
      "Premium provider did not offer the expected Hedera exact payment requirement.",
    );
  const amount = requirement.amount ?? requirement.maxAmountRequired;
  if (
    requirement.asset !== asset() ||
    requirement.payTo !== recipient() ||
    amount !== expectedAmount
  ) {
    throw new Error(
      "Premium provider payment requirement does not match the pinned Hedera recipient, USDC asset, or tool amount.",
    );
  }
}

export function createTimeoutFetch(
  fetchImpl: typeof fetch,
  timeoutMs: number,
): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, controller.signal])
      : controller.signal;
    try {
      return await fetchImpl(input, { ...init, signal });
    } finally {
      clearTimeout(timeout);
    }
  };
}

function providerTimeoutMs() {
  const configured = Number(process.env.X402_PROVIDER_TIMEOUT_MS ?? 15_000);
  return Number.isFinite(configured) && configured > 0 ? configured : 15_000;
}

function signer() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey)
    throw new Error(
      "Canonical Hedera x402 payment requires HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY.",
    );
  return createClientHederaSigner(
    accountId,
    PrivateKey.fromString(privateKey),
    { network: network() },
  );
}

export async function invokePremiumProvider(
  tool: string,
  payload: Record<string, unknown>,
  idempotencyKey: string,
): Promise<CanonicalPaymentFlow> {
  const paymentClient = new x402Client();
  let paymentPayloadHash = "";
  let paymentRequired: unknown;
  paymentClient
    .register("hedera:*", new ExactHederaScheme(signer()))
    .onAfterPaymentCreation(async ({ paymentPayload }) => {
      paymentPayloadHash = sha256(paymentPayload);
    });
  const httpClient = new x402HTTPClient(paymentClient);
  httpClient.onPaymentRequired(async ({ paymentRequired: challenge }) => {
    validatePaymentRequirements(challenge, tool);
    paymentRequired = challenge;
  });
  const fetchWithPayment = wrapFetchWithPayment(
    createTimeoutFetch(fetch, providerTimeoutMs()),
    httpClient,
  );
  const url = `${process.env.PREMIUM_SERVICE_URL ?? "http://localhost:4002"}/tools/${tool}`;
  const request: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  };
  const response = await fetchWithPayment(url, request);
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      (body as { error?: string }).error ??
        `Canonical x402 retry failed with ${response.status}.`,
    );
  const settlementReceipt = httpClient.getPaymentSettleResponse((name) =>
    response.headers.get(name),
  );
  if (!settlementReceipt?.success)
    throw new Error(
      "Facilitator did not report a successful canonical x402 settlement.",
    );
  if (!paymentRequired)
    throw new Error(
      "Premium provider returned success without an x402 payment challenge.",
    );
  return {
    result: body as Record<string, unknown>,
    paymentRequired,
    paymentResponse: settlementReceipt,
    settlementReceipt,
    paymentPayloadHash,
    transactionId: settlementReceipt.transaction ?? null,
    x402State: "PAYMENT_RESPONSE_RECORDED",
  };
}

export async function demoPremiumResult(
  tool: string,
  payload: Record<string, unknown>,
  idempotencyKey: string,
): Promise<CanonicalPaymentFlow> {
  const result =
    tool === "validate_project_strategy"
      ? {
          tool,
          kind: "strategy_validation",
          ...(await validateProjectStrategy(
            payload as unknown as Parameters<typeof validateProjectStrategy>[0],
          )),
          payload,
        }
      : {
          tool,
          kind: "submission_audit",
          ...(await auditSubmission(
            payload as unknown as Parameters<typeof auditSubmission>[0],
          )),
          payload,
        };
  const amount = tool === "audit_submission" ? "50000" : "10000";
  const receipt = {
    success: true,
    network: network(),
    scheme: "exact",
    transaction: `demo-x402-${idempotencyKey.slice(0, 18)}`,
    amount,
    asset: asset(),
    demo: true,
  };
  return {
    result,
    paymentRequired: null,
    paymentResponse: receipt,
    settlementReceipt: receipt,
    paymentPayloadHash: sha256({ demo: true, idempotencyKey, tool }),
    transactionId: receipt.transaction,
    x402State: "PAYMENT_RESPONSE_RECORDED",
  };
}
