const express = require('express');
const router = express.Router();
const {
  getWalletInfoMain,
  getWalletInfoById,
  getWalletMap,
  getContactsMain,
  postContactsMain,
  getContactsById,
  postContactsById,
  postRegister,
} = require('../controllers/walletController');

const { protect, authorize } = require('../middleware/auth');

//Routes

//Add error handler for all the :id methods

router.route('/wallet-info').get(getWalletInfoMain);

router.route('/wallet-info/:id').get(getWalletInfoById);

router
  .route('/wallet-map')
  .get(protect, authorize('peer', 'admin'), getWalletMap);

router
  .route('/contacts')
  .get(protect, authorize('peer', 'admin'), getContactsMain)
  .post(protect, authorize('peer', 'admin'), postContactsMain);

router
  .route('/contacts/:id')
  .get(protect, getContactsById)
  .post(protect, postContactsById);

router.route('/register/:id').post(postRegister);

module.exports = router;
