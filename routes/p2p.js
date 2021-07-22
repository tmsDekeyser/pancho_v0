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

const { protect, authorize } = require('../middleware/auth');

router.route('/blocks').get(getBlocks);

router.route('/mempool').get(getMempool);

router.route('/known-addresses').get(getKnownAddresses);

router.route('/peers').get(protect, authorize('peer', 'admin'), getPeers);

router.route('/mine').post(protect, authorize('peer', 'admin'), mineBlock);

router
  .route('/transact')
  .post(protect, authorize('peer', 'admin'), postTransactionMain);

router
  .route('/transact/:id')
  .post(protect, authorize('client'), postTransactionById);

module.exports = router;
