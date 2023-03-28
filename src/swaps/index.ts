import { BigNumber, utils } from "ethers";
import { config } from "../helpers/config";
import { Helpers, HelpersWrapper } from "../helpers/helpers";

export interface overLoads {
    gasLimit: number;
    nonce: number;
    gasPrice?: number;
    value?: any;
}

class Swaps extends Helpers {
    

    constructor() {
        super();
    }

    /**
     * 
     * @param _params the params required to swap ETH for tokens
     * @returns true if successful and a  transaction hash
     */

    public async swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMin: number, bnbAmount: any, path: Array<string>, nonce: any  ) {



        const value =  utils.parseUnits(bnbAmount.toString(), 18)

        console.log("VALUE", value)


        try {

            const deadline = Math.floor(Date.now() / 1000) + (60 * 2);

            const contract = this.pancakeSwapContract();

            const tx = await contract.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMin, path, config.PUBLIC_KEY, deadline, {
                nonce,
                value,
                //  gasLimit,
                // gasPrice,
                
            });

            console.log("**".repeat(20));
            console.log("******BUY TRANSACTION**********", tx.hash)
            return { success: true, data: `${tx.hash}` };

        } catch (error) {
            console.log(`Error swapExactETHForTokensSupportingFeeOnTransferTokens`, error);
        }

    }

    

    /**
     * 
     * @param _params  required to approve the token for the pancakeSwap contract
     * @returns  success true and transaction hash
     */

    public async approve( tokenAddress: string, nonce: any) {


        try {

            const MAX_INT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

            const contract = await this.approveContract(tokenAddress);



            const tx = await contract.approve(config.PANCAKESWAP_ROUTER, MAX_INT, {nonce});

            console.log("**".repeat(20));
            console.log("******APPROVE TRANSACTION********", tx.hash)
            return { success: true, data: `${tx.hash}` };

        } catch (error) {
            console.log(`Error approve`, error);
        }

    
    }

    /**
     * 
     * @param _params required to swap back tokens for ETH
     * @returns success true and transaction hash
     */
    public async swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn: any, amountOutMin: any, path: Array<string> , nonce: any){


        try {

            const deadline = Math.floor(Date.now() / 1000) + (60 * 2);

            const contract = await this.pancakeSwapContract();

            const tx = await contract.swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn, amountOutMin, path, config.PUBLIC_KEY, deadline, {nonce});

            console.log("**".repeat(20));
            console.log("******SELL TRANSACTION********", tx.hash)
            return { success: true, data: `${tx.hash}` };

        } catch (error) {
            console.log(`Error swapExactTokensForETHSupportingFeeOnTransferTokens`, error);
        }
    }

}

export const SwapsWrapper = new Swaps();
