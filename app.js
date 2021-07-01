const express = require('express');
const colors = require('colors');
//const morgan = require('morgan');
//const helmet = require('helmet');

const Blockchain = require('./blockchain');
const P2pServer = require('./p2pserver');
const Wallet = require('./wallet');
const Mempool = require('./wallet/mempool');
const Miner = require('./miner');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use(morgan, helmet);

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
  res.json({ address: wallet.address, balance: wallet.calculateBalance() });
});

app.get('/mempool', (req, res) => {
  res.json(mempool.transactions);
});

app.get('/valid-transactions', (req, res) => {
  res.json(miner.validTransactions());
});

app.post('/mine', (req, res) => {
  //add block locally and clear mempool locally
  bc.addMinedBlock(mempool.transactions);
  mempool.clearMempool();
  Blockchain.isValidChain(bc.chain); //only for testing purposes
  //p2pServer.syncChains();
  //send messages to peers to do the same
  p2pServer.broadcastChain();
  p2pServer.broadcastClearTransactions();
  //show (new) blockchain
  res.redirect('/blocks');
});

app.post('/transact', (req, res) => {
  const { recipient, amount } = req.body;
  const tx = wallet.createTransaction(recipient, amount, mempool);
  //console.log(tx.input.address);
  if (tx) {
    mempool.addOrUpdateTransaction(tx);
    p2pServer.broadcastTransaction(tx);
  }

  res.redirect('/mempool');
});

//listening to servers

app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`);
});

p2pServer.listen();
