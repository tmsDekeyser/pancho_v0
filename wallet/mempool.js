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

  clearMempoolPartial(idList) {
    this.transactions = this.transactions.filter((tx) => {
      let bool = true;

      idList.forEach((id) => {
        bool = bool && !(tx.id === id);
        //console.log(`Tx ID: ${tx.id}, ID: ${id}, bool: ${bool}`);
      });

      return bool;
    });
  }
}

module.exports = Mempool;
