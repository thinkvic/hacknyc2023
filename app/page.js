
import styles from './page.module.css'
import { createAlchemyWeb3 } from "@alch/alchemy-web3";

export async function getDataAndCalcAverage() {

  const web3 = createAlchemyWeb3(process.env.ALCHEMY_URL);
  const BLOCKCOUNT = 10;

  /*** getFeeHistory Params 
  newestBlock : (string) 
  - The highest number block of the requested range in hexadecimal format or tags. The supported tag values include earliest for the earliest/genesis block, latest for the latest mined block, pending for the pending state/transactions, safe for the most recent secure block, and finalized for the most recent secure block accepted by more than 2/3 of validators. safe and finalized are only supported on Ethereum, Gnosis, Arbitrum, Arbitrum Nova, and Avalanche C-chain
  ***/

  /***Return
  reward string[][]
  - An array of effective priority fees per gas data points from a single block. All zeroes are returned if the block is empty
  baseFeePerGas string[]
  - An array of block base fees per gas. This includes the next block after the newest of the returned range, because this value can be derived from the newest block. Zeroes are returned for pre-EIP-1559 blocks
  oldestBlock number
  -The lowest number block of the returned range encoded in hexadecimal format
  ***/


  const { baseFeePerGas, reward, oldestBlock } = await web3.eth.getFeeHistory(
    BLOCKCOUNT,
    "latest",
    [25, 50, 75]
  );

  const oldestBlockInNumber = Number(oldestBlock)

  // turn array of array into array of objects with keys
  const gasFeeArray = reward.map((block, i) => {
    const blockBaseFee = Number(baseFeePerGas[i]);
    const blockNumber = oldestBlockInNumber + i;
    const priorityFeePerGasInNumber = block.map((x) => Number(x));

    return {
      blockNumber: blockNumber,
      low: blockBaseFee + priorityFeePerGasInNumber[0],
      medium: blockBaseFee + priorityFeePerGasInNumber[1],
      high: blockBaseFee + priorityFeePerGasInNumber[2],
    };
  });

  const calculateAverage = (arr) => {
    const sum = arr.reduce((a, v) => a + v)
    return Math.round(sum / arr.length)
  }

  const currentBlock = await web3.eth.getBlock("pending");
  const currentBaseFeePerGas = Number(currentBlock.baseFeePerGas)
  const lowAverage = calculateAverage(gasFeeArray.map(block => block.low));
  const midAverage = calculateAverage(gasFeeArray.map(block => block.medium));
  const highAverage = calculateAverage(gasFeeArray.map(block => block.high));

  return {
    low: lowAverage + currentBaseFeePerGas,
    medium: midAverage + currentBaseFeePerGas,
    high: highAverage + currentBaseFeePerGas
  };
}


// This is an async Server Component
export default async function Page() {

  const { low, medium, high } = await getDataAndCalcAverage();
  const giga = 1000000000;
  const lowInGwei = (low / giga).toFixed(2);
  const mediumInGwei = (medium / giga).toFixed(2);
  const highInGwei = (high / giga).toFixed(2);


  return (
    <div className={styles.container}>
        <h2>Average gas fee for ETH Mainnet (Gwei)</h2>
        <br/>
        <div>
          <p>High Priority: {lowInGwei} Gwei</p>
          <p>Medium Priority: {mediumInGwei} Gwei</p>
          <p>Low Priority: {highInGwei} Gwei</p>
        </div>
    </div>)
}


