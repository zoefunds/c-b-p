import { onRequest } from "firebase-functions/v2/https";

export const health = onRequest((_req, res) => {
  res.status(200).send({ ok: true, service: "africa-pay-functions" });
});
