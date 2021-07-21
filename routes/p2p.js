const express = require('express');
const router = express.Router();
const {
  getBlocks,
  getMempool,
  getKnownAddresses,
  getPeers,
  mineBlock,
  postTransactionMain,
  postTransactionById,
} = require('../controllers/p2pController');

router.route('/blocks').get(getBlocks);

router.route('/mempool').get(getMempool);

router.route('/known-addresses').get(getKnownAddresses);

router.route('/peers').get(getPeers);

router.route('/mine').post(mineBlock);

router.route('/transact').post(postTransactionMain);

router.route('/transact/:id').post(postTransactionById);

module.exports = router;
