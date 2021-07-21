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

//@description    Show Wallet-info main node
//@Route          GET api/v0/wallet/wallet-info
//@Visibiity      Public
exports.getWalletInfoMain = (req, res, next) => {
  res.json(walletInfoHelper(wallet));
};

//@description    Show wallet info client
//@Route          GET api/v0/wallet/wallet-info/:id
//@Visibiity      Public
exports.getWalletInfoById = (req, res, next) => {
  res.json(walletInfoHelper(userWalletHelper(req)));
};

//@description    Show all registered users
//@Route          GET api/v0/wallet/wallet-map
//@Visibiity      Private
exports.getWalletMap = (req, res, next) => {
  res.json(walletMap);
};

//@description    Show contacts as main node
//@Route          GET api/v0/wallet/contacts
//@Visibiity      Private
exports.getContactsMain = (req, res, next) => {
  res.json(wallet.addressBook);
};

//@description    Save contacts as main node
//@Route          POST api/v0/wallet/contacts
//@Visibiity      Private
exports.postContactsMain = (req, res, next) => {
  const { address, alias } = req.body;

  wallet.addressBook[alias] = address;

  res.redirect('contacts');
};

//@description    Show contacts as client
//@Route          GET api/v0/wallet/contacts/:id
//@Visibiity      Private
exports.getContactsById = (req, res, next) => {
  //add error when user ID does not exist
  res.json(userWalletHelper(req) ? userWalletHelper(req).addressBook : {});
};

//@description    Save alias as client
//@Route          POST api/v0/wallet/contacts/:id
//@Visibiity      Private
exports.postContactsById = (req, res, next) => {
  const { address, alias } = req.body;
  if (userWalletHelper(req)) {
    userWalletHelper(req).addressBook[alias] = address;
  }

  res.redirect(`${req.params.id}`);
};

//@description    Register a user
//@Route          POST api/v0/wallet/register/:id
//@Visibiity      Public
exports.postRegister = (req, res, next) => {
  const userID = req.params.id;
  //add option to load keys
  const userWallet = new Wallet({ priv: null }, bc);
  walletMap[userID] = userWallet;

  res.json(walletMap);
};
