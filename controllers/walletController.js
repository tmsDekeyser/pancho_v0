//Checked after adding authentication
const { bc } = require('../local/local-copy');
const asyncHandler = require('../middleware/async');

const BlockExplorer = require('../blockchain/block-explorer');
const Wallet = require('../wallet/index');
const User = require('../models/User');

//helper functions

const walletInfoHelper = (address) => {
  return {
    address: address,
    balance: BlockExplorer.calculateBalance(bc, address),
    flow: BlockExplorer.calculateFlow(bc, address),
  };
};

//@description    Show Wallet-info main node
//@Route          GET api/v0/wallet/wallet-info
//@Visibiity      Private
exports.getWalletInfoMain = (req, res, next) => {
  res.json(walletInfoHelper(req.user.keys[1]));
};

//@description    Show wallet info client
//@Route          GET api/v0/wallet/wallet-info/:address
//@Visibiity      Public
exports.getWalletInfoByAddress = (req, res, next) => {
  res.json(walletInfoHelper(req.params.address));
};

//@description    Show contacts as main node
//@Route          GET api/v0/wallet/contacts
//@Visibiity      Private
exports.getContactsMain = (req, res, next) => {
  res.json(JSON.parse(req.user.addressBook));
};

//@description    Show user badges
//@Route          GET api/v0/wallet/badges/
//@Visibiity      Public
exports.getUserBadges = (req, res, next) => {
  const priv = req.user.keys[0];
  const pub = req.user.keys[1];

  try {
    const userWallet = new Wallet({ priv, pub }, bc);

    res.json(BlockExplorer.badgeList(bc, userWallet.address));
  } catch (error) {
    next(error);
  }
};

//@description    Save contacts as main node
//@Route          POST api/v0/wallet/contacts
//@Visibiity      Private
exports.postContactsMain = asyncHandler(async (req, res, next) => {
  const { address, alias } = req.body;
  if (!JSON.parse(req.user.addressBook)) {
    const addressBook = {};
  } else {
    addressBook = JSON.parse(req.user.addressBook);
  }

  addressBook[alias] = address;

  const user = await User.findByIdAndUpdate(req.user._id, {
    addressBook: JSON.stringify(addressBook),
  });

  res.redirect('contacts');
});
