import { LedgerEntry, User } from "../domain/types";

export class InMemoryLedger {
  private users = new Map<string, User>();
  private entries: LedgerEntry[] = [];

  seedUsers(seed: User[]): void {
    seed.forEach((u) => this.users.set(u.id, u));
  }

  getUser(userId: string): User {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    return user;
  }

  debitNgn(userId: string, amount: number, reference: string): void {
    const user = this.getUser(userId);
    if (user.nairaBalance < amount) throw new Error("Insufficient NGN balance");
    user.nairaBalance -= amount;
    this.entries.push(this.entry(userId, "NGN", amount, "debit", reference));
  }

  creditGhs(userId: string, amount: number, reference: string): void {
    const user = this.getUser(userId);
    user.cedisBalance += amount;
    this.entries.push(this.entry(userId, "GHS", amount, "credit", reference));
  }

  listEntries(): LedgerEntry[] {
    return this.entries;
  }

  private entry(
    userId: string,
    currency: "NGN" | "GHS",
    amount: number,
    type: "debit" | "credit",
    reference: string
  ): LedgerEntry {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      currency,
      amount,
      type,
      reference,
      createdAt: new Date().toISOString()
    };
  }
}
