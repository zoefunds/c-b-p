import { MockFxEngine } from "../fx/mockFxEngine";
import { InMemoryLedger } from "../ledger/inMemoryLedger";
import { InMemoryTransactionStore } from "../store/inMemoryTransactionStore";
import { Transaction, TransferRequest } from "../domain/types";

export class TransferOrchestrator {
  constructor(
    private readonly ledger: InMemoryLedger,
    private readonly store: InMemoryTransactionStore,
    private readonly fxEngine: MockFxEngine
  ) {}

  async execute(request: TransferRequest): Promise<Transaction> {
    const tx = this.store.createOrGet({
      senderId: request.senderId,
      receiverId: request.receiverId,
      fromCurrency: "NGN",
      toCurrency: "GHS",
      amount: request.amountNgn,
      status: "INITIATED",
      idempotencyKey: request.idempotencyKey
    });

    if (tx.status === "COMPLETED") return tx;

    try {
      this.ledger.debitNgn(tx.senderId, tx.amount, tx.id);
      this.store.updateState(tx.id, "NAIRA_DEBITED", { ngnDebited: tx.amount });

      const usdc = this.fxEngine.convertNgnToUsdc(tx.amount);
      const ghs = this.fxEngine.convertUsdcToGhs(usdc);
      this.store.updateState(tx.id, "FX_CONVERTED", { usdcAmount: usdc, ghsAmount: ghs });

      const txHash = `0xmock${Math.random().toString(16).slice(2).padEnd(12, "0")}`;
      this.store.updateState(tx.id, "USDC_SENT", { txHash });

      this.ledger.creditGhs(tx.receiverId, ghs, tx.id);
      this.store.updateState(tx.id, "CEDIS_CREDITED");

      return this.store.updateState(tx.id, "COMPLETED");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      return this.store.updateState(tx.id, "FAILED", { txHash: reason });
    }
  }
}
