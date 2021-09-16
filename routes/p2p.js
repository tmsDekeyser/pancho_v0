//Checked after adding authentication
const express = require('express');
const router = express.Router();
const {
  getBlocks,
  getMempool,
  getKnownAddresses,
  getPeers,
  mineBlock,
  postTransactionMain,
  nominateMain,
} = require('../controllers/p2pController');

const { protect, authorize } = require('../middleware/auth');

router.route('/blocks').get(getBlocks);

router.route('/mempool').get(getMempool);

router.route('/known-addresses').get(getKnownAddresses);

router.route('/peers').get(protect, authorize('peer', 'admin'), getPeers);

router.route('/mine').post(protect, authorize('peer', 'admin'), mineBlock);

router.route('/transact').post(protect, postTransactionMain);

router.route('/nominate').post(protect, nominateMain);

module.exports = router;
