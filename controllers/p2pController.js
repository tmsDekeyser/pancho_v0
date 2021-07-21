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

exports.getBlocks = (req, res, next) => {
  res.json(bc.chain);
};

exports.getMempool = (req, res, next) => {
  res.json(mempool.transactions);
};

exports.getKnownAddresses = (req, res, next) => {
  res.json(bc.knownAddresses());
};

exports.getPeers = (req, res, next) => {
  res.json(p2pServer.peers);
};

exports.mineBlock = (req, res, next) => {
  miner.mine();
  res.redirect('blocks');
};

exports.postTransactionMain = (req, res, next) => {
  transactHelper(wallet, req);
  res.redirect('mempool');
};

exports.postTransactionById = (req, res, next) => {
  transactHelper(userWalletHelper(req), req);
  res.redirect('http://localhost:3001/api/v0/p2p/mempool');
};
