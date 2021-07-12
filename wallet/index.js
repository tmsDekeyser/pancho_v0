const CryptoUtil = require('../util/cryptoUtil');
const { STARTING_BALANCE } = require('../config/config');

const Transaction = require('./transaction');
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
    tx.input.signature = this.sign(Transaction.txHash(tx.outputs));
    return tx;
  }

  calculateBalance() {
    //Calculates the balance of a wallet based on the blockchain and UTXO model
    //We do a reverse for loop to find the last tx as sender and store txs as recipients

    if (this.address === 'BLOCKCHAIN_BANK') {
      return STARTING_BALANCE;
    }
    let balance = STARTING_BALANCE;
    let txList = [];
    let lastTx = 0;
    let i = this.blockchain.chain.length - 1;

    //Check if blockchain has at least 1 block other than genesis
    //if not, return starting balance
    if (this.blockchain.chain.length > 1) {
      do {
        let block = this.blockchain.chain[i];

        block.data.filter((tx) => {
          if (tx.input.address === this.address) {
            lastTx = tx;
            //console.log('lastTx: ');
            //console.log(lastTx);
          }
          if (tx.outputs[this.address] && tx !== lastTx) {
            txList.push(tx);
            //break; // to avoid pushing the same transaction to the txList twice.
          }
        });
        i--;
      } while (lastTx == 0 && i > 0);

      if (lastTx) {
        const senderOutput = lastTx.outputs[this.address];
        let received = 0;
        txList.forEach((tx) => {
          received += tx.outputs[this.address];
        });

        balance = senderOutput + received;
      } else {
        let received = 0;

        if (txList !== []) {
          txList.forEach((tx) => {
            received += tx.outputs[this.address];
          });
        }

        balance += received;
      }
    }
    return balance;
  }

  static bankWallet(blockchain) {
    const bankWallet = new this({ priv: null, pub: null }, blockchain);
    bankWallet.address = 'BLOCKCHAIN_BANK';
    return bankWallet;
  }
}

module.exports = Wallet;
