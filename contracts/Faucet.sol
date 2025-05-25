// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// FaucetFrontEnd/contracts/Faucet.sol

/*
faucet contract
Stage 1 - coin only
- constructor - initial coin supply
- draw - within limits (amount, frequency, limit per account)
- setSupplyLimits - owner only, set how much, set how often limits
- drawUnlimited - owner only, send coin to a given wallet bypassing all the limits
- withdrawAll - owner only, reduce to 0, shut the service down
- collect unwanted coins - receive() function

Stage 2 - tokens
- Dedicated ERC20 contract(s) to own and manage tokens
- supply tokens - owner only - transfer ownership to the faucet contract
- token dispenser function

Improvements
- gas optimisation - not more often than... wait until X transactions queued
- gas optimisation - multiple token transfer in one transaction (supply tokens) - minor, infrequent operation
- gas / UX optimisation - multiple components in a single request - coins and tokens
- defense against abuse - bots, denial of service
- is it safe to allow Smart Contracts to draw? Or EOA only?

Delighters
- Event logging
    event Withdrawal(uint amount, uint when);

Business:
- extra coins / tokens for a payment

Special delivery
- providing extraordinary amounts with special code - how to do that safely?


- minting tokens on the fly vs small batches vs one-off large amount
-- gas usage (on the fly is gas heavy)
-- price impact - exclusivity vs increased supply
*/

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Simple Faucet contract
 */
contract Faucet {
    address payable public owner;

    /**
     * @dev Supply limits
     */
    uint256 public limitCallFreq; // withdrawal frequency limit per function call (second) // 0 means N/A
    uint256 public limitWalletFreq; // withdrawal frequency limit per wallet (second) // 0 means N/A
    uint256 public limitAmount; // amount dispensed (coin)
    uint256 public limitWallet; // wallet's balance limit (coin) // 0 means N/A

    uint256 public functionCallTS; // TS of next available withdrawal call or 0 if never drawn / immediate
    mapping(address => uint256) public withdrawalsTS; // TS of next available withdrawal or 0 if never drawn / immediate

    /**
     * @dev Test tokens to distribute
     */
    address public tokenA;
    address public tokenB;

    /**
     * @dev Modifier applied to functions available only to the contract's owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    /**
     * @dev Supply funds and set the limits at time of deployment
     */
    constructor(
        uint256 _limitCallFreq,
        uint256 _limitWalletFreq,
        uint256 _limitAmount,
        uint256 _limitWallet,
        address _tokenA,
        address _tokenB
    ) payable {
        require(msg.value > 0, "Must be deployed with positive balance");
        owner = payable(msg.sender);

        limitCallFreq = _limitCallFreq;
        limitWalletFreq = _limitWalletFreq;
        limitAmount = _limitAmount;
        limitWallet = _limitWallet;
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /**
     * @dev Basic faucet functionality.
     * @param _beneficiary Address of wallet receiving the supply
     * @param _withdrawalAmt Amount of coin supplied, interface will set it to limitAmount
     */
    function drawWithLimits(
        address _beneficiary,
        uint256 _withdrawalAmt,
        bool _drawTokenA,
        bool _drawTokenB
    ) public {
        // @dev Is this really required? Almost impossible in drawWithLimits scenario, vs gas cost
        // require(
        //     _withdrawalAmt <= address(this).balance,
        //     "Withdrawal request exceeds total supply available"
        // );
        require(
            functionCallTS < block.timestamp,
            "Withdrawal function call request within time lock"
        );
        require(
            withdrawalsTS[_beneficiary] < block.timestamp,
            "Withdrawal request within time lock"
        );
        require(
            _withdrawalAmt <= limitAmount,
            "Withdrawal request exceeds amount limit"
        );
        if ((0 < limitWallet) && (limitWallet <= _beneficiary.balance)) {
            revert("Withdrawal request exceeds wallet limit");
        }

        withdrawalsTS[_beneficiary] = block.timestamp + limitWalletFreq;
        functionCallTS = block.timestamp + limitCallFreq;
        payable(_beneficiary).transfer(_withdrawalAmt);
        if (_drawTokenA) {
            IERC20(tokenA).transfer(_beneficiary, 1);
        }
        if (_drawTokenB) {
            IERC20(tokenB).transfer(_beneficiary, 1);
        }
    }

    /**
     * @dev Enable owner to send specified amount of coin to a given wallet bypassing all the limits.
     * @param _beneficiary Address of wallet receiving the supply
     * @param _withdrawalAmt Amount of coin supplied, interface will set it to limitAmount
     */
    function drawUnlimited(
        address _beneficiary,
        uint256 _withdrawalAmt,
        bool _drawTokenA,
        bool _drawTokenB
    ) public {
        require(
            _withdrawalAmt <= address(this).balance,
            "Withdrawal request exceeds total supply available"
        );
        withdrawalsTS[_beneficiary] = block.timestamp;
        payable(_beneficiary).transfer(_withdrawalAmt);
        if (_drawTokenA) {
            IERC20(tokenA).transfer(_beneficiary, 1);
        }
        if (_drawTokenB) {
            IERC20(tokenB).transfer(_beneficiary, 1);
        }
    }

    /**
     * @dev Enable owner to modify supply limits
     */
    function setSupplyLimits(
        uint256 _limitWalletFreq,
        uint256 _limitCallFreq,
        uint256 _limitAmount,
        uint256 _limitWallet
    ) public payable onlyOwner {
        limitWalletFreq = _limitWalletFreq;
        limitCallFreq = _limitCallFreq;
        limitAmount = _limitAmount;
        limitWallet = _limitWallet;
    }

    /**
     * @dev Enable owner to drain funds from the contract, rendering it unusable
     */
    function withdrawAll() public onlyOwner {
        owner.transfer(address(this).balance);
    }

    /**
     * @dev Contract can accept new funds.
     *
     * Unused / unwanted test coins can be returned to the faucet.
     * Security consideration:
     *   Anyone can do this, so owner has no way to disable the contract other than destroy it.
     *
     */
    receive() external payable {}
}
