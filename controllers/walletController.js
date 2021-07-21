const { bc, wallet, mempool, p2pServer, walletMap } = require('../local-copy');

const Wallet = require('../wallet/');
const BlockExplorer = require('../blockchain/block-explorer');

//helper functions

const walletInfoHelper = (wall) => {
  return {
    address: wall.address,
    balance: wall.calculateBalance(),
    flow: BlockExplorer.calculateFlow(bc, wall.address),
  };
};

const userWalletHelper = (req) => {
  const userID = req.params.id;
  return walletMap[userID];
};

exports.getWalletInfoMain = (req, res, next) => {
  res.json(walletInfoHelper(wallet));
};

exports.getWalletInfoById = (req, res, next) => {
  res.json(walletInfoHelper(userWalletHelper(req)));
};

exports.getWalletMap = (req, res, next) => {
  res.json(walletMap);
};

exports.getContactsMain = (req, res, next) => {
  res.json(wallet.addressBook);
};

exports.postContactsMain = (req, res, next) => {
  const { address, alias } = req.body;

  wallet.addressBook[alias] = address;

  res.redirect('contacts');
};

exports.getContactsById = (req, res, next) => {
  //add error when user ID does not exist
  res.json(userWalletHelper(req) ? userWalletHelper(req).addressBook : {});
};

exports.postContactsById = (req, res, next) => {
  const { address, alias } = req.body;
  if (userWalletHelper(req)) {
    userWalletHelper(req).addressBook[alias] = address;
  }

  res.redirect(`${req.params.id}`);
};

exports.postRegister = (req, res, next) => {
  const userID = req.params.id;
  //add option to load keys
  const userWallet = new Wallet({ priv: null }, bc);
  walletMap[userID] = userWallet;

  res.json(walletMap);
};
