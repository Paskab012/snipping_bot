import axios from "axios";
import { Contract, ethers, providers, utils, Wallet } from "ethers";
import { config } from "./config";
import { PANCAKESWAP_ABI, RUG_CHECKER } from "./pancakeAbi";
import {PRIVATE_KEY} from './constant'


export class Helpers {
    private _provider: providers.JsonRpcProvider;
    signer: Wallet;
    constructor() {
        // initialize some variables i.e provider, signers
        this._provider = new providers.JsonRpcProvider(config.JSON_RPC);
        this.signer = new Wallet(PRIVATE_KEY, this._provider);
    }

    getNonce = async () => {
        try {
            return await this._provider.getTransactionCount(config.PUBLIC_KEY);

        } catch (error) {
            console.log('Could not fetch wallet Nonce', error);
        }
    }

    pancakeSwapContract = () => {
        return new Contract(config.PANCAKESWAP_ROUTER, PANCAKESWAP_ABI, this.signer);
    }
    approveContract = async (tokenAddress: string) => {
        return new Contract(tokenAddress,
            ["function approve(address _spender, uint256 _value) public returns (bool success)"],
            this.signer);
    }
    simulationContract = () => {
        return new Contract(
            config.RUGCHECKER_CONTRACT,
            RUG_CHECKER,
            this.signer);
    }
    getTokenBalance = async (tokenAddress: string, owner: string) => {
        try {

            const tokenContract = new Contract(tokenAddress, PANCAKESWAP_ABI, this._provider);
            return await tokenContract.balanceOf(owner);

        } catch (error) {
            console.log('Error fecthing Token Balance ', error);
        }
    }
    parseError = (error: any) => {
        let msg = '';
        try {
            error = JSON.parse(JSON.stringify(error));
            msg =
                error?.error?.reason ||
                error?.reason ||
                JSON.parse(error)?.error?.error?.response?.error?.message ||
                error?.response ||
                error?.message ||
                error;
        } catch (_error: any) {
            msg = error;
        }

        return msg;
    };

    calculateTax = async (_params: { swapRouter: string, swapPath: Array<string>, SwapAmountIn: any }):
        Promise<{ buyTax: any | undefined, sellTax: any | undefined }> => {

        const { swapRouter, swapPath, SwapAmountIn } = _params;
        try {
            const simulate = this.simulationContract();

            const response = await simulate.callStatic.screen(swapRouter, swapPath, SwapAmountIn, {
                gasLimit: 1000000,
            });
            const estimatedBuy = parseInt(response.estimatedBuy);
            const actualBuy = parseInt(response.actualBuy);
            const estimatedSell = parseInt(response.estimatedSell);
            const actualSell = parseInt(response.actualSell);
            const buyGas = parseInt(response.buyGas);
            const sellGas = parseInt(response.sellGas);

            const token = response.token;
            console.log('token===>', token)

            let buyTax, sellTax;

            console.log({'estimatedBuy': estimatedBuy, 
                            'ActualBuy':actualBuy, 
                            'Estimated Sell':estimatedSell, 
                            'Actual sell':actualSell, 
                            'Sold gas':sellGas, 
                            'Bought Gas':buyGas, 
                            'Token address':token });

            if (estimatedBuy > actualBuy) {

                buyTax = ((estimatedBuy - actualBuy) / ((estimatedBuy + actualBuy) / 2)) * 100;
            }

            if (estimatedSell > actualSell) {

                sellTax = ((estimatedSell - actualSell) / ((estimatedSell + actualSell) / 2)) * 100;

            }

            return { buyTax, sellTax };

        } catch (error) {
            error = this.parseError(error);
            console.log('Error calculating tax in helper file', error);
            return { buyTax: 0, sellTax: 0 };

        }
    }

    isVerified = async (contractAddress: string) => {
        try {
            const data = await axios.get(`https://api.bscscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${config.BSCSCAN_API_KEY}`);

            const { status, message } = data.data;

            if (status === '1') {

                console.log('Message for contract  verification: ', message);
                return true;
            } else {
                console.log('Token  contract  verification Failed: ', message);
            }

        } catch (error) {
            error = this.parseError(error);
            console.log('Error checking if token is verified', error);
        }

    }

    totalSupply = async (contractaddress: string) => {
        try {

            const data = await axios.get(`https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${contractaddress}&apikey=${config.BSCSCAN_API_KEY}`)

            const { result } = data.data;

            console.log('The TotalSupply of Tokens ', result);

            return utils.formatUnits(result)

        } catch (error) {
            error = this.parseError(error);
            console.log('Error fecthing Token Balance ', error);
        }
    }

    isContractOwnerBalance = async (contractaddress: string) => {

        try {

            const data = await axios.get(`https://api.bscscan.com/api?module=contract&action=getcontractcreation&contractaddresses=${contractaddress}&apikey=${config.BSCSCAN_API_KEY}`)

            const { result } = data.data;

            const { contractCreator } = result[0];

            console.log('Contract Deployer', contractCreator);

            //check for the balance the owner has in the contract

            const balance = await this.getTokenBalance(contractaddress, contractCreator);

            return utils.formatUnits(balance)

        } catch (error) {

            console.log('Error fecthing Token Balance ', error);
        }
    }
     checkAddress = (ctx: any, address: string) => {
    try {
        const tokenAddress = ethers.utils.getAddress(address);
        return tokenAddress;
      } catch (error) {
        let message = "Error  ";
        message += "\n\n Invalid token address provided ";
        message += `\n\n ${error}`;
        ctx.reply(message);
      }
    };


}

export const HelpersWrapper = new Helpers();




