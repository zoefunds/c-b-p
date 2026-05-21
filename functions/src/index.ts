import { onRequest } from "firebase-functions/v2/https";
import { MockFxEngine } from "./fx/mockFxEngine";
import { InMemoryLedger } from "./ledger/inMemoryLedger";
import { TransferOrchestrator } from "./orchestrator/transferOrchestrator";
import { InMemoryTransactionStore } from "./store/inMemoryTransactionStore";

const ledger = new InMemoryLedger();
ledger.seedUsers([
  { id: "user_ng_1", email: "sender@africapay.dev", nairaBalance: 2_000_000, cedisBalance: 0 },
  { id: "user_gh_1", email: "receiver@africapay.dev", nairaBalance: 0, cedisBalance: 50 }
]);

const store = new InMemoryTransactionStore();
const fx = new MockFxEngine();
const orchestrator = new TransferOrchestrator(ledger, store, fx);

export const health = onRequest((_req, res) => {
  res.status(200).send({ ok: true, service: "africa-pay-functions" });
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

  res.status(tx.status === "FAILED" ? 500 : 200).send({
    transaction: tx,
    ledgerEntries: ledger.listEntries()
  });
});
