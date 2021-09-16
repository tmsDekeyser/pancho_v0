const CryptoUtil = require('../util/cryptoUtil');

const Transaction = require('./transaction');
const Nomination = require('./nomiation');
const BlockExplorer = require('../blockchain/block-explorer');

class Wallet {
  constructor({ priv, pub }, blockchain) {
    this.keyPair =
      priv && pub
        ? CryptoUtil.reGenKeyPair({ priv, pub })
        : CryptoUtil.genKeyPair();
    this.address = this.keyPair.getPublic().encode('hex');
    this.blockchain = blockchain;
    this.balance = this.calculateBalance();
    this.addressBook = {};
  }

  toString() {
    return `Wallet -
        Address (public key): ${this.address.toString()},
        Balance: ${this.balance.toString()}
        Flow: ${BlockExplorer.calculateFlow(this.blockchain, this.address)}`;
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, mempool) {
    // Check balance, verify if enough
    const senderBalanceOnChain = this.calculateBalance();

    let tx = mempool.existingTransaction(this.address);

    if (tx) {
      if (senderBalanceOnChain - tx.outputs[this.address] < amount) {
        console.error('Not enough funds to complete transaction');
        return;
      } else {
        tx.updateTransaction(this, recipient, amount);
      }
    } else {
      if (senderBalanceOnChain < amount) {
        console.error('Not enough funds to complete transaction');
        return;
      } else {
        tx = new Transaction(this, recipient, amount);
      }
    }
    //Sign transaction
    tx.input.signature = this.sign(Transaction.txHash(tx.outputs));
    return tx;
  }

  nominate(badgeAddress, badgeRecipient, amount) {
    // How do we check the balance and how much do we allow to spend?
    const nomination = new Nomination(
      this,
      badgeAddress,
      badgeRecipient,
      amount
    );

    nomination.signature = this.sign(Nomination.nomHash(nomination.data));

    return nomination;
  }

  calculateBalance() {
    return BlockExplorer.calculateBalance(this.blockchain, this.address);
  }

  calculateFlow() {
    return BlockExplorer.calculateFlow(this.blockchain, this.address);
  }

  //Generates a (bank)wallet that hands out the mining rewards and dividend
  static bankWallet(blockchain) {
    const bankWallet = new this({ priv: null, pub: null }, blockchain);
    bankWallet.address = 'BLOCKCHAIN_BANK';
    return bankWallet;
  }
}

module.exports = Wallet;
