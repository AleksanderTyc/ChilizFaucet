import { useEffect, useState } from "react";
import { ethers } from "ethers";

const {
  ETHERSCAN_API_KEY,
  INFURA_API_KEY,
  SEPOLIA_PRIVATE_KEY,
  HARDHAT_WALLET,
  HARDHAT_PRIVATE_KEY,
  HOLDER_ADDRESS,
  TRADER_ADDRESS
} = require("./secrets.json");
// const PROVIDER = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
// const ADDRESS = '0x31ac9aa612ba2647280111ffa46488e07cf3fd8d';
const PROVIDER = new ethers.JsonRpcProvider(`http://127.0.0.1:8545`);
const WALLET_ADDRESS = HARDHAT_WALLET;
const WALLET_PRIVATE_KEY = HARDHAT_PRIVATE_KEY;
// const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
// const ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const Trader_ABI = [
  "function mint(uint256) public",
  "function burn(uint256) public",
  "function trade(uint256, uint256) public"
];

const Holder_ABI = [
  "function balanceOfBatch(address[] memory, uint256[] memory) public view  returns (uint256[] memory)",
];


/*
* Token 3 can be minted by burning token 0 and 1.
* Token 4 can be minted by burning token 1 and 2
* Token 5 can be minted by burning 0 and 2
* Token 6 can be minted by burning 0, 1, and 2
* Tokens [3-6] cannot be forged into other tokens
* Tokens [3-6] can be burned but you get nothing back
* You can trade any token for [0-2] by hitting the trade this button.

Interface:
Ownership: Token x : y, x = 0,...,6
Balance (ETH)
Ensure that the app is connected to Sepolia chain
Actions:
- Mint x, x = 0,...,2
- Mint x, x = 3,...,6 - making a selection should modify the description: "forfeit y and z"
- Burn x, x = 3,...,6 - explain that there is no gain
- Trade x, x = 0,...,6 for y, y = 0,...,2
*/
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

// https://javascript.info/custom-errors
class InsufficientBalanceError extends Error {
  constructor(message) {
    super(message);
    this.name = "Insufficient Token Balance Error";
  }
}

function checkPositiveBalance(tokenId, tokenBalances) {
  if (tokenBalances[tokenId] === 0) {
    throw new InsufficientBalanceError(`Token ${tokenId} has zero balance.`);
  }
}

function Network({ networkName }) {
  const networkNameField = document.getElementById("networkName");
  networkNameField.innerHTML = `Connected to ${networkName} network.`;
}

function Balance() {
  let dtNow = new Date();
  console.log(`Balance * on ${dtNow} WALLET_ADDRESS is ${WALLET_ADDRESS}.`);
  const balance = PROVIDER.getBalance(WALLET_ADDRESS);
  balance.then(
    result => {
      const balanceField = document.getElementById("currentETHBalance");
      const currHTML = balanceField.innerHTML;
      let dtNow = new Date();
      console.log(`balance object on resolve * on ${dtNow} currHTML is ${currHTML}.`);
      balanceField.innerHTML = `Current ETH Balance is ${ethers.formatEther(result)} ETH.`;
    }
  );
}

function BaseToken({ tokenId, tokenBalance, clickHandle }) {
  return (
    <div>
      <button onClick={() => { clickHandle(tokenId); }}>Token {tokenId} balance: {tokenBalance}</button>
    </div>
  );
}

function Trade({ sourceToken, targetToken, onSourceChange, onTargetChange, onTrade }) {
  let optionsAvailable = [];
  for (let index = 0; index < 3; index++) {
    if (index.toString() != sourceToken.toString()) {
      optionsAvailable.push(<option key={index} value={index}>{index}</option>);
    }
  }
  return (
    <div>
      <label>Trade</label>
      <select value={sourceToken} onChange={(e) => { onSourceChange(e.target.value); }} name="tradeSources" id="tradeSources">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
      <label>to obtain</label>
      <select value={targetToken} onChange={(e) => { onTargetChange(e.target.value); }} name="tradeTargets" id="tradeTargets">
        {optionsAvailable}
      </select>
      <button onClick={onTrade}>Trade</button>
    </div>
  );
}

