const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class Transaction {
  constructor(senderWallet, recipient, amount) {
    this.id = uuidv4();
    this.outputs = this.createOutputs(senderWallet, recipient, amount);
    this.input = this.createInput(senderWallet);
  }

  createInput(senderWallet) {
    return {
      time: Date.now(),
      balance: senderWallet.calculateBalance(),
      address: senderWallet.address,
      signature: 'Unsigned',
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

  static txHash(outputs) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(outputs))
      .digest('hex');

    return hash;
  }
}

module.exports = Transaction;
