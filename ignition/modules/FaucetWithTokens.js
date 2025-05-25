// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

// FaucetFrontEnd/ignition/modules/FaucetWithTokens.js

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const LIM_CallFreq = 10; // How often the standard withdrawal function may be called (seconds) // PROD: ?
const LIM_WalletFreq = 36; // How often a wallet may request a supply (seconds) // PROD: 24*3600
const LIM_Amount = ethers.parseEther("0.01"); // How much CHZ is supplied // PROD: ?
const LIM_Wallet = ethers.parseEther("0.05"); // Max CHZ a wallet may own to be eligible for supply // PROD: ?

const ONE_CHZ = 1_000_000_000_000_000_000n;

const TokensModule = buildModule("ChilizTestTokensAndBModule", (m) => {
    const FTokenA = m.contract("contracts/Tokens.sol:ChilizTestA");
    const FTokenB = m.contract("contracts/Tokens.sol:ChilizTestB");
    return { FTokenA, FTokenB };
});

const FaucetModule = buildModule("ChilizTestFaucetModule", (m) => {
    const { FTokenA, FTokenB } = m.useModule(TokensModule);

    const limitCallFreq = m.getParameter("limitCallFreq", LIM_CallFreq);
    const limitWalletFreq = m.getParameter("limitWalletFreq", LIM_WalletFreq);
    const limitAmount = m.getParameter("limitAmount", LIM_Amount);
    const limitWallet = m.getParameter("limitWallet", LIM_Wallet);

    const lockedAmount = m.getParameter("lockedAmount", ONE_CHZ);

    const faucet = m.contract("contracts/Faucet.sol:Faucet", [limitCallFreq, limitWalletFreq, limitAmount, limitWallet, FTokenA, FTokenB], { value: lockedAmount });

    return { FTokenA, FTokenB, faucet };
});

const FaucetWithTokensModule = buildModule("ChilizTestFaucetWithTokensModule", (m) => {
    const { FTokenA, FTokenB, faucet } = m.useModule(FaucetModule);
    const transferA = m.call(FTokenA, "transfer", [faucet, ethers.parseEther("1")]);
    const transferB = m.call(FTokenB, "transfer", [faucet, ethers.parseEther("1")]);
    return { FTokenA, FTokenB, faucet };
});

module.exports = FaucetWithTokensModule;

/*
HardHat - Deployed Addresses
ChilizTestTokensAndBModule#ChilizTestA - 0x5FbDB2315678afecb367f032d93F642f64180aa3
ChilizTestTokensAndBModule#ChilizTestB - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ChilizTestFaucetModule#Faucet - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Spicy
TestA: 0xdd04d39972731b43684bbd70f65f65155b011ba4

*/
