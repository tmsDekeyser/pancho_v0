//Checked after adding authentication
const { bc, wallet, mempool, p2pServer, miner } = require('../local-copy');
const Wallet = require('../wallet/index');
const asyncHandler = require('../middleware/async');

const transactHelper = (wall, req) => {
  const { amount, options } = req.body;
  let { recipient } = req.body;
  recipient = wall.addressBook[recipient] || recipient;

  const tx = wall.createTransaction(recipient, amount, options, mempool);

  if (tx) {
    mempool.addOrUpdateTransaction(tx);
    p2pServer.broadcastTransaction(tx);
  }
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
  res.json(mempool);
};

//@description    Show Known addresses on blockchain
//@Route          GET api/v0/p2p/known-addresses
//@Visibiity      Public
exports.getKnownAddresses = (req, res, next) => {
  res.json(bc.knownAddresses());
};

//@description    Show Connected peers
//@Route          GET api/v0/p2p/peers
//@Visibiity      Private + role === peer || admin
exports.getPeers = (req, res, next) => {
  res.json(p2pServer.peers);
};

//@description    Mine a block
//@Route          POST api/v0/p2p/mine
//@Visibiity      Private + role === admin
exports.mineBlock = (req, res, next) => {
  miner.mine();
  res.redirect('blocks');
};

//@description    Transact as main node
//@Route          POST api/v0/p2p/transact
//@Visibiity      Private
exports.postTransactionMain = asyncHandler(async (req, res, next) => {
  const priv = req.user.keys[0];
  const pub = req.user.keys[1];

  try {
    const userWallet = new Wallet({ priv, pub }, bc);
    transactHelper(userWallet, req);
    res.redirect('mempool');
  } catch (error) {
    next(error);
  }
});

//@description    Nominate user for badge
//@Route          POST api/v0/p2p/nominate
//@Visibiity      Private
exports.nominateMain = asyncHandler(async (req, res, next) => {
  const priv = req.user.keys[0];
  const pub = req.user.keys[1];

  const { badgeAddress, badgeRecipient, amount } = req.body;

  try {
    const userWallet = new Wallet({ priv, pub }, bc);
    const nomination = userWallet.nominate(
      badgeAddress,
      badgeRecipient,
      amount
    );

    mempool.addNomination(nomination);
    p2pServer.broadcastNomination(nomination);
    res.redirect('mempool');
  } catch (error) {
    next(error);
  }
});

//@description    Accept or reject nomination
//@Route          POST api/v0/p2p/nomination-decision
//@Visibiity      Private
exports.nominationDecision = asyncHandler(async (req, res, next) => {
  const priv = req.user.keys[0];
  const pub = req.user.keys[1];

  const { nomId, accept, amount } = req.body;

  const nomination = mempool.findNominationById(nomId);

  try {
    if (accept) {
      const userWallet = new Wallet({ priv, pub }, bc);
      const btx = userWallet.createBadgeTransaction(nomination, amount);

      mempool.addBadgeTransaction(btx);
      p2pServer.broadcastTransaction(btx);
    } else {
      mempool.removeNomination(nomination);
      p2pServer.broadcastRejection(nomId);
    }
    res.redirect('mempool');
  } catch (error) {
    next(error);
  }
});
