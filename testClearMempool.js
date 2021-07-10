const Wallet = require('./wallet');
const Mempool = require('./wallet/mempool');
const Transaction = require('./wallet/transaction');

const wallet1 = new Wallet({ priv: null, pub: null }, { chain: [] });
const wallet2 = new Wallet({ priv: null, pub: null }, { chain: [] });

const mempool = new Mempool();
const tx1 = new Transaction(wallet1, wallet2.address, 21);
mempool.addOrUpdateTransaction(tx1);
const tx2 = new Transaction(wallet2, wallet1.address, 13);
mempool.addOrUpdateTransaction(tx2);

const idList = [tx1.id];
console.log('Pre clearing length: ' + mempool.transactions.length);
mempool.clearMempoolPartial(idList);
console.log('Post clearing length: ' + mempool.transactions.length);

console.log('Mempool: ' + mempool.transactions);
