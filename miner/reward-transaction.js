const { REWARD } = require('../config/config');
const Transaction = require('../wallet/transaction');

class RewardTx extends Transaction {
  constructor(senderWallet, recipient) {
    super(senderWallet, recipient, REWARD);
    this.correct();
    this.signRewardTX(senderWallet);
  }

  correct() {
    this.input.balance = REWARD;
    this.input.type = 'REWARD';
    delete this.outputs['BLOCKCHAIN_BANK'];
  }

  //No corrected update function is necessary as there is only one Reward Tx per block

  signRewardTX(senderWallet) {
    this.input.signature = senderWallet.sign(Transaction.txHash(this.outputs));
  }
}

module.exports = RewardTx;
