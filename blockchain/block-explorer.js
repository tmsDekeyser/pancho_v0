const { STARTING_BALANCE } = require('../config/config');

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

  static calculateBalance(blockchain, address) {
    //Calculates the balance of a wallet based on the blockchain and UTXO model
    //We do a reverse for loop to find the last tx as sender and store txs as recipients

    if (address === 'BLOCKCHAIN_BANK') {
      return STARTING_BALANCE;
    }
    let balance = STARTING_BALANCE;
    let txList = [];
    let lastTx = 0;
    let i = blockchain.chain.length - 1;

    //Check if blockchain has at least 1 block other than genesis
    //if not, return starting balance
    if (blockchain.chain.length > 1) {
      do {
        let block = blockchain.chain[i];

        block.data.filter((tx) => {
          if (tx.input.address === address) {
            lastTx = tx;
            //console.log('lastTx: ');
            //console.log(lastTx);
          }
          if (tx.outputs[address] && tx !== lastTx) {
            txList.push(tx);
            //break; // to avoid pushing the same transaction to the txList twice.
          }
        });
        i--;
      } while (lastTx == 0 && i > 0);

      if (lastTx) {
        const senderOutput = lastTx.outputs[address];
        let received = 0;
        txList.forEach((tx) => {
          received += tx.outputs[address];
        });

        balance = senderOutput + received;
      } else {
        let received = 0;

        if (txList !== []) {
          txList.forEach((tx) => {
            received += tx.outputs[address];
          });
        }

        balance += received;
      }
    }
    return balance;
  }

  static calculateFlow(blockchain, address) {
    //TODO: update for badges functionality
    const txList = this.userTransactions(blockchain, address);

    return txList.reduce((totalFlow, tx) => {
      if (tx.input.address === address) {
        return totalFlow + (tx.input.balance - tx.outputs[address]);
      } else {
        return totalFlow + tx.outputs[address];
      }
    }, 0);
  }

  static knownAddresses(blockchain) {
    //Runs through the blockchain and stores all addresses
    //Necessary to hand out dividends to al users
    const knownAddresses = {};
    if (blockchain.chain.length < 2) {
      return knownAddresses;
    }
    for (let i = 1; i < blockchain.chain.length; i++) {
      let block = blockchain.chain[i];
      block.data.forEach((tx) => {
        Object.keys(tx.outputs).forEach((address) => {
          if (!knownAddresses[address]) {
            knownAddresses[address] = address;
          }
        });
      });
    }
    return knownAddresses;
  }
}

module.exports = BlockExplorer;
