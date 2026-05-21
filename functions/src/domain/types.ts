export type Currency = "NGN" | "GHS" | "USDC";

export type TransactionState =
  | "INITIATED"
  | "NAIRA_DEBITED"
  | "FX_CONVERTED"
  | "USDC_SENT"
  | "CEDIS_CREDITED"
  | "COMPLETED"
  | "FAILED";

export interface User {
  id: string;
  email: string;
  nairaBalance: number;
  cedisBalance: number;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  currency: Currency;
  amount: number;
  type: "debit" | "credit";
  reference: string;
  createdAt: string;
}

export interface TransferRequest {
  senderId: string;
  receiverId: string;
  amountNgn: number;
  idempotencyKey: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  fromCurrency: "NGN";
  toCurrency: "GHS";
  amount: number;
  status: TransactionState;
  ngnDebited?: number;
  usdcAmount?: number;
  ghsAmount?: number;
  txHash?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
