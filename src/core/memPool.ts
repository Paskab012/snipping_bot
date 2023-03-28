import { constants, Contract, ethers, providers, utils, Wallet } from "ethers";
import { config } from "../helpers/config";
import { PANCAKESWAP_ABI } from "../helpers/pancakeAbi";
import { SwapsWrapper } from "../swaps";
import { sendNotification } from "../helpers/telegram";
import { HelpersWrapper } from "../helpers/helpers";
import { PRIVATE_KEY } from "../helpers/constant";

class Mempool {
  private _wsprovider: providers.WebSocketProvider;
  private _provider: providers.JsonRpcProvider;
  private _pancakeSwap: ethers.utils.Interface;
  private contract: Contract;
  constructor() {
    // initialize some variables i.e provider, signers, interface
    this._wsprovider = new providers.WebSocketProvider(config.WSS_URL);
    this._pancakeSwap = new ethers.utils.Interface(PANCAKESWAP_ABI);
    this._provider = new providers.JsonRpcProvider(config.JSON_RPC);
    this.contract = new Contract(
      config.PANCAKESWAP_ROUTER,
      PANCAKESWAP_ABI,
      new Wallet(PRIVATE_KEY, this._provider) //signer
    );
  }
  /**
   * Monitor mempool for transactions
   */
  public monitor = async () => {
    let message = `WELCOME TO NGENI SNIPPING BOT🎉🎉🎉`;
    await sendNotification(message);
    // mempool monitoring
    this._wsprovider.on("pending", async (txHash: string) => {
      try {
      // let txHash = "0x84dcd9d11f4d4307aa67aeebea3e2fa4c53e51231165bebe6b58b162e0249766"

        // console.log("TxHash", txHash)
        let receipt = await this._wsprovider.getTransaction(txHash);
        receipt.hash && this._process(receipt);
      } catch (error: any) {
        // console.error(`Error in the receipt=====>`, error);
        if (error.message.includes("unknown error")) {
          // Ignore this error and continue monitoring
          console.warn(`Invalid transaction hash: ${txHash}`);
        } else {
          console.error(`Error in the receipt=====>`, error);
        }
      }
    });
  };
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

