class Block {
  constructor({ index, timestamp, lastHash, hash, data }) {
    this.index = index;
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
  }

  static genesis() {
    return new this({
      index: 0,
      timestamp: Date.now(),
      lasHash: 'none',
      hash: '0xplaceholder',
      data: 'Genesis data',
    });
  }
}

module.exports = Block;
