const express = require('express');
const colors = require('colors');

const Blockchain = require('./blockchain');
const P2pServer = require('./p2pserver');
const Wallet = require('./wallet');
const Mempool = require('./wallet/mempool');
const Miner = require('./miner/');
const BlockExplorer = require('./blockchain/block-explorer');

const connectDB = require('./config/db');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

connectDB();

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const bc = new Blockchain();
const wallet = new Wallet({ priv: null, pub: null }, bc);
const mempool = new Mempool();
const p2pServer = new P2pServer(bc, mempool);
const miner = new Miner({ blockchain: bc, mempool, p2pServer, wallet });

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the blockchain demo');
});

app.get('/blocks', (req, res) => {
  res.json(bc.chain);
});

app.get('/wallet-info', (req, res) => {
  res.json({
    address: wallet.address,
    balance: wallet.calculateBalance(),
    flow: BlockExplorer.calculateFlow(bc, wallet.address),
  });
});

app.get('/mempool', (req, res) => {
  res.json(mempool.transactions);
});

app.get('/valid-transactions', (req, res) => {
  res.json(miner.validTransactions());
});

app.get('/known-addresses', (req, res) => {
  res.json(bc.knownAddresses());
});

app.get('/contacts', (req, res) => {
  res.json(wallet.addressBook);
});

app.get('/peers', (req, res) => {
  res.json(p2pServer.peers);
});

app.post('/mine', (req, res) => {
  miner.mine();
  res.redirect('/blocks');
});

app.post('/transact', (req, res) => {
  const { amount } = req.body;
  let { recipient } = req.body;
  recipient = wallet.addressBook[recipient] || recipient;

  const tx = wallet.createTransaction(recipient, amount, mempool);

  if (tx) {
    mempool.addOrUpdateTransaction(tx);
    p2pServer.broadcastTransaction(tx);
  }

  res.redirect('/mempool');
});

app.post('/contacts', (req, res) => {
  const { address, alias } = req.body;

  wallet.addressBook[alias] = address;

  res.redirect('/contacts');
});

//listening to servers

app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`.yellow);
});

p2pServer.listen();
