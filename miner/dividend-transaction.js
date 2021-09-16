const { DIVIDEND } = require('../config/config');
const Transaction = require('../wallet/transaction');

class DividendTx extends Transaction {
  constructor(senderWallet, recipient, numberOfDividendRecipients) {
    super(senderWallet, recipient, DIVIDEND);
    this.correct(recipient, numberOfDividendRecipients);
    this.signDividendTx(senderWallet);
  }

  correct(recipient, numberOfDividendRecipients) {
    //Input = DIVIDEND $ numberOfRecipients, so that input = output amounts
    //This way the tx verification passes
    this.input.balance = DIVIDEND * numberOfDividendRecipients;
    this.input.type = 'DIVIDEND';
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

module.exports = DividendTx;
