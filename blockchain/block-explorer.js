class BlockExplorer {
  static userTransactions(blockchain, address) {
    const txList = [];

    blockchain.chain.forEach((block) => {
      if (block.index !== 0) {
        block.data.forEach((tx) => {
          const condition1 = tx.input.address !== 'BLOCKCHAIN_BANK';
          const condition2 = tx.input.address === address;

          if (condition1 && (condition2 || tx.outputs[address])) {
            txList.push(tx);
          }
        });
      }
    });
    return txList;
  }

  static calculateFlow(blockchain, address) {
    const txList = this.userTransactions(blockchain, address);

    return txList.reduce((totalFlow, tx) => {
      if (tx.input.address === address) {
        return totalFlow + (tx.input.balance - tx.outputs[address]);
      } else {
        return totalFlow + tx.outputs[address];
      }
    }, 0);
  }
}

module.exports = BlockExplorer;
