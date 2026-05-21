import { onRequest } from "firebase-functions/v2/https";
import { MockFxEngine } from "./fx/mockFxEngine";
import { TransferOrchestrator } from "./orchestrator/transferOrchestrator";
import { LedgerRepository } from "./repositories/ledgerRepository";
import { TransactionRepository } from "./repositories/transactionRepository";

const ledgerRepo = new LedgerRepository();
const txRepo = new TransactionRepository();
const fx = new MockFxEngine();
const orchestrator = new TransferOrchestrator(ledgerRepo, txRepo, fx);

export const health = onRequest(async (_req, res) => {
  await ledgerRepo.seedUsers();
  res.status(200).send({ ok: true, service: "africa-pay-functions", seeded: true });
});

export const transferNgnToGhs = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send({ error: "Method not allowed" });
    return;
  }

  const { senderId, receiverId, amountNgn, idempotencyKey } = req.body ?? {};

  if (!senderId || !receiverId || !amountNgn || !idempotencyKey) {
    res.status(400).send({ error: "senderId, receiverId, amountNgn, idempotencyKey are required" });
    return;
  }

  const tx = await orchestrator.execute({
    senderId: String(senderId),
    receiverId: String(receiverId),
    amountNgn: Number(amountNgn),
    idempotencyKey: String(idempotencyKey)
  });

  const ledgerEntries = await ledgerRepo.listEntriesByReference(tx.id);
  res.status(tx.status === "FAILED" ? 500 : 200).send({ transaction: tx, ledgerEntries });
});
