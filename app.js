const express = require('express');
const colors = require('colors');

const Blockchain = require('./blockchain');
const P2pServer = require('./p2pserver');
const Wallet = require('./wallet');
const Mempool = require('./wallet/mempool');
const Miner = require('./miner/');
const BlockExplorer = require('./blockchain/block-explorer');

//MongoDB database to store user profiles (and keys in the demo, encrypted)
//const connectDB = require('./config/db');

//Express.js
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//connectDB();

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const bc = new Blockchain();
const wallet = new Wallet({ priv: null, pub: null }, bc);
const mempool = new Mempool();
const p2pServer = new P2pServer(bc, mempool);
const miner = new Miner({ blockchain: bc, mempool, p2pServer, wallet });

//stores wallets for SPV clients who do not run a full node
const walletMap = {};

//helper functions

const walletInfoHelper = (wall) => {
  return {
    address: wall.address,
    balance: wall.calculateBalance(),
    flow: BlockExplorer.calculateFlow(bc, wall.address),
  };
};

const transactHelper = (wall, req) => {
  const { amount } = req.body;
  let { recipient } = req.body;
  recipient = wall.addressBook[recipient] || recipient;

  const tx = wall.createTransaction(recipient, amount, mempool);

  if (tx) {
    mempool.addOrUpdateTransaction(tx);
    p2pServer.broadcastTransaction(tx);
  }
};

// Routes

//-------------
//GET methods
//-------------

app.get('/', (req, res) => {
  res.send('Welcome to the blockchain demo');
});

app.get('/blocks', (req, res) => {
  res.json(bc.chain);
});

app.get('/wallet-info', (req, res) => {
  res.json(walletInfoHelper(wallet));
});

app.get('/wallet-info/:id', (req, res) => {
  const userID = req.params.id;
  const userWallet = walletMap[userID];

  res.json(walletInfoHelper(userWallet));
});

app.get('/mempool', (req, res) => {
  res.json(mempool.transactions);
});

app.get('/known-addresses', (req, res) => {
  res.json(bc.knownAddresses());
});

app.get('/wallet-map', (req, res) => {
  res.json(walletMap);
});

app.get('/contacts', (req, res) => {
  res.json(wallet.addressBook);
});

app.get('/contacts/:id', (req, res) => {
  const userID = req.params.id;
  const userWallet = walletMap[userID];

  res.json(userWallet.addressBook);
});

app.get('/peers', (req, res) => {
  res.json(p2pServer.peers);
});
// ------------
//POST methods
// ------------

app.post('/mine', (req, res) => {
  miner.mine();
  res.redirect('/blocks');
});

app.post('/transact', (req, res) => {
  transactHelper(wallet, req);
  res.redirect('/mempool');
});

app.post('/transact/:id', (req, res) => {
  const userID = req.params.id;
  userWallet = walletMap[userID];

  transactHelper(userWallet, req);
  res.redirect('/mempool');
});

app.post('/register/:id', (req, res) => {
  const userID = req.params.id;
  //add option to load keys
  const userWallet = new Wallet({ priv: null }, bc);
  walletMap[userID] = userWallet;

  res.redirect('/wallet-map');
});

app.post('/contacts', (req, res) => {
  const { address, alias } = req.body;

  wallet.addressBook[alias] = address;

  res.redirect('/contacts');
});

app.post('/contacts/:id', (req, res) => {
  const { address, alias } = req.body;
  const userID = req.params.id;
  const userWallet = walletMap[userID];

  userWallet.addressBook[alias] = address;

  res.redirect(`/contacts/${userID}`);
});

//listening to servers

app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`.yellow);
});

p2pServer.listen();
