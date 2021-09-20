class Mempool {
  constructor() {
    this.transactions = []; //could be a map (object) for lookup optimization
    this.nominations = [];
    this.badgeTransactions = [];
  }

  partialClearingHelper(array, idList) {
    array = array.filter((tx) => {
      let bool = true;

      idList.forEach((id) => {
        bool = bool && !(tx.id === id);
      });

      return bool;
    });
  }

  addOrUpdateTransaction(tx) {
    let prevTxWithId = this.findTransaction(tx.id);

    if (prevTxWithId) {
      this.transactions[this.transactions.indexOf(prevTxWithId)] = tx;
    } else {
      this.transactions.push(tx);
    }
  }

  //Find tx based on ID
  findTransaction(id) {
    return this.transactions.find((tx) => tx.id === id);
  }

  //Find tx based on address
  existingTransaction(address) {
    return this.transactions.find((tx) => tx.input.address === address);
  }

  clearMempool() {
    console.log('clearing transactions');
    this.transactions = [];
    this.badgeTransactions = [];
  }

  //When not all txs in mempool are added to blocks (not currently used)
  clearMempoolPartial(idList) {
    console.log('clearing transaction that are added to new block');
    this.transactions = this.partialClearingHelper(this.transactions, idList);
    this.badgeTransactions = this.partialClearingHelper(
      this.badgeTransactions,
      idList
    );
  }

  addNomination(nom) {
    this.nominations.push(nom);
  }

  removeNomination(nomId) {
    this.nominations = this.nominations.filter((nom) => nom.id !== nomId);
  }

  addBadgeTransaction(btx) {
    this.badgeTransactions.push(btx);
  }

  findNominationById(nomId) {
    const found = this.nominations.find((nom) => nom.id === nomId);
    console.log(found);
    return found;
  }
}

module.exports = Mempool;
