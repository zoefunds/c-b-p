import { createPublicClient, createWalletClient, http, parseUnits, pad, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { escrowAbi } from "./escrowAbi";

type SettleParams = {
  transferId: string;
  recipient: `0x${string}`;
  usdcAmount: number;
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export class BaseRelayer {
  private publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(env("BASE_SEPOLIA_RPC_URL"))
  });

  private account = privateKeyToAccount(env("RELAYER_PRIVATE_KEY") as `0x${string}`);

  private walletClient = createWalletClient({
    account: this.account,
    chain: baseSepolia,
    transport: http(env("BASE_SEPOLIA_RPC_URL"))
  });

  private escrowAddress = env("ESCROW_CONTRACT_ADDRESS") as `0x${string}`;

  private toBytes32TransferId(transferId: string): `0x${string}` {
    return pad(toHex(transferId.slice(0, 31)), { size: 32 });
  }

  async settleUsdc(params: SettleParams): Promise<string> {
    const amount6dp = parseUnits(params.usdcAmount.toFixed(6), 6);
    const transferIdBytes32 = this.toBytes32TransferId(params.transferId);

    const hash = await this.walletClient.writeContract({
      address: this.escrowAddress,
      abi: escrowAbi,
      functionName: "settle",
      args: [transferIdBytes32, params.recipient, amount6dp]
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }
}
