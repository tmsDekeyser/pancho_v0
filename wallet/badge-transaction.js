const { v4: uuidv4 } = require('uuid');

class BadgeTransaction {
  badgeAddress;
  constructor(senderWallet, nomination, payment) {
    this.id = uuidv4();
    this.input = {
      time: Date.now(),
      type: 'BADGE',
      address: senderWallet.address,
      nominationId: nomination.id,
      nominationSig: nomination.signature,
      signature: 'Unsigned',
    };
    this.nomination = nomination;
    this.outputs = {};
    this.outputs[senderWallet.address] = payment;
    this.outputs[nomination.address] = nomination.badge.amount;
  }

  static verifyBTx(btx) {
    // check if both signatures are valid
    //check if they have enough flow
    // check if the badge exists
  }

  static txHash(outputs) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(outputs))
      .digest('hex');

    return hash;
  }
}

module.exports = { BadgeTransaction };
