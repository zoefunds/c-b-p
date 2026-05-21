import { MockFxEngine } from "../fx/mockFxEngine";
import { Transaction, TransferRequest } from "../domain/types";
import { LedgerRepository } from "../repositories/ledgerRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import { BaseRelayer } from "../relayer/baseRelayer";

export class TransferOrchestrator {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly store: TransactionRepository,
    private readonly fxEngine: MockFxEngine,
    private readonly relayer: BaseRelayer
  ) {}

  async execute(request: TransferRequest): Promise<Transaction> {
    const tx = await this.store.createOrGet({
      senderId: request.senderId,
      receiverId: request.receiverId,
      fromCurrency: "NGN",
      toCurrency: "GHS",
      amount: request.amountNgn,
      status: "INITIATED",
      idempotencyKey: request.idempotencyKey
    });

    if (tx.status === "COMPLETED" || tx.status === "FAILED") return tx;

    try {
      if (tx.status === "INITIATED") {
        await this.ledger.debitNgn(tx.senderId, tx.amount, tx.id);
        await this.store.updateState(tx.id, "NAIRA_DEBITED", { ngnDebited: tx.amount });
      }

      const afterDebit = (await this.store.getById(tx.id))!;
      if (afterDebit.status === "NAIRA_DEBITED") {
        const usdc = this.fxEngine.convertNgnToUsdc(afterDebit.amount);
        const ghs = this.fxEngine.convertUsdcToGhs(usdc);
        await this.store.updateState(afterDebit.id, "FX_CONVERTED", { usdcAmount: usdc, ghsAmount: ghs });
      }

      const afterFx = (await this.store.getById(tx.id))!;
      if (afterFx.status === "FX_CONVERTED") {
        const receiver = await this.ledger.getUser(afterFx.receiverId);
        const txHash = await this.relayer.settleUsdc({
          transferId: afterFx.id,
          recipient: receiver.walletAddress,
          usdcAmount: afterFx.usdcAmount ?? 0
        });
        await this.store.updateState(afterFx.id, "USDC_SENT", { txHash });
      }

      const afterUsdc = (await this.store.getById(tx.id))!;
      if (afterUsdc.status === "USDC_SENT") {
        await this.ledger.creditGhs(afterUsdc.receiverId, afterUsdc.ghsAmount ?? 0, afterUsdc.id);
        await this.store.updateState(afterUsdc.id, "CEDIS_CREDITED");
      }

      const afterCredit = (await this.store.getById(tx.id))!;
      if (afterCredit.status === "CEDIS_CREDITED") {
        return await this.store.updateState(afterCredit.id, "COMPLETED");
      }

      return (await this.store.getById(tx.id))!;
    } catch (error) {
      const failed = (await this.store.getById(tx.id))!;
      if (failed.status !== "FAILED" && failed.status !== "COMPLETED") {
        return await this.store.updateState(tx.id, "FAILED", {
          txHash: error instanceof Error ? error.message : "Unknown error"
        });
      }
      return failed;
    }
  }
}
