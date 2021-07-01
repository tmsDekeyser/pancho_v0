class Mempool {
  constructor() {
    this.transactions = [];
  }

  addOrUpdateTransaction(tx) {
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
}

module.exports = Mempool;
