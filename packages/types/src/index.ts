export type Currency = "NGN" | "GHS" | "USDC";

export interface User {
  id: string;
  email: string;
  nairaBalance: number;
  cedisBalance: number;
  walletAddress?: string;
}

export type TransactionStatus =
  | "INITIATED"
  | "NAIRA_DEBITED"
  | "FX_CONVERTED"
  | "USDC_SENT"
  | "CEDIS_CREDITED"
  | "COMPLETED"
  | "FAILED";

export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: number;
  status: TransactionStatus;
  txHash?: string;
  createdAt: string;
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
