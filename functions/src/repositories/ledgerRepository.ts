import { db } from "../db/firebase";
import { LedgerEntry } from "../domain/types";

const users = db.collection("users");
const ledger = db.collection("ledger_entries");

export class LedgerRepository {
  async seedUsers(): Promise<void> {
    const defaults = [
      { id: "user_ng_1", email: "sender@africapay.dev", nairaBalance: 2_000_000, cedisBalance: 0 },
      { id: "user_gh_1", email: "receiver@africapay.dev", nairaBalance: 0, cedisBalance: 50 }
    ];

    const batch = db.batch();
    for (const u of defaults) {
      batch.set(users.doc(u.id), u, { merge: true });
    }
    await batch.commit();
  }

  async debitNgn(userId: string, amount: number, reference: string): Promise<void> {
    await db.runTransaction(async (trx) => {
      const userRef = users.doc(userId);
      const snap = await trx.get(userRef);
      if (!snap.exists) throw new Error(`User not found: ${userId}`);

      const user = snap.data() as { nairaBalance: number };
      if (user.nairaBalance < amount) throw new Error("Insufficient NGN balance");

      trx.update(userRef, { nairaBalance: user.nairaBalance - amount });

      const entryRef = ledger.doc();
      const entry: LedgerEntry = {
        id: entryRef.id,
        userId,
        currency: "NGN",
        amount,
        type: "debit",
        reference,
        createdAt: new Date().toISOString()
      };
      trx.set(entryRef, entry);
    });
  }

  async creditGhs(userId: string, amount: number, reference: string): Promise<void> {
    await db.runTransaction(async (trx) => {
      const userRef = users.doc(userId);
      const snap = await trx.get(userRef);
      if (!snap.exists) throw new Error(`User not found: ${userId}`);

      const user = snap.data() as { cedisBalance: number };
      trx.update(userRef, { cedisBalance: (user.cedisBalance ?? 0) + amount });

      const entryRef = ledger.doc();
      const entry: LedgerEntry = {
        id: entryRef.id,
        userId,
        currency: "GHS",
        amount,
        type: "credit",
        reference,
        createdAt: new Date().toISOString()
      };
      trx.set(entryRef, entry);
    });
  }

  async listEntriesByReference(reference: string): Promise<LedgerEntry[]> {
    const snap = await ledger.where("reference", "==", reference).get();
    return snap.docs.map((d) => d.data() as LedgerEntry);
  }
}
