class Mempool {
  constructor() {
    this.transactions = [];
  }

  addOrUpdateTransaction(tx) {
    if (!Mempool.verifyTransaction(tx)) {
      console.error('Invalid Transaction');
      return;
    }

    let prevTxWithId = this.findTransaction(tx.id);

    if (prevTxWithId) {
      this.transactions[this.transactions.indexOf(prevTxWithId)] = tx;
    } else {
      this.transactions.push(tx);
    }
  }

  findTransaction(id) {
    return this.transactions.find((tx) => tx.id === id);
  }

  existingTransaction(address) {
    return this.transactions.find((tx) => tx.input.address === address);
  }

  clearMempool() {
    console.log('clearing transactions');
    this.transactions = [];
  }

  static verifyTransaction(tx) {
    return true;
  }
}

module.exports = Mempool;
