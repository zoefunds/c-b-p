import { TransactionState } from "../domain/types";

const allowedTransitions: Record<TransactionState, TransactionState[]> = {
  INITIATED: ["NAIRA_DEBITED", "FAILED"],
  NAIRA_DEBITED: ["FX_CONVERTED", "FAILED"],
  FX_CONVERTED: ["USDC_SENT", "FAILED"],
  USDC_SENT: ["CEDIS_CREDITED", "FAILED"],
  CEDIS_CREDITED: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: []
};

export function assertValidTransition(current: TransactionState, next: TransactionState): void {
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid transition: ${current} -> ${next}`);
  }
}