    if (
      router &&
      config.SUPPORTED_ROUTER.some(
        (router) => router?.toLowerCase() === receipt.to?.toLowerCase()
      )
    ) {
      // console.log('Router to ===', router)
      let tokensToMonitor = config.TOKENS_TO_MONITOR.map((token: string) =>
        token.toLowerCase()
      );
      try {
        // decode transaction data
        const txData = this._pancakeSwap.parseTransaction({
          data: receipt.data,
        });
        //desctructure transaction  data to get methodeName
        let { name: targetMethodName, args: targetArgs } = txData;

        let { path } = targetArgs;

        let targetToToken = path;
        let gasPrice = utils.formatUnits(targetGasPriceInWei!.toString());

        //if the path is undefined stop execution and return
        // if (!path) return;
        console.info({
          targetMethodName,
          path,
          gasPrice,
          targetHash,
          targetFrom,
        });

        

        //preprare simulation data
        let SwapAmountIn = utils.parseEther("0.0001");
        let swapRouter = config.PANCAKESWAP_ROUTER;                               
        let swapPath = [config.WBNB_ADDRESS, targetToToken];
        //check if the token is a scam token or not [BuyTax, sellTax]
        //  let { buyTax, sellTax } = await HelpersWrapper.calculateTax({ swapRouter, swapPath, SwapAmountIn })

        // console.log("targetMethodName", targetMethodName)

        // console.log("Arguments", targetArgs)
        // console.log("Argument A", targetArgs[1])
        // console.log("Argument B", targetArgs[1])

        if (targetMethodName.startsWith("addLiquidity")) {
          let tokenToBuy;
          let tokenA = targetArgs.tokenA;
          let tokenB = targetArgs.tokenB;
          console.log("token A", tokenA, "Token B", tokenB);

          if (tokensToMonitor.includes(tokenA.toLowerCase())) {
            tokenToBuy = tokenA;
          } else if (tokensToMonitor.includes(tokenB.toLowerCase())) {
            tokenToBuy = tokenB;
          }
          if (tokenToBuy) {
            let message = `TOKEN TO CAPTURE All NOTIFICATIONS`;
            message += `captured a token ${tokenToBuy} its in our tokens to monitor list`;
            message += `proceeding to buy the token`;
            await sendNotification(message);

            //check if token is verified
            // const verifyToken = await HelpersWrapper.isVerified(tokenToBuy);

            //check if the token is a scam token or not [BuyTax, sellTax]
            //   let { buyTax, sellTax } = await HelpersWrapper.calculateTax({ swapRouter, swapPath, SwapAmountIn })

            // console.log("BUY TAX", buyTax, "SELL TAX", sellTax)

            //if (verifyToken) {
            //if (parseInt(buyTax) <= config.MINIMUM_BUY_TAX) {
            //TODO execute a buy order for the token

            const path = [config.WBNB_ADDRESS, tokenToBuy];

            const nonce = await HelpersWrapper.getNonce();

            let overLoads: any = {
              gasLimit: targetGasLimit,
              gasPrice: gasPrice,
              nonce: nonce,
            };

            console.log(overLoads)

            //console.log("BNBAMOUNT", config.BNB_BUY_AMOUNT);

            // let buyTx =
            //   await SwapsWrapper.swapExactETHForTokensSupportingFeeOnTransferTokens(
            //     0,
            //     config.BNB_BUY_AMOUNT,
            //     path,
            //     nonce,
            //   );

            const sellPath = [tokenToBuy, config.WBNB_ADDRESS]

            const amountIn = await HelpersWrapper.getTokenBalance(tokenToBuy, config.PUBLIC_KEY)

            console.log("TOKEN BALANCE", amountIn)

             await SwapsWrapper.swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn, 1, sellPath, nonce)


           // await SwapsWrapper.approve(tokenToBuy , nonce);


            // if (buyTx!.success == true) {
            //   //get confrimation receipt before approving
            //   const receipt = await this._provider.getTransactionReceipt(
            //     buyTx!.data
            //   );

            //   if (receipt && receipt.status == 1) {
            //     overLoads["nonce"] += 1;
            //     //approving the tokens
              
            //     console.log("WAITING FOR SELLING");
            //   }
            // }
            // }
            //}
          }
        } else if (targetMethodName.startsWith("addLiquidityETH")) {
          let tokenToBuy = targetArgs.token;
          if (tokenToBuy) {
            let message = `TOKEN CAPTURE NOTIFICATION`;
            message += `captured a token ${tokenToBuy} its in our tokens to monitor list`;
            message += `proceeding to buy the token`;
            await sendNotification(message);
            //check if token is verified
            const verifyToken = await HelpersWrapper.isVerified(tokenToBuy);
            //check if the token is a scam token or not [BuyTax, sellTax]
            // let { buyTax, sellTax } = await HelpersWrapper.calculateTax({ swapRouter, swapPath, SwapAmountIn })

            if (verifyToken) {
              //   if (
              //     parseInt(buyTax) <= config.MINIMUM_BUY_TAX &&
              //     parseInt(sellTax) <= config.MINIMUM_SELL_TAX
              //   ) {
              // execute a buy order for the token

              const path = [config.WBNB_ADDRESS, tokenToBuy];
              const nonce = await HelpersWrapper.getNonce();

              let overLoads: any = {
                gasLimit: targetGasLimit,
                gasPrice: gasPrice,
                nonce: nonce!,
              };

              let buyTx =
              await SwapsWrapper.swapExactETHForTokensSupportingFeeOnTransferTokens(
                0,
                config.BNB_BUY_AMOUNT,
                path,
                nonce
                
              );

              if (buyTx!.success == true) {
                //get confrimation receipt before approving
                const receipt = await this._provider.getTransactionReceipt(
                  buyTx!.data
                );

                if (receipt && receipt.status == 1) {
                  overLoads["nonce"] += 1;

                  //approving the tokens
                  await SwapsWrapper.approve(tokenToBuy , nonce); 

                  console.log("WAITING FOR SELLING");
                }
              }
            }
            //}
          }
        }
      } catch (error) {
        console.log(`Error, ${error}`);
      }
    }
  };
}

export const mempoolWrapper = new Mempool();
