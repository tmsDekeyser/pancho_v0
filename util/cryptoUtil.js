const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class CryptoUtil {
  static genKeyPair() {
    return ec.genKeyPair();
  }

  static reGenKeyPair({ priv, pub }) {
    return ec.keyPair({ priv, pub, privEnc: 'hex', pubEnc: 'hex' });
  }

  static keyFromPublic(publicKeyString) {
    return ec.keyFromPublic(publicKeyString, 'hex');
  }

  static verifySignature({ publicKeyString, data, signature }) {
    const key = this.keyFromPublic(publicKeyString);
    return key.verify(data, signature);
  }
}

module.exports = CryptoUtil;
