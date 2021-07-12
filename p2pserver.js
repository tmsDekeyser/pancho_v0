const Websocket = require('ws');
const { IP_HOST, IP_PEER } = require('./config/config');

const P2P_PORT = process.env.P2P_PORT || 5001;
//const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const MESSAGE_TYPES = {
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  clearTransactions: 'CLEAR_TRANSACTIONS',
  address: 'ADDRESS',
  peers: 'PEERS',
};

class P2pServer {
  constructor(blockchain, mempool) {
    this.blockchain = blockchain;
    this.mempool = mempool;
    this.sockets = [];
    this.peers = P2P_PORT === 5001 ? [] : [`ws://${IP_HOST}:5001`];
  }

  listen() {
    console.log(this.peers);
    const server = new Websocket.Server({ port: P2P_PORT });
    server.on('connection', (socket) => this.connectSocket(socket));

    if (this.peers[0] === `ws://${IP_HOST}:5001`) {
      const socket = new Websocket(this.peers[0]);
      socket.on('open', () => this.connectSocketBootstrap(socket));
    }

    console.log(`Listening for peer connections on port ${P2P_PORT}`);
  }

  connectToPeers(peers) {
    peers.forEach((peer) => {
      try {
        const socket = new Websocket(peer);
        socket.on('open', () => this.connectSocket(socket));
      } catch (error) {
        console.log('error', error);
      }
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log('Socket connected');

    this.messageHandler(socket);

    this.sendChain(socket);
  }

  connectSocketBootstrap(socket) {
    this.connectSocket(socket);
    this.sendAddress(socket);
  }

  messageHandler(socket) {
    socket.on('message', (message) => {
      const data = JSON.parse(message);
      console.log('data:', data);
      switch (data.type) {
        case MESSAGE_TYPES.chain:
          this.blockchain.replaceChain(data.chain);
          break;
        case MESSAGE_TYPES.transaction:
          this.mempool.addOrUpdateTransaction(data.transaction);
          break;
        case MESSAGE_TYPES.clearTransactions:
          this.mempool.clearMempool();
          break;
        case MESSAGE_TYPES.address:
          if (!this.peers.find((peer) => peer === data.address)) {
            this.peers.push(data.address);
          }
          this.sockets.forEach((socket) => this.sendPeers(socket, this.peers));
          break;
        case MESSAGE_TYPES.peers:
          data.peers.forEach((peer) => {
            if (
              !this.peers.find((knownPeer) => knownPeer === peer) &&
              peer !== `ws://${IP_PEER}:${P2P_PORT}`
            ) {
              this.peers.push(peer);
            }
          });
          this.connectToPeers(data.peers);
          break;
      }
    });
  }
  //syncChains still necessary?
  syncChains() {
    this.sockets.forEach((socket) => {
      this.sendChain(socket);
    });
  }

  sendChain(socket) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.chain,
        chain: this.blockchain.chain,
      })
    );
  }

  sendAddress(socket) {
    console.log('sending address');
    const ip = P2pServer.socketIp(socket);
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.address,
        address: `ws://${ip}:${P2P_PORT}`,
      })
    );
  }

  sendPeers(socket, peers) {
    console.log('sending peers');
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.peers,
        peers,
      })
    );
  }

  sendTransaction(socket, transaction) {
    socket.send(
      JSON.stringify({
        type: MESSAGE_TYPES.transaction,
        transaction,
      })
    );
  }

  broadcastChain() {
    this.sockets.forEach((socket) => this.sendChain(socket));
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => this.sendTransaction(socket, transaction));
  }

  broadcastClearTransactions() {
    this.sockets.forEach((socket) =>
      socket.send(
        JSON.stringify({
          type: MESSAGE_TYPES.clearTransactions,
        })
      )
    );
  }

  static socketIp(socket) {
    console.log(JSON.stringify(socket._socket.address()));
    let ip = socket._socket.address().address;
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }
    return ip;
  }
}

module.exports = P2pServer;
