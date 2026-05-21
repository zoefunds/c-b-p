// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Escrow {
    event TransferInitiated(bytes32 indexed transferId, address indexed from, address indexed to, uint256 amount);
    event TransferCompleted(bytes32 indexed transferId, address indexed to, uint256 amount);

    IERC20 public immutable usdc;

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    function settle(bytes32 transferId, address recipient, uint256 amount) external {
        emit TransferInitiated(transferId, msg.sender, recipient, amount);
        require(usdc.transfer(recipient, amount), "USDC transfer failed");
        emit TransferCompleted(transferId, recipient, amount);
    }
}
