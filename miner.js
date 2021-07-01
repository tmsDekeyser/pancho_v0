const Transaction = require('./wallet/transaction');

class Miner {
  constructor({ blockchain, wallet, mempool, p2pServer }) {
    this.blockchain = blockchain;
    this.wallet = wallet;
    this.mempool = mempool;
    this.p2pServer = p2pServer;
  }

  mine() {
    //find valid transactions
    const validTxs = this.validTransactions();
    //add reward and dividend Transaction

    // mine block, clear mempool and broadcast
    this.blockchain.addMinedBlock(validTxs);
    this.mempool.clearMempool();
    this.p2pServer.broadcastChain();
    this.p2pServer.broadcastClearTransactions();
  }

  validTransactions() {
    return this.mempool.transactions.filter((tx) => {
      // input amount equals output amounts
      const outputTotals = Object.values(tx.outputs).reduce((total, amount) => {
        return total + amount;
      }, 0);
      const validAmounts = outputTotals === tx.input.balance;
      //& signature is valid
      const signatureValid = this.wallet.verifySignature({
        publicKeyString: tx.input.address,
        data: Transaction.txHash(tx.outputs),
        signature: tx.input.signature,
      });

      return validAmounts && signatureValid;
    });
  }
}

module.exports = Miner;
