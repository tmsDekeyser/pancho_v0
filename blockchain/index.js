const Block = require('./block');
require('colors');
const Transaction = require('../wallet/transaction');
const { BadgeTransaction } = require('../wallet/badge-transaction');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addMinedBlock(data) {
    this.chain.push(Block.mineBlock(this.getLatestBlock(), data));
    return this.chain;
  }

  addBlock(newBlock) {
    //TODO: add block validation
    //Redundant due to replaceChain() function
    this.chain.push(newBlock);
    return this.chain;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      console.log('Genesis block does not match'.red);
      //console.log(chain);
      return false;
    }
    for (let i = 1; i < chain.length; i++) {
      if (chain[i].lastHash !== chain[i - 1].hash) {
        console.log(
          'Blocks last hash value must equal the hash of the previous block'.red
        );
        return false;
      }
      const { index, timestamp, lastHash, nonce, hash, data } = chain[i];
      if (
        hash !== Block.blockHash({ index, timestamp, lastHash, nonce, data })
      ) {
        console.log(
          'Incorrect hash value'.red,
          hash,
          Block.blockHash({ index, timestamp, lastHash, nonce, data })
        );
        return false;
      }
    }
    console.log('Chain is valid.'.green);
    return true;
  }

  replaceChain(newChainArray) {
    if (
      !Blockchain.isValidChain(newChainArray) ||
      newChainArray.length <= this.chain.length
    ) {
      return 'Chain invalid, not replaced';
    }
    //also check the transactions in the blocks that are different
    // from the local version of the blockchain
    if (
      this.getLatestBlock().index !== 0 &&
      !this.checkTxs(
        newChainArray.slice(
          this.getLatestBlock().index + 1,
          newChainArray.length
        )
      )
    ) {
      return 'Chain invalid, not replaced';
    }

    this.chain = newChainArray;
  }

  checkTxs(subChain) {
    //console.log(subChain);
    subChain.forEach((block) => {
      block.data.forEach((tx) => {
        switch (tx.input.type) {
          case 'REGULAR':
            if (!Transaction.verifyTx(tx)) {
              return false;
            }
            break;
          case 'BADGE':
            if (!BadgeTransaction.verifyBtx(tx, this)) {
              return false;
            }
            break;
          case 'DIVIDEND':
            break;
          case 'REWARD':
            break;
          default:
            return false;
        }
      });
    });
    console.log('Transaction in new blocks are valid');
    return true;
  }

  // knownAddresses() {
  //   //Runs through the blockchain and stores all addresses
  //   //Necessary to hand out dividends to al users
  //   const knownAddresses = {};
  //   if (this.chain.length < 2) {
  //     return knownAddresses;
  //   }
  //   for (let i = 1; i < this.chain.length; i++) {
  //     let block = this.chain[i];
  //     block.data.forEach((tx) => {
  //       Object.keys(tx.outputs).forEach((address) => {
  //         if (!knownAddresses[address]) {
  //           knownAddresses[address] = address;
  //         }
  //       });
  //     });
  //   }
  //   return knownAddresses;
  // }
}

module.exports = Blockchain;
