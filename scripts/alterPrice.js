// -- IMPORT PACKAGES -- //
require("dotenv").config();

import Web3 from 'web3';
import { ChainId, Token, WETH } from "@uniswap/sdk";
import { abi as IUniswapV2FactoryRouter} from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as ERC20 } from '@openzeppelin/contracts/build/contracts/ERC20.json';

// -- SETUP NETWORK & WEB3 -- //

const chainId = ChainId.MAINNET
const web3 = new Web3('http://127.0.0.1:7545')

// -- IMPORT HELPER FUNCTIONS -- //

import { getPairContract, calculatePrice } from '../helpers/helpers';

// -- IMPORT & SETUP UNISWAP/SUSHISWAP CONTRACTS -- //

import { UNISWAP, SUSHISWAP } from '../config.json';
const uFactory = new web3.eth.Contract(IUniswapV2Factory, UNISWAP.FACTORY_ADDRESS)
const sFactory = new web3.eth.Contract(IUniswapV2Factory, SUSHISWAP.FACTORY_ADDRESS)
const uRouter = new web3.eth.Contract(IUniswapV2FactoryRouter, UNISWAP.V2_ROUTER_02_ADDRESS)
const sRouter = new web3.eth.Contract(IUniswapV2FactoryRouter, SUSHISWAP.V2_ROUTER_02_ADDRESS)

// -- CONFIGURATION -- //

const V2_FACTORY_TO_USE = uFactory
const V2_ROUTER_TO_USE = uRouter

const UNLOCKED_ACCOUNT = '0x0e5069514a3Dd613350BAB01B58FD850058E5ca4' // SHIB Unlocked Account
const ERC20_ADDRESS = process.env.ARB_AGAINST
const AMOUNT = '40500000000000' // 40,500,000,000,000 SHIB -- Tokens will automatically be converted to wei
const GAS = 450000

// -- SETUP ERC20 CONTRACT & TOKEN -- //

const ERC20_CONTRACT = new web3.eth.Contract(ERC20, ERC20_ADDRESS)
const WETH_CONTRACT = new web3.eth.Contract(ERC20, WETH[chainId].address)

// -- MAIN SCRIPT -- //

const main = async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[1] // The account to receive WETH after the swap to manipulate price

    const pairContract = await getPairContract(V2_FACTORY_TO_USE, ERC20_ADDRESS, WETH[chainId].address)
    const token = new Token(
        ChainId.MAINNET,
        ERC20_ADDRESS,
        18,
        await ERC20_CONTRACT.methods.symbol().call(),
        await ERC20_CONTRACT.methods.name().call()
    )

    // Fetch price of SHIB/WETH before we execute the swap
    const priceBefore = await calculatePrice(pairContract)

    await manipulatePrice(token, account)

    // Fetch price of SHIB/WETH after the swap
    const priceAfter = await calculatePrice(pairContract)

    const data = {
        'Price Before': `1 ${WETH[chainId].symbol} = ${Number(priceBefore).toFixed(0)} ${token.symbol}`,
        'Price After': `1 ${WETH[chainId].symbol} = ${Number(priceAfter).toFixed(0)} ${token.symbol}`,
    }

    console.table(data)

    let balance = await WETH_CONTRACT.methods.balanceOf(account).call()
    balance = web3.utils.fromWei(balance.toString(), 'ether')

    console.log(`\nBalance in reciever account: ${balance} WETH\n`)
}

main()

// 

async function alterPrice(token, account) {
    console.log(`\nBeginning Swap...\n`)

    console.log(`Input Token: ${token.symbol}`)
    console.log(`Output Token: ${WETH[chainId].symbol}\n`)

    const amountIn = new web3.utils.BN(
        web3.utils.toWei(AMOUNT, 'ether')
    )

    const path = [token.address, WETH[chainId].address]
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes

    await ERC20_CONTRACT.methods.approve(V2_ROUTER_TO_USE._address, amountIn).send({ from: UNLOCKED_ACCOUNT })
    const receipt = await V2_ROUTER_TO_USE.methods.swapExactTokensForTokens(amountIn, 0, path, account, deadline).send({ from: UNLOCKED_ACCOUNT, gas: GAS });

    console.log(`Swap Complete!\n`)

    return receipt
}

