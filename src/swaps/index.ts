import { config } from "../helpers/config";
import { Helpers } from "../helpers/helpers";

export interface overLoads {
    gasLimit: number;
    nonce: number;
    gasPrice?: number;
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

    public async swapExactETHForTokensSupportingFeeOnTransferTokens(_params: { amountOutMin: number, bnbAmount: number, path: Array<string>, overLoads: overLoads }): Promise<any> {


        const { amountOutMin, bnbAmount, path, overLoads } = _params;

        try {

            const deadline = Math.floor(Date.now() / 1000) + (60 * 2);

            const contract = this.pancakeSwapContract();

            const tx = await contract.callStatic.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMin, path, config.PUBLIC_KEY, deadline, overLoads);

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

    public async approve(_params: { tokenAddress: string, overLoads: overLoads }): Promise<any> {

        const { tokenAddress, overLoads } = _params;

        try {

            const MAX_INT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

            const contract = await this.approveContract(tokenAddress);



            const tx = await contract.callStatic.approve(config.PANCAKESWAP_ROUTER, MAX_INT, overLoads);

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
    public async swapExactTokensForETHSupportingFeeOnTransferTokens(_params: { amountIn: number, amountOutMin: number, path: Array<string>, overLoads: overLoads }): Promise<any> {

        const { amountIn, amountOutMin, path, overLoads } = _params;

        try {

            const deadline = Math.floor(Date.now() / 1000) + (60 * 2);

            const contract = await this.pancakeSwapContract();

            const tx = await contract.callStatic.swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn, amountOutMin, path, config.PUBLIC_KEY, deadline, overLoads);

            console.log("**".repeat(20));
            console.log("******SELL TRANSACTION********", tx.hash)
            return { success: true, data: `${tx.hash}` };

        } catch (error) {
            console.log(`Error swapExactTokensForETHSupportingFeeOnTransferTokens`, error);
        }
    }

}

export const SwapsWrapper = new Swaps();