export default function Square() {
  const networkName = "HardHat local";
  // const networkName = "Sepolia";
  const [tokenBalances, setTokenBalances] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [tradeSource, setTradeSource] = useState(0);
  const [tradeTarget, setTradeTarget] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState();

  function mintBase(tokenId) {
    setIsLoading(true);
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

    const TraderContract = new ethers.Contract(TRADER_ADDRESS, Trader_ABI, PROVIDER);
    const contractWithWallet = TraderContract.connect(wallet);

    const mintBase = contractWithWallet.mint(tokenId);
    mintBase.then(
      result => {
        let newTokenBalances = tokenBalances.slice();
        newTokenBalances[tokenId] += 1;
        setTokenBalances(newTokenBalances);
      }
    )
      .catch(
        result => {
          let dtNow = new Date();
          alert(`mintBase error * on ${dtNow} result is ${result}.`);
          setIsError(result);
        }
      )
      .finally(
        () => {
          setIsLoading(false);
        }
      );
  }

  function mintHigher(tokenId) {
    const forgingMap = { 3: [0, 1], 4: [1, 2], 5: [0, 2], 6: [0, 1, 2] };
    let newTokenBalances = tokenBalances.slice();
    try {
      forgingMap[tokenId].map((item) => { checkPositiveBalance(item, newTokenBalances); });
      setIsLoading(true);
      const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

      const TraderContract = new ethers.Contract(TRADER_ADDRESS, Trader_ABI, PROVIDER);
      const contractWithWallet = TraderContract.connect(wallet);

      const mintHigher = contractWithWallet.mint(tokenId);
      mintHigher.then(
        result => {
          let newTokenBalances = tokenBalances.slice();
          forgingMap[tokenId].map((item) => { newTokenBalances[item] -= 1; });
          newTokenBalances[tokenId] += 1;
          setTokenBalances(newTokenBalances);
        }
      )
        .catch(
          result => {
            let dtNow = new Date();
            alert(`mintHigher error * on ${dtNow} result is ${result}.`);
            setIsError(result);
          }
        )
        .finally(
          () => {
            setIsLoading(false);
          }
        );
    }
    catch (err) {
      alert(`Unable to mint.\nInsufficient base tokens balance.\n${err.name}: ${err.message}`);
    }
  }

  function handleTrade() {
    let newTokenBalances = tokenBalances.slice();
    try {
      checkPositiveBalance(tradeSource, newTokenBalances);
      setIsLoading(true);
      const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

      const TraderContract = new ethers.Contract(TRADER_ADDRESS, Trader_ABI, PROVIDER);
      const contractWithWallet = TraderContract.connect(wallet);

      const tradeCall = contractWithWallet.trade(tradeSource, tradeTarget);
      tradeCall.then(
        result => {
          let newTokenBalances = tokenBalances.slice();
          newTokenBalances[tradeSource] -= 1;
          newTokenBalances[tradeTarget] += 1;
          setTokenBalances(newTokenBalances);
        }
      )
        .catch(
          result => {
            let dtNow = new Date();
            alert(`tradeCall error * on ${dtNow} result is ${result}.`);
            setIsError(result);
          }
        )
        .finally(
          () => {
            setIsLoading(false);
          }
        );
    }
    catch (err) {
      alert(`Unable to trade.\n${err.name}: ${err.message}`);
    }
  }

  function burn(tokenId) {
    let newTokenBalances = tokenBalances.slice();
    try {
      checkPositiveBalance(tokenId, newTokenBalances);
      setIsLoading(true);
      const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

      const TraderContract = new ethers.Contract(TRADER_ADDRESS, Trader_ABI, PROVIDER);
      const contractWithWallet = TraderContract.connect(wallet);

      const burnCall = contractWithWallet.burn(tokenId);
      burnCall.then(
        result => {
          let newTokenBalances = tokenBalances.slice();
          newTokenBalances[tokenId] -= 1;
          setTokenBalances(newTokenBalances);
        }
      )
        .catch(
          result => {
            let dtNow = new Date();
            alert(`burnCall error * on ${dtNow} result is ${result}.`);
            setIsError(result);
          }
        )
        .finally(
          () => {
            setIsLoading(false);
          }
        );
    }
    catch (err) {
      alert(`Unable to burn.\n${err.name}: ${err.message}`);
    }
  }

  useEffect(
    () => {
      const fetchBalances = async () => {
        setIsLoading(true);
        const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

        const HolderContract = new ethers.Contract(HOLDER_ADDRESS, Holder_ABI, PROVIDER);
        const contractWithWallet = HolderContract.connect(wallet);

        const tokenBalances = await contractWithWallet.balanceOfBatch(
          [WALLET_ADDRESS, WALLET_ADDRESS, WALLET_ADDRESS, WALLET_ADDRESS, WALLET_ADDRESS, WALLET_ADDRESS, WALLET_ADDRESS],
          [0, 1, 2, 3, 4, 5, 6]
        );
        let newTokenBalances = [];
        tokenBalances.forEach(element => { newTokenBalances.push(Number(element)); });
        setTokenBalances(newTokenBalances);
        let dtNow = new Date();
        console.log(`fetchBalances * on ${dtNow} newTokenBalances is ${newTokenBalances}.`);
        setIsLoading(false);
      };
      fetchBalances();
    }, []
  );

  if (isLoading) {
    return (
      <div>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <Network networkName={networkName} />
      <Balance />
      <h1>Base Tokens</h1>
      <BaseToken tokenId="0" tokenBalance={tokenBalances[0]} clickHandle={mintBase} />
      <BaseToken tokenId="1" tokenBalance={tokenBalances[1]} clickHandle={mintBase} />
      <BaseToken tokenId="2" tokenBalance={tokenBalances[2]} clickHandle={mintBase} />
      <h1>Higher Tokens</h1>
      <BaseToken tokenId="3" tokenBalance={tokenBalances[3]} clickHandle={mintHigher} />
      <BaseToken tokenId="4" tokenBalance={tokenBalances[4]} clickHandle={mintHigher} />
      <BaseToken tokenId="5" tokenBalance={tokenBalances[5]} clickHandle={mintHigher} />
      <BaseToken tokenId="6" tokenBalance={tokenBalances[6]} clickHandle={mintHigher} />
      <h1>Trade</h1>
      <Trade sourceToken={tradeSource} targetToken={tradeTarget} onSourceChange={setTradeSource} onTargetChange={setTradeTarget} onTrade={handleTrade} />
      <h1>Burn (no gain)</h1>
      <BaseToken tokenId="3" tokenBalance={tokenBalances[3]} clickHandle={burn} />
      <BaseToken tokenId="4" tokenBalance={tokenBalances[4]} clickHandle={burn} />
      <BaseToken tokenId="5" tokenBalance={tokenBalances[5]} clickHandle={burn} />
      <BaseToken tokenId="6" tokenBalance={tokenBalances[6]} clickHandle={burn} />
    </div>
  );
}
