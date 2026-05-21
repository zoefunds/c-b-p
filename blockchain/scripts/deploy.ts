import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const usdcAddress = await mockUsdc.getAddress();
  console.log("MockUSDC:", usdcAddress);

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(usdcAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow:", escrowAddress);

  // Mint liquidity to escrow so settle() can transfer out.
  const mintTx = await mockUsdc.mint(escrowAddress, ethers.parseUnits("1000000", 6));
  await mintTx.wait();
  console.log("Minted 1,000,000 mUSDC to escrow");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
