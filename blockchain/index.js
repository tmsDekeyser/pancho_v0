const Block = require('./block');
require('colors');

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
    this.chain.push(newBlock);
    return this.chain;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      console.log('Genesis block does not match'.red);
      console.log(chain);
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
      return;
    }
    this.chain = newChainArray;
  }
}

module.exports = Blockchain;
