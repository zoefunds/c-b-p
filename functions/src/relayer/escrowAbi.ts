export const escrowAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "transferId", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "settle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
