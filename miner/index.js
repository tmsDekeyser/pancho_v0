const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const DividendTx = require('./dividend-transaction');
const RewardTx = require('./reward-transaction');

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
    const rewardTx = new RewardTx(
      Wallet.bankWallet(this.blockchain),
      this.wallet.address
    );
    validTxs.push(rewardTx);

    if (Miner.numberOfDividendRecipients(this.blockchain) > 0) {
      const dividendTx = new DividendTx(
        Wallet.bankWallet(this.blockchain),
        this.wallet.address,
        Miner.numberOfDividendRecipients(this.blockchain)
      );

      Object.keys(this.blockchain.knownAddresses()).forEach((recipient) => {
        dividendTx.update(Wallet.bankWallet(this.blockchain), recipient);
      });
      validTxs.push(dividendTx);
    }

    // mine block, clear mempool and broadcast
    this.blockchain.addMinedBlock(validTxs);
    this.mempool.clearMempool();
    this.p2pServer.broadcastChain();
    this.p2pServer.broadcastClearTransactions();
  }

  validTransactions() {
    return this.mempool.transactions.filter((tx) => {
      return Transaction.verifyTx(tx);
    });
  }

  static numberOfDividendRecipients(blockchain) {
    const knownAddresses = blockchain.knownAddresses();
    return Object.keys(knownAddresses).length;
  }
}

module.exports = Miner;
