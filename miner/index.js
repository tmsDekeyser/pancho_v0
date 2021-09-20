const fs = require('fs');

const Transaction = require('../wallet/transaction');
const { BadgeTransaction } = require('../wallet/badge-transaction');
const Wallet = require('../wallet');
const DividendTx = require('./dividend-transaction');
const RewardTx = require('./reward-transaction');
const BlockExplorer = require('../blockchain/block-explorer');

class Miner {
  constructor({ blockchain, wallet, mempool, p2pServer }) {
    this.blockchain = blockchain;
    this.wallet = wallet;
    this.mempool = mempool;
    this.p2pServer = p2pServer;
  }

  mine() {
    //find valid transactions
    const validRtxs = this.validTransactions();
    const validBtxs = this.validBadgeTransactions();

    const validTxs = validRtxs.concat(validBtxs);

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

      Object.keys(BlockExplorer.knownAddresses(this.blockchain)).forEach(
        (recipient) => {
          dividendTx.update(Wallet.bankWallet(this.blockchain), recipient);
        }
      );
      validTxs.push(dividendTx);
    }

    // mine block, clear mempool and broadcast
    this.blockchain.addMinedBlock(validTxs);
    this.mempool.clearMempool();
    this.p2pServer.broadcastChain();
    this.p2pServer.broadcastClearTransactions();

    fs.writeFile(
      './local/blockchainJSON.txt',
      JSON.stringify(this.blockchain),
      (err) => {
        if (err) throw err;
        //console.log('Writing blockchain to local file from Miner');
      }
    );
  }

  validTransactions() {
    return this.mempool.transactions.filter((tx) => {
      return Transaction.verifyTx(tx);
    });
  }

  validBadgeTransactions() {
    return this.mempool.badgeTransactions.filter((btx) => {
      return BadgeTransaction.verifyBtx(btx, this.blockchain);
    });
  }

  static numberOfDividendRecipients(blockchain) {
    const knownAddresses = BlockExplorer.knownAddresses(blockchain);
    return Object.keys(knownAddresses).length;
  }
}

module.exports = Miner;
