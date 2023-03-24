import {
    constants,
    Contract,
    ethers,
    providers,
    utils,
    Wallet,
} from 'ethers';
import { config } from './helpers/config';
import { PANCAKESWAP_ABI } from './helpers/pancakeAbi';
import { SwapsWrapper } from './swaps';
// import { sendNotification } from './helpers/telegram';
import { HelpersWrapper } from './helpers/helpers';
import { PRIVATE_KEY } from './helpers/constant';



class Mempool {

    private _wsprovider: providers.WebSocketProvider;
    private _provider: providers.JsonRpcProvider;
    private _pancakeSwap: ethers.utils.Interface;
    private contract: Contract;
​
    constructor() {
​
        // initialize some variables i.e provider, signers, interface
        this._wsprovider = new providers.WebSocketProvider(config.WSS_URL);
        this._pancakeSwap = new ethers.utils.Interface(PANCAKESWAP_ABI);
        this._provider = new providers.JsonRpcProvider(config.JSON_RPC);
        this.contract = new Contract(
            config.PANCAKESWAP_ROUTER,
            PANCAKESWAP_ABI,
            new Wallet(PRIVATE_KEY, this._provider) //signer
        );
​
    }
​
    /**
     * Monitor mempool for transactions
     */
​
    public monitor = async () => {
        // mempool monitoring
        this._wsprovider.on('pending', async (txHash: string) => {
            try {
                let receipt = await this._wsprovider.getTransaction(txHash);
​
                receipt?.hash && this._process(receipt);
            } catch (error) {
                console.error(`Error`, error);
            }
        });
    };
​
    private _process = async (receipt: providers.TransactionResponse) => {
        //process transaction implementation
        let {
            value: targetAmountInWei,
            to: router,
            gasPrice: targetGasPriceInWei,
            gasLimit: targetGasLimit,
            hash: targetHash,
            from: targetFrom,
        } = receipt;
        try {
            console.info(`
            AmountInWei: ${targetAmountInWei}
            Transaction Hash: ${targetHash}
            Address: ${targetFrom}, 
            Gas Price: ${(targetGasPriceInWei?.div(1e9).toString())} Gwei
            Router: ${router} 
            Gas Limit: ${targetGasLimit}`)

        } catch (error) {
            console.log("Error processing data: ", error)
        }
    

        //check for supported routers
        if (router && config.SUPPORTED_ROUTER.some((router) =>
            router?.toLowerCase() === receipt.to?.toLowerCase())) {
            //map through a list of tokens we are monitoring 
            let tokensToMonitor = config.TOKENS_TO_MONITOR.map((token: string) => token.toLowerCase());
            try {
                // decode transaction data
                const txData = this._pancakeSwap.parseTransaction({
                    data: receipt.data,
                });
                //desctructure transaction  data to get methodeName 
                let { name: targetMethodName, args: targetArgs } = txData;

                let { path } = targetArgs;

                let targetToToken = path[path.length - 1];
                let gasPrice = utils.formatUnits(targetGasPriceInWei!.toString())

                //if the path is undefined stop execution and return
                if (!path) return;
                console.info({
                    'Target name': targetMethodName,
                    'Our Path' : path,
                    'Gas Price': gasPrice,
                    'Transaction Hash' : targetHash,
                    'Target Form': targetFrom
                })


                //preprare simulation data
​
                let SwapAmountIn = utils.parseEther("0.0001")
                let swapRouter = config.PANCAKESWAP_ROUTER;
                let swapPath = [config.WBNB_ADDRESS, targetToToken];
​
                //check if the token is a scam token or not [BuyTax, sellTax]
                // let { buyTax, sellTax } = await HelpersWrapper.calculateTax({ swapRouter, swapPath, SwapAmountIn })
​
                // console.log("BUY TAX", buyTax, "SELL TAX", sellTax)
​
                if (targetMethodName.startsWith("addLiquidity")) {
                    let tokenToBuy;
                    let tokenA = targetArgs.tokenA
                    let tokenB = targetArgs.tokenB
​
                    if (tokensToMonitor.includes(tokenA.toLowerCase())) {
                        tokenToBuy = tokenA
                    } else if (tokensToMonitor.includes(tokenB.toLowerCase())) {
                        tokenToBuy = tokenB
                    }
                    if (tokenToBuy) {
​
                        let message = `TOKEN TO CAPTURE NOTIFICATION`
                        message += `captured a token ${tokenToBuy} its in our tokens to monitor list`
                        message += `proceeding to buy the token`
​
                        // await sendNotification(message)
​
​
                        //check if token is verified
                        const verifyToken = await HelpersWrapper.isVerified(tokenToBuy);
​
​
                        //check if the token is a scam token or not [BuyTax, sellTax]
//                         let { buyTax, sellTax } = await HelpersWrapper.calculateTax({ swapRouter, swapPath, SwapAmountIn })
// ​
//                         console.log("BUY TAX", buyTax, "SELL TAX", sellTax)
​
// ​
//                         if (verifyToken) {
// ​
//                             if (parseInt(buyTax) <= config.MINIMUM_BUY_TAX) {
// ​
//                                 //TODO execute a buy order for the token
// ​
//                                 const path = [config.WBNB_ADDRESS, tokenToBuy]
// ​
//                                 const nonce = await HelpersWrapper.getNonce();
// ​
//                                 let overLoads: any = {
//                                     gasLimit: targetGasLimit,
//                                     gasPrice: gasPrice,
//                                     nonce: nonce!
//                                 }
// ​
// ​
//                                 let buyTx = await SwapsWrapper.swapExactETHForTokensSupportingFeeOnTransferTokens({
//                                     amountOutMin: 0,
//                                     bnbAmount: config.BNB_BUY_AMOUNT,
//                                     path: path,
//                                     overLoads: overLoads
//                                 })
// ​
//                                 if (buyTx.sucess == true) {
// ​
//                                     //get confrimation receipt before approving 
//                                     const receipt = await this._provider.getTransactionReceipt(buyTx.data)
// ​
//                                     if (receipt && receipt.status == 1) {
// ​
//                                         overLoads["nonce"] += 1
//                                         //approving the tokens
//                                         await SwapsWrapper.approve({
//                                             tokenAddress: tokenToBuy,
//                                             overLoads: overLoads
//                                         })
// ​
// ​
//                                         console.log("WAITING FOR SELLING")
//                                     }
// ​
//                                 }
//                             }
// ​
// ​
//                         }
​
​
                    }
​
                } else if (targetMethodName.startsWith("addLiquidityETH")) {
​
                    let tokenToBuy = targetArgs.token
​
                    if (tokenToBuy) {
​
                        let message = `TOKEN CAPTURE NOTIFICATION`
                        message += `captured a token ${tokenToBuy} its in our tokens to monitor list`
                        message += `proceeding to buy the token`
​
                        // await sendNotification(message)
​
​
                        //check if token is verified
                        const verifyToken = await HelpersWrapper.isVerified(tokenToBuy);
​
​
                        //check if the token is a scam token or not [BuyTax, sellTax]
                        // let { buyTax, sellTax } = await HelpersWrapper.calculateTax({ swapRouter, swapPath, SwapAmountIn })
​
​
//                         if (verifyToken) {
// ​
//                             if (parseInt(buyTax) <= config.MINIMUM_BUY_TAX && parseInt(sellTax) <= config.MINIMUM_SELL_TAX) {
// ​
//                                 // execute a buy order for the token
// ​
//                                 const path = [config.WBNB_ADDRESS, tokenToBuy]
//                                 const nonce = await HelpersWrapper.getNonce();
// ​
//                                 let overLoads: any = {
//                                     gasLimit: targetGasLimit,
//                                     gasPrice: gasPrice,
//                                     nonce: nonce!
//                                 }
// ​
// ​
//                                 let buyTx = await SwapsWrapper.swapExactETHForTokensSupportingFeeOnTransferTokens({
//                                     amountOutMin: 0,
//                                     bnbAmount: config.BNB_BUY_AMOUNT,
//                                     path: path,
//                                     overLoads: overLoads
//                                 })
// ​
//                                 if (buyTx.sucess == true) {
// ​
//                                     //get confrimation receipt before approving 
//                                     const receipt = await this._provider.getTransactionReceipt(buyTx.data)
// ​
//                                     if (receipt && receipt.status == 1) {
// ​
// ​
//                                         overLoads["nonce"] += 1
// ​
//                                         //approving the tokens
//                                         await SwapsWrapper.approve({
//                                             tokenAddress: tokenToBuy,
//                                             overLoads: overLoads
//                                         })
// ​
// ​
//                                         console.log("WAITING FOR SELLING")
//                                     }
// ​
//                                 }
//                             }
// ​
// ​
//                         }
​
​
                    }
​
                }
​
​
            } catch (error) {
                console.log(`Error, ${error}`);
            }
​
        }
​
    }
​
}
​
​
export const mempoolWrapper = new Mempool();