const Wallet = require('./wallet/index');
const Transaction = require('./wallet/transaction');

const wallet = new Wallet({ priv: null, pub: null });
console.log(wallet.toString());

const tx = new Transaction(wallet, 'foo', 3);
console.log(JSON.stringify(tx));

const signature = wallet.sign(Transaction.txHash(tx.outputs));
console.log(signature);
console.log(
  wallet.verifySignature({
    publicKeyString: wallet.address,
    data: Transaction.txHash(tx.outputs),
    signature,
  })
);
