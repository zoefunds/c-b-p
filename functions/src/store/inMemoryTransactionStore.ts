import { Transaction, TransactionState } from "../domain/types";

export class InMemoryTransactionStore {
  private byId = new Map<string, Transaction>();
  private byKey = new Map<string, string>();

  createOrGet(input: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Transaction {
    const existingId = this.byKey.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.byId.get(existingId);
      if (!existing) throw new Error("Idempotency mapping is corrupted");
      return existing;
    }

    const now = new Date().toISOString();
    const tx: Transaction = {
      ...input,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    };

    this.byId.set(tx.id, tx);
    this.byKey.set(tx.idempotencyKey, tx.id);
    return tx;
  }

  updateState(id: string, status: TransactionState, patch?: Partial<Transaction>): Transaction {
    const tx = this.byId.get(id);
    if (!tx) throw new Error(`Transaction not found: ${id}`);
    const updated: Transaction = { ...tx, ...patch, status, updatedAt: new Date().toISOString() };
    this.byId.set(id, updated);
    return updated;
  }
}
