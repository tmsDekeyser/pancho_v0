require('colors');
const Block = require('./block');
const Blockchain = require('./blockchain');

console.log('This is the devTest file'.magenta);

const block = new Block({
  index: 22,
  timestamp: 900000,
  lastHash: 'hashaa',
  hash: 'hola',
  data: 'random block data',
});

const bc = new Blockchain();

console.log('Block: ' + JSON.stringify(block));
