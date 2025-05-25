# ChilizFaucet

A simple faucet dispensing coin and tokens.

## Rationale

This project was built at the [Hacking Poland](https://lu.ma/bf07xfmw) event organised by [Chiliz](https://www.chiliz.com/). At that time the only faucet providing Spicy testnet tokens was Tatum. That faucet did not distribute any test tokens.

## Functionality

The project comprises both front end simple interface and the back end smart contract managing coin and tokens.

### Functionality - front end

The user is presented with a screen, where a wallet address should be inserted and optionally test tokens can be selected. Then the user clicks "Receive" button, which triggers coin and tokens delivery.

### Functionality - back end

The Faucet smart contract must be deployed with CHZ Spicy coin and connected to two ERC20 contracts representing test tokens. Tokens contracts must make Faucet the owner of tokens by executing transfer function. At every delivery of tokens, the Faucet contract will transfer ownership of one of its tokens to the wallet requesting the delivery.

### Preventing misuse

The Faucet has some built-in limitations which prevent excessive drawing:
- how often a wallet is allowed to draw (limiting an individual wallet);
- how often the drawing function can be called (limiting volume of requests);
- how much coin is delivered at a single draw;
- the Faucet will not send coin to wallets with balance above certain threshold.

All these parameters are configurable both at and after the Faucet deployment.

## Security

To perform its functions the web application needs access to the owner (deployer) of the Faucet contract. The app uses the owner's private key to sign and send transactions to the chain.
