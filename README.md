# Generic Ethereum DEX Arbitrage Application

## Overview

This project is a generic arbitrage bot that monitors the Ethereum blockchain for arbitrage opportunities between two decentralized exchanges (DEXs). It is designed to be flexible and can be configured to monitor any two DEXs that are supported by the [Uniswap SDK](https://uniswap.org/docs/v2/SDK/getting-started/). The bot is designed to be run locally and can be configured to monitor the Ethereum mainnet or a local blockchain such as Ganache.

The main purposes for this build was as a working prototype and framework for future projects as well as a foray into using Alchemy. It could be employed in production with some configuration. However, it is not audited and may contain security vulnerabilities. See [Security Concerns](#security-concerns) for more information.

## Technology Stack & Tools

- Solidity
- Javascript
  - React (Frontend)
  - Solidity Unit Tests
- [Web3.js](https://web3js.readthedocs.io/en/v1.5.2/)
- [Truffle](https://www.trufflesuite.com/docs/truffle/overview)
- [Ganache-cli](https://github.com/trufflesuite/ganache)
- [Alchemy](https://www.alchemy.com/)

## Security Concerns

- **Unaudited by a third party** - This project has not been audited by a third party. It is possible that there are security vulnerabilities that have not been identified or addressed.
- **Out of Date Components** - 
  - **node Version** - This is built with node v16.5.0. Maintaining version is useful to avoid potential dependency issues but using [out of date components is always a security risk](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/) depending on factors such as where and how it is being run (local vs. server)
  - **Uniswap V2** - This project uses Uniswap v2 which is not the latest version. Uniswap v3 has been released and is currently in use. Uniswap V2 is still in use and is still supported, but it is possible that it will be deprecated in the future.
  - **Sushiswap** - Sushiswap is built off Uniswap v2 which used a GPL license. Uniswap v3 uses a commercial license transitioning to GPL in May 2023. It is expected that Sushiswap will incorporate the upgrades in Uniswap v3 to the latest version of Sushiswap  been released and is currently in use.
- **Common Vulnerabilities** - This project may be susceptible to common vulnerabilities and issues that are always of concern when dealing with exchange. Care should be taken in how one addresses these when setting configuration. For instance,it is possible for a malicious actor to monitor the blockchain either for arbitrage opportunities or particular transactions use this knowledge to execute a trade before the bot does. This can be mitigated by increasing the gas price of the transaction, but this is not a foolproof solution and may be too costly. Other strategies can be employed to mitigate this risk, but they are not addressed in this project. Some of these vulnerabilities include:
  - **Front-running**
  - **Price Manipulation**
  - **Slippage**
  - **Gas Price**
  - **Gas Limit**

## Requirements For Initial Setup

### [NodeJS](https://nodejs.org/en/) (v16.5.0: see Security Concerns above)
  
[Truffle](https://www.trufflesuite.com/docs/truffle/overview)
  
Verify installation and version
  
``` bash
truffle --version
```
  
Install truffle globally

``` bash
npm i -g truffle
```

- [Ganache-cli](https://github.com/trufflesuite/ganache). 

``` bash
ganache-cli --version
npm install ganache-cli --global
```

## Project Set Up

### 1. Clone/Download the Repository

### 2. Install Dependencies:

``` bash
npm install
```

### 3. Start Ganache CLI

``` bash
ganache-cli -f wss://eth-mainnet.alchemyapi.io/v2/<Your-App-Key> -m <Your-Mnemonic-Phrase> -u 0x0e5069514a3dd613350bab01b58fd850058e5ca4 -p 7545
```

Replace Your-App-Key with your Alchemy Project ID located in the settings of your project. Replace Your-Mnemonic-Phrase with your own mnemonic phrase. If you don't have a mnemonic phrase to include you can omit it:

``` bash
ganache-cli -f wss://eth-mainnet.alchemyapi.io/v2/<Your-App-Key> -u 0x0e5069514a3dd613350bab01b58fd850058e5ca4 -p 7545
```

For the -u parameter in the command, we are unlocking an address with SHIB tokens to manipulate price of SHIB/WETH in our scripts. If you plan to use a different ERC20 token, you'll need to unlock an account holding that specific ERC20 token.

### 4. Setup .env

Before running scripts an .env file needs to be created with with the following values (see .env.example):

- **ALCHEMY_API_KEY=""**
- **ARB_FOR="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"** (default is the WETH contract address)
- **ARB_AGAINST="0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"**  (default is the SHIB contract address)
- **ACCOUNT=""** (Ownership account. Receives profit, controls execution of arbitrage contract)
- **PRICE_DIFFERENCE=0.50** (Sets triggering price differential between Uniswap & Sushiswap, default 0.50%)
- **UNITS=0** (Used for price reporting)
- **GAS_LIMIT=600000** (hardcoded value, adjust as required dduring testing)
- **GAS_PRICE=0.0093** (hardcoded value, adjust as required during testing)

### 5. Migrate Contracts

Open a new terminal and run:

``` bash
truffle migrate --reset
```

### 6. Start Listener

``` bash
node ./watcher.js
```

### 7. Alter the Price

Open another terminal and run:

``` bash
node ./scripts/alterPrice.js
```

## Configuration

The *config.json* file contains two PROJECT_SETTINGS options that hold a boolean value:

- isLocal
- isDeployed

The choice between the two options depends on your preferred method for testing. By default, both values are set to true. Setting isLocal to false and then running the bot enables it to monitor swap events on the actual mainnet rather than locally.

The value of isDeployed can be determined based on whether you want the arbitrage contract to be called when a potential trade is identified. For local testing, isDeployed is set to true by default. This setting is particularly useful if you wish to observe swaps on the mainnet without having a contract deployed, allowing you to experiment with discovering potential arbitrage opportunities.

## Testing

For monitoring prices and detecting potential arbitrage opportunities, you do not need to deploy the contract. 

### 1. Edit config.json

Inside the *config.json* file, set **isDeployed** to **false**.

### 2. Create and Setup .env

See step #4 in **Setting Up**

### 3. Run the bot

``` bash
node ./watcher.js
```

Keep in mind you'll need to wait for an actual swap event to be triggered before it checks the price.

## Anatomy of watcher.js

The application is essentially composed of 5 functions.

- *main()*
- *checkPrice()*
- *determineDirection()*
- *determineProfitability()*
- *executeTrade()*

The *main()* function keeps track of swap events from both Uniswap and Sushiswap.

When a swap event takes place, it calls *checkPrice()*, which logs the current price of the assets on Uniswap and Sushiswap and returns the **priceDifference**.

Next, *determineDirection()* is called, determining where to buy first and then sell. This function returns an array called **routerPath** in *main()*. The array contains Uniswap and Sushiswap's router contracts. If no array is returned, this means the **priceDifference** returned earlier is not greater than **difference**.

If **routerPath** is not null, we proceed to *determineProfitability()*. Here, we establish conditions to decide whether there is a potential arbitrage opportunity. This function returns either true or false.

If true is returned from *determineProfitability()*, we call *executeTrade()*, where we make a call to our arbitrage contract to execute the trade. Afterward, a report is logged, and the bot resumes monitoring for swap events.

### Modifying & Testing the Scripts

Both *alterPrice.js* and *watcher.js* have been set up to facilitate easy modifications. Before the main() function in *alterPrice.js*, there's a comment: **// -- CONFIGURE VALUES HERE -- //**. Below that, you can modify constants such as the unlocked account and the amount of tokens you want that account to spend to manipulate the price (adjust this if testing different pairs).

For *watcher.js*, examine the function around line 132 called *determineProfitability()*. Inside this function, you can set conditions and perform calculations to determine whether a potentially profitable trade is available. This function returns **true** if a profitable trade is possible and **false** if not.

Note that if you are performing arbitrage for a different ERC20 token than the provided example (WETH), you might need to adjust profitability reporting in the *executeTrade()* function.

Keep in mind that after running the scripts, specifically *alterPrice.js*, you may need to restart your ganache CLI and re-migrate contracts for proper retesting.

### Additional Information

The *watcher.js* script utilizes helper functions to fetch token pair addresses, calculate asset prices, and estimate returns. These functions can be found in the *helper.js* file within the helper folder.

The helper folder also contains *server.js*, responsible for launching our local server, and *initialization.js*, responsible for setting up our web3 connection, configuring Uniswap/Sushiswap contracts, and more.

### Strategy

The current strategy is demonstrated as an example along with the *alterPrice.js* script. Essentially, after manipulating the price on Uniswap, we examine the reserves on Sushiswap and determine how much SHIB we need to purchase on Uniswap to 'clear' Sushiswap's reserves. As a result, the arbitrage direction is Uniswap -> Sushiswap.

This works because Sushiswap has fewer reserves than Uniswap. However, if the arbitrage direction were reversed: Sushiswap -> Uniswap, this might sometimes result in errors when monitoring swaps on the mainnet.

### Error Handling

This error occurs in the *determineProfitability()* function inside *watcher.js*. A try/catch is currently implemented, so if an error occurs, the bot resumes monitoring the price. Other solutions may include implementing a different strategy, using different ERC20 tokens, or reversing the order.

### Future Improvements

- Implement a different strategy
- Move to a different framework for testing (Hardhat, Foundry, etc.)

### Compatible DEXs & Blockchains

DEXs: DyDx Aave Uniswap Sushiswap

EVM compatible blockchains: Polygon Matic, Fantom, Avalanche, Binance

Etherscan: DEX List, list of tokens on Ethereum

CoinMarketCap: List of tokens on Binance, etc

Avalanche: TraderJoe