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
    const server = new Websocket.Server({ port: P2P_PORT });
    // This onconnection event listener is when a client connects to us
    server.on('connection', (socket, request) => {
      this.connectSocketAsServer(socket, request);

      socket.on('close', () => this.onCloseServerConnection(socket));
    });

    if (this.peers[0] === `ws://${IP_HOST}:5001`) {
      const socket = new Websocket(this.peers[0]);
      //This onOpen envent listener is when we connect to the bootstrapping Server as the client
      socket.on('open', () => this.connectSocketBootstrap(socket));

      socket.on('close', () => {
        //when exiting the bootstrap server, not when closing peer
        console.log('Closing client connection to bootstrap' + socket._url);
        this.peers = this.peers.filter((p) => p !== `ws://${IP_HOST}:5001`);
        this.sockets = this.sockets.filter((s) => s !== socket);
        console.log(this.sockets.length);
      });
    }

    console.log(`Listening for peer connections on port ${P2P_PORT}`);
  }

  connectSocketAsServer(socket, request) {
    let ip = request.socket.remoteAddress;
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }
    //necessary?
    socket.remotePeerServer = {
      address: ip,
      port: 0,
    };

    this.connectSocket(socket);
  }

  connectSocketBootstrap(socket) {
    this.connectSocket(socket);
    this.sendAddress(socket);
  }

  connectToPeers(peers) {
    peers.forEach((peer) => {
      const socket = new Websocket(peer);
      socket.on('open', () => this.connectSocket(socket));
      socket.on('close', () => {
        console.log('closing peer connection');
        this.peers = this.peers.filter((p) => p !== peer);
        this.sockets = this.sockets.filter((s) => s !== socket);
      });
    });
  }

  connectSocket(socket) {
    if (!this.sockets.find((s) => s === socket)) {
      this.sockets.push(socket);
      console.log('Socket connected');
    }

    this.messageHandler(socket);

    this.sendChain(socket);
  }

  onCloseServerConnection(socket) {
    const peerToRemove = `ws://${
      this.sockets[this.sockets.indexOf(socket)].remotePeerServer.address
    }:${this.sockets[this.sockets.indexOf(socket)].remotePeerServer.port}`;

    console.log('Before', this.peers, this.sockets.length);

    this.peers = this.peers.filter((peer) => peer !== peerToRemove);
    this.sockets = this.sockets.filter((s) => s !== socket);

    console.log('after', this.peers, this.sockets.length);
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
          socket.remotePeerServer.port = data.port;
          const fullIp = `ws://${data.address}:${data.port}`;
          if (!this.peers.find((peer) => peer === fullIp)) {
            this.peers.push(fullIp);
          }
          this.sockets.forEach((socket) => this.sendPeers(socket, this.peers));
          break;
        case MESSAGE_TYPES.peers:
          const newPeers = data.peers.filter((peer) => {
            return (
              !this.peers.find((knownPeer) => knownPeer === peer) &&
              peer !== `ws://${IP_PEER}:${P2P_PORT}`
            );
          });

          newPeers.forEach((peer) => this.peers.push(peer));

          this.connectToPeers(newPeers);
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
        address: ip,
        port: P2P_PORT,
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
