const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const CryptoUtil = require('../util/cryptoUtil');

class Transaction {
  constructor(senderWallet, recipient, amount) {
    this.id = uuidv4();
    this.outputs = this.createOutputs(senderWallet, recipient, amount);
    this.input = this.createInput(senderWallet);
  }

  createInput(senderWallet) {
    return {
      time: Date.now(),
      type: 'REGULAR',
      balance: senderWallet.calculateBalance(),
      address: senderWallet.address,
      signature: 'Unsigned', //Tx is signed by the wallet when initiating a tx from a wallet
    };
  }

  createOutputs(senderWallet, recipient, amount) {
    const outputs = {};
    outputs[recipient] = amount;
    outputs[senderWallet.address] = senderWallet.calculateBalance() - amount;
    return outputs;
  }

  updateTransaction(senderWallet, recipient, amount) {
    let recipientOutput = Object.keys(this.outputs).find(
      (key) => recipient === key
    );
    if (recipientOutput) {
      this.outputs[recipient] += amount;
      this.outputs[senderWallet.address] -= amount;
    } else {
      this.outputs[recipient] = amount;
      this.outputs[senderWallet.address] -= amount;
    }
    // Do I return this?
  }

  static verifyTx(tx) {
    // input amount equals output amounts
    const outputTotals = Object.values(tx.outputs).reduce((total, amount) => {
      return total + amount;
    }, 0);

    const validAmounts = outputTotals === tx.input.balance;

    //& signature is valid
    const signatureValid = CryptoUtil.verifySignature({
      publicKeyString: tx.input.address,
      data: Transaction.txHash(tx.outputs),
      signature: tx.input.signature,
    });

    return validAmounts && signatureValid;
  }

  static txHash(outputs) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(outputs))
      .digest('hex');

    return hash;
  }
}

module.exports = Transaction;
