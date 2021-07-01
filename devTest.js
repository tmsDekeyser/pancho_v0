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

bc.addMinedBlock('first real block');
bc.addBlock(block);

console.log('Block: ' + JSON.stringify(bc));
