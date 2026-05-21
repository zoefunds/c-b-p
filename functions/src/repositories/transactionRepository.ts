import { db } from "../db/firebase";
import { Transaction, TransactionState } from "../domain/types";
import { assertValidTransition } from "../state/transitionGuard";

const txCollection = db.collection("transactions");
const idemCollection = db.collection("idempotency_keys");

export class TransactionRepository {
  async createOrGet(input: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const idemRef = idemCollection.doc(input.idempotencyKey);

    return db.runTransaction(async (trx) => {
      const idemSnap = await trx.get(idemRef);
      if (idemSnap.exists) {
        const txId = idemSnap.get("transactionId") as string;
        const existingSnap = await trx.get(txCollection.doc(txId));
        if (!existingSnap.exists) throw new Error("Idempotency mapping points to missing transaction");
        return existingSnap.data() as Transaction;
      }

      const txRef = txCollection.doc();
      const now = new Date().toISOString();

      const tx: Transaction = {
        ...input,
        id: txRef.id,
        createdAt: now,
        updatedAt: now
      };

      trx.set(txRef, tx);
      trx.set(idemRef, { transactionId: txRef.id, createdAt: now });

      return tx;
    });
  }

  async getById(id: string): Promise<Transaction | null> {
    const snap = await txCollection.doc(id).get();
    return snap.exists ? (snap.data() as Transaction) : null;
  }

  async updateState(id: string, next: TransactionState, patch?: Partial<Transaction>): Promise<Transaction> {
    const txRef = txCollection.doc(id);

    return db.runTransaction(async (trx) => {
      const snap = await trx.get(txRef);
      if (!snap.exists) throw new Error(`Transaction not found: ${id}`);

      const current = snap.data() as Transaction;
      assertValidTransition(current.status, next);

      const updated: Transaction = {
        ...current,
        ...patch,
        status: next,
        updatedAt: new Date().toISOString()
      };

      trx.set(txRef, updated, { merge: false });
      return updated;
    });
  }
}
