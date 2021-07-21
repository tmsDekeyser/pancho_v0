const express = require('express');
const colors = require('colors');

const { p2pServer } = require('./local-copy');
//MongoDB database to store user profiles (and keys in the demo, encrypted)
const connectDB = require('./config/db');

//Route files
const walletRoutes = require('./routes/wallet');
const p2pRoutes = require('./routes/p2p');

//Express.js
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/v0/wallet', walletRoutes);
app.use('/api/v0/p2p', p2pRoutes);

connectDB();

const HTTP_PORT = process.env.HTTP_PORT || 3001;

app.get('/', (req, res) => {
  res.send('Welcome to the blockchain demo');
});

//listening to servers

app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`.yellow);
});

p2pServer.listen();
