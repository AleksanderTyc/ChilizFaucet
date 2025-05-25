import { useEffect, useState } from "react";
import { ethers } from "ethers";

const { INFURA_API_KEY, SEPOLIAn1_WALLET, SEPOLIAn1_PRIVATE_KEY, SEPOLIAn2_WALLET, HARDHATn1_WALLET, HARDHATn1_PRIVATE_KEY, HARDHATn2_WALLET } = require("./secrets.json");

// const PROVIDER = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
const PROVIDER = new ethers.JsonRpcProvider(`http://127.0.0.1:8545`);
const WALLET_ADDRESS = HARDHATn1_WALLET;
const WALLET_PRIVATE_KEY = HARDHATn1_PRIVATE_KEY;
// const FAUCET_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const FAUCET_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const Faucet_ABI = [
    "function drawWithLimits(address,uint256,bool,bool) public",
    "function limitFrequency() public view returns (uint256)",
    "function limitAmount() public view returns (uint256)",
    "function limitWallet() public view returns (uint256)",
    "function withdrawalsTS(address) public"
];

function AddressField({ valAddress, valAddressChange }) {
    return (
        <input type="text" class="form-control bg-dark text-white" id="inputText" placeholder="Enter your wallet address" onChange={(e) => { valAddressChange(e.target.value); }} value={valAddress}></input>
    );
}

function RequestToken({ reqTokenName, reqTokenId, reqTokenState, clickHandle }) {
    return (
        <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id={reqTokenId} onChange={(e) => { clickHandle(reqTokenId, e.target.checked); }} checked={reqTokenState}></input>
            <label class="form-check-label" for={reqTokenId}>{reqTokenName}</label>
        </div>
    );
}

function RequestButton({ reqAmt, clickHandle }) {
    return (
        <div class="d-grid gap-2">
            <button class="btn btn-primary" id="actionBtn" onClick={() => { clickHandle(); }}>Receive {reqAmt} Spicy CHZ</button>
        </div>
    );
}

export default function Square() {
    let cLimAmount = null;
    const [isLoading, setIsLoading] = useState(false);
    const [limAmount, setLimAmount] = useState("10");
    const [reqAddress, setReqAddress] = useState("");
    const [tokenStates, setTokenStates] = useState([false, false]);
    const [visibleResult, setVisibleResult] = useState("");

    function handleAddressChange(newValue) {
        let dtNow = new Date();
        console.log(`handleAddressChange * on ${dtNow}, newValue is ${newValue}.`);
        setReqAddress(newValue)
    }

    function handleTokenClick(tokenId, curVal) {
        let dtNow = new Date();
        console.log(`handleTokenClick * on ${dtNow}, (tokenId,curVal) is (${tokenId}, ${curVal}).`);
        let curTokenState = tokenStates.slice();
        curTokenState[Number(tokenId)] = curVal;
        setTokenStates(curTokenState);
    }

    function handleRequest() {
        let dtNow = new Date();
        console.log(`handleRequest * on ${dtNow}.`);
        console.log(`handleRequest * reqAddress is ${reqAddress}.`);
        console.log(`handleRequest * tokenStates is ${tokenStates}.`);

        // setIsLoading(true);
        const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

        const Faucet_Contract = new ethers.Contract(FAUCET_CONTRACT_ADDRESS, Faucet_ABI, PROVIDER);
        const contractWithWallet = Faucet_Contract.connect(wallet);

        cLimAmount = ethers.parseEther(limAmount);

        console.log(`handleRequest * calling drawWithLimits with args (${reqAddress},${cLimAmount},${tokenStates}).`);
        contractWithWallet.drawWithLimits(reqAddress, cLimAmount, tokenStates[0], tokenStates[1])
            .then(
                result => {
                    let dtNow = new Date();
                    console.log(`handleRequest * drawWithLimits * on ${dtNow} result hash is ${result.hash}.`);
                    // alert(`handleRequest * drawWithLimits * on ${dtNow} result is ${result}.`);
                    return (PROVIDER.getTransactionReceipt(result.hash));
                }
            )
            .then(
                result => {
                    setVisibleResult(`<h5>Transfer processed</h5> <p>Transaction status is ${result.status} and hash is ${result.hash}</p>`);
                    let tokensTransferred = "None";
                    for (let index = 0; index < tokenStates.length; index++) {
                        if( tokensTransferred == "None" ) {
                            tokensTransferred = tokenStates[index] ? String.fromCharCode(65+index) : "None";
                        } else {
                            tokensTransferred = tokenStates[index] ? tokensTransferred.concat( " ", String.fromCharCode(65+index)) : tokensTransferred;
                        }
                    }
                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = `
                                <h5>Transfer processed</h5>
                                <p>Tokens transferred: ${tokensTransferred}</p>
                                <p>Transaction hash is ${result.hash}</p>
                            `;
/*                                 <p>Transaction status is ${result.status}</p> */
                    resultDiv.classList.remove('d-none');
                }
            )
            .catch(
                error => {
                    let dtNow = new Date();
                    console.error(`Error * handleRequest * drawWithLimits * on ${dtNow}`, error);
                    alert(`Error * handleRequest * drawWithLimits * on ${dtNow}`, error);
                }
            )
            .finally(
                () => {
                    console.log(`handleRequest * drawWithLimits * on ${dtNow} operation completed.`);
                    // setIsLoading(false);
                    setReqAddress("");
                    setTokenStates([false, false]);
                }
            );
    }

    useEffect(
        () => {
            const fetchData = async () => {
                setIsLoading(true);
                const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, PROVIDER);

                const Faucet_Contract = new ethers.Contract(FAUCET_CONTRACT_ADDRESS, Faucet_ABI, PROVIDER);
                const contractWithWallet = Faucet_Contract.connect(wallet);

                cLimAmount = await contractWithWallet.limitAmount();
                const fmtLimAmount = ethers.formatUnits(cLimAmount, "ether");
                let dtNow = new Date();
                console.log(`useEffect * on ${dtNow} cLimAmount is ${cLimAmount}, fmtLimAmount is ${fmtLimAmount}.`);
                setLimAmount(fmtLimAmount);
                setIsLoading(false);
            };
            fetchData();
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
        <div class="container">
            <h1 class="mb-4 text-center">Spicy Chiliz (Testnet) Faucet</h1>

            <div class="mb-3">
                {/* <label for="inputText" class="form-label">Enter your wallet address:</label> */}
                <label class="form-label">Please provide your wallet address:</label>
                <AddressField valAddress={reqAddress} valAddressChange={handleAddressChange} />
            </div>

            <div class="mb-3">
                {/* <label for="inputText" class="form-label">Enter your wallet address:</label> */}
                <label class="form-label">Please select additional test tokens:</label>
                <RequestToken reqTokenName="A" reqTokenId="0" reqTokenState={tokenStates[0]} clickHandle={handleTokenClick} />
                <RequestToken reqTokenName="B" reqTokenId="1" reqTokenState={tokenStates[1]} clickHandle={handleTokenClick} />
            </div>

            <RequestButton reqAmt={limAmount} clickHandle={handleRequest} />

            <div id="result" class="p-3 border rounded mt-4 d-none">
            </div>
        </div>
    );
}
