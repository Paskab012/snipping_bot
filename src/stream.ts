import {INF_URL} from './helpers/constant'
import {ethers, providers} from 'ethers'

const streamingData = async () => {
    try {
        const provider = new ethers.providers.WebSocketProvider(INF_URL);

        provider.on('pending', async (txHash: string) => {
            try {

                let receipt = await provider.getTransaction(txHash);

                receipt?.hash && _process(receipt);

            } catch (error) {
                console.error(`Error`, error);
            }
        });


        const _process = async (receipt: providers.TransactionResponse) => {
            let {
                value: targetAmountInWei,
                to: router,
                gasPrice: targetGasPriceInWei,
                gasLimit: targetGasLimit,
                hash: targetHash,
                from: targetFrom,
            } = receipt

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
        }

    } catch (error) {
        console.log("Error streaming data: ", error)
    }
}


streamingData()