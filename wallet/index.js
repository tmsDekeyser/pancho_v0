const EC = require('elliptic').ec;
const STARTING_BALANCE = 100;

const Transaction = require('./transaction');
const Mempool = require('./mempool'); // Do I need this?

const ec = new EC('secp256k1');

class Wallet {
  constructor({ priv, pub }, blockchain) {
    this.keyPair =
      priv && pub ? this.reGenKeyPair({ priv, pub }) : this.genKeyPair();
    //this.keyPair = this.genKeyPair();
    this.address = this.keyPair.getPublic().encode('hex');
    this.blockchain = blockchain;
    this.balance = this.calculateBalance();
  }

  toString() {
    return `Wallet -
        Address (public key): ${this.address.toString()},
        Balance: ${this.balance.toString()}`;
  }

  genKeyPair() {
    return ec.genKeyPair();
  }

  reGenKeyPair({ priv, pub }) {
    return ec.keyPair({ priv, pub, privEnc: 'hex', pubEnc: 'hex' });
  }

  keyFromPublic(publicKeyString) {
    return ec.keyFromPublic(publicKeyString, 'hex');
  }

  sign(dataHash) {
    return this.keyPair.sign(dataHash);
  }

  createTransaction(recipient, amount, mempool) {
    // Check balance, verify if enough
    const senderBalanceOnChain = this.calculateBalance();

    let tx = mempool.existingTransaction(this.address);

    if (tx) {
      if (senderBalanceOnChain - tx.outputs[this.address < amount]) {
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

  verifySignature({ publicKeyString, data, signature }) {
    const key = this.keyFromPublic(publicKeyString);
    return key.verify(data, signature);
  }

  calculateBalance() {
    let balance = STARTING_BALANCE;
    let txList = [];
    let lastTx = 0;
    let i = this.blockchain.chain.length - 1;

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
}

module.exports = Wallet;
