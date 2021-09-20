const { STARTING_BALANCE } = require('../config/config');

class BlockExplorer {
  static userTransactions(blockchain, address) {
    const txList = [];

    blockchain.chain.forEach((block) => {
      if (block.index !== 0) {
        block.data.forEach((tx) => {
          const condition1 = tx.input.address !== 'BLOCKCHAIN_BANK';
          const condition2 = tx.input.address === address;

          //This conidition should still capture all Regular and Badge Transactions.
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

        block.data.forEach((tx) => {
          if (tx.input.type === 'REGULAR' && tx.input.address === address) {
            lastTx = tx;
            //console.log('lastTx: ');
            //console.log(lastTx);
          }
          if (
            tx.input.type !== 'BADGE' &&
            tx.outputs[address] &&
            tx !== lastTx
          ) {
            txList.push(tx);
            //we cannot have two regular transactions as sender from same address
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

    const regTxList = txList.filter((tx) => tx.input.type === 'REGULAR');
    const badgeTxList = txList.filter((tx) => tx.input.type === 'BADGE');

    const regFlow = regTxList.reduce((totalFlow, tx) => {
      if (tx.input.address === address) {
        return totalFlow + (tx.input.balance - tx.outputs[address]);
      } else {
        return totalFlow + tx.outputs[address];
      }
    }, 0);

    const badgeFlow = badgeTxList.reduce((totalFlow, tx) => {
      return totalFlow + tx.outputs[address];
    }, 0);

    return regFlow - badgeFlow;
  }

  static allBadges(blockchain) {
    return Object.values(blockchain.chain[0].data);
  }

  static badgeList(blockchain, address) {
    const txList = this.userTransactions(blockchain, address);

    const badgeTxList = txList.filter(
      (tx) => tx.input.type === 'BADGE' && tx.input.address === address
    );

    const badgeList = [];
    BlockExplorer.allBadges(blockchain).forEach((badgeAddress) => {
      const badgeFlow = badgeTxList.reduce((totalFlow, btx) => {
        if (btx.nomination.data.badge.badgeAddress === badgeAddress) {
          const totalOutputs = Object.values(btx.outputs).reduce(
            (total, val) => {
              return total + val;
            },
            0
          );

          return totalFlow + totalOutputs;
        } else {
          return totalFlow;
        }
      }, 0);

      badgeList.push({ badgeAddress, amount: badgeFlow });
    });

    return badgeList;
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
