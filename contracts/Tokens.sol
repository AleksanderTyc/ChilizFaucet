// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// FaucetFrontEnd/contracts/Tokens.sol

// Import OpenZeppelin ERC20
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ChilizTestA is ERC20 {
    constructor() ERC20("TestA", "TA") {
        _mint(msg.sender, type(uint256).max);
    }
}

contract ChilizTestB is ERC20 {
    constructor() ERC20("TestB", "TB") {
        _mint(msg.sender, type(uint256).max);
    }
}
