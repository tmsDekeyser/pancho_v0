const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class Nomination {
  constructor(senderWallet, badgeAddress, badgeRecipient, amount) {
    this.id = uuidv4();
    this.data = {
      time: Date.now(),
      type: 'NOMINATION',
      badge: { badgeAddress, badgeRecipient, amount },
      address: senderWallet.address,
    };
    this.signature = 'Unsigned';
  }

  static nomHash(data) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    return hash;
  }
}

module.exports = Nomination;
