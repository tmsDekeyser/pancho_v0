const {
  bc,
  wallet,
  mempool,
  p2pServer,
  miner,
  walletMap,
} = require('../local-copy');

const transactHelper = (wall, req) => {
  const { amount } = req.body;
  let { recipient } = req.body;
  recipient = wall.addressBook[recipient] || recipient;

  const tx = wall.createTransaction(recipient, amount, mempool);

  if (tx) {
    mempool.addOrUpdateTransaction(tx);
    p2pServer.broadcastTransaction(tx);
  }
};

const userWalletHelper = (req) => {
  const userID = req.params.id;
  return walletMap[userID];
};
//@description    Show Blockchain
//@Route          GET api/v0/p2p/blocks
//@Visibiity      Public
exports.getBlocks = (req, res, next) => {
  res.json(bc.chain);
};

//@description    Show Mempool
//@Route          GET api/v0/p2p/mempool
//@Visibiity      Public
exports.getMempool = (req, res, next) => {
  res.json(mempool.transactions);
};

//@description    Show Known addresses on blockchain
//@Route          GET api/v0/p2p/known-addresses
//@Visibiity      Public
exports.getKnownAddresses = (req, res, next) => {
  res.json(bc.knownAddresses());
};

//@description    Show Connected peers
//@Route          GET api/v0/p2p/peers
//@Visibiity      Private/public?
exports.getPeers = (req, res, next) => {
  res.json(p2pServer.peers);
};

//@description    Mine a block
//@Route          POST api/v0/p2p/mine
//@Visibiity      Private
exports.mineBlock = (req, res, next) => {
  miner.mine();
  res.redirect('/blocks');
};

//@description    Transact as main node
//@Route          GET api/v0/p2p/transact
//@Visibiity      Private
exports.postTransactionMain = (req, res, next) => {
  transactHelper(wallet, req);
  res.redirect('mempool');
};

//@description    Transact as client
//@Route          GET api/v0/p2p/transact/:id
//@Visibiity      Public
exports.postTransactionById = (req, res, next) => {
  transactHelper(userWalletHelper(req), req);
  res.redirect('http://localhost:3001/api/v0/p2p/mempool');
};
