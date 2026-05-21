export class MockFxEngine {
  // 1 USDC ~= 1500 NGN ; 1 USDC ~= 15 GHS
  private readonly ngnPerUsdc = 1500;
  private readonly ghsPerUsdc = 15;

  convertNgnToUsdc(ngnAmount: number): number {
    return Number((ngnAmount / this.ngnPerUsdc).toFixed(6));
  }

  convertUsdcToGhs(usdcAmount: number): number {
    return Number((usdcAmount * this.ghsPerUsdc).toFixed(4));
  }
}
