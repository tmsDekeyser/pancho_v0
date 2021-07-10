const Transaction = require('./wallet/transaction');
const Wallet = require('./wallet');
const DIVIDEND = require('./config/config');
const REWARD = require('./config/config');

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

  static numberOfDividendRecipients(blockchain) {
    const knownAddresses = blockchain.knownAddresses();
    return Object.keys(knownAddresses).length;
  }
}

class DividendTx extends Transaction {
  constructor(senderWallet, recipient, numberOfDividendRecipients) {
    super(senderWallet, recipient, DIVIDEND);
    this.correct(recipient, numberOfDividendRecipients);
    this.signDividendTx(senderWallet);
  }

  correct(recipient, numberOfDividendRecipients) {
    this.input.balance = DIVIDEND * numberOfDividendRecipients;
    delete this.outputs[recipient];
    delete this.outputs['BLOCKCHAIN_BANK'];
  }

  update(senderwallet, recipient) {
    this.outputs[recipient] = DIVIDEND;
    this.signDividendTx(senderwallet);
  }

  signDividendTx(senderWallet) {
    this.input.signature = senderWallet.sign(Transaction.txHash(this.outputs));
  }
}

class RewardTx extends Transaction {
  constructor(senderWallet, recipient) {
    super(senderWallet, recipient, REWARD);
    this.correct();
    this.signRewardTX(senderWallet);
  }

  correct() {
    this.input.balance = REWARD;
    delete this.outputs['BLOCKCHAIN_BANK'];
  }

  signRewardTX(senderWallet) {
    this.input.signature = senderWallet.sign(Transaction.txHash(this.outputs));
  }
}

module.exports = Miner;
