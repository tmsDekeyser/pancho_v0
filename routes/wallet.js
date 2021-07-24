//Checked after adding authentication
const express = require('express');
const router = express.Router();
const {
  getWalletInfoMain,
  getWalletInfoByAddress,
  getContactsMain,
  postContactsMain,
} = require('../controllers/walletController');

const { protect } = require('../middleware/auth');

//Routes

//Add error handler for all the :id methods

router.route('/wallet-info').get(protect, getWalletInfoMain);

router.route('/wallet-info/:address').get(getWalletInfoByAddress);

router
  .route('/contacts')
  .get(protect, getContactsMain)
  .post(protect, postContactsMain);

module.exports = router;
