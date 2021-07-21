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

//Routes

//Add error handler for all the :id methods

router.route('/wallet-info').get(getWalletInfoMain);

router.route('/wallet-info/:id').get(getWalletInfoById);

router.route('/wallet-map').get(getWalletMap);

router.route('/contacts').get(getContactsMain).post(postContactsMain);

router.route('/contacts/:id').get(getContactsById).post(postContactsById);

router.route('/register/:id').post(postRegister);

module.exports = router;
